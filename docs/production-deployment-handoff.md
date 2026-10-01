# Production Deployment Handoff

Last updated: 2026-09-29

## User decisions

- Deploy the current product and use failures from the live app to guide fixes.
- Use Cloudflare and Vercel for the production path; do not overwrite existing services or databases.
- Deploy to production, not just a preview.
- Provision a dedicated Neon PostgreSQL database for Forge-Omix.

## Current deployed state

- Vercel project: `forge-omix` (new project created for this app; no pre-existing Vercel project was reused).
- Public production alias verified in browser: <https://forge-omix-preview.vercel.app>.
- A second alias, <https://forge-omix.vercel.app>, was added to the same new deployment. Browser verification redirected to Vercel login, so treat it as protected/unverified; the old alias above remains the verified public URL.
- Latest production deployment: `dpl_HyKVFWU8qukZ2HFmvPgJJciWk9aa`.
- This deployment contains the built Vite frontend only. It is **not a complete production app**.
- It was uploaded as a static artifact from `/tmp/forge-omix-vercel-preview`; the Vercel project is not Git-linked and has no automatic source deploy configured.
- Browser smoke: the homepage loaded and the editor opened. Saving showed `Save failed`.
- Root cause verified in the deployed JS bundle: its API base is still `http://localhost:3001`; no production API is configured or deployed.
- The interrupted initial preview upload was not promoted. The successful deployment above was explicitly made with Vercel's production target. The new project was subsequently renamed from `forge-omix-preview` to `forge-omix`; no existing project was renamed.

## Cloudflare and database state

