# ADR-010 — Desktop Strategy

## Status: ACCEPTED

## Context

Users may want a desktop app experience. The choice impacts distribution, performance, and platform support.

## Decision

**PWA first.** Browser-based, installable, works everywhere. Tauri wrapper deferred to Phase 6 as optional.

## Why not Electron:
- 150MB+ bundle (unacceptable for lightweight mandate)
- 187MB+ RAM idle
- Bundled Chromium overhead

## Why not Tauri now:
- Rust build complexity not justified for V1
- WebView inconsistencies across platforms
- User's primary need is browser-based
- Can add later without architectural changes

## Consequences

- Zero install friction
- Instant updates via service worker
- Desktop-like experience via PWA install
- Tauri can wrap the same web app later
