# Data Model: Presentation-First Redesign

Extends the content model of feature 001
([../001-wifi7-healthcare-explainer/data-model.md](../001-wifi7-healthcare-explainer/data-model.md)).
Existing entities (Generation, Reference, GlossaryTerm, HealthcareScenario, Claim, FeatureTab,
Beat, DeepSection, KeyFigure) are unchanged unless listed here. In the UI a **FeatureTab** is now
presented as a **Chapter** and a **Beat** as a **Step**; file names, ids and URLs stay the same so
existing links and content keep working.

## Chapter (presentation of FeatureTab)

| Field | Source | Notes |
|-------|--------|-------|
| `id`, `order`, `title` | existing FeatureTab | Chapter order = tab `order` |
| `kind` | existing | `overview`, `feature`, `roadmap` are in the clicker path; `references` is not (FR-010) |
| `shortTitle` | **new**, optional, ≤ 24 characters | Shown in the progress strip and chapter menu; defaults to `title` |
| `opener` | **new**, required for chapters in the clicker path | `{ promise, problem, badge? }`: promise ≤ 10 words, problem ≤ 16 words, plain text plus `{{claim-id}}` (no term links); `badge: false` hides the lineage badge (FR-011a). Tag, number, title and badge text are derived from `kind`, `order`, `title` and `introducedIn` |
| `beats` | existing | Each beat is a Step (below) |

Validation:
- `shortTitle` length ≤ 24.
- Rule 25: every chapter in the clicker path has an `opener` within the limits above.
- Every chapter in the clicker path has a scene whose instance publishes an `ap` anchor (checked by
  the scene contract test, not by content).

## Step (extends Beat)

| Field | Status | Rules |
|-------|--------|-------|
| `type`, `heading`, `body`, `bottomLine`, `deepDive`, `sceneState`, `sceneDescription`, `durationMs` | existing | Unchanged; shown in the Notes drawer and talk track, not on the slide |
| `caption.headline` | **new, required** | ≤ 8 words; plain text plus `[[term]]` links; no claim citations |
| `caption.takeaway` | **new, required** | ≤ 16 words; may contain `{{claim-id}}` (rendered as a source button) |
| `caption.technical` | **new, optional** | ≤ 20 words; shown only in Technical depth |
| `captionAtMs` | **new, optional** | 0–`durationMs`; default 600 |
| `callout` | **new, optional** | `{ title, points[], atMs? }`: title ≤ 6 words, 2–4 points of ≤ 14 words; points may contain `[[term]]` and `{{claim-id}}`; `atMs` (0–`durationMs`, default caption time + 1200) is when it slides in (FR-005a) |
| `covers` | **new, optional** | Feature chapters: extra arc parts this step also carries, after its `type` (e.g. `type: "problem"`, `covers: ["what"]`). Across the chapter, `type` + `covers` must give problem → what → how → improvement → why exactly once each, in 3–5 steps (rule 3, FR-013a) |
| `hotspots` | **new, optional** | Array of Hotspot (below); ≤ 4 per depth per step |
| `questions` | **new, optional** | Array of LikelyQuestion (below) |

Validation:
- Word counts use whitespace splitting after stripping markup; over-limit fails the build with
  `<chapter>/<step>: caption.<field> has N words (max M)`.
- Every glossary term used in a chapter's captions must be defined in that chapter at or before
  its first use, by a `[[term]]` link in a caption or a hotspot with that `term` (FR-017).
- Leadership-depth visible words (headline + takeaway) ≤ 24 (SC-002) — implied by the two limits.

## Hotspot (new)

| Field | Required | Rules |
|-------|----------|-------|
| `id` | ✅ | Unique within the step; kebab-case |
| `anchor` | ✅ | Name of an anchor the chapter's scene publishes for this step's `sceneState` |
| `term` | ✅ | GlossaryTerm id; its definition (≤ 30 words) is the card's body |
| `claim` | — | Claim id; the card shows its value with qualifier and a provenance button |
| `technical` | — | ≤ 30 words; shown only in Technical depth; may contain `{{claim-id}}` |
| `depth` | — | `all` (default) or `technical` |

Validation:
- `anchor` exists in the scene's published anchors for that state (scene-contract test).
- `term` exists; its `definition` ≤ 30 words (glossary entries over the limit need a `short`
  definition, added to GlossaryTerm as an optional field).
- `claim` exists and is verified (same rule as other displayed claims).

## GlossaryTerm (extended)

| Field | Status | Rules |
|-------|--------|-------|
| `short` | **new, optional** | ≤ 30 words; used by hotspot cards when `definition` is longer |

## LikelyQuestion (new)

| Field | Required | Rules |
|-------|----------|-------|
| `q` | ✅ | ≤ 25 words |
| `a` | ✅ | ≤ 80 words; plain language first; numbers MUST carry `{{claim-id}}` |
| `audience` | — | `leadership`, `technical` or `both` (default) |

Validation: same neutrality denylist, uncited-number scan and claim rules as all other copy.

## TalkTrackEntry (generated, not stored in content)

Produced by `scripts/talk-track.mjs` for each Chapter × Step:

| Section | Built from |
|---------|-----------|
| On screen | `caption.*`, `sceneDescription`, hotspot terms |
| Say (leadership) | `heading`, `body`, `bottomLine`, chapter scenario(s) |
| Technical depth | `deepDive`, `caption.technical`, technical hotspots, chapter `sections` |
| Figures | Claims cited in the step, its hotspots and the chapter's key figures: value, qualifier, source title, locator, verified date |
| Likely questions | `questions` |

Plus document-level sections: chapter list, glossary (all terms), references (all, grouped by
tier). Coverage rule: every string-valued text field in `content/` (excluding ids, urls, dates)
must appear in the output.

## Talk sequencer state (runtime)

| State | Meaning | Transitions |
|-------|---------|-------------|
| `settled(c, s)` | Chapter `c`, step `s` shown at rest | Next → `animating(c, s+1)` or `chapter-out(c → c+1)` at last step; Back → `settled(c, s-1)` (settled, no animation) or `settled(c-1, last)` |
| `animating(c, s)` | Step transition playing | finishes → `settled(c, s)`; Next/Back → jump to `settled(c, s)` then apply |
| `chapter-out(c → d)` | Camera moving out | → `crossfade(c → d)`; Next/Back → jump to `settled(d, 1)` then apply |
| `crossfade(c → d)` | Overlay fading, scene `d` mounted | → `chapter-in(d)`; Next/Back → as above |
| `chapter-in(d)` | Camera moving in | → `animating(d, 1)`; Next/Back → as above |
| overlay open | Hotspot card or Notes drawer open over any state | Next/Back/Escape → close only, state unchanged |

Back always lands on a settled state (no reverse animation), matching 001 behaviour.

## Presenter message (runtime, window-to-window)

| Message | Fields | Accepted when |
|---------|--------|---------------|
| `hello` | `{ type: 'hello', version: 1 }` | from the known peer window only |
| `goto` | `{ type: 'goto', chapter: <chapterId>, step: <int ≥ 1> }` | peer only; chapter id known; step in range |
| `nav` | `{ type: 'nav', dir: 'next' \| 'back' }` | peer only |

Any other shape, or any message whose `event.source` is not the peer, is ignored.
