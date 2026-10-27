---

description: "Task list for feature 002: presentation-first redesign"
---

# Tasks: Presentation-First Redesign

**Input**: Design documents from `specs/002-presentation-first-redesign/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included. The constitution's quality gates (accuracy, story, accessibility/performance,
security) are enforced by tests, and feature 001 established tests for every story.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested
independently. Story numbers match [spec.md](./spec.md); phases follow priority (P1 stories first,
with US5 brought forward because it is P1).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story the task belongs to (US1–US7)
- Paths are relative to the repository root (single static web project, see plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Governance and guard-rails before any UI changes

- [x] T001 Amend Principle II via `/speckit-constitution` in .specify/memory/constitution.md: replace "Each feature MUST live on its own tab, and each tab MUST follow the same narrative arc" with "Each feature MUST have its own chapter (a tab or a chapter of a continuous talk), and each chapter MUST follow the same narrative arc, expressed through its steps, captions, hotspots and animation"; MINOR bump 1.2.0 → 1.3.0; include Sync Impact Report and reason (FR-031)
- [x] T002 [P] Add an uncapped frame-time comparison script (Chromium flags `--disable-gpu-vsync --disable-frame-rate-limit`, median per scene, compares against a `main` build path argument) in scripts/frame-budget.mjs, and an npm script `frame-budget` in package.json (research P11, quickstart V16)
- [x] T003 [P] Record the P11 styling rule as a comment block at the top of src/styles/layout.css: no `backdrop-filter`, `box-shadow` or `filter` on DOM that moves every frame (hotspots, labels)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Content model, validation and shell structure that every story depends on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Content model & validation

- [x] T004 Extend the content schema in scripts/validate-content.mjs for Step fields per data-model.md: `caption.headline` required, "≤ 8 words"; `caption.takeaway` required, "≤ 16 words", may contain `{{claim-id}}`; `caption.technical` optional, "≤ 20 words"; `captionAtMs` optional "0–`durationMs`; default 600"; `hotspots` optional "≤ 4 per depth per step"; `questions` optional. Word counts strip markup and split on whitespace; error text `<chapter>/<step>: caption.<field> has N words (max M)`
- [x] T005 Extend validation in scripts/validate-content.mjs for Hotspot (`id` unique kebab-case within step; `anchor` required; `term` required and must exist; `claim` optional, must exist and be verified; `technical` optional "≤ 30 words"; `depth` `all` (default) or `technical`) and LikelyQuestion (`q` "≤ 25 words"; `a` "≤ 80 words", numbers MUST carry `{{claim-id}}`; `audience` `leadership`, `technical` or `both` (default)), including denylist and uncited-number scans on all new text
- [x] T006 Extend validation in scripts/validate-content.mjs for GlossaryTerm `short` (optional, "≤ 30 words") and Chapter `shortTitle` (optional, "≤ 24 characters"); require that a hotspot's term has `definition` ≤ 30 words or a `short`
- [x] T007 Add the jargon-first-use rule to scripts/validate-content.mjs: every glossary term used in a chapter's captions is defined at or before first use by a caption `[[term]]` link or a hotspot with that `term` (FR-017)
- [x] T008 [P] Content tests for T004–T007 with passing and failing fixtures in tests/content/captions.test.mjs and tests/content/fixtures/
- [x] T009 Add temporary placeholder captions (headline = beat `heading` truncated to 8 words, takeaway = first sentence of `bottomLine` truncated to 16 words) for every step so the build passes before authoring, via a one-off script scripts/seed-captions.mjs writing content/tabs/*.json; delete the script after running

### Shell structure

- [ ] T010 Restructure src/index.html into the slide shell per contracts/slide-navigation.md: slim header (title, chapter-menu button, Audience radiogroup, settings button), `main` with a 16:9 `.slide` containing `#stage`, `#hotspots`, `#caption` (aria-live polite), `#progress`, on-slide controls (Back, Next, play/pause, Notes, generation switch), visually hidden `#scene-description` live region, and `aside#notes` (hidden); remove the tablist, side column and pager; keep the meta CSP unchanged
- [ ] T011 Slide frame styles in src/styles/layout.css: `.slide` width `min(100vw, 177.78vh)`, centred and letterboxed, `--slide-h` custom property; caption headline 4.4%, takeaway 3.3%, technical 2.8% of slide height on a solid surface panel ≥ 7:1 contrast; under 600 px the caption moves below the slide (research P1, P2)
- [ ] T012 Fold src/styles/present.css into the slide styles, leaving only fullscreen-specific rules (header hidden, slide fills screen) and blanking
- [ ] T013 Add `ctx.cue(name)` and test hooks `window.__stage.anchors`, `.phase`, `.captionShown` to src/stage/renderer.js per contracts/scene-module.md (no behaviour yet beyond recording)

