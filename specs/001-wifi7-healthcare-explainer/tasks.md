---

description: "Task list for the Wi-Fi 7 Healthcare Explainer"
---

# Tasks: Wi-Fi 7 Healthcare Explainer

**Input**: Design documents from `specs/001-wifi7-healthcare-explainer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. The spec's success criteria (SC-001–SC-009), the constitution's quality gates,
and quickstart.md (V1–V17) call for automated content validation, Playwright E2E on `file://`, and
axe-core audits.

**Organization**: Tasks are grouped by user story (spec.md US1–US9) so each story can be built and
tested on its own. Phases follow priority: P1 (US1–US3), P2 (US4, US5, US8, US9, US7), P3 (US6). US7 was raised to
P2 on 2026-10-26 for data validation; provenance foundations (claims, source policy, derivations,
report) are in Phase 2 so every story is built on cited data from the start.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: Which user story the task belongs to (US1–US9)

## Conventions used by every task

- Paths are relative to the repository root (single static web project, see plan.md).
- Source is ES modules; `scripts/build.mjs` bundles to an IIFE in `dist/` (research R1). Never add
  `type="module"` scripts or runtime `fetch()` — the site must work from `file://`.
- All user-visible copy and numbers live in `content/**/*.json` (contracts/content-schema.md);
  scenes and app code never hard-code copy (contracts/scene-module.md, `ctx.t()`).
- Scenes implement contracts/scene-module.md. URLs, keys, and ARIA follow
  contracts/ui-navigation.md.
- Content rules: no vendor names, logos, or product names; every figure cites a neutral reference;
  peak rates qualified "theoretical"; no clinical-outcome or compliance guarantees; healthcare
  scenarios are fictional composites. Use they/them or role nouns (e.g., "the nurse") for people.
- Facts come from research.md R11/R16 and live in `content/claims.json`. Every number or normative
  statement in any text field cites a claim with `{{claim-id}}` (validator rule 17); key figures
  point to claims via `claimIds`; scenes get numbers only through `ctx.claim()`. When content
  needs a new fact, add a claim (statement, value, unit, `kind`, `method`, sources with
  `referenceId` and `locator`, `derivation` if derived, `verification` all null) — never write
  an uncited number. Only publishers in `content/source-policy.json` may be cited (research R15):
  no vendor material, Wikipedia, blogs, forums, news, or AI-generated text. Items marked ⚠ in R11
  need checking against the source before final wording. `content/claims.json` is a shared file:
  tasks that append to it are **not** marked [P].
- Files in `content/glossary.json` and `content/references.json` are shared: tasks that append to
  them are **not** marked [P].
- Audience layers (research R13): every feature-tab beat has `body` (plain-language core for
  everyone), `bottomLine` (Leadership layer, ≤ 40 words: impact, risk, cost, or planning; no
  jargon), and `how`/`improvement` beats have a `deepDive` (Technical layer). Every content task
  for tabs 2–9 writes all three layers.
- Security (research R12, contracts/ui-navigation.md "Security constraints"): no inline script,
  event-handler attributes, `style="…"` attributes, `eval`, `new Function`, or `innerHTML` outside
  `renderMarkup()` output; external links use `rel="noopener noreferrer"`; no runtime network or
  third-party assets.
- Merge flow: after Phase 2, all work reaches `main` through pull requests that pass the required
  checks (research R14). Commit on the feature branch; never push to `main` directly.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and tooling

