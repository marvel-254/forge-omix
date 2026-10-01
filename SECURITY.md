# Security Policy

## Supported Versions

Only the latest `master` branch receives security updates. Report vulnerabilities against the latest commit.

## Reporting a Vulnerability

**Do not file public issues** for security vulnerabilities.

Report privately via:

* GitHub Security Advisory (preferred) — `Security` tab → `Report a vulnerability`
* If unable to use GitHub Security Advisory, contact maintainers directly

**Do not** open public issues for:

* Exposed secrets / API keys
* Authentication / authorization bypass
* SSRF / RCE / injection vectors
* Any attack vector that could be weaponized

### What to include

* Affected commit / branch
* Minimal reproduction steps
* Impact assessment (confidentiality / integrity / availability)
* Whether you have a proof-of-concept

### Response target

* Acknowledgment within 3 business days
* Fix timeline estimate within 7 business days
* Coordinated disclosure preferred

### Scope

* Client: secrets must never reach the browser
* Server: tenant-scoped authorization at service layer (not just frontend)
* Build: untrusted code runs in isolated containers (Docker), never in API process
* AI: agents operate through audited, authorized tools — never unrestricted