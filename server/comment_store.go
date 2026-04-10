package server

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

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
}

type CommentsResponse struct {
	Prototype string    `json:"prototype"`
	Comments  []Comment `json:"comments"`
}

func generateUUID() string {
	b := make([]byte, 16)
	rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

func pageIDToFilename(pageID string) string {
	// Percent-encode chars that are problematic in filenames
	name := strings.ReplaceAll(pageID, "%", "%25") // must be first
	name = strings.ReplaceAll(name, "/", "%2F")
	name = strings.ReplaceAll(name, "#", "%23")
	name = strings.ReplaceAll(name, "?", "%3F")
	name = strings.ReplaceAll(name, "=", "%3D")
	name = strings.ReplaceAll(name, "&", "%26")
	return "_" + name + ".json"
}

func filenameToPageID(filename string) string {
	// Strip prefix "_" and suffix ".json"
	name := strings.TrimPrefix(filename, "_")
	name = strings.TrimSuffix(name, ".json")
	name = strings.ReplaceAll(name, "%26", "&")
	name = strings.ReplaceAll(name, "%3D", "=")
	name = strings.ReplaceAll(name, "%3F", "?")
	name = strings.ReplaceAll(name, "%23", "#")
	name = strings.ReplaceAll(name, "%2F", "/")
	name = strings.ReplaceAll(name, "%25", "%") // must be last
	return name
}

// commentsDir returns the .comments/ directory path for a prototype, with security validation
func (s *Server) commentsDir(prototypePath string) (string, error) {
	absDir := filepath.Join(s.prototypeDir, filepath.Clean(prototypePath))
	absProtoDir, _ := filepath.Abs(s.prototypeDir)
	absTarget, _ := filepath.Abs(absDir)
	if !strings.HasPrefix(absTarget, absProtoDir) {
		return "", os.ErrPermission
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

func (s *Server) findAndRemoveComment(prototypePath, commentID string) error {
	dir, err := s.commentsDir(prototypePath)
	if err != nil {
		return err
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".json") {
			continue
		}
		filePath := filepath.Join(dir, entry.Name())
		data, err := os.ReadFile(filePath)
		if err != nil {
			continue
		}
		var comments []Comment
		if err := json.Unmarshal(data, &comments); err != nil {
			continue
		}
		for i, c := range comments {
			if c.ID == commentID {
				comments = append(comments[:i], comments[i+1:]...)
				pageID := filenameToPageID(entry.Name())
				return s.writePageComments(prototypePath, pageID, comments)
			}
		}
	}
	return fmt.Errorf("comment not found: %s", commentID)
}

func (s *Server) findAndUpdateComment(prototypePath, commentID string, updateFn func(*Comment)) (*Comment, error) {
	dir, err := s.commentsDir(prototypePath)
	if err != nil {
		return nil, err
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".json") {
			continue
		}
		filePath := filepath.Join(dir, entry.Name())
		data, err := os.ReadFile(filePath)
		if err != nil {
			continue
		}
		var comments []Comment
		if err := json.Unmarshal(data, &comments); err != nil {
			continue
		}
		for i, c := range comments {
			if c.ID == commentID {
				updateFn(&comments[i])
				pageID := filenameToPageID(entry.Name())
				if err := s.writePageComments(prototypePath, pageID, comments); err != nil {
					return nil, err
				}
				return &comments[i], nil
			}
		}
	}
	return nil, fmt.Errorf("comment not found: %s", commentID)
}

// Use time.Now for createdAt
var _ = time.Now
