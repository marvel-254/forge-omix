# ORIENTATION.md — forge@omix

> **Purpose:** Map implementation tasks to the exact files an agent needs to read. Avoids loading 106K tokens when 5-12K will do.
> **Rule:** READ ONLY WHAT'S LISTED FOR YOUR PHASE.

---

## 📊 Token Cost Summary

| Category | Read Cost | Context Window Used (128K) |
|----------|-----------|----------------------------|
| Full repo (everything) | ~106K | 83% ⚠️ |
| Per-phase minimum | ~5-12K | 4-9% ✅ |
| Phase + adjacent docs | ~15-25K | 12-20% ✅ |

---

## 🗺️ Phase → File Map

### Phase 0 — Orientation (All Agents)

| File | Tokens | Why |
|------|--------|-----|
| `README.md` | ~2K | Project overview |
| `ORIENTATION.md` | ~2K | This file |
| **Total** | **~4K** | Start here |

### Phase 1 — Foundation (Vite + React + Hono + LibSQL)

| File | Tokens | Why |
|------|--------|-----|
| `docs/01-product-specification.md` | ~3K | Understand what you're building |
| `docs/02-system-architecture.md` | ~5K | How layers fit together |
| `docs/lightweight-architecture.md` | ~4K | Bundle budget, dependency rules |
| `schemas/project.schema.json` | ~2K | Root schema structure |
| `docs/16-development-workflow.md` | ~3K | Git, commit, release rules |
| `docs/adr/ADR-001-frontend-framework.md` | ~1K | React + Vite decision |
| `docs/adr/ADR-004-database.md` | ~1.5K | LibSQL choice |
| **Total** | **~19.5K** | Foundation only |

### Phase 2 — Universal Schema (TypeScript types + validation)

| File | Tokens | Why |
|------|--------|-----|
| `docs/03-universal-schema.md` | ~9K | Schema design |
| `docs/adr/ADR-003-universal-schema.md` | ~1K | Schema decisions |
| `schemas/project.schema.json` | ~2K | Root |
| `schemas/page.schema.json` | ~1K | Pages |
| `schemas/component.schema.json` | ~2K | Components |
| `schemas/design-tokens.schema.json` | ~2K | Design tokens |
| `schemas/flow.schema.json` | ~1.5K | Flows |
| `schemas/task.schema.json` | ~0.5K | Tasks |
| `schemas/template.schema.json` | ~0.5K | Templates |
| **Total** | **~19.5K** | All schemas |

### Phase 3 — Canvas Core (Puck + dnd-kit)

| File | Tokens | Why |
|------|--------|-----|
| `docs/04-editor-canvas.md` | ~8K | Canvas architecture |
| `docs/adr/ADR-002-canvas-architecture.md` | ~1.5K | Puck decision |
| `docs/lightweight-architecture.md` | ~4K | Performance budget |
| `docs/17-media-handling.md` | ~6K | Image/video support |
| `schemas/component.schema.json` | ~2K | Component structure |
| `schemas/media.schema.json` | ~1.5K | Media component schema |
| **Total** | **~23K** | Canvas + media |

### Phase 4 — Components & Design System

| File | Tokens | Why |
|------|--------|-----|
| `docs/05-component-design-system.md` | ~10K | Component library |
| `docs/03-universal-schema.md` | ~9K | Schema rules |
| `schemas/component.schema.json` | ~2K | Component schema |
| `schemas/design-tokens.schema.json` | ~2K | Token binding |
| **Total** | **~23K** | Components |

### Phase 5 — Templates

