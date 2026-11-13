.PHONY: help server dev clean build publish release deploy rollback health
# movie (start/end/w/h/fps/hdr)
# picture (w/h/hdr)

BINARY_NAME := 3dscene
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
PORT ?= 8000
DIST := dist
SOURCEMAP ?= none

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
	@echo "  make health                   Check that the tools this project needs are installed"
	@echo "  make dev [PORT=8000]          Run the HTTP server and open the browser"
	@echo "  make server [PORT=8000]       Run the HTTP server at http://localhost:PORT"
	@echo "  make build [SOURCEMAP=linked] Bundle and minify the site into $(DIST)/"
	@echo "  make clean                    Remove build output ($(DIST)/)"

health:
	@echo "Checking health..."
	@command -v python3 > /dev/null || (echo "python3: missing" && exit 1)
	@echo "python3: OK"
	@command -v bun > /dev/null || (echo "bun: missing" && exit 1)
	@echo "bun: OK"
	@echo "Health check passed"

server:
	@echo "Serving on http://localhost:$(PORT)"
	@python3 -m http.server $(PORT) --bind 127.0.0.1

dev:
	@(sleep 1; open http://localhost:$(PORT)) &
	@$(MAKE) server

clean:
	rm -rf $(DIST)

build: clean
	bun build index.html --outdir $(DIST) --minify --sourcemap=$(SOURCEMAP)
	@sed '/<script type="importmap">/,/<\/script>/d' $(DIST)/index.html > $(DIST)/index.html.tmp
	@mv $(DIST)/index.html.tmp $(DIST)/index.html
	@echo "Built $(DIST)/:"
	@ls -lh $(DIST) | tail -n +2

