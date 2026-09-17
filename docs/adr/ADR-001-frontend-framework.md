# ADR-001 — Frontend Framework

## Status: ACCEPTED

## Context

The frontend must be a visual canvas editor that renders 500+ components at 60fps. It needs excellent TypeScript support, fast development iteration, and small bundle size. The framework choice impacts every other decision.

## Options

| Framework | Bundle (gzip) | DX | SSR | Learning Curve |
|-----------|---------------|-----|-----|----------------|
| React 19 + Vite | ~40KB | Excellent | No | Low |
| Next.js 15 | ~65KB + server | Excellent | Yes | Medium |
| Svelte 5 + Vite | ~15KB | Good | No | Low |
| Vue 3 + Vite | ~35KB | Good | No | Low |
| Remix | ~55KB | Good | Yes | Medium |

## Evaluation

**React 19 advantages:**
- Largest ecosystem (Puck, dnd-kit, Yjs all React-first)
- Concurrent features (useTransition for canvas updates)
- Most AI agents trained on React code
- Best TypeScript support
- User familiarity

**Why not Next.js:**
- SSR not needed for visual canvas (fully client-side)
- Server components add complexity for no benefit
- Larger bundle and build tooling
- Hydration overhead on initial load

**Why not Svelte/Vue:**
- Smaller ecosystem for canvas libraries
- Fewer AI coding agent resources
- Puck is React-only

## Decision

**React 19 + Vite 6** — Fastest dev server, smallest effective bundle (tree-shaking), best ecosystem alignment.

## Consequences

- Positive: Best library compatibility
- Positive: Largest hiring pool
- Positive: Fastest HMR for development
- Negative: Larger runtime than Svelte (mitigated by code splitting)
- Negative: Need to manage state manually (Zustand chosen)
