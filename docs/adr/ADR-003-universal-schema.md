# ADR-003 — Universal Schema

## Status: ACCEPTED

## Context

The schema is the single source of truth. Every visual change updates it, every code generation reads it, every agent task references it. The schema design must balance expressiveness (capture everything needed for code generation) with simplicity (easy to validate, version, and migrate).

## Options

| Approach | Pros | Cons |
|----------|------|------|
| Single monolithic JSON | Simple to serialize | Hard to version parts, large files |
| Normalized (like database) | Clean references, smaller | More complex queries |
| GraphQL schema | Typed, queryable | Overkill for local tool |
| JSON Schema (chosen) | Standard, validated, documented | Verbose |

## Evaluation

**JSON Schema (draft-2020-12):**
- Industry standard for JSON validation
- Self-documenting (descriptions, examples)
- Code generation from schema (quicktype, json-schema-to-ts)
- Migration paths explicit
- Agent-readable (descriptions explain purpose)

**Design decisions:**
1. **Normalized structure** — Components, pages, tokens stored as flat maps with $ref pointers
2. **UUIDv7 identifiers** — Sortable, unique, no coordination needed
3. **Immutable updates** — Every change produces new state object
4. **Versioned** — Semantic versioning with migration chain
5. **Bounded** — Hard limits on component count, file size

## Decision

**JSON Schema with normalized structure, UUIDv7 identifiers, and semantic versioning.**

## Consequences

- Positive: Standard tooling available
- Positive: Self-documenting for AI agents
- Positive: Migrations are explicit functions
- Negative: More verbose than binary formats (mitigated by compression on save)
- Negative: $ref resolution adds complexity (mitigated by client-side resolution)
