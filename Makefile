.PHONY: help health server dev build clean release

# Planned, in the order we intend to write them (not defined yet):
#   image         build nginx from dist/
#   run, stop     run/stop docker container
#   unrelease     purge a tag/release/etc from github
#   clean-tags    prune old image tags
#   publish       push container to registry
#   unpublish     remove an item from the registry (see also unrelease)
#   published     list published container tags
#   deploy        publish && make live on macmini
#   rollback      roll back to the previous live image
#   deploy-github build a github pages release
#   movie         given start/end/width/height/fps/hdr/format - export a movie (h265/prores)
#   picture       given width/height/fps/time/hdr/format - export an image (png/hdr png?)

.PHONY: image run stop publish published deploy rollback deploy-github clean-tags

BINARY_NAME := 3dscene
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
PORT ?= 8000
DIST := dist
SOURCEMAP ?= none

# `make release v1.2.3 [COMMIT]` takes positional arguments. They only become do-nothing targets
# while `release` is the first goal, so a typo such as `make relase` still fails normally.
ifeq ($(firstword $(MAKECMDGOALS)),release)
REL_TAG := $(word 2,$(MAKECMDGOALS))
REL_COMMIT := $(word 3,$(MAKECMDGOALS))
REL_EXTRA := $(wordlist 4,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
REL_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
ifneq ($(strip $(REL_ARGS)),)
$(REL_ARGS):
	@:
endif
endif

.DEFAULT_GOAL := help

help:
	@echo "Makefile targets for $(BINARY_NAME):"
	@echo ""
	@echo "Build targets:"
	@echo "  make release v1.2.3 [COMMIT] [DRY=1]  Tag a commit (default HEAD) and let GitHub build the release"
	@echo "  make deploy                           Push to local podman"
	@echo "  make deploy-github                    Push to github pages"
	@echo ""
	@echo "Development targets:"
	@echo "  make health                        Check that the tools this project needs are installed"
	@echo "  make dev [PORT=8000]               Run HTTP server and open browser"
	@echo "  make server [PORT=8000]            Run HTTP server at http://localhost:PORT"
	@echo "  make build [SOURCEMAP=linked]      Bundle and minify the site into $(DIST)/"
	@echo "  make clean                         Remove build output ($(DIST)/)"

health:
	@echo "Checking health..."
	@command -v python3 > /dev/null || (echo "python3: missing" && exit 1)
	@echo "python3: OK"
	@command -v bun > /dev/null || (echo "bun: missing" && exit 1)
	@echo "bun: OK"
	@command -v gh > /dev/null || (echo "gh: missing (https://cli.github.com)" && exit 1)
	@gh auth status > /dev/null 2>&1 || (echo "gh: not logged in (run: gh auth login)" && exit 1)
	@echo "gh: OK"
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

release:
	@set -e; \
	TAG="$(REL_TAG)"; REF="$(or $(REL_COMMIT),HEAD)"; WF=release.yml; \
	if [ -z "$$TAG" ] || [ -n "$(REL_EXTRA)" ]; then echo "Usage: make release v1.2.3 [COMMIT] [DRY=1]"; exit 1; fi; \
	if ! echo "$$TAG" | grep -qE '^v[0-9]+\.[0-9]+\.[0-9]+$$'; then echo "Error: tag format v1.2.3"; exit 1; fi; \
	command -v gh > /dev/null || { echo "Error: gh not installed"; exit 1; }; \
	gh auth status > /dev/null 2>&1 || { echo "Error: gh not authorized (run: gh auth login)"; exit 1; }; \
	SHA=$$(git rev-parse --verify --quiet "$$REF^{commit}") || { echo "Error: commit does not exist"; exit 1; }; \
	SHORT=$$(git rev-parse --short "$$SHA"); \
	git cat-file -e "$$SHA:.github/workflows/$$WF" 2> /dev/null || { echo "Error: .github/workflows/$$WF not in $$SHORT. no release will be built"; exit 1; }; \
	git fetch --quiet origin; \
	if git rev-parse -q --verify "refs/tags/$$TAG" > /dev/null; then echo "Error: tag $$TAG exists locally"; exit 1; fi; \
	if [ -n "$$(git ls-remote --tags origin "refs/tags/$$TAG")" ]; then echo "Error: tag $$TAG exists on origin"; exit 1; fi; \
	if [ -z "$$(git branch -r --contains "$$SHA")" ]; then echo "Error: origin does not have $$SHORT (push it)"; exit 1; fi; \
	echo "Release $$TAG from $$SHORT: $$(git log -1 --format=%s "$$SHA")"; \
	if [ -n "$$(git status --porcelain)" ]; then echo "Warning: uncommitted changes are not in the release"; fi; \
	if [ -n "$(DRY)" ]; then \
		echo "DRY RUN: checks passed. Plan:"; \
		echo "  git tag $$TAG $$SHORT"; \
		echo "  git push origin $$TAG"; \
		echo "  poll $$WF github workflow and confirm release"; \
		exit 0; \
	fi; \
	git tag "$$TAG" "$$SHA"; \
	git push --quiet origin "refs/tags/$$TAG" || { git tag -d "$$TAG" > /dev/null; echo "Error: push failed, tag removed"; exit 1; }; \
	echo "Pushed $$TAG, waiting for the workflow run to start"; \
	RUN=""; i=0; \
	while [ -z "$$RUN" ] && [ $$i -lt 30 ]; do \
		RUN=$$(gh run list --workflow "$$WF" --branch "$$TAG" --limit 1 --json databaseId -q '.[] | .databaseId' 2> /dev/null || true); \
		if [ -z "$$RUN" ]; then sleep 2; i=$$((i + 1)); fi; \
	done; \
	if [ -z "$$RUN" ]; then echo "Error: The tag $$TAG is pushed but workflow run didn't start in 60s. Check the Actions tab on GitHub and make unrelease $$TAG"; exit 1; fi; \
	if gh run watch "$$RUN" --compact --exit-status; then \
		echo ""; echo "Released $$TAG: $$(gh release view "$$TAG" --json url -q .url)"; \
	else \
		echo ""; echo "Error: release workflow failed: $$(gh run view "$$RUN" --json url -q .url)"; \
		echo "Fix: make unrelease $$TAG then try again"; exit 1; \
	fi
