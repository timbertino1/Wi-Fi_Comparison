# Quickstart: Presentation-First Redesign

How to build, rehearse and validate feature 002. Setup is the same as feature 001
([../001-wifi7-healthcare-explainer/quickstart.md](../001-wifi7-healthcare-explainer/quickstart.md)):
Node ≥ 20, `npm ci`, `npx playwright install`.

## Build

```bash
npm run validate      # content rules, incl. caption word limits, hotspot anchors, questions
npm run build         # bundle + fallback stills (with numbered hotspot badges) + docs/talk-track.md
npm test              # content tests, incl. talk-track coverage
npm run test:e2e      # Playwright in Chromium, Firefox, WebKit
```

Open `dist/index.html` by double-clicking. The talk track is `docs/talk-track.md`.

## Validation scenarios

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| V1 | Clicker-only talk (US1, SC-001) | Open on a 16:9 display, press F, then only Right/PageDown to the end and Left/PageUp back | Every step reached in order; chapters cross automatically; no mouse needed |
| V2 | Slide text budget (SC-002) | In Leadership depth, check each step | Visible caption ≤ 24 words; no side text column |
| V3 | Caption timing (FR-004) | Step through MLO; watch step 3 | Caption appears as voice packets reroute, not before the step starts |
| V4 | Chapter transitions (US2, SC-003) | Cross every chapter boundary | Out → crossfade → in, ≤ 2.5 s, access point visible throughout, no blank frame |
| V5 | Rapid clicking (FR-008) | Press Next 10 times quickly mid-transition | Lands on the 10th step after the start, settled; no stuck state |
| V6 | Comparison (US3) | On each feature chapter's comparison step, press G | Earlier generation changes; both labelled with both names; step unchanged |
| V7 | Hotspots (US4, SC-006) | Press H, Tab through hotspots, Enter, open Source | Card with definition ≤ 30 words; figure with qualifier; provenance panel opens; Escape returns focus |
| V8 | Close-first rule (FR-019) | Open a card, press Next | Card closes; step unchanged; next Next advances |
| V9 | Depth toggle (US6) | Press V on any step | Technical line, technical hotspots, figures overlay appear; step and animation unchanged |
| V10 | Notes drawer (FR-021) | Press N, read, press Next | Full step text shown; drawer closes on Next |
| V11 | Talk track (US5, SC-004) | `npm run build`, open `docs/talk-track.md`; change one figure in content, rebuild | Every step has On screen / Say / Technical / Figures / Questions; change appears; `npm test` coverage passes |
| V12 | Presenter view (US7) | From `file://`, press S, allow popup; advance from either window | Both windows show the same step within 0.5 s in Chromium, Firefox, WebKit |
| V13 | Reduced motion | Enable OS reduced motion; step across chapters | No camera moves; ≤ 200 ms fade or instant; captions appear immediately |
| V14 | No WebGL | `npm run test:e2e -- nowebgl` | Stills with numbered badges, captions, numbered hotspot list; all steps reachable |
| V15 | Projector legibility (SC-007) | Project at 1920×1080; read captions from 8 m | Headline and takeaway readable |
| V16 | Performance (SC-009, research P11) | Uncapped frame-time script on each scene and on transitions vs `main` | Within 1 ms median per frame of `main`; capped rate holds 60 fps on reference hardware |
| V17 | Kept guarantees (FR-028) | Full e2e suite: a11y, security/CSP, offline, provenance, resilience | All pass in three browsers |

## Editable talk-track copy

- **T1** After the first successful build, publish `docs/talk-track.md` once as an editable document
  titled "Wi-Fi 7 Explained — Talk Track (annotate here)".
- **T2** Annotate that copy only; never edit `docs/talk-track.md` by hand (CI rejects drift).
- **T3** When content changes, rebuild and publish a fresh copy with a date suffix; carry
  annotations across by hand.
