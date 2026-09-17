# ADR-002 — Canvas Architecture

## Status: ACCEPTED

## Context

The canvas is the core of Omix Builder. It must support drag-and-drop, resizing, multi-selection, zoom, and 500+ components at 60fps. The choice between building a custom canvas or using an existing framework is critical — custom canvas engines take years to mature.

## Options

| Approach | Effort | Quality | Maintenance | Risk |
|----------|--------|---------|-------------|------|
| Build custom | 2+ years | Variable | High | High |
| Fork GrapesJS | 6 months | Medium | Medium | Medium |
| Use Craft.js | 3 months | Good | Low (unmaintained) | High |
| Use Puck | 1 month | Very Good | Low (active) | Low |
| Use tldraw SDK | 1 month | Excellent | Low (paid license) | High (license) |

## Evaluation

**Puck (MIT, active):**
- React component, not a framework
- Headless — bring your own UI
- DropZone API for nesting
- Data migration utilities
- 13k+ GitHub stars, active development
- Works with any component library
- No vendor lock-in

**Why not tldraw:**
- Source-available, NOT open source
- Production use requires commercial license (~$6,000/year)
- Hobby license forces "made with tldraw" watermark
- Future license terms could change

**Why not Craft.js:**
- Last meaningful update: 2023
- Complex API, high learning curve
- 8k stars but declining activity

**Why not build custom:**
- Canvas engines are deceptively complex (selection, snapping, undo, accessibility)
- 2+ year development ramp
- High maintenance burden
- Puck already solves this well

## Decision

**Puck** as canvas engine. MIT licensed, actively maintained, React-native, minimal API surface.

## Consequences

- Positive: Fastest path to production-quality canvas
- Positive: No licensing costs or restrictions
- Positive: Community ecosystem (awesome-puck)
- Negative: Less control than custom (mitigated by Puck's plugin API)
- Negative: API changes possible (mitigated by pinning major version)
