# 15 — Roadmap

## Phase 0: Research & Architecture ✅ COMPLETED

**Duration:** 1-2 weeks
**Output:** This repository — specifications, schemas, research, ADRs

**Deliverables:**
- [x] Product specification
- [x] System architecture
- [x] Universal schema design
- [x] Canvas architecture
- [x] Component design system
- [x] Template system
- [x] Code generation design
- [x] Agent integration design
- [x] AI architecture
- [x] Docker deployment design
- [x] Security model
- [x] Performance model
- [x] Testing strategy
- [x] 100+ tool research
- [x] Implementation roadmap
- [x] 10 ADRs
- [x] 7 JSON schemas

## Phase 1: Foundation (Weeks 1-3)

**Goal:** Project scaffold, dev environment, basic routing, database setup

**Objectives:**
- Initialize monorepo structure
- Set up Vite + React + TypeScript
- Set up Hono backend
- Configure Drizzle + LibSQL
- Basic app shell (header, sidebar placeholder, main area)
- Docker compose setup
- CI/CD pipeline

**Files/Directories:**
```
forge-omix/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── Dockerfile
├── docker-compose.yml
├── src/
│   ├── client/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   └── pages/
│   ├── server/
│   │   ├── index.ts
│   │   └── db/
│   └── shared/
└── tests/
```

**Acceptance Criteria:**
- `npm run dev` starts both client and server
- `docker compose up` runs the app
- Basic page routing works
- Database migrations run
- CI passes on GitHub Actions

**Risks:**
- Hono + Vite integration complexity
- LibSQL TypeScript types

## Phase 2: Universal Schema (Weeks 3-5)

**Goal:** Schema engine with validation, versioning, migrations

**Objectives:**
- Implement JSON Schema validation
- Create Zustand stores for project state
- Schema migration system
- Import/export functionality
- Version history

**Key Components:**
- `SchemaEngine` class
- Zustand store with actions
- Migration runner
- Export/import utilities

**Acceptance Criteria:**
- Validates schemas against JSON Schema
- Undo/redo works via Yjs
- Export produces valid JSON file
- Import validates and migrates

## Phase 3: Canvas Core (Weeks 5-8)

**Goal:** Visual canvas with drag-and-drop, selection, basic components

**Objectives:**
- Integrate Puck canvas
- Set up dnd-kit drag-and-drop
- Component library panel (basic components)
- Properties panel
- Layers panel
- Zoom/pan/selection

**Components to Build:**
- Button, Input, Card, Badge, Avatar, Separator, Text, Image
- Navbar, Sidebar (layout components)
- KPI card, simple chart placeholder

**Acceptance Criteria:**
- Drag from library to canvas
- Select, move, resize components
- Edit props in panel
- Layers panel reflects tree
- 60fps with 100 components

## Phase 4: Components & Design System (Weeks 8-10)

**Goal:** Full component library, design token system

**Objectives:**
- Expand to 50+ components
- Design token binding
- Responsive editing
- Component states (hover, focus, active)
- Component interactions (onClick, etc.)

**Acceptance Criteria:**
- All basic, form, navigation components
- Design tokens in properties panel
- Responsive breakpoints work
- Component interactions configurable

## Phase 5: Templates (Weeks 10-12)

**Goal:** Template system, import, export

**Objectives:**
- Template format implementation
- Template library (5-10 starter templates)
- Import from GitHub/npm
- Export template from project
- Template variables

**Acceptance Criteria:**
- Create template from existing project
- Import template into new project
- Template variables substituted correctly
- Template library browsable

## Phase 6: Code Generation (Weeks 12-15)

**Goal:** Generate React + Vite project from schema

**Objectives:**
- Component-to-code generator
- Design token to Tailwind config
- Route generation
- Store generation
- Package.json generation
- Post-generation formatting

**Acceptance Criteria:**
- Generate valid React project from any schema
- Generated code passes TypeScript strict
- Generated code passes ESLint
- Generated app renders in browser