- [X] T001 Create the directory layout from plan.md: `content/tabs/`, `src/app/`, `src/stage/kit/`, `src/scenes/`, `src/styles/`, `scripts/`, `tests/content/`, `tests/e2e/`
- [X] T002 Create `package.json` with `"type": "module"`, `"private": true`, `engines.node ">=20"`, dependency `three` `0.186.1` and devDependencies `esbuild` `0.28.2`, `@playwright/test` `1.64.1`, `@axe-core/playwright` `4.14.0` — exact versions, no `^`/`~` — and scripts `validate` (`node scripts/validate-content.mjs`), `build` (`node scripts/build.mjs`), `build:fast` (`node scripts/build.mjs --no-snapshots`), `watch` (`node scripts/build.mjs --watch --no-snapshots`), `test` (`npm run validate && node --test tests/content/`), `test:e2e` (`npm run build:fast && playwright test`); run `npm install` to create `package-lock.json`
- [X] T003 [P] Create `.gitignore` ignoring `node_modules/`, `dist/`, `test-results/`, `playwright-report/`
- [X] T004 [P] Create `playwright.config.js`: `testDir: 'tests/e2e'`, projects for chromium, firefox and webkit, `fullyParallel: true`, reporter `list` + `html` (open: never), no `webServer` (tests open `file://` URLs)
- [X] T005 Create `scripts/build.mjs`: esbuild bundles `src/main.js` → `dist/app.js` with `format: 'iife'`, `target: 'es2022'`, `bundle: true`, `minify: true`, `sourcemap: 'linked'`, `loader: { '.json': 'json' }`; copy `src/index.html` and `src/styles/*.css` into `dist/`; flags `--watch` (esbuild context watch, recopy html/css on change) and `--no-snapshots`; without `--no-snapshots`, run `scripts/snapshots.mjs` after bundling if it exists; print the gzip size of `dist/app.js` and exit non-zero if it exceeds 500 KB gzipped (plan.md Performance Goals)
- [X] T006 [P] Create `.github/workflows/ci.yml` per research.md R14: triggers `pull_request` and `push` to `main`; top-level `permissions: contents: read`; `concurrency` cancelling superseded runs; Node 24 via `actions/setup-node` with npm cache; `npm ci`; jobs `validate` (`npm run validate` + `node --test tests/content/` + `npm run provenance -- --check`), `build` (`npm run build:fast`, upload `dist/` artifact), `e2e` (matrix `browser: [chromium, firefox, webkit]`, `npx playwright install --with-deps ${{ matrix.browser }}`, `npx playwright test --project=${{ matrix.browser }}`, upload report on failure), `audit` (`npm audit --audit-level=high`), `dependency-review` (`actions/dependency-review-action`, `fail-on-severity: high`, only on `pull_request`). Pin every action to a full 40-character commit SHA with a `# vX.Y.Z` comment — look each SHA up with `gh api repos/<owner>/<action>/commits/<tag> --jq .sha`; never use tag-only references. Jobs that run before `package.json` scripts exist must be added as those scripts land (keep the workflow green)
- [X] T007 [P] Create `.github/workflows/codeql.yml`: CodeQL for `javascript-typescript` with `build-mode: none` on `pull_request`, `push` to `main`, and a weekly `schedule`; `permissions: security-events: write, contents: read`; actions pinned to commit SHAs as in T006
- [X] T008 [P] Create `.github/dependabot.yml` with weekly updates for `npm` (directory `/`) and `github-actions` (directory `/`), grouping minor and patch updates per ecosystem
- [X] T009 [P] Create `.github/CODEOWNERS` (`* @timbertino1`) and `SECURITY.md` (how to report a vulnerability via GitHub private vulnerability reporting; supported version = latest `main`; no PHI or real facility data in reports)
- [X] T010 Enable repository security features with `gh api`: `PATCH repos/timbertino1/Wi-Fi_Comparison` with `security_and_analysis` → `secret_scanning` and `secret_scanning_push_protection` `enabled`; `PUT repos/timbertino1/Wi-Fi_Comparison/vulnerability-alerts`; `PUT …/automated-security-fixes`; `PUT …/private-vulnerability-reporting`; confirm each with a `GET` and record the result in `specs/001-wifi7-healthcare-explainer/checklists/security-gate.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Content model, validator, rendering stage, app shell — required by every story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Content model & validation

- [X] T011 [P] Create `content/generations.json` as `{ "generations": [...] }` with six entries (`wifi4`, `wifi5`, `wifi6`, `wifi6e`, `wifi7`, `wifi8`), each with `id`, `name` (Wi-Fi Alliance name), `ieee` (`wifi6e` = "IEEE 802.11ax (6 GHz)"), `year` (from R11; mark uncertain years with a `"note"` for the accuracy gate), `colorToken` (`--gen-wifi4` … `--gen-wifi8`), `status` (`wifi8` MUST be `in-development`, others `ratified`), `referenceIds` (≥ 1)
- [X] T012 [P] Create `content/source-policy.json` from research.md R15: `publishers` (`id`, `name`, `tier`, `domains`, `use`) for IEEE, Wi-Fi Alliance, IETF/RFC Editor, FCC, ECC/CEPT, ETSI, ISED, Ofcom, NIST (Tier 1) and peer-reviewed (`doi.org`), FDA, AAMI, WHO (Tier 2); `excluded` categories with descriptions (vendor material of any kind, Wikipedia, blogs, forums, news/trade press, analyst marketing reports, AI-generated text, uncredited infographics — categories only, no vendor names); `technicalMinTier: 1`, `contextMinTier: 2`, `maxVerificationAgeDays: 365`
- [X] T013 Create `content/references.json` as `{ "references": [...] }` seeded with every source in research.md R11 and R16 (IEEE 802.11n/ac/ax/be/ah/bn, Wi-Fi Alliance Wi-Fi 6/6E/7 and WPA3 material, FCC 20-51, ECC/CEPT 6 GHz decision, IEEE 802.3af/at/bt, IEEE 802.3bz/an); fields per data-model.md: `id`, `title`, `publisher` (a publisher id from `content/source-policy.json`), `tier` (must equal the publisher's tier), `identifier` (standard number, docket, or DOI), `edition`, `date` (YYYY or YYYY-MM-DD), `status` (`current`|`superseded`), `access` (`open`|`paywalled`), `url` (`https:` on an allowlisted domain of that publisher — look up each official landing page; do not guess URLs) (depends on T012)
- [X] T014 [P] Create `scripts/derivations.mjs` exporting pure functions `phyRate({ nss, nsd, bits, codingRate, symbolUs, giUs })` → Mbps, `channelCount({ bandStartMHz, bandEndMHz, widthMHz, firstCenterMHz, stepMHz })`, `percentGain(a, b)`, `ratio(a, b)`, plus `round(value, rounding)`; and `tests/content/derivations.test.mjs` (`node:test`) asserting the research.md R16 table exactly: 150.0 / 866.7 / 1201.0 / 2882.4 Mbps per stream and 600 Mbps / 6.93 Gbps / 9.61 Gbps / 46.1 Gbps peak, 20% QAM gain, and US 6 GHz counts 59 / 29 / 14 / 7 / 3 for 20 / 40 / 80 / 160 / 320 MHz
- [X] T015 Create `content/claims.json` as `{ "claims": [...] }` seeded from research.md R11 and the R16 worked table: stated input claims for each generation's max spatial streams, widest channel, data subcarriers (N_SD 108 / 468 / 1960 / 3920), modulation bits (6 / 8 / 10 / 12), max coding rate (5/6), symbol duration and shortest guard interval; derived claims for peak PHY rates (600 Mbps, 6.93 Gbps, 9.61 Gbps, 46.1 Gbps), the 4096- vs 1024-QAM gain (20%), US 6 GHz channel counts per width, and "320 MHz = 2 × 160 MHz"; stated claims for PoE class power (15.4 / 30 / 60 / 90 W at the PSE), 6 GHz band edges, TWT origin, and the other R11 rows. Every claim has `kind`, `method`, ≥ 1 source with a best-known `locator` (clause/table/section; mark uncertain ones "… — exact table to confirm" in `verification.notes`), and `verification` with `verifiedOn: null`, `verifiedBy: null` (depends on T013, T014)
- [X] T016 [P] Create `docs/source-policy.md`: the human-readable source policy (tiers, allowlisted publishers and why, excluded categories, technical vs context claims), how a claim is recorded (locator, excerpt, stated/derived/illustrative), how derived values are recomputed, the verification procedure (open the source at the locator, confirm value and wording, record date and initials/role, 12-month re-verification), what to do when a Tier 1 text is paywalled (claim stays unverified; never substitute a lower tier), and how to propose a new publisher (PR changing `content/source-policy.json`, CODEOWNERS review)
- [X] T017 [P] Create `content/glossary.json` as `{ "terms": [] }` and `content/scenarios.json` as `{ "scenarios": [] }` (stories fill them in)
- [X] T018 [P] Create the 11 tab stub files `content/tabs/01-overview.json` … `content/tabs/11-references.json` (names exactly as in plan.md) with `id` (`overview`, `spectrum`, `mlo`, `qam-puncturing`, `security`, `twt`, `density`, `latency`, `bandwidth-poe`, `wifi8`, `references`), `order` 1–11, `kind` (`overview`; `feature` for 2–9; `roadmap` for 10; `references` for 11), `title` (≤ 40 chars), a one-sentence `summary`, `sceneId` (same as `id`; `null` for references), `introducedIn` (`spectrum`→`wifi6e`, `twt`/`security`/`qam-puncturing`/`density`→`wifi6`, others `wifi7`, overview/wifi8/references `null`), `wifi7Adds` (non-empty string when `introducedIn` ≠ `wifi7`, else null), `compareGenerations`, `defaultCompare` (`wifi6e` for spectrum/mlo, `wifi6` otherwise), empty `beats`, `keyFigures`, `scenarioIds`, `sections`, and `"draft": true`
- [X] T019 Create `scripts/validate-content.mjs` exporting `validateContent({ release })` that returns `{ errors, warnings }` and, when run as a CLI, prints them and exits 1 on errors (`--release` flag sets release mode). Implement every rule in data-model.md "Validation rules": (1) unique ids, tab `order` 1–11 contiguous; (2) all `[[term]]`, `[[term|text]]`, `{{ref}}`, `referenceIds`, `scenarioIds`, Generation ids resolve; (3) `feature` tabs have exactly 5 beats in order problem → what → how → improvement → why, overview/roadmap 3–6 beats of `intro|context|outlook`; (4) every `sceneState` and `DeepSection.sceneState` appears in the scene module's exported `states` (import `src/scenes/<sceneId>.js` default export; skip with a warning if the module doesn't exist yet); (5) KeyFigures whose `metric` matches /peak|max/i have `qualifier` `theoretical` or `specified-not-shipping`, and `qualifier: "regulatory"` requires `regulatoryDomain`; (6) `introducedIn` ≠ `wifi7` requires non-empty `wifi7Adds`; (7) no string matches `tests/content/denylist.txt` (case-insensitive, whole word); (8) guarantee phrases ("ensures compliance", "guarantee", "eliminates risk", "HIPAA compliant", "prevents patient harm") → warnings; (9) each glossary term used on a tab is marked with `[[ ]]` at least once on that tab; (10) every Reference is cited (orphans: warning normally, error in release); (11) audience layers — every `feature` tab beat has `bottomLine` ≤ 40 words, `how` and `improvement` beats have non-empty `deepDive`, each `feature` tab has 2–3 keyFigures with `headline: true`; (12) security — no content string contains `<`, `>`, `javascript:` or `data:` outside the inline markup forms, and every Reference `url` starts with `https:`. "Used" in rule 9 means the term's `term` or `expansion` appears as a whole word, case-insensitive, in a beat `heading`/`body`/`bottomLine`/`deepDive` or section `body`. Also enforce field rules: `title` ≤ 40 chars, beat `heading` ≤ 60 chars, `sceneDescription` ≥ 20 words, `durationMs` 6000–20000, glossary `definition` ≤ 50 words. Draft vs release per data-model.md: `"draft": true` tabs skip rules 3, 9 and 11; the minimum counts (`feature` tabs ≥ 2 keyFigures, ≥ 1 scenarioId, 2–3 headline figures) and orphan references are enforced only when `release` is set; release mode errors on any remaining `draft`
- [X] T020 Create `scripts/provenance-report.mjs` and the `provenance` script in `package.json`: writes `docs/provenance-report.md` — a header with generation date and source-policy summary, then every claim grouped by the tabs that use it (statement, value and unit, method, each source as "publisher — identifier, edition — locator — tier — access" with excerpt, derivation formula with inputs and recomputed value, verification status), then unused claims; `--check` regenerates in memory and exits 1 with a diff summary if the committed file differs; output is deterministic (sorted, no timestamps other than the latest content change date) (depends on T019, T014)
- [X] T021 [P] Create `tests/content/denylist.txt` listing major Wi-Fi/networking vendor, chipset and product-line names, one per line (comments start with `#`), and `tests/content/denylist.test.mjs` (`node:test`) that scans all `content/**/*.json` and, when present, `dist/index.html` and `dist/app.js` string literals for denylisted words
- [X] T022 [P] Create `tests/content/validate.test.mjs` (`node:test`): runs `validateContent()` on the real content (expect zero errors) and on in-memory fixtures that break each rule 1–19 and each field limit (expect the matching error) — including a vendor-domain reference, a Tier 2-only technical claim, a missing locator, a derived claim whose inputs no longer reproduce its value, a key figure whose claim value differs, an uncited "46 Gbps" in a beat body, and (release mode) an unverified or 13-month-old claim

### Content loading & markup

- [X] T023 [P] Create `src/app/markup.js` exporting `renderMarkup(text, { glossary, claims, references })` → safe HTML string per contracts/content-schema.md: escape all HTML first, then `[[id]]`/`[[id|text]]` → `<button type="button" class="term" data-term="id">`, `{{claim-id}}` → `<sup><button type="button" class="cite" data-claim="claim-id" aria-label="Source for: <claim statement>">[n]</button></sup>` (n = stable citation number per page), `{{ref:id}}` → `<sup><a class="cite-ref" href="#/references?ref=id">[ref]</a></sup>`, `**x**` → `<strong>`, blank lines → `<p>` paragraphs; no other markup
- [X] T024 [P] Create `tests/content/markup.test.mjs` (`node:test`) covering escaping (`<script>` stays inert), term/cite/strong/paragraph output, and unknown ids
- [X] T025 Create `src/app/content.js` that imports every JSON file under `content/` (static imports so esbuild bundles them), sorts tabs by `order`, and exports `tabs`, `tabById`, `generations`, `genById`, `glossary`, `termById`, `references`, `refById`, `scenarios`, `scenarioById`, `claims`, `claimById`, `sourcePolicy`, `publisherById`, a `claim(id)` helper returning `{ value, unit, method, statement }`, a `citationNumber(claimId)` helper, and derived `termTabs` (term id → tab ids where it appears)

### Styling & stage

