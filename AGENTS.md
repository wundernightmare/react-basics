# AGENTS.md — working in frontend-basics

Guidance for AI coding agents (and humans skimming for the fast path). This is a
**worktree-oriented** repo: do isolated work in its own git worktree, not by
hot-swapping branches under the main checkout.

## Worktrees first

The main checkout is the canonical tree (it holds your `node_modules/` and any
machine-local `.env*`). For any branch of work, create a dedicated worktree with
the `./wt` helper instead of `git checkout`-ing in place — parallel tasks then
never clobber each other's working tree, dev server, or install state.

```sh
./wt add feat/x            # new worktree at .worktrees/feat-x (branch feat/x)
                           #   → trusts mise, runs pnpm install, links .env*
./wt add feat/x --no-install
./wt list                  # all worktrees
./wt rm  feat/x            # remove (refuses if dirty; --force to override)
cd .worktrees/feat-x       # then work here
```

Worktrees live under `.worktrees/` (gitignored). What `./wt` wires up that a
plain `git worktree add` does not: `mise trust` + tool install, `pnpm install`
(own `node_modules/`, but deps hard-link from the shared global store, so it's
cheap), and symlinking machine-local secrets from the main checkout.

**Singletons to respect:** the Vite dev server (`5173`) and the container host
port (`8080`) are shared across worktrees — run one per host port, or override
(`pnpm dev -- --port 5174`, `docker run -p 8081:8080 ...`). The pnpm store is
global; never assume a worktree's `node_modules/` is shared.

## Essential commands

```sh
pnpm install            # deps (run once per worktree; ./wt does it for you)
pnpm dev                # Vite dev server → http://localhost:5173
VITE_ENABLE_MOCKS=true pnpm dev   # run fully against MSW, no backend

pnpm check              # typecheck (tsgo) + oxlint + oxfmt --check  ← gate before commit
pnpm test:run           # Vitest (single run)
pnpm test:coverage      # + v8 coverage → coverage/
pnpm test:mutation      # Stryker
pnpm build              # tsc -b + vite build + build-manifest.json
pnpm format             # apply oxfmt (fixes what format:check flags)
pnpm i18n:extract && pnpm i18n:compile   # after adding/changing UI strings
```

`just` mirrors the common ones plus container/S3 recipes (`just --list`).

## Layout (Feature-Sliced Design)

```
src/app/       composition root — providers, router, styles, test harness (app/testing)
src/pages/     route screens            src/widgets/   composite UI blocks
src/features/  user capabilities        src/entities/  domain model + its UI
src/shared/    api client, i18n, ui kit, lib, model, routing
src/api/       TanStack Query hooks + query keys
src/locales/   Lingui catalogs (.po sources + compiled .ts)
```

Import via the aliases (`@app`/`@pages`/`@widgets`/`@features`/`@entities`/`@shared`/`@/*`),
defined once in `tsconfig.app.json` + `vite.config.ts`. FSD dependency rule:
layers may only import from layers below them (pages→widgets→features→entities→shared).

## Invariants — keep these true

- **Zod schema is the contract.** A response type, its API parse step, the MSW
  handler, and any form validation all derive from one schema (see
  `entities/task`). Change the schema, not the call sites.
- **UI strings go through Lingui macros** (`<Trans>`, `` t`…` ``, `useLingui`) —
  plain string literals aren't translated. Re-run `i18n:extract`+`i18n:compile`
  and commit `src/locales/` when strings change.
- **Tests use `renderWithProviders`** (`app/testing/render.tsx`) and the MSW
  handlers + in-memory `db` (`app/testing/mocks`); `db.reset()` + `cleanup()`
  run in `afterEach`. Don't hit a real network in tests.
- **`pnpm check` must pass** before committing. oxfmt owns formatting — run
  `pnpm format`, don't hand-format.
- **Never commit secrets.** `.env*` are gitignored and symlinked into worktrees
  by `./wt`; only `.env.example` is tracked.

## Build, container & deploy

- `pnpm build` → `dist/` plus `dist/build-manifest.json` (version, buildId, git,
  per-file sha256). Regenerate alone with `pnpm manifest`.
- `Dockerfile` serves `dist/` from non-root `nginx-unprivileged` (SPA fallback,
  immutable asset cache, `/healthz`). `just docker-build` / `just docker-run`.
- Optional S3 publish + cleanup via `scripts/s3-*.sh`, gated on `S3_BUCKET`.
- CI mirrors both forges: `.github/workflows/` and `.gitlab-ci.yml`. See
  `README.md` → "Container & deployment" / "CI/CD".
