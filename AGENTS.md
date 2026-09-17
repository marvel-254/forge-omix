# Project: forge@omix — Omix Builder

> AI-native visual software builder. Design, structure, and ship production applications from a visual canvas.

## Overview

Omix Builder is not a mockup tool. The visual canvas is a structured, machine-readable software specification — a universal project schema that drives code generation, AI agent implementation, and bidirectional editing.

- **Stack:** React 19 + Vite (client), Hono (server), LibSQL + Drizzle (storage), Zod (validation), Zustand (state), @measured/puck (canvas)
- **Status:** Phase 1 (Foundation) complete; Phase 2+ (Universal Schema, Canvas) in progress
- **Key principles:** lightweight-first, AI-native, agent-first export, local-first, MIT/Apache/BSD-only dependencies

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Visual Canvas (@measured/puck)            │
├─────────────────────────────────────────────────────────────┤
│              Universal Schema Engine (TypeScript)            │
├─────────────────────────────────────────────────────────────┤
│     Code Generator    │    AI Layer    │    Agent Bridge     │
├─────────────────────────────────────────────────────────────┤
│              Storage (SQLite/LibSQL) + Git                   │
├─────────────────────────────────────────────────────────────┤
│                   Docker Self-Hosted                         │
└─────────────────────────────────────────────────────────────┘
```

Layer locations:

| Layer | Path |
|-------|------|
| Client entry | `src/client/app/main.tsx` |
| Canvas | `src/client/canvas/` (Puck bridge in `puckBridge.ts`) |
| Schema store | `src/client/store/schemaStore.ts` |
| UI components | `src/client/components/ui/` |
| Server entry | `src/server/index.ts` |
| API routes | `src/server/routes/` |
| Validation middleware | `src/server/middleware/validation.ts` |
| Shared validation schemas | `src/lib/validations/` |
| Database | `src/server/db/` (schema, migrations) |
| Canonical types | `src/server/types/schema.ts`, `src/types/index.ts` |
| JSON Schemas (source of truth) | `schemas/*.schema.json` |

## API Expectations

All endpoints return the standard envelope `{ success, data?, error? }` (see `src/types/index.ts`).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET/POST | `/api/projects` | List / create projects |
| GET/PUT/DELETE | `/api/projects/:id` | Read / update / delete a project |
| GET | `/api/projects/:projectId/pages` | List pages for a project |
| POST | `/api/projects/:projectId/pages` | Create page (validated) |
| GET | `/api/projects/:projectId/components` | List components |
| POST | `/api/projects/:projectId/components` | Create component (validated) |
| GET/POST | `/api/projects/:projectId/flows` | Flows |
| GET/POST | `/api/projects/:projectId/tasks` | Tasks |
| GET/PUT | `/api/projects/:projectId/design-tokens` | Design tokens |
| POST | `/api/templates/import` | Import template JSON |
| POST | `/api/auth/login` | JWT login (mock users) |

Mutating endpoints validate bodies with Zod via `createValidationMiddleware` (`src/server/middleware/validation.ts`). Invalid JSON → 400 `INVALID_JSON`; schema violations → 400 `VALIDATION_ERROR` with `details: issues[]`.

## Testing Requirements

- Framework: Vitest (config in `vitest.config.ts`), unit tests in `tests/unit/`
- Run: `pnpm test:unit` · Typecheck: `pnpm typecheck` (must stay at 0 errors) · Lint: `pnpm lint`
- Every validation schema in `src/lib/validations/` and `src/server/validation/` has coverage in `tests/unit/validation.test.ts`
- Server routes are exercised through route handlers with the standard envelope asserted
- Do not merge with failing tests or typecheck errors

## Files to NEVER Modify

- `schemas/*.schema.json` — canonical JSON Schemas; the source of truth for all validation code
- `pnpm-lock.yaml` — changed only via `pnpm add`/`pnpm remove`, never hand-edited
- `src/server/db/migrations/*` — applied migrations are immutable; add new ones instead
- `.builder/*` — runtime metadata
- `ORIENTATION.md` — agent orientation contract

## Sync Rules

- The visual canvas state lives in `src/client/store/schemaStore.ts`; every mutation passes through Zod validation before commit
- Canvas ↔ schema conversion goes through `src/client/canvas/puckBridge.ts` (schema ids live in `props.id` inside Puck)
- When changing a schema, update in this order: `schemas/*.schema.json` → `src/server/types/schema.ts` → `src/server/validation/index.ts` → `src/lib/validations/*` → tests
- API responses always use the envelope in `src/types/index.ts`; never return raw rows
- Database writes require explicit `createdAt`/`updatedAt` (columns are NOT NULL without defaults)

## Tasks (Phase 2 - Universal Schema)

### TASK-004: Schema Validation Engine
**Priority:** critical
**Dependencies:** none
- [ ] Implement Zod validation for all schemas (project, page, component, design-tokens, flow, task, template)
- [ ] Add validation middleware to all API endpoints
- [ ] Create schema validation utilities for frontend components
- [ ] Add real-time validation in canvas properties panel

### TASK-005: Database Migration System
**Priority:** high
**Dependencies:** none
- [ ] Create migration runner in server
- [ ] Add version tracking table
- [ ] Implement rollback capability
- [ ] Add migration CLI commands (`pnpm db:migrate`, `pnpm db:generate`)

### TASK-006: Schema Import/Export
**Priority:** high
**Dependencies:** none
- [ ] Build import wizard in UI
- [ ] Add export button for project JSON
- [ ] Implement template import/export
- [ ] Add file drag-drop import

### TASK-007: Version Management
**Priority:** medium
**Dependencies:** none
- [ ] Add schema version display in project settings
- [ ] Implement version downgrade/rollback
- [ ] Add migration status indicator
- [ ] Create version history view

### TASK-008: Component Library Integration
**Priority:** medium
**Dependencies:** TASK-004
- [ ] Map schema component types to UI templates
- [ ] Add component registration system
- [ ] Implement component search/filter
- [ ] Add component preview in library

### TASK-009: Design Token System
**Priority:** medium
**Dependencies:** TASK-004
- [ ] Create token editor panel
- [ ] Add token preview swatches
- [ ] Implement token inheritance
- [ ] Add token export/import

### TASK-010: Flow Editor
**Priority:** low
**Dependencies:** TASK-004
- [ ] Build flow editor canvas
- [ ] Add step/stage management
- [ ] Implement transition connections
- [ ] Add trigger configuration

## Component Specifications (Phase 2)

Based on schemas/component.schema.json, component types include:

### Button
**Location:** src/client/components/ui/Button.tsx
**Props:** variant (primary|secondary|outline|ghost|link), size (sm|md|lg), disabled, label, icon
**Design Tokens:** Uses `$ref: "designTokens.colors.primary.500"` for primary variant
**Accessibility:** role="button", keyboard accessible (Enter/Space)
**Responsive:** Mobile overrides for size="lg"

### Input
**Location:** src/client/components/ui/Input.tsx
**Props:** type, placeholder, required, value, onChange, label
**Design Tokens:** Border radius `$ref: "designTokens.radius.md"`, background `$ref: "designTokens.colors.neutral.50"`
**Accessibility:** role="textbox", associated label
**Validation:** Zod schema validation on submit

### Card
**Location:** src/client/components/ui/Card.tsx
**Props:** variant, header, content, footer, elevation
**Design Tokens:** Background `$ref: "designTokens.colors.neutral.0"`, shadow `$ref: "designTokens.shadows.md"`
**Responsive:** Adaptive padding per breakpoint

### Navbar
**Location:** src/client/components/ui/Navbar.tsx
**Props:** logo, links, sticky, transparent
**Design Tokens:** Primary color `$ref: "designTokens.colors.primary.500"`, spacing `$ref: "designTokens.spacing.4"`
**Accessibility:** ARIA navigation landmark, keyboard focus management

### Chart
**Location:** src/client/components/ui/Chart.tsx
**Props:** type (line/bar/pie), data, options, responsive
**Design Tokens:** Colors from palette, spacing for margins
**Responsive:** Auto-scales to viewport width

### Table
**Location:** src/client/components/ui/Table.tsx
**Props:** columns, data, sortable, filterable, pagination
**Design Tokens:** Border `$ref: "designTokens.colors.neutral.200"`, background `$ref: "designTokens.colors.neutral.50"`
**Accessibility:** ARIA grid, keyboard navigation, sort indicators