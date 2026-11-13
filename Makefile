.PHONY: help server build deploy release help

BINARY_NAME := 3dscene
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")

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
	@echo "  make server                   Run a local HTTP server"
