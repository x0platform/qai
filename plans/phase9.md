# Phase 9 — Documentation and Final Validation

## Goal
Align documentation and final validation with official branch-scoped Pages publishing.

## Scope
- Update `README.md` workflow table.
- Update `docs/RUNBOOK.md` report publishing and troubleshooting sections.
- Update `docs/report-publishing.md`:
  - official Pages deployment model
  - `/main/` and `/dev/` paths
  - artifact assembly model
  - branch-specific manual publish command
  - Pages settings: workflow build type, not `gh-pages` branch
- Update `docs/STACK.md` action versions.
- Update `systemPrompt.txt` only if it references Pages behavior.
- Keep legacy `gh-pages` branch as fallback/unused; do not delete without explicit approval.

## Deliverables
- [ ] Docs describe `https://x0platform.github.io/qai/`
- [ ] Docs describe `/main/` and `/dev/` report paths
- [ ] Docs no longer claim `gh-pages` branch is the live source
- [ ] Troubleshooting covers 404, missing deployment, missing artifact, and stale report
- [ ] Full repository validation passes

## Validation Checklist (must pass before phase close)
- [ ] `npm run build`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run audit:ci`
- [ ] `npm run audit:all`
- [ ] Workflow YAML parse
- [ ] Mini-agent dry run PASS
- [ ] CI green on PR
- [ ] Pages deployment green
- [ ] HTTP 200 for `/`, `/main/`, `/dev/`
- [ ] Latest deployment report links match expected CI run ids
- [ ] Phase 7, 8, and 9 plan files deleted in their delivery commits

## Exit Criteria
Repository is ready for PR merge; public Pages site serves branch-scoped reports from `dev` and `main`.

Plan file deleted in delivery commit.
