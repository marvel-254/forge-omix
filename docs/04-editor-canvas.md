# 04 — Editor Canvas

## 4.1 Canvas Requirements

The canvas is the core interaction surface. It must:

1. Render 500+ components at 60fps
2. Support drag-and-drop from component library
3. Enable multi-selection, resize, move, rotate
4. Snap to grid, guides, and component edges
5. Zoom (10%–500%) and pan without jank
6. Support desktop/tablet/mobile viewport switching
7. Show hover/focus/selection states
8. Maintain undo/redo with 1000+ steps

## 4.2 Technology Selection

| Technology | Role | Why |
|------------|------|-----|
| **Puck** | Canvas framework | MIT, React-native, headless, component-agnostic |
| **@dnd-kit** | Drag-and-drop | 6KB, accessible, performant |
| **Zustand** | Canvas state | Minimal, no re-render storms |
| **Yjs** | History/undo | CRDT snapshots, efficient |

### Why Puck over alternatives

| Alternative | Issue |
|-------------|-------|
| tldraw | Commercial license required (not free for production) |
| GrapesJS | jQuery legacy, heavy, not React-native |
| Craft.js | Unmaintained, complex API |
| Excalidraw | Whiteboard only, no component system |
| Build.io/Plasmic | Proprietary, vendor lock-in |

**Puck** is MIT, React-first, framework-agnostic (works with any component library), supports server components, and has no vendor lock-in.

## 4.3 Canvas Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Canvas Shell                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Viewport Frame                         │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │           Drop Zone (Puck)                   │  │ │
│  │  │                                              │  │ │
│  │  │  ┌──────────┐   ┌──────────────────────┐   │  │ │
│  │  │  │ Navbar   │   │     Content Area      │   │  │ │
│  │  │  │          │   │  ┌────┐  ┌────────┐  │   │  │ │
│  │  │  │          │   │  │Card│  │ Chart  │  │   │  │ │
│  │  │  │          │   │  └────┘  └────────┘  │   │  │ │
│  │  │  └──────────┘   └──────────────────────┘   │  │ │
│  │  │                                              │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Selection Overlay (SVG)                   │ │
│  │  - Bounding boxes                                  │ │
│  │  - Resize handles                                  │ │
│  │  - Snap guides                                     │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Zoom Controls                             │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 4.4 Interaction Model

### Drag and Drop Flow

```
1. User grabs component from library
2. dnd-kit creates drag preview
3. Canvas highlights valid drop zones
4. On drop: Puck inserts component at position
5. Schema Engine updates with new component
6. Yjs snapshots for undo
7. Canvas re-renders with selection on new component
```

### Selection Model

```typescript
interface SelectionState {
  ids: Set<string>       // Selected component IDs
  hoverId: string | null // Hover highlight
  dragId: string | null  // Currently dragging
  isMulti: boolean       // Multi-select mode
  pivotId: string        // Primary for alignment
}
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `V` | Select tool |
| `H` | Hand tool (pan) |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+A` | Select all |
| `Ctrl+D` | Duplicate |
| `Delete` | Remove selected |
| `Escape` | Deselect |
| `Arrow keys` | Nudge (1px, Shift=10px) |
| `Ctrl+G` | Group |
| `Ctrl+Shift+U` | Ungroup |

## 4.5 Responsive Design Model

### Breakpoint System

```typescript
const breakpoints = {
  mobile:  0,      // Default (mobile-first)
  tablet:  640,
  desktop: 1024,
  wide:    1440,
};
```

### Responsive Rules per Component

Each component stores overrides per breakpoint:

```json
{
  "props": { "size": "sm" },
  "responsive": {
    "tablet": { "props": { "size": "md" } },
    "desktop": { "props": { "size": "lg" }, "styles": { "fontSize": "18px" } }
  }
}
```

### Viewport Simulation

The canvas renders an iframe at the target viewport width, scaling to fit. This provides accurate rendering without needing the actual device.

## 4.6 Performance Implementation

### Canvas Rendering

1. **Absolute positioning** — Components positioned with `transform: translate(x, y)` for GPU acceleration
2. **Containment** — `contain: layout style paint` per component to limit layout recalc
3. **Content-visibility** — `content-visibility: auto` for off-screen components
4. **Virtual rendering** — Only components within viewport margin rendered

### Drag Performance

1. **DndContext** only re-renders the dragged item + drop targets
2. **No schema updates during drag** — Position tracked locally, committed on drop
3. **Lightweight preview** — CSS-only preview, no React render during drag

### Memory

1. **Component memoization** — `React.memo` with custom comparator
2. **Schema selectors** — Zustand selectors prevent unnecessary re-renders
3. **History pruning** — Yjs undo stack capped at 1000 entries, older entries garbage collected

## 4.7 Component Library Panel

Displays available components categorized:

```
📁 Foundations
  └─ Typography, Color, Spacer
📁 Basic
  └─ Button, Input, Card
📁 Navigation
  └─ Navbar, Sidebar, Breadcrumb
📁 Dashboard
  └─ KPI, Chart, Table
📁 SaaS
  └─ Pricing, Team, Subscription
📁 E-commerce
  └─ ProductCard, Cart
📁 Mobile
  └─ AppBar, BottomNav
```

Each item is draggable. Clicking adds to center of viewport.

## 4.8 Properties Panel

Context-sensitive panel showing:

1. **Component type** badge
2. **Props editor** — Typed inputs based on component definition
3. **Styles editor** — Design-token-bound values
4. **Interactions** — Event handlers
5. **Responsive overrides** — Per-breakpoint props
6. **Accessibility** — ARIA, role, label
7. **Data binding** — Connect to data sources

## 4.9 Layers Panel

Tree view of component hierarchy:

```
📄 Home Page
  └─ <Navbar>
      └─ <Logo>
      └─ <NavLinks>
  └─ <Hero>
      └─ <Heading>
      └─ <Button>
  └─ <Features>
      └─ <Card>
      └─ <Card>
```

Features:
- Drag to reorder
- Click to select
- Toggle visibility
- Lock/unlock
- Rename (sets name in schema)
