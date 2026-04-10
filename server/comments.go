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
		http.Error(w, err.Error(), http.StatusInternalServerError)
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

	var comment Comment
	if err := json.NewDecoder(r.Body).Decode(&comment); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	comment.ID = generateUUID()
	comment.CreatedAt = time.Now().Format(time.RFC3339)
	if comment.Author == "" {
		comment.Author = "匿名"
	}

	s.commentMu.Lock()
	defer s.commentMu.Unlock()

	existing, err := s.readPageComments(prototype, comment.PageID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	existing = append(existing, comment)
	if err := s.writePageComments(prototype, comment.PageID, existing); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(comment)
}

func (s *Server) handleUpdateComment(w http.ResponseWriter, r *http.Request) {
	prototype := r.URL.Query().Get("prototype")
	id := r.URL.Query().Get("id")
	if prototype == "" || id == "" {
		http.Error(w, "prototype and id parameters required", http.StatusBadRequest)
		return
	}

	var updates struct {
		Content  *string `json:"content"`
		Resolved *bool   `json:"resolved"`
	}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	s.commentMu.Lock()
	defer s.commentMu.Unlock()

	updated, err := s.findAndUpdateComment(prototype, id, func(c *Comment) {
		if updates.Content != nil {
			c.Content = *updates.Content
		}
		if updates.Resolved != nil {
			c.Resolved = *updates.Resolved
		}
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
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

	s.commentMu.Lock()
	defer s.commentMu.Unlock()

	if err := s.findAndRemoveComment(prototype, id); err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
