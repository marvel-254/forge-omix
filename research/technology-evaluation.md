# Omix Builder — Technology Evaluation

> Generated: 2026-09-16 | For: Omix Builder (forge@omix) — AI-native visual builder for low-powered machines

## 1. Visual Editor Architecture

### 1.1 Option A: Puck (Headless Editor)

**Description**: Puck is a headless visual editor that renders a component tree from JSON. It provides drag-and-drop, property panels, and responsive previews, but leaves the UI chrome to the implementer.

**Evaluation Criteria**:

| Criterion | Score (1-5) | Reasoning |
|---|---|---|
| Lightweight | 5 | ~150KB bundle, pure React, no heavy dependencies |
| Self-hostable | 5 | No server required, pure client-side |
| AI-friendly | 4 | JSON output is structured and parseable; easy for LLMs to generate |
| Extensibility | 4 | Component-based; easy to add custom components |
| Documentation | 5 | Excellent docs, examples, and TypeScript types |
| Maintenance | 5 | Monthly releases, backed by Measured |
| Low-resource | 5 | Works on any device that runs React |

**Pros**:
- Clean JSON spec output (ideal for AI generation)
- Framework-agnostic data format
- Drop-in React component
- MIT license
- Active development

**Cons**:
- Not a full-page builder out-of-the-box (requires extension)
- Smaller ecosystem than GrapesJS
- Limited built-in styling options

**Verdict**: **STRONG CANDIDATE** — Use as the primary editor layer. Extend with custom components and full-page layout support.

---

### 1.2 Option B: GrapesJS

**Description**: Mature visual HTML builder with plugin architecture, template engine, and component system.

**Evaluation Criteria**:

| Criterion | Score (1-5) | Reasoning |
|---|---|---|
| Lightweight | 3 | ~2.5MB full, ~800KB core |
| Self-hostable | 5 | Pure client-side, no server |
| AI-friendly | 3 | HTML/CSS output (less structured than JSON) |
| Extensibility | 5 | Mature plugin system |
| Documentation | 4 | Good docs, many examples |
| Maintenance | 4 | Quarterly releases, stable |
| Low-resource | 3 | Heavier than Puck |

**Pros**:
- Most mature open-source visual HTML builder
- Plugin ecosystem (many community plugins)
- HTML/CSS output (familiar to developers)
- Template system

**Cons**:
- HTML/CSS output is less AI-friendly than JSON
- Older architecture (not React-native by default)
- Heavier bundle
- More complex integration for React apps

**Verdict**: **ALTERNATIVE** — Use if full HTML/CSS output is preferred over JSON specs. Good fallback if Puck proves too limited.

---

### 1.3 Option C: Custom Editor (tldraw-based)

**Description**: Build a custom editor using tldraw SDK as the canvas engine.

**Evaluation Criteria**:

| Criterion | Score (1-5) | Reasoning |
|---|---|---|
| Lightweight | 4 | ~500KB for tldraw SDK |
| Self-hostable | 5 | No server required |
| AI-friendly | 5 | Custom format optimized for AI |
| Extensibility | 5 | Fully customizable |
| Documentation | 4 | Good SDK docs |
| Maintenance | 3 | Custom code to maintain |
| Low-resource | 4 | Canvas-based, efficient |

**Pros**:
- Maximum control over UX and data format
- Can optimize spec format for AI generation
- No architectural constraints
- Canvas-based rendering is performant

**Cons**:
- High development cost (months of work)
- Must maintain custom solution
- Risk of bugs and edge cases

**Verdict**: **FUTURE OPTION** — Only if Puck/GrapesJS prove insufficient. Start with Puck and migrate to custom if needed.

---

## 2. Output Format: Spec vs Code

### 2.1 Option A: Spec-First (JSON-Based)

**Description**: Omix outputs a structured JSON spec that describes the UI (components, props, layout, styles). Code generation is a separate step.

**Evaluation**:

