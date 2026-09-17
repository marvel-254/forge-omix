# 02 — System Architecture

## 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     OMIX BUILDER — forge@omix                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   FRONTEND (React + Vite)               │    │
│  │                                                         │    │
│  │  ┌───────────┐  ┌──────────┐  ┌────────────────────┐   │    │
│  │  │  Canvas   │  │ Panels   │  │   AI Interaction   │   │    │
│  │  │ (Puck)   │  │ (Layers, │  │      Panel         │   │    │
│  │  │          │  │  Props,  │  │   (OpenRouter)     │   │    │
│  │  │          │  │  Tree)   │  │                    │   │    │
│  │  └─────┬────┘  └────┬─────┘  └─────────┬──────────┘   │    │
│  │        │            │                   │              │    │
│  │  ┌─────┴────────────┴───────────────────┴──────────┐   │    │
│  │  │          Schema Engine (Zustand + Yjs)          │   │    │
│  │  │    - Immutable state updates                     │   │    │
│  │  │    - Structural sharing                          │   │    │
│  │  │    - Undo/redo via Yjs snapshots                 │   │    │
│  │  │    - Validation via JSON Schema                  │   │    │
│  │  └────────────────────┬───────────────────────────┘   │    │
│  └───────────────────────┼───────────────────────────────┘    │
│                          │ HTTP / WebSocket                     │
│  ┌───────────────────────┼───────────────────────────────┐    │
│  │                   BACKEND (Hono)                       │    │
│  │                       │                                │    │
│  │  ┌────────────────────┴───────────────────────────┐   │    │
│  │  │            API Layer (Hono Routes)              │   │    │
│  │  ├─────────────┬──────────────┬───────────────────┤   │    │
│  │  │ /api/schema │ /api/export  │ /ai               │   │    │
│  │  │ /api/project│ /api/import  │ /api/git          │   │    │
│  │  │ /api/pages  │ /api/preview │ /api/templates    │   │    │
│  │  └──────┬──────┴──────┬───────┴────────┬──────────┘   │    │
│  │         │             │                │              │    │
│  │  ┌──────┴─────────────┴────────────────┴───────────┐  │    │
│  │  │         Services Layer                          │  │    │
│  │  │  - Schema validation service                    │  │    │
│  │  │  - Code generation engine                       │  │    │
│  │  │  - AI provider abstraction                      │  │    │
│  │  │  - Git operations service                       │  │    │
│  │  │  - Template import/export service               │  │    │
│  │  │  - Asset processing service                     │  │    │
│  │  └────────────────────┬───────────────────────────┘  │    │
│  └───────────────────────┼───────────────────────────────┘    │
│                          │                                      │
│  ┌───────────────────────┼───────────────────────────────┐    │
│  │                 DATA LAYER                             │    │
│  │                       │                                │    │
│  │  ┌────────────────────┴───────────────────────────┐   │    │
│  │  │        LibSQL (SQLite-compatible)              │   │    │
│  │  │  - Projects table                              │   │    │
│  │  │  - Pages table                                 │   │    │
│  │  │  - Components table                            │   │    │
│  │  │  - Templates table                             │   │    │
│  │  │  - Schema versions table                       │   │    │
│  │  │  - Assets metadata table                       │   │    │
│  │  └────────────────────────────────────────────────┘   │    │
│  │                                                         │    │
│  │  ┌────────────────────────────────────────────────┐   │    │
│  │  │        Filesystem / Object Storage              │   │    │
│  │  │  - /data/projects/<id>/project.json            │   │    │
│  │  │  - /data/projects/<id>/assets/                 │   │    │
│  │  │  - /data/templates/                            │   │    │
│  │  │  - /data/exports/                              │   │    │
│  │  └────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              EXTERNAL INTEGRATIONS                      │    │
│  │  - OpenRouter / Ollama (AI)                             │    │
│  │  - GitHub / GitLab (Git)                                │    │
│  │  - S3 / R2 / MinIO (Storage)                            │    │
│  │  - npm / GitHub (Template imports)                      │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## 2.2 Layer Responsibilities

### 2.2.1 Presentation Layer (Frontend)

**React 19 + Vite 6**

Responsibilities:
- Render visual canvas and panels
- Handle user interactions (drag, drop, resize, keyboard)
- Manage local UI state (selection, hover, drag preview)
- Communicate with backend via HTTP/WebSocket
- Render AI interaction panel

Components:
- `Canvas` — Main visual editor (Puck-based)
- `Toolbar` — Top action bar
- `LeftPanel` — Component library, layers, pages
- `RightPanel` — Properties, styles, interactions
- `BottomPanel` — AI chat, task list
- `Viewport` — Responsive preview mode
- `AIPanel` — AI interaction and results

