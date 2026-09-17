# forge@omix — Omix Builder

> AI-native visual software builder. Design, structure, and ship production applications from a visual canvas.

## Vision

Omix Builder is not a mockup tool. The visual canvas is a structured, machine-readable software specification — a universal project schema that drives code generation, AI agent implementation, and bidirectional editing.

## Architecture Overview





## Key Principles

- **Lightweight first** — No Electron. No bundled Chromium. Browser-based PWA with optional Tauri wrapper.
- **AI-native** — OpenRouter-compatible provider abstraction. Works with local models via Ollama.
- **Agent-first export** — Generates real project directories with 



## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 19 + Vite 6 | Fastest dev server, smallest bundle |
| Canvas | Puck (MIT) | React-native, headless, agent-friendly |
| UI Library | @radix-ui/themes + Tailwind v4 | Accessible primitives + utility CSS |
| State | Zustand + Yjs | Minimal footprint + CRDT sync |
| Backend | Hono (TypeScript) | Lightweight, runs anywhere |
| Database | LibSQL (embedded) | SQLite-compatible, server-capable |
| ORM | Drizzle | SQL-first, small bundle, migrations |
| Git | simple-git | Lightweight, no native bindings |
| AI | OpenRouter abstraction | Provider-agnostic, local fallback |
| Testing | Vitest + Playwright | Fast, modern, E2E capable |
| Deployment | Docker Compose | Single-command self-hosting |

## Project Structure



## Status

- [x] Phase 0 — Research & Architecture (this repository)
- [x] Phase 1 — Foundation (Vite + Hono + LibSQL)
- [ ] Phase 2 — Universal Schema
- [ ] Phase 3 — Canvas Implementation
- [ ] Phase 4 — Components
- [ ] Phase 5 — Templates
- [ ] Phase 6 — Project System
- [ ] Phase 7 — Code Generation
- [ ] Phase 8 — Agent Handoff
- [ ] Phase 9 — AI Integration
- [ ] Phase 10 — Git
- [ ] Phase 11 — Docker
- [ ] Phase 12 — Testing
- [ ] Phase 13 — Beta

## Getting Started

### Docker



### Development



## License

[To be determined — core MIT, some components may vary]

## Current Progress

The project has reached Phase 1 with the following features implemented:

1. **Core Infrastructure**
   - Project directory structure
   - TypeScript configuration
   - Basic server setup with Hono
   - Database connection with Drizzle ORM
   - Migration system

2. **Validation System**
   - Zod schemas for all JSON schemas
   - Validation utilities and helpers
   - Validation middleware for API endpoints
   - Frontend validation hooks

3. **UI Components**
   - Core UI components (Button, Input, Card, Navbar, Chart, Table)
   - Component library integration

4. **Design System**
   - Design token system with editor

5. **Flow Editor**
   - Flow editor canvas with drag-and-drop functionality

The next phase will focus on completing the canvas implementation and integrating with the AI layer to provide a complete visual software building experience.