| Aspect | Assessment |
|---|---|
| AI generation | ✅ Excellent — JSON is the most LLM-friendly format |
| Multi-framework | ✅ Generate React, Vue, Svelte, React Native from one spec |
| Version control | ✅ Diff-able, merge-able |
| Human editing | ⚠️ Readable but verbose for complex UIs |
| Tool ecosystem | ⚠️ Custom format, needs tooling |
| Performance | ✅ Lightweight spec, code generated on demand |

**Pros**:
- LLMs are trained on JSON; generation is reliable
- Single spec can target multiple frameworks
- Specs are smaller than generated code
- Easy to validate with JSON Schema

**Cons**:
- Requires code generation step
- New format to learn/document
- Potential mismatch between spec and generated code

**Verdict**: **RECOMMENDED** — Spec-first aligns with AI-native goals and multi-framework support.

---

### 2.2 Option B: Code-First (Direct Code Generation)

**Description**: Omix generates framework-specific code directly from visual edits.

**Evaluation**:

| Aspect | Assessment |
|---|---|
| AI generation | ⚠️ Code is harder to generate reliably |
| Multi-framework | ❌ Requires separate generators per framework |
| Version control | ⚠️ Code diffs are harder to read |
| Human editing | ✅ Developers can read and edit directly |
| Tool ecosystem | ✅ Standard code tools work |
| Performance | ✅ No intermediate step |

**Pros**:
- Direct output, no transformation needed
- Familiar format for developers
- Existing tooling (linters, formatters) works

**Cons**:
- LLMs make more errors generating code than JSON
- Harder to support multiple frameworks
- Generated code may not match user's coding style

**Verdict**: **NOT RECOMMENDED as primary** — Code-first loses the AI-friendly advantage. Use as an output target from specs.

---

### 2.3 Option C: Hybrid (Spec + Code Preview)

**Description**: Omix stores specs but provides real-time code preview in multiple frameworks.

**Evaluation**:

| Aspect | Assessment |
|---|---|
| AI generation | ✅ Spec is AI-friendly |
| Multi-framework | ✅ Code preview for each target |
| Version control | ✅ Specs are diff-able |
| Human editing | ✅ Code preview familiar to devs |
| Tool ecosystem | ⚠️ Needs custom tooling |
| Performance | ✅ Code generation on demand |

**Pros**:
- Best of both worlds
- AI generates specs, developers see code
- Flexibility for different workflows

**Cons**:
- More complex implementation
- Must maintain code generators

**Verdict**: **RECOMMENDED** — Hybrid approach maximizes flexibility. Store specs, generate code on demand.

---

## 3. AI Architecture

### 3.1 Option A: Cloud-Only AI

**Description**: All AI processing happens on cloud servers (OpenAI, Anthropic, etc.).

**Evaluation**:

| Aspect | Assessment |
|---|---|
| Latency | ⚠️ Network-dependent, 1-10s per request |
| Offline | ❌ Requires internet |
| Low-resource | ✅ Client is lightweight |
| Privacy | ❌ Data leaves user's machine |
| Cost | ⚠️ Per-token pricing, can be expensive |
| Capability | ✅ Best models (GPT-4, Claude 4) |

**Pros**:
- Most capable models
- No local setup
- Always up-to-date

**Cons**:
- Not offline-capable
- Privacy concerns
- Ongoing cost
- Network dependency

**Verdict**: **NOT RECOMMENDED as primary** — Opposes Omix's low-resource, offline-capable goals. Use as an optional cloud add-on.

---

### 3.2 Option B: Local-Only AI

**Description**: All AI processing happens locally using Ollama/llama.cpp.

**Evaluation**:

| Aspect | Assessment |
|---|---|
| Latency | ✅ Fast once loaded (no network) |
| Offline | ✅ Fully offline |
| Low-resource | ❌ Large models need 8GB+ RAM |
| Privacy | ✅ Data stays on machine |
| Cost | ✅ Free after hardware |
| Capability | ⚠️ Limited to small models (1-13B) |

**Pros**:
- Fully offline
- Privacy-preserving
- No ongoing cost

