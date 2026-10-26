# Data Model: Wi-Fi 7 Healthcare Explainer

**Date**: 2026-10-26 | **Spec**: [spec.md](./spec.md) | File formats: [contracts/content-schema.md](./contracts/content-schema.md)

All entities are static content authored in `content/` and bundled at build time. There is no
runtime persistence other than viewer preferences.

## Entities

### Generation

| Field | Type | Rules |
|-------|------|-------|
| `id` | enum `wifi4` \| `wifi5` \| `wifi6` \| `wifi6e` \| `wifi7` \| `wifi8` | Unique |
| `name` | string | Wi-Fi Alliance name, e.g., "Wi-Fi 7" |
| `ieee` | string | e.g., "IEEE 802.11be" |
| `year` | string | Certification/ratification year as stated in a reference, e.g., "2024" |
| `colorToken` | string | CSS custom property name, e.g., `--gen-wifi7`; one per generation, used site-wide |
| `status` | enum `ratified` \| `in-development` | `wifi8` MUST be `in-development` |
| `referenceIds` | string[] | ≥ 1 |

`wifi6e` shares 802.11ax with `wifi6`; its `ieee` is "IEEE 802.11ax (6 GHz)".

### FeatureTab

| Field | Type | Rules |
|-------|------|-------|
| `id` | slug | Unique; used in URL hash (e.g., `mlo`) |
| `order` | int 1–11 | Unique, contiguous; defines story order |
| `kind` | enum `overview` \| `feature` \| `roadmap` \| `references` | Tabs 2–9 are `feature` |
| `title` | string | ≤ 40 chars |
| `summary` | string | One-sentence preview, shown on Overview |
| `introducedIn` | Generation id \| null | Required for features inherited from earlier gens (6 GHz → `wifi6e`, TWT → `wifi6`, puncturing → `wifi6`, WPA3 → `wifi6`) |
| `wifi7Adds` | string | Required when `introducedIn` is not `wifi7` — what Wi-Fi 7 changes |
| `compareGenerations` | Generation id[] | MUST include `wifi7` and `wifi6` (or `wifi6e`) for `feature` tabs |
| `defaultCompare` | Generation id | Generation shown opposite Wi-Fi 7 by default |
| `beats` | StoryBeat[] | `feature`: exactly 5, in fixed order; `overview`/`roadmap`: 3–6 beats; `references`: 0 |
| `keyFigures` | KeyFigure[] | `feature`: ≥ 2 |
| `scenarioIds` | string[] | `feature`: ≥ 1 |
| `sections` | DeepSection[] | Optional extra depth (e.g., MLO modes) |
| `sceneId` | string | Matches a module in `src/scenes/`; null for `references` |
| `draft` | boolean, optional | Authoring flag: while `true`, beat-structure and first-use rules are skipped; any `draft` is an error in release mode |

### StoryBeat

| Field | Type | Rules |
|-------|------|-------|
| `type` | enum `problem` \| `what` \| `how` \| `improvement` \| `why` | Feature tabs: exactly this order. Overview/roadmap use `intro` \| `context` \| `outlook` |
| `heading` | string | ≤ 60 chars |
| `body` | rich text (limited markup) | Plain language; glossary terms marked `[[term-id]]`, citations `{{ref-id}}` |
| `bottomLine` | string | Leadership layer: impact, risk, cost, or planning implication; ≤ 40 words; plain text with `{{ref}}` allowed; required on `feature` tab beats, optional elsewhere |
| `deepDive` | rich text \| null | Technical layer ("Under the hood"); required on `how` and `improvement` beats of `feature` tabs |
| `sceneState` | string | Named state the scene module exposes for this beat |
| `sceneDescription` | string | Text equivalent of the animation for assistive tech; required, ≥ 20 words |
| `durationMs` | int | Auto-play dwell time; 6000–20000 |

### DeepSection

| Field | Type | Rules |
|-------|------|-------|
| `id` | slug | Unique within tab |
| `heading` | string | e.g., "MLO modes: STR, NSTR, EMLSR, EMLMR" |
| `body` | rich text | Same markup rules as beats |
| `sceneState` | string \| null | Optional scene state to show while open |

### KeyFigure

| Field | Type | Rules |
|-------|------|-------|
| `id` | slug | Unique within tab |
| `metric` | string | e.g., "Max channel width" |
| `unit` | string | e.g., "MHz", "Gbps", "W" |
| `values` | map Generation id → number \| string \| null | null = "not supported" |
| `qualifier` | enum `theoretical` \| `typical` \| `optional` \| `regulatory` \| `specified-not-shipping` \| `normative` | Peak rates MUST be `theoretical`; 46 Gbps MUST be `specified-not-shipping` |
| `regulatoryDomain` | string \| null | Required when `qualifier` = `regulatory` (e.g., "US (FCC)") |
| `note` | string \| null | Short caveat shown with the figure |
| `headline` | boolean | Shown in Leadership view; `feature` tabs MUST have 2–3 headline figures |
| `referenceIds` | string[] | ≥ 1 |

