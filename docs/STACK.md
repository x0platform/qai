# Technology Stack — QAI Automation Framework

This document defines the complete technology stack, version policy, and vulnerability management approach for the QAI Automation Framework.

## Core Stack

| Category | Technology | Version | Purpose | Security Policy |
|----------|-----------|---------|---------|-----------------|
| Runtime | Node.js | LTS (v20+) | JavaScript runtime | Latest LTS, monthly CVE scan |
| Language | TypeScript | 5.x | Type-safe source code | Latest minor, strict mode |
| Test Runner | Playwright | 1.x | Browser & API automation | Latest stable |
| BDD Runner | Cucumber.js | 10.x | Gherkin feature execution | Latest stable |
| Formatter | `@cucumber/pretty-formatter` | 1.x | Cucumber output formatting | Latest stable |
| PDF Parser | pdf-parse | 1.x | PDF text/content extraction | Latest stable, audit-scanned |
| Test App Server | Express | 4.x / 5.x | In-repo test API + Web | Latest stable |
| Multipart Handler | Multer | 2.x | PDF upload handling | CVE-patched (1.4.4-lts.1 → 2.x) |
| Container Runtime | Podman | Debian 13 host | Rootless container execution | Host-managed |
| Browser Image | `mcr.microsoft.com/playwright` | Latest | Playwright Docker image | Pinned digest in CI |
| Linter | ESLint | 8.x | Static code analysis | Latest stable |
| Formatter | Prettier | 3.x | Code formatting | Latest stable |
| Type Checker | TypeScript (`tsc`) | 5.x | Compile-time validation | Latest stable |

## Transitive Dependencies

The following transitive dependencies are monitored but not directly controlled:

| Dependency | Severity | Source | Mitigation |
|------------|----------|--------|------------|
| `tmp` | High | `@cucumber/cucumber` | Awaiting Cucumber non-breaking patch |
| `uuid` | Moderate | `@cucumber/messages` | Monitored, non-breaking update pending |
| `glob` / `minimatch` | Moderate | Multiple | Monitored, non-breaking update pending |

## Version Pinning Strategy

- **Node.js**: LTS only, resolved via `.nvmrc` or CI `setup-node` action
- **Direct dependencies**: `^` (caret) for minor/patch, major locked manually after review
- **Playwright browser image**: Pinned by digest in CI workflow
- **Lockfile**: `package-lock.json` committed to repository

## Vulnerability Management

### Scanning

```bash
# Audit production dependencies
npm audit --omit=dev

# Audit all dependencies
npm audit

# Fix non-breaking vulnerabilities
npm audit fix

# Force fix (breaking changes require review)
npm audit fix --force
```

### Policy

1. **Critical/High vulnerabilities in direct dependencies** — Must be resolved before merge
2. **Moderate vulnerabilities in direct dependencies** — Resolve within one sprint
3. **Transitive vulnerabilities** — Monitored; resolved via `npm audit fix` when non-breaking
4. **Breaking-change fixes** — Require PR with impact assessment and team approval
5. **Monthly scan** — Automated `npm audit` scheduled in CI

### Current Known Issues

| Vulnerability | Severity | Dependency | Status |
|--------------|----------|------------|--------|
| `tmp` path traversal / symlink write | High | `@cucumber/cucumber` (transitive) | Open — awaiting Cucumber patch |
| `uuid` buffer bounds check | Moderate | `@cucumber/cucumber` (transitive) | Open — non-breaking update pending |

## Browser Support

| Browser | Playwright Device | Headless Default | Headed on Rerun |
|---------|------------------|------------------|-----------------|
| Chromium | Desktop Chrome | Yes | Yes |
| Firefox | Desktop Firefox | Yes | Yes |
| WebKit | Desktop Safari | Yes | Yes |

## Compatibility

- **Node.js**: LTS even-numbered releases (20, 22, ...)
- **Operating Systems**: Linux (Debian 13+), macOS, Windows (CI via self-hosted Linux only)
- **Container**: Rootless Podman on Debian 13 trixie

## Maintenance

- Stack review: Quarterly
- Dependency updates: Monthly (via Dependabot or manual)
- Security scan: Weekly (CI) + on every PR
- Deprecation tracking: Active via `npm outdated` and GitHub Dependabot alerts