**Cons**:
- Limited model capability on low-powered machines
- Model loading time
- Large disk space for models
- Smaller models make more errors

**Verdict**: **RECOMMENDED as primary** — Use small models (1-7B) for local inference. Accept quality trade-off for offline capability.

---

### 3.3 Option C: Hybrid AI (Local + Cloud)

**Description**: Default to local AI; optionally use cloud for complex tasks.

**Evaluation**:

| Aspect | Assessment |
|---|---|
| Latency | ✅ Fast for simple tasks (local) |
| Offline | ✅ Core features work offline |
| Low-resource | ✅ Local for simple, cloud for complex |
| Privacy | ⚠️ Cloud sends data (opt-in) |
| Cost | ✅ Local free; cloud pay-per-use |
| Capability | ✅ Best of both worlds |

**Pros**:
- Works offline for core features
- Cloud for complex tasks
- User chooses privacy/cost balance

**Cons**:
- More complex implementation
- Fallback logic needed
- Potential UX inconsistency

**Verdict**: **RECOMMENDED** — Hybrid is the best user experience. Default to local, offer cloud for complex tasks.

---

## 4. Rendering Engine

### 4.1 Option A: SVG-Based Rendering

**Description**: Render UI previews as SVG elements.

**Evaluation**:

| Aspect | Assessment |
|---|---|
| Performance | ✅ GPU-accelerated, low CPU |
| Low-resource | ✅ Works on 2GB RAM machines |
| Scalability | ✅ Vector scales to any resolution |
| Interactivity | ⚠️ Requires event handlers on elements |
| Export | ✅ Direct SVG export for assets |
| Accessibility | ✅ Semantic elements, screen-reader friendly |

**Pros**:
- Lightweight on low-powered machines
- Native scaling (no pixelation)
- Easy to export as assets
- CSS styling possible

**Cons**:
- Complex layouts can be verbose
- Text rendering differs across browsers
- Very large SVGs can slow down

**Verdict**: **RECOMMENDED for previews** — SVG is ideal for rendering UI previews on low-powered machines.

---

### 4.2 Option B: Canvas-Based Rendering

**Description**: Render UI previews using HTML5 Canvas (Konva/Fabric.js).

**Evaluation**:

| Aspect | Assessment |
|---|---|
| Performance | ✅ Fast for many elements |
| Low-resource | ✅ WebGL acceleration available |
| Scalability | ⚠️ Raster; scales require re-render |
| Interactivity | ✅ Built into canvas libraries |
| Export | ⚠️ PNG/JPEG export only |
| Accessibility | ❌ Canvas is opaque to screen readers |

**Pros**:
- Best for many elements (1000+)
- WebGL acceleration
- Mature libraries (Konva, Fabric.js)

**Cons**:
- Not accessible by default
- Raster output (pixelation on zoom)
- Harder to export as structured data

**Verdict**: **USE FOR EDITOR CHROME** — Canvas is ideal for editor overlays (selection handles, grids, guides) but not for the main UI preview.

---

### 4.3 Option C: DOM-Based Rendering

**Description**: Render UI previews as actual HTML/CSS in a sandboxed iframe.

**Evaluation**:

| Aspect | Assessment |
|---|---|
| Performance | ⚠️ Browser-dependent |
| Low-resource | ⚠️ Heavy DOM is slow on low-end machines |
| Scalability | ⚠️ Thousands of DOM nodes slow down |
| Interactivity | ✅ Native browser interactions |
| Export | ✅ Direct code copy |
| Accessibility | ✅ Native accessibility |

**Pros**:
- Pixel-perfect rendering
- Native interactions
- Direct code inspection

**Cons**:
- Heavy on low-powered machines
- Security considerations (sandboxing)
- Performance degrades with complexity

**Verdict**: **NOT RECOMMENDED for low-resource** — DOM rendering is too heavy for Omix's target machines. Use SVG for previews, DOM for final output only.

---

## 5. State Management Architecture

### 5.1 Option A: Zustand + Immer

**Description**: Minimalist state management with immutable update helpers.