- [X] T026 [P] Create `src/styles/tokens.css`: color tokens on `:root` for the light theme, dark overrides under `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])` and under `:root[data-theme="dark"]`; generation tokens `--gen-wifi4` (muted gray), `--gen-wifi5` (slate blue), `--gen-wifi6`/`--gen-wifi6e` (amber), `--gen-wifi7` (teal), `--gen-wifi8` (violet) per research R9, each meeting 3:1 against both theme backgrounds; system font stack; type scale and spacing tokens; focus-ring token with ≥ 3:1 contrast; explicit `body` background
- [X] T027 [P] Create `src/stage/palette.js` exporting generation colors (hex) that exactly mirror the `--gen-*` values in `src/styles/tokens.css`, plus `materialFor(genId)` helpers, and a comment pointing to tokens.css as the source of truth
- [X] T028 [P] Create `src/stage/tween.js`: `tween({ from, to, durationMs, easing, onUpdate, signal })` returning a promise; easings (linear, easeInOutCubic, easeOutBack); a global `setMotion('full'|'reduced')` under which tweens resolve instantly at their end value; cancellation via `AbortSignal`; driven by the stage loop tick, not its own rAF
- [X] T029 [P] Create `src/app/preferences.js`: theme (`system`|`light`|`dark`, applied as `data-theme` on `<html>`), motion (`system`|`full`|`reduced`; `system` follows `prefers-reduced-motion`) and view (`leadership`|`technical`, default `leadership`), stored in `localStorage` under one key with every access wrapped in try/catch and unknown values discarded (FR-041: nothing else is ever stored), exposing `get`, `set`, and change events
- [X] T030 Create `src/stage/renderer.js`: one shared `WebGLRenderer` (antialias, `setPixelRatio(Math.min(devicePixelRatio, 2))`) and one `CSS2DRenderer` label layer inside `#stage`; a shared perspective camera; `ResizeObserver` resizing; `mountScene(sceneModule, ctxExtras)` that builds the `ctx` from contracts/scene-module.md (`three`, fresh `scene`, `camera`, `labels`, `kit`, `palette`, `tween`, `motion`, `t`, `claim`), calls `create(ctx)`, and returns the instance; `unmountScene()` that calls `dispose()`, removes labels, and checks `renderer.info.memory` returns to baseline (console warning if not); a render loop that ticks tweens and `instance.update(dt)`, stops when `instance.isIdle()` and no tweens run, restarts on demand, and pauses on `document.visibilitychange` when hidden; exports `webglAvailable()` feature detection
- [X] T031 [P] Create `src/stage/kit/access-point.js`: `accessPoint({ bands })` low-poly AP mesh with optional per-band radiating ring indicators
- [X] T032 [P] Create `src/stage/kit/client.js`: `client(type)` for types `voice-badge`, `phone`, `laptop`, `infusion-pump`, `telemetry-monitor`, `rtls-tag`, `workstation-cart`, `imaging-cart`, `tablet` — simple generic silhouettes, no branding; supports `InstancedMesh` creation for many identical clients
- [X] T033 [P] Create `src/stage/kit/spectrum.js`: `band(id)` (2.4/5/6 GHz strips drawn to frequency scale), `channelBlock({ widthMHz, startMHz, gen })`, and a frequency axis with labels via `ctx.labels`
- [X] T034 [P] Create `src/stage/kit/signals.js`: `packet({ gen })` traveling-frame meshes, `linkBeam(from, to, { gen })` animated link lines, and `constellation(order)` building a square QAM point grid for 64/256/1024/4096 (instanced points)
- [X] T035 [P] Create `src/stage/kit/timeline.js`: horizontal time axis with awake/asleep segments, service-period blocks, and event markers (used by TWT and latency scenes)
- [X] T036 Create `src/stage/kit/index.js` re-exporting all kit parts as the `ctx.kit` object (depends on T031–T035)
- [X] T037 Create `src/scenes/index.js`: registry mapping `sceneId` → scene module (initially empty map with a `register` pattern; stories add entries)

### App shell

- [X] T038 Create `src/index.html`: `<!doctype html>`, charset, viewport, the meta Content-Security-Policy exactly as in research.md R12 and `<meta name="referrer" content="no-referrer">` (both before any other resource), `<title>Wi-Fi 7 Explained</title>`, links to `tokens.css`, `layout.css`, `present.css`; no inline `<script>`, `on*=` attributes or `style="…"` attributes; a `<header role="banner">` with site title, an "Audience" radio group (Leadership / Technical) placeholder for US8, theme toggle, motion toggle, "Present" and "Keyboard shortcuts" buttons; `<nav>` holding `<div role="tablist" aria-label="Wi-Fi 7 story">`; `<main>` with one `role="tabpanel"` region containing `#stage` (canvas container, `aria-hidden="true"`), `#story` (beat heading/body), `#scene-description` ("What the animation shows", `aria-live="polite"`), `#controls`, `#compare`, `#figures`, `#scenario`; Previous/Next buttons and a `#progress` element; a `<noscript>` message; `<script defer src="app.js"></script>` (classic script, not a module)
- [X] T039 Create `src/styles/layout.css`: responsive grid — wide screens stage left/story right, below 900 px stacked; works from 360 px wide with no horizontal scroll; 16 px side gutter on phones; tablist scrolls horizontally inside its own container on small screens; visible focus styles using the focus token
- [X] T040 Create `src/main.js`: import styles-independent modules, read preferences, call `setMotion`, detect WebGL, initialize the router, tablist and stage (stories add modules here), and log no errors on a clean load
- [X] T041 [P] Create `tests/e2e/helpers.js`: `fileUrl(hash = '')` → absolute `file://` URL of `dist/index.html` + hash; `guardOffline(page)` that routes every request whose URL does not start with `file:` to `abort()` and records it so tests can assert none happened; `collectConsoleErrors(page)`; `trackCspViolations(page)` that uses `page.addInitScript` to record every `securitypolicyviolation` event into `window.__cspViolations` and returns a getter; `gotoTab(page, id, beat)`
- [X] T042 [P] Create `tests/content/security.test.mjs` (`node:test`): `src/index.html` contains the R12 CSP meta tag verbatim and the `no-referrer` meta, and no inline `<script>` body, `on*=` or `style=` attributes; no file under `src/` uses `eval(`, `new Function(`, string `setTimeout`/`setInterval`, `document.write`, or `innerHTML`/`outerHTML`/`insertAdjacentHTML` except the single documented sink that receives `renderMarkup()` output (allow-list by file and line comment `// safe: renderMarkup`); `package.json` versions are exact (no `^`, `~`, `*`, ranges or git URLs) and `package-lock.json` exists
- [ ] T043 Open a pull request from `001-wifi7-healthcare-explainer` to `main` with `gh pr create` so CI and CodeQL run once and register their check names; then create a branch ruleset on `main` with `gh api repos/timbertino1/Wi-Fi_Comparison/rulesets` (`target: branch`, `enforcement: active`, include `~DEFAULT_BRANCH`; rules `deletion`, `non_fast_forward`, `required_linear_history`, `pull_request` with `required_approving_review_count: 0` and `required_review_thread_resolution: true`, and `required_status_checks` with `strict_required_status_checks_policy: true` listing the check contexts exactly as reported on the PR — `validate`, `build`, `e2e (chromium)`, `e2e (firefox)`, `e2e (webkit)`, `audit`, `dependency-review`, and the CodeQL analysis check); verify with `gh api …/rulesets` and record the ruleset id in `specs/001-wifi7-healthcare-explainer/checklists/security-gate.md`

**Checkpoint**: `npm test` passes on stub content, `npm run build:fast` produces `dist/` that opens by double-click and shows an empty shell without errors, CI is green on the PR, and `main` is protected by the ruleset.

---

## Phase 3: User Story 1 - Follow the Wi-Fi 7 story from the overview (Priority: P1) 🎯 MVP

**Goal**: Overview tab with its animated scene, plus working 11-tab navigation, progress, and deep links

**Independent Test**: Open `dist/index.html` locally, read the Overview, reach every tab with mouse
and keyboard; Next visits all 11 in order; `#/mlo` opens directly (quickstart V1, V2, V4-nav, V5, V6)

### Tests for User Story 1

- [X] T044 [P] [US1] Create `tests/e2e/navigation.spec.js`: Overview shows on load with all 11 tabs listed; Next from Overview visits tabs 1→11 in `order` and the last tab offers "Back to Overview"; tablist ArrowLeft/ArrowRight/Home/End move and activate tabs with visible focus; `#/mlo` and `#/mlo/3` open directly; out-of-range beat clamps; unknown tab id shows Overview plus a "Section not found" notice; browser Back returns to the previous tab (not previous beat); any tab reachable from any other in ≤ 2 actions; progress reads "Tab n of 11"; `guardOffline` records zero non-`file:` requests; zero console errors

### Implementation for User Story 1

