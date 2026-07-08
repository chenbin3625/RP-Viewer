package server

import (
	"crypto/md5"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type Reply struct {
	ID        string `json:"id"`
	Content   string `json:"content"`
	Author    string `json:"author"`
	CreatedAt string `json:"createdAt"`
}

type Comment struct {
	ID        string  `json:"id"`
	PageID    string  `json:"pageId"`
	XPercent  float64 `json:"xPercent"`
	YPercent  float64 `json:"yPercent"`
	ScrollTop float64 `json:"scrollTop"`
	Content   string  `json:"content"`
	Author    string  `json:"author"`
	CreatedAt string  `json:"createdAt"`
	Resolved  bool    `json:"resolved"`
	Replies   []Reply `json:"replies"`
}

type CommentsResponse struct {
	Prototype string    `json:"prototype"`
	Comments  []Comment `json:"comments"`
}

func generateUUID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		// crypto/rand failing is effectively never (e.g. /dev/urandom
		// unavailable); surface it to the caller rather than emitting a
		// deterministic, collision-prone zero UUID.
		return "", err
	}
	b[6] = (b[6] & 0x0f) | 0x40 // version 4
	b[8] = (b[8] & 0x3f) | 0x80 // variant 10
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:]), nil
}

func pageIDToFilename(pageID string) string {
	hash := md5.Sum([]byte(pageID))
	return hex.EncodeToString(hash[:]) + ".json"
}

// commentsDir returns the .comments/ directory path for a prototype, with
// security validation to prevent escaping the prototype root.
func (s *Server) commentsDir(prototypePath string) (string, error) {
	absTarget, err := s.resolveSafePath(prototypePath)
	if err != nil {
		return "", err
	}
	return filepath.Join(absTarget, ".comments"), nil
}

func (s *Server) readPageComments(prototypePath, pageID string) ([]Comment, error) {
	dir, err := s.commentsDir(prototypePath)
	if err != nil {
		return nil, err
	}
	filename := pageIDToFilename(pageID)
	data, err := os.ReadFile(filepath.Join(dir, filename))
	if err != nil {
		if os.IsNotExist(err) {
			return []Comment{}, nil
		}
		return nil, err
	}
	var comments []Comment
	if err := json.Unmarshal(data, &comments); err != nil {
		return nil, err
	}
	return comments, nil
}

func (s *Server) readAllComments(prototypePath string) ([]Comment, error) {
	dir, err := s.commentsDir(prototypePath)
	if err != nil {
		return nil, err
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return []Comment{}, nil
		}
		return nil, err
	}
	var all []Comment
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".json") {
			continue
		}
		data, err := os.ReadFile(filepath.Join(dir, entry.Name()))
		if err != nil {
			continue
		}
		var comments []Comment
		if err := json.Unmarshal(data, &comments); err != nil {
			continue
		}
		all = append(all, comments...)
	}
	return all, nil
}

func (s *Server) writePageComments(prototypePath, pageID string, comments []Comment) error {
	dir, err := s.commentsDir(prototypePath)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	filename := pageIDToFilename(pageID)
	data, err := json.MarshalIndent(comments, "", "  ")
	if err != nil {
		return err
	}
	target := filepath.Join(dir, filename)
	tmp := target + ".tmp"
	if err := os.WriteFile(tmp, data, 0644); err != nil {
		return err
	}
	return os.Rename(tmp, target)
}

// findCommentFile locates the page file containing commentID and returns the
// decoded comments slice together with the index of the match.
//
// When pageID is provided, only that file is read (O(1) fast path) — this is
// the common case since edit/delete/reply always happen on the currently
// viewed page. When pageID is empty, every comment file is scanned as a
// fallback (O(n)).
func (s *Server) findCommentFile(prototypePath, commentID, pageID string) ([]Comment, int, error) {
	dir, err := s.commentsDir(prototypePath)
	if err != nil {
		return nil, -1, err
	}
	var candidates []string
	if pageID != "" {
		candidates = []string{pageIDToFilename(pageID)}
	} else {
		entries, err := os.ReadDir(dir)
		if err != nil {
			return nil, -1, err
		}
		for _, e := range entries {
			if !e.IsDir() && strings.HasSuffix(e.Name(), ".json") {
				candidates = append(candidates, e.Name())
			}
		}
	}
	for _, name := range candidates {
		data, err := os.ReadFile(filepath.Join(dir, name))
		if err != nil {
			continue
		}
		var comments []Comment
		if err := json.Unmarshal(data, &comments); err != nil {
			continue
		}
		for i, c := range comments {
			if c.ID == commentID {
				return comments, i, nil
			}
		}
	}
	return nil, -1, fmt.Errorf("comment not found: %s", commentID)
}

func (s *Server) findAndRemoveComment(prototypePath, commentID, pageID string) error {
	comments, i, err := s.findCommentFile(prototypePath, commentID, pageID)
	if err != nil {
		return err
	}
	pageIDForFile := comments[i].PageID
	comments = append(comments[:i], comments[i+1:]...)
	return s.writePageComments(prototypePath, pageIDForFile, comments)
}

func (s *Server) findAndUpdateComment(prototypePath, commentID, pageID string, updateFn func(*Comment)) (*Comment, error) {
	comments, i, err := s.findCommentFile(prototypePath, commentID, pageID)
	if err != nil {
		return nil, err
	}
	updateFn(&comments[i])
	if err := s.writePageComments(prototypePath, comments[i].PageID, comments); err != nil {
		return nil, err
	}
	return &comments[i], nil
}

func (s *Server) findAndAddReply(prototypePath, commentID, pageID string, reply Reply) (*Comment, error) {
	comments, i, err := s.findCommentFile(prototypePath, commentID, pageID)
	if err != nil {
		return nil, err
	}
	if comments[i].Replies == nil {
		comments[i].Replies = []Reply{}
	}
	comments[i].Replies = append(comments[i].Replies, reply)
	if err := s.writePageComments(prototypePath, comments[i].PageID, comments); err != nil {
		return nil, err
	}
	return &comments[i], nil
}
