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
| `yearClaimId` | Claim id | The claim that backs `year` (shown via the provenance panel) |
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
| `claimIds` | map Generation id → Claim id | Required for every non-null value; the claim's `value` and `unit` MUST equal the displayed value (references are reached through claims) |

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
| `publisher` | SourcePolicy publisher id | MUST exist in `content/source-policy.json` |
| `tier` | 1 \| 2 | MUST equal the publisher's tier |
| `identifier` | string | Standard number, docket/report number, or DOI (e.g., "IEEE Std 802.11be-2024", "FCC 20-51"); Tier 2 peer-reviewed sources MUST have a DOI |
| `edition` | string \| null | Version, amendment, or revision cited |
| `date` | string (YYYY or YYYY-MM-DD) | Publication date |
| `status` | enum `current` \| `superseded` | Claims using a superseded source need a reason in `verification.notes` |
| `access` | enum `open` \| `paywalled` | Shown so reviewers know whether they can check it directly |
| `url` | `https:` URL | Host MUST match one of the publisher's `domains`; opens in a new tab; the site works without following it |

### SourcePolicy (`content/source-policy.json`, research R15)

| Field | Type | Rules |
|-------|------|-------|
| `publishers` | { `id`, `name`, `tier` (1 \| 2), `domains[]`, `use` }[] | The only publishers a Reference may name; `domains` are exact hosts or `*.`-prefixed suffixes |
| `excluded` | { `category`, `description` }[] | Shown on the References tab (documentation; never names specific vendors) |
| `technicalMinTier` | 1 | Technical claims need ≥ 1 source at this tier |
| `contextMinTier` | 2 | Healthcare-context claims need ≥ 1 source at or above this tier |
| `maxVerificationAgeDays` | int | 365 |

### Claim (`content/claims.json`, research R16)

| Field | Type | Rules |
|-------|------|-------|
| `id` | slug | Unique across claims and references; cited in text as `{{id}}` |
| `statement` | string | Plain-language statement, e.g., "Wi-Fi 7 peak PHY rate with 16 spatial streams" |
| `value` | number \| string \| null | null for purely normative claims |
| `unit` | string \| null | |
| `kind` | enum `technical` \| `context` | `technical` needs ≥ 1 Tier 1 source; `context` (healthcare or background) needs ≥ 1 Tier 1 or Tier 2 source |
| `method` | enum `stated` \| `derived` \| `illustrative` | `illustrative` claims show no number and are labeled "Illustrative" on screen |
| `sources` | { `referenceId`, `locator`, `excerpt`? }[] | ≥ 1; `locator` required (clause, table, section, page, or paragraph); `excerpt` ≤ 50 words |
| `derivation` | { `formula`, `inputs`: { name → claim id }, `constants`: { name → number }, `rounding`, `explanation` } \| null | Required when `method` = `derived`; `formula` names a function in `scripts/derivations.mjs`; `rounding` e.g. `{ "decimals": 1 }`; inputs MUST be `stated` claims; `constants` are definitional parameters of the question asked (e.g., the channel width being counted), never facts |
| `verification` | { `verifiedOn`: date \| null, `verifiedBy`: string \| null, `notes`: string \| null } | Release: `verifiedOn` and `verifiedBy` required, `verifiedOn` ≤ 365 days before the build; `verifiedBy` is initials or a role only |

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
FeatureTab 1─* KeyFigure ──claimIds──> Claim *─* Reference ──publisher──> SourcePolicy
Claim ──derivation.inputs──> Claim (stated)
FeatureTab *─* HealthcareScenario
StoryBeat / DeepSection body ──[[term]]──> GlossaryTerm
StoryBeat / DeepSection / scenario text ──{{claim-id}}──> Claim
StoryBeat / DeepSection body ──{{ref:reference-id}}──> Reference (background reading only, never for numbers)
FeatureTab.sceneId ──> scene module (contracts/scene-module.md)
StoryBeat.sceneState ──> a state name that scene module declares
```

## Validation rules (enforced by `scripts/validate-content.mjs`)

1. All ids unique within their collection; tab `order` values 1–11 contiguous.
2. Every `[[term]]`, `{{claim-id}}`, `{{ref:id}}`, `claimIds`, Generation `referenceIds`,
   `scenarioIds`, claim `sources[].referenceId`, derivation input, and Generation id resolves.
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
13. Source policy: every Reference `publisher` exists in `source-policy.json`, its `tier` matches,
    its `url` host matches one of the publisher's `domains`, and Tier 2 peer-reviewed references
    have a DOI `identifier`.
14. Claim sources: every claim has ≥ 1 source with a non-empty `locator`; `technical` claims have
    ≥ 1 Tier 1 source; `context` claims have ≥ 1 Tier 1 or Tier 2 source; `excerpt` ≤ 50 words.
15. Derivations: every `derived` claim names a formula exported by `scripts/derivations.mjs` and
    inputs that are `stated` claims; recomputing from the inputs' values reproduces `value`
    within `rounding`.
16. Figure–claim agreement: every non-null KeyFigure value has a `claimIds` entry whose claim
    `value`/`unit` equal the displayed value; `illustrative` claims are never attached to a
    displayed number.
17. Uncited numbers: in beat `heading`, `body`, `bottomLine`, `deepDive`, section `body`,
    `sceneDescription`, and scenario text, any number with a unit or percent sign (e.g., `46 Gbps`,
    `320 MHz`, `20%`, `60 W`, `5.925 GHz`) must share its sentence with a `{{claim-id}}` citation;
    exemptions (generation names such as "Wi-Fi 7", IEEE identifiers such as "802.11be", the band
    names "2.4 GHz", "5 GHz" and "6 GHz", beat numbering) come from one explicit pattern list in the validator.
18. Orphans: every claim is used (cited, attached to a figure, or a derivation input) — warning
    normally, error in release.
19. Verification (release only): every claim has `verifiedOn` and `verifiedBy`; `verifiedOn` is no
    more than `maxVerificationAgeDays` before the build date; a claim whose source has
    `status: "superseded"` has a `verification.notes` reason.

**Draft vs release**: tabs with `draft: true` skip rules 3, 9, 11 and 17. The minimum counts (≥ 2
keyFigures, ≥ 1 scenarioId, 2–3 headline figures), orphan references and claims (rules 10, 18)
and verification (rule 19) are enforced only in release mode (`--release`), so stories can be
built in order (US2 content before US3 figures and US4 scenarios) without breaking
`npm run validate`. Rules 13–16 always apply. Release mode also errors on any remaining `draft`.

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
