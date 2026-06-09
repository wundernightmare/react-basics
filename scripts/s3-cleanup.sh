#!/usr/bin/env bash
# Prune old build prefixes under s3://$S3_BUCKET/$S3_PREFIX/, keeping the most
# recent $KEEP (ranked by each build's build-manifest.json LastModified). The
# floating "latest/" pointer is never deleted.
#
# Required env: S3_BUCKET. Optional: S3_PREFIX (default "builds"),
# KEEP (default 10), DRY_RUN ("true" → list deletions only).
#
# Requires AWS CLI v2.
set -euo pipefail

: "${S3_BUCKET:?set S3_BUCKET (target bucket name)}"
PREFIX="${S3_PREFIX:-builds}"
KEEP="${KEEP:-10}"
DRY_RUN="${DRY_RUN:-false}"

# Every build is identified by its manifest. Sort manifests newest-first; the
# build "prefix" is the key with `/build-manifest.json` stripped off.
mapfile -t MANIFESTS < <(
  aws s3api list-objects-v2 \
    --bucket "$S3_BUCKET" \
    --prefix "$PREFIX/" \
    --query "reverse(sort_by(Contents[?ends_with(Key, '/build-manifest.json')], &LastModified))[].Key" \
    --output text | tr '\t' '\n' | sed '/^$/d'
)

total=${#MANIFESTS[@]}
echo "found $total build(s) under s3://$S3_BUCKET/$PREFIX/ — keeping newest $KEEP"

if [ "$total" -le "$KEEP" ]; then
  echo "nothing to prune"
  exit 0
fi

pruned=0
for key in "${MANIFESTS[@]:$KEEP}"; do
  build_prefix="${key%/build-manifest.json}"
  # Never touch the floating pointer.
  case "$build_prefix" in
    */latest) continue ;;
  esac

  target="s3://$S3_BUCKET/$build_prefix/"
  if [ "$DRY_RUN" = "true" ]; then
    echo "[dry-run] would delete $target"
  else
    echo "deleting $target"
    aws s3 rm "$target" --recursive --no-progress
  fi
  pruned=$((pruned + 1))
done

echo "✔ cleanup done (${pruned} build(s) $([ "$DRY_RUN" = "true" ] && echo 'would be ' )pruned)"