**Checkpoint**: Content validates with placeholder captions; shell renders the stage in a 16:9 slide

---

## Phase 3: User Story 1 - Deliver the whole talk from a clicker, animation first (Priority: P1) 🎯 MVP

**Goal**: One Next/Back walks every step of every chapter with captions; no side text on the slide

**Independent Test**: On a 16:9 viewport, only clicker keys take the talk from the first step of the opening chapter to the last step of "What's next" and back (quickstart V1, V2)

### Tests for User Story 1

> Write first; they must fail before implementation

- [ ] T014 [P] [US1] E2E: clicker keys (`→`, `PageDown`, `Space`, `↓` / `←`, `PageUp`, `Shift+Space`, `↑`) traverse all 47 steps across chapters and back; references page not in the path; in tests/e2e/talk.spec.js
- [ ] T015 [P] [US1] E2E: per step, visible slide text in Leadership depth ≤ 24 words and no side column; caption appears no earlier than `captionAtMs` and immediately under reduced motion; progress shows chapter name and "Chapter n of 10 · Step m of k"; in tests/e2e/slide.spec.js
- [ ] T016 [P] [US1] E2E: rapid Next (10 presses) settles on the expected step with `__stage.phase === 'settled'` (FR-008); deep links `#/<chapterId>/<n>` and legacy `?present` still open the right step; in tests/e2e/talk.spec.js
- [ ] T017 [P] [US1] E2E: Notes drawer opens with `N`/button showing body, bottom line, key figures, scenario, scene description; closes on Escape and automatically on Next/Back; `?notes` opens it; in tests/e2e/notes.spec.js

### Implementation for User Story 1

- [ ] T018 [US1] Talk sequencer in src/app/sequencer.js: flatten clicker-path chapters × steps; states per data-model.md (`settled`, `animating`; chapter transitions stubbed as instant until US2); settle-then-apply on press; close-first rule for open overlays; hash sync (`replaceState` for steps, assign for chapters)
- [ ] T019 [US1] Caption panel in src/app/caption.js: render headline/takeaway (and technical in Technical depth) through the escaping renderer; release at `captionAtMs` or on `ctx.cue('caption')`, whichever first; immediate when settled or reduced motion; short opacity fade; announce via the live region
- [ ] T020 [US1] Progress strip in src/app/sequencer.js and src/index.html: chapter `shortTitle` (fallback `title`), "Chapter n of 10 · Step m of k", slim bar
- [ ] T021 [P] [US1] Chapter menu in src/app/chapter-menu.js replacing src/app/tabs.js: disclosure button + list of chapter links (`aria-current="step"`), References link; `M` opens it
- [ ] T022 [P] [US1] Settings menu in src/app/settings-menu.js: theme, motion, fullscreen, keyboard shortcuts (presenter view entry added in US7)
- [ ] T023 [US1] Update the key map in src/app/shortcuts.js and the shortcuts dialog per contracts/slide-navigation.md (Next/Back keys, `N`, `F`/`P`, `B`/`.`, `M`, `H`, `K`, `R`, `G`, `V`, `?`); remove `1`–`5` beat jumps
- [ ] T024 [US1] Reduce src/app/presentation.js to fullscreen + blanking; make `?present` a no-op alias; remove the separate presentation layout
- [ ] T025 [US1] Notes drawer in src/app/notes.js reusing src/app/markup.js, src/app/glossary.js, src/app/figures.js, src/app/scenario.js and src/app/provenance.js; Technical depth adds deep dive and chapter sections (FR-021)
- [ ] T026 [US1] Wire boot in src/main.js: sequencer, caption, chapter menu, settings, notes; remove src/app/story.js stepping UI and the pager; keep play/pause and replay on the slide (FR-009)
- [ ] T027 [US1] Rewrite tests that targeted the tablist, pager and side column (tests/e2e/navigation.spec.js, tests/e2e/story.spec.js, tests/e2e/presentation.spec.js, tests/e2e/audience.spec.js, tests/e2e/scenario.spec.js, tests/e2e/smoke.spec.js) against the slide, keeping their intent; update tests/e2e/a11y.spec.js keyboard walk

