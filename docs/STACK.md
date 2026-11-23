# Technology Stack — QAI Automation Framework

Source of truth for installed versions, pinning policy, and vulnerability management. Versions below are the exact versions resolved in `package-lock.json`.

## Core Stack

| Category | Technology | Locked Version | Purpose | Status |
|----------|-----------|----------------|---------|--------|
| Runtime (host tooling) | Node.js | 20 (`.nvmrc`) | `npm ci`, typecheck, lint, mini-agent | Required |
| Runtime (test container) | Node.js | bundled in `mcr.microsoft.com/playwright:v1.65.1-noble` (currently 26) | Cucumber test execution | Required |
| Language | TypeScript | 5.9.3 | Type-safe source code | Active |
| Browser/API automation | Playwright | 1.65.1 | Chromium sessions via Cucumber hooks | Active |
| BDD runner | `@cucumber/cucumber` | 10.9.0 | Gherkin execution and reporting | Active |
| PDF parser | `pdf-parse` | 1.1.4 | Planned PDF content assertions | Installed, not currently imported |
| Formatter | `@cucumber/pretty-formatter` | 1.0.1 | Optional Cucumber output formatter | Installed, not configured in `cucumber.js` |
| Test app server | Express | 4.22.3 | In-repo API + web server | Active |
| Multipart handler | Multer | 2.5.0 | PDF upload handling | Active |
| TypeScript runner | `tsx` | 4.23.15 | Executes TS hooks/scripts | Active |
| Container runtime | Podman | host-managed (Debian 13) | Rootless container execution | Required for CI |
| Browser image | `mcr.microsoft.com/playwright:v1.65.1-noble` | 1.65.1 | Podman base image | Active |
| Linter | ESLint | 8.57.1 | Static analysis | Active |
| Lint plugins | `@typescript-eslint/*` | 7.18.0 | TypeScript lint rules | Active |
| Formatter | Prettier | 3.10.1 | Code formatting | Active |
| Reporting | Cucumber HTML + JSON | Cucumber 10.9.0 | BDD reports, failure screenshots | Active baseline |

## Monitored Transitive Dependencies

| Dependency | Locked Version | Severity | Source | Mitigation |
|------------|----------------|----------|--------|------------|
| `tmp` | 0.2.3 | High | `@cucumber/cucumber` | Dev-only; no non-breaking fix (audit suggests a major downgrade to Cucumber 9.6.0). Accepted and monitored. |
| `uuid` | 9.0.1 | Moderate | `@cucumber/messages` | Dev-only; fixed via `@cucumber/cucumber` 9.6.0 downgrade. Accepted and monitored. |
| `glob` | 10.5.0 | Moderate | `@cucumber/cucumber` | Dev-only; covered by the Cucumber advisory. Accepted and monitored. |
| `minimatch` | 9.0.9 | Moderate | `@cucumber/cucumber`, `@typescript-eslint/*` | Dev-only; no non-breaking fix. Accepted and monitored. |

All other reported moderate advisories (`@cucumber/gherkin`, `@cucumber/gherkin-utils`, `@typescript-eslint/parser`, `@typescript-eslint/type-utils`, `@typescript-eslint/typescript-estree`, `@typescript-eslint/utils`) are transitive chains of the packages above.

## Version Pinning Strategy

- **Host Node.js**: 20 LTS in `.nvmrc`; `setup-node` in `ci.yml` and `pr-validation.yml` uses `node-version-file: .nvmrc`. `pages.yml` runs entirely on Node 24 GitHub Actions.
- **GitHub Actions**: Node 24-compatible majors (`checkout@v5`, `setup-node@v5`, `upload-artifact@v7`, `download-artifact@v8`, `github-script@v8`); self-hosted runner requires v2.327.1+.
- **Engines**: `package.json` declares `node >=20.0.0` for host tooling.
- **Test runtime Node**: provided by the pinned Playwright container image; not controlled by `.nvmrc`.
- **Playwright image and npm Playwright version**: both 1.65.1, upgraded together.
- **Dependencies**: caret ranges in manifests with exact resolution in committed `package-lock.json`; CI uses `npm ci`.
- **Dependabot/Scheduled scans**: not configured; audits are manual and run on every CI invocation (see below).

## Vulnerability Management

### Scanning

```bash
npm run audit:ci   # production dependencies, fails on high/critical
npm run audit:all  # all dependencies, fails on critical only
npm audit          # full report, informational
```

CI runs both gated commands. The full audit currently reports 0 critical, 1 high, and 12 moderate advisories, all reachable only through devDependencies; production audit is clean.

### Policy

1. **Critical advisories (any scope)** — block merge; `audit:all` enforces this.
2. **High/moderate advisories in production dependencies** — block merge; `audit:ci` enforces this.
3. **Dev-only advisories** — reviewed and documented in this file; upgrade when a non-breaking fix exists.
4. **Breaking-change fixes** — require a PR with impact assessment and team approval.
5. **Review cadence** — manual `npm audit` before dependency upgrades and during Phase-style hardening passes; no scheduled workflow is configured.

### Current Known Issues

| Advisory | Severity | Dependency | Status |
|----------|----------|------------|--------|
| Arbitrary temp file/directory write + path traversal | High | `tmp` 0.2.3 via `@cucumber/cucumber` | Open — dev-only, accepted; upstream fix requires major downgrade |
| Missing buffer bounds check in v3/v5/v6 | Moderate | `uuid` 9.0.1 via `@cucumber/messages` | Open — dev-only, monitored |
| Glob traversal / ReDoS | Moderate | `glob` 10.5.0 + `minimatch` 9.0.9 | Open — dev-only, monitored |
| `@typescript-eslint` chain advisories | Moderate | `@typescript-eslint/*` 7.18.0 via `minimatch` | Open — dev-only, monitored |

## Browser Support

| Browser | Playwright Device | Cucumber Suite | Configured in `playwright.config.ts` |
|---------|------------------|----------------|--------------------------------------|
| Chromium | Desktop Chrome | Active (`chromium.launch` in `support/hooks.ts`) | Yes |
| Firefox | Desktop Firefox | Not used by Cucumber | Yes (future Playwright suite) |
| WebKit | Desktop Safari | Not used by Cucumber | Yes (future Playwright suite) |

Headless is the default; `HEADLESS=false` is available for debugging and the CI headed rerun via `xvfb-run`.

## Compatibility

- **Host tooling**: Node.js 20 LTS (even-numbered LTS upgrades are supported via `.nvmrc`).
- **Operating systems**: Linux (Debian 13+ for self-hosted CI), macOS; Windows is not used for CI.
- **Container**: rootless Podman on Debian 13 trixie.

## Maintenance

- Stack review: quarterly or at each phase boundary.
- Dependency updates: manual PRs; no Dependabot configuration in this repository.
- Security scan: `npm run audit:ci` + `npm run audit:all` on every CI run; `npm audit` manually as needed.
- Deprecation tracking: `npm outdated` during maintenance passes.
