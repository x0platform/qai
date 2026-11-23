# Phase 7 — Pages Publishing Foundation

## Goal
Lock the GitHub Pages publishing architecture to official Pages deployment actions and prepare the repository for branch-scoped report publishing.

## Scope
- Confirm Pages remains `build_type: workflow`.
- Confirm branch scope is limited to `dev` and `main`.
- Confirm CI is green on both `dev` and `main` before report publication.
- Confirm PR #4 is merged or superseded by the implementation branch.
- Verify Node 24-compatible action majors:
  - `actions/configure-pages@v6`
  - `actions/upload-pages-artifact@v5`
  - `actions/deploy-pages@v5`
  - existing `actions/github-script@v8`, `actions/download-artifact@v8`
- Keep `ci.yml` unchanged except for confirming it already runs on `dev` and `main`.

## Deliverables
- [ ] Architecture decision documented in this phase file
- [ ] Pages settings verified with `gh api repos/x0platform/qai/pages`
- [ ] Runner/CI readiness verified
- [ ] Node 24 action versions confirmed

## Validation Checklist (must pass before phase close)
- [ ] `gh api repos/x0platform/qai/pages --jq '{build_type, source}'` shows workflow build type
- [ ] Latest `CI` runs for `dev` and `main` are successful
- [ ] No Node 20 action majors remain in planned workflow changes

## Exit Criteria
Architecture approved, CI prerequisites satisfied, ready to rewrite `pages.yml`.

Plan file deleted in delivery commit.
