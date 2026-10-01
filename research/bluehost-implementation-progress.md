# Bluehost-Level Implementation Progress

> Updated: 2026-09-29  
> Project: `forge@omix`  
> Baseline: `research/bluehost-audit.md`  
> Plan: `ORIENTATION.md` Phases 13–18

## Current status

Omix has progressed from a visual builder prototype to a connected account/project lifecycle with AI project creation, deployment control, hosting plan selection, checkout boundaries, domain connection records, and an account overview portal.

The current implementation is intentionally honest about external-provider work:

- Deployment records can be created, built, inspected, and rolled back only when an adapter is configured.
- Checkout sessions can be created and priced, but no subscription is marked active without a payment provider.
- Domain records can be searched, saved, connected, and disconnected, but no domain is marked registered without a registrar provider.
- AI creation currently produces a deterministic, schema-valid starter project. It explicitly does not claim full model generation.

## Completed phases

| Phase | Status | Primary result |
|---|---|---|
| Phase 13 — Accounts & tenancy | Complete | Registration, login, secure sessions, project ownership, tenant isolation |
| Phase 14 — AI creation lifecycle | Complete foundation | Durable brief/session persistence, clarification flow, resumable wizard, starter generation |
| Phase 15 — Deployment control plane | Complete foundation | Deployment records, lifecycle logs, build state, adapter boundary, editor panel |
| Phase 16 — Commerce and domains | In progress foundation | Plan catalog, checkout sessions, pricing snapshots, payment boundary, domain records/connection |

## Phase 13 — Accounts, sessions, and tenant isolation

Implemented:

- Account registration and login with `scrypt` password hashing.
- Hashed, expiring session tokens stored in LibSQL.
- HTTP-only, same-site session cookies.
- `/api/auth/me` and `/api/auth/logout`.
- Client `AuthGate` for login/registration before entering the builder.
- Account ownership on projects.
- Account-scoped project list/get/create/update/delete.
- Protection across project, page, component, AI, Git, feedback, and legacy validated routes.
- Account-scoped feedback records.
- Tenant-isolation integration tests.

Key files:

- `src/server/services/authService.ts`
- `src/server/middleware/authMiddleware.ts`
- `src/server/routes/auth.ts`
- `src/server/routes/projects.ts`
- `src/client/components/auth/AuthGate.tsx`
- `src/client/lib/api.ts`
- `src/server/db/migrations/0004_accounts_sessions.up.sql`
- `tests/integration/authTenant.test.ts`
- `tests/integration/authMigration.test.ts`

## Phase 14 — Durable AI project creation

Implemented:

- Account-scoped AI creation sessions.
- Brief, project name, clarifications, and asset metadata persistence.
- Explicit steps: brief → clarify → assets → review.
- Session resume by ID.
- Save-on-navigation and save-on-submit behavior.
- Client wizard connected to the server session API.
- Local fallback when the server is unavailable, clearly labeled as a local starter.
- Schema-valid deterministic starter generation.
- Explicit generation metadata showing `fullModelGeneration: false` and a future provider hook.

Server endpoints:

- `POST /api/ai/creation/sessions`
- `GET /api/ai/creation/sessions/:id`
- `PATCH /api/ai/creation/sessions/:id`
- `POST /api/ai/creation/sessions/:id/generate`

Key files:

- `src/server/services/aiCreationService.ts`
- `src/server/routes/aiCreation.ts`
- `src/server/validation/aiCreation.ts`
- `src/server/db/migrations/0005_ai_creation_sessions.up.sql`
- `src/client/lib/aiCreation.ts`
- `src/client/components/ai/AIProjectCreationWizard.tsx`
- `src/client/components/ai/AIPanel.tsx`
- `tests/integration/aiCreation.test.ts`
- `tests/components/AIProjectCreationWizard.test.tsx`

## Phase 15 — Deployment control plane

Implemented:

- Account- and project-scoped deployment records.
- Preview, staging, and production environments.
- Queued → building lifecycle state.
- Lifecycle logs for deployment events.
- Publish and rollback operations.
- Adapter seam for a future real hosting provider.
- Honest `DEPLOY_ADAPTER_NOT_CONFIGURED` response when no host adapter exists.
- Deployment history panel in the editor.
- Status, progress, failure, URL, and log inspection.
- No fake live URLs or completed deployments.

Server endpoints:

