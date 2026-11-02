# Tasks: Refocused, Simpler Wi-Fi 7 Talk for a Cisco Session

**Input**: Design documents from `specs/003-cisco-refocus/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: The project's practice is that every validator rule has a unit test in
`tests/content/validate.test.mjs`, and that e2e counts follow content. Those tests are included.

**Format**: `[ID] [P?] [Story] Description`. `[P]` = can run in parallel (different files, no
unfinished dependency).

**Conventions** (apply to every content task):
- Captions: headline ≤ 8 words, takeaway ≤ 16 words; jargon defined on screen (rule 23).
- Every number cites a `{{claim}}` in the same sentence (rule 17).
- American English; healthcare framing; plain language.
- After content edits run `node scripts/validate-content.mjs` (draft) and fix errors before moving on.

---

## Phase 1: Setup (Governance)

**Purpose**: Make the new scope legal under the project rules before any content changes.

- [X] T001 Amend `.specify/memory/constitution.md` to 4.0.0 (MAJOR), with a Sync Impact Report at the top:
  - **Principle I:** allow Cisco public-facing documentation (open on `www.cisco.com` / `documentation.meraki.com` without login) as a source for platform claims and as a second source for technical claims. Allow naming Cisco platform features. Forbid Cisco hardware models, model numbers, SKUs, marketing or comparative claims, and every other vendor.
  - **Principle II:** the technical layer is no longer shown; plain language plus citations.
  - **Required feature coverage:** 1. new spectrum (6 GHz and 320 MHz), 2. data rates, 3. MLO, 4. TWT, 5. security.
  - **Version line:** `**Version**: 4.0.0 | **Ratified**: 2026-10-26 | **Last Amended**: <date>`.
- [X] T002 Add a "Superseded by 003" note under FR-010, FR-020 and FR-028 in `specs/002-presentation-first-redesign/spec.md`, pointing to `specs/003-cisco-refocus/spec.md`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Source policy, validator and renderer changes that every story depends on.

**⚠️ CRITICAL**: No user-story work can begin until this phase is complete.

- [X] T003 Add a `cisco` publisher to `content/source-policy.json`:
  - Fields: `"id": "cisco"`, `"name": "Cisco public documentation"`, `"tier": "cisco"`.
  - Domains: `cisco.com`, `www.cisco.com`, `documentation.meraki.com`.
  - Use: "Cisco platform features and deployment guidance; never the only source for a standards figure".
  - Also add top-level `"platformKindTier": "cisco"`.
- [X] T004 Update rule 13 in `scripts/validate-content.mjs`:
  - Accept tier `"cisco"` for publisher `cisco`.
  - Require `access: "open"` plus non-empty `edition` and `checkedOn` on `cisco` references.
- [X] T005 Update rules 14 and 15 (claims) in `scripts/validate-content.mjs`:
  - Add claim kind `platform`.
  - Rule 14a: `technical` claims need ≥ 1 Tier 1 source; Cisco may be an extra source.
  - Rule 14b: `platform` claims need ≥ 1 `cisco` source.
  - `context` claims: unchanged.
- [X] T006 [P] Remove the `Cisco` and `Meraki` lines from `tests/content/denylist.txt`, keeping all other vendors. Update the file header comment to cite constitution 4.0.0.
- [X] T007 [P] Create `tests/content/model-patterns.txt`: one case-insensitive regex per line for Cisco hardware model names and numbers, with a header comment. Cover at least:
  - `\bCW9\d{3}[A-Z]*\b`, `\bC9\d{3}[A-Z-]*\b`, `\bCatalyst\s+9\d{2,3}\w*\b`, `\b9800(-\w+)?\b`
  - `\bMR\s?\d{2,3}\b` (Meraki model and firmware), `\bIOS[ -]XE\s+\d+(\.\d+)*\b`
- [X] T008 Add rule 7a to `scripts/validate-content.mjs`:
  - Load `tests/content/model-patterns.txt` with a `loadModelPatterns()` next to `loadDenylist()`.
  - Error on any match in audience-visible strings: tabs, scenarios, glossary, generations, claim `statement`.
  - Exempt reference fields (`title`, `edition`, `url`) and claim `sources[].location` / `excerpt`.
- [X] T009 Change rule 11 in `scripts/validate-content.mjs`:
  - Drop the `deepDive` requirement.
  - Error if a beat has `deepDive`, `caption.technical`, or any `hotspots[].technical`, or a `sections[]` entry marked technical.
- [X] T010 Change rule 3 and the tab count in `scripts/validate-content.mjs`:
  - Feature chapters need 2–4 steps (replacing "at least 3"), still covering the arc via `type` + `covers`.
  - Exactly 8 tabs: `if (tabs.length !== 8)`.
  - Rule 2: `compareGenerations` MUST NOT include `wifi5` (or older) on feature chapters.
  - Key figures: ≤ 3 per chapter.
- [X] T011 Add unit tests in `tests/content/validate.test.mjs` for T004, T005 and T007–T010. Each test is one passing fixture and one failing fixture:
  - A Cisco reference without `access: "open"`.
  - A `technical` claim sourced only to Cisco.
  - A `platform` claim without a Cisco source.
  - A model number in a caption.
  - A `deepDive` field.
  - A feature chapter with 5 steps.
  - `compareGenerations` containing `wifi5`.
  - Four key figures.
- [X] T012 [P] Remove the technical caption line from `src/app/caption.js` (delete the `caption.technical` branch and its comment) and the `.caption-technical` styles in `src/styles/*.css`.
- [X] T013 [P] Remove hotspot technical lines from `src/app/hotspots.js`: the `h.technical` render branch and the `depth`/`getView()` gating, so every hotspot shows for everyone.
- [X] T014 [P] Remove deep-dive rendering from `src/app/story.js`: the `beat.deepDive` block and the "technical layer is always shown" section logic. Keep plain sections.
- [X] T015 [P] Remove the technical-only provenance details from `src/app/provenance.js` (the `technical` branch near line 127), keeping source, location and method for everyone. Simplify `src/app/view.js` to a single plain view, or delete it and its imports if nothing else needs it.
- [X] T016 Update `scripts/talk-track.mjs`:
  - Stop emitting "Technical depth" lines and the caption technical line.
  - Emit a "Since Wi-Fi 6" block per feature chapter from `sinceWifi6` (when present).
  - Emit a "Cisco" line per step from `cisco` (when present).
  - Tag likely questions with `followUp: true` as "(follow-up topic)".
- [X] T017 Add a "Cisco public documentation" group to `src/app/references.js`, after Tier 1 and before Tier 2, with the heading text "Cisco public documentation — platform features and deployment guidance".

**Checkpoint**: The validator enforces the new rules (draft validation may fail on old content until US1). `npm test` passes on the new unit tests.

---

## Phase 3: User Story 1 - Deliver a shorter, simpler talk from the clicker (Priority: P1) 🎯 MVP

**Goal**: Seven chapters on the clicker path, about 3 plain steps per feature chapter, no technical depth anywhere.

**Independent Test**: Click from the first step to the end of the closing chapter. You see chapters in the order intro, spectrum, data rates, MLO, TWT, security, closing; feature chapters have 2–4 steps; no technical-depth text appears; the Density, Latency and 4K-QAM chapters are absent from the menu.

### Removal and renumbering

- [X] T018 [US1] Delete `content/tabs/06-density.json`, `content/tabs/07-latency.json`, `src/scenes/density.js` and `src/scenes/latency.js` with `git rm`. Remove their imports and registration from `src/main.js` and `src/app/content.js`.
- [X] T019 [US1] Remove scenarios used only by Density or Latency from `content/scenarios.json`, then delete the claims that rule 18 now reports as unused from `content/claims.json`. Keep any claim still cited elsewhere. Retire references that become uncited by setting `"retired": true` in `content/references.json`; don't delete them, so the S-numbers stay stable.
- [X] T020 [US1] Renumber the tab files with `git mv`, setting each tab's `order` to its file number:
  - `04-security.json` → `06-security.json` (first, to free number 04)
  - `03-mlo.json` → `04-mlo.json`
  - `05-twt.json` stays
  - `08-closing.json` → `07-closing.json`
  - `09-references.json` → `08-references.json`
  - Update `src/app/content.js` imports to match.
- [X] T021 [P] [US1] Update chapter-count expectations in tests:
  - `tests/e2e/hosted.spec.js`: `toHaveCount(8)`.
  - Any e2e spec that names `density`, `latency` or their states (search `tests/e2e/` for those names).

### Data Rates chapter (new)

- [X] T022 [US1] Create `src/scenes/rates.js` on the highway kit (`src/stage/kit/traffic.js`), following the scene-module contract in `specs/002-presentation-first-redesign/contracts/scene-module.md`, with `anchors()`, `shots.wide`, stills and an access point visible at the end. States:
  - `rates-demand`: imaging-study trucks queue on a road.
  - `rates-reasons`: three changes appear one after another, labeled "Wider lanes", "Fuller trucks" and "More roads at once".
  - `rates-compare`: a Wi-Fi 6/6E road beside a Wi-Fi 7 road, with peak labels drawn from content.
  - `gen-compare`: switch-driven, `wifi6`/`wifi6e`/`wifi7`.
  - Register it in `src/main.js`.
- [X] T023 [US1] Create `content/tabs/03-data-rates.json`: `kind: "feature"`, `order: 3`, title "Faster Data Rates", `introducedIn: "wifi7"`, `compareGenerations: ["wifi6", "wifi6e", "wifi7"]`. Include an `opener` (rule 25) and 3 beats:
  1. Type `problem`, covers `why`: imaging studies and busy shifts need speed and headroom.
  2. Type `what`, covers `how`: three plain reasons, citing `eht-max-width`, `width-320-vs-160`, `eht-4096qam-bits` and `mlo-bands`.
  3. Type `improvement`: peak rates `wifi6-peak-phy` (Wi-Fi 6 and 6E) and `wifi7-peak-phy` (Wi-Fi 7, per link), marked theoretical.
  - Key figures (≤ 3): peak rate, max channel width, bits per symbol.
  - No `deepDive` and no `caption.technical`.
- [X] T024 [US1] Add glossary terms the Data Rates captions need ("peak data rate", "QAM" in plain words) to `content/glossary.json`, unless they already exist.

### Rewrite the other chapters to plain, short steps

- [X] T025 [P] [US1] Rewrite `content/tabs/02-6ghz-320mhz.json` to 3 beats:
  1. Crowded older bands.
  2. 6 GHz opened with Wi-Fi 6E, plus availability by region.
  3. 320 MHz with Wi-Fi 7, plus planning reality.
  - `compareGenerations: ["wifi6e", "wifi7"]`. Delete every `deepDive`, `caption.technical` and hotspot `technical`; ≤ 3 key figures.
  - Remove `src/scenes/spectrum.js` states no beat uses, and any Wi-Fi 5 compare branch.
- [X] T026 [P] [US1] Rewrite `content/tabs/04-mlo.json` to 3 beats:
  1. One busy band.
  2. Several links at once, new in Wi-Fi 7.
  3. Clinical benefit (voice and imaging don't wait).
  - `compareGenerations: ["wifi6e", "wifi7"]`, depth fields removed, ≤ 3 key figures.
  - Keep the ready/busy and traffic labels in `src/scenes/mlo.js`; drop the MLO-modes section and its `mlo-modes` scene drive unless a beat still uses it.
- [X] T027 [P] [US1] Rewrite `content/tabs/05-twt.json` to 3 beats:
  1. Always listening, dead by mid-shift.
  2. TWT schedules sleep (Wi-Fi 6).
  3. Optional Restricted TWT protects time-sensitive traffic (Wi-Fi 7).
  - `compareGenerations: ["wifi6", "wifi7"]`, depth fields removed. Trim unused states in `src/scenes/twt.js`.
- [X] T028 [P] [US1] Rewrite `content/tabs/06-security.json` to 3 beats:
  1. WPA2 risks; WPA3 required since Wi-Fi 6.
  2. 6 GHz with Wi-Fi 6E: WPA3 or Enhanced Open, PMF, no legacy.
  3. Wi-Fi 7: WPA3 needed for MLO and full speed; older devices use a separate network.
  - `compareGenerations: ["wifi6", "wifi6e", "wifi7"]`, depth fields removed. Trim unused states in `src/scenes/security.js`.
- [X] T029 [US1] Update `content/tabs/01-overview.json`:
  - Remove technical depth and move the peak-rate figures out (they live in Data Rates).
  - Keep 3–4 beats.
  - Its roadmap step lists the five features in the new order.
- [X] T030 [US1] Update `content/tabs/07-closing.json`:
  - The recap covers the five benefits in order.
  - A final beat lists the follow-up topics from `contracts/chapter-lineup.md`: 6 GHz design and AFC standard power; MLO client readiness; WPA3 migration for clinical devices; battery-powered device planning; capacity planning for imaging and peak density.
  - The `opener.problem` reads "Five features…".
  - Update `src/scenes/overview.js` closing states if their labels name removed chapters.
- [X] T031 [US1] Remove orphaned glossary terms (used only by removed text) from `content/glossary.json`, and claims unused after T025–T030, using the rule 18 warnings. Run `node scripts/validate-content.mjs` until it shows 0 errors.
- [X] T032 [US1] Update e2e tests in `tests/e2e/` that assert step counts, captions or states changed by T025–T030:
  - `audience.spec.js` key-figure count.
  - The talk-path specs' `clickerPath()` totals.
  - Comparison specs for removed Wi-Fi 5 options.
  - Run `npx playwright test --project=chromium` and fix failures.

**Checkpoint**: The talk is 7 chapters, ≤ 22 steps, plain only; draft validation, unit tests and the Chromium suite pass.

---

## Phase 4: User Story 2 - Each chapter shows what changed since Wi-Fi 6, accurately (Priority: P1)

**Goal**: A cited Wi-Fi 6 → 6E → 7 summary per feature chapter, matching its comparison step.

**Independent Test**: For each feature chapter, read the comparison step and the "Since Wi-Fi 6" panel; every entry matches the attribution table in `research.md` R6 and cites its claim.

- [X] T033 [US2] Add rule 26 to `scripts/validate-content.mjs`, with a unit test in `tests/content/validate.test.mjs`:
  - Feature chapters MUST have `sinceWifi6` with a non-empty `wifi7` and at least one of `wifi6`/`wifi6e`.
  - Each entry contains at least one `{{claim}}`.
- [X] T034 [US2] Render `sinceWifi6` in the side panel as a three-row list ("Wi-Fi 6", "Wi-Fi 6E", "Wi-Fi 7") above the key figures. Edit `src/app/story.js` or `src/app/figures.js` (where the lineage line renders today), escape it through `renderMarkup`, and stop rendering `wifi7Adds`/`lineage` on feature chapters.
- [X] T035 [P] [US2] Add `sinceWifi6` to `content/tabs/02-6ghz-320mhz.json`:
  - `wifi6`: no 6 GHz.
  - `wifi6e`: opens 6 GHz (`wifi6e-6ghz-origin`, `wifi6e-cert-launch`).
  - `wifi7`: 320 MHz in 6 GHz (`eht-max-width`, `320mhz-6ghz-only`).
- [X] T036 [P] [US2] Add `sinceWifi6` to `content/tabs/03-data-rates.json`:
  - `wifi6`: 9.6 Gbps peak (`wifi6-peak-phy`).
  - `wifi6e`: same peak, new spectrum (`he-max-width`, `wifi6e-6ghz-origin`).
  - `wifi7`: 23.1 Gbps per link (`wifi7-peak-phy`).
- [X] T037 [P] [US2] Add `sinceWifi6` to `content/tabs/04-mlo.json`:
  - `wifi6` and `wifi6e`: one link at a time (`single-link-pre-be`).
  - `wifi7`: MLO is new (`mlo-defined-be`, `mlo-bands`).
- [X] T038 [P] [US2] Add `sinceWifi6` to `content/tabs/05-twt.json`:
  - `wifi6`: TWT introduced (`twt-wifi6`).
  - `wifi6e`: new spectrum, no TWT change (`wifi6e-cert-launch`).
  - `wifi7`: optional Restricted TWT (`rtwt-be`, `rtwt-optional`).
- [X] T039 [P] [US2] Add `sinceWifi6` to `content/tabs/06-security.json`:
  - `wifi6`: WPA3 required for certification (`wpa3-mandatory-cert`).
  - `wifi6e`: WPA3 or Enhanced Open with PMF, no legacy, in 6 GHz (`wpa3-6ghz-required`, `6ghz-security-options`, `6ghz-no-legacy`).
  - `wifi7`: WPA3 for MLO and 802.11be rates (`wpa3-mlo-required`, `wifi7-eht-security`), plus the T045 claims once added.
- [X] T040 [US2] Make each scene's `gen-compare` state reflect only `wifi6`/`wifi6e`/`wifi7`: `src/scenes/spectrum.js`, `mlo.js`, `twt.js`, `security.js` and `rates.js`. Remove Wi-Fi 5 branches. Make sure `src/app/comparison.js` builds its radios from each tab's `compareGenerations`.
- [X] T041 [US2] Add an e2e test in `tests/e2e/comparison.spec.js`: each feature chapter offers only its `compareGenerations` options, and the side panel shows the "Since Wi-Fi 6" rows.

**Checkpoint**: US1 and US2 together form a presentable, accurate talk on the existing sources.

---

## Phase 5: User Story 3 - Every fact is sourced from standards or Cisco public documentation (Priority: P1)

**Goal**: Cisco references added under the new policy, the missing Tier 1 Wi-Fi 7 security claims added, and every claim fact-checked.

**Independent Test**: `node scripts/validate-content.mjs --release` passes. `docs/provenance-report.md` shows every claim with an allowed source. Every Cisco link opens in a private window without a login.

- [X] T042 [US3] Add Cisco references to `content/references.json` (publisher `cisco`, tier `"cisco"`, `access: "open"`, `edition`, `checkedOn`), one per `research.md` R1 entry:
  - `cisco-migrate-wifi7` (Doc ID 223061, rev 10.0)
  - `cisco-9800-wifi7-ops` (IOS XE 17.18.x)
  - `meraki-wifi7-guide`
  - `cisco-afc-faq` (updated 3 Jun 2026)
  - `cisco-6e-band-ops` (tech note 220526)
  - Append them at the end so existing S-numbers don't shift.
- [X] T043 [US3] Read the Cisco Target Wake Time configuration guide: find the current release's PDF under `https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/` and extract its text with the scratchpad `pdftext.mjs`.
  - Record exactly what it says about TWT and whether it mentions Restricted TWT.
  - If it's usable, add reference `cisco-9800-twt`. If not, record "no Cisco TWT source" in `research.md` R4 and drop the TWT Cisco mention.
- [X] T044 [US3] Read the Wi-Fi 7 section of the WPA3 Specification (`wfa-wpa3-spec`, the user downloads the PDF if needed). Confirm and record exact locations for:
  - GCMP-256 for Wi-Fi 7.
  - AKM 24/25 (SAE-EXT-KEY).
  - Beacon protection.
  - PMF required.
- [X] T045 [US3] Add `technical` claims to `content/claims.json` for each requirement T044 confirms, each with its Tier 1 source and an optional `cisco-migrate-wifi7` second source. Proposed ids: `wifi7-gcmp256`, `wifi7-sae-ext-key`, `wifi7-beacon-protection`. Cite them in `content/tabs/06-security.json` beat 3 and `sinceWifi6.wifi7`.
- [X] T046 [US3] Add `platform` claims to `content/claims.json` from `research.md` R3, each with a verbatim `excerpt`, its `location` and `method: "stated"`:
  - `cisco-afc-standard-power`: AFC on both platforms; `cisco-afc-faq`.
  - `cisco-320-opt-in`: 160 MHz default, 320 MHz enabled in the 6 GHz RF profile; `cisco-9800-wifi7-ops`.
  - `cisco-320-us-sp-one`: one 320 MHz channel under US standard power; `meraki-wifi7-guide`.
  - `cisco-4kqam-close-range`: `meraki-wifi7-guide`.
  - `cisco-wpa2-no-mlo`: `cisco-migrate-wifi7`.
  - `cisco-noncompliant-downgrade`: non-compliant WLANs run as 802.11ax; `cisco-9800-wifi7-ops`.
  - `cisco-beacon-protection-auto`: `cisco-9800-wifi7-ops`.
  - `cisco-wifi7-readiness-check`: `cisco-migrate-wifi7`.
- [X] T047 [US3] Append a 003 section to `docs/fact-check.md` that re-checks every claim the talk now uses against its readable source. Record per claim: verdict, location and, for Cisco, "opens without login (checked <date>)". Fix any mismatch in `content/claims.json`.
- [ ] T048 [US3] Have the presenter sign off: set `verification.verifiedOn` / `verifiedBy` on new and changed claims in `content/claims.json` only after the presenter confirms, as in 002. Then run `node scripts/validate-content.mjs --release` and `npm run provenance`.

**Checkpoint**: Release validation passes; provenance complete.

---

## Phase 6: User Story 4 - Cisco platform features where they help the story (Priority: P2)

**Goal**: Name the R3 Cisco features in the side panel, plain and cited, with no models.

**Independent Test**: Rule 7a finds no model numbers. Each `cisco` block cites only `platform` claims. A manual read finds no promotional wording.

- [X] T049 [US4] Add rule 27 to `scripts/validate-content.mjs` (`cisco` blocks need `feature` and `text`; `text` cites only `platform` claims), with a unit test in `tests/content/validate.test.mjs`. Render `beat.cisco` in the side panel under the heading "On Cisco networks" in `src/app/story.js`, escaped through `renderMarkup`.
- [X] T050 [P] [US4] Add `cisco` blocks to `content/tabs/02-6ghz-320mhz.json`:
  - Beat 2: AFC standard power (`cisco-afc-standard-power`).
  - Beat 3: 320 MHz opt-in and one standard-power channel (`cisco-320-opt-in`, `cisco-320-us-sp-one`).
- [X] T051 [P] [US4] Add `cisco` blocks to `content/tabs/03-data-rates.json` beat 2 (`cisco-4kqam-close-range`) and `content/tabs/04-mlo.json` beat 2 or 3 (`cisco-wpa2-no-mlo`).
- [X] T052 [P] [US4] Add `cisco` blocks to `content/tabs/06-security.json` beat 3 (`cisco-noncompliant-downgrade`, `cisco-beacon-protection-auto`, `cisco-wifi7-readiness-check`). Add one to `content/tabs/05-twt.json` only if T043 found a usable source.
- [X] T053 [US4] Add an e2e check in `tests/e2e/`: the side panel shows "On Cisco networks" on the chapters above, and no audience-visible text in the built page matches `tests/content/model-patterns.txt`.

**Checkpoint**: Cisco content is in place, cited and model-free.

---

## Phase 7: User Story 5 - The talk track and editable doc follow the new scope (Priority: P2)

**Goal**: Talk track and Claude Doc match the seven-chapter talk.

**Independent Test**: `npm test` passes (it runs `talk-track --check`). The Claude Doc's chapter list and steps match `docs/talk-track.md`.

- [X] T054 [US5] Add likely questions with plain answers to each feature chapter in `content/tabs/0[2-6]-*.json`, two per chapter, at least one marked `"followUp": true` (for example "Which of our clinical devices support MLO?", "Do we need standard power?").
- [X] T055 [US5] Run `npm run talk-track` and check `docs/talk-track.md`:
  - 7 chapters plus References.
  - "Since Wi-Fi 6" and "Cisco" lines present.
  - No "Technical depth" lines.
- [X] T056 [US5] Rebuild the Claude Doc (id `c3694e81-56f6-4e28-9c67-d21ac0ac5f75`, body node `aa79d514-3fb0`):
  - Read its top-level block ids.
  - Delete the old chapter sections and insert each new chapter from `docs/talk-track.md` as markdown (≤ 64 ops per update), with a fresh "Chapter review" table per chapter.
  - Keep the "How to use this doc" section and References & Glossary in sync.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T057 [P] Update `README.md`: the chapter list, the Cisco source policy summary, and the "no hardware models" note.
- [X] T058 Run `npm run build`, then the layout audit with `FONT=Verdana` and `Segoe UI` at 1280×720 and 1920×1080 (scratchpad `audit.mjs`). Fix any caption, callout or label overlap.
- [X] T059 Run the full checks from `specs/003-cisco-refocus/quickstart.md`:
  - Release validation, `npm test` and `npx playwright test --project=chromium --workers=2`.
  - Count steps (≤ 22, SC-001).
  - Confirm 0 depth fields (SC-006) and 0 model matches (SC-005).
- [ ] T060 Hand the rehearsal checks to the presenter: timing (20–25 min, SC-002) and the non-specialist benefit test (SC-007). Record the results in `specs/003-cisco-refocus/checklists/requirements.md` notes.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (T001–T002)** → **Foundational (T003–T017)** → user stories.
- **US1 (T018–T032)**: depends on Foundational. The MVP.
- **US2 (T033–T041)**: depends on US1. It edits the rewritten tabs and the new Data Rates tab.
- **US3 (T042–T048)**: T042–T046 can start after Foundational, in parallel with US1. T045 feeds T039. T047–T048 run after US1, US2 and US4 content settles.
- **US4 (T049–T053)**: depends on T042 and T046 (platform claims) and US1 (beats exist).
- **US5 (T054–T056)**: last; the doc rebuild needs final content.
- **Polish (T057–T060)**: after all stories.

### Within stories

- T018 → T019 → T020 (files must be gone before renumbering).
- T022 (scene) before T023 (tab references scene states).
- T025–T028 parallel (different files); T031 after them.

### Parallel opportunities

- Foundational: T006, T007, T012–T015 in parallel; T004/T005/T008–T010 touch the same validator file, so run them in sequence.
- US1: T025, T026, T027, T028 in parallel; T021 alongside.
- US2: T035–T039 in parallel after T033–T034.
- US3: T043 and T044 (reading sources) in parallel with US1 work.
- US4: T050–T052 in parallel after T049.

## Parallel Example: User Story 1

```text
After T024:
  T025 Rewrite content/tabs/02-6ghz-320mhz.json
  T026 Rewrite content/tabs/04-mlo.json
  T027 Rewrite content/tabs/05-twt.json
  T028 Rewrite content/tabs/06-security.json
Then T029 → T030 → T031 → T032.
```

## Implementation Strategy

### MVP first (US1)

1. Phase 1 governance, Phase 2 foundation.
2. US1: removals, Data Rates, rewrites. Stop and click through: 7 chapters, plain, short.
3. Show the presenter for a first reaction before adding US2–US4 detail.

### Incremental delivery

1. US1 → presentable shorter talk on existing sources.
2. US2 → accurate "since Wi-Fi 6" story.
3. US3 → Cisco and Wi-Fi 7 security sources, fact-check, sign-off (needed for release).
4. US4 → Cisco mentions.
5. US5 → talk track and doc for rehearsal.

Commit, push and merge only when the presenter asks; branch creation is pre-approved.
