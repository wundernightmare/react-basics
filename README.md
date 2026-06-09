# frontend-basics

Cloneable React frontend template — the UI sibling of `golang-basics` /
`rust-basics` / `nodejs-basics`. It ships the tooling and project structure of a
production frontend with **no business logic**: a single `tasks` CRUD example
wires every layer together so you can delete it and start your own.

## Stack

| Concern        | Choice                                                            |
| -------------- | ----------------------------------------------------------------- |
| Build / dev    | **Vite 8** + `@vitejs/plugin-react-swc`                           |
| Language       | **TypeScript** (strict), `tsgo` for typecheck                     |
| UI             | **React 19**, React Router 7, Tailwind CSS 4                      |
| Data           | **TanStack Query** + a Zod-validated `fetch` client               |
| Forms          | React Hook Form + Zod resolver                                    |
| State          | Zustand (persisted theme store)                                   |
| i18n           | **Lingui** (`ru` source + `en`), SWC macro transform              |
| Lint / format  | **oxlint** (type-aware) + **oxfmt**                               |
| Unit tests     | **Vitest** + Testing Library + **MSW** (jsdom)                    |
| Browser tests  | **Vitest browser mode** + **Playwright** (Chromium), opt-in       |
| Mutation tests | **Stryker**                                                       |
| Git hooks      | lefthook (format / lint / typecheck on pre-commit)                |

## Architecture — Feature-Sliced Design

```
src/
  app/         Composition root: providers, router, global styles, test harness
  pages/       Route screens (home, tasks, not-found)
  widgets/     Composite UI blocks (app-shell)
  features/    User-facing capabilities (create-task)
  entities/    Domain models + their UI (task: Zod schema, TaskItem, StatusBadge)
  shared/      Cross-cutting: api client, i18n, ui kit, lib, routing, model
  api/         TanStack Query hooks + query keys
  locales/     Lingui catalogs (.po sources + compiled .ts)
```

Import aliases (`@app`, `@pages`, `@widgets`, `@features`, `@entities`,
`@shared`, `@/*`) are defined once in `tsconfig.app.json` and `vite.config.ts`.

## Getting started

```bash
pnpm install
pnpm lefthook install        # one-time: enable git hooks

pnpm dev                     # http://localhost:5173 (proxies /api → VITE_API_TARGET)
VITE_ENABLE_MOCKS=true pnpm dev   # run fully against MSW — no backend needed
```

> For browser mocking, generate the worker script once:
> `pnpm dlx msw init public/ --save`

## Worktrees

This repo is meant to be worked **one branch per git worktree** — parallel tasks
then never fight over the same working tree, dev server, or install state. The
`./wt` helper wraps the per-worktree setup `git worktree add` skips (mise trust,
`pnpm install` from the shared global store, symlinking machine-local `.env*`):

```bash
./wt add feat/x            # → .worktrees/feat-x on branch feat/x, fully set up
./wt add feat/x --no-install
./wt list                  # list worktrees
./wt rm  feat/x            # remove (refuses if dirty; --force to override)
cd .worktrees/feat-x       # work here
```

Worktrees live under `.worktrees/` (gitignored). The pnpm store is global, so a
new worktree's `pnpm install` is hard-linked and fast — but each worktree keeps
its own `node_modules/`. The Vite dev server (`5173`) and the container host
port (`8080`) are shared across worktrees: run one per port, or override
(`pnpm dev -- --port 5174`, `docker run -p 8081:8080`). Agent-oriented notes
live in [`AGENTS.md`](./AGENTS.md).

## Scripts

```bash
pnpm check          # typecheck + lint + format:check
pnpm test           # Vitest jsdom (watch)
pnpm test:run       # Vitest jsdom (single run) — the CI path
pnpm test:browser   # Vitest browser mode in real Chromium (Playwright); opt-in
pnpm test:coverage  # jsdom + V8 coverage report
pnpm test:mutation  # Stryker mutation testing
pnpm build          # type-check + production bundle
pnpm i18n:extract   # collect messages → src/locales/{locale}/messages.po
pnpm i18n:compile   # compile .po → runtime messages.ts
```

### Browser-mode tests

Most tests run in **jsdom** — fast, and what `pnpm test` / `test:run`, coverage,
Stryker and CI use. For the handful of cases that need a real browser (true
layout, CSS, focus, event dispatch), name the file `*.browser.spec.tsx` and run
it in **Chromium via Playwright**:

```bash
pnpm exec playwright install chromium   # one-time, ~150 MB
pnpm test:browser                       # runs src/**/*.browser.spec.tsx
```

