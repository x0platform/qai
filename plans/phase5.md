# Phase 5 — CI/CD, Podman, GitHub Pages, Mini-Agent

## Goal
Production-grade CI on GitHub Actions (self-hosted Debian 13) with Podman + Playwright image, report archiving/publishing to GitHub Pages, and PR validation mini-agent.

## Scope
- `.github/workflows/ci.yml` — build, typecheck, lint, test (headless), headed rerun on failure, archive reports, trigger Pages
- `.github/workflows/pages.yml` — publish archived report to GitHub Pages on new report artifact/push to main
- `.github/workflows/pr-validation.yml` — mini-agent for PR dev→main:
  - 3.1 list file types
  - 3.2 changed files + conventional commit message suggestion
  - 3.3 compile/typecheck per file type, fix loop
  - 3.4 lint per file type (errors/warnings/score)
  - 3.5 PR gate/annotations
- `docker/playwright.Dockerfile` — Podman-ready Playwright image
- npm scripts for CI (`ci`, `test:ci`, etc.) as needed

## Deliverables
- [ ] `ci.yml` workflow (checkout, Node LTS, npm ci, audit, tsc, lint, Podman run tests, archive artifacts)
- [ ] `pages.yml` workflow (deploy reports to gh-pages)
- [ ] `pr-validation.yml` workflow (3.1-3.5 checks, PR annotations)
- [ ] `docker/playwright.Dockerfile`
- [ ] RUNBOOK updated with CI/Podman commands
- [ ] report-publishing.md updated with actual workflow names

## Validation Checklist (must pass before phase close)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes (0 errors)
- [ ] Workflow YAML lint/syntax sanity check passes
- [ ] Dockerfile builds (or syntax validated) locally where possible
- [ ] `npm test` / `npx cucumber-js` passes locally
- [ ] Docs updated (RUNBOOK, report-publishing, STACK if needed)
- [ ] Traceability doc updated if needed
- [ ] Plan doc removed after delivery commit

## Exit Criteria
All deliverables checked, validation green, committed on `dev`, this file deleted in the delivery commit.
