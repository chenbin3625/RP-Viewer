package server

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
)

// maxCommentBody caps the size of an inbound comment/reply JSON body to
// protect against unbounded request bodies.
const maxCommentBody = 1 << 20 // 1 MB

// decodeJSON reads a JSON request body (capped at maxCommentBody) into v.
func decodeJSON(w http.ResponseWriter, r *http.Request, v any) error {
	r.Body = http.MaxBytesReader(w, r.Body, maxCommentBody)
	return json.NewDecoder(r.Body).Decode(v)
}

// writeAPIError logs the internal error (if any) and returns a generic message
// to the client so internal details (e.g. file paths from os errors) are not
// leaked in the response body.
func writeAPIError(w http.ResponseWriter, code int, err error, publicMsg string) {
	if err != nil {
		log.Printf("[api] %s: %v", publicMsg, err)
	}
	http.Error(w, publicMsg, code)
}

func (s *Server) handleBrowse(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")

	resp, err := s.scan(path)
	if err != nil {
		switch {
		case errors.Is(err, os.ErrPermission):
			writeAPIError(w, http.StatusForbidden, err, "access denied")
		case os.IsNotExist(err):
			writeAPIError(w, http.StatusNotFound, err, "path not found")
		default:
			writeAPIError(w, http.StatusBadRequest, err, "failed to browse path")
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
