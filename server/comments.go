package server

import (
	"encoding/json"
	"net/http"
	"time"
)

func (s *Server) handleComments(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.handleGetComments(w, r)
	case http.MethodPost:
		s.handleCreateComment(w, r)
	case http.MethodPatch:
		s.handleUpdateComment(w, r)
	case http.MethodDelete:
		s.handleDeleteComment(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleGetComments(w http.ResponseWriter, r *http.Request) {
	prototype := r.URL.Query().Get("prototype")
	if prototype == "" {
		http.Error(w, "prototype parameter required", http.StatusBadRequest)
		return
	}
	page := r.URL.Query().Get("page")

	var comments []Comment
	var err error
	if page != "" {
		comments, err = s.readPageComments(prototype, page)
	} else {
		comments, err = s.readAllComments(prototype)
	}
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, err, "failed to read comments")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(CommentsResponse{
		Prototype: prototype,
		Comments:  comments,
	})
}

func (s *Server) handleCreateComment(w http.ResponseWriter, r *http.Request) {
	prototype := r.URL.Query().Get("prototype")
	if prototype == "" {
		http.Error(w, "prototype parameter required", http.StatusBadRequest)
		return
	}

	// If parentId is present, this is a reply to an existing comment
	parentID := r.URL.Query().Get("parentId")
	if parentID != "" {
		s.handleAddReply(w, r, prototype, parentID)
		return
	}

	var comment Comment
	if err := decodeJSON(w, r, &comment); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	id, err := generateUUID()
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, err, "failed to generate comment id")
		return
	}
	comment.ID = id
	comment.CreatedAt = time.Now().Format(time.RFC3339)
	comment.Replies = []Reply{}
	if comment.Author == "" {
		comment.Author = "匿名"
	}

	s.commentMu.Lock()
	defer s.commentMu.Unlock()

	existing, err := s.readPageComments(prototype, comment.PageID)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, err, "failed to read comments")
		return
	}

	existing = append(existing, comment)
	if err := s.writePageComments(prototype, comment.PageID, existing); err != nil {
		writeAPIError(w, http.StatusInternalServerError, err, "failed to save comment")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(comment)
}

func (s *Server) handleAddReply(w http.ResponseWriter, r *http.Request, prototype, parentID string) {
	page := r.URL.Query().Get("page")

	var body struct {
		Content string `json:"content"`
		Author  string `json:"author"`
	}
	if err := decodeJSON(w, r, &body); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	id, err := generateUUID()
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, err, "failed to generate reply id")
		return
	}
	reply := Reply{
		ID:        id,
		Content:   body.Content,
		Author:    body.Author,
		CreatedAt: time.Now().Format(time.RFC3339),
	}
	if reply.Author == "" {
		reply.Author = "匿名"
	}

	s.commentMu.Lock()
	defer s.commentMu.Unlock()

	updated, err := s.findAndAddReply(prototype, parentID, page, reply)
	if err != nil {
		writeAPIError(w, http.StatusNotFound, err, "comment not found")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(updated)
}

func (s *Server) handleUpdateComment(w http.ResponseWriter, r *http.Request) {
	prototype := r.URL.Query().Get("prototype")
	id := r.URL.Query().Get("id")
	if prototype == "" || id == "" {
		http.Error(w, "prototype and id parameters required", http.StatusBadRequest)
		return
	}
	page := r.URL.Query().Get("page")

	var updates struct {
		Content  *string `json:"content"`
		Resolved *bool   `json:"resolved"`
	}
	if err := decodeJSON(w, r, &updates); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	s.commentMu.Lock()
	defer s.commentMu.Unlock()

	updated, err := s.findAndUpdateComment(prototype, id, page, func(c *Comment) {
		if updates.Content != nil {
			c.Content = *updates.Content
		}
		if updates.Resolved != nil {
			c.Resolved = *updates.Resolved
		}
	})
	if err != nil {
		writeAPIError(w, http.StatusNotFound, err, "comment not found")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updated)
}

func (s *Server) handleDeleteComment(w http.ResponseWriter, r *http.Request) {
	prototype := r.URL.Query().Get("prototype")
	id := r.URL.Query().Get("id")
	if prototype == "" || id == "" {
		http.Error(w, "prototype and id parameters required", http.StatusBadRequest)
		return
	}
	page := r.URL.Query().Get("page")

	s.commentMu.Lock()
	defer s.commentMu.Unlock()

	if err := s.findAndRemoveComment(prototype, id, page); err != nil {
		writeAPIError(w, http.StatusNotFound, err, "comment not found")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
