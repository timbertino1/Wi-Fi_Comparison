# Implementation Plan: Presentation-First Redesign

**Branch**: `002-presentation-first-redesign` | **Date**: 2026-10-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-presentation-first-redesign/spec.md`

## Summary

Turn the explainer into a 16:9, clicker-driven talk in which the 3D animation is the slide. The
side text column is replaced by a short caption per step (headline ≤ 8 words, takeaway ≤ 16) that
appears at the right moment, tooltip hotspots attached to scene objects (definition, figure with
provenance, technical line), and a closed-by-default Notes drawer for viewers without a presenter.
A single talk sequencer drives Next/Back across chapters, and chapter changes play a camera
out → crossfade → camera in transition with the access point as the shared anchor, keeping only
one 3D scene alive at a time. All existing text moves into a generated talk track
(`docs/talk-track.md`, checked for full coverage and freshness in CI) that is also published once
as an editable doc. An optional presenter view syncs a notes window over `window.open` +
`postMessage`, which a spike showed working from `file://` in all three browsers. Everything from
feature 001 (claims and provenance, neutrality, WCAG 2.2 AA, reduced motion, no-WebGL stills,
offline `file://` delivery, CSP) carries over. Details: [research.md](./research.md).

## Technical Context

**Language/Version**: JavaScript (ES2022), HTML5, CSS custom properties; Node.js ≥ 20 for tooling
(developed on Node 24) — unchanged from 001

**Primary Dependencies**: three 0.186.1 (runtime). Dev: esbuild 0.28.2, @playwright/test 1.64.1,
@axe-core/playwright 4.14.0. **No new dependencies.**

**Storage**: Static JSON content bundled at build time; `localStorage` for preferences only
(theme, motion, depth). No new storage.

**Testing**: `node --test` (content validation incl. caption limits, hotspot/term rules, talk-track
coverage and freshness); Playwright E2E on `file://` in Chromium, Firefox, WebKit (slide,
sequencer, transitions, hotspots, notes, presenter view, reduced motion, no-WebGL, a11y, CSP,
performance)

**Target Platform**: Laptop driving a 16:9 projector (1920×1080 or 1280×720) with a USB
presentation clicker; plus the 001 targets (evergreen desktop and mobile browsers, `file://` or
static host)

**Project Type**: Static single-page web application (no backend)

**Performance Goals**: As 001 (60 fps on integrated GPU; first slide < 3 s; bundle ≤ 500 KB gz).
Chapter transition ≤ 2.5 s end to end. Uncapped median frame time within 1 ms of the MVP slide build
(fc36db8) per scene (research P11).

**Constraints**: As 001 (offline, `file://`, zero network, CSP, no `eval`/inline script, escaping
renderer, vendor neutrality). Additionally: no `backdrop-filter`/`box-shadow`/`filter` on
per-frame-moving DOM; only one 3D scene alive at a time; presenter messages trusted by
`event.source` identity only.

**CI/CD**: Existing workflows; the `validate` job additionally runs `talk-track.mjs --check`.

**Scale/Scope**: 10 chapters in the clicker path (overview, 8 features, Wi-Fi 8) + references
page; 47 steps; ≈ 47 captions, ≈ 120 hotspots, ≈ 60 likely questions of new copy; 10 scenes
gain `anchors()`/`shots`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | How the design complies | Status |
|---|-----------|------------------------|--------|
| I | Vendor neutrality & accuracy | All new copy (captions, hotspots, questions) runs through the same denylist, uncited-number scan and claim rules; figures on slides and in cards come only from verified claims with qualifiers; provenance one action away (FR-018); talk track cites sources | ✅ |
| II | Teach by telling a story | Five-part arc kept per feature chapter, carried by steps, captions and animation (FR-013); jargon defined at first use via caption links or hotspots, validator-enforced (FR-017); Leadership/Technical layering kept as on-slide depth (FR-020). **Wording conflict**: "Each feature MUST live on its own tab" — chapters replace the tablist | ⚠️ Amendment required (FR-031) |
| III | Healthcare context | Opening chapter is "why Wi-Fi 7 matters to healthcare"; each chapter keeps its scenario (Notes drawer, talk track, comparison step); no outcome guarantees in new copy (copy review) | ✅ |
| IV | Generational comparison | Comparison step per feature chapter, animated, both naming schemes; on-slide generation switch (FR-014/015) | ✅ |
| V | Purposeful 3D animation | Animation becomes the primary medium; play/pause, step and replay kept (FR-009); lazy init/dispose kept; transitions keep one scene alive (P4) | ✅ |
| VI | Accessible & performant | Caption live region and visually hidden scene description; hotspots are focusable buttons with dialogs; keyboard map; reduced-motion transitions; no-WebGL stills with numbered hotspots (P10); performance guard-rails (P11) | ✅ |
| VII | Simplicity & static delivery | No new dependencies; static `dist/`; talk track is a build-time Markdown file outside `dist/`; presenter view uses built-in browser APIs | ✅ |
| VIII | Secure by default | Same CSP (no network needed for presenter sync); all new text through the escaping renderer; strict presenter message schema and source-identity check; no new storage | ✅ |