## Phase 7: Project System (Weeks 15-17)

**Goal:** Multi-project management, persistence

**Objectives:**
- Project CRUD
- Auto-save
- Project browser
- Project settings
- Asset management

## Phase 8: Agent Handoff (Weeks 17-19)

**Goal:** Generate agent-ready project with AGENTS.md

**Objectives:**
- AGENTS.md generation
- Task list generation
- Agent detection (Hermes, OpenCode, etc.)
- Bidirectional sync (Git-based)

**Acceptance Criteria:**
- Click "Implement with Agent" → project directory
- AGENTS.md contains all necessary context
- Agent can implement without asking questions
- Changes sync back to visual canvas

## Phase 9: AI Integration (Weeks 19-22)

**Goal:** AI-assisted design, OpenRouter/Ollama

**Objectives:**
- AI provider abstraction
- OpenRouter integration
- Ollama local inference
- AI prompt library
- AI-generated schema validation

**Acceptance Criteria:**
- AI chat panel works with OpenRouter
- AI can suggest components
- AI can generate pages from description
- Cost controls work

## Phase 10: Git (Weeks 22-24)

**Goal:** Version control, GitHub integration

**Objectives:**
- simple-git integration
- Commit, push, pull
- Branch management
- GitHub API integration (PRs, issues)
- Visual diff

## Phase 11: Docker & Deployment (Weeks 24-26)

**Goal:** Production-ready Docker, deployment guides

**Objectives:**
- Production Dockerfile
- Docker Compose with volumes
- Nginx reverse proxy config
- SSL/TLS setup
- Backup/restore scripts
- Deployment guides (VPS, Raspberry Pi)

## Phase 12: Testing & Hardening (Weeks 26-28)

**Goal:** Comprehensive tests, bug fixes, polish

**Objectives:**
- Unit test coverage > 80%
- E2E test suite
- Performance benchmarks
- Accessibility audit
- Security audit
- Documentation review

## Phase 13: Beta (Weeks 28-30)

**Goal:** Public beta, user feedback, iteration

**Objectives:**
- Beta release
- User onboarding
- Feedback collection
- Bug fixes
- Performance tuning

---

## Phase 14: Free Template & Component Library Integrations (Weeks 30-33)

**Goal:** Integrate open-source component libraries and template sources

**Objectives:**
- Flowbite React / Preline UI integration
- shadcn/ui + DaisyUI component registry
- Vercel Templates / Netlify Templates import pipeline
- HyperUI, Tailblocks, Mamba UI section libraries
- Tailwind config scanning for dynamic classes

**Acceptance Criteria:**
- `npm i flowbite-react` etc. work out of the box
- Component library panel shows Flowbite/Preline/shadcn components
- Template gallery includes Vercel/Netlify starter templates
- HyperUI/Tailblocks sections import as editable canvas pages

## Phase 15: Dashboard-Specific UI Libraries (Weeks 33-35)

**Goal:** Data-heavy application components

**Objectives:**
- Tremor integration (charts, metrics, tables)
- NextUI integration (accessible, customizable components)
- PrimeReact integration (enterprise-grade data components)
- Dashboard layout templates (sidebar, header, KPI grids)

**Acceptance Criteria:**
- Tremor charts render from schema `Chart` component
- NextUI/PrimeReact components appear in library panel
- Dashboard starter template generates valid project

## Phase 16: Animation & 3D Capabilities (Weeks 35-39)

**Goal:** 2D animations + immersive 3D web experiences

**Objectives:**
- Framer Motion integration (page transitions, component animations)
- Aceternity UI integration (3D sequences, parallax scrolling)
- Three.js + React Three Fiber (R3F) renderer component
- @react-three/drei helpers (cameras, controls, effects)
- CesiumJS geospatial component
- Poimandres ecosystem templates

