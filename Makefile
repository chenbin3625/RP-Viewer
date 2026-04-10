.PHONY: dev build clean

# Development: start Go backend + Vite dev server
dev:
	@echo "Starting Go backend (dev mode)..."
	@cd web && npm install --silent
	@(cd web && npm run dev &)
	@sleep 2
	@go run main.go -dev

# Production build
build:
	cd web && npm install && npm run build
	go build -o proto-viewer .

# Clean build artifacts
clean:
	rm -f proto-viewer
	rm -rf web/dist web/node_modules
