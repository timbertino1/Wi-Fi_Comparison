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

- [ ] Ruleset created and verified (id recorded here)

## Merge protection verification (US9)

- [ ] Direct push to `main` rejected
- [ ] PR with failing check cannot merge

## Release security gate (Polish)

- [ ] `npm audit --audit-level=high` clean
- [ ] No open CodeQL, Dependabot, or secret-scanning alerts
- [ ] `tests/e2e/security.spec.js` green in Chromium, Firefox, WebKit
