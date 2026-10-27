# Quickstart & Validation Guide

How to build, open, and verify the Wi-Fi 7 Healthcare Explainer end to end. Design references:
[plan.md](./plan.md), [data-model.md](./data-model.md), [contracts/](./contracts/).

## Viewers (no tools needed)

1. Get the `dist/` folder (or its zip) and unzip it anywhere.
2. Double-click `dist/index.html`. It opens in the default browser; no internet connection needed.
3. To host it: upload the contents of `dist/` to any static web host (intranet share, static site
   bucket, web server). It works with no configuration; for hardening, apply the response headers
   in `docs/hosting-security.md`.

## Authors / developers

Prerequisites: Node.js ≥ 20, npm.

```sh
npm ci                     # install pinned dev tooling
npx playwright install     # one-time: browsers for snapshots and E2E tests
npm run validate           # content schema, references, beats, qualifiers, denylist, sources, claims, derivations
npm run provenance         # regenerate docs/provenance-report.md (CI checks it is current)
npm run build              # bundle → dist/ (app.js, index.html, styles) + fallback snapshots
npm run build:fast         # bundle only, skip snapshots (for quick iteration)
npm run watch              # rebuild on change; refresh the open file:// page
npm test                   # validate + node --test content tests
npm run test:e2e           # Playwright on file:// in Chromium, Firefox, WebKit (+ axe)
```

Editing facts: change `content/**/*.json` only, then `npm run validate && npm run build:fast`.

## Validation scenarios

Each scenario maps to spec success criteria. Automated ones are covered by `npm run test:e2e`
unless marked *manual*.

| # | Scenario | Steps | Expected | Covers |
|---|----------|-------|----------|--------|
| V1 | Double-click open | Build, then open `dist/index.html` from the file manager | Overview renders with animation within 3 s; console has no errors | FR-031, SC-005 |
| V2 | Offline | Disconnect network (E2E: block all non-`file:` requests) and open | Everything works; zero external requests | FR-030, SC-008 |
| V3 | Static host | Serve `dist/` with any static server (e.g., `python -m http.server -d dist`) and browse | Identical behavior to V1 | FR-032, SC-008 |
| V4 | Tab coverage | Visit all 11 tabs via Next | Each feature tab has 5 beats, comparison switcher, key figures, scenario | SC-001 |
| V5 | Deep link | Open `index.html#/mlo/3?gen=wifi5` | MLO tab, beat 3, Wi-Fi 5 comparison | FR-003 |
| V6 | Reach any tab | From any tab, reach any other | ≤ 2 actions | SC-004 |
| V7 | Story controls | Play, pause, step ±, replay, jump `1`–`5` | Text, scene, and description stay in sync | FR-007 |
| V8 | Presentation | Press `P`; use PageDown/PageUp, `B`; then `Escape` | Fullscreen, larger text, beats then tabs advance, stage blanks; same position after exit | FR-033 |
| V9 | Reduced motion | Emulate `prefers-reduced-motion: reduce` | No auto-play, no tweening; all content present | FR-027, SC-006 |
| V10 | No WebGL | Chromium with `--disable-webgl` | Snapshot images + text on every tab, notice shown | FR-028, SC-006 |
| V11 | Accessibility | axe-core on each tab; keyboard-only walkthrough | 0 WCAG 2.2 AA violations; every control reachable | FR-026, SC-007 |
| V12 | Performance | E2E samples frame times for 5 s per tab | Median ≤ 16.7 ms on the dev laptop; *manual* check on a mid-range phone ≥ 30 fps | SC-005 |
| V13 | Responsive | Viewports 360×740, 768×1024, 1920×1080, 3840×2160 | No horizontal scroll; readable text; usable controls | FR-034 |
| V14 | Neutrality | `npm test` denylist; *manual* visual scan | 0 vendor names/logos | FR-023, SC-003 |
| V15 | Accuracy gate | *Manual*: for every claim in `content/claims.json`, open the cited source at the recorded `locator`, confirm the value/wording (and the inputs of derived claims), record `verifiedOn`/`verifiedBy`; then `npm run validate -- --release` | 100% of claims verified with Tier 1 locations; release validation passes | FR-024, FR-046–FR-049, SC-003, SC-013 |
| V16 | Single-place fix | Change one KeyFigure value in content; rebuild | Value updates in panel and scene; no scene code edited | SC-009 |
| V17 | Comprehension | *Manual*: 5+ reviewers (clinical + IT) view MLO, 6 GHz, TWT, 4K-QAM tabs; leaders in Leadership view, engineers in Technical view | ≥ 80% explain each correctly in one sentence; ≥ 80% rate depth "about right" | SC-002, SC-010 |
| V18 | Audience views | Open fresh (Leadership default); press `V`; open `#/mlo/3?view=technical`; switch views in presentation mode | Bottom line shown in Leadership; Under the hood, sections and all figures expanded in Technical; tab/beat unchanged; view survives reload | FR-035–FR-038 |
| V19 | CSP & content safety | E2E records `securitypolicyviolation` on every tab from `file://` and HTTP in all three browsers; fixture content containing `<script>` is rendered | 0 violations; markup renders as inert text; external links have `rel="noopener noreferrer"` | FR-039–FR-041, SC-011 |
| V21 | Provenance | Click five random figures and citations in each view; run `npm run provenance -- --check`; change one derivation input in content and run `npm run validate` | Panel shows source, tier, location, excerpt, derivation and verified date; report is current; validation fails naming the broken derivation | FR-048, FR-050–FR-052, SC-013 |
| V22 | Independent spot check | *Manual*: a reviewer with access to the sources reproduces 10 random figures using only the provenance panel | 10 of 10 reproduced | SC-014 |
| V20 | Merge protection | Try `git push origin main` directly; open a PR with a deliberately failing test | Push rejected by the ruleset; PR merge blocked until checks pass | FR-043–FR-045, SC-012 |

## Validation status (2026-10-26, end of implementation)

| Scenarios | Status | Evidence |
|-----------|--------|----------|
| V1–V14, V16, V18–V21 | Automated and passing | `npm test`; `npm run test:e2e` in Chromium, Firefox and WebKit (`tests/e2e/*`); performance at 60 fps on an integrated GPU (V12, local GPU run) |
| V12 phone check | Manual — pending | Run on a modern mid-range phone |
| V15 accuracy gate | Manual — pending | `checklists/accuracy-gate.md` (94 claims to verify by a person) |
| V17 comprehension | Manual — pending | `checklists/comprehension-review.md` |
| V20 direct push | Verified via rules API; live push intentionally not attempted | `checklists/security-gate.md` |
| V22 spot check | Manual — pending | `checklists/accuracy-gate.md` |

## Release checklist (constitution quality gates)

- [ ] Accuracy gate: V15, V21 and V22 complete; `docs/provenance-report.md` current
- [ ] Neutrality gate: V14 passes
- [ ] Story gate: V4 passes and copy reviewed for outcome/compliance wording
- [ ] Accessibility & performance gate: V9–V13 pass
- [ ] Security gate: V19 passes; `npm audit --audit-level=high`, CodeQL and secret scanning show
      no open high/critical findings
- [ ] Merge gate: V20 verified; all release changes merged through PRs with green checks
- [ ] `dist/` zipped and V1 repeated from the unzipped copy on a second machine