**Gate result**: Pass, conditional on the Principle II amendment, which is tracked as a blocking
task (constitution MINOR bump via `/speckit-constitution`, with a Sync Impact Report) and must merge
before or with this feature. Proposed wording: "Each feature MUST have its own chapter (a tab or a
chapter of a continuous talk), and each chapter MUST follow the same narrative arc, expressed
through its steps, captions, hotspots and animation."

**Post-design re-check (after Phase 1)**: data-model.md, the three contracts and quickstart.md
keep every mapping above; the only open item remains the Principle II amendment. ✅

## Project Structure

### Documentation (this feature)

```text
specs/002-presentation-first-redesign/
├── plan.md              # This file
├── research.md          # P1–P12 decisions (incl. presenter-view spike)
├── data-model.md        # Step caption/hotspot/question fields, sequencer states, presenter messages
├── quickstart.md        # Build, rehearse, validation scenarios V1–V17, editable copy T1–T3
├── contracts/
│   ├── scene-module.md     # anchors(), shots, ctx.cue() additions
│   ├── slide-navigation.md # slide layout, URLs, keys, hotspots, notes, presenter view, a11y
│   └── talk-track.md       # generator, document layout, rendering and coverage rules
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root) — changes only

```text
.specify/memory/constitution.md   # Principle II amendment (MINOR)

content/
├── glossary.json                 # + optional `short` definitions (≤ 30 words)
└── tabs/NN-*.json                # + per step: caption{headline,takeaway,technical}, captionAtMs,
                                  #   hotspots[], questions[]; + chapter shortTitle

src/
├── index.html                    # Slide shell: slim header, slide frame, caption, progress,
│                                 #   notes aside, settings menu; tablist and side column removed
├── main.js                       # Boot the sequencer instead of tabs/story wiring
├── app/
│   ├── sequencer.js              # NEW talk sequencer: flattened steps, Next/Back, close-first rule,
│   │                             #   settle-on-press, hash sync (replaces story.js stepping + tabs.js pager)
│   ├── transition.js             # NEW chapter out → crossfade → in (P4)
│   ├── caption.js                # NEW caption panel, timing (captionAtMs / ctx.cue), live region
│   ├── hotspots.js               # NEW markers in label layer, cards, fallback numbered list
│   ├── notes.js                  # NEW Notes drawer using existing renderers
│   ├── chapter-menu.js           # NEW replaces tabs.js tablist
│   ├── presenter.js              # NEW presenter window + postMessage sync (P9)
│   ├── settings-menu.js          # NEW theme/motion/fullscreen/presenter/shortcuts
│   ├── tabs.js, story.js         # Removed or reduced to shared helpers
│   ├── presentation.js           # Reduced to fullscreen + blanking
│   └── shortcuts.js              # Updated key map
├── stage/
│   ├── renderer.js               # + frame copy to overlay canvas, camera dolly helpers, cue()
│   └── fallback.js               # + numbered hotspot list
├── scenes/*.js                   # + anchors(), shots; ensure AP in every state; optional cue('caption')
└── styles/
    ├── layout.css                # Slide frame, caption, progress, drawer, hotspots
    └── present.css               # Merged into slide styles (fullscreen specifics only)

scripts/
├── talk-track.mjs                # NEW generator + --check
├── validate-content.mjs          # + caption/hotspot/question rules, jargon-first-use
├── build.mjs                     # + run talk-track generator
└── snapshots.mjs                 # + numbered hotspot badges, caption hidden

docs/
└── talk-track.md                 # NEW generated (committed)

tests/
├── content/                      # + caption limits, hotspot refs, questions, talk-track coverage/freshness
└── e2e/                          # Rewrite navigation/story/comparison/presentation/audience for the
                                  #   slide; new: transitions, hotspots, notes, presenter, scene anchors;
                                  #   keep a11y, security, offline, provenance, resilience, nowebgl, performance
```

**Structure Decision**: Same single static web project as 001. New UI behaviour lives in focused
modules under `src/app/` so the sequencer, transitions, captions, hotspots, notes and presenter view
can be built and tested independently (matching the spec's independently testable stories).
Content stays the single source for slides, Notes drawer and talk track.

## Delivery order (for /speckit-tasks)

1. Constitution amendment (blocking, small).
2. Slide shell + sequencer + captions (US1, P1) — usable talk with existing scenes.
3. Talk track generator + coverage (US5, P1) — can run in parallel with 2; unblocks rehearsal.
4. Chapter transitions + scene anchors/shots (US2, P1).
5. Comparison steps verified on the slide (US3, P1).
6. Hotspots + jargon rule + fallback badges (US4, P2).
7. Depth toggle on slide (US6, P2) and Notes drawer (FR-021).
8. Presenter view (US7, P3).
9. Content authoring: captions, hotspots, questions for all 47 steps (runs alongside 2–7).
10. Publish editable talk track (T1) once the first full talk track exists.

## Complexity Tracking

No new violations beyond those already justified in 001 (build step, build-time snapshots). The
Principle II wording conflict is resolved by amendment, not by exception.
