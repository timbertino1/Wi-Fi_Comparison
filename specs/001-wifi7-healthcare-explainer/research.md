# Phase 0 Research: Wi-Fi 7 Healthcare Explainer

**Date**: 2026-10-26 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Each decision resolves an unknown from the plan's Technical Context.

## R1. Opening by double-click (`file://`) with three.js

**Decision**: Author source as ES modules, and bundle with **esbuild** into a single **IIFE**
(classic, non-module) script `dist/app.js` loaded by `<script defer src="app.js">` from
`dist/index.html`. All content (JSON) is imported at build time and bundled; no runtime `fetch`.

**Rationale**:
- Chromium-based browsers block `<script type="module" src>` and `fetch()` from `file://` origins
  (opaque `null` origin → CORS failure). Classic scripts and `<img>`/CSS `url()` loads work.
- three.js removed its UMD/global build (r160+), so "drop in three.min.js" is no longer possible
  with current versions; a bundler is the simplest way to use a current, pinned three.js.
- esbuild is a single dev dependency, has no plugins to configure, and builds in well under a
  second. Output is plain static files, so the same `dist/` folder works on any static host (FR-032).

**Alternatives considered**:
- *Import maps + CDN*: violates offline requirement (FR-030) and still fails on `file://` for modules.
- *Vite + single-file plugin*: works (inline module scripts need no fetch) but adds a larger tool
  chain and dev-server conventions we don't need.
- *Old three.js r159 UMD build, no build step*: avoids tooling but pins to an outdated, unsupported
  release and blocks use of current addons. Rejected.
- *Require a local server*: rejected by the user (spec clarification for FR-031).

## R2. Content data storage (FR-024, FR-025, SC-009)

**Decision**: Content lives in `content/` as JSON files (one per tab, plus `generations.json`,
`references.json`, `glossary.json`, `scenarios.json`). esbuild bundles them. A Node validation
script checks the schema and cross-references at build time and in CI.

**Rationale**: JSON keeps facts editable without touching scene code (SC-009) and is trivially
validated. Build-time bundling sidesteps `file://` fetch restrictions.

**Alternatives considered**: Markdown with front matter (needs a parser dependency); HTML partials
(mixes content and layout, harder to validate references).

## R3. Routing and deep links (FR-003)

**Decision**: Hash-based routing: `#/<tab-id>` and `#/<tab-id>/<beat>` (e.g., `#/mlo/3`),
plus optional `?present` flag inside the hash (`#/mlo/3?present`).

**Rationale**: Hash URLs work identically on `file://` and on a static host with no server
rewrite rules. History API path routing would break on `file://` and require host config.

## R4. Rendering architecture and performance (Principle V, VI; SC-005)

**Decision**:
- One shared `WebGLRenderer` and canvas; each tab is a **scene module** (see
  [contracts/scene-module.md](./contracts/scene-module.md)) created lazily on first visit and
  disposed on leave (geometry, materials, textures, listeners).
- Render loop runs only for the active scene; stops on `visibilitychange` (hidden) and when a beat's
  transition has settled and the scene has no idle animation.
- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`; low-poly geometry, instanced meshes for
  many-device scenes (client density), no real-time shadows, no post-processing by default.
- Labels via HTML overlays (three.js `CSS2DRenderer` addon) so text is crisp, translatable, and
  reachable by assistive tech; 3D text geometry is not used.
- Tweens via a small in-house tween/easing helper (~100 lines) instead of an animation library.

**Rationale**: A single context avoids browser WebGL context limits; lazy init keeps first-load
under budget; instancing keeps the density scene (hundreds of clients) at 60 fps on integrated GPUs.

**Alternatives considered**: One renderer per tab (context-limit risk, memory); GSAP for tweens
(capable, but an extra dependency we can replace with ~100 lines — Principle VII).

## R5. WebGL-unavailable fallback (FR-028, SC-006)

**Decision**: A build-time snapshot step (Playwright) renders each tab's beat in its final state for
the default comparison generations and saves WebP images to `dist/fallback/<tab>/<beat>-<gen>.webp`.
When WebGL is unavailable or the context is lost, the stage shows these images with the beat's text
description as `alt`.

**Rationale**: Guarantees the fallback always matches the real animation (no second hand-drawn set to
keep in sync). Snapshots regenerate with `npm run build`.

**Alternatives considered**: Hand-drawn SVG per beat (≈80 illustrations to maintain; drift risk);
three.js `SVGRenderer` at runtime (still needs scene JS, partial material support).

## R6. Reduced motion (FR-027)

**Decision**: When `prefers-reduced-motion: reduce` is set, scenes jump directly to each beat's end
state (no tweening, no idle motion), auto-play is disabled, and a "Motion: on/off" toggle lets the
viewer override in either direction (stored in `localStorage`, guarded by try/catch).

## R7. Presentation mode (FR-033)

**Decision**: Toggled by a button or `P` key. Uses the Fullscreen API on the document element (works
on `file://`), applies a `data-present` attribute that scales the type ramp (~1.5×) and hides
secondary chrome. Clicker keys: `PageDown`/`ArrowRight`/`Space` = next beat (crosses into the next
tab after the last beat); `PageUp`/`ArrowLeft` = previous; `Escape` exits fullscreen; `B`/`.` blanks
the stage (common clicker "black screen" key). Position is carried in the hash, so toggling never
changes the current beat. Keyboard contract: [contracts/ui-navigation.md](./contracts/ui-navigation.md).

## R8. Testing strategy