### 2.2.2 Schema Engine

**Zustand + Yjs**

Responsibilities:
- Central project state (single source of truth)
- Immutable updates with structural sharing
- Undo/redo via Yjs document snapshots
- Schema validation on every change
- Real-time sync (future: multiplayer)
- Persistence to backend

State structure:
```
useProjectStore = {
  project: Project,
  pages: Record<PageId, Page>,
  components: Record<ComponentId, Component>,
  designTokens: DesignTokens,
  selectedId: string | null,
  viewport: 'desktop' | 'tablet' | 'mobile',
  history: Yjs.UndoManager,
  actions: { ... }
}
```

### 2.2.3 Backend Layer (Hono)

**Hono + TypeScript**

Responsibilities:
- REST API for CRUD operations
- Schema validation
- Code generation orchestration
- AI provider abstraction
- Git operations
- Template import/export
- Asset management

Route groups:
- `GET/POST/PUT/DELETE /api/projects` — Project management
- `GET/POST/PUT/DELETE /api/projects/:id/pages` — Page management
- `POST /api/export` — Code generation trigger
- `POST /ai/generate` — AI generation endpoint
- `GET/POST /api/git` — Git operations
- `GET/POST /api/templates` — Template management
- `POST /api/import` — Template/package import

### 2.2.4 Data Layer

**LibSQL + Drizzle ORM**

Responsibilities:
- Persistent storage of projects and components
- Schema versioning
- Template catalog
- Asset metadata
- User preferences (if multi-user)

Tables:
- `projects` — Project metadata
- `pages` — Page definitions (JSON)
- `components` — Component definitions (JSON)
- `templates` — Template metadata and variables
- `assets` — Asset metadata (path, type, size, project_id)
- `schema_versions` — History of schema changes
- `tasks` — Agent tasks for project

### 2.2.5 Integration Layer

Responsibilities:
- **AI Provider:** OpenRouter abstraction with local Ollama fallback
- **Git:** simple-git wrapper for local operations
- **Storage:** S3-compatible abstraction for assets
- **Template Import:** GitHub/npm package analyzer

## 2.3 Data Flow

### 2.3.1 Visual Design Flow

```
User drags component onto canvas
    ↓
Canvas dispatches ACTION_ADD_COMPONENT
    ↓
Schema Engine validates against JSON Schema
    ↓
Schema Engine creates new immutable state
    ↓
Canvas re-renders with new component
    ↓
Debounced persistence to backend
    ↓
Backend saves to LibSQL + filesystem
```

### 2.3.2 Code Generation Flow

```
User clicks "Generate Code"
    ↓
Schema Engine exports current project schema
    ↓
Backend receives schema, invokes Code Generator
    ↓
Code Generator traverses component tree
    ↓
For each component, generates React + TSX file
    ↓
Generates package.json with dependencies
    ↓
Generates Tailwind config with design tokens
    ↓
Generates route files for pages
    ↓
Generates stores for state
    ↓
Generates AGENTS.md for AI agents
    ↓
Outputs project directory (or zip)
```

### 2.3.3 AI Interaction Flow

```
User describes desired component/feature in AI panel
    ↓
Frontend sends prompt + current schema context to backend
    ↓
Backend routes to configured AI provider (OpenRouter/Ollama)
    ↓
AI responds with schema modification or code
    ↓
Backend validates response against expected schema
    ↓
If valid: applies modification to project schema
    ↓
Canvas re-renders with AI-applied changes
    ↓
If invalid: returns error, asks for clarification
```

### 2.3.4 Agent Handoff Flow

```
User clicks "Implement with Agent"
    ↓
Backend generates full project directory
    ↓
Backend writes schema files (.builder/*.json)
    ↓
Backend writes AGENTS.md with instructions
    ↓
Backend writes tasks.json with implementation tasks
    ↓
Project directory opened in target agent (Hermes/OpenCode/etc)
    ↓
Agent reads AGENTS.md and task list
    ↓
Agent implements components per spec
    ↓
Agent commits code to Git
    ↓
Builder detects Git changes, imports back to visual canvas
```

## 2.4 Module Boundaries

### Frontend Modules