- [X] T045 [US1] Create `src/app/router.js` per contracts/ui-navigation.md: parse/serialize `#/<tabId>/<n>?gen=<genId>&present&ref=<id>` (1-based beats; clamp out-of-range; unknown tab → Overview + notice event); beat changes use `history.replaceState`, tab changes assign `location.hash`; emits `route` events with `{ tabId, beatIndex, gen, present, ref }`
- [X] T046 [US1] Create `src/app/tabs.js`: build the WAI-ARIA tablist from `content.tabs` (`role="tab"`, `aria-selected`, `aria-controls`, roving `tabindex`, automatic activation, ArrowLeft/ArrowRight/Home/End), Previous/Next buttons following `order` (last tab's Next = "Back to Overview"), `#progress` text "Tab n of 11 · Step m of k" (step part hidden for tabs without beats), and announce tab changes
- [X] T047 [US1] Create `src/app/story.js`: beat state machine holding `{ tabId, beatIndex }`; renders the beat `heading` and `renderMarkup(body)` into `#story` and `sceneDescription` into `#scene-description`; on tab change unmounts the previous scene and mounts the new one via `src/stage/renderer.js` (lazy, using `src/scenes/index.js`); calls `instance.setState(beat.sceneState, { generation, animate })` with `animate: false` on deep-link entry; exposes `next()`, `prev()`, `goTo(i)` and emits `beat` events; minimal Next/Previous-beat behavior (full controls come in US2)
- [X] T048 [US1] Write the Overview content in `content/tabs/01-overview.json` (remove `draft`): 3–6 beats of type `intro`/`context`/`outlook` — a busy fictional hospital whose wireless load is growing (clinician voice, telemetry, infusion pumps, RTLS, imaging, telehealth); the Wi-Fi 4 → 5 → 6 → 6E → 7 timeline with years and IEEE names from `generations.json`; a beat that previews the feature tabs and how to use the page. Each beat needs `heading` ≤ 60 chars, `sceneState`, `sceneDescription` ≥ 20 words, `durationMs` 6000–20000; add any `[[terms]]` to `content/glossary.json` and cite `{{refs}}`
- [X] T049 [US1] Render the Overview's tab preview list (each tab's `title` + one-sentence `summary`, linking to `#/<id>`, plus a "Start the story" button to tab 2) in `src/app/overview.js`, shown under the Overview's final beat; confirm every stub `summary` in `content/tabs/*.json` is a single accurate sentence
- [X] T050 [P] [US1] Create `src/scenes/overview.js` with `states` matching T048 beats: a stylized hospital floor (rooms, corridor, nurses' station) where client devices multiply over time, then a 3D timeline of generations colored with `ctx.palette` and labeled via `ctx.labels`; deterministic end states; implements every SceneInstance method incl. `dispose()`; register it in `src/scenes/index.js`
- [X] T051 [US1] Wire router, tabs, story, overview and scene registry together in `src/main.js`; keyboard focus in the tablist vs. the stage follows contracts/ui-navigation.md
- [X] T052 [US1] Run `npm run build:fast && npx playwright test tests/e2e/navigation.spec.js` and fix failures; open `dist/index.html` by double-click to confirm quickstart V1

**Checkpoint**: Overview + navigation across all 11 tab stubs works locally, offline, and by keyboard.

---

## Phase 4: User Story 2 - Learn one feature through an animated, step-by-step story (Priority: P1)

**Goal**: Full five-beat stories with synchronized 3D scenes and controls on all feature tabs (2–9)
plus the Wi-Fi 8 roadmap tab (10)

**Independent Test**: On any feature tab, Play/Pause/Step/Replay through all five beats; text, scene
and description stay in sync; terms are defined at first use; "Under the hood" depth is available
(quickstart V7)

**Order**: build the engine (T053–T057), then the MLO tab (T058–T059) as the MVP proof, then the
other tabs. Content tasks append to shared glossary/references files and run one after another;
scene tasks are [P].

### Tests for User Story 2

- [X] T053 [P] [US2] Create `tests/e2e/story.spec.js`: on each tab with beats — Play advances beats after `durationMs` (use a test hook to shorten dwell), Pause stops, Step ±, Replay returns to beat 1, keys `K`, `R`, `1`–`5`, ArrowRight/ArrowLeft/PageDown/PageUp/Space with focus on the stage step beats; after each change `#story` heading, `#scene-description` text and the scene's reported state (`window.__stage.state` test hook) match the beat; glossary popover opens on a term, closes on Escape; "Under the hood" toggles; MLO's "MLO modes" section opens and changes the scene state

### Implementation for User Story 2

- [X] T054 [US2] Create `src/app/controls.js`: native `<button>` controls in `#controls` — Play/Pause (`aria-pressed`), Step back, Step forward, Replay, and beat dots 1–5; auto-play advances after each beat's `durationMs` once `setState` has settled; keys per contracts/ui-navigation.md (`K`, `R`, `1`–`5`, arrows/PageUp/PageDown/Space when focus is not in the tablist or a text control); auto-play never starts on load when motion is reduced; exposes the `window.__stage` test hook (current state name, dwell override) only when the URL contains `?test`
- [X] T055 [US2] Create `src/app/glossary.js`: clicking or pressing Enter on a `.term` button opens an accessible popover (`role="dialog"`, labelled by the term, expansion + definition from `content/glossary.json`), Escape or outside-click closes and returns focus
- [X] T056 [US2] Add the "Under the hood" disclosure (`<details>`) for `beat.deepDive` and the `DeepSection` list (each section a `<details>`; opening one calls `setState(section.sceneState)`, closing restores the current beat's state) in `src/app/story.js`
- [X] T057 [US2] Make `setState` transitions cancel cleanly when the viewer steps quickly (AbortController per transition in `src/app/story.js`) and verify the loop stops when idle (`src/stage/renderer.js`)
- [X] T058 [US2] Write MLO content in `content/tabs/03-mlo.json` (remove `draft`) per FR-014: problem = a nurse's voice badge call breaking up on a congested band while walking between units; what = one connection across several bands; how = aggregation, redundancy and instant failover across 2.4/5/6 GHz links; improvement = Wi-Fi 6E single-band association vs Wi-Fi 7 multi-link; why = steadier voice and telemetry. Add `sections[0]` "MLO modes: STR, NSTR, EMLSR, EMLMR" explaining each mode and why battery-powered phones/badges commonly use EMLSR while laptops/APs may use STR. Beat rules: exactly 5 beats in order problem → what → how → improvement → why, `heading` ≤ 60 chars, `sceneDescription` ≥ 20 words, `durationMs` 6000–20000, a `bottomLine` (≤ 40 words) on every beat and a `deepDive` on the how and improvement beats (all later content tasks follow these same rules); mark terms `[[mlo]]`, `[[str]]`, `[[nstr]]`, `[[emlsr]]`, `[[emlmr]]`, `[[band]]`, `[[voice-badge]]` at first use and add them to `content/glossary.json` (definition ≤ 50 words); cite `{{ieee-80211be}}`
- [X] T059 [P] [US2] Create `src/scenes/mlo.js` with `states` for every MLO beat and section (e.g., `single-link-congested`, `what-is-mlo`, `links-aggregate`, `gen-compare`, `clinical-outcome`, `modes-compare`): AP and a walking badge; Wi-Fi 6E shows one link beam that congests (packets queue/stall); Wi-Fi 7 shows multiple beams with packets spread across bands and a failover when one band fills; `modes-compare` shows STR (two radios transmitting at once), EMLSR (one radio listening on several links, switching to the one with traffic), EMLMR; `gen-compare` renders `defaultCompare` and Wi-Fi 7 side by side; register in `src/scenes/index.js`
- [X] T060 [US2] Write 6 GHz & 320 MHz content in `content/tabs/02-6ghz-320mhz.json` per FR-013 (same beat rules as T058): problem = crowded 2.4/5 GHz in a dense ward with legacy devices; what = the 6 GHz band, opened to Wi-Fi with Wi-Fi 6E, and 320 MHz channels (Wi-Fi 7, 6 GHz only); how = band sizes to scale, US (FCC) 5.925–7.125 GHz, channel counts per width, no legacy devices, shorter range/wall penetration; improvement = 160 MHz max (Wi-Fi 6E) vs 320 MHz (Wi-Fi 7); why = imaging transfers and telehealth video on clean spectrum; state that availability varies by country; terms `[[6ghz]]`, `[[channel-width]]`, `[[legacy-device]]`, `[[regulatory-domain]]`; cite FCC and ECC/ETSI references
- [X] T061 [P] [US2] Create `src/scenes/spectrum.js`: the three bands to frequency scale using `kit.spectrum`, channels filling at 20/40/80/160/320 MHz, legacy devices crowding 2.4/5 GHz, range rings showing 6 GHz attenuating through walls; `gen-compare` contrasts Wi-Fi 6E 160 MHz blocks with Wi-Fi 7 320 MHz blocks; register in `src/scenes/index.js`
- [X] T062 [US2] Write 4K-QAM, Preamble Puncturing & Multi-RU content in `content/tabs/04-qam-puncturing-multiru.json` per FR-015: constellation density 256-QAM (8 bits/symbol, Wi-Fi 5) → 1024-QAM (10, Wi-Fi 6) → 4096-QAM (12, Wi-Fi 7) ≈ 20% peak gain over 1024-QAM, needing strong signal/short range; preamble puncturing lets a wide channel skip a narrow interferer (limited and optional in Wi-Fi 6 — check wording against R11 ⚠); Multi-RU gives one client several non-adjacent resource units vs one RU per client in Wi-Fi 6; healthcare: a medical device on a nearby channel no longer forces the whole channel narrower; terms `[[qam]]`, `[[symbol]]`, `[[snr]]`, `[[preamble-puncturing]]`, `[[resource-unit]]`, `[[multi-ru]]`, `[[ofdma]]`
- [X] T063 [P] [US2] Create `src/scenes/qam-puncturing.js`: an instanced constellation grid growing from 256 to 1024 to 4096 points with a noise cloud showing why high SNR is needed; a channel strip with an interferer where the earlier generation drops to a narrower channel and Wi-Fi 7 punctures the busy 20 MHz slice; an RU map where Wi-Fi 6 gives one RU per client and Wi-Fi 7 gives one client multiple non-adjacent RUs; register in `src/scenes/index.js`
- [X] T064 [US2] Write Security content in `content/tabs/05-security.json` per FR-016: problem = shared passphrase and offline guessing risk on WPA2; what = WPA3 (SAE, forward secrecy), Enhanced Open (OWE); how = SAE handshake vs WPA2 4-way handshake capture; improvement = WPA2 → WPA3, 6 GHz requires WPA3 or OWE, Wi-Fi CERTIFIED 7 security requirements exactly as confirmed against R11 ⚠ (e.g., WPA3 required, GCMP-256, beacon protection); why = protecting clinical and medical-device traffic — no compliance claims; terms `[[wpa3]]`, `[[sae]]`, `[[forward-secrecy]]`, `[[owe]]`, `[[gcmp-256]]`, `[[beacon-protection]]`
- [X] T065 [P] [US2] Create `src/scenes/security.js`: an attacker capturing a WPA2 handshake and attempting offline guesses (fast-cycling lock) vs a WPA3 SAE exchange where captured frames give nothing to test offline; per-session keys shown as distinct locks; a 6 GHz gate admitting only WPA3/OWE clients; register in `src/scenes/index.js`
- [ ] T066 [US2] Write TWT, Battery Life & Restricted TWT content in `content/tabs/06-twt.json` per FR-017: problem = badges and RTLS tags draining batteries by listening constantly; what = Target Wake Time (origin 802.11ah, mainstream with Wi-Fi 6); how = negotiated wake schedules (individual and broadcast TWT); improvement = Wi-Fi 7 adds Restricted TWT — protected service periods for latency-sensitive traffic like voice and telemetry; why = fewer battery swaps mid-shift and dependable voice; terms `[[twt]]`, `[[restricted-twt]]`, `[[service-period]]`, `[[rtls]]`
- [ ] T067 [P] [US2] Create `src/scenes/twt.js` using `kit.timeline`: pre-TWT devices awake continuously (battery gauges draining), TWT devices sleeping between scheduled windows (gauges draining slowly), and Restricted TWT reserving protected slots where other traffic must stop before the voice/telemetry window begins; register in `src/scenes/index.js`
- [ ] T068 [US2] Write Client Density content in `content/tabs/07-density.json` per FR-018: problem = emergency department at shift change with many devices per bed; what = how many clients share airtime; how = contention, OFDMA and BSS coloring (Wi-Fi 6) plus wider channels, MLO load balancing, Multi-RU and puncturing (Wi-Fi 7); improvement = Wi-Fi 5 vs Wi-Fi 6 vs Wi-Fi 7 airtime sharing; why = devices-per-bed growth; terms `[[airtime]]`, `[[contention]]`, `[[bss-coloring]]`
- [ ] T069 [P] [US2] Create `src/scenes/density.js`: an ED bay with hundreds of instanced client devices; Wi-Fi 5 sends one client at a time (others queued), Wi-Fi 6 slices the channel per OFDMA, Wi-Fi 7 additionally spreads clients across links and bands; a stays-under-budget instanced implementation (≤ 150 draw calls); register in `src/scenes/index.js`
- [ ] T070 [US2] Write Low & Predictable Latency content in `content/tabs/08-latency.json` per FR-019: problem = a telemetry alarm delayed behind bulk traffic, choppy voice, a remotely supported procedure; what = average latency vs predictability (jitter, worst case); how = MLO picks the free link, Restricted TWT protects time slots, Multi-RU finds spectrum; improvement = Wi-Fi 6 vs Wi-Fi 7 latency distribution (show the tail, not just the average; no invented numbers — illustrative shapes clearly labeled "illustrative"); why = alarms and voice arrive on time more consistently; terms `[[latency]]`, `[[jitter]]`, `[[tail-latency]]`
- [ ] T071 [P] [US2] Create `src/scenes/latency.js`: packets racing from bedside monitor to AP to nurses' station with a stopwatch; a live histogram of delivery times where the Wi-Fi 7 distribution has a much shorter tail; overlays showing which of MLO / Restricted TWT / Multi-RU removed each delay; register in `src/scenes/index.js`
- [ ] T072 [US2] Write Bandwidth, Peak Rates & PoE content in `content/tabs/09-bandwidth-poe.json` per FR-020: problem = APs that can't be fed enough power or uplink bandwidth; what = peak PHY rate per generation (Wi-Fi 4 ≈ 600 Mbps, 5 ≈ 6.9 Gbps, 6 ≈ 9.6 Gbps, 7 ≈ 46 Gbps — the last labeled specified in the standard with 16 spatial streams, not in current devices) vs realistic per-client throughput; how = multi-gigabit Ethernet uplinks (2.5/5/10GBASE-T) and PoE classes (802.3af 15.4 W, 802.3at 30 W, 802.3bt Type 3 60 W, Type 4 90 W at the switch port); improvement = what changes in switch, cabling and power planning for Wi-Fi 7 APs; why = planning closets and switch budgets for hospital floors; terms `[[phy-rate]]`, `[[spatial-stream]]`, `[[poe]]`, `[[multigig]]`, `[[uplink]]`
- [ ] T073 [P] [US2] Create `src/scenes/bandwidth-poe.js`: a switch → cable → AP chain where data "pipe" width and power "flow" scale per generation; bar towers for peak PHY rates with the 46 Gbps tower drawn hatched/ghosted and labeled as theoretical/not shipping; a PoE budget gauge per AP class; register in `src/scenes/index.js`
- [ ] T074 [US2] Write Wi-Fi 8 content in `content/tabs/10-wifi8.json` per FR-021: 3–6 beats (`intro`/`context`/`outlook`) describing IEEE 802.11bn "Ultra High Reliability" goals in neutral terms from the TGbn source (check against R11 ⚠), every beat clearly marked forward-looking and subject to change; terms `[[uhr]]`; cite `{{ieee-80211bn}}`
- [ ] T075 [P] [US2] Create `src/scenes/wifi8.js`: the generation timeline continuing past Wi-Fi 7 with Wi-Fi 8 drawn in dashed violet outlines ("in development"), with reliability-themed visuals (steady links through interference) and no invented figures; register in `src/scenes/index.js`
- [ ] T076 [US2] Run `npm run validate` (scene-state rule 4 now checks every module) and `npx playwright test tests/e2e/story.spec.js`; fix failures

**Checkpoint**: Every feature tab and the roadmap tab tells its full story with synchronized scenes.

---

## Phase 5: User Story 3 - Compare Wi-Fi 7 to earlier generations side by side (Priority: P1)

**Goal**: Generation switcher, key-figures panel with qualifier labels, lineage callouts, and
consistent generation colors on every tab

**Independent Test**: On each feature tab, switch generations; the scene changes; labels show Wi-Fi
name + IEEE amendment; figures update; theoretical values are labeled; colors match across tabs

### Tests for User Story 3

- [ ] T077 [P] [US3] Create `tests/e2e/comparison.spec.js`: on each feature tab the switcher is a `role="radiogroup"` listing exactly `compareGenerations` with "Wi-Fi N (IEEE 802.11xx)" labels; selecting one updates `?gen=` in the hash, the scene state (`window.__stage.generation`) and the highlighted key-figure column; `G` cycles generations; `#/spectrum/4?gen=wifi5` style deep links restore the generation; every figure with qualifier `theoretical` / `specified-not-shipping` / `optional` / `regulatory` shows its text badge; tabs with `introducedIn` ≠ `wifi7` show the lineage callout; computed colors of each generation chip are identical on every tab

### Implementation for User Story 3

- [ ] T078 [US3] Create `src/app/comparison.js`: render the generation radio group in `#compare` from the tab's `compareGenerations` (text label + color swatch, never color alone; default `defaultCompare`); on change call `instance.setGeneration(genId)`, update the router's `gen` param via `replaceState`; handle the `G` key
- [ ] T079 [US3] Create the key-figures panel in `src/app/figures.js`: a table in `#figures` with one column per compared generation, units, `null` shown as "Not supported", qualifier badges with text — `theoretical` → "Theoretical maximum", `specified-not-shipping` → "In the standard; not in current devices", `optional` → "Optional", `regulatory` → "Varies by country: <regulatoryDomain>", `typical` → "Typical" — plus `note` and citation links via `renderMarkup`; highlight the selected generation's column
- [ ] T080 [US3] Add the lineage callout to `src/app/story.js`: when `introducedIn` ≠ `wifi7`, show "First introduced in <generation name> (<ieee>). What Wi-Fi 7 adds: <wifi7Adds>"
- [ ] T081 [US3] Add `keyFigures` (≥ 2 per feature tab, of which 2–3 marked `headline: true` — the figures a leader needs; fields `id`, `metric`, `unit`, `values`, `qualifier`, `regulatoryDomain`, `note`, `headline`, `claimIds` — one claim per non-null generation value, adding stated or derived claims to `content/claims.json` with sources and locators as needed; peak rates MUST be `theoretical`, 46 Gbps MUST be `specified-not-shipping`) to `content/tabs/02-6ghz-320mhz.json` (spectrum per band, channel counts per width with `regulatoryDomain: "US (FCC)"`, max channel width), `03-mlo.json` (simultaneous links, failover), `04-qam-puncturing-multiru.json` (bits per symbol, peak-rate gain, puncturing support, RUs per client), `05-security.json` (required security per band/certification), `06-twt.json` (TWT types supported per generation), `07-density.json` (simultaneous OFDMA users, BSS coloring, MLO load balancing), `08-latency.json` (mechanisms available per generation — no invented latency numbers), `09-bandwidth-poe.json` (peak PHY rate, max spatial streams, max channel width, PoE class per 802.3 standard, uplink speeds) using the figures from research.md R11/R16 (the peak-rate figures MUST point at the derived claims from T015)
- [ ] T082 [P] [US3] Add `setGeneration` support for every generation in `compareGenerations` to `src/scenes/spectrum.js` and `src/scenes/mlo.js` (Wi-Fi 5: 5 GHz only, 160 MHz max, no 6 GHz; Wi-Fi 6E: single-link 6 GHz; Wi-Fi 7: full), coloring with `ctx.palette`; in-scene numbers must equal the tab's keyFigures
- [ ] T083 [P] [US3] Add `setGeneration` support to `src/scenes/qam-puncturing.js` and `src/scenes/security.js` (constellation order, puncturing on/off, RU assignment, WPA2 vs WPA3 per generation)
- [ ] T084 [P] [US3] Add `setGeneration` support to `src/scenes/twt.js`, `src/scenes/density.js`, `src/scenes/latency.js`, and `src/scenes/bandwidth-poe.js`
- [ ] T085 [US3] Add `tests/content/palette.test.mjs` asserting the hex values in `src/stage/palette.js` equal the `--gen-*` values parsed from `src/styles/tokens.css`
- [ ] T086 [US3] Run `npm test` and `npx playwright test tests/e2e/comparison.spec.js`; fix failures

**Checkpoint**: Every feature tab demonstrates Wi-Fi 7's improvement against earlier generations.

---

## Phase 6: User Story 4 - Connect each feature to a healthcare scenario (Priority: P2)

**Goal**: Named healthcare scenarios with device types on every feature tab; no outcome or
compliance guarantees

**Independent Test**: For each feature tab, a reviewer finds the scenario, devices and supported
outcome; validator rule 8 reports no guarantee phrases

### Tests for User Story 4

- [ ] T087 [P] [US4] Create `tests/e2e/scenario.spec.js`: each feature tab (2–9) shows a `#scenario` card with location, device-type list and supported outcome; the device types also appear in the tab's problem beat text

### Implementation for User Story 4

- [ ] T088 [US4] Fill `content/scenarios.json` with ≥ 1 composite scenario per feature tab (fields `id`, `location`, `deviceTypes` — generic only, e.g., "voice badge", "infusion pump", "telemetry monitor", "RTLS tag", "mobile workstation", "imaging cart", "telehealth cart" — `problem`, `outcomeSupported` phrased as enabling/supporting), e.g., `voice-badge-hallway`, `imaging-transfer-6ghz`, `interference-near-equipment`, `shared-passphrase-risk`, `badge-battery-shift`, `ed-shift-change`, `telemetry-alarm-delay`, `new-wing-closet-planning`; set each feature tab's `scenarioIds` in `content/tabs/02…09-*.json`
- [ ] T089 [US4] Create `src/app/scenario.js` rendering the tab's scenarios into `#scenario` (location heading, device list, problem, "What this supports" outcome) and wire it into `src/main.js`
- [ ] T090 [US4] Extend `tests/content/validate.test.mjs` so release mode treats any rule-8 guarantee-phrase warning in scenarios or beats as a failure, and fix any hits in content
- [ ] T091 [US4] Story-gate copy review: read every beat and scenario for outcome/compliance overclaims, jargon defined at first use, and plain-language-first ordering; record findings and fixes in `specs/001-wifi7-healthcare-explainer/checklists/story-gate.md`

**Checkpoint**: Healthcare relevance is explicit on every feature tab and free of overclaims.

---

## Phase 7: User Story 5 - Use the page on limited hardware or with accessibility needs (Priority: P2)

**Goal**: Reduced motion, WebGL fallback, screen-reader descriptions, WCAG 2.2 AA, responsive, and
performance targets

**Independent Test**: With WebGL disabled and with reduced motion enabled, every tab's full story is
available; axe reports zero violations; keyboard-only completes every tab (quickstart V9–V13)

### Tests for User Story 5

- [ ] T092 [P] [US5] Create `tests/e2e/a11y.spec.js`: run `@axe-core/playwright` with tags `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa` on every tab in light and dark themes (expect zero violations); keyboard-only walkthrough reaches every control on every tab; `#scene-description` updates on each beat
- [ ] T093 [P] [US5] Create `tests/e2e/resilience.spec.js`: with `reducedMotion: 'reduce'` no auto-play occurs and scene transitions settle within one frame; in a Chromium project launched with `--disable-webgl` every tab shows `dist/fallback/<tab>/<beat>-<gen>.webp` images with alt text = `sceneDescription` and a notice; simulated `webglcontextlost` switches the current tab to the fallback without losing tab/beat; hiding the page stops the render loop; viewports 360×740, 768×1024, 1920×1080, 3840×2160 have no horizontal scroll
- [ ] T094 [P] [US5] Create `tests/e2e/performance.spec.js`: in Chromium, sample `requestAnimationFrame` intervals for 5 s during each tab's busiest beat and assert median ≤ 16.7 ms on the dev machine (log, don't fail, on CI without a GPU); assert time from navigation to first beat text visible < 3 s

### Implementation for User Story 5

- [ ] T095 [US5] Add theme and motion toggles to the header in `src/app/preferences.js` and `src/main.js`: motion toggle sets `setMotion()` on `src/stage/tween.js`, passes `ctx.motion` to new scenes, and stops auto-play; theme toggle sets `data-theme`
- [ ] T096 [US5] Create `scripts/snapshots.mjs`: launch Playwright Chromium on `dist/index.html?test`, for every tab with a scene and every beat (and each `DeepSection.sceneState`) render the end state for `defaultCompare` and `wifi7` with `animate: false`, screenshot only `#stage`, and write WebP files to `dist/fallback/<tabId>/<beatIndex>-<genId>.webp` (and `<sectionId>-<genId>.webp`); keep each image ≤ 150 KB
- [ ] T097 [US5] Create `src/stage/fallback.js`: when `webglAvailable()` is false or `webglcontextlost` fires, replace the canvas with an `<img>` for the current tab/beat/generation (alt = `sceneDescription`), update it on beat/generation change, and show a one-line notice "3D view isn't available in this browser — showing still images instead"; wire it into `src/stage/renderer.js` and `src/app/story.js`
- [ ] T098 [US5] Add the "Keyboard shortcuts" dialog (opened by `?` and the header button) listing the full key map from contracts/ui-navigation.md, in `src/app/shortcuts.js`, with focus trapping and Escape to close
- [ ] T099 [US5] Responsive and contrast pass in `src/styles/layout.css` and `src/styles/tokens.css`: verify the 360 px layout, touch targets ≥ 24×24 px, and add `resize(width, height)` to scenes that need portrait framing (`src/scenes/*.js`)
- [ ] T100 [US5] Run `npm run build` (with snapshots) and `npx playwright test tests/e2e/a11y.spec.js tests/e2e/resilience.spec.js tests/e2e/performance.spec.js`; fix failures

**Checkpoint**: The whole story reaches viewers on any hardware or assistive setup.

---

## Phase 8: User Story 8 - Get the right depth for a leadership or technical audience (Priority: P2)

**Goal**: One story with a Leadership | Technical view switch (research R13)

**Independent Test**: On any feature tab, switch views; beat, scene and position stay the same while
Bottom line, Under the hood, deep sections and figures change; the view survives reload and a
shared link (quickstart V18)

### Tests for User Story 8

- [ ] T101 [P] [US8] Create `tests/e2e/audience.spec.js`: a fresh profile opens in Leadership view (`<html data-view="leadership">`) with each feature-tab beat showing a "Bottom line" callout, `deepDive` and section `<details>` collapsed, and only `headline` figures plus a "Show all figures" button; `V` and the Audience radio group switch to Technical, where `<details>` are open and all figures show; the scene state, tab and beat are unchanged across switches (`window.__stage.state`); `?view=technical` in the URL wins over the stored preference; the choice persists after reload; switching works in presentation mode without changing position; the change is announced in a live region

### Implementation for User Story 8

- [ ] T102 [US8] Create `src/app/view.js`: render the "Audience" radio group (`role="radiogroup"`, options Leadership/Technical) in the header; resolve the initial view from the URL `view` param, then the stored preference, then `leadership`; set `data-view` on `<html>`; on change update preferences, the router's `view` param (`replaceState`), open all `deepDive`/section `<details>` in Technical and close those not opened by the viewer in Leadership; handle the `V` key; announce "Leadership view" / "Technical view"; never re-mount the scene; wire into `src/main.js` and add `view` to `src/app/router.js` parse/serialize
- [ ] T103 [US8] Render each beat's `bottomLine` in `src/app/story.js` as a "Bottom line" callout below the body (`renderMarkup`, citations allowed); add styles in `src/styles/layout.css`: prominent in `[data-view="leadership"]`, de-emphasized in `[data-view="technical"]`, and a visible "Leadership view" / "Technical view" label near the progress text
- [ ] T104 [US8] In `src/app/figures.js`, show only `headline: true` figures when `data-view="leadership"` with a "Show all figures (n)" toggle button (`aria-expanded`), and all figures in Technical view; the toggle resets on tab change
- [ ] T105 [US8] Leadership-layer content pass over `content/tabs/02…09-*.json`: every `bottomLine` states an impact, risk, cost or planning implication in ≤ 40 words without undefined jargon or guarantee wording; every `how`/`improvement` `deepDive` adds real protocol depth (frame/field names, modes, numbers with citations) rather than repeating the body; 2–3 `headline` figures per tab; run `npm run validate` (rule 11) and record the review in `specs/001-wifi7-healthcare-explainer/checklists/story-gate.md`
- [ ] T106 [US8] Run `npx playwright test tests/e2e/audience.spec.js`; fix failures

**Checkpoint**: Leaders and engineers each get the right depth from the same story.

---

## Phase 9: User Story 9 - Trust the site and its repository (Priority: P2)

**Goal**: Verified CSP and content safety on every tab from `file://` and HTTP, documented hosting
headers, and proven merge protection

**Independent Test**: Zero CSP violations and zero network requests on every tab in three browsers
from both origins; a direct push to `main` is rejected; a PR with a failing check cannot merge
(quickstart V19, V20)

### Tests for User Story 9

- [ ] T107 [P] [US9] Create `tests/e2e/static-server.mjs` (Node `http` + `fs` only, no dependencies; serves `dist/` on a free port with the response headers from `docs/hosting-security.md`, including the CSP header) exporting `start()`/`stop()`
- [ ] T108 [P] [US9] Create `tests/e2e/security.spec.js`: for every tab and every beat, from `fileUrl()` and from the static server, assert `trackCspViolations()` reports zero violations, `guardOffline` records zero non-local requests, and no console errors; assert `document.querySelectorAll('script')` contains only `app.js`; assert every `a[target="_blank"]` has `rel` containing `noopener` and `noreferrer`; assert `localStorage` contains only the preferences key after exercising theme, motion and view

### Implementation for User Story 9

- [ ] T109 [P] [US9] Create `docs/hosting-security.md`: recommended HTTP response headers for static hosting — the R12 CSP plus `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, `Permissions-Policy` disabling camera, microphone, geolocation, payment, usb and similar, `Cross-Origin-Opener-Policy: same-origin`, and HSTS when served over HTTPS — with example snippets for IIS (`web.config`), nginx and Apache, and a note that the site needs no server-side code, cookies or write access
- [ ] T110 [US9] Run `npx playwright test tests/e2e/security.spec.js` across chromium, firefox and webkit; if any browser reports `'self'` violations for `file://` resources, apply the research.md R12 fallback (`file:` scheme source on only the affected directives) in `src/index.html` and `tests/content/security.test.mjs`, re-run, and record the outcome under R12 in `specs/001-wifi7-healthcare-explainer/research.md`
- [ ] T111 [US9] Verify merge protection (quickstart V20): attempt `git push origin HEAD:main` from a scratch branch (expect rejection by the ruleset), and open a throwaway PR containing a deliberately failing test (expect merge blocked), then close it and delete its branch; record results in `specs/001-wifi7-healthcare-explainer/checklists/security-gate.md`

**Checkpoint**: The site passes a security review and the repository enforces its merge gate.

---

## Phase 10: User Story 7 - Validate every figure and its sources, and host the site later (Priority: P2)

**Goal**: Viewer-facing provenance for every figure, the source policy and claims register on the
References tab, a generated auditor report, scheduled link checks, a completed accuracy gate, and
unchanged behavior on a static host

**Independent Test**: For five random figures the provenance panel names a Tier 1 source with a
location and derivation that an independent reviewer can reproduce; breaking a derivation input
fails validation; `dist/` served over HTTP behaves the same as from `file://` (quickstart V3,
V15, V21, V22)

### Tests for User Story 7

- [ ] T112 [P] [US7] Create `tests/e2e/hosted.spec.js` (using `tests/e2e/static-server.mjs` from US9; if US9 is not done yet, create that server first as specified in its task) that re-runs the navigation, deep-link and offline checks over `http://localhost:<port>/`
- [ ] T113 [P] [US7] Create `tests/e2e/provenance.spec.js`: on every feature tab, every `.cite` button and every key-figure value opens a `role="dialog"` provenance panel showing the claim statement, method badge, ≥ 1 source with publisher, tier, location and an external link with `rel="noopener noreferrer"`, the derivation (formula in words and each input with its value) for derived claims, and a verification line; Leadership view opens the short form with a "How we know this" expander, Technical view the full form; Escape closes and restores focus; "In the claims register" opens `#/references?claim=<id>` with that row highlighted; the References tab shows the source policy, lists every reference grouped by publisher with tier and access, the claims register filters by tab, and the glossary links to the tabs where each term appears

### Implementation for User Story 7

- [ ] T114 [US7] Create `src/app/provenance.js` per contracts/ui-navigation.md "Provenance panel": delegated click/Enter handling on `.cite` buttons and key-figure value buttons; an accessible dialog built with DOM APIs and `textContent` (no `innerHTML`); method badges "Stated in source" / "Derived" / "Illustrative"; sources with tier labels ("Tier 1: standards body / regulator", "Tier 2: peer-reviewed / health authority"), locator, excerpt, access, and external link (`target="_blank" rel="noopener noreferrer"`); derivation rendered as words plus each input claim's value and source; "Verified <date> by <initials/role>" or "Not yet verified"; short form in Leadership view with a "How we know this" disclosure, full form in Technical view; wire into `src/main.js` and make key-figure values in `src/app/figures.js` buttons with `data-claim`
- [ ] T115 [US7] Fill `content/tabs/11-references.json` (remove `draft`; plain-language intro: why only standards bodies, regulators and peer-reviewed sources are used; what "theoretical", "typical", "derived" and "illustrative" mean; how figures are verified and how often) and create `src/app/references.js` rendering, in order: the source policy from `content/source-policy.json` (tiers, allowlisted publishers, excluded categories); the references list grouped by publisher (identifier, edition, date, tier, access, status, external link with `rel="noopener noreferrer"`); the claims register (statement, value, method, sources, verified date) with a filter by tab and highlight via the router's `claim` param; and the glossary (alphabetical, linking to tabs via derived `termTabs`); handle the router's `ref` and `claim` params to scroll and highlight; wire into `src/main.js`
- [ ] T116 [P] [US7] Create `scripts/check-links.mjs` (Node built-ins only: for each Reference `url`, HEAD then GET on 405, 15 s timeout, 2xx/3xx healthy, polite 1 s spacing, custom user agent naming the project) and `.github/workflows/link-check.yml` (weekly `schedule` + `workflow_dispatch`, `permissions: contents: read, issues: write`, actions pinned to commit SHAs) that opens or updates a single issue titled "Broken reference links" listing failures, and closes it when all links pass; not a required merge check
- [ ] T117 [US7] Generate and commit `docs/provenance-report.md` with `npm run provenance` and confirm the CI `validate` job's `--check` passes on the pull request
- [ ] T118 [US7] Accuracy gate (manual, quickstart V15): for every claim in `content/claims.json` — starting with the ⚠ items in research.md R11 and the R16 derivation inputs — open the cited source at the recorded locator, confirm the value and wording, tighten the `locator` to the exact clause/table/page, add a short `excerpt` where licensing allows, fix content where the source disagrees, and set `verification.verifiedOn` (YYYY-MM-DD) and `verifiedBy` (initials or role); a claim whose Tier 1 text can't be accessed stays unverified (never substitute a lower tier); record what was checked in `specs/001-wifi7-healthcare-explainer/checklists/accuracy-gate.md`; then regenerate `docs/provenance-report.md`
- [ ] T119 [US7] Independent spot check (quickstart V22, SC-014): a second reviewer with access to the sources picks 10 random figures and reproduces each using only the provenance panel; record results and any corrections in `specs/001-wifi7-healthcare-explainer/checklists/accuracy-gate.md`
- [ ] T120 [US7] Run `npm run validate -- --release` (no drafts, no orphan references or claims, every claim verified within 365 days) and `npx playwright test tests/e2e/hosted.spec.js tests/e2e/provenance.spec.js`; fix failures

**Checkpoint**: Every figure is traceable to a reputable source and reproducible, and the site is
ready to host.

---

## Phase 11: User Story 6 - Present the story live to a group (Priority: P3)

**Goal**: Presentation mode with fullscreen, large text, clicker keys and blanking, without losing
position

**Independent Test**: Press `P`, walk from Overview to the last tab using only PageDown/PageUp/
arrows/Space, blank with `B`, exit with Escape — position is unchanged (quickstart V8)

### Tests for User Story 6

- [ ] T121 [P] [US6] Create `tests/e2e/presentation.spec.js`: `P` and the header button toggle `data-present` on `<html>` and request fullscreen; PageDown/ArrowRight/Space advance beats and cross into the next tab after a tab's last beat; PageUp/ArrowLeft go back across tab boundaries to the previous tab's last beat; `B` and `.` blank/unblank the stage; Escape exits fullscreen keeping tab and beat; opening `#/mlo/2?present` shows the "Start presenting" prompt and keeps position; body text font size in presentation mode is ≥ 1.5× normal

### Implementation for User Story 6

- [ ] T122 [US6] Create `src/app/presentation.js`: toggle via `P` and the "Present" button; `document.documentElement.requestFullscreen()` with graceful handling if refused; set `data-present` and the router's `present` flag; cross-tab next/previous beat navigation; `B`/`.` blanking overlay; Escape / `fullscreenchange` exit keeps `{ tabId, beatIndex }`; a "Start presenting" prompt when the URL has `present` but no user gesture has happened yet; wire into `src/main.js`
- [ ] T123 [P] [US6] Create `src/styles/present.css`: under `[data-present]` scale the type ramp ~1.5×, enlarge the stage, hide secondary chrome (theme/motion toggles, deep-dive panels collapsed), keep progress and generation labels visible, high-contrast blank overlay
- [ ] T124 [US6] Run `npx playwright test tests/e2e/presentation.spec.js`; fix failures

**Checkpoint**: The explainer can be presented live with a clicker.

---



## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Release readiness against the constitution's quality gates

- [ ] T125 [P] Create `README.md` at the repository root: what the site is, how viewers open `dist/index.html` by double-click or host it (linking `docs/hosting-security.md`), the Leadership/Technical view, the PR-only merge flow and required checks, `SECURITY.md`, and the developer commands from specs/001-wifi7-healthcare-explainer/quickstart.md
- [ ] T126 Performance pass across `src/scenes/*.js`: confirm each scene stays ≤ 150 draw calls and ≤ 200k triangles (log `renderer.info` in `?test` mode), uses `InstancedMesh` for > 50 identical objects, and that `dispose()` returns `renderer.info.memory` to baseline after visiting all tabs
- [ ] T127 Confirm the `dist/app.js` gzip size check in `scripts/build.mjs` passes (≤ 500 KB) and that `dist/` contains only `index.html`, `app.js`, `app.js.map`, CSS files and `fallback/`
- [ ] T128 Neutrality gate (quickstart V14): run `npm test` (denylist over content and built `dist/`) and visually scan every tab and fallback image for vendor names, logos or product imagery; record the result in `specs/001-wifi7-healthcare-explainer/checklists/accuracy-gate.md`
- [ ] T129 Security gate (constitution VIII): `npm audit --audit-level=high` clean; no open CodeQL, Dependabot or secret-scanning alerts (`gh api repos/timbertino1/Wi-Fi_Comparison/code-scanning/alerts?state=open`, `…/dependabot/alerts?state=open`, `…/secret-scanning/alerts?state=open`); `tests/e2e/security.spec.js` green in all browsers; record results in `specs/001-wifi7-healthcare-explainer/checklists/security-gate.md`
- [ ] T130 Run the full suite: `npm test`, `npm run build`, `npm run test:e2e` across Chromium, Firefox and WebKit; fix any failures; confirm the same checks are green on the pull request
- [ ] T131 Run the full quickstart.md validation table V1–V22 and tick the release checklist in `specs/001-wifi7-healthcare-explainer/quickstart.md`; zip `dist/`, unzip on a second machine and repeat V1
- [ ] T132 Plan the comprehension review (quickstart V17, SC-002, SC-010): write a 5-question script (MLO, 6 GHz, TWT, 4K-QAM, one improvement over Wi-Fi 6) plus a "depth was too shallow / about right / too deep" rating in `specs/001-wifi7-healthcare-explainer/checklists/comprehension-review.md`, for ≥ 5 reviewers — leaders using Leadership view, engineers using Technical view

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)** → no dependencies. T006–T010 (CI, CodeQL, Dependabot, CODEOWNERS, repository security settings) come first so every later commit is checked
- **Foundational (Phase 2)** → depends on Setup; blocks all stories. Ends with T043: open the PR and protect `main` with the ruleset once the check names exist
- **US1 (Phase 3)** → depends on Foundational; it provides `router.js`, `tabs.js`, `story.js`, which later stories build on
- **US2 (Phase 4)** → depends on US1 (`story.js`, scene mounting)
- **US3 (Phase 5)** → depends on US2 scenes existing (adds `setGeneration` and figures to them)
- **US4 (Phase 6)** → depends on US1; content edits are easier after US2's tab content exists
- **US5 (Phase 7)** → depends on US1; the snapshot step (T096) needs the US2 scenes to capture
- **US8 (Phase 8)** → depends on US2 (beats with `bottomLine`/`deepDive`) and US3 (`figures.js`, headline flags)
- **US9 (Phase 9)** → depends on US1; run its security spec again after every later story (it covers all tabs)
- **US7 (Phase 10)** → depends on US1 and US3 (figures); reuses US9's static server; the accuracy gate needs US2/US3 content and claims
- **US6 (Phase 11)** → depends on US1 and US2's controls (T054)
- **Polish (Phase 12)** → after all chosen stories

