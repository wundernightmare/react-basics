# syntax=docker/dockerfile:1

# ── Stage 1: build the static bundle ──────────────────────────────────────────
FROM node:24-slim AS builder
WORKDIR /app
ENV CI=true

# Build metadata, threaded into the manifest (the builder image has no .git).
ARG BUILD_ID
ARG GIT_COMMIT
ARG GIT_BRANCH
ENV BUILD_ID=${BUILD_ID} GIT_COMMIT=${GIT_COMMIT} GIT_BRANCH=${GIT_BRANCH}

# Corepack pins pnpm to the version in package.json#packageManager.
RUN corepack enable

# Install deps first (cached until the lockfile changes).
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Build → dist/ (+ dist/build-manifest.json via the postbuild manifest step).
COPY . .
RUN pnpm build

# ── Stage 2: serve with nginx (unprivileged, non-root) ────────────────────────
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

# Replace the default server block with our SPA-aware config + header snippet.
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# The unprivileged image already runs as uid 101 and listens on 8080.
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null 2>&1 || exit 1

# CMD (`nginx -g 'daemon off;'`) is inherited from the base image.
