# ADR-004 — Database

## Status: ACCEPTED

## Context

The database must store projects, components, pages, templates, and assets for a self-hosted visual builder. It needs zero-configuration setup, small footprint, and the ability to run entirely local. Target: 8GB RAM machines, no dedicated DB administrator.

## Options

| Database | Size | Server | SQLite-compatible | Notes |
|----------|------|--------|-------------------|-------|
| SQLite (better-sqlite3) | ~3MB | No | Yes | Native bindings, fast |
| LibSQL | ~5MB | Optional | Yes | SQLite fork, server mode |
| PostgreSQL | ~50MB | Yes | No | Full RDBMS, heavy |
| RxDB | ~15MB | No | No | Sync-focused, overkill |
| PGlite | ~10MB | No | No (PG wire) | Postgres in WASM |

## Evaluation

**LibSQL advantages:**
- Drop-in SQLite replacement (same SQL dialect, same file format)
- Embedded by default (zero config, single file)
- Can switch to server mode later if multi-user needed
- Turso cloud option (optional, not required)
- No native bindings = cross-platform without recompilation
- Active development (Turso backing)

**Why not raw SQLite (better-sqlite3):**
- Native bindings = platform-specific builds
- No future server path
- Larger install footprint (native module compilation)

**Why not PostgreSQL:**
- Requires separate process/container
- Network overhead even locally
- More complex backup/restore
- Unnecessary features for single-user local app

**Why not PGlite:**
- WASM overhead
- Not truly SQLite-compatible
- PG dialect is overkill

## Decision

**LibSQL** via `@libsql/client` with Drizzle ORM. Embedded mode by default, optional server mode.

## Consequences

- Positive: Zero configuration, single file database
- Positive: SQLite ecosystem compatibility
- Positive: Optional scale path (server mode)
- Positive: No native compilation
- Negative: Smaller community than raw SQLite (growing rapidly)
- Negative: Fewer GUI tools than SQLite (compatible with most)
