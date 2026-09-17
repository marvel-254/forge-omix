# 14 — Research Tools

## 14.1 Research Methodology

All tools in this document were evaluated against:
- **License:** MIT/Apache/BSD only (no GPL/AGPL in core)
- **Bundle size:** < 50KB gzipped for frontend libraries
- **Maintenance:** Active development (last release < 6 months)
- **Self-hostable:** No mandatory cloud dependencies
- **Agent compatibility:** Works with AI coding agents

## 14.2 Frontend Stack

| Tool | License | Bundle | Usage | Recommendation |
|------|---------|--------|-------|----------------|
| React 19 | MIT | 40KB | UI framework | ✅ USE |
| Vite 6 | MIT | N/A (build tool) | Build system | ✅ USE |
| TypeScript 5 | Apache 2.0 | N/A | Type safety | ✅ USE |
| Tailwind CSS 4 | MIT | ~10KB purged | Styling | ✅ USE |

## 14.3 Canvas & Editing

| Tool | License | Bundle | Usage | Recommendation |
|------|---------|--------|-------|----------------|
| Puck | MIT | 10KB | Canvas engine | ✅ USE |
| @dnd-kit | MIT | 6KB | Drag and drop | ✅ USE |
| CodeMirror 6 | MIT | ~200KB | Code editing | ✅ USE (lazy-loaded) |
| tldraw SDK | Commercial | - | Canvas engine | ❌ AVOID (license) |
| GrapesJS | BSD-3 | 80KB | Canvas engine | ⚠️ CONSIDER |

## 14.4 UI Libraries

| Tool | License | Bundle | Usage | Recommendation |
|------|---------|--------|-------|----------------|
| @radix-ui/themes | MIT | 15KB | Accessible components | ✅ USE |
| shadcn/ui | MIT | Varies | Component patterns | ✅ USE (copy pattern) |
| @radix-ui/primitives | MIT | ~20KB | Low-level primitives | ⚠️ CONSIDER |
| Lucide React | MIT | ~5KB tree-shaken | Icons | ✅ USE |

## 14.5 State Management

| Tool | License | Bundle | Usage | Recommendation |
|------|---------|--------|-------|----------------|
| Zustand | MIT | 1KB | Global state | ✅ USE |
| Yjs | MIT | ~15KB | CRDT sync | ✅ USE |
| Jotai | MIT | 4KB | Atomic state | ⚠️ CONSIDER |

## 14.6 Backend

| Tool | License | Bundle | Usage | Recommendation |
|------|---------|--------|-------|----------------|
| Hono | MIT | ~25KB | HTTP server | ✅ USE |
| Drizzle ORM | MIT | ~10KB | Database ORM | ✅ USE |
| Zod | MIT | ~12KB | Validation | ✅ USE |
| @libsql/client | MIT | ~50KB | Database driver | ✅ USE |

## 14.7 AI Providers

| Tool | License | Usage | Recommendation |
|------|---------|-------|----------------|
| OpenRouter | - | Provider aggregation | ✅ USE |
| Ollama | MIT | Local LLM serving | ✅ USE |
| Vercel AI SDK | MIT | Multi-provider | ⚠️ CONSIDER |

## 14.8 Testing

| Tool | License | Usage | Recommendation |
|------|---------|-------|----------------|
| Vitest | MIT | Unit testing | ✅ USE |
| Playwright | MIT | E2E testing | ✅ USE |
| Testing Library | MIT | Component testing | ✅ USE |
| axe-core | MIT | Accessibility testing | ✅ USE |

## 14.9 DevOps

| Tool | License | Usage | Recommendation |
|------|---------|-------|----------------|
| Docker | Apache 2.0 | Containerization | ✅ USE |
| GitHub Actions | MIT | CI/CD | ✅ USE |
| Nginx | BSD-2 | Reverse proxy | ✅ USE |

## 14.10 Full Research Matrix

> **Note:** The complete 100+ tool research matrix is documented in `research/tools-matrix.md` (being generated in parallel).

---

## Key Takeaways

1. **React + Vite + TypeScript** — Unmatched ecosystem, best agent compatibility
2. **Puck + dnd-kit** — Lightweight, MIT, production-ready canvas
3. **LibSQL + Drizzle** — Embedded, server-capable, zero-config
4. **Zustand + Yjs** — Minimal footprint, excellent TypeScript support
5. **OpenRouter + Ollama** — Provider-agnostic AI, local-first option

**Avoid at all costs:**
- Electron (150MB+ bundle)
- tldraw SDK (commercial license required)
- Prisma (binary engine, large, GPL-adjacent dependencies)
- Lucia Auth (deprecated)
- Monaco Editor (3MB, too heavy)