**Evaluation**:

| Aspect | Assessment |
|---|---|
| Bundle size | ✅ ~3KB (Zustand) + ~8KB (Immer) |
| Learning curve | ✅ Minimal |
| TypeScript | ✅ Excellent |
| DevTools | ✅ Redux DevTools integration |
| Performance | ✅ Selective re-renders |

**Verdict**: **RECOMMENDED** — Lightweight, simple, performant. Perfect for Omix editor state.

---

### 5.2 Option B: Jotai

**Description**: Atomic state management derived from Recoil.

**Evaluation**:

| Aspect | Assessment |
|---|---|
| Bundle size | ✅ ~5KB |
| Learning curve | ⚠️ New mental model (atoms) |
| TypeScript | ✅ Excellent |
| DevTools | ✅ Available |
| Performance | ✅ Fine-grained re-renders |

**Verdict**: **ALTERNATIVE** — Use if complex derived state is needed. Zustand is simpler for most cases.

---

### 5.3 Option C: XState

**Description**: Finite state machine for complex state transitions.

**Evaluation**:

| Aspect | Assessment |
|---|---|
| Bundle size | ⚠️ ~20KB |
| Learning curve | ⚠️ Steep (FSM concepts) |
| TypeScript | ✅ Excellent |
| DevTools | ✅ Stately visual editor |
| Performance | ✅ Predictable transitions |

**Verdict**: **USE FOR EDITOR STATES** — XState is ideal for editor state machine (idle → selecting → dragging → editing). Use alongside Zustand for data.

---

## 6. Database Architecture

### 6.1 Option A: SQLite / libSQL (Local-First)

**Description**: Embedded database running in-process.

**Evaluation**:

| Aspect | Assessment |
|---|---|
| Setup | ✅ Zero configuration |
| Performance | ✅ Fast for local reads |
| Low-resource | ✅ Minimal footprint |
| Offline | ✅ Fully offline |
| Multi-user | ❌ Single-process |
| Sync | ⚠️ libSQL adds sync capabilities |

**Verdict**: **RECOMMENDED** — SQLite is the default for Omix local projects. libSQL adds optional sync.

---

### 6.2 Option B: PostgreSQL (Server)

**Description**: Full RDBMS for server deployments.

**Evaluation**:

| Aspect | Assessment |
|---|---|
| Setup | ⚠️ Requires server setup |
| Performance | ✅ Excellent |
| Low-resource | ⚠️ Requires 1GB+ RAM |
| Offline | ❌ Requires running server |
| Multi-user | ✅ Full multi-user support |
| Sync | ✅ Built-in replication |

**Verdict**: **USE FOR SERVER DEPLOYMENTS** — PostgreSQL is the standard for multi-user Omix server setups.

---

### 6.3 Option C: IndexedDB (Browser)

**Description**: Browser-native NoSQL database.

**Evaluation**:

| Aspect | Assessment |
|---|---|
| Setup | ✅ Built into browsers |
| Performance | ⚠️ Async, can be slow |
| Low-resource | ✅ Runs in browser |
| Offline | ✅ Fully offline |
| Multi-user | ❌ Single-browser |
| Sync | ⚠️ Custom sync needed |

**Verdict**: **NOT RECOMMENDED** — SQLite (via WASM) is better for structured data. Use IndexedDB only for caching/blobs.

---

## 7. Multi-Framework Code Generation

### 7.1 Framework Priority Order

Based on market share, AI agent familiarity, and Omix alignment:

| Priority | Framework | Reason |
|---|---|---|
| 1 | React | Largest ecosystem, best AI agent support, shadcn/ui |
| 2 | Next.js | React + SSR, Vercel deployment, most AI-generated |
| 3 | Vue 3 | Growing ecosystem, Composition API, Pinia |
| 4 | Svelte 5 | Lightweight, signals, growing adoption |
| 5 | React Native | Mobile target, shares React patterns |
| 6 | SolidJS | Emerging, fine-grained reactivity |

### 7.2 Code Generator Architecture

