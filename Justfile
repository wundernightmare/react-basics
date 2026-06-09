# frontend-basics — task runner
# Install just: https://just.systems/man/en/packages.html
# Usage:   just <recipe>   |   just --list

set shell := ["bash", "-uc"]

IMAGE := "frontend-basics"
TAG   := "local"

# Build metadata, resolved once at parse time and threaded into image + manifest.
version := `node -pe "require('./package.json').version"`
commit  := `git rev-parse HEAD 2>/dev/null || echo unknown`
short   := `git rev-parse --short=8 HEAD 2>/dev/null || echo local`
branch  := `git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown`

# List available recipes
default:
    @just --list --unsorted

# ── Workspace ─────────────────────────────────────────────────────────────────

# Install dependencies
install:
    pnpm install

# Typecheck + lint + format
check:
    pnpm check

# Run unit tests
test:
    pnpm test:run

# Production build (+ build-manifest.json)
build:
    pnpm build

# Regenerate the build manifest from an existing dist/
manifest:
    pnpm manifest

# ── Container ─────────────────────────────────────────────────────────────────

# Build the nginx serving image as {{IMAGE}}:{{TAG}}
docker-build:
    docker build \
      --build-arg BUILD_ID="{{version}}-{{short}}" \
      --build-arg GIT_COMMIT="{{commit}}" \
      --build-arg GIT_BRANCH="{{branch}}" \
      -t {{IMAGE}}:{{TAG}} .

# Build then run the image on http://localhost:8080
docker-run: docker-build
    docker run --rm -p 8080:8080 {{IMAGE}}:{{TAG}}

# ── S3 (optional) ─────────────────────────────────────────────────────────────

# Publish dist/ to S3 (needs S3_BUCKET; UPDATE_LATEST=true mirrors to latest/)
s3-publish:
    ./scripts/s3-publish.sh

# Prune old S3 builds, keeping newest KEEP (needs S3_BUCKET; DRY_RUN=true to preview)
s3-cleanup:
    ./scripts/s3-cleanup.sh
