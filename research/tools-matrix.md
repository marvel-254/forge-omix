# Omix Builder — Comprehensive Technology Research Matrix

> Generated: 2026-09-16 | For: Omix Builder (forge@omix) — AI-native visual builder for low-powered machines

## Legend

| Recommendation | Meaning |
|---|---|
| **USE** | High-priority inclusion; fits core requirements |
| **CONSIDER** | Strong candidate; evaluate in more detail before committing |
| **OPTIONAL** | Useful but not core; include if scope allows |
| **AVOID** | Significant drawbacks for our use case; skip unless critical need |

---

## 1. Visual Editors & Builder Frameworks

### 1.1 tldraw

| Field | Value |
|---|---|
| **Name** | tldraw |
| **URL** | https://tldraw.com |
| **GitHub** | https://github.com/tldraw/tldraw |
| **License** | MIT (tldraw SDK) / AGPL (tldraw.dev) |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Community images available |
| **Language** | TypeScript |
| **Bundle Size** | ~500KB (minified + gzipped, core) |
| **Maintenance** | Very active (500+ contributors, daily releases) |
| **Omix Use Case** | 2D canvas engine for diagramming, whiteboard features, shape manipulation |
| **Integration Complexity** | Medium — SDK is well-documented but opinionated architecture |
| **Security** | SVG/Canvas-based rendering; sanitize any external shape data |

**Recommendation: CONSIDER**
Reasoning: Excellent SDK with mature primitives for shape manipulation, snap-to-grid, and collaborative editing. The MIT-licensed SDK is friendly for commercial use. However, the scope is more diagramming-focused than general visual building. Good if Omix needs whiteboard/canvas capabilities.

---

### 1.2 Excalidraw

| Field | Value |
|---|---|
| **Name** | Excalidraw |
| **URL** | https://excalidraw.com |
| **GitHub** | https://github.com/excalidraw/excalidraw |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Official image (`excalidraw/excalidraw`) |
| **Language** | TypeScript |
| **Bundle Size** | ~600KB (core) |
| **Maintenance** | Very active (Vercel-backed, 200+ contributors) |
| **Omix Use Case** | Hand-drawn style diagramming, wireframing, brainstorming mode |
| **Integration Complexity** | Low-Medium — embeddable, exposes scene data as JSON |
| **Security** | JSON-only scene format; no server-side rendering risks |

**Recommendation: CONSIDER**
Reasoning: Lightweight, self-hostable, MIT license. Great for a "sketch mode" in Omix. Not a full builder framework — too limited for component-based UI building, but valuable for ideation/wireframing layers.

---

### 1.3 GrapesJS

| Field | Value |
|---|---|
| **Name** | GrapesJS |
| **URL** | https://grapesjs.com |
| **GitHub** | https://github.com/artf/grapesjs |
| **License** | BSD-3-Clause |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Community images |
| **Language** | JavaScript (TypeScript types via `@types/grapesjs`) |
| **Bundle Size** | ~2.5MB (full), ~800KB (core) |
| **Maintenance** | Active (core team + community, quarterly releases) |
| **Omix Use Case** | Full visual HTML/CSS builder — closest to what Omix aims to be |
| **Integration Complexity** | Medium — plugin architecture, template-based output |
| **Security** | HTML/CSS output needs sanitization; XSS risks in embedded content |

**Recommendation: USE**
Reasoning: GrapesJS is the closest existing open-source match to Omix Builder's goals. BSD-3-Clause is commercial-friendly. It's a visual HTML/CSS builder with plugin architecture. Omix could build on top of or be inspired by GrapesJS's model. Output is structured HTML/CSS which can be transformed into specs. Strong plugin ecosystem for extending functionality.

---

### 1.4 Craft.js

| Field | Value |
|---|---|
| **Name** | Craft.js |
| **URL** | https://craft.js.org |
| **GitHub** | https://github.com/prevwong/craft.js |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A (pure frontend) |
| **Language** | TypeScript |
| **Bundle Size** | ~200KB (core) |
| **Maintenance** | Slow (2-3 releases/year; prevwong less active) |
| **Omix Use Case** | React-based visual page builder with drag-and-drop |
| **Integration Complexity** | Medium — React-specific, provides editor state as JSON tree |
| **Security** | JSON-based editor state; render-time XSS if injecting raw HTML |

**Recommendation: CONSIDER**
Reasoning: React-native with clean JSON state representation — ideal for AI-to-spec workflows. MIT license. However, maintenance has slowed; the project may need to be forked or supplemented. The component model (UserComponent ↔ RenderNode) is elegant and worth studying.

---

### 1.5 Puck

| Field | Value |
|---|---|
| **Name** | Puck |
| **URL** | https://puckeditor.com |
| **GitHub** | https://github.com/measuredco/puck |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A (React component) |
| **Language** | TypeScript |
| **Bundle Size** | ~150KB (core) |
| **Maintenance** | Very active (Measured team, monthly releases) |
| **Omix Use Case** | Headless visual editor for React; drop-in component editor |
| **Integration Complexity** | Low — React component, JSON data format, framework-agnostic data |
| **Security** | Pure React; no direct HTML injection; safe by design |

**Recommendation: USE**
Reasoning: Modern, actively maintained, MIT licensed, lightweight. Puck outputs clean JSON (not HTML), making it ideal for AI-to-spec workflows. Headless architecture means Omix could customize the entire UI. Excellent choice for the visual editing layer. The component-first approach aligns with how AI agents describe interfaces.

---

### 1.6 Builder.io Visual SDK

| Field | Value |
|---|---|
| **Name** | Builder.io Visual SDK |
| **URL** | https://builder.io |
| **GitHub** | https://github.com/BuilderIO/builder |
| **License** | MIT (SDK) / Proprietary (cloud services) |
| **Open Source** | Partial (SDK open, backend proprietary) |
| **Self-hostable** | Partial (SDK yes, editing experience needs cloud) |
| **Docker** | N/A (SaaS) |
| **Language** | TypeScript |
| **Bundle Size** | ~300KB (SDK) |
| **Maintenance** | Active (commercial product) |
| **Omix Use Case** | Visual editing for React/Vue/Svelte; headless CMS |
| **Integration Complexity** | Low for SDK; high for full self-hosted editing |
| **Security** | Cloud-bound features; data leaves your infrastructure |

**Recommendation: AVOID**
Reasoning: The visual editing experience requires Builder.io's cloud service. Self-hosting the full editing workflow is not supported. For Omix (self-hostable, offline-capable), this creates a dependency on a third-party SaaS. Study the SDK architecture but do not depend on it.

---

### 1.7 Plasmic

| Field | Value |
|---|---|
| **Name** | Plasmic |
| **URL** | https://plasmic.app |
| **GitHub** | https://github.com/plasmicapp/plasmic |
| **License** | MIT (app) / AGPL (platform) |
| **Open Source** | Yes |
| **Self-hostable** | Yes (via AGPL platform) |
| **Docker** | Community |
| **Language** | TypeScript |
| **Bundle Size** | ~400KB (loader) |
| **Maintenance** | Active (commercial product, open core) |
| **Omix Use Case** | Visual page builder, component registry, headless CMS |
| **Integration Complexity** | Medium — rich API, framework-agnostic |
| **Security** | Self-hosted option available; studio requires auth |

**Recommendation: CONSIDER**
Reasoning: Open-source with self-hostable platform. Code generation is a strength (React/Next.js output). AGPL licensing may be a concern for commercial products depending on distribution model. Study the codegen architecture — similar to what Omix needs. Weigh AGPL implications carefully.

---

### 1.8 Penpot

| Field | Value |
|---|---|
| **Name** | Penpot |
| **URL** | https://penpot.app |
| **GitHub** | https://github.com/penpot/penpot |
| ** ** | MPL-2.0 (frontend) / AGPL-3.0 (backend) |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Official (`penpotapp/*` images) |
| **Language** | Clojure (backend), ClojureScript (frontend), Rust (render) |
| **Bundle Size** | N/A (server-rendered with client UI) |
| **Maintenance** | Very active (Kaleidos, 100+ contributors) |
| **Omix Use Case** | Design tool (Figma alternative); design-to-code workflows |
| **Integration Complexity** | High — Clojure/ClojureScript stack; API-first architecture |
| **Security** | Self-hosted; SSO/LDAP support; audit logs |

**Recommendation: CONSIDER**
Reasoning: True Figma alternative with self-hosting. Not a builder itself but excellent as a design import target. The open API allows reading Penpot files for import into Omix. Use as a reference for design-tool UX, and potentially as an import source.

---

### 1.9 FlutterFlow

| Field | Value |
|---|---|
| **Name** | FlutterFlow |
| **URL** | https://flutterflow.io |
| **GitHub** | Proprietary |
| **License** | Proprietary |
| **Open Source** | No |
| **Self-hostable** | No |
| **Docker** | No |
| **Language** | Dart/Flutter |
| **Bundle Size** | N/A |
| **Maintenance** | Active (commercial) |
| **Omix Use Case** | Reference for visual Flutter builder; competitor analysis |
| **Integration Complexity** | N/A |
| **Security** | Closed-source, cloud-only |

**Recommendation: AVOID**
Reasoning: Closed-source, cloud-only, proprietary. Directly opposed to Omix goals. Only relevant as a competitor reference.

---

### 1.10 Onsen UI (Mobile Builder)

| Field | Value |
|---|---|
| **Name** | Monaca / Onsen UI |
| **URL** | https://onsen.io |
| **GitHub** | https://github.com/OnsenUI/OnsenUI |
| **License** | Apache-2.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript/JavaScript |
| **Bundle Size** | ~120KB |
| **Maintenance** | Moderate |
| **Omix Use Case** | Mobile-first component set, hybrid app builder reference |
| **Integration Complexity** | Low (web components) |
| **Security** | Standard web component security |

**Recommendation: OPTIONAL**
Reasoning: Good mobile web component library. If Omix targets mobile web apps, Onsen provides a solid foundation. Not relevant for desktop-first builder.

---

## 2. Canvas & Rendering Engines

### 2.1 Konva

| Field | Value |
|---|---|
| **Name** | Konva (react-konva) |
| **URL** | https://konvajs.org |
| **GitHub** | https://github.com/konvajs/konva |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~145KB (min+gzip) |
| **Maintenance** | Active (2-3 releases/year) |
| **Omix Use Case** | 2D canvas rendering, shape manipulation, layering |
| **Integration Complexity** | Low — React bindings (`react-konva`) mature |
| **Security** | Canvas-based; no XSS; sanitize text input |

**Recommendation: USE**
Reasoning: Mature 2D canvas library with React bindings. MIT license, small bundle. Perfect for canvas layers in Omix (grids, guides, selection handles, overlays). Konva's scene graph model maps well to spec objects.

---

### 2.2 Fabric.js

| Field | Value |
|---|---|
| **Name** | Fabric.js |
| **URL** | http://fabricjs.com |
| **GitHub** | https://github.com/fabricjs/fabric.js |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | JavaScript (TypeScript types via `@types/fabric`) |
| **Bundle Size** | ~350KB (min+gzip) |
| **Maintenance** | Moderate (6-12 months between releases) |
| **Omix Use Case** | Object model on canvas, serialization, SVG/Canvas rendering |
| **Integration Complexity** | Medium — no React bindings (must bridge) |
| **Security** | Canvas-based; watch for prototype pollution in parsing |

**Recommendation: CONSIDER**
Reasoning: Mature object model with serialization to JSON/SVG. Larger than Konva and no React bindings, making integration heavier. Good fallback if Konva lacks a feature (freehand drawing, complex path editing).

---

### 2.3 PixiJS

| Field | Value |
|---|---|
| **Name** | PixiJS |
| **URL** | https://pixijs.com |
| **GitHub** | https://github.com/pixijs/pixijs |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~200KB (min+gzip, v8) |
| **Maintenance** | Very active (major v8 rewrite, monthly releases) |
| **Omix Use Case** | High-performance 2D rendering, WebGL-accelerated canvas |
| **Integration Complexity** | Medium — imperative API; React bindings via `@pixi/react` |
| **Security** | WebGL context limits; no DOM-based XSS |

**Recommendation: CONSIDER**
Reasoning: Excellent performance for complex scenes (1000+ elements). Overkill for simple UI builders but valuable if Omix needs to render large canvases with many elements. WebGL acceleration helps on low-powered machines. Consider for rendering previews.

---

### 2.4 Two.js

| Field | Value |
|---|---|
| **Name** | Two.js |
| **URL** | https://two.js.org |
| **GitHub** | https://github.com/jonobr1/two.js |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~95KB (min+gzip) |
| **Maintenance** | Slow (1-2 releases/year) |
| **Omix Use Case** | Unified SVG/Canvas/WebGL renderer, vector drawing |
| **Integration Complexity** | Low-Medium — vanilla JS, no React bindings |
| **Security** | Standard canvas security model |

**Recommendation: OPTIONAL**
Reasoning: Ultra-lightweight with multi-renderer support. Good if Omix needs a small canvas abstraction. Slow maintenance is a concern for long-term dependency.

---

### 2.5 SVG.js

| Field | Value |
|---|---|
| **Name** | SVG.js |
| **URL** | https://svgjs.dev |
| **GitHub** | https://github.com/svgdotjs/svg.js |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~45KB (min+gzip) |
| **Maintenance** | Moderate |
| **Omix Use Case** | SVG manipulation for export, icons, diagram rendering |
| **Integration Complexity** | Low |
| **Security** | SVG can contain script tags — sanitize on export/import |

**Recommendation: USE**
Reasoning: Tiny, MIT, perfect for SVG export from Omix specs. SVG is ideal for rendering UI previews on low-powered machines (GPU acceleration, small DOM). Use SVG for the output rendering layer.

---

### 2.6 Paper.js

| Field | Value |
|---|---|
| **Name** | Paper.js |
| **URL** | http://paperjs.org |
| **GitHub** | https://github.com/paperjs/paper.js |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | JavaScript |
| **Bundle Size** | ~250KB (min+gzip) |
| **Maintenance** | Slow (annual releases) |
| **Omix Use Case** | Vector graphics, path manipulation, boolean operations |
| **Integration Complexity** | Medium |
| **Security** | Canvas-based, low risk |

**Recommendation: OPTIONAL**
Reasoning: Best-in-class for vector path manipulation (boolean ops, simplification). Useful if Omix needs advanced vector editing (pen tool, shape merging). Large bundle and slow maintenance for a non-core feature.

---

## 3. Component Libraries

### 3.1 shadcn/ui

| Field | Value |
|---|---|
| **Name** | shadcn/ui |
| **URL** | https://ui.shadcn.com |
| **GitHub** | https://github.com/shadcn-ui/ui |
| **License** | MIT (code is copy-paste, not installed) |
| **Open Source** | Yes |
| **Self-hostable** | Yes (self-copied components) |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | Pay-for-what-you-use (components are ~2-5KB each) |
| **Maintenance** | Very active (daily updates, massive community) |
| **Omix Use Case** | Default component set for generated UIs; copy into Omix |
| **Integration Complexity** | Low — Radix primitives + Tailwind, easy to customize |
| **Security** | Components are local code, no runtime fetch |

