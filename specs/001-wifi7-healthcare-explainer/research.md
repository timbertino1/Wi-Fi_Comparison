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

## R10. Pinned dependency versions (Principle VII, VIII)

| Package | Version | Kind | Justification |
|---------|---------|------|---------------|
| `three` | 0.186.1 | runtime (bundled) | Mandated 3D engine |
| `esbuild` | 0.28.2 | dev | `file://` support via IIFE bundle (R1) |
| `@playwright/test` | 1.64.1 | dev | E2E, fallback snapshots (R5, R8) |
| `@axe-core/playwright` | 4.14.0 | dev | WCAG audit (SC-007) |

Exact versions in `package.json` (no `^`/`~`) plus committed `package-lock.json`. Viewers need none
of these — only a browser and the built `dist/` folder.

## R11. Technical facts register (accuracy gate input; seeds `content/claims.json`, see R16)

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

## R12. Content-Security-Policy that works from `file://` and a host (FR-039, Principle VIII)

**Decision**: Ship the policy as a `<meta http-equiv="Content-Security-Policy">` in
`dist/index.html` (a meta policy is the only option for `file://`), plus
`<meta name="referrer" content="no-referrer">`:

```text
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:;
connect-src 'none'; font-src 'none'; object-src 'none'; media-src 'none'; frame-src 'none';
worker-src 'none'; manifest-src 'none'; base-uri 'none'; form-action 'none'
```

