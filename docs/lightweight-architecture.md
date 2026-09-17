# Lightweight Architecture Strategy

## Philosophy

Every byte counts. Every dependency is a liability. The target: a production-grade visual builder that runs smoothly on a 8GB RAM laptop with no GPU, launches in under 2 seconds, and stays under 200MB memory.

## Why Not Electron

| Metric | Electron | Tauri | PWA | Winner |
|--------|----------|-------|-----|--------|
| Bundle size | 150MB+ | 8-40MB | 0 (browser) | PWA |
| RAM idle | 187MB | 42MB | 30-60MB | PWA |
| Cold start | 1.8s | 0.3s | 0.1s | PWA |
| GPU required | Yes (Chromium) | No | No | PWA/Tauri |
| Offline capable | Yes | Yes | Yes (service worker) | All |
| Auto-update | Built-in | Built-in | Service worker | All |

**Decision:** PWA first. Browser-based, no install friction, auto-updates via service worker, works everywhere. Tauri deferred as optional desktop wrapper.

## JavaScript Budget

| Category | Budget (gzipped) | Justification |
|----------|-----------------|---------------|
| React runtime | ~13KB | Core UI framework |
| State (Zustand + Yjs) | ~15KB | Project state + collaboration |
| UI library (Radix themes) | ~15KB | Accessible components |
| Canvas (Puck core) | ~10KB | Visual editor |
| Tailwind (used classes) | ~10KB | Purged at build time |
| Charts (if needed) | ~20KB | Lazy-loaded |
| Code editor (CodeMirror) | ~30KB | Lazy-loaded |
| Image editor (react-image-crop) | ~10KB | Lazy-loaded |
| SVG sanitizer (dompurify) | ~15KB | Lazy-loaded |
| Other utilities | ~10KB | Fetch, date, etc. |
| **Total initial** | **~148KB** | Well under 500KB target |

## Dependency Audit Rules

1. **No zero-dependency illusion:** A package claiming "0 dependencies" often means small code, not zero cost. Audit the actual size.
2. **Transitive cost matters:** Check `npm ls --depth=10` before adding anything.
3. **Bundle analysis:** Run `vite-bundle-visualizer` weekly.
4. **Tree-shake test:** Verify dead code elimination works.
5. **Alternative check:** For every dependency >10KB, ask: "Can I write this in <50 lines?"

## Performance Strategies

### Initial Load
1. **Code splitting:** Every panel, the AI panel, and the code editor are lazy-loaded.
2. **Preload hints:** Preload critical components (canvas, toolbar).
3. **Service worker:** Cache app shell for instant repeat loads.
4. **No CDN falloffs:** All assets local, even fonts.

### Runtime Performance
1. **Virtualized lists:** Layer panel, component library use `@tanstack/react-virtual`.
2. **Memoized components:** React.memo on all canvas components.
3. **Canvas rendering:** Puck uses absolute positioning — GPU-accelerated transforms.
4. **Debounced saves:** 300ms debounce on schema changes to persistence.
5. **Web Workers:** Image processing, schema validation, code generation.

### Memory Management
1. **Schema normalization:** Components/pages stored as flat maps, not nested trees.
2. **Asset streaming:** Large images served as blob URLs, not base64.
3. **Canvas virtualization:** Off-screen components not rendered (only in-viewport).
4. **Explicit disposal:** `useEffect` cleanup for event listeners, observers.

## Database Choice: LibSQL

**Why LibSQL over SQLite:**
- Drop-in SQLite compatibility (same SQL, same file format)
- Embedded by default (zero configuration)
- Can scale to server mode if needed (same codebase)
- Turso-hosted option for remote backup (optional)
- No native bindings = works in browser, Deno, Bun, Node

**Why not PostgreSQL:**
- Requires a separate process or container
- Network overhead even on localhost
- More complex backup/restore
- Unnecessary for single-user local app

**Why not SQLite directly (better-sqlite3):**
- Native bindings = platform-specific builds
- No server mode option if we need it later
- Larger bundle (native module)

## Docker Strategy

**Target:** `docker compose up -d` with NO other commands.

```yaml
services:
  forge:
    build: .
    volumes:
      - forge-data:/data
    ports:
      - "3000:3000"
    restart: unless-stopped

volumes:
  forge-data:
```

**That's it.** No separate database container, no Redis, no queue workers. All in one process.

### Image Size Budget
| Component | Size |
|-----------|------|
| Node.js (Alpine) | ~50MB |
| Application code | ~10MB |
| LibSQL extension | ~5MB |
| Total | **~65MB** |

Well under 100MB target.

## Caching Strategy

| Layer | Mechanism | TTL |
|-------|-----------|-----|
| App shell | Service worker | Until new version |
| Schema data | Zustand in-memory | Session |
| Assets | Browser cache + CDN | 1 year (hashed names) |
| AI responses | LocalStorage | 24 hours |
| Code generation output | Filesystem | Until project change |

## Deferred (Not Rejected)

These are explicitly deferred to keep V1 lightweight:

| Feature | Defer to | Reason |
|---------|----------|--------|
| Real-time collaboration | Phase 5 | Yjs infrastructure heavy |
| Desktop wrapper (Tauri) | Phase 6 | Rust build complexity |
| Mobile app builder | Phase 8 | React Native toolchain |
| Plugin system | Phase 7 | Extension API needs design |
| Video export | Phase 9 | ffmpeg.wasm heavy |
| Multi-user accounts | Phase 6 | Auth system complexity |
| Analytics dashboard | Phase 9 | Tracking overhead |
| Built-in CI/CD | Never (use GitHub Agents) | Out of scope |

## Monitoring Performance

Track these in every release:

```bash
# Build analysis
npx vite-bundle-visualizer

# Bundle size
du -h dist/assets/*.js | sort -h

# Lighthouse
npx lighthouse http://localhost:3000 --output=json

# Docker image
docker images forge-omix --format "{{.Size}}"
```

## Budget Guards (CI/CD)

Fail the build if:
- Total JS bundle > 500KB gzipped
- Docker image > 100MB compressed
- Any single dependency > 50KB gzipped without justification
- Unused exports detected (knip)
- Bundle includes moment.js, lodash (full), or other heavy packages
