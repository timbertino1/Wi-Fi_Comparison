# Quickstart & Validation Guide

How to build, open, and verify the Wi-Fi 7 Healthcare Explainer end to end. Design references:
[plan.md](./plan.md), [data-model.md](./data-model.md), [contracts/](./contracts/).

## Viewers (no tools needed)

1. Get the `dist/` folder (or its zip) and unzip it anywhere.
2. Double-click `dist/index.html`. It opens in the default browser; no internet connection needed.
3. To host it: upload the contents of `dist/` to any static web host (intranet share, static site
   bucket, web server). No configuration is needed.

## Authors / developers

Prerequisites: Node.js ≥ 20, npm.

```sh
npm ci                     # install pinned dev tooling
npx playwright install     # one-time: browsers for snapshots and E2E tests
npm run validate           # content schema, references, beats, qualifiers, denylist
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
| V15 | Accuracy gate | *Manual*: for each tab, check every figure against [research.md R11](./research.md) sources; set `verifiedOn` | 100% of figures verified and cited | FR-024, SC-003 |
| V16 | Single-place fix | Change one KeyFigure value in content; rebuild | Value updates in panel and scene; no scene code edited | SC-009 |
| V17 | Comprehension | *Manual*: 5+ reviewers (clinical + IT) view MLO, 6 GHz, TWT, 4K-QAM tabs | ≥ 80% explain each correctly in one sentence | SC-002 |

## Release checklist (constitution quality gates)

- [ ] Accuracy gate: V15 complete
- [ ] Neutrality gate: V14 passes
- [ ] Story gate: V4 passes and copy reviewed for outcome/compliance wording
- [ ] Accessibility & performance gate: V9–V13 pass
- [ ] `dist/` zipped and V1 repeated from the unzipped copy on a second machine