**Checkpoint**: The full talk can be delivered by clicker with placeholder captions; MVP

---

## Phase 4: User Story 5 - Prepare and deliver from a talk track (Priority: P1)

**Goal**: Every piece of today's on-page text lives in a generated, always-current talk track, plus an editable copy

**Independent Test**: `npm run build` produces docs/talk-track.md; the coverage test passes; changing a figure in content changes the document (quickstart V11)

### Tests for User Story 5

- [ ] T028 [P] [US5] Coverage test in tests/content/talk-track.test.mjs: walk every string field under content/ except ids, URLs, dates and enums; normalise markup per contracts/talk-track.md; assert each appears in the generated output; report missing JSON paths
- [ ] T029 [P] [US5] Freshness test in tests/content/talk-track.test.mjs: `--check` fails when docs/talk-track.md differs from a fresh generation

### Implementation for User Story 5

- [ ] T030 [US5] Generator in scripts/talk-track.mjs per contracts/talk-track.md: per chapter scenario; per step On screen / Say (leadership) / Technical depth / Figures table (value with qualifier, source title, locator, verified date) / Likely questions; chapter deep sections; Glossary; References by tier; markup rules (`[[term]]` with first-use definition per chapter, `{{claim-id}}` and `{{ref:id}}` → `[S<n>]`); plain GitHub-flavoured Markdown, no HTML; `--check` mode
- [ ] T031 [US5] Run the generator from scripts/build.mjs (write) and add `node scripts/talk-track.mjs --check` to the `validate` job in .github/workflows/ci.yml and to `npm run validate` in package.json
- [ ] T032 [US5] Generate and commit docs/talk-track.md; confirm it is not copied into dist/ (assert in tests/content/talk-track.test.mjs)
- [ ] T033 [US5] Publish the generated talk track once as an editable document titled "Wi-Fi 7 Explained — Talk Track (annotate here)" (quickstart T1); record its link in specs/002-presentation-first-redesign/quickstart.md

**Checkpoint**: Talk track complete and in CI; editable copy available for annotation

---

## Phase 5: User Story 2 - Meaningful transitions between chapters (Priority: P1)

**Goal**: Chapter changes play camera out → crossfade → camera in (≤ 2.5 s) with the access point as anchor

**Independent Test**: Cross every chapter boundary; each uses the three phases, finishes ≤ 2.5 s, AP visible throughout (quickstart V4, V5, V13)

### Tests for User Story 2

- [ ] T034 [P] [US2] Scene-contract test in tests/e2e/scene-anchors.spec.js: for every chapter and state, `__stage.anchors` includes `ap`; each scene has `shots.wide`
- [ ] T035 [P] [US2] E2E in tests/e2e/transitions.spec.js: every boundary passes through `chapter-out` → `crossfade` → `chapter-in` → `settled` within 2500 ms; Next during each phase jumps to settled then applies; reduced motion skips camera moves (≤ 200 ms fade); no blank frame (overlay present until the new scene has rendered)

### Implementation for User Story 2

