# Stage 1: Build frontend
FROM node:22-alpine AS frontend
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# Stage 2: Build Go binary
FROM golang:1.26-alpine AS backend
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=frontend /app/web/dist ./web/dist
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o proto-viewer .

# Stage 3: Minimal runtime
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata && \
    addgroup -S app && adduser -S -G app app
WORKDIR /app
COPY --from=backend /app/proto-viewer .
RUN mkdir -p /data/prototypes && chown -R app:app /app /data

USER app

ENV PROTOTYPE_DIR=/data/prototypes
ENV PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/healthz || exit 1

ENTRYPOINT ["./proto-viewer"]
