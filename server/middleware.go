package server

import (
	"compress/gzip"
	"io"
	"net/http"
	"strings"
	"sync"
)

// gzipPool reuses gzip writers across requests to avoid allocations.
var gzipPool = sync.Pool{
	New: func() any {
		w, _ := gzip.NewWriterLevel(io.Discard, gzip.DefaultCompression)
		return w
	},
}

// gzipResponseWriter buffers the response through a gzip writer when the
// content type is worth compressing. It deliberately leaves non-compressible
// responses (images, fonts, archives, range requests, pre-encoded responses)
// untouched and preserves their Content-Length.
type gzipResponseWriter struct {
	http.ResponseWriter
	gz            *gzip.Writer
	headerWritten bool
	gzipped       bool
}

func (g *gzipResponseWriter) WriteHeader(code int) {
	if g.headerWritten {
		return
	}
	g.headerWritten = true
	h := g.ResponseWriter.Header()
	if h.Get("Content-Encoding") == "" && shouldGzip(h.Get("Content-Type")) {
		h.Del("Content-Length")
		h.Set("Content-Encoding", "gzip")
		h.Add("Vary", "Accept-Encoding")
		g.gzipped = true
	}
	g.ResponseWriter.WriteHeader(code)
}

func (g *gzipResponseWriter) Write(b []byte) (int, error) {
	if !g.headerWritten {
		h := g.ResponseWriter.Header()
		if h.Get("Content-Type") == "" {
			// Let the standard library sniff the type from the first chunk.
			h.Set("Content-Type", http.DetectContentType(b))
		}
		g.WriteHeader(http.StatusOK)
	}
	if g.gzipped {
		return g.gz.Write(b)
	}
	return g.ResponseWriter.Write(b)
}

// Flush supports handlers/flushers (e.g. reverse proxy) that flush mid-stream.
func (g *gzipResponseWriter) Flush() {
	if g.gzipped {
		g.gz.Flush()
	}
	if fl, ok := g.ResponseWriter.(http.Flusher); ok {
		fl.Flush()
	}
}

func gzipMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip when the client doesn't want gzip, asks for a byte range, or the
		// response is already encoded (e.g. Vite dev proxy).
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") ||
			r.Header.Get("Range") != "" {
			next.ServeHTTP(w, r)
			return
		}
		gz := gzipPool.Get().(*gzip.Writer)
		gz.Reset(w)
		grw := &gzipResponseWriter{ResponseWriter: w, gz: gz}
		next.ServeHTTP(grw, r)
		if grw.gzipped {
			// Flush the gzip footer so the client receives a complete stream.
			gz.Flush()
			gz.Close()
		}
		gzipPool.Put(gz)
	})
}

// shouldGzip reports whether a response with the given Content-Type is worth
// gzip-compressing. Already-compressed binary formats (images, fonts, archives)
// are skipped to avoid wasted CPU and potential size growth.
func shouldGzip(contentType string) bool {
	ct := strings.ToLower(strings.TrimSpace(strings.SplitN(contentType, ";", 2)[0]))
	switch ct {
	case "text/html", "text/css", "text/plain", "text/xml",
		"application/javascript", "application/json", "application/xml",
		"application/xhtml+xml", "image/svg+xml":
		return true
	}
	return strings.HasPrefix(ct, "text/")
}

// cacheMiddleware sets Cache-Control headers based on the request path:
//   - hashed Vite assets under /assets/ are immutable and cached for a year
//   - index.html (and the SPA root) are revalidated every time
//   - API responses are never cached
func cacheMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case strings.HasPrefix(r.URL.Path, "/assets/"):
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		case r.URL.Path == "/" || r.URL.Path == "/index.html":
			w.Header().Set("Cache-Control", "no-cache")
		case strings.HasPrefix(r.URL.Path, "/api/"), r.URL.Path == "/healthz":
			w.Header().Set("Cache-Control", "no-store")
		}
		next.ServeHTTP(w, r)
	})
}