**Recommendation: USE**
Reasoning: The dominant component library in 2026. Copy-paste model means components live in Omix's codebase (no version conflicts). Built on Radix for accessibility. Tailwind-based styling. AI coding agents know shadcn/ui well — better code generation alignment. MIT license.

---

### 3.2 Radix UI (Primitives)

| Field | Value |
|---|---|
| **Name** | Radix UI |
| **URL** | https://radix-ui.com |
| **GitHub** | https://github.com/radix-ui/primitives |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~10KB per primitive (tree-shakeable) |
| **Maintenance** | Very active (WorkOS-backed) |
| **Omix Use Case** | Accessible unstyled component primitives; foundation layer |
| **Integration Complexity** | Low — headless, framework-agnostic patterns |
| **Security** | No known vulnerabilities; WAI-ARIA compliant |

**Recommendation: USE**
Reasoning: Foundation for accessible components. Use directly or through shadcn/ui. MIT, tiny bundle, excellent keyboard navigation and focus management. Critical for accessibility compliance in generated UIs.

---

### 3.3 Mantine

| Field | Value |
|---|---|
| **Name** | Mantine |
| **URL** | https://mantine.dev |
| **GitHub** | https://github.com/mantinedev/mantine |
| **License** | MIT |
 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~120KB (core, min+gzip) |
| **Maintenance** | Very active |
| **Omix Use Case** | Full-featured component library with hooks, forms, dates |
| **Integration Complexity** | Low |
| **Security** | Regular audits, CSRF tokens in forms |

**Recommendation: CONSIDER**
Reasoning: More batteries-included than shadcn/ui (hooks, form validation, date pickers). Good if Omix needs a comprehensive library without composing many packages. MIT, active. Heavier than shadcn/ui but saves integration work for forms/dates.

---

### 3.4 Chakra UI

| Field | Value |
|---|---|
| **Name** | Chakra UI |
| **URL** | https://chakra-ui.com |
| **GitHub** | https://github.com/chakra-ui/chakra-ui |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~100KB (v2) / ~25KB (v3, tree-shakeable) |
| **Maintenance** | Active (v3 rewrite) |
| **Omix Use Case** | Accessible component library, style props pattern |
| **Integration Complexity** | Low |
| **Security** | Style props prevent arbitrary CSS injection |

**Recommendation: CONSIDER**
Reasoning: v3 is much smaller and tree-shakeable. Style-props pattern is developer-friendly. MIT license. Slightly less popular than shadcn/ui in 2026, reducing AI-agent familiarity. Good alternative if shadcn/ui doesn't fit.

---

### 3.5 Ant Design

| Field | Value |
|---|---|
| **Name** | Ant Design |
| **URL** | https://ant.design |
| **GitHub** | https://github.com/ant-design/ant-design |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~600KB (full), ~200KB (tree-shakeable v5) |
| **Maintenance** | Very active (Ant Group-backed) |
| **Omix Use Case** | Enterprise component set, table-heavy UIs, admin panels |
| **Integration Complexity** | Medium — theme customization is verbose |
| **Security** | Active security team; CVEs rare |

**Recommendation: OPTIONAL**
Reasoning: Most popular in China, less so elsewhere. Heavy bundle, opinionated theme. AI agents have moderate familiarity. Use only if targeting Chinese enterprise market or need the extensive table/form components out-of-the-box. shadcn/ui is preferred for most Omix use cases.

---

### 3.6 Headless UI

| Field | Value |
|---|---|
| **Name** | Headless UI |
| **URL** | https://headlessui.com |
| **GitHub** | https://github.com/tailwindlabs/headlessui |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~15KB per component |
| **Maintenance** | Active (Tailwind Labs) |
| **Omix Use Case** | Unstyled accessible components (dialog, menu, combobox) |
| **Integration Complexity** | Low |
| **Security** | Focus management built-in, low risk |

**Recommendation: CONSIDER**
Reason: Same team as Tailwind, perfectly complementary. If Omix uses Tailwind, Headless UI provides the interactive components (combobox, dialog, tabs). MIT, tiny bundles.

---

### 3.7 DaisyUI

| Field | Value |
|---|---|
| **Name** | DaisyUI |
| **URL** | https://daisyui.com |
| **GitHub** | https://github.com/saadeghi/daisyui |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~30KB (Tailwind plugin) |
| **Maintenance** | Very active |
| **Omix Use Case** | Tailwind component classes (btn, card, modal) — rapid prototyping |
| **Integration Complexity** | Very Low — pure Tailwind |
| **Security** | CSS-only, no JS attack surface |

**Recommendation: CONSIDER**
Reasoning: Extremely lightweight Tailwind plugin. Good for prototyping and simple components. Less flexible than shadcn/ui but faster to implement. Consider for the simplest tier of Omix-generated UIs.

---

### 3.8 Flowbite

| Field | Value |
|---|---|
| **Name** | Flowbite |
| **URL** | https://flowbite.com |
| **GitHub** | https://github.com/themesberg/flowbite |
| **License** | MIT (community) / Proprietary (pro) |
| **Open Source** | Partial |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~40KB (core) |
| **Maintenance** | Active |
| **Omix Use Case** | Tailwind components, template source material |
| **Integration Complexity** | Low |
| **Security** | Open-source community version is auditable |

**Recommendation: OPTIONAL**
Reasoning: Good Tailwind component library with many pre-built blocks. Templates can inspire Omix dashboard/SaaS templates. Pro version is commercial; stick to MIT-licensed community version.

---

### 3.9 Tremor

| Field | Value |
|---|---|
| **Name** | Tremor |
| **URL** | https://tremor.so |
| **GitHub** | https://github.com/tremorlabs/tremor |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~80KB (core) |
| **Maintenance** | Active |
| **Omix Use Case** | Dashboard chart components, metric cards, flex components |
| **Integration Complexity** | Low (Tailwind + React) |
| **Security** | Chart rendering only, low risk |

**Recommendation: CONSIDER**
Reasoning: Purpose-built for dashboards. Excellent for Omix dashboard templates. MIT license. If Omix needs to generate admin dashboards, Tremor provides the right abstractions (bar charts, area charts, metric cards) as composable components.

---

### 3.10 NextUI

| Field | Value |
|---|---|
| **Name** | NextUI |
| **URL** | https://nextui.org |
| **GitHub** | https://github.com/nextui-org/nextui |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~180KB |
| **Maintenance** | Active (v2 rewrite) |
| **Omix Use Case** | Modern component library with server components |
| **Integration Complexity** | Low-Medium — Next.js integration best |
| **Security** | Standard React component security |

**Recommendation: OPTIONAL**
Reasoning: Beautiful but Next.js-focused. If Omix outputs Next.js apps, NextUI is a great choice. For generic React output, shadcn/ui is more portable. MIT, good alternative.

---

## 4. Design Systems & CSS

### 4.1 Tailwind CSS

| Field | Value |
|---|---|
| **Name** | Tailwind CSS |
| **URL** | https://tailwindcss.com |
| **GitHub** | https://github.com/tailwindlabs/tailwindcss |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes (build-time) |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~5-30KB (purged output) |
| **Maintenance** | Very active (Tailwind Labs) |
| **Omix Use Case** | Utility-first CSS for generated UIs; v4 engine for parsing |
| **Integration Complexity** | Low |
| **Security** | Purged output has no CSS injection surface |

**Recommendation: USE**
Reasoning: Dominant utility-first CSS in 2026. Tiny output after purging. AI agents understand Tailwind well. v4 introduces a CSS-first config with a Rust-powered engine — Omix could use Tailwind's parser to convert visual specs to Tailwind classes. MIT license. Build-time only (no runtime).

---

### 4.2 UnoCSS

| Field | Value |
|---|---|
| **Name** | UnoCSS |
| **URL** | https://unocss.dev |
| **GitHub** | https://github.com/unocss/unocss |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~12KB (runtime), 0KB (build mode) |
| **Maintenance** | Active (Anthony Fu) |
| **Omix Use Case** | Atomic CSS engine; instant-on, framework-agnostic |
| **Integration Complexity** | Low |
| **Security** | Build-time generation, no runtime eval |

**Recommendation: CONSIDER**
Reasoning: Faster than Tailwind, more flexible presets, smaller runtime. The engine approach is interesting for Omix — could build a custom preset that maps spec properties directly to utility classes. MIT, extremely fast. Good alternative if Tailwind's build step is a bottleneck.

---

### 4.3 Open Props

