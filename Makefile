.PHONY: dev build clean

# Development: start Go backend + Vite dev server
dev:
	@echo "Starting Go backend (dev mode)..."
	@cd web && npm ci --silent
	@(cd web && npm run dev &)
	@sleep 2
	@go run main.go -dev

# Production build
build:
	cd web && npm ci && npm run build
	go build -ldflags="-s -w" -o proto-viewer .

# Clean build artifacts
clean:
	rm -f proto-viewer
	rm -rf web/dist web/node_modules