### Story dependency graph

```text
Setup (CI + security settings) → Foundational (→ PR + ruleset on main) → US1 ─┬─> US2 ─┬─> US3 ──> US8
                                                                               │        ├─> US5 (snapshots)
                                                                               │        └─> US6
                                                                               ├─> US4
                                                                               ├─> US9 (security; re-run after each story)
                                                                               └─> US7 ──(accuracy gate after US2/US3)
                                                                                             ↓
                                                                                          Polish
```

### Within each story

- Write the story's E2E spec first and confirm it fails, then implement
- Content JSON for a tab before or alongside its scene; scene `states` must match the content's `sceneState` values (validator rule 4)
- Story complete, its spec green locally and on the pull request, before moving on

## Parallel Opportunities

- Setup: T003, T004, T006–T009 in parallel after T002
- Foundational: T011–T018, T021–T024, T026–T029, T031–T035, T041, T042 in parallel; then T019, T025, T030, T036–T040; T043 last
- US1: T044 and T050 in parallel with T045–T049
- US2: all scene tasks (T059, T061, T063, T065, T067, T069, T071, T073, T075) in parallel once each tab's content task has defined its `sceneState` names; content tasks (T058, T060, T062, T064, T066, T068, T070, T072, T074) run one after another because they append to `content/glossary.json` and `content/references.json`
- US3: T082, T083, T084 in parallel
- US9: T107, T108, T109 in parallel
- US4, US5, US6 and US9 can proceed in parallel after US2; US7 and US8 after US3
- US7: T112, T113 and T116 in parallel