- [ ] T036 [US2] Add `anchors()` (cached, allocation-free, `ap` in every state, hidden objects omitted) and `shots.wide` to src/scenes/overview.js and src/scenes/spectrum.js
- [ ] T037 [P] [US2] Add `anchors()` and `shots.wide` to src/scenes/mlo.js and src/scenes/qam-puncturing.js (add an AP to qam-puncturing states that lack one)
- [ ] T038 [P] [US2] Add `anchors()` and `shots.wide` to src/scenes/security.js and src/scenes/twt.js (add an AP where missing)
- [ ] T039 [P] [US2] Add `anchors()` and `shots.wide` to src/scenes/density.js, src/scenes/latency.js, src/scenes/bandwidth-poe.js and src/scenes/wifi8.js
- [ ] T040 [US2] Frame copy and camera dolly helpers in src/stage/renderer.js: synchronous copy of the just-rendered frame to a 2D overlay canvas; dolly from/to a framing relative to the `ap` anchor
- [ ] T041 [US2] Transition controller in src/app/transition.js: out (≈ 700 ms) → crossfade (≈ 600 ms, unmount old, mount new at `shots.wide`, anchor screen-position match) → in (≈ 900 ms); skip-to-end on press; reduced-motion variants (research P4)
- [ ] T042 [US2] Replace the instant chapter change in src/app/sequencer.js with the transition controller and its states
- [ ] T043 [US2] Run `npm run frame-budget` against a main build for all scenes and transitions; record results in specs/002-presentation-first-redesign/research.md under P11

**Checkpoint**: Chapters flow into each other

---

## Phase 6: User Story 3 - See each improvement against earlier Wi-Fi (Priority: P1)

**Goal**: Every feature chapter has an animated comparison step with the generation switch on the slide

**Independent Test**: On each feature chapter's comparison step, both generations animate with both names; `G` changes the earlier generation without leaving the step (quickstart V6)

### Tests for User Story 3

- [ ] T044 [P] [US3] Update tests/e2e/comparison.spec.js for the slide: each feature chapter has a comparison step; labels show Wi-Fi Alliance and IEEE names; `G` and the on-slide switch change generation; step and `__stage.state` unchanged

### Implementation for User Story 3

- [ ] T045 [US3] Move the generation switch onto the slide controls in src/app/comparison.js (radiogroup, colour + text label), hidden on chapters without comparisons
- [ ] T046 [US3] Verify each scene's comparison state labels both generations with both names via `ctx.t()`/`ctx.generations` in src/scenes/*.js; fix any that show one name only

**Checkpoint**: Comparisons are part of the animation in every feature chapter

---

## Phase 7: User Story 4 - Answer questions from the scene with tooltip hotspots (Priority: P2)

**Goal**: Info markers on scene objects open cards with definition, figure + provenance, technical line

**Independent Test**: In each chapter, open every hotspot by keyboard; card shows definition ≤ 30 words and sourced figure; Escape returns focus; Next closes first (quickstart V7, V8)

### Tests for User Story 4

- [ ] T047 [P] [US4] E2E in tests/e2e/hotspots.spec.js: markers follow anchors; `H` focuses first marker; Enter opens card (non-modal dialog labelled by term); figure shows qualifier; Source opens the provenance panel; Escape returns focus; Next with a card open closes it without advancing; cards never clipped at slide edges
- [ ] T048 [P] [US4] Content test in tests/content/captions.test.mjs: every hotspot `anchor` is published by its scene for that step's `sceneState` (uses an anchors manifest exported by each scene module's `states` metadata)
- [ ] T049 [P] [US4] No-WebGL E2E in tests/e2e/nowebgl.spec.js: stills show numbered badges; numbered hotspot list beside the caption opens the same cards

### Implementation for User Story 4

