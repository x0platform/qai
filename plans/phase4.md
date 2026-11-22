# Phase 4 — Reporting & Validation Polish

## Goal
Deliver Playwright HTML + Cucumber JSON/HTML reporting with failure screenshots, text-validation diffs/snippets, and step-level assertion visibility.

## Scope
- Cucumber HTML/JSON reports (already configured) — verify and polish
- Playwright HTML report integration for browser traces/screenshots (where applicable)
- Screenshot-on-failure attachment to Cucumber report (already in hooks) — validate
- Text validation failures include actual vs expected + diff/snippet in report
- Allure results emission (optional if feasible; otherwise cucumber JSON as baseline) — document decision
- Report directory structure: `reports/playwright-html/`, `reports/cucumber-results.json`, `reports/cucumber-report.html`

## Deliverables
- [ ] Cucumber JSON report generated on every run (`reports/cucumber-results.json`)
- [ ] Cucumber HTML report generated on every run (`reports/cucumber-report.html`)
- [ ] Screenshot attached to Cucumber report on failure
- [ ] Text assertion failures show diff/snippet (Playwright expect or custom diff)
- [ ] Report paths documented in README/RUNBOOK
- [ ] `npm run test:*` scripts produce reports consistently

## Validation Checklist (must pass before phase close)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes (0 errors)
- [ ] `npx cucumber-js --tags "@api"` passes and produces report files
- [ ] `npx cucumber-js --tags "@web"` passes and produces report files
- [ ] Failure case produces screenshot attachment (manual/forced check)
- [ ] Traceability doc updated if scenarios/tags changed
- [ ] Plan doc removed after delivery commit

## Exit Criteria
All deliverables checked, validation green, committed on `dev`, this file deleted in the delivery commit.
