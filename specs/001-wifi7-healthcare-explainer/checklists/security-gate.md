# Security Gate Log: Wi-Fi 7 Healthcare Explainer

**Purpose**: Record evidence for constitution Principle VIII and the merge/security gates.
**Feature**: [spec.md](../spec.md) · Requirements FR-039–FR-045, SC-011, SC-012

## Repository security settings (T010)

Configured 2026-10-26 with `gh api` against `timbertino1/Wi-Fi_Comparison` (public repository).

- [x] Secret scanning: enabled (`security_and_analysis.secret_scanning.status = enabled`)
- [x] Secret scanning push protection: enabled
- [x] Dependabot vulnerability alerts: enabled (`GET /vulnerability-alerts` → 204)
- [x] Dependabot security updates: enabled (`GET /automated-security-fixes` → `{"enabled":true,"paused":false}`)
- [x] Private vulnerability reporting: enabled (`GET /private-vulnerability-reporting` → `{"enabled":true}`)

## Branch ruleset on `main` (T043)

- [x] Ruleset **"Protect main"**, id **25921770**, enforcement **active**, target `~DEFAULT_BRANCH`
      (created 2026-10-26 after CI registered its check names on PR #2)
- [x] `GET /rules/branches/main` reports: deletion, non_fast_forward, required_linear_history,
      pull_request (0 approvals, conversation resolution required), required_status_checks (strict):
      validate, build, e2e (chromium), e2e (firefox), e2e (webkit), audit, dependency-review, CodeQL

## Merge protection verification (US9, T111)

- [x] PR with incomplete required checks cannot merge — PR #2 reported `mergeStateStatus: BLOCKED`
      while checks were pending after the ruleset was created (and `BEHIND` before `main` was merged
      in, because the ruleset requires an up-to-date branch)
- [ ] Live direct-push test **not run on purpose**: if protection were misconfigured, a test push would
      land on `main`, and force-push protection would then prevent removing it. The rules endpoint
      above confirms the protection. Owner can confirm with a throwaway branch if desired.
- Note: `required_linear_history` means PRs must be merged with **Squash** or **Rebase**, not a merge
      commit.

## Release security gate (Polish)

- [x] `npm audit --audit-level=high` clean (0 vulnerabilities, 2026-10-26)
- [x] No open CodeQL, Dependabot, or secret-scanning alerts (all 0 via `gh api`, 2026-10-26)
- [x] `tests/e2e/security.spec.js` green in Chromium, Firefox, WebKit (15/15, 2026-10-26)