- No inline `<script>` or `style="…"` attributes in HTML; all JS is in `app.js`. Styles set from
  JavaScript through the CSSOM (`element.style.x = …`, as three.js's CSS2DRenderer does) are
  permitted by CSP and need no `'unsafe-inline'`.
- esbuild IIFE output and three.js use no `eval`/`new Function`, so `'unsafe-eval'` is not needed.
- `frame-ancestors` cannot be set by a meta tag; it goes in the documented hosting headers
  (FR-042, `docs/hosting-security.md`), together with the same CSP as an HTTP header.
- **Verification risk**: browsers handle `'self'` for `file://` documents differently (file URLs
  have an opaque origin in some browsers). The E2E suite records `securitypolicyviolation` events
  on every tab in Chromium, Firefox and WebKit from both `file://` and HTTP. If any browser
  blocks `app.js`, CSS or fallback images under `'self'` on `file://`, add the `file:` scheme
  source to exactly the affected directives (`script-src 'self' file:` etc.) — this does not
  widen the hosted policy because `file:` URLs never resolve on an HTTP origin — and record the
  finding here.

**Verification outcome (2026-10-26)**: `tests/e2e/security.spec.js` loaded every beat of every tab
in Chromium, Firefox and WebKit, from `file://` and from HTTP with the hosting headers: zero CSP
violations, zero external requests, zero console errors. `'self'` works for `file://` resources in
all three browsers, so the `file:` scheme fallback was **not** needed. One WebKit quirk was found: creating a `<select>`
element triggers a `style-src-attr` violation (its built-in rendering uses inline styles), so the site
uses button groups instead of `<select>`.

**Alternatives considered**: no CSP (fails the security review); hash-based inline script (not
needed — no inline script exists); a separate hosted build with a different policy (two
artifacts to test; rejected unless the verification step above forces it).

## R13. Audience layering (FR-035–FR-038, Principle II)

**Decision**: One story with a **Leadership | Technical** view switch (default Leadership),
rather than two files or curated single-depth copy.

| Layer | Leadership view | Technical view |
|-------|-----------------|----------------|
| Beat `body` (plain-language core) | Shown | Shown |
| Beat `bottomLine` (≤ 40 words: impact, risk, cost, planning) | Shown as a "Bottom line" callout | Shown, de-emphasized |
| Beat `deepDive` ("Under the hood") | Collapsed, available | Expanded |
| `DeepSection`s (e.g., MLO modes) | Collapsed, available | Expanded |
| Key figures | `headline: true` figures only (2–3) + "Show all figures" | All figures |
| Animation, beats, controls, comparison | Identical | Identical |

The view lives in the URL hash (`?view=leadership|technical`) and in `localStorage`
(preferences). It is a CSS-driven switch (`data-view` attribute on `<html>`), so switching never
re-mounts the scene or changes the beat. Keyboard shortcut `V` toggles it, including in presentation
mode.

**Rationale**: Separate files would double the accuracy-gate work and drift apart. Curated
single-depth copy fails both groups: leaders get protocol detail, engineers get too little. A
toggle keeps one source of facts, supports mixed-room presentations, and lets a presenter share
a link in the right view.

**Alternatives considered**: two HTML files (rejected as above); three or more personas such as
clinical, biomed and IT (more copy to maintain; the biomed and clinical needs are covered by the
healthcare scenario cards); automatic detection (not possible without tracking).

## R14. CI and merge protection (FR-043–FR-045, Principle VIII)

**Decision** (the repository `timbertino1/Wi-Fi_Comparison` is public, so all of these are free):

- **`.github/workflows/ci.yml`** on `pull_request` and `push` to `main`, `permissions: contents:
  read`, every action pinned to a full commit SHA with a version comment, `npm ci` from the
  lockfile. Jobs (these job names become the required status checks):
  - `validate` — `npm run validate` and `node --test tests/content/`
  - `build` — `npm run build:fast` (includes the 500 KB gzip limit); uploads `dist/` as an artifact
  - `e2e` — matrix over chromium, firefox and webkit: `npx playwright install --with-deps <browser>`
    then `npx playwright test --project=<browser>` (includes axe and CSP-violation checks)
  - `audit` — `npm audit --audit-level=high` (runtime and dev dependencies)
  - `dependency-review` — `actions/dependency-review-action` with `fail-on-severity: high` (pull
    requests only)
- **`.github/workflows/codeql.yml`** — CodeQL `javascript-typescript` on pull requests, pushes to
  `main`, and weekly; required check `CodeQL`.
- **`.github/dependabot.yml`** — weekly updates for `npm` and `github-actions`; grouped minor and
  patch updates.
- **`.github/CODEOWNERS`** — `* @timbertino1`.
- **`SECURITY.md`** — how to report a vulnerability (GitHub private vulnerability reporting).
- **Repository settings** via `gh api`: enable secret scanning, push protection, Dependabot alerts
  and security updates, and private vulnerability reporting.
- **Branch ruleset on `main`** via `gh api repos/{owner}/{repo}/rulesets`: require a pull request
  (0 required approvals — a sole maintainer can't approve their own pull request; raise to 1 when a
  second maintainer joins), require conversation resolution, require the status checks above to
  pass with the branch up to date, block force pushes and deletion, require linear history. The
  ruleset is created after CI has run once so the check names exist.

**Alternatives considered**: classic branch protection (rulesets are the current mechanism and
easier to script); a third-party secret scanner such as gitleaks (GitHub secret scanning with push
protection covers this at no cost); pre-commit hooks only (local hooks are easy to skip and are
not enforced at merge).

## R15. Source policy and allowlist (FR-047, Principle I)

**Decision**: A single machine-readable allowlist, `content/source-policy.json`, that the validator
enforces and the References tab displays. Each Reference names a publisher from this list; its
`tier` must match, and its `url` host must be one of that publisher's domains.

| Tier | Publisher | Domains | Use |
|------|-----------|---------|-----|
| 1 | IEEE (Standards Association, 802 working groups) | `standards.ieee.org`, `ieeexplore.ieee.org`, `ieee802.org`, `mentor.ieee.org`, `grouper.ieee.org` | 802.11 / 802.3 technical facts, Wi-Fi 8 project status |
| 1 | Wi-Fi Alliance | `wi-fi.org` | Certification programs, security requirements, generation naming and dates |
| 1 | IETF / RFC Editor | `ietf.org`, `rfc-editor.org`, `datatracker.ietf.org` | Protocol background (e.g., SAE-related RFCs) |
| 1 | FCC | `fcc.gov`, `docs.fcc.gov` | US 6 GHz allocation and rules |
| 1 | ECC/CEPT, ETSI | `docdb.cept.org`, `efis.cept.org`, `etsi.org` | European 6 GHz decisions and harmonized standards |
| 1 | ISED (Canada), Ofcom (UK) | `ised-isde.canada.ca`, `ofcom.org.uk` | Other-region 6 GHz notes |
| 1 | NIST | `nist.gov`, `csrc.nist.gov` | Cryptography background (e.g., GCMP, SAE context) |
| 2 | Peer-reviewed publication | `doi.org` (DOI required) | Corroboration, measured-performance context |
| 2 | FDA, AAMI, WHO | `fda.gov`, `aami.org`, `who.int` | Healthcare context (wireless medical devices, coexistence guidance) |

**Excluded** (validator rejects these domains and publishers, and reviewers reject them on sight):
equipment or chipset vendors and their blogs, whitepapers and datasheets; Wikipedia; personal or
company blogs; forums and Q&A sites; news and trade-press articles; marketing analyst reports;
AI-generated text; uncredited infographics. Wi-Fi Alliance member-company material is vendor
material even when it is hosted elsewhere.

**Rules**: technical claims need ≥ 1 Tier 1 source; healthcare-context claims need ≥ 1 Tier 1 or 2
source; a Tier 2 source alone may never support a technical figure. Adding a publisher or domain
is a reviewed change to `content/source-policy.json` (CODEOWNERS applies).

**Alternatives considered**: free-form references with manual review only (not enforceable);
allowing reputable trade press (useful context, but secondary and frequently vendor-sourced).

## R16. Claims, derivations and verification (FR-046, FR-048–FR-052)

**Decision**: A claims register, `content/claims.json`, is the single source of every checkable
statement. Text cites claims (`{{claim-id}}`); key figures point to claims per generation; scenes
read numbers through claims. Each claim records `method` (`stated` | `derived` | `illustrative`),
`sources[]` with `referenceId`, `locator` (clause/table/section/page) and an optional ≤ 50-word
`excerpt`, a `derivation` for derived values, and `verification` (`verifiedOn`, `verifiedBy`,
`notes`).

**Automatic recomputation**: `scripts/derivations.mjs` holds pure functions (`phyRate`,
`channelCount`, `percentGain`, `ratio`). A derived claim names its `formula` and its inputs as other
claim ids; the validator recomputes the value and fails if it differs beyond the claim's declared
`rounding`. Each input claim is itself a stated claim with its own Tier 1 location.

Peak PHY rate = N_SS × N_SD × N_BPSCS × R ÷ (T_DFT + T_GI), using the highest MCS, widest channel,
and shortest guard interval per generation. The worked values below must match; the input
parameters (⚠) are confirmed against the standard's clause/table during the accuracy gate:

| Generation | N_SS | Width | N_SD (data subcarriers) | Modulation (N_BPSCS) | R | Symbol + GI | Per stream | Peak |
|------------|------|-------|-------------------------|----------------------|---|-------------|------------|------|
| Wi-Fi 4 (802.11n) | 4 | 40 MHz | 108 | 64-QAM (6) | 5/6 | 3.2 + 0.4 µs | 150.0 Mbps | **600 Mbps** |
| Wi-Fi 5 (802.11ac) | 8 | 160 MHz | 468 | 256-QAM (8) | 5/6 | 3.2 + 0.4 µs | 866.7 Mbps | **6.93 Gbps** |
| Wi-Fi 6/6E (802.11ax) | 8 | 160 MHz | 1960 | 1024-QAM (10) | 5/6 | 12.8 + 0.8 µs | 1,201 Mbps | **9.61 Gbps** |
| Wi-Fi 7 (802.11be) | 16 | 320 MHz | 3920 | 4096-QAM (12) | 5/6 | 12.8 + 0.8 µs | 2,882 Mbps | **46.1 Gbps** |

Other derived claims: 4096- vs 1024-QAM gain = 12/10 − 1 = 20%; US 6 GHz channel counts from the
band edges (5.925–7.125 GHz) and channel width; "320 MHz is double 160 MHz".

**Illustrative claims**: visuals that show a shape rather than a measurement (e.g., the latency
histogram) are `illustrative` claims: no number is shown, the on-screen label reads
"Illustrative", and the claim still cites the Tier 1 source for the mechanism being illustrated.

**Uncited-number check**: the validator scans every beat `heading`, `body`, `bottomLine`,
`deepDive`, section `body`, `sceneDescription`, scenario text and in-scene label for numbers with
units or percentages (e.g., `46 Gbps`, `320 MHz`, `20%`, `60 W`) and fails unless the same
sentence carries a claim citation, or the field is backed by a claim (key figures, labels). Years
in generation names and ordinal words are exempt through a small, explicit pattern list.

**Verification and staleness**: release validation fails on any claim without `verifiedOn` and
`verifiedBy`, any claim verified more than 12 months before the build date, and any claim that
relies on a Reference with `status: "superseded"` without a `notes` explanation.

**Viewer-facing provenance**: activating a figure or citation opens a provenance panel (claim,
method badge, sources with tier, location and excerpt, derivation steps rendered from the formula
and inputs, verified date). Citations no longer jump straight to the References tab; the panel
links there.

**Auditor report**: `npm run provenance` writes `docs/provenance-report.md` (every claim grouped
by tab: statement, value, method, sources with locations, derivation, verification). The CI
`validate` job runs `npm run provenance -- --check` and fails if the committed report differs.

**Link health**: `.github/workflows/link-check.yml` runs weekly (and on demand). A dependency-free
Node script requests every Reference `url` (HEAD, then GET on 405), treats 2xx/3xx as healthy, and
opens or updates a single GitHub issue listing failures. It never blocks merges, because standards
sites sometimes rate-limit automated requests.

**Seed**: the R11 facts register becomes the initial `content/claims.json`, all with
`verifiedOn: null` until the accuracy gate.

**Alternatives considered**: citations directly to references without claims (no place for the
location, derivation or verification); spreadsheet-based facts register (not validated with the
build; drifts from the site).

No open NEEDS CLARIFICATION items remain.
