# forge@omix — Agent Guide

## Project shape

- Single-package TypeScript app; there are no workspace subpackages.
- Client: React 18, Vite 5, Zustand, Puck, Tailwind 3. Entry is `src/client/app/main.tsx`; Vite runs on port `3000`.
- Server: Hono, LibSQL, Drizzle, Zod. Entry is `src/server/index.ts`; it defaults to port `3001`.
- Database: `src/server/db/`, with migrations in `src/server/db/migrations/`. API routes are in `src/server/routes/`.
- Path aliases `@/*`, `@client/*`, and `@server/*` are configured in TypeScript, Vite, and Vitest.

## Commands

```text
pnpm install --frozen-lockfile
pnpm dev                 # Vite client only
pnpm dev:server          # Hono server only
pnpm typecheck
pnpm lint
pnpm test:unit           # all Vitest tests except E2E, not only tests/unit
pnpm build
pnpm build:server
pnpm test:e2e            # Playwright; starts isolated client/API servers
```

Run a focused Vitest file with `pnpm exec vitest run tests/unit/<name>.test.ts`. E2E requires `pnpm exec playwright install --with-deps chromium` once in a fresh environment. CI runs typecheck → lint → unit tests → client build → server build → E2E.

`pnpm lint` currently matches only JavaScript/CJS/MJS files; it does not lint TypeScript or TSX. `pnpm format` rewrites only `src/**/*.{ts,tsx}` and is not a check.

## Runtime and tests

- The client calls `http://localhost:3001` by default; set `VITE_API_URL` for another API. Vite has no development API proxy.
- The server reads `process.env`; the source does not load `.env` automatically. Copy `.env.example` values into the shell, process manager, or container environment.
- Database defaults to `file:./data/forge.db`; Git workspaces default to `data/workspaces`.
- Server startup automatically runs pending migrations unless `NODE_ENV=test`. Generate new migrations with `pnpm db:generate`; apply them with `pnpm db:migrate`. Do not edit existing migration files or `pnpm-lock.yaml` by hand.
- Vitest uses jsdom and `tests/setup.ts`, which supplies the `ResizeObserver` stub required by Puck/dnd-kit. Playwright uses API port `3102`, client port `5174`, `/tmp/omix-e2e-test.db`, `/tmp/omix-e2e-git`, and `AI_MODE=mock`.
- Docker Compose serves the app on `8080`, persists `/data`, and proxies the API through nginx; it uses `DATABASE_URL=file:/data/forge.db` and `GIT_WORKSPACES=/data/workspaces`.

## Code and API contracts

- The client API layer requires the standard `{ success, data?, error? }` envelope from `src/types/index.ts`. New API work should preserve it. `/health` and the legacy validated routes are current exceptions, so inspect `src/server/routes/validated.ts` before changing related responses.
- `src/server/index.ts` mounts both the current router and the legacy validated router. Avoid duplicate route assumptions when debugging `/api`.
- Domain contracts are represented across `schemas/*.schema.json`, `src/server/types/schema.ts`, and the corresponding Zod validation modules. Keep those representations and their tests synchronized.
- Canvas/schema conversion is centralized in `src/client/canvas/puckBridge.ts`; schema state is in `src/client/store/schemaStore.ts`.

## Repository hygiene

- `dist/`, `dist-server/`, `coverage/`, `test-results/`, and `node_modules/` are generated; do not hand-edit or include them in source changes.
- The working tree may contain unrelated user changes. Inspect `git status` and stage only files belonging to the current task.
- This guide reflects executable configuration; use `package.json`, CI, and config files as sources of truth when documentation is stale.
