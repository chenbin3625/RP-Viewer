package server

import (
	"embed"
	"io/fs"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"sync"
	"time"
)

type Server struct {
	prototypeDir string
	port         int
	mux          *http.ServeMux
	webAssets    embed.FS
	devMode      bool
	commentMu    sync.Mutex
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
	s.mux.HandleFunc("/api/comments", s.handleComments)
	s.mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	s.mux.HandleFunc("/prototypes/", s.handlePrototypeFile)

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

// handlePrototypeFile serves prototype files but blocks access to .comments
// directories (where comment JSON is stored) to prevent data disclosure.
// The browse API already hides dot-prefixed folders, but the raw FileServer
// does not, so an explicit guard is required here.
func (s *Server) handlePrototypeFile(w http.ResponseWriter, r *http.Request) {
	if strings.Contains(r.URL.Path, "/.comments") {
		http.NotFound(w, r)
		return
	}
	http.StripPrefix("/prototypes/", http.FileServer(http.Dir(s.prototypeDir))).ServeHTTP(w, r)
}

func (s *Server) ListenAndServe(addr string) error {
	srv := &http.Server{
		Addr:              addr,
		Handler:           gzipMiddleware(cacheMiddleware(s.mux)),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
	}
	return srv.ListenAndServe()
}
