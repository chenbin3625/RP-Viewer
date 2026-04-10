package server

import (
	"encoding/json"
	"net/http"
)

func (s *Server) handleBrowse(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")

	resp, err := s.scan(path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