| Field | Value |
|---|---|
| **Name** | Open Props |
| **URL** | https://open-props.style |
| **GitHub** | https://github.com/argyleink/open-props |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | CSS |
| **Bundle Size** | ~8KB (custom subset) |
| **Maintenance** | Moderate (Google's Adam Argyle) |
| **Omix Use Case** | CSS custom properties for design tokens; theme foundation |
| **Integration Complexity** | Very Low |
| **Security** | CSS-only, zero risk |

**Recommendation: USE**
Reasoning: CSS custom properties are the ideal format for design tokens in Omix. Generated UIs can consume `--color-primary`, `--spacing-md`, etc. Omix can output component styles that reference Open Props tokens. Tiny, MIT, no framework dependency.

---

### 4.4 Pico.css

| Field | Value |
|---|---|
| **Name** | Pico.css |
| **URL** | https://picocss.com |
| **GitHub** | https://github.com/picocss/pico |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | CSS |
| **Bundle Size** | ~10KB |
| **Maintenance** | Moderate |
| **Omix Use Case** | Classless CSS framework — semantic HTML gets styled automatically |
| **Integration Complexity** | Very Low |
| **Security** | CSS-only |

**Recommendation: OPTIONAL**
Reasoning: Good for the simplest Omix output tier — if the user just wants clean default styling without customization. Classless approach means less control for visual editing. Not ideal as a primary system.

---

### 4.5 Bootstrap

| Field | Value |
|---|---|
| **Name** | Bootstrap |
| **URL** | https://getbootstrap.com |
| **GitHub** | https://github.com/twbs/bootstrap |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | SCSS/JS |
| **Bundle Size** | ~60KB (CSS), ~90KB (full) |
| **Maintenance** | Very active (v5.3) |
| **Omix Use Case** | Legacy support; familiar framework for templates |
| **Integration Complexity** | Low |
| **Security** | Well-audited; XSS only via JS components if misconfigured |

**Recommendation: AVOID**
Reasoning: Outdated paradigm for 2026. Heavy, opinionated, generates "Bootstrap-looking" UIs. Tailwind/UnoCSS are strictly better for AI-generated code. Use only if targeting Bootstrap-specific deployments.

---

### 4.6 Vanilla Extract

| Field | Value |
|---|---|
| **Name** | Vanilla Extract |
| **URL** | https://vanilla-extract.style |
| **GitHub** | https://github.com/vanilla-extract-css/vanilla-extract |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~5KB (runtime, styles fully extracted) |
| **Maintenance** | Active (Seek-backed) |
| **Omix Use Case** | Type-safe CSS-in-JS; zero-runtime stylesheets |
| **Integration Complexity** | Medium — TypeScript-first, build-time only |
| **Security** | Build-time CSS generation, no runtime injection |

**Recommendation: OPTIONAL**
Reasoning: Excellent for type-safe theming but adds build complexity. Tailwind is simpler for AI-generated output. Consider if Omix needs strict TypeScript types on design tokens.

---

## 5. Templates & UI Kits

### 5.1 Tailwind UI (Official)

| Field | Value |
|---|---|
| **Name** | Tailwind UI |
| **URL** | https://tailwindui.com |
| **GitHub** | N/A |
| **License** | Commercial (Tailwind Labs license) |
| **Open Source** | No |
| **Self-hostable** | N/A (purchased components) |
| **Docker** | N/A |
| **Language** | HTML/Tailwind |
| **Maintenance** | Very active |
| **Omix Use Case** | Reference for professional component templates; inspiration |
| **Integration Complexity** | Low (copy-paste templates) |
| **Security** | Commercial license required |

**Recommendation: OPTIONAL (commercial license required)**
Reasoning: Best-in-class Tailwind templates, but requires paid license. Not redistributable. Use as design reference only; do not copy into Omix's open-source output. Free alternatives exist (Tailwind Elements, Flowbite).

---

### 5.2 Tailwind Elements

| Field | Value |
|---|---|
| **Name** | Tailwind Elements |
| **URL** | https://tailwind-elements.com |
| **GitHub** | https://github.com/mdbootstrap/Tailwind-Elements |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | HTML/JS |
| **Bundle Size** | ~40KB |
| **Maintenance** | Active |
| **Omix Use Case** | Free Tailwind components and sections |
| **Integration Complexity** | Low |
| **Security** | Standard component security |

**Recommendation: CONSIDER**
Reasoning: MIT-licensed Tailwind components. Good free alternative to Tailwind UI. Can be used as a base for Omix templates. Less polished but fully open-source.

---

### 5.3 Material Tailwind

| Field | Value |
|---|---|
| **Name** | Material Tailwind |
| **URL** | https://material-tailwind.com |
| **GitHub** | https://github.com/creativetimofficial/material-tailwind |
| **License** | MIT (community) / Pro (pro) |
| **Open Source** | Partial |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~60KB |
| **Maintenance** | Active |
| **Omix Use Case** | Material Design components for Tailwind |
| **Integration Complexity** | Low |
| **Security** | Standard |

**Recommendation: OPTIONAL**
Reasoning: If targeting Material Design output, useful. Otherwise, shadcn/ui is more neutral/modern. Stick to MIT community version.

---

### 5.4 Shadcn UI Blocks / Templates

| Field | Value |
|---|---|
| **Name** | shadcn/ui Blocks |
| **URL** | https://ui.shadcn.com/blocks |
| **GitHub** | https://github.com/shadcn-ui/ui |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Maintenance** | Very active |
| **Omix Use Case** | Pre-built page blocks (dashboard, auth, settings) for Omix output |
| **Integration Complexity** | Low — copy into components |
| **Security** | Local code |

**Recommendation: USE**
Reasoning: Free, MIT, modern blocks for dashboards, auth pages, settings. Directly usable as Omix output templates. Extends shadcn/ui which we already recommend.

---

### 5.5 Aceternity UI

| Field | Value |
|---|---|
| **Name** | Aceternity UI |
| **URL** | https://ui.aceternity.com |
| **GitHub** | https://github.com/aceternity/ui-forest |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | Varies |
| **Maintenance** | Active |
| **Omix Use Case** | Animated components (spotlight, beams, moving borders) |
| **Integration Complexity** | Low-Medium |
| **Security** | Tailwind + Framer Motion, low risk |

**Recommendation: OPTIONAL**
Reasoning: Visually impressive animated components. Good for marketing/landing page output in Omix. MIT, but adds Framer Motion dependency. Use selectively for high-impact landing pages.

---

### 5.6 Horizon UI (Chakra-based)

| Field | Value |
|---|---|
| **Name** | Horizon UI |
| **URL** | https://horizon-ui.com |
| **GitHub** | https://github.com/horizon-ui/horizon-ui-chakra |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Maintenance** | Active |
| **Omix Use Case** | Full dashboard template; admin UI reference |
| **Integration Complexity** | Low |
| **Security** | Standard |

**Recommendation: OPTIONAL**
Reasoning: Good dashboard template if Omix targets admin panels. Chakra-based, so only relevant if choosing Chakra over shadcn/ui.

---

## 6. Icons

### 6.1 Lucide

| Field | Value |
|---|---|
| **Name** | Lucide |
| **URL** | https://lucide.dev |
| **GitHub** | https://github.com/lucide-icons/lucide |
| **License** | ISC (functionally equivalent to MIT) |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~1KB per icon (tree-shakeable) |
| **Maintenance** | Very active (community-driven) |
| **Omix Use Case** | Default icon set for generated UIs and editor chrome |
| **Integration Complexity** | Very Low — React/Svelte/Vue/Angular bindings |
| **Security** | SVG icons, sanitize if dynamically generated |

**Recommendation: USE**
Reasoning: Largest icon library, ISC license, framework bindings for everything. Active community, consistent style. Perfect for Omix output and editor UI.

---

### 6.2 Heroicons

| Field | Value |
|---|---|
| **Name** | Heroicons |
| **URL** | https://heroicons.com |
| **GitHub** | https://github.com/tailwindlabs/heroicons |
| **License** | MIT |
 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~1KB per icon |
| **Maintenance** | Active (Tailwind Labs) |
| **Omix Use Case** | Alternative to Lucide; same creator as Tailwind |
| **Integration Complexity** | Very Low |
| **Security** | SVG, low risk |

**Recommendation: CONSIDER**
Reasoning: Official Tailwind Labs icon set. Slightly fewer icons than Lucide. Perfect if Omix uses Tailwind. MIT license. Either Lucide or Heroicons is recommended; both are fine choices.

---

### 6.3 Phosphor Icons

| Field | Value |
|---|---|
| **Name** | Phosphor Icons |
| **URL** | https://phosphoricons.com |
| **GitHub** | https://github.com/phosphor-icons/homepage |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~0.5KB per icon (SVG) |
| **Maintenance** | Active |
| **Omix Use Case** | Variable-weight icons (thin, light, regular, bold, fill) |
| **Integration Complexity** | Low |
| **Security** | SVG, low risk |

**Recommendation: CONSIDER**
Reasoning: Unique variable-weight system — useful for icon-heavy UIs. MIT, active. Smaller community than Lucide/Heroicons but higher quality variable weights. Good choice if Omix needs multiple icon weights.

---

### 6.4 Radix Icons

| Field | Value |
|---|---|
| **Name** | Radix Icons |
| **URL** | https://radix-ui.com/icons |
| **GitHub** | https://github.com/radix-ui/icons |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~1KB per icon |
| **Maintenance** | Active (WorkOS) |
| **Omix Use Case** | Cohesive with Radix/shadcn/ui design language |
| **Integration Complexity** | Low |
| **Security** | SVG, low risk |

**Recommendation: CONSIDER**
Reasoning: Perfect match for shadcn/ui/Radix ecosystem. If we choose shadcn/ui, Radix Icons are the natural choice. MIT license.

---

### 6.5 Iconify

| Field | Value |
|---|---|
| **Name** | Iconify |
| **URL** | https://iconify.design |
| **GitHub** | https://github.com/iconify/iconify |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~0.5KB per icon (runtime); ~2KB (tree-shaken) |
| **Maintenance** | Very active |
| **Omix Use Case** | Unified API for 200,000+ icons from all sets |
| **Integration Complexity** | Low |
| **Security** | Remote fetch requires trust; self-host JSON data |

**Recommendation: CONSIDER**
Reasoning: If Omix needs access to all icon sets (not just Lucide/Heroicons), Iconify provides a unified API. Self-hosting the icon data is recommended for offline capability. MIT license.

---

### 6.6 Font Awesome (Free)

| Field | Value |
|---|---|
| **Name** | Font Awesome |
| **URL** | https://fontawesome.com |
| **GitHub** | https://github.com/FortAwesome/Font-Awesome |
| **License** | CC-BY-4.0 (icons), MIT (code), Proprietary (Pro) |
| **Open Source** | Partial |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | JS |
| **Bundle Size** | ~10KB (subset), ~100KB (full free) |
| **Maintenance** | Active |
| **Omix Use Case** | Brand icons, social icons; familiarity |
| **Integration Complexity** | Low |
| **Security** | Well-established |

**Recommendation: OPTIONAL**
Reasoning: Less popular in modern React stacks (SVG preferred over icon fonts). Larger bundle. Brand icons are the main use case. Lucide + Iconify covers most needs with smaller bundles.

---

## 7. Fonts

### 7.1 Inter

| Field | Value |
|---|---|
| **Name** | Inter |
| **URL** | https://rsms.me/inter/ |
| **GitHub** | https://github.com/rsms/inter |
| **License** | OFL-1.1 (Open Font License) |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | Font files |
| **FileSize** | ~300KB (variable), ~90KB (static) |
| **Maintenance** | Very active |
| **Omix Use Case** | Default UI font for generated apps; excellent legibility |
| **Integration Complexity** | Low |
| **Security** | Font files are static assets |

**Recommendation: USE**
Reasoning: Best screen-optimized UI font. Variable font support reduces bandwidth. OFL license is open and permissive. Self-hostable. Default choice for Omix-generated UIs.

---

### 7.2 Geist

| Field | Value |
|---|---|
| **Name** | Geist Sans / Geist Mono |
| **URL** | https://vercel.com/font |
| **GitHub** | https://github.com/vercel/geist-font |
| **License** | OFL-1.1 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | Font files |
| **FileSize** | ~350KB (variable) |
| **Maintenance** | Active (Vercel) |
| **Omix Use Case** | Modern sans/mono pair; matches Vercel aesthetic |
| **Integration Complexity** | Low |
| **Security** | Static font assets |

**Recommendation: CONSIDER**
Reasoning: Vercel's font, excellent quality. Geist Mono is great for code/terminal UIs in Omix. OFL license. Consider as an alternative to Inter or as a mono pair.

---

### 7.3 IBM Plex

| Field | Value |
|---|---|
| **Name** | IBM Plex (Sans, Mono, Serif) |
| **URL** | https://www.ibm.com/plex/ |
| **GitHub** | https://github.com/IBM/plex |
| **License** | OFL-1.1 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | Font files |
| **FileSize** | ~400KB (variable) |
| **Maintenance** | Active (IBM) |
| **Omix Use Case** | Complete type system (sans, mono, serif) from one family |
| **Integration Complexity** | Low |
| **Security** | Static assets |

**Recommendation: OPTIONAL**
Reasoning: Complete family (sans + mono + serif) is nice for content-heavy apps. IBM-backed, actively maintained. OFL license. Consider if Omix targets documentation/content sites.

---

### 7.4 JetBrains Mono

| Field | Value |
|---|---|
| **Name** | JetBrains Mono |
| **URL** | https://jetbrains.com/mono |
| **GitHub** | https://github.com/JetBrains/JetBrainsMono |
| **License** | OFL-1.1 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | Font files |
| **FileSize** | ~200KB |
| **Maintenance** | Active (JetBrains) |
| **Omix Use Case** | Code display in generated UIs; editor chrome |
| **Integration Complexity** | Low |
| **Security** | Static assets |

**Recommendation: USE**
Reasoning: Best monospace font for code. OFL license. Use Geist Mono or JetBrains Mono for any code/terminal display in Omix UI.

---

## 8. Charts

### 8.1 Recharts

| Field | Value |
|---|---|
| **Name** | Recharts |
| **URL** | https://recharts.org |
| **GitHub** | https://github.com/recharts/recharts |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~450KB (full), ~150KB (tree-shaken) |
| **Maintenance** | Active (v2 rewrite mature) |
| **Omix Use Case** | React chart components; composable SVG charts |
| **Integration Complexity** | Low |
| **Security** | SVG-based; no eval |

**Recommendation: USE**
Reasoning: Most popular React chart library. MIT, composable, SVG output (good for low-powered machines). Dashboard templates use Recharts extensively. Good default for Omix dashboard output.

---

### 8.2 Visx

| Field | Value |
|---|---|
| **Name** | Visx |
| **URL** | https://airbnb.io/visx |
| **GitHub** | https://github.com/airbnb/visx |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~30KB per package (modular) |
| **Maintenance** | Active (Airbnb) |
| **Omix Use Case** | Low-level chart primitives; custom chart composition |
| **Integration Complexity** | Medium — primitives, not components |
| **Security** | SVG-based, low risk |

**Recommendation: CONSIDER**
Reasoning: More modular than Recharts but requires more code. MIT, excellent for custom chart needs. Choose if Omix needs fine-grained control over chart rendering.

---

### 8.3 Victory

| Field | Value |
|---|---|
| **Name** | Victory |
| **URL** | https://formidable.com/open-source/victory/ |
| **GitHub** | https://github.com/FormidableLabs/victory |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~300KB |
| **Maintenance** | Moderate |
| **Omix Use Case** | Chart components for React; similar to Recharts |
| **Integration Complexity** | Low |
| **Security** | SVG, low risk |

**Recommendation: CONSIDER**
Reasoning: Similar to Recharts. Formidable-backed, MIT. Slightly less popular but equally capable. Either Recharts or Victory is fine.

---

### 8.4 Nivo

| Field | Value |
|---|---|
| **Name** | Nivo |
| **URL** | https://nivo.rocks |
| **GitHub** | https://github.com/plouc/nivo |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~200KB (modular) |
| **Maintenance** | Active |
| **Omix Use Case** | Rich chart types (heatmap, radar, sankey, stream) |
| **Integration Complexity** | Low |
| **Security** | SVG, low risk |

**Recommendation: OPTIONAL**
Reasoning: Beautiful chart types beyond standard (sankey, heatmap, stream). MIT, modular. If Omix needs specialized charts, Nivo adds them without full library cost.

---

### 8.5 Chart.js

| Field | Value |
|---|---|
| **Name** | Chart.js |
| **URL** | https://chartjs.org |
| **GitHub** | https://github.com/chartjs/Chart.js |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | JavaScript |
| **Bundle Size** | ~200KB |
| **Maintenance** | Active (v4) |
| **Omix Use Case** | Canvas-based charts; lightweight alternative to SVG charts |
| **Integration Complexity** | Low (with react-chartjs-2 wrapper) |
| **Security** | Canvas-based, low risk |

**Recommendation: CONSIDER**
Reasoning: Canvas rendering may perform better than SVG for very large datasets. MIT, well-known. If dashboard data sets are large, Chart.js is a good performance choice. Use react-chartjs-2 for React bindings.

---

### 8.6 ECharts

| Field | Value |
|---|---|
| **Name** | Apache ECharts |
| **URL** | https://echarts.apache.org |
| **GitHub** | https://github.com/apache/echarts |
| **License** | Apache-2.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~300KB (core), ~800KB (full) |
| **Maintenance** | Very active (Apache Foundation) |
| **Omix Use Case** | Enterprise charts, big data visualization, geo maps |
| **Integration Complexity** | Medium — configuration-based, large API |
| **Security** | Canvas/WebGL, low risk |

**Recommendation: OPTIONAL**
Reasoning: Powerful but large. If Omix needs advanced visualizations (maps, 3D, big data), ECharts is unmatched. Apache-2.0 license. Overkill for standard dashboards.

---

### 8.7 Tremor Charts

| Field | Value |
|---|---|
| **Name** | Tremor |
| **URL** | https://tremor.so |
| **GitHub** | https://github.com/tremorlabs/tremor |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~80KB |
| **Maintenance** | Active |
| **Omix Use Case** | Dashboard-specific chart components; tiny bundle |
| **Integration Complexity** | Low (Tailwind + React) |
| **Security** | Low risk |

**Recommendation: USE**
Reasoning: Purpose-built for dashboards, tiny bundle, MIT. Excellent default for Omix dashboard charts. Integrates with our recommended stack (Tailwind + React).

---

## 9. Tables

### 9.1 TanStack Table

| Field | Value |
|---|---|
| **Name** | TanStack Table |
| **URL** | https://tanstack.com/table |
| **GitHub** | https://github.com/TanStack/table |
| **License** | MIT |
 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~15KB |
| **Maintenance** | Very active |
| **Omix Use Case** | Headless table library for data grids; virtualization |
| **Integration Complexity** | Low — framework-agnostic |
| **Security** | Renders user data; sanitize HTML in custom cells |

**Recommendation: USE**
Reasoning: Best-in-class headless table. Tiny bundle, virtualization support, sorting/filtering/grouping built-in. MIT, very active. Essential for any data-heavy Omix output.

---

### 9.2 AG Grid

| Field | Value |
|---|---|
| **Name** | AG Grid |
| **URL** | https://ag-grid.com |
| **GitHub** | https://github.com/ag-grid/ag-grid |
| **License** | MIT (community) / Commercial (enterprise) |
| **Open Source** | Partial |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~200KB (community), ~500KB (enterprise) |
| **Maintenance** | Active (commercial product) |
| **Omix Use Case** | Enterprise data grid; Excel-like features |
| **Integration Complexity** | Medium |
| **Security** | Well-audited; enterprise has extra security |

**Recommendation: OPTIONAL**
Reasoning: Excel-like features (clipboard, pivoting, aggregation). Enterprise version is commercial. Community version is MIT. If Omix needs advanced grid features, AG Grid is unmatched. Overkill for basic tables.

---

### 9.3 MUI X Data Grid

| Field | Value |
|---|---|
| **Name** | MUI X Data Grid |
| **URL** | https://mui.com/x/react-data-grid/ |
| **GitHub** | https://github.com/mui/mui-x |
| **License** | MIT (community) / Commercial (pro/premium) |
| **Open Source** | Partial |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~300KB |
| **Maintenance** | Very active |
| **Omix Use Case** | Data grid with MUI integration |
| **Integration Complexity** | Low (if using MUI) |
| **Security** | Standard |

**Recommendation: AVOID**
Reasoning: Requires Material UI (heavy dependency). If not using MUI, the Data Grid adds unnecessary weight. TanStack Table is lighter and works with any component library.

---

### 9.4 react-table (v7, legacy)

| Field | Value |
|---|---|
| **Name** | react-table (v7) |
| **URL** | https://react-table-v7.tanstack.com |
| **GitHub** | https://github.com/TanStack/table/tree/v7 |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | JavaScript |
| **Bundle Size** | ~15KB |
| **Maintenance** | Deprecated (superseded by TanStack Table v8) |
| **Omix Use Case** | Legacy reference only |
| **Integration Complexity** | Low |
| **Security** | No longer patched |

**Recommendation: AVOID**
Reasoning: Deprecated. Use TanStack Table v8 instead.

---

## 10. Forms

### 10.1 React Hook Form

| Field | Value |
|---|---|
| **Name** | React Hook Form |
| **URL** | https://react-hook-form.com |
| **GitHub** | https://github.com/react-hook-form/react-hook-form |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~12KB |
| **Maintenance** | Very active |
| **Omix Use Case** | Form state management in generated forms |
| **Integration Complexity** | Low |
| **Security** | No built-in validation; pair with Zod |

**Recommendation: USE**
Reasoning: Dominant React form library. Tiny bundle, uncontrolled components (better performance), excellent validation integration (Zod, Yup). MIT. Essential for any Omix form output.

---

### 10.2 TanStack Form

| Field | Value |
|---|---|
| **Name** | TanStack Form |
| **URL** | https://tanstack.com/form |
| **GitHub** | https://github.com/TanStack/form |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~10KB |
| **Maintenance** | Very active |
| **Omix Use Case** | Framework-agnostic form validation |
| **Integration Complexity** | Low |
| **Security** | Type-safe validation |

**Recommendation: CONSIDER**
Reasoning: From the TanStack team, framework-agnostic (React, Vue, Solid, Sliver). Newer than React Hook Form but growing fast. MIT. If Omix targets multiple frameworks, TanStack Form is the unified choice.

---

### 10.3 Formik

| Field | Value |
|---|---|
| **Name** | Formik |
| **URL** | https://formik.org |
| **GitHub** | https://github.com/jaredpalmer/formik |
| **License** | Apache-2.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~15KB |
| **Maintenance** | Slow (React Hook Form superseded it) |
| **Omix Use Case** | Legacy form library; not recommended for new projects |
| **Integration Complexity** | Low |
| **Security** | No longer receiving major updates |

**Recommendation: AVOID**
Reasoning: Superseded by React Hook Form in performance and bundle size. Maintenance slow. Not recommended for new Omix projects.

---

### 10.4 Zod

| Field | Value |
|---|---|
| **Name** | Zod |
| **URL** | https://zod.dev |
| **GitHub** | https://github.com/colinhacks/zod |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~30KB |
| **Maintenance** | Very active |
| **Omix Use Case** | Schema validation for forms and spec JSON |
| **Integration Complexity** | Low — TypeScript-first |
| **Security** | Type-safe validation; no runtime eval |

**Recommendation: USE**
Reasoning: TypeScript-first schema validation. Essential for Omix: validate user input, validate spec JSON structures, validate AI-generated component props. MIT, tiny bundle, excellent DX.

---

### 10.5 Yup

| Field | Value |
|---|---|
| **Name** | Yup |
| **URL** | https://github.com/jquense/yup |
| **GitHub** | https://github.com/jquense/yup |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | JavaScript |
| **Bundle Size** | ~15KB |
| **Maintenance** | Moderate |
| **Omix Use Case** | Form validation schema |
| **Integration Complexity** | Low |
| **Security** | Chainable API, low risk |

**Recommendation: OPTIONAL**
Reasoning: Good but Zod is more TypeScript-friendly. If Omix uses TypeScript (recommended), Zod is strictly better. Yup only if migrating from legacy code.

---

## 11. Rich Text Editors

### 11.1 TipTap

| Field | Value |
|---|---|
| **Name** | TipTap |
| **URL** | https://tiptap.dev |
| **GitHub** | https://github.com/ueberdosis/tiptap |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~50KB (core), ~200KB (with extensions) |
| **Maintenance** | Very active (open core, ProseMirror-based) |
| **Omix Use Case** | Rich text editing in generated UIs; collaborative editing |
| **Integration Complexity** | Low-Medium |
| **Security** | HTML/JSON output; sanitize for XSS |

**Recommendation: USE**
Reasoning: Best React rich text editor. ProseMirror-based, MIT core. Modular extensions (images, tables, mentions). JSON output is AI-friendly. If Omix needs rich text editing, TipTap is the choice.

---

### 11.2 Lexical

| Field | Value |
|---|---|
| **Name** | Lexical |
| **URL** | https://lexical.dev |
| **GitHub** | https://github.com/facebook/lexical |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~25KB (core) |
| **Maintenance** | Active (Meta) |
| **Omix Use Case** | Accessible rich text editor; extensible framework |
| **Integration Complexity** | Medium — lower-level API |
| **Security** | Built with accessibility in mind; sanitized by default |

**Recommendation: CONSIDER**
Reasoning: Meta's editor, very accessible, small core. Lower-level than TipTap but more flexible. MIT. Good if Omix needs deep customization of the editing experience.

---

### 11.3 ProseMirror (direct)

| Field | Value |
|---|---|
| **Name** | ProseMirror |
| **URL** | https://prosemirror.net |
| **GitHub** | https://github.com/prosemirror |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | JavaScript |
| **Bundle Size** | ~40KB (core) |
| **Maintenance** | Moderate |
| **Omix Use Case** | Underlying engine for custom editors |
| **Integration Complexity** | High — low-level, steep learning curve |
| **Security** | Must implement own sanitization |

**Recommendation: OPTIONAL**
Reasoning: TipTap wraps ProseMirror with a nicer API. Only use ProseMirror directly if you need the absolute lowest level control. High integration complexity.

---

### 11.4 Slate

| Field | Value |
|---|---|
| **Name** | Slate |
| **URL** | https://slatejs.org |
| **GitHub** | https://github.com/ianstormtaylor/slate |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~50KB |
| **Maintenance** | Slow (v1 rewrite ongoing) |
| **Omix Use Case** | Highly customizable rich text; not recommended |
| **Integration Complexity** | High — frequent breaking changes |
| **Security** | Must implement sanitization |

**Recommendation: AVOID**
Reasoning: Long-running v1 rewrite, unstable API, TipTap is a better choice. MIT but maintenance concerns outweigh benefits.

---

### 11.5 Quill

| Field | Value |
|---|---|
| **Name** | Quill |
| **URL** | https://quilljs.com |
| **GitHub** | https://github.com/slab/quill |
| **License** | BSD-3-Clause |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | JavaScript |
| **Bundle Size** | ~200KB |
| **Maintenance** | Slow (v2 release candidates) |
| **Omix Use Case** | Simple rich text; lightweight |
| **Integration Complexity** | Low |
| **Security** | Delta format; sanitize HTML output |

**Recommendation: OPTIONAL**
Reasoning: Larger bundle, slower maintenance than TipTap. Only consider for simple use cases where TipTap is overkill.

---

## 12. Animation

### 12.1 Framer Motion

| Field | Value |
|---|---|
| **Name** | Framer Motion (Motion) |
| **URL** | https://motion.dev |
| **GitHub** | https://github.com/motiondivision/motion |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~90KB |
| **Maintenance** | Very active |
| **Omix Use Case** | Page transitions, layout animations, gesture animations in generated UIs |
| **Integration Complexity** | Low — declarative React API |
| **Security** | CSS transforms only, low risk |

**Recommendation: USE**
Reasoning: Dominant React animation library. Declarative API, layout animations, gestures. MIT. Use for transitions and micro-interactions in Omix output.

---

### 12.2 GSAP

| Field | Value |
|---|---|
| **Name** | GSAP (GreenSock Animation Platform) |
| **URL** | https://gsap.com |
| **GitHub** | https://github.com/greensock/GSAP |
| **License** | Standard (free for most uses) / Premium (paid) |
| **Open Source** | No (source-available) |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | JavaScript |
| **Bundle Size** | ~50KB (core) |
| **Maintenance** | Very active |
| **Omix Use Case** | Complex timeline animations; SVG morphing; banner animations |
| **Integration Complexity** | Medium — imperative API |
| **Security** | No eval; safe for generated code |

**Recommendation: CONSIDER**
Reasoning: Best for complex, timeline-based animations. Not open-source (source-available). Free for most uses but premium plugins cost money. If Omix needs advanced animations (SVG morphing, scroll-triggered sequences), GSAP is unmatched.

---

### 12.3 Lottie

| Field | Value |
|---|---|
| **Name** | Lottie |
| **URL** | https://airbnb.design/lottie/ |
| **GitHub** | https://github.com/airbnb/lottie-web |
| **License** | Apache-2.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | JavaScript |
| **Bundle Size** | ~70KB (lottie-web), ~30KB (lottie-react) |
| **Maintenance** | Moderate |
| **Omix Use Case** | After Effects animations in web; loading animations, icons |
| **Integration Complexity** | Low |
| **Security** | JSON-based; no code execution |

**Recommendation: OPTIONAL**
Reasoning: Render After Effects animations as JSON. Good for loading states, icon animations. Apache-2.0. Use if Omix needs designer-created animations.

---

### 12.4 Auto Animate

| Field | Value |
|---|---|
| **Name** | @formkit/auto-animate |
| **URL** | https://auto-animate.formkit.com |
| **GitHub** | https://github.com/formkit/auto-animate |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~3KB |
| **Maintenance** | Active |
| **Omix Use Case** | Zero-config list reordering animations; add to any component |
| **Integration Complexity** | Very Low — directive/hook |
| **Security** | CSS transforms, zero risk |

**Recommendation: USE**
Reasoning: Ultra-lightweight. Add a single directive and get animations for free. MIT, 3KB. Perfect for Omix — generate list animations without writing animation code.

---

## 13. AI Infrastructure

### 13.1 OpenRouter

| Field | Value |
|---|---|
| **Name** | OpenRouter |
| **URL** | https://openrouter.ai |
| **GitHub** | https://github.com/OpenRouterTeam/anthropic-cookbook |
| **License** | Proprietary (API gateway) |
| **Open Source** | No |
| **Self-hostable** | No |
| **Docker** | No |
| **Language** | HTTP API |
| **Bundle Size** | N/A |
| **Maintenance** | Active (commercial) |
| **Omix Use Case** | Unified LLM API for AI features; model fallback; cost optimization |
| **Integration Complexity** | Low — OpenAI-compatible API |
| **Security** | Data sent to OpenRouter (EU-hosted); SOC2 pending |

**Recommendation: USE**
Reasoning: Single API for 200+ models. Fallback between providers, cost optimization, no vendor lock-in. Essential for Omix AI features. Not self-hostable but the model routing is valuable.

---

### 13.2 Ollama

| Field | Value |
|---|---|
| **Name** | Ollama |
| **URL** | https://ollama.com |
| **GitHub** | https://github.com/ollama/ollama |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Official (`ollama/ollama`) |
| **Language** | Go |
| **Bundle Size** | ~50MB binary |
| **Maintenance** | Very active (Meta-backed community) |
| **Omix Use Case** | Local LLM inference for offline AI features; low-powered machine support |
| **Integration Complexity** | Low — OpenAI-compatible REST API |
| **Security** | Local; no data leaves machine |

**Recommendation: USE**
Reasoning: Self-hosted LLM inference with OpenAI-compatible API. MIT, Go-based, efficient. Critical for Omix on low-powered machines — can run small models (1-7B) locally without cloud dependency. Docker support.

---

### 13.3 llama.cpp

| Field | Value |
|---|---|
| **Name** | llama.cpp |
| **URL** | https://github.com/ggerganov/llama.cpp |
| **GitHub** | https://github.com/ggerganov/llama.cpp |
| **License** | MIT |
 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Community images |
| **Language** | C/C++ |
| **Bundle Size** | ~5-30MB binary |
| **Maintenance** | Very active (500+ contributors) |
| **Omix Use Case** | Bare-metal LLM inference; maximum performance on low-end hardware |
| **Integration Complexity** | Medium — C API, requires bindings |
| **Security** | Local execution; no network |

**Recommendation: CONSIDER**
Reasoning: Most efficient LLM inference for CPU-only machines. MIT, C/C++. If Omix needs the absolute lowest-resource inference (sub-1GB RAM), llama.cpp is the answer. Ollama wraps it with easier API.

---

### 13.4 vLLM

| Field | Value |
|---|---|
| **Name** | vLLM |
| **URL** | https://vllm.ai |
| **GitHub** | https://github.com/vllm-project/vllm |
| **License** | Apache-2.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Official |
| **Language** | Python/CUDA |
| **Bundle Size** | ~500MB |
| **Maintenance** | Very active (Berkeley + community) |
| **Omix Use Case** | High-throughput LLM serving; GPU-accelerated inference |
| **Integration Complexity** | Medium — requires GPU, Python environment |
| **Security** | API-key auth; TLS support |

**Recommendation: CONSIDER**
Reasoning: Best GPU inference serving. Apache-2.0, very active. Requires NVIDIA GPU (not ideal for low-powered machines). Use if Omix offers a cloud-hosted AI option with GPU acceleration.

---

### 13.5 OpenAI API

| Field | Value |
|---|---|
| **Name** | OpenAI (GPT-4, GPT-4o, o1) |
| **URL** | https://openai.com |
| **GitHub** | N/A (proprietary API) |
| **License** | Proprietary |
| **Open Source** | No |
| **Self-hostable** | No |
| **Docker** | No |
| **Language** | HTTP API |
| **Bundle Size** | N/A |
| **Maintenance** | Active |
| **Omix Use Case** | Premium LLM for complex code generation; highest quality output |
| **Integration Complexity** | Low |
| **Security** | Data sent to OpenAI; SOC2 compliant |

**Recommendation: CONSIDER**
Reasoning: Highest quality LLM but proprietary and paid. Use via OpenRouter for cost optimization. Not self-hostable, so not ideal as the only AI provider for Omix.

---

### 13.6 Anthropic (Claude API)

| Field | Value |
|---|---|
| **Name** | Anthropic (Claude 3.5/4) |
| **URL** | https://anthropic.com |
| **GitHub** | N/A |
| **License** | Proprietary |
| **Open Source** | No |
| **Self-hostable** | No |
| **Docker** | No |
| **Language** | HTTP API |
| **Bundle Size** | N/A |
| **Maintenance** | Active |
| **Omix Use Case** | Code generation; instruction-following; long context for spec generation |
| **Integration Complexity** | Low — OpenAI-compatible |
| **Security** | Data sent to Anthropic; SOC2 compliant |

**Recommendation: CONSIDER**
Reasoning: Excellent for code generation and instruction-following. Long context window (200K) is valuable for large Omix specs. Use via OpenRouter for flexibility.

---

### 13.7 Google Gemini

| Field | Value |
|---|---|
| **Name** | Google Gemini |
| **URL** | https://ai.google.dev |
| **GitHub** | N/A |
| **License** | Proprietary |
| **Open Source** | No |
| **Self-hostable** | No |
| **Docker** | No |
| **Language** | HTTP API |
| **Bundle Size** | N/A |
| **Maintenance** | Active |
| **Omix Use Case** | Multimodal understanding; vision for design-to-spec workflows |
| **Integration Complexity** | Low |
| **Security** | Data sent to Google; enterprise controls available |

**Recommendation: CONSIDER**
Reasoning: Strong multimodal capabilities. If Omix needs to understand screenshots/mockups as input, Gemini is a good choice. Free tier generous. Use via OpenRouter.

---

### 13.8 Cloudflare Workers AI

| Field | Value |
|---|---|
| **Name** | Cloudflare Workers AI |
| **URL** | https://developers.cloudflare.com/workers-ai/ |
| **GitHub** | N/A |
| **License** | Proprietary (Cloudflare) |
| **Open Source** | No |
| **Self-hostable** | No |
| **Docker** | N/A |
| **Language** | HTTP API (Workers) |
| **Bundle Size** | N/A |
| **Maintenance** | Active |
| **Omix Use Case** | Edge-deployed AI inference; low-latency global inference |
| **Integration Complexity** | Low |
| **Security** | Cloudflare-hosted; SOC2; data in Cloudflare's network |

**Recommendation: CONSIDER**
Reasoning: Run models at the edge (300+ locations). Low latency globally. Llama 2/3 available. Not self-hostable but no data residency concerns (EU support). Good for Omix cloud deployment.

---

### 13.9 Hugging Face Inference

| Field | Value |
|---|---|
| **Name** | Hugging Face Inference Endpoints |
| **URL** | https://huggingface.co/inference-endpoints |
| **GitHub** | https://github.com/huggingface |
| **License** | Apache-2.0 (tools) / Various (models) |
| **Open Source** | Yes (infrastructure) |
| **Self-hostable** | Yes (Hugging Face Inference, TGI) |
| **Docker** | Official TGI images |
| **Language** | Python/Rust |
| **Bundle Size** | Varies |
| **Maintenance** | Very active |
| **Omix Use Case** | Open-source LLM serving; custom fine-tuned models |
| **Integration Complexity** | Medium |
| **Security** | Self-hostable; data stays in your infra |

**Recommendation: CONSIDER**
Reasoning: TGI (Text Generation Inference) is Rust-based, Apache-2.0. Self-hostable, efficient. If Omix needs to serve custom fine-tuned models, TGI is the standard. Heavier than Ollama.

---

### 13.10 LiteLLM

| Field | Value |
|---|---|
| **Name** | LiteLLM |
| **URL** | https://litellm.ai |
| **GitHub** | https://github.com/BerriAI/litellm |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Official |
| **Language** | Python |
| **Bundle Size** | ~50MB |
| **Maintenance** | Very active |
| **Omix Use Case** | OpenAI-compatible proxy; multi-provider routing; cost tracking |
| **Integration Complexity** | Low — drop-in OpenAI replacement |
| **Security** | Self-hostable; audit logs; budget controls |

**Recommendation: USE**
Reasoning: Self-hosted alternative to OpenRouter. MIT, Python. Route to 100+ providers, cost tracking, rate limiting, caching. Deploy as a sidecar to Omix. Critical for production AI features.

---

## 14. Code Generation

### 14.1 Babel

| Field | Value |
|---|---|
| **Name** | Babel |
| **URL** | https://babeljs.io |
| **GitHub** | https://github.com/babel/babel |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~200KB (core) |
| **Maintenance** | Very active (7) |
| **Omix Use Case** | AST transformation; custom plugins for spec→code generation |
| **Integration Complexity** | Medium — plugin API is complex |
| **Security** | Parse-only; safe for transforming user input |

**Recommendation: USE**
Reasoning: The JavaScript AST standard. Use Babel for custom code generation plugins — transform Omix specs into framework code. MIT, huge ecosystem. Essential for advanced codegen.

---

### 14.2 jscodeshift

| Field | Value |
|---|---|
| **Name** | jscodeshift |
| **URL** | https://github.com/facebook/jscodeshift |
| **GitHub** | https://github.com/facebook/jscodeshift |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | JavaScript |
| **Bundle Size** | ~30KB |
| **Maintenance** | Moderate (Meta) |
| **Omix Use Case** | AST-based code transformations; codemods for generated code |
| **Integration Complexity** | Low-Medium |
| **Security** | AST-only operations |

**Recommendation: OPTIONAL**
Reasoning: Simpler than Babel for basic AST transformations. If Omix needs codemod-style transformations on generated code, jscodeshift is a lightweight choice.

---

### 14.3 recast

| Field | Value |
|---|---|
| **Name** | recast |
| **URL** | https://github.com/benjamn/recast |
| **GitHub** | https://github.com/benjamn/recast |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | JavaScript |
| **Bundle Size** | ~25KB |
| **Maintenance** | Slow |
| **Omix Use Case** | Preserve formatting when modifying AST; round-trip code transformation |
| **Integration Complexity** | Low |
| **Security** | AST-only |

**Recommendation: CONSIDER**
Reasoning: Key for preserving original formatting when transforming generated code. Pair with jscodeshift. MIT. Useful when Omix modifies existing codebases.

---

### 14.4 esrap

| Field | Value |
|---|---|
| **Name** | esrap |
| **URL** | https://github.com/Rich-Harris/esrap |
| **GitHub** | https://github.com/Rich-Harris/esrap |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~10KB |
| **Maintenance** | Active (Rich Harris / Svelte team) |
| **Omix Use Case** | Code printer; convert AST to formatted code |
| **Integration Complexity** | Low |
| **Security** | Code generation only; no eval |

**Recommendation: USE**
Reasoning: Tiny, fast code printer from Svelte team. MIT. Use to print generated code from AST. The perfect complement to Babel AST transformations.

---

### 14.5 Prettier

| Field | Value |
|---|---|
| **Name** | Prettier |
| **URL** | https://prettier.io |
| **GitHub** | https://github.com/prettier/prettier |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | JavaScript |
| **Bundle Size** | ~50KB (standalone) |
| **Maintenance** | Very active |
| **Omix Use Case** | Format generated code consistently |
| **Integration Complexity** | Low — API or CLI |
| **Security** | Format only; no code execution |

**Recommendation: USE**
Reasoning: Essential for formatting generated code. MIT, opinionated, widely adopted. Generated Omix code should always pass through Prettier.

---

### 14.6 ESLint

| Field | Value |
|---|---|
| **Name** | ESLint |
| **URL** | https://eslint.org |
| **GitHub** | https://github.com/eslint/eslint |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | JavaScript |
| **Bundle Size** | ~30MB (full install) |
| **Maintenance** | Very active (v9 flat config) |
| **Omix Use Case** | Validate generated code; catch errors before runtime |
| **Integration Complexity** | Low-Medium |
| **Security** | Analysis only; some plugins execute code (be selective) |

**Recommendation: USE**
Reason: Validate AI-generated code quality. MIT, huge plugin ecosystem. Run ESLint on output before presenting to users. v9 flat config simplifies setup.

---

### 14.7 AST Explorer (Reference)

| Field | Value |
|---|---|
| **Name** | AST Explorer |
| **URL** | https://astexplorer.net |
| **GitHub** | https://github.com/fkling/astexplorer |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Community |
| **Language** | JavaScript |
| **Maintenance** | Active |
| **Omix Use Case** | Development tool for building AST transformations |
| **Integration Complexity** | Development tool |
| **Security** | Local development |

**Recommendation: USE (dev tool)**
Reasoning: Essential development tool for building Omix codegen. Open-source. Not a runtime dependency.

---

### 14.8 SWC

| Field | Value |
|---|---|
| **Name** | SWC (Speedy Web Compiler) |
| **URL** | https://swc.rs |
| **GitHub** | https://github.com/swc-project/swc |
| **License** | Apache-2.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | Rust |
| **Bundle Size** | ~3MB binary |
| **Maintenance** | Very active (Vercel-backed) |
| **Omix Use Case** | Fast transforms; Rust-based code generation; minification |
| **Integration Complexity** | Medium |
| **Security** | Memory-safe Rust; no known vulnerabilities |

**Recommendation: CONSIDER**
Reasoning: 20x faster than Babel for transforms. If Omix does heavy codegen on the client, SWC's speed matters. Apache-2.0. Use for production transforms; Babel for dev.

---

## 15. Git & Version Control

### 15.1 simple-git

| Field | Value |
|---|---|
| **Name** | simple-git |
| **URL** | https://github.com/steveukx/git-js |
| **GitHub** | https://github.com/steveukx/git-js |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~120KB |
| **Maintenance** | Active |
| **Omix Use Case** | Git operations in Node.js; commit generated code, branch management |
| **Integration Complexity** | Low |
| **Security** | Wraps git CLI; shell escaping is correct |

**Recommendation: USE**
Reasoning: Pure JavaScript git client. No native dependencies. MIT. Perfect for Omix to commit generated code to repos. Supports all git operations.

---

### 15.2 isomorphic-git

| Field | Value |
|---|---|
| **Name** | isomorphic-git |
| **URL** | https://isogit.org |
| **GitHub** | https://github.com/isomorphic-git/isomorphic-git |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | JavaScript (TypeScript types) |
| **Bundle Size** | ~250KB |
| **Maintenance** | Moderate |
| **Omix Use Case** | Git in browser; client-side version control for Omix projects |
| **Integration Complexity** | Medium — FS abstraction needed |
| **Memory** | Pure JS; no native git needed |

**Recommendation: CONSIDER**
Reasoning: Pure JavaScript git that runs in browsers. MIT. If Omix needs client-side git (offline, browser-only), isomorphic-git is the answer. More complex than simple-git.

---

### 15.3 libgit2 / git2-rs

| Field | Value |
|---|---|
| **Name** | git2-rs (libgit2 bindings) |
| **URL** | https://github.com/rust-lang/git2-rs |
| **GitHub** | https://github.com/rust-lang/git2-rs |
| **License** | MIT/Apache-2.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | Rust |
| **Maintenance** | Active |
| **Omix Use Case** | High-performance git in Rust services |
| **Integration Complexity** | High — Rust required |
| **Security** | Mature C library; well-audited |

**Recommendation: OPTIONAL**
Reasoning: Only relevant if Omix has a Rust backend. Use simple-git for Node.js services.

---

### 15.4 nodegit

| Field | Value |
|---|---|
| **Name** | NodeGit |
| **URL** | https://nodegit.org |
| **GitHub** | https://github.com/nodegit/nodegit |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | C++ (Node bindings) |
| **Bundle Size** | ~50MB (native addon) |
| **Maintenance** | Slow |
| **Omix Use Case** | Native libgit2 bindings; heavy for most use cases |
| **Integration Complexity** | High — native compilation |
| **Security** | Native code; potential memory safety issues |

**Recommendation: AVOID**
Reasoning: Native addon complexity, slow maintenance. simple-git is preferred for Node.js use cases.

---

## 16. Containerization & Deployment

### 16.1 Docker

| Field | Value |
|---|---|
| **Name** | Docker |
| **URL** | https://docker.com |
| **GitHub** | https://github.com/moby/moby |
| **License** | Apache-2.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Self-referential |
| **Language** | Go |
| **Bundle Size** | ~200MB (desktop) |
| **Maintenance** | Very active (Docker Inc + community) |
| **Omix Use Case** | Containerize Omix for self-hosting; consistent dev environments |
| **Integration Complexity** | Low |
| **Security** | Rootless mode; scan images for CVEs |

**Recommendation: USE**
Reasoning: Industry standard for containerization. Apache-2.0 (Moby). Use to ship Omix as a Docker image for self-hosters. Essential for reproducible deployments.

---

### 16.2 Podman

| Field | Value |
|---|---|
| **Name** | Podman |
| **URL** | https://podman.io |
| **GitHub** | https://github.com/containers/podman |
| **License** | Apache-2.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Docker-compatible |
| **Language** | Go |
| **Bundle Size** | ~80MB |
| **Maintenance** | Very active (Red Hat) |
| **Omix Use Case** | Daemonless containers; rootless by default |
| **Integration Complexity** | Low |
| **Security** | Rootless by default; daemonless; more secure |

**Recommendation: CONSIDER**
Reasoning: Drop-in Docker replacement with better security (daemonless, rootless). Apache-2.0. Podman Desktop provides GUI. Recommend for Omix users who want containerization without Docker daemon.

---

### 16.3 Docker Compose

| Field | Value |
|---|---|
| **Name** | Docker Compose |
| **URL** | https://docs.docker.com/compose/ |
| **GitHub** | https://github.com/docker/compose |
| **License** | Apache-2.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | Go |
| **Bundle Size** | ~50MB binary |
| **Maintenance** | Active |
| **Omix Use Case** | Define multi-container Omix stacks (app + DB + AI) |
| **Integration Complexity** | Low |
| **Security** | Compose files are declarative |

**Recommendation: USE**
Reasoning: Define Omix deployment with dependent services (Postgres, Ollama, Redis) in a single YAML. Apache-2.0. Essential for self-hosted Omix deployments.

---

## 17. Databases

### 17.1 SQLite (libSQL/Turso)

| Field | Value |
|---|---|
| **Name** | libSQL (fork of SQLite) |
| **URL** | https://turso.tech/libsql |
| **GitHub** | https://github.com/tursodatabase/libsql |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Official images |
| **Language** | C/Rust |
| **Bundle Size** | ~1MB (library) |
| **Maintenance** | Very active (Turso team) |
| **Omix Use Case** | Local-first database for Omix projects; server-side option |
| **Integration Complexity** | Low |
| **Security** | Battle-tested; same guarantees as SQLite |

**Recommendation: USE**
Reasoning: SQLite is the most deployed database. libSQL adds replication, server mode, and improved TypeScript support. MIT. Perfect for Omix: local-first (no server needed), works on low-powered machines, sync to cloud if desired.

---

### 17.2 PostgreSQL

| Field | Value |
|---|---|
| **Name** | PostgreSQL |
| **URL** | https://postgresql.org |
| **GitHub** | https://github.com/postgres/postgres |
| **License** | PostgreSQL License (MIT-like) |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Official images |
| **Language** | C |
| **Bundle Size** | ~50MB (server) |
| **Maintenance** | Very active |
| **Omix Use Case** | Server-side database for multi-user Omix deployments |
| **Integration Complexity** | Low |
| **Security** | Row-level security, SSL, mature auth |

**Recommendation: CONSIDER**
Reasoning: Most advanced open-source RDBMS. If Omix needs multi-user server deployments, PostgreSQL is the standard. PostgreSQL License is permissive. Heavier than SQLite but more featureful.

---

### 17.3 Neon

| Field | Value |
|---|---|
| **Name** | Neon (Serverless Postgres) |
| **URL** | https://neon.tech |
| **GitHub** | https://github.com/neondatabase/neon |
| **License** | Apache-2.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Official |
| **Language** | Rust |
| **Bundle Size** | ~200MB |
| **Maintenance** | Active |
| **Omix Use Case** | Serverless Postgres; branching; scale-to-zero |
| **Integration Complexity** | Low |
| **Security** | TLS; row-level auth |

**Recommendation: CONSIDER**
Reasoning: Serverless PostgreSQL with branching. Apache-2.0, self-hostable. Good for cloud-hosted Omix if you want serverless DB pricing. Not needed for local-first use cases.

---

### 17.4 Supabase

| Field | Value |
|---|---|
| **Name** | Supabase |
| **URL** | https://supabase.com |
| **GitHub** | https://github.com/supabase/supabase |
| **License** | Apache-2.0 (core), MIT (clients) |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Official |
| **Language** | TypeScript/Go/Elixir |
| **Bundle Size** | ~500MB (full stack) |
| **Maintenance** | Very active |
| **Omix Use Case** | Backend-as-a-service; realtime; auth; storage all-in-one |
| **Integration Complexity** | Low (client libraries) |
| **Security** | Row-level security; JWT auth |

**Recommendation: CONSIDER**
Reasoning: Open-source Firebase alternative. PostgreSQL + Realtime + Auth + Storage. Apache-2.0. Self-hostable but heavy. Good for cloud-hosted Omix deployments needing full backend. For local-first Omix, too heavy.

---

### 17.5 Drizzle ORM

| Field | Value |
|---|---|
| **Name** | Drizzle ORM |
| **URL** | https://drizzle.team |
| **GitHub** | https://github.com/drizzle-team/drizzle-orm |
| **License** | Apache-2.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~15KB |
| **Maintenance** | Very active |
| **Omix Use Case** | Type-safe SQL ORM for generated backends |
| **Integration Complexity** | Low |
| **Security** | Parameterized queries; no SQL injection |

**Recommendation: USE**
Reasoning: Best TypeScript ORM. SQL-like syntax, type inference, supports SQLite/Postgres/MySQL. Apache-2.0, tiny bundle. Perfect for Omix to generate type-safe database code.

---

### 17.6 Prisma

| Field | Value |
|---|---|
| **Name** | Prisma |
| **URL** | https://prisma.io |
| **GitHub** | https://github.com/prisma/prisma |
| **License** | Apache-2.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | Rust (engine), TypeScript (client) |
| **Bundle Size** | ~25MB (engine binary) |
| **Maintenance** | Very active (commercial) |
| **Omix Use Case** | Type-safe database client; schema-first ORM |
| **Integration Complexity** | Low |
| **Security** | Parameterized queries; mature |

**Recommendation: CONSIDER**
Reasoning: Schema-first approach maps well to Omix visual schema builder. Apache-2.0. Drizzle is lighter; Prisma has more features. Either is fine. Slight preference for Drizzle for low-powered deployments.

---

### 17.7 Redis

| Field | Value |
|---|---|
| **Name** | Redis |
| **URL** | https://redis.io |
| **GitHub** | https://github.com/redis/redis |
| **License** | BSD-3-Clause / RSALv2/SSPL (modules) |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Official |
| **Language** | C |
| **Bundle Size** | ~15MB |
| **Maintenance** | Very active (Redis Ltd) |
| **Omix Use Case** | Caching; session store; pub/sub for realtime |
| **Integration Complexity** | Low |
| **Security** | ACL, TLS, auth |

**Recommendation: CONSIDER**
Reasoning: Standard caching and pub/sub. BSD-3-Clause (core). Use if Omix needs server-side caching or session management. Not needed for local-first deployments.

---

### 17.8 LevelDB / RocksDB

| Field | Value |
|---|---|
| **Name** | LevelDB (via `classic-level`) |
| **URL** | https://github.com/Level/classic-level |
| **GitHub** | https://github.com/Level |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | C++ (Node bindings) |
| **Bundle Size** | ~2MB |
| **Maintenance** | Moderate |
| **Omix Use Case** | Embedded key-value store for browser/Node; fast local storage |
| **Integration Complexity** | Low |
| **Security** | Embedded; no network attack surface |

**Recommendation: OPTIONAL**
Reasoning: Embedded KV store. If Omix needs local persistence beyond SQLite (caching, blob storage), LevelDB is a good choice. MIT, tiny.

---

## 18. Authentication

### 18.1 Better Auth

| Field | Value |
|---|---|
| **Name** | Better Auth |
| **URL** | https://better-auth.com |
| **GitHub** | https://github.com/better-auth/better-auth |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~30KB |
| **Maintenance** | Very active |
| **Omix Use Case** | Self-hosted auth for generated apps; OAuth, email, magic link |
| **Integration Complexity** | Low — framework adapters for Next, Svelte, etc. |
| **Security** | OWASP-aligned; CSRF, XSS, session fixation protection |

**Recommendation: USE**
Reasoning: Modern, framework-agnostic auth library. MIT. Supports all major auth methods. Self-hostable (uses your own DB). Perfect for Omix-generated apps that need auth.

---

### 18.2 Auth.js (NextAuth v5)

| Field | Value |
|---|---|
| **Name** | Auth.js (NextAuth) |
| **URL** | https://authjs.dev |
| **GitHub** | https://github.com/nextauthjs/next-auth |
| **License** | ISC |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~40KB |
| **Maintenance** | Active (v5 rewrite) |
| **Omix Use Case** | Next.js auth; OAuth providers; JWT/database sessions |
| **Integration Complexity** | Low (Next.js) |
| **Security** | OWASP-aligned; well-audited |

**Recommendation: CONSIDER**
Reasoning: Best-in-class for Next.js. ISC license. If Omix generates Next.js apps, Auth.js is the standard. Less framework-agnostic than Better Auth.

---

### 18.3 Lucia (Reference)

| Field | Value |
|---|---|
| **Name** | Lucia |
| **URL** | https://lucia-auth.com |
| **GitHub** | https://github.compilat/lucia |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~20KB |
| **Maintenance** | Rewriting (v4 in progress) |
| **Omix Use Case** | Educational reference for auth patterns |
| **Integration Complexity** | Medium |
| **Security** | Excellent patterns |

**Recommendation: AVOID (as library) / USE (as reference)**
Reasoning: Currently being rewritten; unstable API. Study the patterns for Omix auth but don't depend on the library. Use Better Auth instead.

---

### 18.4 Clerk

| Field | Value |
|---|---|
| **Name** | Clerk |
| **URL** | https://clerk.com |
| **GitHub** | N/A |
| **License** | Proprietary |
| **Open Source** | No |
| **Self-hostable** | No |
| **Docker** | No |
| **Language** | React components |
| **Bundle Size** | ~100KB |
| **Maintenance** | Active |
| **Omix Use Case** | Managed auth service |
| **Integration Complexity** | Very Low |
| **Security** | SOC2; data on Clerk servers |

**Recommendation: AVOID**
Reasoning: Proprietary, cloud-only. Opposes Omix's self-hostable philosophy. Use Better Auth or Auth.js instead.

---

## 19. Object Storage

### 19.1 AWS S3 SDK

| Field | Value |
|---|---|
| **Name** | AWS SDK for JavaScript (S3) |
| **URL** | https://aws.amazon.com/sdk-for-javascript/ |
| **GitHub** | https://github.com/aws/aws-sdk-js-v3 |
| **License** | Apache-2.0 |
| **Open Source** | Yes |
| **Self-hostable** | N/A (AWS service) |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~15KB per client (modular) |
| **Maintenance** | Very active |
| **Omix Use Case** | S3-compatible storage for assets; backups |
| **Integration Complexity** | Low |
| **Security** | IAM policies, SSE, bucket ACLs |

**Recommendation: CONSIDER**
Reasoning: Industry standard. Apache-2.0. Modular (only import S3). If Omix users choose AWS, use this SDK. But prefer abstraction layer for multi-provider support.

---

### 19.2 Cloudflare R2

| Field | Value |
|---|---|
| **Name** | Cloudflare R2 |
| **URL** | https://cloudflare.com/products/r2/ |
| **GitHub** | N/A (service) |
| **License** | Proprietary (service) |
| **Open Source** | No |
| **Self-hostable** | No |
| **Docker** | N/A |
| **Language** | S3-compatible API |
| **Maintenance** | Active |
| **Omix Use Case** | Zero-egress storage; cheaper than S3 |
| **Integration Complexity** | Low (S3-compatible) |
| **Security** | Cloudflare-managed |

**Recommendation: CONSIDER**
Reasoning: S3-compatible with zero egress fees. Cheaper for most use cases. Not self-hostable but good for Omix cloud deployments. Use via S3 SDK with R2 endpoint.

---

### 19.3 MinIO

| Field | Value |
|---|---|
| **Name** | MinIO |
| **URL** | https://min.io |
| **GitHub** | https://github.com/minio/minio |
| **License** | AGPL-3.0 / Commercial |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Official |
| **Language** | Go |
| **Bundle Size** | ~100MB binary |
| **Maintenance** | Very active |
| **Omix Use Case** | Self-hosted S3-compatible storage |
| **Integration Complexity** | Low — S3 API compatible |
| **Security** | Encryption, IAM, audit logging |

**Recommendation: USE**
Reasoning: S3-compatible and self-hostable. AGPL-3.0 (or commercial license). Essential for self-hosted Omix deployments needing object storage. Docker support. Full S3 API compatibility.

---

### 19.4 s3rver

| Field | Value |
|---|---|
| **Name** | s3rver |
| **URL** | https://github.com/jamhall/s3rver |
| **GitHub** | https://github.com/jamhall/s3rver |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~10MB |
| **Maintenance** | Moderate |
| **Omix Use Case** | Local S3 mock for development/testing |
| **Integration Complexity** | Very Low |
| **Security** | Dev only; not for production |

**Recommendation: USE (dev)**
Reasoning: Local S3 mock for development. MIT. Use in Omix development environments to avoid cloud dependencies during local dev.

---

## 20. Deployment Platforms

### 20.1 Vercel

| Field | Value |
|---|---|
| **Name** | Vercel |
| **URL** | https://vercel.com |
| **GitHub** | N/A |
| **License** | Proprietary (SaaS) |
| **Open Source** | No |
| **Self-hostable** | No |
| **Docker** | N/A |
| **Language** | N/A |
| **Bundle Size** | N/A |
| **Maintenance** | Active |
| **Omix Use Case** | Deploy generated Next.js apps; edge functions |
| **Integration Complexity** | Very Low — git push to deploy |
| **Security** | SOC2; data in Vercel infra |

**Recommendation: CONSIDER**
Reasoning: Best for Next.js. Not self-hostable. Use as a deployment target for Omix-generated Next.js apps, but don't make it the only option.

---

### 20.2 Netlify

| Field | Value |
|---|---|
| **Name** | Netlify |
| **URL** | https://netlify.com |
| **GitHub** | N/A |
| **License** | Proprietary (SaaS) |
| **Open Source** | No |
| **Self-hostable** | No |
| **Docker** | N/A |
| **Language** | N/A |
| **Bundle Size** | N/A |
| **Maintenance** | Active |
| **Omix Use Case** | Static site deployment; forms; functions |
| **Integration Complexity** | Very Low |
| **Security** | SOC2 |

**Recommendation: CONSIDER**
Reasoning: Good for static sites and simple web apps. Not self-hostable. Use as one of many deployment targets.

---

### 20.3 Render

| Field | Value |
|---|---|
| **Name** | Render |
| **URL** | https://render.com |
| **GitHub** | N/A |
| **License** | Proprietary (SaaS) |
| **Open Source** | No |
| **Self-hostable** | No |
| **Docker** | N/A |
| **Language** | N/A |
| **Bundle Size** | N/A |
| **Maintenance** | Active |
| **Omix Use Case** | Full-stack deployment; databases; cron jobs |
| **Integration Complexity** | Low |
| **Security** | SOC2; automatic TLS |

**Recommendation: CONSIDER**
Reasoning: Good alternative to Heroku. Managed Postgres. Not self-hostable but reasonable for simple cloud deployment.

---

### 20.4 Railway

| Field | Value |
|---|---|
| **Name** | Railway |
| **URL** | https://railway.app |
| **GitHub** | N/A |
| **License** | Proprietary (SaaS) |
| **Open Source** | No |
| **Self-hostable** | No |
| **Docker** | N/A |
| **Language** | N/A |
| **Bundle Size** | N/A |
| **Maintenance** | Active |
| **Omix Use Case** | Developer-friendly full-stack deployment |
| **Integration Complexity** | Very Low |
| **Security** | TLS; private networking |

**Recommendation: CONSIDER**
Reasoning: Easiest DX for full-stack deployment. Not self-hostable. Good for developers wanting quick deployment.

---

### 20.5 Coolify

| Field | Value |
|---|---|
| **Name** | Coolify |
| **URL** | https://coolify.io |
| **GitHub** | https://github.com/coollabsio/coolify |
| **License** | Apache-2.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Official |
| **Language** | PHP/Vue/Svelte |
| **Bundle Size** | ~300MB (Docker) |
| **Maintenance** | Very active |
| **Omix Use Case** | Self-hosted Vercel/Netlify alternative; deploy Omix |
| **Integration Complexity** | Low — connects to Git repos, Docker |
| **Security** | Self-hosted; auth with SSO |

**Recommendation: USE**
Reasoning: Self-hosted alternative to Vercel/Netlify. Apache-2.0. Deploys any Docker/containerized app. Essential for self-hosted Omix deployments. Simple UI, connects to Git providers.

---

### 20.6 Dokku

| Field | Value |
|---|---|
| **Name** | Dokku |
| **URL** | https://dokku.com |
| **GitHub** | https://github.com/dokku/dokku |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Uses Docker |
| **Language** | Shell/Bash/Go |
| **Bundle Size** | ~200MB |
| **Maintenance** | Active |
| **Omix Use Case** | Self-hosted Heroku alternative; git push to deploy |
| **Integration Complexity** | Low-Medium |
| **Security** | SSH keys; SSL via Let's Encrypt |

**Recommendation: CONSIDER**
Reasoning: Heroku-like PaaS on your own server. MIT. Lighter than Coolify. Good for single-server Omix deployments. Use for simple self-hosting.

---

### 20.7 Deno Deploy

| Field | Value |
|---|---|
| **Name** | Deno Deploy |
| **URL** | https://deno.com/deploy |
| **GitHub** | https://github.com/denoland/deploy_feedback |
| **License** | Proprietary (service) |
| **Open Source** | No |
| **Self-hostable** | No |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Maintenance** | Active |
| **Omix Use Case** | Edge deployment for Deno-based output |
| **Integration Complexity** | Low |
| **Security** | Deno-managed |

**Recommendation: OPTIONAL**
Reasoning: Good for Deno output. Not self-hostable. Only relevant if Omix targets Deno as a deployment runtime.

---

## 21. Testing

### 21.1 Vitest

| Field | Value |
|---|---|
| **Name** | Vitest |
| **URL** | https://vitest.dev |
| **GitHub** | https://github.com/vitest-dev/vitest |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~10MB |
| **Maintenance** | Very active |
| **Omix Use Case** | Unit/component testing for Omix output; fast test runner |
| **Integration Complexity** | Low |
| **Security** | Isolated VM; no network by default |

**Recommendation: USE**
Reasoning: Fastest test runner. Native ESM, TypeScript support. MIT. Generate Vitest tests alongside Omix output. Drop-in Jest replacement.

---

### 21.2 Playwright

| Field | Value |
|---|---|
| **Name** | Playwright |
| **URL** | https://playwright.dev |
| **GitHub** | https://github.com/microsoft/playwright |
| **License** | Apache-2.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Official |
| **Language** | TypeScript |
| **Bundle Size** | ~30MB (runtime) |
| **Maintenance** | Very active (Microsoft) |
| **Omix Use Case** | E2E testing; visual regression testing for Omix output |
| **Integration Complexity** | Low-Medium |
| **Security** | Browser isolation; no cross-test contamination |

**Recommendation: USE**
Reasoning: Best E2E testing framework. Apache-2.0. Use for testing Omix-generated apps. Visual regression testing is critical for visual builder output.

---

### 21.3 Testing Library

| Field | Value |
|---|---|
| **Name** | Testing Library |
| **URL** | https://testing-library.com |
| **GitHub** | https://github.com/testing-library |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~5KB per package |
| **Maintenance** | Very active |
| **Omix Use Case** | Component tests; accessible testing patterns |
| **Integration Complexity** | Low |
| **Security** | Standard test security |

**Recommendation: USE**
Reasoning: Complements Vitest/Playwright. Tests from user's perspective. MIT. Generate Testing Library tests for Omix output.

---

### 21.4 Storybook

| Field | Value |
|---|---|
| **Name** | Storybook |
| **URL** | https://storybook.js.org |
| **GitHub** | https://github.com/storybooks/storybook |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Community |
| **Language** | TypeScript |
| **Bundle Size** | ~100MB |
| **Maintenance** | Very active |
| **Omix Use Case** | Component development environment; visual isolation |
| **Integration Complexity** | Medium |
| **Security** | Local dev tool |

**Recommendation: CONSIDER**
Reasoning: Great for component development. MIT. If Omix generates Storybook stories for each component, it aids both development and testing. Heavier setup.

---

### 21.5 Jest (Legacy)

| Field | Value |
|---|---|
| **Name** | Jest |
| **URL** | https://jestjs.io |
| **GitHub** | https://github.com/jestjs/jest |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | JavaScript |
| **Bundle Size** | ~50MB |
| **Maintenance** | Maintenance mode (Vercel migrating to Vitest) |
| **Omix Use Case** | Legacy test runner |
| **Integration Complexity** | Low |
| **Security** | Well-audited |

**Recommendation: AVOID**
Reasoning: Superseded by Vitest in 2026. Use Vitest for new projects.

---

### 21.6 Cypress

| Field | Value |
|---|---|
| **Name** | Cypress |
| **URL** | https://cypress.io |
| **GitHub** | https://github.com/cypress-io/cypress |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Official |
| **Language** | JavaScript |
| **Bundle Size** | ~100MB |
| **Maintenance** | Moderate |
| **Omix Use Case** | E2E testing alternative to Playwright |
| **Integration Complexity** | Low-Medium |
| **Security** | Browser-based; some limitations |

**Recommendation: CONSIDER**
Reasoning: Playwright is preferred (multi-browser, faster). Cypress is still viable for simpler E2E setups. MIT.

---

## 22. Accessibility

### 22.1 axe-core

| Field | Value |
|---|---|
| **Name** | axe-core |
| **URL** | https://dequelabs.com/axe/ |
| **GitHub** | https://github.com/dequelabs/axe-core |
| **MPL-2.0** | |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | JavaScript |
| **Bundle Size** | ~120KB |
| **Maintenance** | Very active (Deque) |
| **Omix Use Case** | Automated accessibility testing for generated UIs |
| **Integration Complexity** | Low |
| **Security** | Analysis only; no network |

**Recommendation: USE**
Reasoning: Industry-standard accessibility testing. MPL-2.0. Integrate into Omix output validation — every generated page should pass axe-core.

---

### 22.2 pa11y

| Field | Value |
|---|---|
| **Name** | pa11y |
| **URL** | https://pa11y.org |
| **LGPL-3.0** | |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Official |
| **Language** | JavaScript |
| **Bundle Size** | ~50MB |
| **Maintenance** | Moderate |
| **Omix Use Case** | CI accessibility testing; monitor live sites |
| **Integration Complexity** | Low |
| **Security** | Analysis only |

**Recommendation: CONSIDER**
Reasoning: CI-focused accessibility testing. LGPL-3.0 (copyleft concerns for commercial products). axe-core is sufficient for most use cases.

---

### 22.3 focus-trap

| Field | Value |
|---|---|
| **Name** | focus-trap |
| **URL** | https://github.com/focus-trap/focus-trap |
| **GitHub** | https://github.com/focus-trap/focus-trap |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~5KB |
| **Maintenance** | Active |
| **Omix Use Case** | Trap focus in modals/dialogs; accessibility compliance |
| **Integration Complexity** | Low |
| **Security** | Focus management only |

**Recommendation: USE**
Reasoning: Tiny, MIT. Essential for accessible modals. Use in Omix-generated dialog components.

---

### 22.4 react-aria

| Field | Value |
|---|---|
| **Name** | React Aria |
| **URL** | https://react-spectrum.adobe.com/react-aria/ |
| **GitHub** | https://github.com/adobe/react-spectrum |
| **License** | Apache-2.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~10KB per hook |
| **Maintenance** | Very active (Adobe) |
| **Omix Use Case** | Accessible component hooks; internationalization |
| **Integration Complexity** | Medium |
| **Security** | WAI-ARIA compliant |

**Recommendation: CONSIDER**
Reasoning: Adobe's accessible component hooks. Apache-2.0. If Omix needs I18n/l10n support alongside accessibility, React Aria provides both. More complex than Radix.

---

## 23. Collaboration & Realtime

### 23.1 Yjs

| Field | Value |
|---|---|
| **Name** | Yjs |
| **URL** | https://yjs.dev |
| **GitHub** | https://github.com/yjs/yjs |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A (server-agnostic) |
| **Language** | TypeScript |
| **Bundle Size** | ~35KB |
| **Maintenance** | Very active |
| **Omix Use Case** | CRDT-based realtime collaboration; multi-user editing |
| **Integration Complexity** | Medium — CRDT concepts are complex |
| **Security** | Encrypted providers available (y-webrtc) |

**Recommendation: USE**
Reasoning: Best CRDT library for JavaScript. MIT. If Omix supports multi-user collaboration, Yjs is the standard. Integrates with TipTap (rich text), IndexedDB (offline), and WebRTC (P2P).

---

### 23.2 Liveblocks

| Field | Value |
|---|---|
| **Name** | Liveblocks |
| **URL** | https://liveblocks.io |
| **GitHub** | https://github.com/liveblocks/liveblocks |
| **License** | Apache-2.0 (open source) / Proprietary (service) |
| **Open Source** | Partial |
| **Self-hostable** | Yes (open-source parts) |
| **Docker** | Official (self-hosted) |
| **Language** | TypeScript |
| **Bundle Size** | ~60KB |
| **Maintenance** | Active (commercial) |
| **Omix Use Case** | Managed realtime collaboration; presence; cursors |
| **Integration Complexity** | Low |
| **Security** | End-to-end encryption; SOC2 |

**Recommendation: CONSIDER**
Reasoning: Managed collaboration service with self-hosted option. Apache-2.0 (OSS). If Omix wants to offer realtime collaboration as a managed service, Liveblocks accelerates development.

---

### 23.3 Socket.io

| Field | Value |
|---|---|
| **Name** | Socket.io |
| **URL** | https://socket.io |
| **GitHub** | https://github.com/socketio/socket.io |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | JavaScript |
| **Bundle Size** | ~25KB |
| **Maintenance** | Very active |
| **Omix Use Case** | Real-time communication; presence; notifications |
| **Integration Complexity** | Low |
| **Security** | CORS, auth handshake, room isolation |

**Recommendation: CONSIDER**
Reasoning: Standard WebSocket library with fallbacks. MIT. For real-time features in self-hosted Omix. If using Yjs for collaboration, Socket.io isn't needed (Yjs uses its own providers).

---

### 23.4 PartyKit

| Field | Value |
|---|---|
| **Name** | PartyKit |
| **URL** | https://partykit.io |
| **GitHub** | https://github.com/partykit/partykit |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Official |
| **Language** | TypeScript |
| **Bundle Size** | N/A (edge runtime) |
| **Maintenance** | Very active |
| **Omix Use Case** | Edge-realtime collaboration; small state sync |
| **Integration Complexity** | Low |
| **Security** | Edge isolation; small compute model |

**Recommendation: CONSIDER**
Reasoning: Edge-first collaboration runtime. MIT. Lightweight alternative to Liveblocks for simple realtime state. Self-hostable.

---

## 24. Package Management & Build Tools

### 24.1 pnpm

| Field | Value |
|---|---|
| **Name** | pnpm |
| **URL** | https://pnpm.io |
| **GitHub** | https://github.com/pnpm/pnpm |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes (private registry) |
| **Docker** | Official |
| **Language** | TypeScript |
| **Bundle Size** | ~30MB (binary) |
| **Maintenance** | Very active |
| **Omix Use Case** | Fast, disk-efficient package management for generated projects |
| **Integration Complexity** | Low |
| **Security** | Content-addressable storage; reduced supply chain risk |

**Recommendation: USE**
Reasoning: Fastest Node.js package manager. Content-addressable storage reduces disk usage. MIT. Generate pnpm-based Omix projects for efficiency.

---

### 24.2 Bun

| Field | Value |
|---|---|
| **Name** | Bun |
| **URL** | https://bun.sh |
| **GitHub** | https://github.com/oven-sh/bun |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Official |
| **Language** | Zig |
| **Bundle Size** | ~50MB (runtime) |
| **Maintenance** | Very active |
| **Omix Use Case** | Fast runtime + bundler + test runner; all-in-one |
| **Integration Complexity** | Low (Node.js compatible) |
| **Security** | Native TLS, fast crypto |

**Recommendation: CONSIDER**
Reasoning: All-in-one (runtime, bundler, test runner, package manager). MIT. Could replace Node + Vitest + esbuild in Omix toolchain. Newer but maturing fast. Good for low-powered machines (faster than Node).

---

### 24.3 npm

| Field | Value |
|---|---|
| **Name** | npm |
| **URL** | https://npmjs.com |
| **GitHub** | https://github.com/npm/cli |
| **License** | Artistic-2.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes (private registry) |
| **Docker** | Official |
| **Language** | JavaScript |
| **Bundle Size** | ~30MB |
| **Maintenance** | Active |
| **Omix Use Case** | Default package manager; compatibility |
| **Integration Complexity** | Low |
| **Security** | Audit, 2FA, provenance |

**Recommendation: CONSIDER**
Reasoning: Default, universal compatibility. pnpm is faster and more efficient; Bun is faster. npm remains the fallback for maximum compatibility.

---

### 24.4 Turborepo

| Field | Value |
|---|---|
| **Name** | Turborepo |
| **URL** | https://turbo.build/repo |
| **GitHub** | https://github.com/vercel/turborepo |
| **License** | MPL-2.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | Rust (binary), TypeScript (config) |
| **Bundle Size** | ~20MB |
| **Maintenance** | Very active (Vercel) |
| **Omix Use Case** | Monorepo orchestration for generated multi-package projects |
| **Integration Complexity** | Low |
| **Security** | Local caching; remote cache encryption |

**Recommendation: CONSIDER**
Reasoning: Fast monorepo task orchestration. MPL-2.0. If Omix generates multi-package projects (frontend + backend + AI), Turborepo manages build order and caching. Rust-powered.

---

### 24.5 Nx

| Field | Value |
|---|---|
| **Name** | Nx |
| **URL** | https://nx.dev |
| **GitHub** | https://github.com/nrwl/nx |
| **License** | MIT |
 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~30MB |
| **Maintenance** | Very active |
| **Omix Use Case** | Monorepo management; code generation; affected tests |
| **Integration Complexity** | Medium |
| **Security** | Local caching |

**Recommendation: CONSIDER**
Reasoning: More features than Turborepo (code generation, affected commands). MIT. Heavier but more powerful. Choose Turborepo for simplicity, Nx for enterprise features.

---

## 25. Monitoring & Observability

### 25.1 Sentry

| Field | Value |
|---|---|
| **Name** | Sentry |
| **URL** | https://sentry.io |
| **GitHub** | https://github.com/getsentry/sentry |
| **License** | MIT (SDK) / Functional Source License (server) |
| **Open Source** | Yes (self-hostable) |
| **Self-hostable** | Yes |
| **Docker** | Official |
| **Language** | Python/Rust |
| **Bundle Size** | ~30KB (JS SDK) |
| **Maintenance** | Very active |
| **Omix Use Case** | Error tracking for generated apps; performance monitoring |
| **Integration Complexity** | Low |
| **Security** | PII scrubbing; self-hosting keeps data in your infra |

**Recommendation: USE**
Reasoning: Standard error tracking. MIT SDKs. Self-hostable server (FSL). Essential for monitoring Omix-generated apps in production.

---

### 25.2 OpenTelemetry

| Field | Value |
|---|---|
| **Name** | OpenTelemetry |
| **URL** | https://opentelemetry.io |
| **GitHub** | https://github.com/open-telemetry |
| **License** | Apache-2.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | Multi-language |
| **Bundle Size** | ~20KB (JS) |
| **Maintenance** | Very active (CNCF) |
| **Omix Use Case** | Distributed tracing; vendor-neutral observability |
| **Integration Complexity** | Medium |
| **Security** | No vendor lock-in; data stays with you |

**Recommendation: USE**
Reasoning: Vendor-neutral observability standard. Apache-2.0. CNCF graduated. Use for tracing across Omix microservices (codegen, AI inference, rendering). Integrates with Jaeger, Grafana, Datadog, etc.

---

### 25.3 Grafana (with Loki)

| Field | Value |
|---|---|
| **Name** | Grafana + Loki |
| **URL** | https://grafana.com |
| **GitHub** | https://github.com/grafana/grafana |
| **License** | AGPL-3.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Official |
| **Language** | Go/TypeScript |
| **Bundle Size** | ~200MB (server) |
| **Maintenance** | Very active (Grafana Labs) |
| **Omix Use Case** | Log aggregation; dashboards for Omix usage metrics |
| **Integration Complexity** | Medium |
| **Security** | RBAC; data source isolation |

**Recommendation: OPTIONAL**
Reasoning: AGPL-3.0. Excellent for monitoring Omix server deployments. If you need log aggregation and dashboards, Grafana+Loki is the standard open-source stack.

---

### 25.4 Axiom / Plausible (Analytics)

| Field | Value |
|---|---|
| **Name** | Plausible Analytics |
| **URL** | https://plausible.io |
| **GitHub** | https://github.com/plausible/analytics |
| ** ** | AGPL-3.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Official |
| **Language** | Elixir |
| **Bundle Size** | ~150MB |
| **Maintenance** | Active |
| **Omix Use Case** | Privacy-friendly analytics for Omix usage metrics |
| **Integration Complexity** | Low |
| **Security** | GDPR-compliant; no cookies |

**Recommendation: CONSIDER**
Reasoning: Lightweight, privacy-friendly. AGPL-3.0. Use if you need to track Omix usage analytics without invasive tracking.

---

### 25.5 Umami

| Field | Value |
|---|---|
| **Name** | Umami |
| **URL** | https://umami.is |
| **GitHub** | https://github.com/umami-software/umami |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Official |
| **Language** | TypeScript |
| **Bundle Size** | ~50MB |
| **Maintenance** | Active |
| **Omix Use Case** | Privacy-friendly analytics; MIT alternative to Plausible |
| **Integration Complexity** | Low |
| **Security** | Self-hosted; no data sharing |

**Recommendation: USE**
Reasoning: MIT-licensed alternative to Plausible. Lighter stack (Node.js). Good for tracking Omix usage without privacy concerns.

---

## 26. SEO & Meta

### 26.1 Next SEO (legacy) / Next.js Head

| Field | Value |
|---|---|
| **Name** | Next.js Metadata API |
| **URL** | https://nextjs.org/docs/app/api-reference/functions/generate-metadata |
| **GitHub** | https://github.com/vercel/next.js |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | Built-in |
| **Maintenance** | Very active |
| **Omix Use Case** | Generate SEO metadata for output pages |
| **Integration Complexity** | Low |
| **Security** | Auto Open Graph, structured data |

**Recommendation: USE (for Next.js output)**
Reasoning: Built into Next.js. MIT. Generate metadata from Omix specs automatically.

---

### 26.2 React Helmet Async

| Field | Value |
|---|---|
| **Name** | React Helmet Async |
| **URL** | https://github.com/staylor/react-helmet-async |
| **GitHub** | https://github.com/staylor/react-helmet-async |
| **License** | Apache-2.0 |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~10KB |
| **Maintenance** | Moderate |
| **Omix Use Case** | Document head management for non-Next.js output |
| **Integration Complexity** | Low |
| **Security** | Sanitizes injected content |

**Recommendation: CONSIDER**
Reasoning: For non-Next.js output. Apache-2.0. Use if Omix generates React SPAs that need dynamic meta tags.

---

## 27. Validation & Types

### 27.1 Zod (already listed in §10.4)

### 27.2 Valibot

| Field | Value |
|---|---|
| **Name** | Valibot |
| **URL** | https://valibot.dev |
| **GitHub** | https://github.com/fabian-hiller/valibot |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~3KB (modular) |
| **Maintenance** | Very active |
| **Omix Use Case** | Modular validation; smaller bundle than Zod |
| **Integration Complexity** | Low |
| **Security** | Type-safe |

**Recommendation: CONSIDER**
Reasoning: Modular alternative to Zod with smaller bundle. MIT. Good for low-powered deployments. Zod has larger ecosystem; Valibot is more tree-shakeable.

---

### 27.3 Superstruct

| Field | Value |
|---|---|
| **Name** | Superstruct |
| **URL** | https://docs.superstructjs.org |
| **GitHub** | https://github.com/ianstormtaylor/superstruct |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~12KB |
| **Maintenance** | Slow |
| **Omix Use Case** | Runtime validation |
| **Integration Complexity** | Low |
| **Security** | Type-safe |

**Recommendation: AVOID**
Reasoning: Zod and Valibot are better maintained. Superstruct is effectively abandoned.

---

## 28. State Management

### 28.1 Zustand

| Field | Value |
|---|---|
| **Name** | Zustand |
| **URL** | https://pmndrs.github.io/zustand/ |
| **GitHub** | https://github.com/pmndrs/zustand |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~3KB |
| **Maintenance** | Very active (Poimandres) |
| **Omix Use Case** | Lightweight state management for generated apps and Omix itself |
| **Integration Complexity** | Low |
| **Security** | No security implications |

**Recommendation: USE**
Reasoning: Minimalist state management. MIT, tiny bundle. Perfect for Omix's own state (editor state, component tree, undo/redo). Use in Omix output apps.

---

### 28.2 Jotai

| Field | Value |
|---|---|
| **Name** | Jotai |
| **URL** | https://jotai.org |
| **GitHub** | https://github.com/pmndrs/jotai |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~5KB |
| **Maintenance** | Very active |
| **Omix Use Case** | Atom-based state; derived state for complex editors |
| **Integration Complexity** | Low |
| **Security** | Standard |

**Recommendation: CONSIDER**
Reasoning: Atomic state model derived from Recoil. MIT, small bundle. Good for Omix if complex derived state is needed (e.g., derived component props). Zustand is simpler for most use cases.

---

### 28.3 Valtio

| Field | Value |
|---|---|
| **Name** | Valtio |
| **URL** | https://valtio.pmnd.rs |
| **GitHub** | https://github.com/pmndrs/valtio |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~4KB |
| **Maintenance** | Active |
| **Omix Use Case** | Proxy-based state; mutable API with immutable snapshots |
| **Integration Complexity** | Low |
| **Security** | Standard |

**Recommendation: OPTIONAL**
Reasoning: Proxy-based state is intuitive. MIT, tiny. Zustand is more established. Use if the mutable API appeals to Omix developers.

---

### 28.4 TanStack Query

| Field | Value |
|---|---|
| **Name** | TanStack Query |
| **URL** | https://tanstack.com/query |
| **GitHub** | https://github.com/TanStack/query |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~15KB |
| **Maintenance** | Very active |
| **Omix Use Case** | Server state management; caching; optimistic updates |
| **Integration Complexity** | Low |
| **Security** | Standard |

**Recommendation: USE**
Reasoning: Essential for any app with server data. MIT, excellent DX. Generated Omix apps with backend data should use TanStack Query.

---

### 28.5 XState

| Field | Value |
|---|---|
| **Name** | XState |
| **URL** | https://stately.ai/docs |
| **GitHub** | https://github.com/statelyai/xstate |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~20KB |
| **Maintenance** | Very active |
| **Omix Use Case** | Finite state machines for editor states; workflow automation |
| **Integration Complexity** | Medium |
| **Security** | State machine correctness |

**Recommendation: CONSIDER**
Reasoning: If Omix has complex editor states (idle → selecting → dragging → editing → rendering), XState provides clarity. MIT. Stately provides visual editing. Overkill for simple state but valuable for complex editor UX.

---

## 29. Utilities & Foundation Libraries

### 29.1 Radash

| Field | Value |
|---|---|
| **Name** | Radash |
| **URL** | https://radash.byjohann.com |
| **GitHub** | https://github.com/rayepps/radash |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~10KB (tree-shakeable) |
| **Maintenance** | Active |
| **Omix Use Case** | Utility library; TypeScript-native |
| **Integration Complexity** | Very Low |
| **Security** | Standard utilities |

**Recommendation: USE**
Reasoning: Modern TypeScript utility library (replacement for Lodash). MIT, tree-shakeable. Use throughout Omix for clean utility functions.

---

### 29.2 Date-fns

| Field | Value |
|---|---|
| **Name** | date-fns |
| **URL** | https://date-fns.org |
| **GitHub** | https://github.com/date-fns/date-fns |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~5KB (tree-shaken) |
| **Maintenance** | Active |
| **Omix Use Case** | Date manipulation in generated UIs |
| **Integration Complexity** | Low |
| **Security** | Standard |

**Recommendation: USE**
Reasoning: Standard date library. MIT, tree-shakeable. Use instead of Moment.js (deprecated).

---

### 29.3 Day.js

| Field | Value |
|---|---|
| **Name** | Day.js |
| **URL** | https://day.js.org |
| **GitHub** | https://github.com/iamkun/dayjs |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | JavaScript |
| **Bundle Size** | ~3KB |
| **Maintenance** | Moderate |
| **Omix Use Case** | Tiny date library alternative |
| **Integration Complexity** | Low |
| **Security** | Standard |

**Recommendation: OPTIONAL**
Reasoning: Smaller than date-fns but less tree-shakeable. date-fns is preferred for TypeScript projects.

---

### 29.4 Lodash-es

| Field | Value |
|---|---|
| **Name** | lodash-es |
| **URL** | https://lodash.com |
| **GitHub** | https://github.com/lodash/lodash |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | JavaScript |
| **Bundle Size** | ~5KB (tree-shaken) |
| **Maintenance** | Maintenance mode |
| **Omix Use Case** | Legacy utility functions |
| **Integration Complexity** | Low |
| **Security** | Some CVEs in deep clone |

**Recommendation: CONSIDER**
Reasoning: Maintenance mode. Prefer Radash for new projects. lodash-es remains widely used and tree-shakeable.

---

### 29.5 nanoid

| Field | Value |
|---|---|
| **Name** | nanoid |
| **URL** | https://github.com/ai/nanoid |
| **GitHub** | https://github.com/ai/nanoid |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~0.5KB |
| **Maintenance** | Active |
| **Omix Use Case** | Unique ID generation for component instances |
| **Integration Complexity** | Very Low |
| **Security** | URL-safe, non-guessable |

**Recommendation: USE**
Reasoning: Tiny, secure ID generation. MIT. Essential for generating unique IDs for Omix component instances.

---

### 29.6 ts-pattern

| Field | Value |
|---|---|
| **Name** | ts-pattern |
| **URL** | https://github.com/gvergnaud/ts-pattern |
| **GitHub** | https://github.com/gvergnaud/ts-pattern |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~5KB |
| **Maintenance** | Active |
| **Omix Use Case** | Exhaustive pattern matching for spec types |
| **Integration Complexity** | Low |
| **Security** | Compile-time safety |

**Recommendation: CONSIDER**
Reasoning: Exhaustive pattern matching in TypeScript. MIT. Useful for processing different Omix spec node types safely. If-else chains become type-safe match expressions.

---

### 29.7 immer

| Field | Value |
|---|---|
 **Name** | Immer |
| **URL** | https://immerjs.github.io/immer/ |
| **GitHub** | https://github.com/immerjs/immer |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~8KB |
| **Maintenance** | Active |
| **Omix Use Case** | Immutable state updates for component tree |
| **Integration Complexity** | Low |
| **Security** | Proxies; standard |

**Recommendation: USE**
Reasoning: Mutable-style syntax for immutable updates. MIT, tiny. Essential for Omix editor state — safely update nested component tree without spread operators. Pairs with Zustand.

---

## 30. HTTP & Networking

### 30.1 Hono

| Field | Value |
|---|---|
| **Name** | Hono |
| **URL** | https://hono.dev |
| **GitHub** | https://github.com/honojs/hono |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~10KB |
| **Maintenance** | Very active |
| **Omix Use Case** | Lightweight API framework for Omix backend |
| **Integration Complexity** | Low |
| **Security** | Built-in CSRF, CORS, auth middleware |

**Recommendation: USE**
Reasoning: Fastest web framework. MIT, tiny, runs on Cloudflare Workers, Deno, Bun, Node. Perfect for Omix backend API. Smaller than Express/Fastify.

---

### 30.2 oRPC

| Field | Value |
|---|---|
| **Name** | oRPC |
| **URL** | https://orpc.unno.dev |
| **GitHub** | https://github.com/unno-friends/orpc |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~5KB |
| **Maintenance** | Active |
| **Omix Use Case** | End-to-end type-safe APIs for Omix backend |
| **Integration Complexity** | Low |
| **Security** | Type-safe endpoints |

**Recommendation: CONSIDER**
Reasoning: OpenAPI-compatible, end-to-end type-safe. MIT. If Omix backend needs strict API contracts with frontend, oRPC is cutting-edge.

---

### 30.3 tRPC

| Field | Value |
|---|---|
| **Name** | tRPC |
| **URL** | https://trpc.io |
| **GitHub** | https://github.com/trpc/trpc |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | N/A |
| **Language** | TypeScript |
| **Bundle Size** | ~10KB |
| **Maintenance** | Very active |
| **Omix Use Case** | End-to-end type-safe APIs |
| **Integration Complexity** | Low-Medium |
| **Security** | Type-safe endpoints |

**Recommendation: CONSIDER**
Reasoning: Popular type-safe API framework. MIT. oRPC is newer and more lightweight. Either is fine; oRPC if you need OpenAPI compatibility.

---

## 31. Package/Registry

### 31.1 Verdaccio

| Field | Value |
|---|---|
| **Name** | Verdaccio |
| **URL** | https://verdaccio.org |
| **GitHub** | https://github.com/verdaccio/verdaccio |
| **License** | MIT |
| **Open Source** | Yes |
| **Self-hostable** | Yes |
| **Docker** | Official |
| **Language** | TypeScript |
| **Bundle Size** | ~200MB |
| **Maintenance** | Active |
| **Omix Use Case** | Private npm registry for self-hosted Omix deployments |
| **Integration Complexity** | Low |
| **Security** | Access control; auth plugins |

**Recommendation: CONSIDER**
Reasoning: Private npm registry. MIT. Useful if self-hosted Omix needs to distribute packages privately. Not needed for single-machine local deployment.

---

## Summary: Top USE Recommendations by Category

| Category | Primary Choice | Alternatives |
|---|---|---|
| Visual Editor | Puck | GrapesJS, tldraw |
| Canvas Engine | Konva | SVG.js, PixiJS |
| Component Library | shadcn/ui | Mantine, Chakra UI |
| Design System / CSS | Tailwind CSS | UnoCSS |
| Design Tokens | Open Props | — |
| Icons | Lucide | Heroicons, Phosphor |
| UI Fonts | Inter | Geist |
| Monospace | JetBrains Mono | Geist Mono |
| Charts | Recharts / Tremor | Visx, Victory |
| Tables | TanStack Table | — |
| Forms | React Hook Form + Zod | TanStack Form |
| Rich Text | TipTap | Lexical |
| Animation | Framer Motion | GSAP, Auto Animate |
| AI Gateway | LiteLLM | OpenRouter |
| Local AI | Ollama | llama.cpp |
| AST / Codegen | Babel + esrap | SWC |
| Code Formatter | Prettier | — |
| Git (Node.js) | simple-git | isomorphic-git |
| Containerization | Docker + Docker Compose | Podman |
| Database (local) | SQLite / libSQL | — |
| Database (server) | PostgreSQL | Neon |
| ORM | Drizzle ORM | Prisma |
| Authentication | Better Auth | Auth.js |
| Object Storage | MinIO | Cloudflare R2 |
| Self-hosted Deploy | Coolify | Dokku |
| Testing | Vitest + Playwright | Testing Library |
| Accessibility | axe-core | — |
| Collaboration | Yjs | Liveblocks |
| Package Manager | pnpm | Bun |
| State Management | Zustand | Jotai |
| Server State | TanStack Query | — |
| Utilities | Radash | — |
| ID Generation | nanoid | — |
| Immutable Updates | Immer | — |
| Monitoring | Sentry + OpenTelemetry | — |
| Analytics | Umami | Plausible |
| HTTP Framework | Hono | oRPC |
| API Type Safety | oRPC / tRPC | — |
| Schema Validation | Zod | Valibot |

---

## Quick-Start Stack for Omix Builder

The recommended core stack for the first iteration:

1. **Editor**: Puck (headless visual editor, MIT)
2. **Canvas**: Konva (2D rendering, MIT)
3. **Components**: shadcn/ui (copy-paste, MIT)
4. **Styling**: Tailwind CSS + Open Props (MIT)
5. **State**: Zustand + Immer (MIT)
6. **AI**: LiteLLM (self-hosted proxy) + Ollama (local inference)
7. **Codegen**: Babel + esrap + Prettier (MIT)
8. **Validation**: Zod (MIT)
9. **Database**: SQLite/libSQL (MIT) + Drizzle ORM (Apache-2.0)
10. **Auth**: Better Auth (MIT)
11. **Deployment**: Coolify (Apache-2.0) or Docker (Apache-2.0)
12. **Testing**: Vitest + Playwright + axe-core (MIT/Apache-2.0/MPL-2.0)

---

*End of tools matrix. Total entries: 112.*
