# Implementation Plan: Refocused, Simpler Wi-Fi 7 Talk for a Cisco Session

**Branch**: `003-cisco-refocus` | **Date**: 2026-11-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-cisco-refocus/spec.md`

## Summary

Shorten and simplify the 002 talk into seven chapters: intro, New Spectrum, Data Rates (new), MLO,
TWT, Security, closing. Every feature chapter tells a Wi-Fi 6 → 6E → 7 story in about three
plain-language steps. Technical-depth content is deleted, not hidden. Sources stay Tier 1 for
standards figures. A new `cisco` publisher and `platform` claim kind allow Cisco public
documentation for Cisco platform features (AFC standard power, MLO and Wi-Fi 7 security behavior
on Cisco networks), with no hardware models. That requires a MAJOR constitution amendment and a
denylist change with a model-number check. Density and Latency are removed; a new `rates` scene
reuses the highway kit. Details: [research.md](./research.md).

## Technical Context

**Language/Version**: JavaScript (ES2022), HTML5, CSS; Node.js ≥ 20 tooling (developed on Node 24).
Unchanged.

**Primary Dependencies**: three 0.186.1 (runtime); esbuild, @playwright/test, @axe-core/playwright
(dev). **No new dependencies.**

**Storage**: Static JSON content bundled at build time. Unchanged.

**Testing**: `node --test` (content validation: new rules for Cisco sources, platform claims,
model-number pattern, no technical-depth fields, 2–4 feature steps); Playwright in Chromium only
(talk path, comparison switch, hotspots, fallback, a11y, layout overlap).

**Target Platform**: Laptop driving a 16:9 projector, Chrome or Edge; `file://` single-file build.

**Project Type**: Static single-page web application.

**Performance Goals**: As 002 (first slide < 3 s, transitions ≤ 2.5 s).

**Constraints**: As 002 (offline, CSP, no network). New: no Cisco hardware model names or numbers
in any audience-visible string; Cisco references must be `access: "open"`.

**Scale/Scope**: 7 chapters on the clicker path, ≤ 22 steps (about 15 feature steps), ≤ 3 key
figures per chapter; 2 scenes removed, 1 added; about 6 Cisco references and 8–12 new claims.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / constraint | Status | Notes |
|---|---|---|
| I. Vendor neutrality & accuracy (NON-NEGOTIABLE) | **Violates as written; amendment required** | Naming Cisco and citing Cisco docs conflicts with "MUST NOT name… any equipment vendor" and the vendor-material ban. The presenter asked for this (spec FR-017–FR-019). Plan: constitution 4.0.0 (MAJOR) before any content change; accuracy and provenance rules are kept and tightened (FR-014). |
| II. Plain language first, narrative arc | Pass | The arc stays; steps may cover several arc parts. Technical depth "always shown after the plain core" becomes "not shown": amend the wording in 4.0.0. |
| Required feature coverage | **Changes; amendment required** | New list: new spectrum, data rates, MLO, TWT, security. Density removed. |
| Provenance for every claim | Pass | Unchanged; Cisco claims carry the same fields plus `access: "open"`. |
| Accessibility, reduced motion, fallback | Pass | Unchanged requirements; new scene must supply stills and descriptions. |
| Technology (three.js pinned, no framework) | Pass | No new dependencies. |
| Visual identity neutral | Pass | No Cisco branding (FR-018). |

**Gate result**: proceed, on condition that the constitution amendment (task 1) lands first. Logged
in Complexity Tracking.

**Post-design re-check**: the data model and contracts below keep standards figures Tier 1-only and
confine Cisco to `platform` claims, so accuracy is not weakened. Gate still passes with the
amendment.

## Project Structure

### Documentation (this feature)

```text
specs/003-cisco-refocus/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── chapter-lineup.md    # chapters, steps, comparison generations
│   └── sources-and-claims.md # Cisco publisher, platform claims, naming rules
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
.specify/memory/constitution.md      # 4.0.0 amendment
content/
├── tabs/01-overview.json            # trimmed; peak rates move to data rates
├── tabs/02-6ghz-320mhz.json         # 3 steps, AFC standard power
├── tabs/03-data-rates.json          # NEW
├── tabs/04-mlo.json                 # 3 steps, Wi-Fi 6E vs 7
├── tabs/05-twt.json                 # 3 steps, reordered ahead of security
├── tabs/06-security.json            # 3 steps, 6 → 6E → 7
├── tabs/07-closing.json             # new recap + follow-up topics
├── tabs/08-references.json
├── claims.json, references.json, glossary.json, scenarios.json
└── source-policy.json               # + cisco publisher, platform kind
src/
├── scenes/rates.js                  # NEW (highway kit)
├── scenes/{spectrum,mlo,twt,security,overview}.js  # fewer states; no Wi-Fi 5 compare
├── scenes/{density,latency}.js      # DELETED
├── app/{caption,hotspots,story,figures,view}.js    # drop technical-depth rendering
└── main.js, app/content.js          # scene and tab lists
scripts/
├── validate-content.mjs             # rules: cisco sources, platform claims, model pattern,
│                                    #   no depth fields, 2–4 feature steps, 7 chapters
└── talk-track.mjs                   # no "Technical depth" lines
tests/
├── content/denylist.txt             # remove Cisco, Meraki; add model patterns file
├── content/*.test.mjs               # new rule tests
└── e2e/*.spec.js                    # chapter counts, removed chapters, comparison options
docs/talk-track.md, docs/provenance-report.md, docs/fact-check.md   # regenerated / extended
```

**Structure Decision**: Same single static web app as 002; changes are content, one scene, the
validator and small renderer removals.

## Phases (for /speckit-tasks)

1. **Governance**: constitution 4.0.0; source policy (`cisco` publisher, `platform` kind);
   denylist and model-pattern check; validator rule changes with tests.
2. **Sources**: add Cisco references (R1); read the TWT guide and the WPA3 Specification's Wi-Fi 7
   section; add platform claims and any missing Tier 1 Wi-Fi 7 security claims.
3. **Removal**: delete Density and Latency (tabs, scenes, scenarios, orphan claims); renumber;
   remove depth fields and renderers.
4. **Chapters**: rewrite spectrum, MLO, TWT, security to 3 steps each; build Data Rates with the
   `rates` scene; update intro and closing (follow-up topics).
5. **Verify**: fact-check every claim used (Cisco links open without login); release validation;
   unit and Chromium tests; layout audit (Verdana and Segoe UI).
6. **Outputs**: talk track and provenance report; rebuild the Claude Doc.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle I vendor neutrality relaxed for Cisco | The session is Cisco-focused and the presenter asked to cite Cisco public documentation and name Cisco platform features | Keeping the talk vendor-neutral would ignore the presenter's explicit requirement; citing Cisco only for standards facts would weaken accuracy (R2) |
| Required coverage list changed | Presenter's new scope adds data rates and drops density | Keeping density would contradict "simplify" and the five requested features |
