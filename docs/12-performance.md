# 12 — Performance

## 12.1 Performance Targets

| Metric | Target | Why |
|--------|--------|-----|
| Initial load | < 2s on 3G | Users won't wait |
| Canvas FPS | 60fps @ 500 components | Smooth interaction |
| Memory idle | < 200MB with 10 pages | Fits on 8GB machines |
| Save to backend | < 100ms | No perceptible lag |
| Code generation | < 5s for 10 pages | Near-instant feedback |
| Project switch | < 500ms | Fast iteration |
| Bundle size | < 500KB gzipped initial | Fast downloads |
| Docker build | < 5 minutes | Fast iteration |

## 12.2 Bundle Optimization

### Code Splitting Strategy
```
/app (shell)
  → /canvas (visual editor)         [lazy]
  → /panels (all side panels)       [lazy]
  → /ai (AI interaction panel)      [lazy]
  → /codegen (code preview/editor)  [lazy]
  → /charts (chart components)      [lazy]
```

### Tree Shaking
- All imports are ES modules
- No `import * as` patterns
- Side-effect-free package.json flags
- Dead code elimination via `knip` in CI

### Asset Optimization
- Images: WebP with fallbacks
- Fonts: Subset, self-hosted, `font-display: swap`
- Icons: SVG sprites (no icon fonts)
- CSS: Tailwind purges unused classes

## 12.3 Runtime Performance

### Canvas Rendering
- Absolute positioning with `transform` (GPU accelerated)
- `contain: layout style paint` per component
- `content-visibility: auto` for off-screen items
- Virtual rendering: only viewport components in DOM

### Drag and Drop
- dnd-kit with `closestCenter` collision
- No schema updates during drag (local position state)
- CSS-only drag preview
- Transform updates, not layout thrashing

### State Updates
- Zustand selectors for minimal re-renders
- Structural sharing (immutable updates)
- Debounced persistence (300ms)
- Batch updates where possible

### Memory Management
- Flat component maps (not deep trees)
- Yjs undo stack capped at 1000 entries
- Blob URLs for large assets (not base64)
- Explicit cleanup on component unmount

## 12.4 Backend Performance

### Database
- WAL mode for LibSQL (concurrent reads)
- Prepared statements for frequent queries
- Indexes on: project_id, page_id, component_type
- Schema versions table for fast migration checks

### API Response Caching
- Schema responses: ETag + 304
- Template list: Cache-Control: 1 hour
- Asset metadata: In-memory cache
- No caching of code generation (always fresh)

## 12.5 Monitoring

### Build-Time Checks
- `vite-bundle-visualizer` weekly
- Bundle size regression test in CI
- Lighthouse score threshold: > 80 performance

### Runtime Monitoring
- Long Task API for jank detection
- Memory usage logging (if > 150MB, warn)
- Canvas FPS overlay in dev mode
- Backend response time metrics

## 12.6 Degradation Strategy

If canvas hits performance limits:
1. **Virtual rendering:** Only render visible viewport + 200px margin
2. **Simplified drag:** Show bounding box only during drag
3. **Disable effects:** No box-shadows, no backdrop-blur in large projects
4. **Worker offload:** Schema validation in Web Worker
5. **Lazy panels:** Properties panel only mounts when component selected

If backend hits limits:
1. **Connection pooling:** Reuse DB connections
2. **Read replicas:** For future server mode
3. **Response compression:** Brotli for JSON
4. **Rate limiting:** Prevent abuse
