package server

import (
	"embed"
	"io/fs"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

type Server struct {
	prototypeDir string
	port         int
	mux          *http.ServeMux
	webAssets    embed.FS
	devMode      bool
}

func New(prototypeDir string, port int, webAssets embed.FS, devMode bool) *Server {
	s := &Server{
		prototypeDir: prototypeDir,
		port:         port,
		mux:          http.NewServeMux(),
		webAssets:    webAssets,
		devMode:      devMode,
	}
	s.routes()
	return s
}

func (s *Server) routes() {
	s.mux.HandleFunc("/api/browse", s.handleBrowse)
	s.mux.Handle("/prototypes/", http.StripPrefix("/prototypes/", http.FileServer(http.Dir(s.prototypeDir))))

	if s.devMode {
		// Proxy all other requests to Vite dev server
		viteURL, _ := url.Parse("http://localhost:5173")
		proxy := httputil.NewSingleHostReverseProxy(viteURL)
		s.mux.Handle("/", proxy)
	} else {
		// Serve embedded SPA
		distFS, err := fs.Sub(s.webAssets, "web/dist")
		if err != nil {
			panic("failed to get embedded web/dist: " + err.Error())
		}
		fileServer := http.FileServer(http.FS(distFS))
		s.mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			// Try to serve the file directly
			path := strings.TrimPrefix(r.URL.Path, "/")
			if path == "" {
				path = "index.html"
			}
			if _, err := fs.Stat(distFS, path); err == nil {
				fileServer.ServeHTTP(w, r)
				return
			}
			// SPA fallback: serve index.html for client-side routing
			r.URL.Path = "/"
			fileServer.ServeHTTP(w, r)
		})
	}
}

func (s *Server) ListenAndServe(addr string) error {
	return http.ListenAndServe(addr, s.mux)
}
