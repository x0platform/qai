# Phase 8 — Branch-Scoped Pages Workflow

## Goal
Replace `gh-pages` branch publishing with an official Pages deployment that publishes Cucumber reports for `dev` and `main` under branch-specific paths.

## Scope
- Rewrite `.github/workflows/pages.yml`.
- Trigger on successful `CI` runs for `dev` and `main` via `workflow_run`.
- Add `workflow_dispatch` inputs:
  - `branch`: choice `dev` / `main`
  - `run_id`: optional CI run id override
- Add global concurrency group `pages-publish` with `cancel-in-progress: false`.
- Permissions:
  - `actions: read`
  - `contents: read`
  - `pages: write`
  - `id-token: write`
- Resolve source CI run per branch through GitHub REST API.
- Download `test-reports` artifacts for both `dev` and `main`.
- Assemble one site directory:
  - `site/index.html` — branch report index
  - `site/main/index.html`
  - `site/main/cucumber-report.html`
  - `site/main/cucumber-results.json`
  - `site/dev/...`
  - `site/.nojekyll`
- Generate placeholder page when a branch has no successful artifact.
- Deploy with:
  - `actions/configure-pages@v6`
  - `actions/upload-pages-artifact@v5`
  - `actions/deploy-pages@v5`
- Remove the GitHub REST Git Data `gh-pages` writer.
- Do not use checkout, git CLI, or `gh-pages` branch writes.

## Deliverables
- [ ] `pages.yml` rewritten for official Pages deployment
- [ ] `dev` and `main` report folders generated every publish
- [ ] Root index lists both branches with CI run ids/timestamps
- [ ] Missing artifact handled with placeholder page
- [ ] Deploy job uses `environment: github-pages`
- [ ] No git-dependent Pages code remains

## Validation Checklist (must pass before phase close)
- [ ] Workflow YAML parses
- [ ] Inline `github-script` blocks pass `node --check`
- [ ] No `actions/*@v4` or Node 20 action majors remain
- [ ] Mocked branch resolution and site assembly pass
- [ ] Manual dispatch works for `branch=dev`
- [ ] Manual dispatch works for `branch=main`
- [ ] Deployment job succeeds
- [ ] `/`, `/main/`, and `/dev/` return HTTP 200

## Exit Criteria
Official Pages deployment is green and both branch report paths are publicly reachable.

Plan file deleted in delivery commit.