- Wrangler is authenticated to the user's Cloudflare account.
- Hyperdrive currently lists two configs named `threadmymail-db` and `threadmymail-db-fresh`. They belong to another app and must remain untouched.
- Neon CLI created a dedicated project named `forge-omix-prod` in the user's `Langat` organization: project ID `lively-union-05311486`, PostgreSQL 17, region `aws-ap-southeast-1` (Singapore).
- Wrangler created a dedicated Hyperdrive config named `forge-omix-prod`: ID `212e240a9bfc4098b7deca8b7948a267`. Both resources are for Forge-Omix; the two `threadmymail` configs remain untouched.
- The direct Neon URL and Hyperdrive ID are saved in the newly created, ignored, mode-0600 `.env` file. Do not copy the URL into chat, source, Worker config, or docs.
- A PostgreSQL foundation exists in `src/server/db/schema.postgres.ts` and `src/server/db/migrations/postgres/0001_initial_schema.sql`. It covers all 18 tables and remains deliberately separate from the current LibSQL runtime. Existing SQLite schemas and migrations were not rewritten.
- The PostgreSQL baseline was applied to Neon with `neon psql`; querying `information_schema` confirmed 18 public tables. No SQLite data has been imported, and the new database is not connected to the running app.
- The working tree now includes `pg` / `@types/pg` and an isolated `src/server/db/postgres.ts` Pool factory using `schema.postgres.ts`. It is not wired into the app; `src/server/db/index.ts` still starts LibSQL and the PostgreSQL helper is Node-only (Cloudflare Workers need a request-scoped client using the Hyperdrive binding).
- Cross-driver query conversion was started in route/service files by changing some Drizzle `.get()`/`.all()` terminal calls to array-based queries. This work was stopped mid-pass and has **not** been typechecked or tested; inspect the diffs and finish/revert coherently before relying on it. Many SQLite-specific calls remain, including `versionService.ts` and `projectService.ts`.
- `scripts/setup-cloudflare-hyperdrive.sh` was changed to a status-only helper after resources were created; it does not create or verify remote resources.
- Hyperdrive documents support for PostgreSQL and MySQL, not LibSQL/SQLite ([supported database matrix](https://developers.cloudflare.com/hyperdrive/reference/supported-databases-and-features/)). Cloudflare's [Neon setup guide](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/neon/) uses a direct, unpooled connection string and a `pg` driver.
- This app currently uses `@libsql/client`, Drizzle's LibSQL adapter and SQLite schema/migrations. It also has local Git workspace operations. A Cloudflare Worker backend cannot be treated as a configuration-only deployment; database and filesystem assumptions need an explicit migration/adaptation.
- The API entry point uses `@hono/node-server`, Node process lifecycle and automatic filesystem migration scanning. Routes also depend on SQLite-specific `.get/.all/.run`, local files, `simple-git`, child processes and in-memory rate limits. A Hyperdrive binding alone does not make these Worker-compatible.
- Cloudflare Containers can run the Docker image, but their local disk is ephemeral and Git workspaces under `GIT_WORKSPACES` would be lost across instance replacement/sleep and split across replicas. R2 FUSE needs Git compatibility testing because object storage is not POSIX storage. A container also cannot use a Hyperdrive binding as a normal Postgres socket; an HTTP database bridge or direct Neon connection would be needed. Containers require Workers Paid. See [Container lifecycle](https://developers.cloudflare.com/containers/concepts/architecture/), [R2 FUSE](https://developers.cloudflare.com/containers/examples/r2-fuse-mount/), [Container bindings](https://developers.cloudflare.com/containers/configuration/workers-connections/), and [Hyperdrive with Neon](https://developers.cloudflare.com/workers/databases/third-party-integrations/neon/).
- There was no checked-in Cloudflare/Hyperdrive deployment plan in the repository on this date. Existing hosting research recommends a Node container platform and R2 for assets; search for `Hyperdrive` returned no plan. Use this handoff as the current source of truth until a more specific plan is added.

## Verification completed today

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test:unit`: passed, 389 tests across 53 files.
- `pnpm build`, `pnpm build:server`: passed.
- Docker image build and container health/API smoke checks: passed.
- Render Blueprint validation: passed, but no Render service was created.
- Playwright E2E: failed twice. The first run showed the harness setting `PORT=3102` even though the server now reads `API_PORT`; `playwright.config.ts` was corrected. The subsequent runs still failed in client/editor loading and require a clean investigation before claiming E2E passes.
- Production browser smoke: frontend loads, editor opens, save fails because the API base points to localhost.
- Neon CLI authentication and dedicated project creation: succeeded. The Neon API intermittently failed while fetching the connection string, then succeeded on retry.
- Wrangler Hyperdrive creation for Forge-Omix: succeeded. The config is not yet bound to a deployed Worker.
- PostgreSQL schema TypeScript check: passed in the isolated audit; runtime integration remains unverified.
- Neon baseline SQL: applied successfully; verified `18` public tables. Application runtime integration and data import remain unverified.
- Since cross-driver query edits and the `pg` factory were added, a fresh full typecheck/test run has not completed. `git diff --check` passed; do not treat the earlier full-suite results above as verification of these latest edits.

## Next steps

1. Inspect the in-progress route/service changes and either complete them or revert them coherently. Run typecheck and the affected unit/integration tests before continuing.
2. Review the PostgreSQL baseline against the SQLite schema and all migrations, including support tickets. Implement a PostgreSQL adapter and migration runner; convert SQLite JSON text to validated JSONB, `internal` integers to booleans, and mixed seconds/milliseconds timestamps to `timestamptz` before cutover.
3. Locate the authoritative SQLite database (none exists at `data/forge.db` in this workspace), back it up, and plan an explicit JSON/boolean/timestamp-aware import. The Neon baseline is already applied and verified.
4. Select the production architecture. Lowest-risk cutover is a Node API service connected to Neon. To keep the API on Cloudflare with Hyperdrive, port API/database routes to a Worker and run Git workspaces as a separate service with tested durable storage. Cloudflare Containers are possible for the current Docker image, but first solve ephemeral workspace durability and Hyperdrive access; R2 FUSE alone is not verified for Git.
5. Add a new Wrangler config/Worker entry and bind only Hyperdrive ID `212e240a9bfc4098b7deca8b7948a267` after a Worker-compatible API exists. Do not update the existing two Hyperdrive configs.
6. Deploy the API/runtime, then set the Vercel production `VITE_API_URL`, configure CORS for the deployed Vercel origin, and redeploy the existing Forge-Omix Vercel project.
7. Fix the remaining Playwright failures, then test registration, login, project create/save/reopen, support ticket create/reply, and `/health` against production. Record results here.

## Repository hygiene

The working tree also contains unrelated untracked files and a large amount of modified/deleted `node_modules` content. Do not stage those. Stage only files confirmed to belong to the task, including the PostgreSQL schema/baseline and updated handoff if desired; review `git diff --cached` before any commit. `.env` is ignored and mode 0600; `.neon` contains only the project ID.