**Recommended Approach**: Single AST → Multiple Printers

1. Omix spec → Internal AST (framework-agnostic)
2. Internal AST → Framework-specific AST (React, Vue, Svelte, etc.)
3. Framework AST → Code string (using esrap or framework-specific printer)
4. Code string → Prettier formatting

**Benefits**:
- Add new frameworks by writing a new printer
- Shared validation and optimization passes
- Consistent output quality

---

## 8. Performance Optimization for Low-Powered Machines

### 8.1 Target Specifications

| Resource | Minimum | Recommended |
|---|---|---|
| RAM | 2GB | 4GB |
| CPU | 2 cores | 4 cores |
| Storage | 500MB | 2GB |
| GPU | None (software rendering) | Basic WebGL |

### 8.2 Optimization Strategies

| Strategy | Implementation |
|---|---|
| **Virtualization** | Only render visible elements; virtualize canvas |
| **Web Workers** | Run code generation and AI inference off main thread |
| **Lazy loading** | Load components and icons on demand |
| **SVG previews** | Use SVG instead of DOM for rendering previews |
| **Incremental saves** | Save only changed parts of spec |
| **Debounced AI** | Don't call AI on every keystroke; debounce |
| **Model quantization** | Use quantized models (Q4, Q5) for local AI |
| **Tree-shaking** | Generate only needed component code |

### 8.3 Memory Management

| Concern | Solution |
|---|---|
| Large specs (1000+ components) | Paginate; load sections on demand |
| Image assets | Store as references, not base64 |
| AI model loading | Unload model when not in use |
| Canvas elements | Pool and reuse; destroy offscreen |
| Undo history | Limit depth (50 states); diff-based |

---

## 9. AI Model Strategy

### 9.1 Local Models

| Model | Size | Use Case | RAM Required |
|---|---|---|---|
| Llama 3.2 1B | 1B params | Simple component generation | 2GB |
| Llama 3.2 3B | 3B params | Component + layout | 4GB |
| Code Llama 7B | 7B params | Full code generation | 8GB |
| Mistral 7B | 7B params | General purpose | 8GB |
| Phi-3 Mini | 3.8B params | Lightweight, capable | 4GB |

**Recommendation**: Default to Llama 3.2 3B (4GB RAM). Offer 1B for 2GB machines.

### 9.2 Cloud Models (Optional)

| Model | Provider | Use Case | Cost |
|---|---|---|---|
| GPT-4o | OpenAI | Complex code generation | $2.50/1M tokens |
| Claude 4 Sonnet | Anthropic | Best code quality | $3.00/1M tokens |
| Gemini Flash | Google | Fast, cheap | $0.10/1M tokens |
| Llama 3.1 405B | Cloudflare | Open-source quality | Free tier available |

**Recommendation**: Use LiteLLM to route to cheapest capable model.

---

## 10. Integration Complexity Assessment

### 10.1 High Complexity (Plan for 2-4 weeks)

| Integration | Complexity | Reason |
|---|---|---|
| Puck editor extension | High | Must build full-page support |
| Code generators (multi-framework) | High | Each framework has quirks |
| AI agent API | High | Must handle streaming, errors, retries |
| Figma import | High | Figma API is complex; node mapping is hard |

### 10.2 Medium Complexity (Plan for 1-2 weeks)

| Integration | Complexity | Reason |
|---|---|---|
| Ollama integration | Medium | Docker setup, model management |
| TanStack Table | Medium | Many configuration options |
| Yjs collaboration | Medium | CRDT concepts are complex |
| TipTap editor | Medium | Extension system needs study |
| Drizzle ORM | Medium | Schema definition and migrations |

### 10.3 Low Complexity (Plan for 1-3 days)

| Integration | Complexity | Reason |
|---|---|---|
| Tailwind CSS | Low | Standard PostCSS plugin |
| shadcn/ui | Low | Copy-paste components |
| Zustand | Low | Minimal API |
| Prettier | Low | Standard formatting |
| Vitest | Low | Drop-in Jest replacement |
| Lucide icons | Low | React component library |
| Zod | Low | Simple schema API |
| nanoid | Low | Single function |

