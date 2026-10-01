# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Universal Schema pipeline: JSON Schema → TypeScript → Zod → Drizzle + LibSQL migrations
- Puck visual editor integration with `__omix` metadata bridge
- Scoped IDs (`projectId:canonicalId`) for pages, components, flows
- Semantic design tokens (shadcn palette) via `src/client/canvas/themeVars.ts` + `tailwind.config.js`
- 51 UI components in `src/client/components/ui/`
- Template validation (`tmpl_*`, semver, category enum) + instantiated builds
- Canvas fixes: live `getState()` in `onChange`, drop race, `canvasRevision` handling
- Chart enhancements: doughnut/area types, token-derived palette

### Changed
- CI: added `concurrency.cancel-in-progress` to `.github/workflows/ci.yml`

## [0.1.0] - 2026-09-18

- Initial Phase 0–3 foundation (React 18 + Vite 5 + Hono 4 + Drizzle 0.30 + LibSQL)