| File | Tokens | Why |
|------|--------|-----|
| `docs/06-template-system.md' | ~7K | Template system |
| `docs/adr/ADR-008-template-system.md` | ~0.5K | Template decisions |
| `schemas/template.schema.json` | ~0.5K | Template schema |
| `schemas/project.schema.json` | ~2K | Project structure |
| **Total** | **~10K** | Templates |

### Phase 6 — Code Generation

| File | Tokens | Why |
|------|--------|-----|
| `docs/07-code-generation.md` | ~8K | Codegen engine |
| `docs/adr/ADR-006-code-generation.md` | ~1K | Codegen decisions |
| `schemas/component.schema.json` | ~2K | Component structure |
| `schemas/page.schema.json` | ~1K | Page structure |
| `schemas/design-tokens.schema.json` | ~2K | Token mapping |
| `schemas/flow.schema.json` | ~1.5K | Flow mapping |
| **Total** | **~15.5K** | Codegen |

### Phase 7 — Project System (Multi-project, persistence)

| File | Tokens | Why |
|------|--------|-----|
| `docs/02-system-architecture.md` | ~5K | Data layer |
| `docs/03-universal-schema.md` | ~9K | Full schema |
| `schemas/project.schema.json` | ~2K | Project schema |
| `docs/15-roadmap.md` | ~7K | Phase dependencies |
| **Total** | **~23K** | Projects |

### Phase 8 — Agent Handoff (AGENTS.md generation)

| File | Tokens | Why |
|------|--------|-----|
| `docs/08-agent-integration.md` | ~9K | Agent protocol |
| `docs/adr/ADR-009-agent-integration.md` | ~0.5K | Agent decisions |
| `schemas/task.schema.json` | ~0.5K | Task schema |
| `schemas/project.schema.json` | ~2K | Project context |
| `docs/05-component-design-system.md` | ~10K | Component specs |
| `docs/07-code-generation.md` | ~8K | Output format |
| **Total** | **~30K** | Agents |

### Phase 9 — AI Integration

| File | Tokens | Why |
|------|--------|-----|
| `docs/09-ai-architecture.md` | ~13K | AI layer |
| `docs/adr/ADR-007-ai-provider-abstraction.md` | ~1K | AI decisions |
| `docs/02-system-architecture.md` | ~5K | Backend routes |
| **Total** | **~19K** | AI |

### Phase 10 — Git Integration

| File | Tokens | Why |
|------|--------|-----|
| `docs/02-system-architecture.md` | ~5K | Data layer |
| `docs/08-agent-integration.md` | ~9K | Bidirectional sync |
| `docs/16-development-workflow.md` | ~3K | Git workflow |
| **Total** | **~17K** | Git |

### Phase 11 — Docker & Deployment

| File | Tokens | Why |
|------|--------|-----|
| `docs/10-docker-deployment.md` | ~14K | Full deployment |
| `docs/adr/ADR-005-docker.md` | ~1K | Docker decisions |
| `docs/lightweight-architecture.md` | ~4K | Size constraints |
| `docs/11-security.md` | ~2K | Container security |
| **Total** | **~21K** | Docker |

### Phase 12 — Testing & Hardening

| File | Tokens | Why |
|------|--------|-----|
| `docs/13-testing.md` | ~4K | Testing strategy |
| `docs/11-security.md` | ~2K | Security model |
| `docs/12-performance.md` | ~3K | Performance targets |
| `docs/adr/ADR-010-desktop-strategy.md` | ~1K | Desktop (if adding) |
| **Total** | **~10K** | Quality |

---

## Bluehost-Level Expansion Program (Phase 13+)

The builder foundation is complete enough to expose a real editor, but Bluehost-level parity requires a customer lifecycle, not more isolated UI primitives. Use `research/bluehost-audit.md` as the product reference for these phases. Do not begin a later phase until its dependency is usable.

### Phase 13 — Accounts, Sessions & Tenant Isolation

**Goal:** Turn global project CRUD into an account-owned product.

**Read:** `research/bluehost-audit.md`, `src/server/routes/auth.ts`, `src/server/middleware/authMiddleware.ts`, `src/server/index.ts`, `src/server/db/schema.ts`, `src/server/services/projectService.ts`, `src/client/lib/api.ts`, `src/client/app/EditorShell.tsx`, and account/auth tests.

**Build:** registration and login UI, secure password/session handling, account model, project ownership, authorization middleware, logout/session recovery, and account-scoped project queries.

**Done when:** two accounts cannot read or mutate each other’s projects, and all protected project/AI/Git/feedback routes enforce the session boundary.

### Phase 14 — AI Creation Lifecycle

**Goal:** Move from chat-based edits to a resumable site-generation flow.

**Read:** `research/bluehost-audit.md`, `docs/09-ai-architecture.md`, `docs/03-universal-schema.md`, `src/server/ai/*`, `src/server/routes/ai.ts`, `src/client/components/ai/AIPanel.tsx`, `src/client/store/schemaStore.ts`, and `src/server/types/schema.ts`.

**Build:** durable creation brief, clarification questions, generation jobs, multiple previews, whole-project generation, prompt-based edits of existing content, AI version history, failure/retry states, and temporary preview URLs.

**Done when:** a user can resume a generation session after reload, apply a generated change, inspect the resulting project schema, and continue into the visual editor.

### Phase 15 — Build, Deployment & Publishing

**Goal:** Turn generated project output into a running, revisable customer site.

**Read:** `research/bluehost-audit.md`, `docs/10-docker-deployment.md`, `src/lib/codegen/*`, `src/client/components/codegen/CodeModal.tsx`, `src/server/services/gitService.ts`, `src/server/db/schema.ts`, `src/server/routes/git.ts`, and `src/client/lib/api.ts`.

**Build:** build jobs, deployment records, build logs, environment/secrets boundary, temporary preview, publish action, live URL, release history, rollback, and staging environments.

**Done when:** a saved project can be built, deployed, previewed, republished, and rolled back with observable status and failure recovery.

### Phase 16 — Plans, Checkout, Domains & Customer Portal

**Goal:** Connect activation to a transparent commercial lifecycle.

**Read:** `research/bluehost-audit.md`, `src/server/db/schema.ts`, `src/server/routes/index.ts`, `src/server/routes/projects.ts`, `src/client/lib/api.ts`, `src/client/app/EditorShell.tsx`, and payment/domain integration decisions before adding dependencies.

**Build:** plan catalog, term selection, cart/order summary, trial and grace state, payment provider boundary, subscriptions, invoices, cancellation, renewal center, domain search/connection boundary, and portal navigation for projects, domains, hosting, and billing.

**Done when:** a user can see promotional and renewal pricing, complete a non-sensitive checkout flow, manage a subscription, and connect or disconnect a domain without conflating domain ownership with hosting cancellation.

### Phase 17 — Operations, Support & Expansion

**Goal:** Make published projects supportable after launch.

**Read:** `research/bluehost-audit.md`, `src/server/routes/feedback.ts`, `src/server/services/*`, `src/client/components/feedback/FeedbackWidget.tsx`, `docs/11-security.md`, and the deployment/build surfaces from Phase 15.

**Build:** account-aware support requests, ticket lifecycle, deployment logs, health/status, backups/restore, usage limits, add-ons, migration/import, plan upgrades/downgrades, and operator triage.

**Done when:** a customer and an operator can inspect the same project/deployment context, receive actionable status, and recover from common operational failures.

### Phase 18 — Production Hardening & Scale

**Goal:** Make the lifecycle safe to operate for real customers.

**Read:** `research/bluehost-audit.md`, `docs/12-performance.md`, `docs/13-testing.md`, `docs/11-security.md`, `drizzle.config.ts`, `Dockerfile`, `docker-compose.yml`, `playwright.config.ts`, and all touched modules.

**Build:** persistent quotas, distributed rate limits where needed, secret management, tenant isolation tests, webhook/idempotency handling, data export/deletion, backup verification, observability, accessibility, performance budgets, migration safety, and lifecycle E2E coverage.

**Done when:** CI verifies account, billing, domain, deployment, renewal, and support flows; production data is isolated, recoverable, observable, and safe to migrate.

### Dependency order

```text
Phase 13 Accounts
  → Phase 14 AI creation
  → Phase 15 Deployment/publishing
  → Phase 16 Plans/domains/portal
  → Phase 17 Operations/support
  → Phase 18 Hardening/scale
```

Phase 13 and the data-model portions of Phase 16 are the first critical path. Do not build a customer-facing billing or domain surface before project ownership exists.

---

## 📋 File Quick Reference

### ALWAYS Read (Phase 0)
- `README.md`
- `ORIENTATION.md`

### NEVER Read During Implementation
- `docs/14-research-tools.md` — Reference only, 27K tokens of tables
- `research/tools-matrix.md` — Reference only, 28K tokens
- `research/competitors.md` — Reference only, 7K tokens
- `research/technology-evaluation.md` — Reference only, 6K tokens
- `research/licenses.md` — Reference only, 5K tokens
- `AGENTS.md` — Exists in generated projects, not the builder repo
- `.builder/*` — Runtime metadata, not for agents

### Reference Only (When Specifically Needed)
- `docs/adr/*` — Read only if changing the decision
- `docs/15-roadmap.md` — Read only for phase planning
- `docs/16-development-workflow.md` — Read only for release/commit tasks

---

## 🧭 Decision Tree

```
START: What are you implementing?
│
├── Phase 1: Foundation (new repo)
│   └── Read: README, 01, 02, lightweight, 16, ADR-001, ADR-004
│
├── Phase 2: Schema engine
│   └── Read: 03, ADR-003, all schemas
│
├── Phase 3: Visual canvas
│   └── Read: 04, ADR-002, lightweight, 17, component.schema, media.schema
│
├── Phase 4: Components
│   └── Read: 05, 03, component.schema, design-tokens.schema
│
├── Phase 5: Templates
│   └── Read: 06, ADR-008, template.schema, project.schema
│
├── Phase 6: Code generation
│   └── Read: 07, ADR-006, component.schema, page.schema, design-tokens.schema
│
├── Phase 7: Project system
│   └── Read: 02, 03, project.schema, 15
│
├── Phase 8: Agent handoff
│   └── Read: 08, ADR-009, task.schema, project.schema, 05, 07
│
├── Phase 9: AI integration
│   └── Read: 09, ADR-007, 02
│
├── Phase 10: Git
│   └── Read: 02, 08, 16
│
├── Phase 11: Docker
│   └── Read: 10, ADR-005, lightweight, 11
│
├── Phase 12: Testing
│   └── Read: 13, 11, 12
│
└── Don't know?
    └── Read: README → ORIENTATION → 15-roadmap
```

---

## 🚫 Irremless Files (Never Read for Implementation)

These are historical/research docs. Do NOT load during implementation:

- `research/tools-matrix.md` — 112 tools, for reference only
- `research/competitors.md` — Competitor analysis, for reference only
- `research/technology-evaluation.md` — Tech comparisons, for reference only
- `research/licenses.md` — License audit, for reference only

**Exception:** If you're evaluating a new dependency, consult `research/tools-matrix.md` to see if it's already been evaluated.

---

## ⚠️ Critical Warnings

1. **Never read all 42 files.** Total cost 106K tokens — overflows 64K windows.
2. **Never read research/ files unless specifically referenced.** They're 46K tokens of reference material.
3. **Always read the schema before modifying code.** Schema is the source of truth.
4. **Always read the relevant ADR before changing an architectural decision.** Don't undo decisions without knowing why.
5. **Never read docs from future phases.** They contain details that may change.
6. **Schema files are cheap (~2K each) — always read them.**

---

## ✅ Quick Copy-Paste for Agent Prompts

### For Phase 1 (Foundation):
```
Read ONLY these files before starting:
- /home/marvel/forge-omix/README.md
- /home/marvel/forge-omix/ORIENTATION.md
- /home/marvel/forge-omix/docs/01-product-specification.md
- /home/marvel/forge-omix/docs/02-system-architecture.md
- /home/marvel/forge-omix/docs/lightweight-architecture.md
- /home/marvel/forge-omix/docs/16-development-workflow.md
- /home/marvel/forge-omix/schemas/project.schema.json
```

### For Phase 3 (Canvas):
```
Read ONLY these files before starting:
- /home/marvel/forge-omix/docs/04-editor-canvas.md
- /home/marvel/forge-omix/docs/17-media-handling.md
- /home/marvel/forge-omix/docs/lightweight-architecture.md
- /home/marvel/forge-omix/schemas/component.schema.json
- /home/marvel/forge-omix/schemas/media.schema.json
- /home/marvel/forge-omix/docs/adr/ADR-002-canvas-architecture.md
```
