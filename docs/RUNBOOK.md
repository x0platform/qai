# Runbook — QAI Automation Framework

Operational runbook for local development, CI execution, Podman container management, report publishing, and troubleshooting.

## Table of Contents

1. [Local Execution](#local-execution)
2. [CI Execution](#ci-execution)
3. [Podman / Docker](#podman--docker)
4. [Report Publishing](#report-publishing)
5. [Troubleshooting](#troubleshooting)
6. [Emergency Procedures](#emergency-procedures)

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
- **Image**: `mcr.microsoft.com/playwright:v1.xx-jammy`

### Workflow: `.github/workflows/ci.yml`

Stages:
1. Checkout source
2. Setup Node LTS
3. `npm ci` (clean install from lockfile)
4. `npm run build` (TypeScript typecheck)
5. `npm run lint` (ESLint)
6. Pull Playwright image via Podman
7. Run Cucumber + Playwright tests headless
8. On failure: headed retry
9. Generate Playwright HTML + Allure/cucumber JSON
10. Archive `reports/` as workflow artifact
11. Publish to GitHub Pages (separate `pages.yml`)

### Trigger Conditions

- Push to `development` → CI run (no deploy)
- PR `development` → `main` → PR validation + CI run
- Push to `main` → CI run + report publish to GitHub Pages
- Manual `workflow_dispatch` → On-demand run

---

## Podman / Docker

### Pull Playwright Image

```bash
podman pull mcr.microsoft.com/playwright:v1.xx-jammy
```

### Run Tests in Podman Container

```bash
podman run --rm \
  --name qai-playwright \
  -v $(pwd):/workspace:z \
  -w /workspace \
  -e HEADLESS=true \
  -e CI=true \
  mcr.microsoft.com/playwright:v1.xx-jammy \
  npm ci && npm run build && npm test
```

### Build Custom Playwright Image

```bash
cd docker
podman build -t qai/playwright:latest -f playwright.Dockerfile .
```

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

### Playwright HTML Report

Generated at: `reports/playwright-html/`

View locally:
```bash
npm run report:playwright
```

### Allure (optional)

Allure is not enabled by default. If added, emit Allure results under `reports/allure-results/` and publish via a separate CI step.

### GitHub Pages Publishing

Reports are archived as workflow artifacts and published to GitHub Pages automatically when a new report file is available.

Workflow: `.github/workflows/pages.yml`

1. Download `reports/` artifact from CI
2. Copy HTML report to `gh-pages` branch
3. Push to `gh-pages` → GitHub Pages serves at `https://<org>.github.io/qai-automation/`

### Artifact Retention

| Artifact | Retention | Location |
|----------|-----------|----------|
| Playwright HTML | 30 days | GitHub Actions artifact |
| Playwright JSON | 30 days | GitHub Actions artifact |
| JUnit XML | 30 days | GitHub Actions artifact |
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
- Check `support/world.ts` `TestContext` singleton
- Verify `Before` hook populates cookies from prior scenario
- Check `support/hooks.ts` `After` hook doesn't clear context prematurely

**Resolution**:
- Ensure `TestContext` is imported as a singleton (not re-instantiated)
- Verify cookie extraction from response `set-cookie` header
- Confirm `page.context().cookies()` is called after login

### Issue: Screenshots not captured on failure

**Symptoms**: No screenshots in Playwright HTML report

**Resolution**:
- Verify `screenshot: 'only-on-failure'` in `playwright.config.ts`
- Check `support/hooks.ts` `After` hook attaches screenshot
- Ensure test runs in headed or headless with video/trace enabled

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
2. Regenerate buffers: Run test app setup script (Phase 1)
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