These live in a separate config (`vitest.browser.config.ts`) and are **opt-in**:
the default jsdom run excludes `*.browser.spec.*`, so CI stays browser-free and
never downloads Chromium. Browser specs render with
[`vitest-browser-react`](https://github.com/vitest-dev/vitest-browser-react)
(`render` + retry-able locators + `expect.element`) — see
`src/shared/ui/button.browser.spec.tsx`.

## Container & deployment

A two-stage `Dockerfile` builds the bundle (node 22 + pnpm) and serves it from a
minimal, **non-root** `nginx-unprivileged` image (~52 MB) with SPA fallback,
gzip, long-cache for hashed assets, security headers and a `/healthz` probe.

```bash
just docker-build           # tag frontend-basics:local
just docker-run             # → http://localhost:8080
# or directly:
docker build --build-arg BUILD_ID=... -t frontend-basics .
docker run --rm -p 8080:8080 frontend-basics
```

### Build manifest

Every `pnpm build` writes `dist/build-manifest.json` (also served at
`/build-manifest.json`) — build id, git commit/branch, CI metadata, node
version, and every emitted file with its size + sha256. Git/build fields resolve
from env (Docker build-args / CI vars) → local `git` → `"unknown"`, so it works
inside a `.git`-less builder image.

```bash
pnpm manifest               # regenerate from an existing dist/
```

### S3 publish (optional)

`scripts/s3-publish.sh` uploads `dist/` to an **immutable, per-build prefix** and
sets correct cache headers (hashed assets `immutable`; `index.html` +
manifest `no-cache`):

```
s3://$S3_BUCKET/$S3_PREFIX/<buildId>/   # this build (immutable)
s3://$S3_BUCKET/$S3_PREFIX/latest/      # optional floating pointer (UPDATE_LATEST=true)
```

```bash
S3_BUCKET=my-bucket UPDATE_LATEST=true just s3-publish
```

The `publish` GitHub workflow runs this on a `v*` tag or manual dispatch — but
**only when the repo `S3_BUCKET` variable is set** (auth via OIDC role
`AWS_ROLE_ARN`), so the template stays inert until you opt in.

### Cleanup job

`scripts/s3-cleanup.sh` prunes old build prefixes, keeping the newest `KEEP`
(ranked by manifest `LastModified`; `latest/` is never deleted). The `cleanup`
workflow runs it weekly (cron) and on demand:

```bash
S3_BUCKET=my-bucket KEEP=10 DRY_RUN=true just s3-cleanup   # preview
```

### CI/CD

The same pipeline ships for both forges — pick whichever your remote is:

**GitHub Actions** (`.github/workflows/`):

| File          | Trigger                       | Does                                               |
| ------------- | ----------------------------- | -------------------------------------------------- |
| `ci.yml`      | push / PR                     | check + test + build + validate the Docker image   |
| `publish.yml` | `v*` tag / dispatch (gated)   | build + manifest + S3 publish                      |
| `cleanup.yml` | weekly cron / dispatch (gated)| prune old S3 builds                                |

**GitLab CI** (`.gitlab-ci.yml`) — one file, equivalent stages:

| Stage / job        | Trigger                        | Does                                              |
| ------------------ | ------------------------------ | ------------------------------------------------- |
| `verify`           | push / MR / tag                | check + tests                                     |
| `build`            | push / MR / tag                | production bundle (artifact)                      |
| `build` → `docker` | push / MR / tag                | validate the Dockerfile via **kaniko** (no push)  |
| `publish`          | tag / manual (gated)           | S3 publish                                        |
| `cleanup`          | schedule / manual (gated)      | prune old S3 builds                               |

GitLab specifics: Docker builds run rootless with **kaniko** (no docker-in-docker
or privileged runner). The S3 jobs assume `AWS_ROLE_ARN` via a GitLab-issued
OIDC `id_token` (no stored AWS keys) and are gated on the `S3_BUCKET` CI/CD
variable — set it (plus `AWS_ROLE_ARN`, optional `S3_PREFIX` /
`AWS_DEFAULT_REGION`) to opt in; create a *pipeline schedule* to drive
`cleanup`. Both forges call the same `scripts/s3-*.sh`, so behaviour is identical.

## The `tasks` example

A complete vertical slice you can copy or delete:

- `entities/task` — the `Task` Zod schema is the single source of truth, reused
  by the API client, the MSW handlers, and the create form's validation.
- `api/tasks.ts` — `useTasks` / `useCreateTask` / `useUpdateTask` /
  `useDeleteTask` hooks over the typed client.
- `app/testing/mocks` — an in-memory `db` + behavioural MSW handlers, reset
  between tests. The same handlers back both jsdom tests and the dev worker.
- Tests: schema (`task.spec.ts`), API (`tasks.spec.ts`), client
  (`client.spec.ts`), and page interactions (`tasks.spec.tsx`).