- `POST /api/deployments`
- `GET /api/deployments?projectId=...`
- `GET /api/deployments/:id`
- `POST /api/deployments/:id/build`
- `POST /api/deployments/:id/publish`
- `POST /api/deployments/:id/rollback`
- `GET /api/deployments/:id/logs`

Key files:

- `src/server/services/deploymentService.ts`
- `src/server/routes/deployments.ts`
- `src/server/validation/deployments.ts`
- `src/server/db/migrations/0006_deployments.up.sql`
- `src/client/components/deployments/DeploymentPanel.tsx`
- `tests/integration/deployments.test.ts`
- `tests/components/DeploymentPanel.test.tsx`

## Phase 16 — Plans, checkout, and domains

### Plans and checkout

Implemented:

- Public plan catalog endpoint.
- Starter, Business, and Pro plan data.
- Explicit promotional and renewal pricing.
- 12-month and 36-month term selection.
- Account- and project-scoped checkout sessions.
- Checkout pricing snapshots so later catalog changes do not alter an existing order.
- Explicit currency and minor-unit amounts.
- Payment-provider seam.
- Honest `PAYMENT_PROVIDER_NOT_CONFIGURED` response.
- No subscription creation without payment-provider confirmation.
- Accessible Plans modal in the editor.

Server endpoints:

- `GET /api/plans`
- `POST /api/checkout/sessions`
- `GET /api/checkout/sessions/:id`
- `POST /api/checkout/sessions/:id/confirm`

Key files:

- `src/server/services/planCatalog.ts`
- `src/server/services/checkoutService.ts`
- `src/server/routes/commerce.ts`
- `src/server/db/migrations/0007_checkout_sessions.up.sql`
- `src/client/components/commerce/PlanSelector.tsx`
- `tests/integration/checkout.test.ts`
- `tests/components/PlanSelector.test.tsx`

### Domains

Implemented foundation:

- Public domain-search endpoint with normalized names.
- Availability results explicitly marked as unverified because no registrar is connected.
- Account-owned domain records.
- Save desired domain for a project.
- Connect domain to an owned project with a pending DNS state.
- Disconnect domain and clear its connection.
- Registrar boundary with `DOMAIN_REGISTRAR_NOT_CONFIGURED`.
- No domain is marked registered without a real registrar provider.
- Accessible Domains modal in the editor.

Server endpoints:

- `GET /api/domains/search?q=...`
- `GET /api/domains`
- `POST /api/domains`
- `POST /api/domains/:id/connect`
- `POST /api/domains/:id/disconnect`
- `POST /api/domains/:id/register`

Key files:

- `src/server/services/domainService.ts`
- `src/server/routes/domains.ts`
- `src/server/db/migrations/0008_domains.up.sql`
- `src/client/components/domains/DomainPanel.tsx`
- `tests/integration/domains.test.ts`
- `tests/components/DomainPanel.test.tsx`

### Customer portal

Implemented foundation:

- Authenticated account overview API.
- Account identity and aggregate project/deployment/domain counts.
- Account-owned project list ordered by recent activity.
- Deployment and domain counts shown per project.
- Accessible Account modal in the editor.
- Open-project navigation from the portal.
- Plans action from the portal.
- Sign-out action returning to the authentication screen.
- Loading, empty, and API error states.
- Read-only, tenant-scoped aggregation with no new migration.

Server endpoint:

- `GET /api/account/overview`

Key files:

- `src/server/services/accountOverviewService.ts`
- `src/server/routes/account.ts`
- `src/client/components/account/AccountPanel.tsx`
- `tests/integration/accountOverview.test.ts`
- `tests/components/AccountPanel.test.tsx`
- `tests/unit/clientAccountApi.test.ts`

## Phase 17–18 implementation update (2026-09-29)

Implemented in this slice:

- Replaced the feedback-only editor affordance with an account-scoped support center.
- Customers can create tickets, read their conversation, reply, and reopen resolved/closed tickets.
- Admin accounts can triage all tickets, adjust status and priority, reply publicly, and add private notes.
- Added migration `0009_support_tickets` for ticket and message history.
- Tightened container runtime permissions: the application runs as the `node` user, nginx logs to container streams, and Compose enables a read-only root filesystem, dropped capabilities, no-new-privileges, a bounded tmpfs, and resource limits.
- Added a five-per-minute per-IP limit to registration and login, in addition to the API-wide rate limit.
- Health checks now verify the database and return HTTP 503 when it is unavailable, so container health reflects readiness.

Remaining within Phases 17–18: support attachments and operator assignment, backups/restore, usage enforcement, deployment health/alerts, restore drills, and accessibility/security/performance audits.

