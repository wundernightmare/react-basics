#!/usr/bin/env node
// Writes `dist/build-manifest.json` describing the build: identity (version +
// build id + git), provenance (CI metadata), and every emitted file with its
// size, sha256, and content-type. Consumed by the S3 publish/cleanup scripts
// and useful for ops introspection — the file is also served by the container
// at `/build-manifest.json`.
//
// Resolution order for git/build metadata: explicit env (passed as Docker
// build-args or by CI) → CI-provided vars → local `git` → "unknown". This keeps
// it working inside a minimal builder image that has no `.git` directory.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const distDir = join(root, "dist");
const MANIFEST_NAME = "build-manifest.json";

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm",
};

function git(args) {
  try {
    return execFileSync("git", args, { cwd: root, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, acc);
    else acc.push(abs);
  }
  return acc;
}

let pkg = {};
try {
  pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
} catch {
  // No package.json — fall back to defaults below.
}

try {
  statSync(distDir);
} catch {
  console.error("dist/ not found — run `pnpm build` first.");
  process.exit(1);
}

const commit =
  process.env.GIT_COMMIT || process.env.GITHUB_SHA || git(["rev-parse", "HEAD"]) || "unknown";
const branch =
  process.env.GIT_BRANCH ||
  process.env.GITHUB_REF_NAME ||
  git(["rev-parse", "--abbrev-ref", "HEAD"]) ||
  "unknown";
const shortCommit = commit === "unknown" ? "local" : commit.slice(0, 8);
const version = pkg.version || "0.0.0";
const buildId = process.env.BUILD_ID || `${version}-${shortCommit}`;

const files = walk(distDir)
  .map((abs) => relative(distDir, abs).split(sep).join("/"))
  .filter((p) => p !== MANIFEST_NAME)
  .sort()
  .map((p) => {
    const buf = readFileSync(join(distDir, p));
    return {
      path: p,
      bytes: buf.length,
      sha256: createHash("sha256").update(buf).digest("hex"),
      contentType: CONTENT_TYPES[extname(p)] ?? "application/octet-stream",
    };
  });

const manifest = {
  name: pkg.name || "app",
  version,
  buildId,
  buildTime: new Date().toISOString(),
  git: { commit, shortCommit, branch },
  ci: process.env.GITHUB_ACTIONS
    ? {
        provider: "github-actions",
        runId: process.env.GITHUB_RUN_ID ?? null,
        runNumber: process.env.GITHUB_RUN_NUMBER ?? null,
      }
    : null,
  node: process.version,
  fileCount: files.length,
  totalBytes: files.reduce((sum, f) => sum + f.bytes, 0),
  files,
};

writeFileSync(join(distDir, MANIFEST_NAME), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `✔ ${MANIFEST_NAME}: build ${buildId} — ${files.length} files, ` +
    `${(manifest.totalBytes / 1024).toFixed(1)} KiB`,
);
