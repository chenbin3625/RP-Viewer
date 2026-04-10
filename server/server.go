package server

import (
	"fmt"
	"net/http"
)

type Server struct {
	prototypeDir string
	port         int
	mux          *http.ServeMux
}

func New(prototypeDir string, port int) *Server {
	s := &Server{
		prototypeDir: prototypeDir,
		port:         port,
		mux:          http.NewServeMux(),
	}
	s.routes()
	return s
}

func (s *Server) routes() {
	s.mux.HandleFunc("/api/browse", s.handleBrowse)
	s.mux.Handle("/prototypes/", http.StripPrefix("/prototypes/", http.FileServer(http.Dir(s.prototypeDir))))
}

func (s *Server) ListenAndServe(addr string) error {
	fmt.Printf("Listening on %s\n", addr)
	return http.ListenAndServe(addr, s.mux)
}

func (s *Server) handleBrowse(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"path":"","breadcrumbs":[],"items":[]}`))
}
