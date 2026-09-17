# 16 — Development Workflow

## 16.1 Git Branching Strategy

**Trunk-based development** with short-lived feature branches.

```
main (deployable)
  └─ feature/schema-validation
  └─ feature/canvas-drag-drop
  └─ fix/memory-leak
```

Rules:
- `main` is always deployable
- Feature branches live < 3 days
- PRs require 1 review + CI pass
- Squash merge to main
- Tags for versions (`v0.1.0`, `v0.2.0`)

## 16.2 Commit Convention

```
feat: add canvas zoom controls
fix: resolve memory leak in layer panel
docs: update component schema examples
test: add performance benchmarks for canvas
chore: update dependencies
refactor: simplify schema validation pipeline
```

## 16.3 Development Setup

```bash
# Clone
git clone [repo-url] forge-omix
cd forge-omix

# Install
pnpm install

# Start dev
pnpm dev

# Run tests
pnpm test

# Build
pnpm build

# Docker
docker compose up -d
```

## 16.4 Code Style

- TypeScript strict mode
- ESLint (recommended + custom rules)
- Prettier (single quotes, trailing comma, no semicolons)
- Import sorting (@biomejs or eslint-plugin-import)

## 16.5 Architecture Decision Process

1. Identify the decision (what are we choosing?)
2. Research alternatives (minimum 3 options)
3. Evaluate against constraints (lightweight, open source, self-hosted)
4. Write ADR in `docs/adr/`
5. Get review (at least one other developer)
6. Merge and move on

**No decision by consensus paralysis.** If research is equal, pick the simplest option.

## 16.6 How to Add a New Dependency

1. Is it necessary? (Can we write it ourselves in <50 lines?)
2. Is it MIT/Apache/BSD? (No GPL/AGPL)
3. What's the bundle cost? (Check bundlephobia)
4. Is it actively maintained? (Last release < 6 months ago)
5. Does it have known vulnerabilities? (Check Snyk/npm audit)
6. Add to appropriate `package.json` (dependencies vs devDependencies)
7. Update `research/tools-matrix.md` if not already listed
8. Document in code comments why it was chosen

## 16.7 How to Add a New Component

1. Define in `src/shared/types/components.ts`
2. Add JSON Schema to `schemas/component.schema.json` (oneOf)
3. Create canvas component in `src/client/canvas/components/`
4. Create properties panel in `src/client/panels/PropertiesPanel/`
5. Create code generator template in `src/server/codegen/templates/`
6. Add tests in `tests/components/`
7. Update documentation in `docs/05-component-design-system.md`

## 16.8 How to Add a New API Route

1. Define in `src/server/routes/`
2. Add Zod validation schema
3. Add to `src/server/index.ts` route registry
4. Write tests in `tests/routes/`
5. Document in API section of `docs/02-system-architecture.md`

## 16.9 Release Process

1. Bump version in `package.json` (semver)
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v0.1.0`
4. Push tag: `git push origin v0.1.0`
5. GitHub Actions builds Docker image
6. GitHub Actions pushes to container registry
7. GitHub Actions creates GitHub Release with notes
8. Deploy to staging
9. Manual QA
10. Deploy to production

## 16.10 Monitoring and Alerting

- Uptime: Health check endpoint (`/health`)
- Errors: Pino JSON logs to stdout (Docker captures)
- Performance: Prometheus metrics endpoint (`/metrics`)
- User feedback: In-app feedback widget

## 16.11 Documentation Maintenance

- Every PR that changes architecture updates relevant docs
- ADRs are immutable once accepted (new decision = new ADR)
- Outdated docs are worse than no docs
- Run `knip` weekly to find dead code
- Run `npm outdated` weekly to find stale dependencies

## 16.12 Collaboration with AI Agents

When working with AI coding agents (Hermes, OpenCode, Claude Code):

1. Agent reads `AGENTS.md` first
2. Agent reads relevant spec docs
3. Agent implements per task spec
4. Agent runs tests before reporting done
5. Human reviews PR
6. CI validates
7. Merge

**Rule:** AI-generated code must pass the same quality bar as human code. No exceptions.