Verification for this slice:

- `pnpm typecheck`, `pnpm lint`, `pnpm test:unit`, `pnpm build`, and `pnpm build:server` passed; the unit suite passed 389 tests across 53 files.
- Docker image build and container health/API smoke checks passed.
- The first E2E run exposed a stale `PORT` setting after the server switched to `API_PORT`; the harness was corrected. Subsequent Playwright runs still failed while loading the client/editor flow and need follow-up.
- A production frontend deployment is live at `https://forge-omix-preview.vercel.app`. Browser testing reached the editor, but saving failed because the bundled client still targets `http://localhost:3001`; the API has not been deployed to the production runtime yet.
- Cloudflare currently has two Hyperdrive configs for another app. They were inspected and left unchanged. Hyperdrive supports PostgreSQL/MySQL, while this app currently uses embedded LibSQL, so a dedicated Postgres database and a database/runtime migration are required before connecting the API to Hyperdrive.

## Current end-to-end flows

### Account to editor

```text
register/login
→ session cookie
→ account-scoped project list
→ create/open project
→ edit canvas
```

### Account portal

```text
open Account
→ load account overview
→ review project/domain/deployment totals
→ open a project or open Plans
→ sign out to return to authentication
```

### AI project creation

```text
open AI panel
→ create/resume creation session
→ enter brief
→ clarify requirements
→ capture asset references
→ review normalized brief
→ deterministic starter generation
→ load project into canvas
```

### Deployment

```text
open Deploy panel
→ create preview deployment
→ start build
→ inspect queued/building state and logs
→ publish/rollback only when adapter exists
```

### Commercial activation

```text
open Plans
→ compare limits/features/pricing
→ select 12/36 month term
→ create account-scoped checkout session
→ review promotional and renewal totals
→ confirm only when payment provider exists
```

### Domain lifecycle

```text
open Domains
→ search/normalize domain
→ save desired domain
→ connect to owned project
→ inspect pending DNS state
→ register only when registrar exists
```

## Verification history

The following completed verification runs passed during the implementation:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm build:server`
- `git diff --check`
- Full non-E2E suite after the domain slice: `377` tests passed across `49` test files.
- Full non-E2E suite after the customer portal slice: `386` tests passed across `52` test files.
- Playwright smoke suite after the customer portal slice: `2` tests passed when run alone.
- Phase 13 focused auth/tenant tests passed.
- Phase 14 focused AI creation tests passed.
- Phase 15 deployment-focused tests passed.
- Phase 16 checkout and plan-selector tests passed.
- Domain backend and client focused tests passed, followed by the full suite and standalone E2E run.
- Customer portal focused tests passed: `9` tests across `3` files.

Some E2E runs timed out when executed concurrently with the long unit suite; rerunning `pnpm test:e2e` alone passed.

## Remaining gaps to Bluehost level

These are intentionally not hidden or marked complete:

1. **Real AI generation** — connect the existing generation seam to a provider, parse structured project output, support retries/version history, and generate multiple previews.
2. **Deployment adapter** — build generated projects, allocate runtime, serve preview URLs, connect custom domains, publish atomically, and support rollback.
3. **Payments** — add a payment provider, webhooks, idempotency, subscription creation, invoice lifecycle, taxes, and renewal processing.
4. **Domain registrar** — add availability checks, registration, transfer, privacy, DNS, nameservers, SSL, auto-renewal, and expiry handling.
5. **Customer portal completion** — add deeper hosting, billing, invoices, subscriptions, domain management, and support areas on top of the current account overview and project navigation.
6. **Operations** — add staging, backups/restore, logs, health checks, usage limits, alerts, and operator tooling.
7. **Support** — replace the feedback widget with account-aware tickets, replies, attachments, escalation, and operator triage.
8. **Media** — add asset storage, uploads, transformations, and a media library.
9. **Billing retention** — add renewal center, cancellation, grace periods, data export, and account deletion.

## Recommended next build order

```text
Domain registrar/DNS adapter
→ payment provider and subscription lifecycle
→ customer portal shell
→ billing renewal center
→ real build/deploy adapter
→ real AI generation provider
→ staging/backups/logs/support operations
```

## Important implementation boundary

Bluehost-level does not mean pretending external services already exist. The current implementation establishes the product state machines, ownership boundaries, pricing disclosures, and failure behavior first. Each external provider is deliberately represented by an explicit adapter boundary so the system remains safe and testable before production integrations are selected.
