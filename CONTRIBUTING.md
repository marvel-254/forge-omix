# Contributing to Forge@Omix

Thank you for contributing to the AI-native application development platform.

## Workflow

1. Fork and create a branch: `feat/<scope>` or `fix/<scope>`
2. `pnpm install --frozen-lockfile`
3. Make changes - keep domain logic in `src/domain`/`src/lib`, not in React components. Validate at boundaries with Zod schemas in `schemas/` and `src/lib/validations/`.
4. Run checks locally before pushing:
   ```bash
   pnpm typecheck && pnpm lint && pnpm test:unit && pnpm build && pnpm build:server
   ```
5. Open a PR against `master` - fill out the PR template. Include tests for domain changes and schema updates.

## Principles

- Treat schemas as contracts: `JSON Schema -> TypeScript -> Zod -> Drizzle -> API -> Editor` must stay in sync
- Forge Application Model is the source of truth - Puck canvas never is (preserve `__omix` metadata)
- Use scoped IDs (`projectId:canonicalId`) not global human-readable names
- Never expose secrets to the client; tenant-scoped queries only
- Prefer incremental migrations over rewrites; document decisions in `docs/adr/`

## Development

- Client: `pnpm dev` (Vite on 3000)
- Server: `pnpm dev:server` (Hono on 3001)
- Docker: `docker compose up` (8080, persists `/data`)
