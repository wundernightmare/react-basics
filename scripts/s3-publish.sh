#!/usr/bin/env bash
# Publish dist/ to S3 under a per-build, immutable prefix:
#
#   s3://$S3_BUCKET/$S3_PREFIX/<buildId>/...        (this build, immutable)
#   s3://$S3_BUCKET/$S3_PREFIX/latest/...           (optional floating pointer)
#
# Required env: S3_BUCKET. Optional: S3_PREFIX (default "builds"), AWS_REGION,
# DIST_DIR (default "dist"), UPDATE_LATEST ("true" mirrors the build to latest/).
#
# Requires the AWS CLI v2 (preinstalled on GitHub runners; configure creds via
# `aws-actions/configure-aws-credentials` or the usual AWS_* env vars).
set -euo pipefail

: "${S3_BUCKET:?set S3_BUCKET (target bucket name)}"
PREFIX="${S3_PREFIX:-builds}"
DIST="${DIST_DIR:-dist}"
MANIFEST="$DIST/build-manifest.json"

[ -f "$MANIFEST" ] || {
  echo "missing $MANIFEST — run 'pnpm build' first" >&2
  exit 1
}

# Prefer an explicit BUILD_ID from the environment (CI sets the same value used
# at build time, and the publish image may have no node); otherwise read it back
# from the manifest with node.
BUILD_ID="${BUILD_ID:-$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).buildId)' "$MANIFEST")}"
DEST="s3://$S3_BUCKET/$PREFIX/$BUILD_ID"

echo "→ publishing $DIST → $DEST"

# 1) Hashed, immutable assets: cache for a year.
aws s3 sync "$DIST" "$DEST" \
  --no-progress \
  --exclude "*.html" \
  --exclude "build-manifest.json" \
  --cache-control "public, max-age=31536000, immutable"

# 2) Entry point + manifest: always revalidate.
aws s3 sync "$DIST" "$DEST" \
  --no-progress \
  --exclude "*" \
  --include "*.html" \
  --include "build-manifest.json" \
  --cache-control "no-cache"

if [ "${UPDATE_LATEST:-false}" = "true" ]; then
  echo "→ mirroring build to $PREFIX/latest"
  aws s3 sync "$DEST" "s3://$S3_BUCKET/$PREFIX/latest" --no-progress --delete
fi

echo "✔ published build $BUILD_ID"