## Parallel Example: User Story 2

```text
# After T058 (MLO content) and T060 (6 GHz content) define their scene states:
Task: "Create src/scenes/mlo.js ..."                (T059)
Task: "Create src/scenes/spectrum.js ..."           (T061)

# After T062–T074 content tasks are written in sequence:
Task: "Create src/scenes/qam-puncturing.js ..."     (T063)
Task: "Create src/scenes/security.js ..."           (T065)
Task: "Create src/scenes/twt.js ..."                (T067)
Task: "Create src/scenes/density.js ..."            (T069)
Task: "Create src/scenes/latency.js ..."            (T071)
Task: "Create src/scenes/bandwidth-poe.js ..."      (T073)
Task: "Create src/scenes/wifi8.js ..."              (T075)
```

## Implementation Strategy

### MVP first

1. Phase 1 Setup (including CI and repository security settings) → Phase 2 Foundational
   (including the source policy, claims register, derivations and provenance report; ending with
   the PR and the `main` ruleset)
2. Phase 3 US1 (Overview + navigation)
3. From US2: the engine (T053–T057) and the MLO tab (T058–T059) only — with `bottomLine` and
   `deepDive` written from the start so US8 needs no rework
4. **Stop and validate**: double-click `dist/index.html`, walk Overview → MLO with full controls.
   This matches the spec's smallest useful product: Overview + navigation + one feature tab.

### Incremental delivery

1. MVP above → demo
2. Remaining US2 tabs → every feature has its story
3. US3 → generation comparisons and key figures
4. US4 → healthcare scenario cards and copy review
5. US5 → accessibility, fallback, performance
6. US8 → Leadership / Technical views
7. US9 → CSP verification, hosting headers, merge-protection proof
8. US7 → provenance panel, source policy and claims register, auditor report, link checks,
   accuracy gate and independent spot check, hosting check
9. US6 → presentation mode
10. Polish → release gates (accuracy and provenance, neutrality, story, accessibility/performance, security, merge), zip `dist/`

## Notes

- [P] tasks = different files, no dependency on unfinished tasks
- Commit after each task or logical group, on the feature branch; merge to `main` only by pull request with green checks
- Never edit `dist/` by hand; it is rebuilt from `src/` and `content/`
- Each checkpoint is a safe place to stop and demo
