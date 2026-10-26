# Implementation Plan: Wi-Fi 7 Healthcare Explainer

**Branch**: `001-wifi7-healthcare-explainer` | **Date**: 2026-10-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-wifi7-healthcare-explainer/spec.md`

## Summary

An 11-tab, vendor-neutral, animated explainer that teaches Wi-Fi 7 against earlier generations
through healthcare stories. Each feature tab steps through five beats with a three.js scene, a
generation comparison, and a key-figures panel; it also has a presentation mode for live sessions.
The source is ES modules plus JSON content. esbuild bundles it into a static `dist/` folder that
uses a classic (non-module) script, so it opens by **double-clicking `index.html`** offline and
works unchanged on any static host. A build-time snapshot step gives a WebGL-free fallback.
Details: [research.md](./research.md).

## Technical Context

**Language/Version**: JavaScript (ES2022), HTML5, CSS (custom properties); Node.js ≥ 20 for build
and test tooling only (developed on Node 24)

**Primary Dependencies**: three 0.186.1 (runtime, bundled). Dev only: esbuild 0.28.2,
@playwright/test 1.64.1, @axe-core/playwright 4.14.0

**Storage**: Static JSON content files bundled at build time; `localStorage` only for viewer
preferences (theme, motion), guarded by try/catch

**Testing**: `node --test` (content validation, neutrality scan); Playwright E2E on `file://` in
Chromium, Firefox, WebKit; axe-core WCAG 2.2 AA audit

**Target Platform**: Current evergreen Chrome, Edge, Firefox, Safari on desktop and mobile; opened
from local disk (`file://`) or a static web host

**Project Type**: Static single-page web application (no backend)

**Performance Goals**: 60 fps on a mid-range laptop integrated GPU; ≥ 30 fps on a modern mid-range
phone; first tab readable < 3 s; initial JS bundle ≤ 500 KB gzipped (three.js core ≈ 160 KB gz)

**Constraints**: Works from `file://` with no server; zero runtime network requests; no tracking;
WCAG 2.2 AA; reduced-motion and no-WebGL alternatives; vendor-neutral content

**Scale/Scope**: 11 tabs; 8 animated feature tabs × 5 beats = 40 beat states; 5 generations;
≈ 40–60 references; ≈ 60 glossary terms

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | How the design complies | Status |
|---|-----------|------------------------|--------|
| I | Vendor neutrality & accuracy | Content in JSON with `referenceId` on every figure; build-time validator rejects missing references; denylist scan for vendor names; `qualifier` field enforces theoretical/optional labels; facts register (research R11) feeds accuracy gate | ✅ |
| II | Teach by telling a story | Data model requires exactly five beats of fixed types per feature tab; validator enforces it; jargon defined via glossary links at first use | ✅ |
| III | Healthcare context | Each tab references ≥ 1 `HealthcareScenario`; copy review checks for outcome/compliance guarantees; scenarios are composites, no PHI | ✅ |
| IV | Generational comparison | Generation switcher in every feature tab; single generation palette token set shared by CSS and scenes; `introducedIn` field states feature lineage | ✅ |
| V | Purposeful 3D animation | Scene module contract requires per-beat states, generation modes, play/pause/step/replay, lazy init + `dispose()` | ✅ |
| VI | Accessible & performant | WAI-ARIA tabs pattern; per-beat `sceneDescription`; reduced-motion path; snapshot fallback for no-WebGL; axe + frame-time E2E checks | ✅ |
| VII | Simplicity & static delivery | Static `dist/`; one runtime dependency; dev tooling justified below; content separated from scenes | ✅ with justification (see Complexity Tracking) |

**Quality gates mapping**: accuracy gate → `npm run validate` + manual review against R11;
neutrality gate → denylist test; story gate → beat-structure test; accessibility/performance gate →
`npm run test:e2e` (axe, keyboard, reduced motion, no-WebGL, offline, fps sampling).

**Post-design re-check (after Phase 1)**: The data model, contracts, and quickstart preserve all
mappings above. No new violations. ✅

## Project Structure