### HealthcareScenario

| Field | Type | Rules |
|-------|------|-------|
| `id` | slug | Unique |
| `location` | string | e.g., "Emergency department at shift change" |
| `deviceTypes` | string[] | Generic only (e.g., "voice badge", "infusion pump"); denylist-checked |
| `problem` | string | |
| `outcomeSupported` | string | MUST be phrased as enabling/supporting; no guarantee wording |

### Reference

| Field | Type | Rules |
|-------|------|-------|
| `id` | slug | Unique |
| `title` | string | |
| `publisher` | enum `IEEE` \| `Wi-Fi Alliance` \| `FCC` \| `ECC/ETSI` \| `Other regulator` | Neutral sources only |
| `identifier` | string | e.g., "IEEE Std 802.11be-2024" |
| `date` | string (YYYY or YYYY-MM-DD) | |
| `url` | string \| null | Opens in a new tab; site works without following it |
| `verifiedOn` | date \| null | Set when the accuracy gate confirms it |

### GlossaryTerm

| Field | Type | Rules |
|-------|------|-------|
| `id` | slug | Unique; referenced as `[[id]]` |
| `term` | string | e.g., "EMLSR" |
| `expansion` | string \| null | e.g., "Enhanced Multi-Link Single Radio" |
| `definition` | string | Plain language, ≤ 50 words |

Glossary "tabs where it appears" is derived at build time, not authored.

## Relationships

```text
Generation 1─* KeyFigure.values
FeatureTab 1─* StoryBeat
FeatureTab 1─* KeyFigure *─* Reference
FeatureTab *─* HealthcareScenario
StoryBeat / DeepSection body ──[[term]]──> GlossaryTerm
StoryBeat / DeepSection body ──{{ref}}───> Reference
FeatureTab.sceneId ──> scene module (contracts/scene-module.md)
StoryBeat.sceneState ──> a state name that scene module declares
```

## Validation rules (enforced by `scripts/validate-content.mjs`)

1. All ids unique within their collection; tab `order` values 1–11 contiguous.
2. Every `[[term]]`, `{{ref}}`, `referenceIds`, `scenarioIds`, and Generation id resolves.
3. Feature tabs have exactly 5 beats in the order problem → what → how → improvement → why.
4. Every `sceneState` is declared by the matching scene module's `states` list.
5. Any KeyFigure whose metric is a peak/maximum rate has `qualifier` `theoretical` or
   `specified-not-shipping`.
6. Feature tabs with `introducedIn` ≠ `wifi7` have a non-empty `wifi7Adds`.
7. No string anywhere matches the vendor/trademark denylist (`tests/content/denylist.txt`).
8. No string in scenarios or beats matches guarantee phrases (e.g., "ensures compliance",
   "guarantees", "eliminates risk") — warnings reviewed in the story gate.
9. Every glossary term used on a tab appears there at least once with `[[ ]]` markup (first-use
   definition). "Used" means the term's `term` or `expansion` occurs as a whole word,
   case-insensitive, in any beat `heading`, `body`, `bottomLine`, `deepDive`, or section `body`.
10. Every Reference is cited at least once (no orphans).
11. Audience layers: every `feature` tab beat has a `bottomLine` (≤ 40 words); `how` and
    `improvement` beats have a non-empty `deepDive`; each `feature` tab has 2–3 `headline` figures.
12. Security: content strings MUST NOT contain `<`, `>`, `javascript:`, or `data:` sequences
    outside the inline markup forms; Reference `url` values MUST be `https:` URLs.

**Draft vs release**: tabs with `draft: true` skip rules 3, 9 and 11. The minimum counts (≥ 2
keyFigures, ≥ 1 scenarioId, 2–3 headline figures) and orphan references (rule 10) are enforced
only in release mode (`--release`), so stories can be built in order (US2 content before US3
figures and US4 scenarios) without breaking `npm run validate`. Release mode also errors on any
remaining `draft`.

## State (runtime, not persisted except where noted)

```text
ViewState = { tabId, beatIndex, compareGen, playing, presenting, motion, theme,
              view: 'leadership' | 'technical' }   # view default 'leadership'

beat transitions:  idle ─play→ playing ─(dwell elapsed)→ next beat … ─(last beat)→ idle
                   any ─step±/replay→ paused at target beat
tab change:        dispose old scene → init new scene lazily → beatIndex from hash or 0
view change:       sets data-view on <html>; no scene re-mount, beat unchanged
persisted:         motion, theme, view (localStorage); tabId/beatIndex/gen/view/presenting live in
                   the URL hash (URL view wins over stored view)
```