---

## 11. Security Architecture

### 11.1 Threat Model

| Threat | Severity | Mitigation |
|---|---|---|
| **XSS in generated code** | High | Sanitize all dynamic content; use JSX not innerHTML |
| **AI prompt injection** | High | Sandbox AI execution; validate AI output before rendering |
| **Malicious specs** | Medium | Validate spec with Zod; reject unknown component types |
| **Supply chain attacks** | Medium | Pin dependencies; audit with license-checker; use lockfiles |
| **Unauthorized access** | Medium | Better Auth with RBAC; session management |
| **Data leakage (AI)** | High | Default to local AI; cloud AI is opt-in with consent |
| **CSRF/XSS in editor** | Medium | CSP headers; SameSite cookies; sanitize all inputs |

### 11.2 AI Security

| Concern | Solution |
|---|---|
| AI generates malicious code | Sandbox execution; validate AST before running |
| Prompt injection in spec | Escape special characters; use structured prompts |
| Model inversion (privacy) | Local AI by default; differential privacy for cloud |
| AI hallucination | Validate output against schema; require human confirmation |

---

## 12. Deployment Strategy

### 12.1 Local Desktop

| Technology | Recommendation |
|---|---|
| **Tauri** | ✅ Recommended — Rust-based, tiny (~10MB), secure |
| Electron | ❌ Heavy (~100MB), memory-hungry |
| PWA | ⚠️ Limited filesystem access, no native APIs |
| Web app | ⚠️ Requires browser, no offline guarantee |

**Tauri Details**:
- MIT license
- ~10MB app size (vs 100MB+ Electron)
- Uses system WebView (no bundled Chromium)
- Rust backend for filesystem, AI, and native APIs
- Excellent TypeScript support

**Verdict**: **USE TAURI** for Omix desktop app. Perfect fit for low-powered machines.

---

### 12.2 Self-Hosted Server

| Technology | Recommendation |
|---|---|
| **Docker Compose** | ✅ Recommended — simple, standard |
| Kubernetes | ❌ Overkill for most deployments |
| Coolify | ✅ Good for managed self-hosting |
| Bare metal | ⚠️ Possible but complex |

**Recommended Stack**:
- Docker Compose with Omix app + PostgreSQL + Ollama
- Optional: Redis for caching, MinIO for storage
- Reverse proxy: Caddy (automatic HTTPS)

---

### 12.3 Cloud Deployment

| Platform | Recommendation |
|---|---|
| **Coolify** | ✅ Self-hosted, full control |
| Vercel | ⚠️ Good for Next.js output, not Omix itself |
| Railway | ⚠️ Simple, but vendor lock-in |
| Render | ⚠️ Alternative to Railway |

---

## 13. Recommended Architecture Summary

### 13.1 Frontend (Editor)

| Layer | Technology | License |
|---|---|---|
| Framework | React 18+ | MIT |
| Editor Core | Puck (extended) | MIT |
| Canvas Overlays | Konva | MIT |
| Components | shadcn/ui | MIT |
| Styling | Tailwind CSS + Open Props | MIT |
| State | Zustand + Immer | MIT |
| Editor State Machine | XState | MIT |
| Icons | Lucide | ISC |
| AI Chat | Custom (LiteLLM client) | MIT |

### 13.2 Code Generation

| Layer | Technology | License |
|---|---|---|
| AST Core | Babel | MIT |
| AST Pruning | SWC (optional) | Apache-2.0 |
| Code Printer | esrap | MIT |
| Formatter | Prettier | MIT |
| Linter | ESLint | MIT |
| Validators | Zod | MIT |

### 13.3 Backend (Server Mode)

