# forge@omix — Handoff (unified version)

Date: 2026-10-02
Status: reconciled from two diverged replicas; production-ready for Docker deployment

## What this repository is

A single, reconciled codebase for forge@omix (Omix Builder) — an AI-native
visual software builder. It merges the best of both former replicas:

- **`~/forge-omix`** — the git-ahead copy carrying multi-provider AI
  (OpenRouter, OpenAI, Anthropic, Groq, DeepSeek, Mistral, custom
  OpenAI-compatible, Ollama) and the single-container Docker stack.
- **`~/Projects/forge-omix`** — the richer working copy carrying the support
  tickets feature, Postgres schema/migrations, full docs tree, research docs,
  LICENSE/CHANGELOG/SECURITY/CODE_OF_CONDUCT/CONTRIBUTING, and Playwright E2E
  config.

Both old copies were archived (see `~/.forge-omix-reconcile-backup`, kept on
the blacksite host) and this directory is now the single canonical repo,
pushed to `main` on origin.

## Feature set (merged)

- Frontend: React + Vite, Puck canvas, Radix/Tailwind UI library, design
  tokens, templates, component library.
- Backend: Hono + Drizzle + LibSQL (SQLite). Multi-provider AI router.
- Accounts/sessions, projects, pages, components, feedback, deployments,
  domains, checkout/commerce, git integration, and **support tickets**.
- Postgres runtime scaffolding (`src/server/db/postgres.ts`,
  `schema.postgres.ts`, `migrations/postgres/`) — present but separate; the
  active app still uses LibSQL.
- 9 LibSQL migrations (0001–0009) incl. `0009_support_tickets`.

## Deployment (Docker)

Single container bundles nginx (frontend, :8080) + Hono (backend, :3001) with
SQLite on a persistent volume. AI providers are external and key-based.

- `Dockerfile` — multi-stage; prod image is Debian-slim (glibc for the libsql
  native binding), ships dev toolchains excluded.
- `docker-compose.yml` — dev/self-host stack, port 8080, `forge-data` volume.
- `nginx.conf` — proxies `/api` → backend, SPA fallback, `X-Real-IP` set.
- `.github/workflows/ci.yml` — typecheck, lint, unit tests, build, Playwright E2E.
- `.github/workflows/docker.yml` — build & push image to `ghcr.io/marvel-254/forge-omix`
  on pushes to `main` (tag `latest`) and on `v*` tags (semver).

## One-line installer

`install.sh` — self-contained installer that pulls the pre-built GHCR image,
writes `~/.forge-omix/.env`, provisions `~/.forge-omix/docker-compose.yml` and
starts the container.

```sh
curl -fsSL https://raw.githubusercontent.com/marvel-254/forge-omix/main/install.sh | sh
```

Options: `FORGE_PORT`, `FORGE_MODE` (cloud|mock|local|auto), `FORGE_HOME`,
provider keys via `OPENROUTER_API_KEY` etc.

## Verification (all green)

- `pnpm typecheck` — clean
- `pnpm lint` (eslint, `--max-warnings 0`) — clean
- `pnpm build` (tsc + vite) — clean
- `pnpm build:server` (tsc + esbuild bundle) — clean
- `pnpm vitest run` — 54 files / 399 tests passing

## Migration count note

Added `0009_support_tickets` in this reconcile; integration tests that assert
migration/rollback counts were updated accordingly.

## Next steps

- Point `main` at this repo and confirm the CI + Docker workflows run green on
  GitHub.
- Verify the GHCR image builds and `install.sh` provisions a fresh host.
- Add AI provider keys to `~/.forge-omix/.env` and validate cloud routes live.
- Optional: adopt Postgres runtime when ready (see `docs/production-deployment-handoff.md`).