### Documentation (this feature)

```text
specs/001-wifi7-healthcare-explainer/
├── plan.md              # This file
├── research.md          # Phase 0 decisions + facts register
├── data-model.md        # Content entities and validation rules
├── quickstart.md        # Build, run, and validation guide
├── contracts/
│   ├── content-schema.md   # JSON content file formats
│   ├── scene-module.md     # Interface every tab's 3D scene implements
│   └── ui-navigation.md    # URL/hash scheme, keyboard & clicker map, ARIA structure
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
content/                       # All copy and facts — editable without touching scenes
├── generations.json
├── references.json
├── glossary.json
├── scenarios.json
└── tabs/
    ├── 01-overview.json
    ├── 02-6ghz-320mhz.json
    ├── 03-mlo.json
    ├── 04-qam-puncturing-multiru.json
    ├── 05-security.json
    ├── 06-twt.json
    ├── 07-density.json
    ├── 08-latency.json
    ├── 09-bandwidth-poe.json
    ├── 10-wifi8.json
    └── 11-references.json

src/
├── index.html                 # Shell: header, tablist, stage, story panel, controls
├── main.js                    # Boot: load content, feature-detect WebGL, start router
├── app/
│   ├── router.js              # Hash routing (#/tab/beat?present)
│   ├── tabs.js                # ARIA tablist, prev/next, progress
│   ├── story.js               # Beat state machine, play/pause/step/replay
│   ├── comparison.js          # Generation switcher + key-figures panel
│   ├── presentation.js        # Fullscreen, clicker keys, blanking
│   ├── preferences.js         # Theme + motion (localStorage, try/catch)
│   └── glossary.js            # Inline term definitions, references links
├── stage/
│   ├── renderer.js            # Shared WebGLRenderer + CSS2D label layer, loop control
│   ├── fallback.js            # Snapshot <img> fallback, context-loss handling
│   ├── tween.js               # Minimal tween/easing helper
│   ├── palette.js             # Generation colors (mirrors CSS tokens)
│   └── kit/                   # Reusable scene parts: AP, client device, band, channel
│                              # blocks, packet/frame, constellation grid, timeline
├── scenes/                    # One scene module per tab (contracts/scene-module.md)
│   ├── overview.js
│   ├── spectrum.js
│   ├── mlo.js
│   ├── qam-puncturing.js
│   ├── security.js
│   ├── twt.js
│   ├── density.js
│   ├── latency.js
│   ├── bandwidth-poe.js
│   └── wifi8.js
└── styles/
    ├── tokens.css             # Colors (themes, generations), type scale, spacing
    ├── layout.css
    └── present.css

scripts/
├── build.mjs                  # esbuild IIFE bundle + copy html/css → dist/
├── validate-content.mjs       # Schema + cross-reference checks (also used by tests)
└── snapshots.mjs              # Playwright: render every beat → dist/fallback/*.webp

tests/
├── content/                   # node --test: schema, references, beats, qualifiers, denylist
└── e2e/                       # Playwright on file://: nav, deep links, controls,
                               # presentation, reduced motion, no-WebGL, offline, axe, fps

dist/                          # Build output — the deliverable folder (git-ignored; zipped for sharing)
```

**Structure Decision**: Single static web project. `content/` is separate from `src/` so a fact
can be fixed in one place (SC-009). `src/scenes/` holds one module per tab behind a common contract,
built from shared `stage/kit/` parts so generations look the same across tabs (Principle IV).
`dist/` is the self-contained deliverable you can double-click, zip, or upload to a static host.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Build step (esbuild) instead of plain no-build HTML/JS (Principle VII prefers minimal tooling) | FR-031 requires double-click (`file://`) opening; browsers block ES-module scripts there, and current three.js no longer ships a non-module build | Old three.js UMD build is unsupported/outdated; requiring a local server was rejected by the user |
| Playwright used at build time for fallback snapshots | FR-028/SC-006 require full content without WebGL; snapshots guarantee the fallback matches the real scenes | Hand-drawn SVG fallback (~80 images) would drift from the animations and double the maintenance work |
