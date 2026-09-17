# ADR-005 — Docker Deployment

## Status: ACCEPTED

## Context

Omix Builder must be self-hostable with a single command. The Docker setup should minimize complexity, image size, and resource usage. Target: runs on a $5 VPS or Raspberry Pi 4.

## Options

| Approach | Image Size | Complexity | Startup |
|----------|-----------|------------|---------|
| Single container (chosen) | ~65MB | Low | Fast |
| Multi-container (app + db) | ~120MB | Medium | Slower |
| Kubernetes | N/A | High | N/A |

## Evaluation

**Single container advantages:**
- Simplest deployment: `docker compose up -d`
- No inter-container networking
- Single log stream
- Smaller attack surface
- Works on Docker, Podman, Docker Swarm

**Why not multi-container:**
- LibSQL is embedded, no separate DB container needed
- No Redis, no queue workers, no separate services
- Multi-container adds complexity without benefit for V1

**Why not Kubernetes:**
- Massive overkill for single-instance app
- Requires cluster management
- User explicitly prioritized lightweight

## Decision

**Single container** with LibSQL embedded. One `docker-compose.yml` with one service. Volume for `/data` persistence.

## Consequences

- Positive: `docker compose up -d` works
- Positive: ~65MB image
- Positive: Runs on Raspberry Pi 4
- Negative: No horizontal scaling (deferred, acceptable)
- Negative: Single point of failure (mitigated by volume backups)