**Decision**:
- **Content validation** — Node built-in test runner (`node --test`), no extra dependency: schema,
  every `referenceId` resolves, every glossary term used is defined, every theoretical figure has
  `qualifier: "theoretical"`, five beats per feature tab, vendor-name denylist scan over content and
  built HTML/JS strings.
- **End-to-end** — `@playwright/test` against `file://…/dist/index.html` in Chromium, Firefox, and
  WebKit: navigation, deep links, controls, presentation mode keys, reduced-motion emulation,
  WebGL-disabled fallback (Chromium `--disable-webgl`), offline (all requests outside `file://`
  fail the test), and per-tab frame-time sampling.
- **Accessibility** — `@axe-core/playwright` on every tab, WCAG 2.2 AA tags, zero violations.

**Alternatives considered**: Vitest/Jest for unit tests (unneeded given `node --test`); Cypress
(weaker WebKit support, `file://` limitations).

## R9. Styling, fonts, theming

**Decision**: Hand-written CSS with custom properties (design tokens), light and dark themes via
`prefers-color-scheme` plus a manual toggle; system font stack (no font files, offline-safe);
generation colors defined once as tokens and mirrored into a JS constant for scenes.

**Generation palette** (neutral, colorblind-checked with distinct lightness steps; final values
verified for AA contrast against both themes during implementation):

| Generation | Role |
|------------|------|
| Wi-Fi 4 (802.11n) | muted gray |
| Wi-Fi 5 (802.11ac) | slate blue |
| Wi-Fi 6 / 6E (802.11ax) | amber |
| Wi-Fi 7 (802.11be) | teal |
| Wi-Fi 8 (802.11bn) | violet (dashed outlines = "in development") |

No vendor color schemes (constitution, Content & Technology Constraints).

## R10. Pinned dependency versions (Principle VII)

| Package | Version | Kind | Justification |
|---------|---------|------|---------------|
| `three` | 0.186.1 | runtime (bundled) | Mandated 3D engine |
| `esbuild` | 0.28.2 | dev | `file://` support via IIFE bundle (R1) |
| `@playwright/test` | 1.64.1 | dev | E2E, fallback snapshots (R5, R8) |
| `@axe-core/playwright` | 4.14.0 | dev | WCAG audit (SC-007) |

Exact versions in `package.json` (no `^`/`~`) plus committed `package-lock.json`. Viewers need none
of these — only a browser and the built `dist/` folder.

## R11. Technical facts register (accuracy gate input)

Initial figures the content must use. Each MUST be re-verified against the listed source during the
accuracy review gate before its tab is done; items marked ⚠ are known to need careful wording.

| Topic | Figure / statement | Primary source |
|-------|-------------------|----------------|
| Peak PHY (theoretical) | Wi-Fi 4 ≈ 600 Mbps; Wi-Fi 5 ≈ 6.9 Gbps; Wi-Fi 6/6E ≈ 9.6 Gbps; Wi-Fi 7 ≈ 46 Gbps | IEEE 802.11n/ac/ax/be; Wi-Fi Alliance |
| 46 Gbps basis ⚠ | 16 spatial streams × 320 MHz × 4096-QAM; standard allows it, current certified devices do not | IEEE 802.11be |
| Max channel width | 40 (n) / 160 (ac, ax) / 320 MHz (be, 6 GHz only) | IEEE amendments |
| Modulation | 64-QAM (6 b/sym) → 256 (8) → 1024 (10) → 4096-QAM (12): +20% peak vs 1024 | IEEE 802.11be |
| 6 GHz (US) | 5.925–7.125 GHz, 1200 MHz; 59×20, 29×40, 14×80, 7×160, 3 non-overlapping ×320 MHz | FCC 20-51 (2020) |
| 6 GHz (other regions) ⚠ | e.g., EU lower 6 GHz 5.945–6.425 GHz (500 MHz) | ECC/ETSI decisions |
| 6 GHz security | Open/WPA2 not permitted; WPA3-SAE or OWE required | Wi-Fi Alliance 6E guidance |
| Wi-Fi 7 security ⚠ | Wi-Fi CERTIFIED 7 requires WPA3; additional requirements (e.g., GCMP-256, SAE-EXT-KEY, beacon protection) — confirm exact list | Wi-Fi Alliance Wi-Fi CERTIFIED 7 / WPA3 specs |
| Preamble puncturing ⚠ | Defined in 802.11ax (limited, optional, MU only); broadened in 802.11be | IEEE 802.11ax/be |
| Multi-RU | 802.11be allows multiple RUs per STA; 802.11ax assigns one RU per STA | IEEE 802.11be |
| MLO modes | STR, NSTR, EMLSR, EMLMR definitions | IEEE 802.11be |
| TWT origin | Introduced in 802.11ah; individual/broadcast TWT in 802.11ax | IEEE 802.11ah/ax |
| Restricted TWT | Protected service periods for latency-sensitive traffic | IEEE 802.11be |
| PoE (PSE output) | 802.3af 15.4 W; 802.3at 30 W; 802.3bt Type 3 60 W, Type 4 90 W | IEEE 802.3 |
| Wired uplinks | 2.5/5/10GBASE-T (multi-gigabit) | IEEE 802.3bz, 802.3an |
| Timeline ⚠ | Wi-Fi CERTIFIED 7 program launched Jan 2024; confirm IEEE 802.11be publication date | Wi-Fi Alliance; IEEE SA |
| Wi-Fi 8 ⚠ | IEEE 802.11bn "Ultra High Reliability" task group; forward-looking only | IEEE 802.11 TGbn |

No open NEEDS CLARIFICATION items remain.