- [ ] T050 [US4] Hotspot layer in src/app/hotspots.js: marker buttons (28 px at 1080p, "i" glyph, `aria-label="<term>: more information"`, `aria-expanded`, `aria-controls`) positioned from `instance.anchors()` each frame without per-frame styling beyond transform; hidden during transitions
- [ ] T051 [US4] Hotspot card in src/app/hotspots.js: non-modal `role="dialog"`; term, definition (`short` if present), figure via `ctx.claim()` + qualifier + Source button (src/app/provenance.js), technical line in Technical depth; side-with-more-room placement; close on Escape/outside click/Next
- [ ] T052 [US4] Export a static `anchorsByState` manifest from each scene module in src/scenes/*.js for the content test (T048)
- [ ] T053 [US4] Numbered hotspot badges in scripts/snapshots.mjs (draw badges, hide caption before capture) and the numbered hotspot list in src/stage/fallback.js (research P10)
- [ ] T054 [US4] Integrate close-first handling for cards into src/app/sequencer.js

**Checkpoint**: Definitions and provenance are available from the scene itself

---

## Phase 8: User Story 6 - Switch depth on the slide (Priority: P2)

**Goal**: Technical depth adds a caption line, technical hotspots and a figures overlay on comparison steps

**Independent Test**: Press `V` on a step in each chapter; technical layer toggles; step and animation state unchanged (quickstart V9)

### Tests for User Story 6

- [ ] T055 [P] [US6] Update tests/e2e/audience.spec.js: Leadership shows plain caption + `depth: all` hotspots only; Technical adds `caption.technical`, `depth: technical` hotspots and the figures overlay on comparison steps; `__stage.state`, step and hash position unchanged after toggle

### Implementation for User Story 6

- [ ] T056 [US6] Depth handling in src/app/view.js, src/app/caption.js and src/app/hotspots.js (re-render without re-running the step)
- [ ] T057 [US6] On-slide figures overlay for comparison steps in src/app/figures.js (Technical only, compact table using the chapter's key figures with qualifiers and Source buttons; static styling only)

**Checkpoint**: One talk serves leadership and technical rooms

---

## Phase 9: User Story 7 - Presenter view with notes (Priority: P3)

**Goal**: A notes window on the laptop stays in sync with the projected slide

**Independent Test**: From `file://`, open presenter view, advance from either window; both match within 0.5 s in three browsers (quickstart V12)

### Tests for User Story 7

- [ ] T058 [P] [US7] E2E in tests/e2e/presenter.spec.js (all three browsers, `file://`): `S` opens the window; Next/Back from either window syncs within 500 ms; messages from another window or with a wrong shape are ignored; popup blocked → notice pointing to the talk track

### Implementation for User Story 7

- [ ] T059 [US7] Bundle per-step talk-track notes for the presenter window from content at build time (shared formatter with scripts/talk-track.mjs) in src/app/presenter.js
- [ ] T060 [US7] Presenter window in src/app/presenter.js: `window.open(<same file>#/<chapter>/<step>?presenter, 'wifi7-presenter')` on a user gesture; `?presenter` boot renders notes, next caption, elapsed timer, Back/Next, no 3D scene; message schema `hello`/`goto`/`nav` per data-model.md; trust by `event.source` identity only, never origin (research P9)
- [ ] T061 [US7] Add the presenter entry to src/app/settings-menu.js and the `S` key to src/app/shortcuts.js

**Checkpoint**: Presenter can run the talk from a notes window

---

## Phase 10: Content authoring (supports US1, US3, US4, US5)

**Purpose**: Replace placeholder captions and add hotspots and likely questions for all 47 steps. Each task is one chapter file and can run in parallel; every item goes through the validator (T004–T007).

- [ ] T062 [P] Author captions (headline "≤ 8 words", takeaway "≤ 16 words", technical "≤ 20 words"), `captionAtMs`, hotspots and 4–8 likely questions for content/tabs/01-overview.json, opening with why Wi-Fi 7 matters to healthcare
- [ ] T063 [P] Author captions, hotspots and questions for content/tabs/02-6ghz-320mhz.json
- [ ] T064 [P] Author captions, hotspots and questions for content/tabs/03-mlo.json (add `ctx.cue('caption')` timing for the reroute moment in src/scenes/mlo.js)
- [ ] T065 [P] Author captions, hotspots and questions for content/tabs/04-qam-puncturing-multiru.json
- [ ] T066 [P] Author captions, hotspots and questions for content/tabs/05-security.json
- [ ] T067 [P] Author captions, hotspots and questions for content/tabs/06-twt.json
- [ ] T068 [P] Author captions, hotspots and questions for content/tabs/07-density.json
- [ ] T069 [P] Author captions, hotspots and questions for content/tabs/08-latency.json
- [ ] T070 [P] Author captions, hotspots and questions for content/tabs/09-bandwidth-poe.json
- [ ] T071 [P] Author captions, hotspots and questions for content/tabs/10-wifi8.json
- [ ] T072 [P] Add `short` definitions (≤ 30 words) in content/glossary.json for every hotspot term whose `definition` is longer
- [ ] T073 Regenerate docs/talk-track.md and fallback stills; republish the editable talk track if T033 was done with placeholder captions

---

## Phase 11: Polish & Cross-Cutting Concerns

- [ ] T074 [P] Update tests/e2e/a11y.spec.js: axe on every step in both depths with drawer and a card open; keyboard-only walk of the full talk (SC-008)
- [ ] T075 [P] Update tests/e2e/security.spec.js: zero CSP violations across the talk, transitions, cards, drawer and presenter window (FR-028)
- [ ] T076 [P] Update tests/e2e/performance.spec.js busiest list for the slide and add a transition frame-time sample; run `npm run frame-budget` and confirm within 1 ms of main (SC-009)
- [ ] T077 [P] Update tests/e2e/resilience.spec.js for the slide (context loss keeps chapter/step; hidden page stops the loop during and after transitions)
- [ ] T078 [P] Update README.md "Viewing it" and "Presenting" sections: clicker keys, Notes, presenter view, talk track location
- [ ] T079 [P] Mark feature 001's superseded navigation/presentation requirements as replaced in specs/001-wifi7-healthcare-explainer/contracts/ui-navigation.md (header note linking to this feature's slide-navigation contract)
- [ ] T080 Rehearsal on a 16:9 projector at 1920×1080: run quickstart V1–V17, including captions read from 8 m (SC-007) and presenter rating of the talk track (SC-010); record outcomes in specs/002-presentation-first-redesign/quickstart.md

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (1)**: T001 blocks merge, not development; T002–T003 any time
- **Foundational (2)**: blocks all user stories
- **US1 (3)**: after Foundational; the MVP
- **US5 (4)**: after Foundational; independent of US1 (content and scripts only) — can run in parallel with US1
- **US2 (5)**: after US1 (needs the sequencer)
- **US3 (6)**: after US1 (needs slide controls)
- **US4 (7)**: after US1; benefits from US2's `anchors()` (T036–T039) — do US2 first or pull those tasks forward
- **US6 (8)**: after US1 and US4 (technical hotspots)
- **US7 (9)**: after US1 and US5 (shares the notes formatter)
- **Content (10)**: after T004–T007; runs alongside phases 3–9; T073 at the end
- **Polish (11)**: after the stories in scope

### Within each story

- Tests first (must fail), then implementation, then the checkpoint
- Scene edits (T036–T039) before the transition controller (T041)

### Parallel opportunities

- T002, T003, T008 alongside other Phase 1–2 work
- US1 and US5 in parallel after Foundational
- T037, T038, T039 in parallel (different scene files)
- All of Phase 10 (one chapter file each)
- All Polish tasks marked [P]

## Parallel Example: User Story 1

```text
T014 talk.spec.js | T015 slide.spec.js | T017 notes.spec.js     (tests, in parallel)
T021 chapter-menu.js | T022 settings-menu.js                     (independent modules)
then T018 → T019 → T020 → T023–T026 → T027
```

## Parallel Example: Content

```text
T062 … T071 (one chapter file each) and T072 glossary, then T073
```

## Implementation Strategy

### MVP (User Story 1 + talk track)

1. Phases 1–2 (placeholder captions keep the build green)
2. Phase 3 (US1): deliverable talk by clicker
3. Phase 4 (US5): talk track for rehearsal
4. **Stop and validate**: rehearse the talk on a projector with the generated talk track

### Incremental delivery

5. US2 transitions → US3 comparisons (completes all P1 stories)
6. Content authoring replaces placeholders chapter by chapter
7. US4 hotspots → US6 depth → US7 presenter view
8. Polish, full e2e, frame budget, rehearsal (T080), constitution amendment merged (T001)

## Notes

- Keep every change behind passing `npm run validate`, `npm test` and the e2e suite; compare frame
  times against `main` with the uncapped script before merging any scene or overlay change (P11).
- Commit per task or logical group; never edit docs/talk-track.md by hand.
