# Session Handoff — forge-omix: local Docker + multi-provider AI

**Date:** 2026-09-29 · **Repo:** github.com/marvel-254/forge-omix (master; local == origin `a11d34f`)

## 1. Session direction (user decisions)

1. **User decision amended mid-session: NO Ollama service in the stack.** The compose file is app-only; AI is key-based/external (OpenRouter/OpenAI/Anthropic/Groq/DeepSeek/Mistral/custom OpenAI-compatible). `AI_MODE` defaults to `cloud`; Ollama provider stays available in code but only activates with `AI_MODE=auto|local` + `OLLAMA_BASE_URL` (e.g. a host-installed one at `http://host.docker.internal:11434`). Compose default `OLLAMA_ENABLED=false`.
2. **"We host everything in docker locally"** — replaces the Coolify/cloud deploy path (`.coolify/` was removed).
3. **"Add other model providers, not necessarily make Ollama the only option"** — AI layer is multi-provider.

## 2. What was done

### Repo sync (was broken on arrival)
- Local clone was `blob:none` partial clone containing only `.github/workflows/ci.yml`; full fetches kept dying (repo carries a **committed `node_modules/`** — 15,734 files — which is why every fetch/download hit ~30MB and died).
- **Fix that worked:** `git sparse-checkout` with `!/node_modules/` exclusion, then `git reset --hard origin/master` → got all 331 real files, ~4MB. Keep this technique for future syncs. Do NOT try to fetch node_modules over this flaky network.
- Environment notes: no buildx plugin (classic builder only — no BuildKit `--mount` features), backgrounded processes get killed when tool calls end (use `setsid` + log file if a long job must outlive a call), tool calls cap at 600s (docker builds of this project take longer → run detached, poll the log).

