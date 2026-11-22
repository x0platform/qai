# QAI Automation Framework

Industry-standard test automation framework for API and Web testing using **Gherkin + Cucumber + Playwright + TypeScript**.

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | LTS (v20+) |
| Language | TypeScript | 5.x |
| Browser Automation | Playwright | 1.x |
| BDD / Gherkin Runner | Cucumber.js | 10.x |
| Formatter | `@cucumber/pretty-formatter` | 1.x |
| PDF Parsing | pdf-parse | 1.x |
| Test Application | Express | 2.x (multer) |
| Container | Podman | Debian 13 host |
| CI / CD | GitHub Actions (self-hosted) | — |
| Reporting | Playwright HTML + Allure/Cucumber JSON | — |
| Linting | ESLint | 8.x |
| Formatting | Prettier | 3.x |

## Repository Structure

```
qai-automation/
├── .github/workflows/      # CI, PR validation (mini-agent), GitHub Pages
├── docker/                 # Podman-ready Playwright image
├── apps/test-app/          # In-repo test application (API + Web server)
├── packages/core/          # Shared config, API client, test context, utils
├── packages/web/           # Web step definitions, page objects
├── packages/api/           # API step definitions, clients, payload builders
├── features/               # Gherkin .feature files (web/, api/)
├── support/                # Cucumber World, hooks (screenshots, context)
├── test-data/              # PDFs (2MB, >2MB), JSON fixtures
├── reports/                # Playwright HTML, JSON, JUnit outputs
├── docs/                   # STACK, RUNBOOK, traceability, report-publishing
├── systemPrompt.txt        # Agent/system instructions
├── playwright.config.ts    # Playwright configuration
├── tsconfig.json           # TypeScript configuration
├── .eslintrc.json          # ESLint configuration
└── .prettierrc             # Prettier configuration
```

## Tag Convention

Every scenario carries three tags:

```
@<platform> <suite> <scenario-id>
```

- **Platform**: `@web` or `@api`
- **Suite**: `@smoke`, `@regression`, `@integration`
- **Scenario ID**: `@S<scenario>TC<nnn>` (e.g., `@S07TC001`)

Example: `@api @regression @S07TC001`

## Quick Start

### Prerequisites

- Node.js LTS (v20+)
- npm (bundled with Node)
- Podman (for CI/Docker execution)

### Local Installation

```bash
# Clone the repository
git clone <repo-url>
cd qai-automation

# Install dependencies
npm install

# Verify TypeScript compiles
npm run build

# Run lint
npm run lint

# Run all tests
npm test

# Run Web tests only
npm run test:web

# Run API tests only
npm run test:api

# Run smoke suite
npm run test:smoke

# Run regression suite
npm run test:regression

# Run integration suite
npm run test:integration

# Run in headed mode (for debugging)
npm run test:headed
```

### Test Application

The test application (`apps/test-app/`) is served locally during test execution:

```bash
# Start test app standalone
cd apps/test-app
npm start

# Or let Playwright's webServer manage it (default in playwright.config.ts)
```

Endpoints:
- `POST /api/upload` — PDF upload (≤2MB → 200, >2MB → 413)
- Web routes: login, dashboard, cookie-setting

### Reports

```bash
# View Cucumber HTML report (default BDD report)
npm run report:cucumber

# View Playwright HTML report
npm run report:playwright

# Reports are located in:
#   reports/cucumber-report.html    (Cucumber HTML)
#   reports/cucumber-results.json   (Cucumber JSON)
#   reports/playwright-html/        (Playwright HTML, when used)
#   reports/junit/                  (JUnit XML)
```

Reporting behavior:
- Screenshots attached on failure only (Cucumber report)
- Text validation failures include Playwright expect diff (Expected/Received)
- Allure results: not enabled by default; Cucumber JSON/HTML is the baseline. Allure can be added in a future phase if needed.

## Documentation Coverage

| Document | Path | Coverage |
|----------|------|----------|
| Project Overview | `README.md` | 100% |
| Tech Stack | `docs/STACK.md` | 100% |
| Runbook | `docs/RUNBOOK.md` | 100% |
| Traceability Matrix | `docs/traceability.md` | 100% |
| Report Publishing | `docs/report-publishing.md` | 100% |
| Agent Instructions | `systemPrompt.txt` | 100% |

## CI/CD

GitHub Actions runs on self-hosted runners (Debian 13 trixie) using Podman + Playwright Docker image.

Workflows:
- `.github/workflows/ci.yml` — Build, test, report, publish to GitHub Pages
- `.github/workflows/pr-validation.yml` — Mini-agent PR validation (dev → main)

## Contributing

1. Create a feature branch from `development`
2. Implement changes with tests and documentation
3. Ensure `npm run build`, `npm run lint`, and `npm test` pass
4. Open a PR from your branch to `development`
5. Mini-agent validates file types, compilation, linting on PR to `main`

## License

Private — QAI Automation Framework