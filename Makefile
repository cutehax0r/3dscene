.PHONY: help server dev stop clean build publish release deploy rollback health

BINARY_NAME := 3dscene
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
PORT ?= 8000

.DEFAULT_GOAL := help

help:
	@echo "Makefile targets for $(BINARY_NAME):"
	@echo ""
	@echo "Build targets:"
	@echo "  make release                  Tag a release and push to github"
	@echo "  make deploy                   Push a copy to local podman"
	@echo "  make deploy-github            Push a copy to github pages"
	@echo ""
	@echo "Development targets:"
	@echo "  make build                    Build for docker"
	@echo "  make dev [PORT=8000]          Run a local HTTP server at http://localhost:PORT"
	@echo "  make server                   Alias for 'make dev'"

dev:
	@echo "Serving on http://localhost:$(PORT)"
	@python3 -m http.server $(PORT) --bind 127.0.0.1

server: dev