**Acceptance Criteria:**
- Canvas supports `Motion` component type with Framer Motion props
- 3D canvas viewport (WebGL) alongside 2D Puck canvas
- R3F components serialize to schema + generate valid code
- CesiumJS component for mapping/geospatial pages

## Phase 17: Iconography & Visual Language (Weeks 39-40)

**Goal:** Comprehensive icon system

**Objectives:**
- Lucide React integration (default icon set)
- Phosphor Icons integration (duotone, fill, light variants)
- FontAwesome integration (brands, solid, regular)
- Icon picker in properties panel
- Icon token mapping in design system

**Acceptance Criteria:**
- Icon search/picker in component props (Navbar links, Button icons, etc.)
- Icons render on canvas and in generated code
- Design tokens reference icon families

## Phase 18: Full-Stack Boilerplates & Production Templates (Weeks 40-42)

**Goal:** Production-ready full-stack foundations

**Objectives:**
- Vercel Templates import (Next.js, React, auth, DB)
- Netlify Templates import (Edge functions, forms, identity)
- Boilerplate schema validation + migration
- One-click deploy from template to Vercel/Netlify

**Acceptance Criteria:**
- Import Vercel/Netlify template → valid forge-omix project
- Generated code includes auth, routing, DB config
- Deploy button triggers Vercel/Netlify API

## Phase 19: Debugging & Error Monitoring (Weeks 42-44)

**Goal:** In-builder observability

**Objectives:**
- Sentry SDK integration (error tracking, session replay)
- LogRocket integration (session replay, console capture)
- Eruda on-screen console for mobile preview
- Debug panel in canvas toolbar

**Acceptance Criteria:**
- Preview mode shows Eruda console on mobile
- Sentry/LogRocket init code generated in project
- Debug panel shows live console errors in preview

## Phase 20: Security Scanning & Vulnerability Diagnostics (Weeks 44-46)

**Goal:** Proactive security in development workflow

**Objectives:**
- SonarQube Cloud integration (quality gates, SAST)
- GitHub CodeQL integration (code scanning)
- Burp Suite Professional integration (DAST for preview URLs)
- Security report panel in project settings

**Acceptance Criteria:**
- CI runs CodeQL + SonarQube on generated projects
- Preview deployment triggers Burp scan (optional)
- Security findings surfaced in builder UI

## Phase 21: Developer Workflow & AI Automation (Weeks 46-48)

**Goal:** Productivity tooling + autonomous agents

**Objectives:**
- ntfy integration (mobile notifications on build/deploy)
- OpenHands agent template (repository automation)
- HERMES agent template (cloud workflows)
- Agent dashboard in builder (manage/monitor agents)

**Acceptance Criteria:**
- ntfy topic config in project settings
- "Deploy with OpenHands" / "Deploy with HERMES" actions
- Agent status visible in project browser

---

## Post-MVP (Phase 22+)

| Feature | Description |
|---------|------------|
| Real-time collaboration | Yjs + WebSocket |
| Desktop wrapper (Tauri) | Optional native desktop |
| Mobile app builder | React Native export |
| Plugin system | Extension API |
| Template marketplace | Community templates |
| Advanced animations | Framer Motion integration (Phase 16) |
| 3D components | Three.js/R3F/CesiumJS (Phase 16) |
| Voice interface | Speech-to-schema |

## First Implementation Task (After Planning)

> **Phase 1 — Foundation:** Initialize Vite + React + TypeScript frontend, Hono + LibSQL backend, Drizzle ORM, Docker Compose. Create app shell with header, sidebar placeholder, and main canvas area. Set up CI/CD.

**Acceptance Criteria:**
1. `npm run dev` starts frontend at `:5173` and backend at `:3000`
2. `docker compose up -d` serves the app at `:3000`
3. Visiting `/` shows the builder shell (empty canvas, component library placeholder)
4. Database migrations run on startup
5. GitHub Actions runs tests on push