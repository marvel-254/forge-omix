# 11 — Security

## 11.1 Threat Model

| Threat | Severity | Mitigation |
|--------|----------|------------|
| Malicious SVG upload | High | DOMPurify sanitization |
| Arbitrary code in imported templates | High | No `eval`, declarative schema only |
| SSRF via URL imports | Medium | Strict URL allowlist, server-side proxy with timeout |
| Git credential exposure | Medium | Credentials never stored, env vars only |
| XSS in generated code | Medium | Sanitized prop values, no `dangerouslySetInnerHTML` |
| Malicious npm packages | Medium | Sandboxed import process, no auto-install |
| Schema injection | Low | JSON Schema validation, no executable content |
| Cross-project data access | Medium | Row-level security in DB, project isolation |

## 11.2 Sandboxing

### Imported Code
- All imports (templates, packages) run in isolated context
- No access to filesystem, network, or environment
- Static analysis only, no execution
- All imported components pass through security scanner

### Agent Sandbox
- Agents run in separate filesystem scope
- No access to builder internals
- Git repository is project-specific only
- No access to API keys or credentials

## 11.3 Content Security Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self';
connect-src 'self' https://openrouter.ai;
frame-src 'self';
```

## 11.4 Authentication Security (If Multi-User)

- bcrypt password hashing (cost factor 12)
- Rate limiting on auth endpoints (5 attempts/minute)
- CSRF tokens for all state-changing operations
- HTTP-only, SameSite=Strict cookies
- Session rotation on login
- MFA support (TOTP) recommended

## 11.5 API Key Management

- Keys never stored in database (env vars or vault)
- Keys encrypted at rest if persisted
- User-provided keys isolated per-project
- No keys sent to AI providers (client-side direct connection preferred)

## 11.6 Input Validation

- All user inputs validated against JSON Schema
- Max length limits on all string fields
- UUID format for all IDs
- Path traversal prevention (no `..` in paths)
- Rate limiting on all API endpoints

## 11.7 Docker Security

- Non-root user (`node:node`)
- Read-only root filesystem (tmpfs for /tmp)
- No privileged mode
- All capabilities dropped, minimal added
- Resource limits enforced
- No network exposure beyond required ports