```
src/client/
├── app/                    # App entry, routing, layout
├── canvas/                 # Visual editor
│   ├── Canvas.tsx          # Main canvas component
│   ├── ComponentRenderer.tsx
│   ├── DropZone.tsx
   ├── SelectionBox.tsx
│   └── hooks/
├── panels/                 # UI panels
│   ├── LeftPanel.tsx
│   ├── RightPanel.tsx
│   ├── LayersPanel.tsx
│   ├── ComponentsPanel.tsx
│   ├── PropertiesPanel.tsx
│   └── StylePanel.tsx
├── store/                  # Zustand stores
│   ├── projectStore.ts
│   ├── selectionStore.ts
│   ├── viewportStore.ts
│   └── aiStore.ts
├── components/             # Builder UI components
│   ├── ui/                 # Button, Input, etc (Radix-based)
│   ├── toolbar/
│   └── viewport/
├── hooks/                  # Shared hooks
├── lib/                    # Utilities
├── ai/                     # AI interaction
│   ├── AIPanel.tsx
│   ├── useAI.ts
│   └── prompts.ts
└── types/                  # TypeScript types (mirrors schema)
```

### Backend Modules

```
src/server/
├── index.ts                # Hono app entry
├── routes/                 # API routes
│   ├── projects.ts
│   ├── pages.ts
│   ├── export.ts
│   ├── ai.ts
│   ├── git.ts
│   ├── templates.ts
│   └── assets.ts
├── services/               # Business logic
│   ├── schemaService.ts
│   ├── codegenService.ts
│   ├── aiService.ts
│   ├── gitService.ts
│   ├── templateService.ts
│   └── assetService.ts
├── db/                     # Database
│   ├── schema.ts           # Drizzle schema
│   ├── migrations/         # SQL migrations
│   └── index.ts            # DB connection
├── providers/              # AI provider abstraction
│   ├── openrouter.ts
│   ├── ollama.ts
│   └── types.ts
├── lib/                    # Utilities
└── types/                  # Shared types
```

## 2.5 Communication Patterns

### Frontend ↔ Backend

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create new project |
| GET | `/api/projects/:id` | Get project with full schema |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/:id/pages` | List pages |
| POST | `/api/projects/:id/pages` | Add page |
| PUT | `/api/projects/:id/pages/:pageId` | Update page |
| DELETE | `/api/projects/:id/pages/:pageId` | Delete page |
| POST | `/api/projects/:id/export` | Trigger code generation |
| GET | `/api/projects/:id/export/status/:jobId` | Check export status |
| POST | `/ai/generate` | AI generation request |
| POST | `/api/git/init` | Initialize Git repo |
| POST | `/api/git/commit` | Commit changes |
| POST | `/api/git/push` | Push to remote |
| GET | `/api/templates` | List templates |
| POST | `/api/templates/import` | Import template |

### Internal Communication

- **Canvas ↔ Schema Engine:** Direct function calls (Zustand actions)
- **Panels ↔ Schema Engine:** Subscribe to store slices via selectors
- **AI Panel → Backend:** HTTP POST with streaming response (SSE)
- **Backend → Frontend (async):** WebSocket for long-running jobs

## 2.6 Error Handling Strategy

### Frontend
- Error boundaries for canvas crashes
- Toast notifications for backend errors
- Automatic retry on transient network failures
- Graceful degradation when AI is unavailable

### Backend
- Structured error responses (RFC 7807 Problem Details)
- Request validation with Zod
- Database transaction rollback on failures
- Graceful shutdown on SIGTERM

### Schema Validation
- Every schema change validated before apply
- Invalid changes rejected with descriptive error
- Schema version migration on load (if needed)

## 2.7 Observability

- **Logs:** Pino logger (JSON format, structured)
- **Metrics:** Prometheus endpoint (optional)
- **Tracing:** OpenTelemetry (optional, Phase 4+)
- **Error tracking:** Sentry (optional, self-hosted GlitchTip alternative)

## 2.8 Deployment Architecture

```
┌─────────────────────────────────────┐
│            Docker Container          │
│                                      │
│  ┌──────────────────────────────┐   │
│  │     Nginx (reverse proxy)    │   │
│  └──────────────┬───────────────┘   │
│                 │                    │
│  ┌──────────────┴───────────────┐   │
│  │     Node.js (Hono server)    │   │
│  │     - API routes             │   │
│  │     - Static file serving    │   │
│  │     - WebSocket handler      │   │
│  └──────────────┬───────────────┘   │
│                 │                    │
│  ┌──────────────┴───────────────┐   │
│  │     LibSQL (embedded)        │   │
│  │     - /data/forge.db         │   │
│  └──────────────────────────────┘   │
│                                      │
│  Volumes:                            │
│  - /data/projects/ (project files)   │
│  - /data/templates/ (templates)      │
│  - /data/exports/ (generated code)   │
└─────────────────────────────────────┘
```
