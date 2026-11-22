# Phase 6 — Hardening, Documentation Finalization & Handoff

## Goal
Finalize documentation, ensure 100% coverage, harden configs, and prepare repo for handoff/PR to main.

## Scope
- Documentation completeness audit: README, STACK, RUNBOOK, traceability, report-publishing, systemPrompt
- Ensure tag/traceability matrix matches all implemented scenarios
- Add/verify `.nvmrc` or Node LTS pinning, engines, CI node version alignment
- Add `CONTRIBUTING.md` if needed (optional, lightweight)
- Final security/vulnerability pass (`npm audit`, lockfile sanity)
- Ensure test-data and reports policies documented
- Verify mini-agent and CI docs match actual workflows

## Deliverables
- [ ] 100% doc coverage verified (all planned docs present and current)
- [ ] Traceability matrix 100% mapped to implemented scenarios
- [ ] RUNBOOK covers local, CI, Podman, troubleshooting, report publishing
- [ ] STACK reflects actual versions/deps
- [ ] systemPrompt.txt current
- [ ] Final `npm run build`, `npm run lint`, `npm test` green
- [ ] Known vulnerabilities documented with mitigation status

## Validation Checklist (must pass before phase close)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes (0 errors)
- [ ] `npx cucumber-js` all tags pass
- [ ] All docs cross-referenced and accurate
- [ ] Traceability coverage = 100%
- [ ] Plan doc removed after delivery commit

## Exit Criteria
All deliverables checked, validation green, committed on `dev`, this file deleted in the delivery commit. Repo ready for PR `dev -> main`.
