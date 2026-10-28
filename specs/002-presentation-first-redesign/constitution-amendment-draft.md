# Draft: Constitution Amendment 1.3.0

**Status**: Applied 2026-10-27 to `.specify/memory/constitution.md` (v1.3.0). This file keeps the Sync Impact Report for review history.
**Applies via**: `/speckit-constitution` (task T001), once approved.
**Proposed version**: 1.2.0 → **1.3.0** (MINOR)

## Reason for the change

Feature 002 delivers the explainer as a live, clicker-driven talk in which each feature is a
**chapter** of one continuous presentation rather than a separate tab. The constitution currently
ties the story structure, comparisons, scenes, accessibility and coverage rules to "tabs", and
Principle VI names the WAI-ARIA *tabs* pattern specifically. Without amendment, removing the
tablist would violate the letter of Principles II, IV, V and VI even though their intent (one
feature per self-contained part, the same five-part arc, comparisons, lazy scenes, keyboard
access) is fully kept.

## Why MINOR, not MAJOR

No principle is removed or redefined: every rule keeps its intent and strength. The change
generalises "tab" to "chapter" (defined to include tabs) and widens one accessibility rule from a
single ARIA pattern to "the WAI-ARIA pattern appropriate to the navigation used". Under the
governance rules this is "materially expanding guidance", which is MINOR. It is more than PATCH
because it changes what a compliant navigation design may be.

## Changes

A new definition is added at the start of Principle II, then "tab" becomes "chapter" wherever the
rule is about story structure rather than a specific widget.

| Line | Current | Proposed |
|------|---------|----------|
| II (new, first bullet) | — | **Chapter**: a self-contained part of the explainer covering one topic. A chapter MAY be presented as a tab or as a chapter of a continuous talk; the rules below apply either way. |
| 35 | Each feature MUST live on its own tab, and each tab MUST follow the same narrative arc: | Each feature MUST have its own chapter, and each feature chapter MUST follow the same narrative arc, expressed through its steps, on-screen captions, hotspots, animation and supporting notes: |
| 47 | Jargon MUST be defined at first use on each tab. | Jargon MUST be defined at first use in each chapter, on screen (for example by a caption or hotspot), not only in supporting notes. |
| 50 | …build a mental model tab by tab. | …build a mental model chapter by chapter. |
| 54 | Every feature tab MUST anchor to… | Every feature chapter MUST anchor to… |
| 67 | Each feature tab MUST explicitly compare… | Each feature chapter MUST explicitly compare… |
| 70 | …same color per generation across all tabs). | …same color per generation across all chapters). |
| 72 | …the tab MUST state that origin… | …the chapter MUST state that origin… |
| 82 | Each tab's scene MUST support a before/after… | Each chapter's scene MUST support a before/after… |
| 86–87 | Scenes MUST be lazy-initialized per tab and disposed (…) when a tab is left. | Scenes MUST be lazy-initialized per chapter and disposed (…) when the chapter is left; transitions between chapters MUST NOT keep more than one scene alive at a time. |
| 94 | …keyboard-operable tabs (WAI-ARIA tabs pattern), … | …keyboard-operable navigation using the WAI-ARIA pattern appropriate to the control (for example tabs, disclosure menu), presentation-clicker keys for stepping, … |
| 101 | …initial load (before first tab scene)… | …initial load (before the first chapter's scene)… |
| 138 | …each item below MUST have its own tab following Principle II: | …each item below MUST have its own chapter following Principle II: |
| 148–149 | Additional tabs MAY be added… An overview/introduction and a references section are expected in addition to feature tabs. | Additional chapters MAY be added… An overview/introduction and a references section are expected in addition to feature chapters. |
| 168 | …before a tab is considered done… | …before a chapter is considered done… |
| 175 | **Story gate**: each tab MUST demonstrably contain… | **Story gate**: each feature chapter MUST demonstrably contain… |

Two additions are worth calling out:

- **Line 47** now says the definition must be **on screen**. Moving text into a closed Notes drawer
  must not become a way around defining jargon for the room. This matches spec FR-017.
- **Lines 86–87** add the "one scene alive at a time" rule. It records the feature 002 design
  decision (research P4) so later work keeps the performance and memory model.

Unchanged: Principles I, III, VII and VIII and all NON-NEGOTIABLE wording.

## Sync Impact Report (to embed as an HTML comment at the top of the constitution)

```text
Version change: 1.2.0 → 1.3.0 (MINOR)
Modified principles:
  - II. Teach by Telling a Story — adds "chapter" definition; tab → chapter; jargon must be
    defined on screen
  - III. Healthcare-Grounded Context — tab → chapter (wording)
  - IV. Generational Comparison — tab → chapter (wording)
  - V. Purposeful 3D Animation — tab → chapter; one scene alive during transitions
  - VI. Accessible & Performant by Default — WAI-ARIA tabs pattern → pattern appropriate to the
    navigation; clicker keys; first chapter wording
Modified sections:
  - Content & Technology Constraints — required coverage per chapter
  - Development Workflow & Quality Gates — accuracy and story gates per chapter
Added sections: none
Removed sections: none
Templates requiring updates:
  ✅ .specify/templates/plan-template.md — no tab-specific wording (checked)
  ✅ .specify/templates/spec-template.md — no tab-specific wording (checked)
  ✅ .specify/templates/tasks-template.md — no tab-specific wording (checked)
  ⚠ specs/001-wifi7-healthcare-explainer/contracts/ui-navigation.md — add superseded note (task T079)
Follow-up TODOs: none
Reason: Feature 002 presents features as chapters of a clicker-driven talk; rules keep their
intent but must not depend on a tablist widget.
```

**Dates on apply**: Ratified 2026-10-26 (unchanged) · Last Amended = date applied.
