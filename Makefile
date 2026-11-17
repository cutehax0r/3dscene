.PHONY: help health server dev build clean release unrelease
# Config
# CONTAINER_REGISTRY, PODMAN_SERVER, and DOMAIN come from the macos keychain.
# Make sure they are setup
#   security add-generic-password -a "username" -s "https://podman.example.com" -w "your-password-here" -l "ENV: Podman server" -c "podman.example.com"
#   security add-generic-password -a "username" -s "https://registry.example.com" -w "your-password-here" -l "ENV: Private container registry"

# Planned, in the order we intend to write them (not defined yet):
#   image         build nginx from dist/
#   run, stop     run/stop docker container
#   unpublish     remove an item from the registry (see also unrelease)
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
KEEP ?= 5
TIMESTAMP := $(shell date +%Y%m%d_%H%M%S)
# regular = so this only runs when we need it
REGISTRY = $(shell security find-generic-password -l "ENV: Private container registry" 2>/dev/null | awk '/"svce"<blob>/ { val=$$0; sub(/.*=/,"",val); gsub(/"/,"",val); print val }')

ifneq ($(filter release unrelease,$(firstword $(MAKECMDGOALS))),)
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
	@echo "  make release v1.2.3 [COMMIT] [DRY=1]  Tag a commit (default: HEAD) and let GitHub build the release"
	@echo "  make unrelease v1.2.3 [DRY=1]         Remove a GitHub release"
	@echo "  make deploy                           Push to local podman"
	@echo "  make deploy-github                    Push to github pages"
	@echo ""
	@echo "Development targets:"
	@echo "  make health                        Check that the tools this project needs are installed"
	@echo "  make dev [PORT=8000]               Run HTTP server and open browser"
	@echo "  make server [PORT=8000]            Run HTTP server at http://localhost:PORT"
	@echo "  make build [SOURCEMAP=linked]      Bundle and minify the site into $(DIST)/"
	@echo "  make clean                         Remove build output ($(DIST)/)"
	@echo "  make image                         Build container from $(DIST)/"
	@echo "  make publish                       Build container and push it to the registry"
	@echo "  make published                     List container tags in the registry"
	@echo "  make clean-tags [KEEP=5]           Remove old container image tags"

health:
	@echo "Checking health..."
	@command -v python3 > /dev/null || (echo "python3: missing" && exit 1)
	@echo "python3: OK"
	@command -v bun > /dev/null || (echo "bun: missing" && exit 1)
	@echo "bun: OK"
	@command -v gh > /dev/null || (echo "gh: missing (https://cli.github.com)" && exit 1)
	@gh auth status > /dev/null 2>&1 || (echo "gh: not logged in (gh auth login)" && exit 1)
	@echo "gh: OK"
	@command -v podman > /dev/null || (echo "podman: not installed" && exit 1)
	@podman info > /dev/null 2>&1 || (echo "podman: not running (podman machine start)" && exit 1)
	@echo "podman: OK"
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

image: build
	podman build -t $(BINARY_NAME):$(TIMESTAMP) -t $(BINARY_NAME):latest .

publish: image
	@[ -n "$(REGISTRY)" ] || { echo "Error: registry not in keychain"; exit 1; }
	podman tag $(BINARY_NAME):$(TIMESTAMP) $(REGISTRY)/$(BINARY_NAME):$(TIMESTAMP)
	podman tag $(BINARY_NAME):latest $(REGISTRY)/$(BINARY_NAME):latest
	podman push $(REGISTRY)/$(BINARY_NAME):$(TIMESTAMP)
	podman push $(REGISTRY)/$(BINARY_NAME):latest

published:
	@[ -n "$(REGISTRY)" ] || { echo "Error: registry not in keychain"; exit 1; }
	@USER=$$(security find-generic-password -l "ENV: Private container registry" | awk '/"acct"<blob>/ { val=$$0; sub(/.*=/,"",val); gsub(/"/,"",val); print val }'); \
	PASS=$$(security find-generic-password -l "ENV: Private container registry" -w); \
	OUT=$$(echo "user = \"$$USER:$$PASS\"" | curl -sf -K - https://$(REGISTRY)/v2/$(BINARY_NAME)/tags/list) || { echo "Nothing published yet, or the registry is unreachable"; exit 1; }; \
	echo "$$OUT" | jq -r '.tags | sort | reverse | .[]'

clean-tags:
	@podman images localhost/$(BINARY_NAME) --format '{{.Tag}}' | grep -v '^latest$$' | sort -r | tail -n +$$(( $(KEEP) + 1 )) | while read tag; do podman rmi $(BINARY_NAME):$$tag; done

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

unrelease:
	@set -e; \
	TAG="$(REL_TAG)"; \
	if [ -z "$$TAG" ] || [ -n "$(REL_COMMIT)$(REL_EXTRA)" ]; then echo "Usage: make unrelease v1.2.3 [DRY=1]"; exit 1; fi; \
	if ! echo "$$TAG" | grep -qE '^v[0-9]+\.[0-9]+\.[0-9]+$$'; then echo "Error: tag format v1.2.3"; exit 1; fi; \
	command -v gh > /dev/null || { echo "Error: gh not installed"; exit 1; }; \
	gh auth status > /dev/null 2>&1 || { echo "Error: gh not authorized (run: gh auth login)"; exit 1; }; \
	HAS_RELEASE=""; HAS_REMOTE=""; HAS_LOCAL=""; \
	if gh release view "$$TAG" > /dev/null 2>&1; then HAS_RELEASE=1; fi; \
	if [ -n "$$(git ls-remote --tags origin "refs/tags/$$TAG")" ]; then HAS_REMOTE=1; fi; \
	if git rev-parse -q --verify "refs/tags/$$TAG" > /dev/null; then HAS_LOCAL=1; fi; \
	if [ -z "$$HAS_RELEASE$$HAS_REMOTE$$HAS_LOCAL" ]; then echo "Error: nothing to remove, $$TAG has no release or tag"; exit 1; fi; \
	echo "This will remove, for $$TAG:"; \
	if [ -n "$$HAS_RELEASE" ]; then echo "  GitHub release: $$(gh release view "$$TAG" --json url -q .url)"; fi; \
	if [ -n "$$HAS_REMOTE" ]; then echo "  tag on origin"; fi; \
	if [ -n "$$HAS_LOCAL" ]; then echo "  local tag"; fi; \
	if [ -n "$(DRY)" ]; then echo "DRY RUN: nothing changed"; exit 0; fi; \
	if [ -n "$$HAS_RELEASE" ]; then gh release delete "$$TAG" --cleanup-tag --yes; fi; \
	if [ -n "$$(git ls-remote --tags origin "refs/tags/$$TAG")" ]; then git push --quiet origin --delete "refs/tags/$$TAG"; fi; \
	if git rev-parse -q --verify "refs/tags/$$TAG" > /dev/null; then git tag -d "$$TAG" > /dev/null; fi; \
	echo "Unreleased $$TAG"