### Fully local Docker stack
- **`docker-compose.yml`** (rewritten): app-only — `forge` (nginx + Hono + SQLite) on a persistent `forge-data` volume, log rotation, app healthcheck, UI on **http://localhost:8080**. No AI service bundled; every provider key/base-url passed through, `AI_MODE` defaults to `cloud`, `OLLAMA_ENABLED` defaults to `false`.
- **`Dockerfile`**: added `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` in the builder (the e2e dep was stalling builds with a huge browser download). pnpm cache mount was attempted but **reverted** (needs BuildKit). Build verified reaching the production stage (apt-get phase) before this handoff was written.
- **`.dockerignore`** (new): excludes `node_modules`, `dist*`, `.git`, `.coolify`, docs/tests/etc. Build context is 270kB.
- **`.env.example`**: rewritten for the local stack + all optional provider keys.
- **`.coolify/`** removed (was the cloud-deploy leftover).
- **`docs/10-docker-deployment.md`**: added a "canonical setup" note pointing at the repo-root compose file.
- **Source fixes (build blockers found by docker build, CI doesn't run `build:server`):**
  - `tsconfig.server.json`: `rootDir` `./src/server` → `./src` (server imports `src/lib`/`src/types`).
  - `src/server/ai/ollama.ts` line ~81: typed `res.json()` result (`{ models?: unknown }`) to fix TS2339.

### Multi-provider AI (main feature work)
- **`src/server/ai/openai-compat.ts`** (new): generic `OpenAICompatProvider` (fetch-only, per ADR-007). Covers OpenAI, Groq, DeepSeek, Mistral, and any custom `/chat/completions` endpoint. `listModels()` tries live `/models` and falls back to static presets.
- **`src/server/ai/anthropic.ts`** (new): `AnthropicProvider` — Messages API, `x-api-key` + `anthropic-version` headers, hoists `system` messages, own SSE parser (`content_block_delta` / `message_stop`), `stop_reason` → finishReason mapping.
- **`src/server/ai/router.ts`**: added `setFallbackChain(chain)` (validates ids, ignores unknown, no-op on empty).
- **`src/server/routes/ai.ts`**: `getAiRouter()` rewritten —
  - `AI_MODE`: `local` (default in compose) = Ollama only · `auto` (code default) = all configured keys + Ollama · `cloud` = keys only · `mock` = offline demo.
  - Registers **every** provider with credentials: `OPENROUTER_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `MISTRAL_API_KEY`; custom OpenAI-compatible via `OPENAI_COMPAT_BASE_URL` (takes the `openai` prefix slot only when native OpenAI key is absent); Ollama unless `OLLAMA_ENABLED=false`.
  - `AI_PROVIDER_ORDER` (comma-separated ids) reorders the fallback chain.
  - `NOT_CONFIGURED_MSG` updated to list all options.
- **`docker-compose.yml`** passes through every provider key/base-url (+ `AI_PROVIDER_ORDER`, `OLLAMA_ENABLED`).
- **`tests/unit/ai-providers.test.ts`** (new): OpenAI-compat chat/listModels/fallback, Anthropic system-hoisting + stop-reason + SSE parse, `parseSseStream` `[DONE]`, `normalizeChatResponse`, router `setFallbackChain` ordering.

## 3. State at handoff

- `docker compose build forge` running detached (log: `/tmp/build3.log`). Client build (`tsc && vite build`) **passed**; last seen in production-stage `apt-get`. NOTE: /tmp may not survive a session restart.
- Image tag to expect when it finishes: `forge-omix-forge:latest` (currently a 10-day-old stale one exists).
- Working tree has all changes **uncommitted**. `git status` shows: modified `docker-compose.yml`, `.env.example`, `Dockerfile`, `docs/10-docker-deployment.md`, `tsconfig.server.json`, `src/server/ai/ollama.ts`, `src/server/ai/router.ts`, `src/server/routes/ai.ts`; new `.dockerignore`, `src/server/ai/openai-compat.ts`, `src/server/ai/anthropic.ts`, `tests/unit/ai-providers.test.ts`; deleted `.coolify/`.

## 4. Next steps (in order)

1. **Wait for build**: `tail -5 /tmp/build3.log` for `EXIT:0` (or rebuild). If the log is gone: `docker compose build forge` (layer cache makes it fast).
2. **Smoke test the stack**: `docker compose up -d` → wait for `ollama-init` to pull the model (first run downloads ~1.3GB) → `curl http://localhost:8080/health` → UI at http://localhost:8080 → AI panel should list Ollama models.
3. **Run unit tests**: `pnpm install` then `pnpm test:unit` (new file `tests/unit/ai-providers.test.ts` + existing suites). `pnpm typecheck` too — note CI doesn't run `build:server`, so `tsc -p tsconfig.server.json --noEmit` is worth a local run.
4. **Commit** the changes (single commit, message like "feat: local docker stack + multi-provider AI (OpenAI/Anthropic/Groq/DeepSeek/Mistral/custom)") — ask user first.
5. **Optional polish**: AIPanel error text (client) may still mention only OPENROUTER/ollama; `src/client/components/ai/AIPanel.tsx` line ~81. Model dropdown already lists models from all providers via `/api/ai/models`, so it likely works as-is.
6. **E2E later**: Playwright suite exists (`pnpm test:e2e`, needs browsers; `AI_MODE=mock` per AGENTS.md).

## 5. Gotchas for whoever picks this up

- **node_modules is committed upstream** — never unsparse it; never `pnpm install` from a fetched tree that includes it. It's also why CI has no lockfile-frozen install (last local commit was about that).
- Client uses `pnpm`; version pinned via corepack (`pnpm@10` in Dockerfile, `pnpm-workspace.yaml` is settings-only).
- `libsql` native binding needs glibc → production image is `node:22-bookworm-slim`, NOT alpine (comment in Dockerfile explains).
- `getAiRouter()` caches; tests must call `resetAiRouter()` after mutating env vars.
- Anthropic `listModels()` is static (no cheap catalog endpoint); OpenAI-compat providers hit live `/models` with static fallback.
- The `openai` prefix slot: native `OPENAI_API_KEY` wins; `OPENAI_COMPAT_BASE_URL` is ignored if both are set (documented in compose + .env.example).
