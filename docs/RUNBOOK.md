# Runbook — QAI Automation Framework

Operational runbook for local development, CI execution, Podman container management, report publishing, and troubleshooting.

## Table of Contents

1. [Local Execution](#local-execution)
2. [CI Execution](#ci-execution)
3. [PR Validation Mini-Agent](#pr-validation-mini-agent)
4. [Podman / Docker](#podman--docker)
5. [Report Publishing](#report-publishing)
6. [Troubleshooting](#troubleshooting)
7. [Emergency Procedures](#emergency-procedures)

---

## Local Execution

### Prerequisites

- Node.js LTS (v20+)
- npm (bundled)
- Git

### Setup

```bash
cd /path/to/qai-automation
npm install
npm run build          # TypeScript typecheck
npm run lint           # ESLint
```

### Run Test Suites

| Command | Description |
|---------|-------------|
| `npm test` | Run all Cucumber scenarios |
| `npm run test:web` | Web tests only (`@web` tag) |
| `npm run test:api` | API tests only (`@api` tag) |
| `npm run test:smoke` | Smoke suite (`@smoke` tag) |
| `npm run test:regression` | Regression suite (`@regression` tag) |
| `npm run test:integration` | Integration suite (`@integration` tag) |
| `npm run test:headed` | Headed mode (for debugging) |
| `npm run test:ci` | CI test entry point (same suite, `CI`/`HEADLESS` from environment) |
| `npm run ci` | Clean install + typecheck + lint + tests |
| `npm run audit:ci` | Production dependency audit (high+) |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HEADLESS` | `true` | Run browser headless (`false` for headed) |
| `BASE_URL` | `http://localhost:3000` | Test application base URL |
| `CI` | `false` | CI mode (affects retries, parallelism) |
| `PORT` | `3000` | Test application port |

Example:
```bash
HEADLESS=false BASE_URL=http://localhost:3000 npm run test:api
```

### Start Test Application Manually

```bash
cd apps/test-app
npm start
# Server starts on http://localhost:3000
```

### Stop Test Application

```bash
# Find and kill the node process
pkill -f "tsx src/server.ts"
# or
lsof -ti:3000 | xargs kill -9
```

---

## CI Execution

### Self-Hosted Runner

- **Platform**: GitHub Actions self-hosted
- **OS**: Debian GNU/Linux 13 (trixie)
- **Container**: Podman (rootless)
- **Image**: locally built `qai/playwright:local` from `docker/playwright.Dockerfile`
- **Base image**: `mcr.microsoft.com/playwright:v1.65.1-noble` (matches locked Playwright 1.65.1)
- **Node**: host tooling pinned by `.nvmrc` (20 LTS); test execution uses the Node runtime bundled in the Playwright base image (currently Node 26)

### Workflow: `.github/workflows/ci.yml`

Stages:
1. Checkout source
2. Setup Node from `.nvmrc` with npm cache
3. `npm ci` (clean install from lockfile)
4. `npm run audit:ci` (production audit, fails on high/critical) and `npm run audit:all` (all dependencies, fails on critical only)
5. `npm run build` (TypeScript typecheck)
6. `npm run lint` (ESLint; 0 errors required)
7. `npm run docker:build` (Podman image build)
8. `npm run docker:test` (Cucumber + Playwright headless)
9. On headless failure: `npm run docker:test:headed` (`xvfb-run -a`, reports preserved)
10. Archive `test-reports` artifact (30-day retention)
11. Successful `main` runs trigger `.github/workflows/pages.yml`

### Trigger Conditions

- Push to `dev` → CI run (no deploy)
- PR to `dev` → CI run (no deploy)
- PR `dev` → `main` → CI run + mini-agent validation
- Push to `main` → CI run → Pages publish via `workflow_run`
- Manual `workflow_dispatch` → on-demand CI run

### Artifact

`test-reports` contains `reports/cucumber-report.html` and `reports/cucumber-results.json`. Playwright/JUnit outputs are not produced by the Cucumber runner; see [Report Publishing](#report-publishing).

---

## PR Validation Mini-Agent

### Workflow: `.github/workflows/pr-validation.yml`

Runs on PRs opened from `dev` into `main` in the same repository. Fork PRs are skipped because self-hosted runners do not execute untrusted code.

| Step | Check | Output |
|------|-------|--------|
| 3.1 | Classify changed files by type | File-type table in job summary and PR comment |
| 3.2 | List changed files | Conventional commit suggestion |
| 3.3 | `npm run build`; on failure run `eslint --fix` + Prettier on changed files, then retry (`PR_FIX_ATTEMPTS`, default 1) | Compile status per attempt |
| 3.4 | ESLint JSON on changed source files; JSON/YAML/Gherkin/Dockerfile validity checks | Errors, warnings, and 0-100 score per check |
| 3.5 | Gate on error count | `::error`/`::warning` annotations, PR comment, job pass/fail |

The agent writes annotations through GitHub workflow commands, posts the full report as a PR comment, and exports `gate`, `lint_score`, and `commit_suggestion` as step outputs. Auto-fixes are workspace-only; the agent never pushes commits.

Run locally against the previous commit:

```bash
BASE_REF=HEAD~1 npx tsx scripts/pr-validation.ts
```

Or target specific files:

```bash
CHANGED_FILES="features/web/login.feature,packages/core/src/config.ts" npx tsx scripts/pr-validation.ts
```

---

## Podman / Docker

### Build Custom Playwright Image

```bash
# From the repository root; uses docker/playwright.Dockerfile
npm run docker:build
```

The image installs workspace dependencies from `package-lock.json` and includes the Playwright browsers from the pinned base image.

### Run Tests in Podman Container

```bash
# Headless (CI entry point)
npm run docker:test

# Headed rerun with virtual display (used when headless CI fails)
npm run docker:test:headed
```

Equivalent raw command:

```bash
podman run --rm --init --ipc=host \
  --name qai-ci-headless \
  -v "$(pwd):/workspace:z" \
  -w /workspace \
  -e HEADLESS=true \
  -e CI=true \
  -e BASE_URL=http://localhost:3000 \
  qai/playwright:local \
  npm run test:ci
```

The container runs as root, which maps to the rootless host user; this keeps generated report files writable by the runner.

### Container Cleanup

```bash
# Stop all containers
podman stop $(podman ps -q)

# Remove all containers
podman rm $(podman ps -a -q)

# Prune unused images
podman image prune -f

# Prune unused volumes
podman volume prune -f
```

### Rootless Podman Configuration

Ensure `/etc/subuid` and `/etc/subgid` are configured for the runner user:

```bash
# Check subuid/subgid
cat /etc/subuid | grep <runner-user>
cat /etc/subgid | grep <runner-user>
```

---

## Report Publishing

### Cucumber HTML / JSON (primary BDD reports)

Generated at:
- `reports/cucumber-report.html`
- `reports/cucumber-results.json`

View locally:
```bash
npm run report:cucumber
# or open reports/cucumber-report.html
```

Notes:
- Failure screenshots are attached to the Cucumber report (captured in After hook).
- Text validation failures surface Playwright expect diffs (Expected/Received) in the report.
- Cucumber JSON/HTML is the baseline reporting format.

### Playwright Configuration

`playwright.config.ts` defines browser projects and reporter folders for a future Playwright test suite. The current `npm test` entry point runs `cucumber-js`, which uses Playwright only for browser/API sessions; it does not invoke `playwright test`. No Playwright HTML/JSON or JUnit files are generated today.

### Test Data Policy

- Tracked fixtures: `test-data/pdfs/valid-2mb.pdf` (2,097,152 bytes) and `test-data/pdfs/invalid-2mb-plus.pdf` (2,202,009 bytes); `test-data/fixtures/users.json`.
- Regenerate PDFs with `npm run generate:test-data` (wrapper for `scripts/generate-test-pdfs.ts`).
- PDF scenarios generate their buffers in memory from `packages/api/src/step-defs/api-steps.ts`; the tracked files exist for manual validation and future fixtures.
- Never add production data to `test-data/`; fixtures are synthetic and committed to the repository.

### Reports Policy

- `reports/` is gitignored and recreated locally by the `pretest` script and in the container image.
- CI archives only Cucumber HTML/JSON as `test-reports` (30 days); `pages.yml` publishes that artifact to `gh-pages`.
- Reports may contain screenshots and test data — do not commit them or include production information.

### GitHub Pages Publishing

Reports are archived by `ci.yml` as the `test-reports` artifact. `pages.yml` publishes them after a successful CI run on `main`.

Workflow: `.github/workflows/pages.yml`

1. Resolve the source CI run (workflow run id, manual `run_id` input, or latest successful `CI` run)
2. Download the `test-reports` artifact
3. Publish its contents to the `gh-pages` branch (orphan branch, files replaced)
4. GitHub Pages serves at `https://<org>.github.io/qai-automation/`

Manual publish with a specific report run:

```bash
gh workflow run pages.yml -f run_id=<ci-run-id>
```

### Artifact Retention

| Artifact | Retention | Location |
|----------|-----------|----------|
| `test-reports` (Cucumber HTML + JSON only) | 30 days | GitHub Actions artifact |
| GitHub Pages site | Indefinite | `gh-pages` branch |

---

## Troubleshooting

### Issue: TypeScript compilation fails

**Symptoms**: `npm run build` exits with TS errors

**Diagnosis**:
```bash
npx tsc --noEmit
```

**Resolution**:
- Fix type errors in reported files
- Ensure `@types/node` is installed
- Check `tsconfig.json` `strict` settings

### Issue: ESLint errors

**Symptoms**: `npm run lint` exits with lint errors

**Diagnosis**:
```bash
npm run lint
```

**Resolution**:
- Auto-fix: `npm run lint:fix`
- Manual: Review and fix each error in `.eslintrc.json` rules
- Prettier conflicts: Run `npm run format`

### Issue: Mini-agent gate fails on a PR

**Symptoms**: `.github/workflows/pr-validation.yml` fails with annotations and a `FAIL` gate

**Diagnosis**:
- Open the PR comment or job summary for the 3.1-3.5 report
- Check ESLint/file errors annotated on changed lines
- Verify the base branch ref is fetched (`fetch-depth: 0` in checkout)

**Resolution**:
- Fix annotated errors and push to the `dev` head branch
- If auto-fix was applied locally, review the diff before pushing
- Confirm the PR is `dev` → `main` from the same repository

### Issue: Playwright browser not found

**Symptoms**: `Executable doesn't exist` or browser launch fails

**Resolution**:
```bash
npx playwright install
# Or in Podman container, ensure image includes browsers
```

### Issue: Test application port already in use

**Symptoms**: `EADDRINUSE: address already in use :::3000`

**Resolution**:
```bash
lsof -ti:3000 | xargs kill -9
# Or change PORT env var
PORT=3001 npm test
```

### Issue: PDF upload returns 413 unexpectedly

**Symptoms**: 2MB PDF rejected with 413

**Diagnosis**:
- Verify file size is exactly ≤ 2MB (2 * 1024 * 1024 bytes)
- Check multer `limits.fileSize` configuration in test app
- Ensure `Content-Type: multipart/form-data` is set

**Resolution**:
- Adjust `fileSize` limit in `apps/test-app/src/server.ts`
- Regenerate test PDF with correct size

### Issue: Cookies not shared across scenarios

**Symptoms**: Dynamic data scenario fails on cookie-dependent requests

**Diagnosis**:
- Check `packages/core/src/test-context.ts` `TestContext` singleton
- Verify `Before` hook restores cookies from prior scenario
- Check `support/hooks.ts` `After` hook doesn't clear context prematurely

**Resolution**:
- Ensure `TestContext` is imported as a singleton (not re-instantiated)
- Verify cookie extraction from response `set-cookie` header
- Confirm `page.context().cookies()` is called after login

### Issue: Screenshots not captured on failure

**Symptoms**: No PNG attachment on a failed scenario in `reports/cucumber-report.html`

**Diagnosis**:
- Check `support/hooks.ts` `After` hook status check (`Status.FAILED`)
- Verify `CustomWorld.attach` is wired from Cucumber's constructor options in `support/world.ts`
- Confirm the generated HTML report is from the failing run, not a stale file

**Resolution**:
- Fix the hook or World wiring; screenshots work in both headless and headed modes
- Re-run `npm test` and open `reports/cucumber-report.html`

### Issue: Podman rootless permission denied

**Symptoms**: `podman: permission denied` or `rootlessport` errors

**Resolution**:
```bash
# Enable linger for user
loginctl enable-linger <runner-user>

# Check subuid/subgid ranges
cat /etc/subuid | grep <runner-user>
cat /etc/subgid | grep <runner-user>

# Restart Podman socket
systemctl --user restart podman.socket
```

### Issue: GitHub Actions self-hosted runner offline

**Symptoms**: CI jobs stuck in `pending`

**Resolution**:
- Check runner machine is online
- Verify runner service: `systemctl status actions.runner.*`
- Re-register runner if token expired
- Check firewall allows GitHub Actions endpoints

---

## Emergency Procedures

### Test Data Corruption

If test-data PDFs are corrupted:

1. Restore from git: `git checkout -- test-data/`
2. Regenerate fixtures: `npm run generate:test-data`
3. Verify file sizes: `ls -lh test-data/pdfs/`

### Report Data Loss

If reports are missing from GitHub Pages:

1. Re-run CI workflow manually
2. Re-download artifact from failed run
3. Republish via `pages.yml` workflow_dispatch

### Credential Exposure

If secrets are accidentally committed:

1. Rotate exposed credentials immediately
2. `git rm --cached <file>` and add to `.gitignore`
3. Force-push cleaned history (coordinate with team)
4. Review GitHub secret scanning alerts

---

## Support

- Framework issues: Create GitHub issue in `qai-automation` repo
- Infrastructure issues: Contact DevOps / platform team
- Security vulnerabilities: Report via GitHub Security Advisories