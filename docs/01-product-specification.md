# 01 — Product Specification

## 1.1 Product Vision

Omix Builder is an AI-native visual software/product builder that transforms visual designs into structured, machine-readable software specifications. Unlike traditional mockup tools, the visual canvas becomes the source of truth for code generation, AI agent implementation, and bidirectional editing.

### Core Lifecycle

```
Design → Structure → Behavior → Data → User Flows → Design System
    → Universal Project Schema → Code Generation → Project Directory
    → Git Repository → AI Coding Agent → Implementation → Testing
    → Preview → Iteration → Visual Feedback
```

### Output Targets

- Websites (marketing, blogs, documentation)
- SaaS applications
- Dashboards and analytics
- Admin panels
- E-commerce platforms
- Marketplaces
- PWAs (Progressive Web Apps)
- Internal tools and portals
- CRM systems
- School management systems
- Business applications
- Mobile applications (via React Native / Flutter export)

## 1.2 Core Differentiator

The primary output is **NOT an image or HTML mockup**. The primary output is a **structured software specification** — a JSON-based universal project schema that captures:

| Aspect | Description |
|--------|-------------|
| Components | Reusable UI building blocks with typed props |
| Pages | Route definitions with component trees |
| Layouts | CSS Grid/Flex structures per breakpoint |
| Routes | File-based or configuration-based routing |
| Navigation | Menu structures, breadcrumbs, tabs |
| Interactions | Event handlers, state transitions |
| Application States | Global and local state definitions |
| Data Models | Database schemas, API contracts |
| Permissions | Role-based access control definitions |
| Design Tokens | Colors, typography, spacing, shadows |
| Assets | Images, fonts, icons with metadata |
| Responsive Rules | Breakpoint-specific overrides |
| Accessibility | ARIA roles, keyboard navigation, contrast |
| API Requirements | Endpoint definitions, request/response shapes |
| Authentication | Provider configuration, session strategy |
| Agent Tasks | Implementation work items for AI agents |
| Project Architecture | Directory structure, file conventions |

## 1.3 Target Users

1. **Solo developers** — Rapid prototyping, MVP building
2. **Small teams** — Internal tools, client projects
3. **Designers who code** — Visual design with production output
4. **AI-assisted developers** — Using agents to implement from specs
5. **Non-technical founders** — Building without deep coding knowledge
6. **Agencies** — Multi-client project management

## 1.4 Platform Requirements

### Supported Output Platforms (V1)
- Web browsers (all modern)
- PWA (offline-capable)
- Static hosting (GitHub Pages, Netlify, Vercel, S3)

### Deferred Platforms
- iOS/Android (React Native export — Phase 4+)
- Desktop (Electron/Tauri wrapper — Phase 6+)
- Native Android (Kotlin export — Phase 8+)

### Builder Platform
- **Primary:** Browser-based PWA (Chrome, Firefox, Safari, Edge)
- **Secondary:** Optional Tauri wrapper for desktop experience (deferred)
- **Requirements:** Works on 8GB RAM machines, no GPU required

## 1.5 MVP Definition

### In Scope (MVP)
- [ ] Project creation and management
- [ ] Visual canvas with drag-and-drop component placement
- [ ] Component library (50+ foundational components)
- [ ] Page/screen management with routing
- [ ] Design token system (colors, typography, spacing)
- [ ] Responsive editing (desktop/tablet/mobile)
- [ ] Template system (create, import, export templates)
- [ ] JSON schema export/import
- [ ] Code generation (React + Vite target)
- [ ] Agent task generation
- [ ] Basic AI integration (OpenRouter provider)
- [ ] Git integration (init, commit, push to GitHub)
- [ ] Local storage (SQLite/LibSQL)
- [ ] Docker deployment
- [ ] Preview mode

### Out of Scope (Post-MVP)
- Real-time multiplayer collaboration
- Native mobile app builders
- Desktop application builder
- Advanced animation editor
- Custom code editor within builder
- Video/audio editing
- 3D modeling
- Plugin marketplace
- Team management (multi-user accounts)
- Analytics dashboard
- Built-in deployment pipelines

## 1.6 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first prototype | < 10 minutes | From project creation to preview |
| Code generation speed | < 5 seconds | 10-page project |
| Generated code quality | Passes ESLint + TypeScript | No errors, strict mode |
| Accessibility score | > 90 | Lighthouse audit |
| Performance score | > 85 | Lighthouse audit |
| Component reuse rate | > 60% | Across pages in project |
| Agent task completion | > 80% | Without human intervention |

## 1.7 Architectural Non-Negotiables

1. **Schema-first:** Every visual action updates the schema, then renders
2. **Immutable state:** Structural sharing, no direct mutations
3. **Versioned:** Every schema change is versioned and reversible
4. **Validated:** All schema changes validated before persistence
5. **Serializable:** Full project exports to a single JSON file
6. **Agent-readable:** Schema includes descriptions for AI consumption
7. **Local-first:** No cloud required for core functionality
8. **Open source:** MIT/Apache/BSD dependencies only