| Layer | Technology | License |
|---|---|---|
| API Framework | Hono | MIT |
| Database | PostgreSQL / SQLite | PostgreSQL License / Public Domain |
| ORM | Drizzle ORM | Apache-2.0 |
| Auth | Better Auth | MIT |
| Storage | MinIO | AGPL-3.0 (or commercial) |
| AI | LiteLLM + Ollama | MIT |
| Realtime | Yjs + y-websocket | MIT |

### 13.4 Desktop App

| Layer | Technology | License |
|---|---|---|
| Shell | Tauri | MIT |
| Runtime | System WebView | — |
| Local DB | SQLite/libSQL | MIT |
| Local AI | Ollama | MIT |

### 13.5 Testing & Quality

| Layer | Technology | License |
|---|---|---|
| Unit Tests | Vitest | MIT |
| E2E Tests | Playwright | Apache-2.0 |
| A11y Tests | axe-core | MPL-2.0 |
| Component Tests | Testing Library | MIT |
| Visual Regression | Playwright screenshots | Apache-2.0 |

---

## 14. Development Phases

### Phase 1: Foundation (Weeks 1-4)

- [ ] Set up React + TypeScript + Tailwind project
- [ ] Integrate Puck editor
- [ ] Define Omix spec JSON Schema
- [ ] Build basic component library (shadcn/ui)
- [ ] Implement React code generator
- [ ] Add Prettier formatting

### Phase 2: AI Integration (Weeks 5-8)

- [ ] Integrate Ollama for local AI
- [ ] Build LiteLLM client for cloud AI
- [ ] Implement AI chat-to-spec
- [ ] Add AI-assisted component suggestions
- [ ] Spec validation with Zod

### Phase 3: Editor Enhancement (Weeks 9-12)

- [ ] Extend Puck with full-page layout
- [ ] Add canvas overlays (Konva) for selection/guides
- [ ] Implement undo/redo (Zustand + Immer)
- [ ] Add property panel
- [ ] Responsive preview modes

### Phase 4: Multi-Framework (Weeks 13-16)

- [ ] Vue code generator
- [ ] Svelte code generator
- [ ] Code preview panel (multi-framework)
- [ ] Framework switching in UI

### Phase 5: Collaboration (Weeks 17-20)

- [ ] Yjs integration for real-time collaboration
- [ ] Presence/cursors
- [ ] Conflict resolution
- [ ] Version history

### Phase 6: Deployment (Weeks 21-24)

- [ ] Tauri desktop app
- [ ] Docker deployment
- [ ] Self-hosted server mode
- [ ] Authentication (Better Auth)

---

## 15. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Puck maintenance stops | Low | High | Fork or contribute; GrapesJS fallback |
| Local AI quality insufficient | Medium | High | Hybrid AI with cloud fallback |
| Performance on 2GB machines | Medium | Medium | Aggressive optimization; SVG previews |
| AI agent API changes | Medium | Medium | Abstract AI layer; support multiple agents |
| Security vulnerability in generated code | Low | High | Sandbox execution; AST validation |
| Scope creep | High | Medium | Strict MVP; phased delivery |
| Competition from Lovable/Bolt | High | Medium | Differentiate on open-source + self-hosted |

---

## 16. Final Recommendations

### Do:
1. **Start with Puck** as the editor layer
2. **Use spec-first architecture** (JSON specs, code generation separate)
3. **Default to local AI** with cloud fallback
4. **Target Tauri** for desktop app
5. **Use Tailwind + shadcn/ui** as default component system
6. **Implement multi-framework** from day one (React first, Vue/Svelte next)
7. **Optimize for 2GB RAM machines** from the start (SVG previews, lazy loading)
8. **Use MIT/Apache-2.0** licenses exclusively

### Don't:
1. Don't build a custom editor from scratch (yet)
2. Don't generate code directly from visual edits (use specs)
3. Don't depend on cloud-only AI
4. Don't use Electron (too heavy)
5. Don't introduce GPL/AGPL dependencies
6. Don't optimize for powerful machines first
7. Don't try to match Figma/Webflow feature parity initially

---

*End of technology evaluation. All recommendations align with Omix Builder's goals: AI-native, open-source, self-hostable, low-resource-friendly.*
