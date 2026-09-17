# ADR-009 — Agent Integration

## Status: PROPOSED

## Context

The builder must hand off projects to AI coding agents (Hermes, OpenCode, Claude Code, Codex) with enough context for autonomous implementation.

## Decision

**File-based handoff protocol.** Builder generates:
1. Project directory with all source files
2. `.builder/` directory with schema, tasks, sync rules
3. `AGENTS.md` with implementation instructions
4. `tasks.json` with work items

Agents read files, implement, commit. Builder syncs changes back.

## Consequences

- No complex protocol needed
- Works with any agent that can read files
- Bidirectional sync via Git
- Explicit, debuggable, inspectable
