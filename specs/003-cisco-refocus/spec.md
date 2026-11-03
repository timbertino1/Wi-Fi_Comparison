# Feature Specification: Refocused, Simpler Wi-Fi 7 Talk for a Cisco Session

**Feature Branch**: `003-cisco-refocus`

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "Refocus the Wi-Fi 7 healthcare presentation (builds on feature 002) for a mixed, non-specialist audience at a Cisco-focused session. Goal: set the stage for future, deeper discussions, not go deep in the weeds. Highlight enhancements since Wi-Fi 6 and call out the benefits of Wi-Fi 7. Keep the healthcare focus and the existing intro and closing chapters. Feature chapters: new spectrum in Wi-Fi 6E and 7, data rate increases since Wi-Fi 6, MLO, Target Wake Time, and security enhancements since Wi-Fi 6. Simplify. Accuracy is key: standards sources plus Cisco public-facing documentation only. Name Cisco Wi-Fi features that exist across the platform, never specific Cisco models. Citations stay in the side panel."

## User Scenarios & Testing *(mandatory)*

### Primary audience

A mixed hospital audience at a Cisco-focused session: clinical and operational leaders, IT and
facilities staff, and a few network engineers. Most are not Wi-Fi specialists. The talk's job is to
explain, in plain language, what has improved since Wi-Fi 6 and why Wi-Fi 7 matters to a hospital,
so the audience asks for deeper follow-up sessions. It is not the place to teach the standard in
detail.

This feature builds on feature 002 (presentation-first slides, clicker, chapter openers, talk
track). Everything in 002 that this spec does not change still applies.

### User Story 1 - Deliver a shorter, simpler talk from the clicker (Priority: P1)

The presenter clicks through seven chapters: the existing intro ("Why Wi-Fi 7, and why now"), five
feature chapters (new spectrum, data rates, multi-link operation, Target Wake Time, security), and
the existing closing ("Bringing it together"). Each feature chapter has about three steps, each
told in plain language with an animation, a short caption and a simple side panel. There are no
technical-depth sections to skip past.

**Why this priority**: The presenter found the current talk too long and too technical to explain.
A shorter, plainer talk is the core of this change.

**Independent Test**: Click Next from the first step to the end of the closing chapter. Count the
chapters and steps, and check that no slide or side panel shows a technical-depth section, deep
dive or technical caption line.

**Acceptance Scenarios**:

1. **Given** the talk is open at its start, **When** the presenter clicks through to the end,
   **Then** the chapters appear in this order: intro, new spectrum, data rates, multi-link
   operation, Target Wake Time, security, closing.
2. **Given** any feature chapter, **When** the presenter steps through it, **Then** it has 2–4
   steps (3 by default), and each step's caption and side panel use plain language.
3. **Given** the chapter menu, **When** it is opened, **Then** the Client Density, Latency and
   4K-QAM chapters are not listed, and References and the glossary are still reachable.

---

### User Story 2 - Each chapter shows what changed since Wi-Fi 6, accurately (Priority: P1)

For every feature, the audience sees a clear Wi-Fi 6 → Wi-Fi 6E → Wi-Fi 7 story: what each
generation added, and the benefit Wi-Fi 7 brings to the hospital. Where a generation added
nothing, the slide says so instead of implying a change.

**Why this priority**: Accuracy is the presenter's top concern. The original request framed MLO and
TWT as "enhanced from Wi-Fi 6E to 7", which is not quite right, so the lineage must be stated
precisely.

**Independent Test**: For each feature chapter, read the comparison step and the side panel's
"since Wi-Fi 6" summary, and check each generation's entry against its cited source.

**Acceptance Scenarios**:

1. **Given** the spectrum chapter, **When** it is shown, **Then** it says Wi-Fi 6E opened the 6 GHz
   band and Wi-Fi 7 added 320 MHz channels in that band, with regional availability noted.
2. **Given** the data rates chapter, **When** it is shown, **Then** it compares peak rates for
   Wi-Fi 6/6E and Wi-Fi 7, names the main reasons for the increase in plain words, and states that
   peak rates are theoretical maximums, not what a device will see on a hospital floor.
3. **Given** the multi-link operation chapter, **When** it is shown, **Then** it says a Wi-Fi 6 or
   6E device uses one band at a time, and multi-link operation is new in Wi-Fi 7.
4. **Given** the Target Wake Time chapter, **When** it is shown, **Then** it says TWT arrived with
   Wi-Fi 6, Wi-Fi 6E did not change it, and Wi-Fi 7 adds optional Restricted TWT.
5. **Given** the security chapter, **When** it is shown, **Then** it separates what came with
   Wi-Fi 6 (WPA3 required for certification), what Wi-Fi 6E requires in 6 GHz (WPA3 or Enhanced
   Open, with management-frame protection, and no legacy security), and what Wi-Fi 7 adds.

---

### User Story 3 - Every fact is sourced from standards or Cisco public documentation (Priority: P1)

Any figure or factual statement can be traced from the side panel to its source. Standards facts
come from standards bodies and regulators. Cisco platform features and deployment guidance come
from Cisco's public-facing documentation. Citations appear in the side panel, never in the
animation.

**Why this priority**: The session is Cisco-focused and the audience includes engineers who may
check figures. A wrong or unsourced fact would undermine the talk.

**Independent Test**: Open the provenance report and confirm that every claim used by the talk has
a source of an allowed kind, a publicly reachable link, and a location in that source.

**Acceptance Scenarios**:

1. **Given** any figure on a slide, **When** the presenter opens its citation in the side panel,
   **Then** it shows the source, the location in that source, and how the value was obtained.
2. **Given** a claim about a Cisco feature, **When** its source is checked, **Then** the source is a
   Cisco page or document that opens without a login, partner portal or paywall.
3. **Given** a standards figure (data rate, channel width, frequency range, security
   requirement), **When** its source is checked, **Then** it comes from IEEE, the Wi-Fi Alliance, a
   regulator, or another Tier 1 body, even if a Cisco document also states it.

---

### User Story 4 - Cisco platform features where they help the story (Priority: P2)

Where a Cisco Wi-Fi feature that works across Cisco's wireless platform helps explain a benefit,
the slide or side panel names it, for example a Cisco feature that manages 6 GHz or multi-link
behavior. No slide names a specific hardware model, and no wording is promotional.

**Why this priority**: It makes the talk relevant to a Cisco session, but the talk still works
without it.

**Independent Test**: Search all audience-visible text for Cisco hardware model numbers and
marketing language; find none. Check each named Cisco feature against its public source.

**Acceptance Scenarios**:

1. **Given** a chapter that names a Cisco feature, **When** the side panel is read, **Then** the
   feature is described in plain words, cited to Cisco public documentation, and not presented as
   better than other vendors.
2. **Given** all audience-visible text, **When** it is searched, **Then** no Cisco access point,
   controller or switch model name or number appears.

---

### User Story 5 - The talk track and editable doc follow the new scope (Priority: P2)

The generated talk track and the editable talk-track document match the new seven-chapter talk,
with a simple "Say" line per step and likely questions answered in plain language. Questions that
need a deep answer are marked as follow-up topics.

**Why this priority**: The presenter rehearses from the doc; it must match the slides.

**Independent Test**: Regenerate the talk track and compare its chapters and steps with the slides.

**Acceptance Scenarios**:

1. **Given** a content change, **When** the site is built, **Then** the talk track matches the
   slides exactly.
2. **Given** the closing chapter, **When** it is shown, **Then** it lists suggested topics for
   deeper follow-up discussions.

---

### Edge Cases

- A Cisco document and a standard disagree on a figure: the standard's figure is used, and the
  difference is noted in the claim record.
- A Cisco page moves or goes behind a login: the claim fails the fact-check and must be re-sourced
  before release.
- A Cisco feature exists only on some platforms or software releases: it is either not named, or
  named with that limitation stated in the side panel.
- Regional differences (6 GHz availability, standard power versus low-power indoor): the slide
  gives the hospital-relevant point, and the side panel names the regions that differ.
- An audience member asks a deep technical question: the likely-questions list gives a short
  answer and marks it as a follow-up topic.
- No-WebGL fallback: still images, captions and side panels still cover all seven chapters.

## Requirements *(mandatory)*

### Functional Requirements

**Scope and order**

- **FR-001**: The talk MUST consist of, in order: the intro chapter, New Spectrum (Wi-Fi 6E and
  Wi-Fi 7), Data Rates, Multi-Link Operation, Target Wake Time, Security, and the closing chapter.
  References and the glossary MUST remain reachable from the chapter menu but stay off the
  clicker path.
- **FR-002**: The Client Density and Latency chapters MUST be removed, with their scenes, steps,
  scenarios and any claims no other chapter uses.
- **FR-003**: A new Data Rates chapter MUST compare Wi-Fi 6/6E and Wi-Fi 7 peak data rates, explain
  the main reasons for the increase in plain words (wider channels, denser data per transmission,
  more links at once), and state clearly that peak rates are theoretical. It MUST give a
  hospital-relevant benefit, such as faster imaging transfers or more headroom at busy times.
- **FR-004**: The intro and closing chapters MUST be kept, with their healthcare framing, and
  updated to match the new chapter list. The closing MUST end with suggested follow-up topics.

**Comparing generations since Wi-Fi 6**

- **FR-005**: Each feature chapter MUST include one step that compares Wi-Fi 6, Wi-Fi 6E and
  Wi-Fi 7, stating for each what it added or that it changed nothing.
- **FR-006**: ~~The generation comparison switch MUST offer Wi-Fi 6, Wi-Fi 6E and Wi-Fi 7.~~ Wi-Fi 5
  comparisons MUST be removed from the slides. *Changed 2026-11-03 at the presenter's request (the buttons "might just be a distraction at
  this point"):* there is no generation switch and no `G` key. Each chapter shows its default
  earlier generation (`defaultCompare`): Wi-Fi 6E in chapters 2–4, Wi-Fi 6 in chapter 5. Old
  `gen=` links are ignored.
- **FR-007**: These attributions MUST be stated, each with a source:
  - 6 GHz: opened by Wi-Fi 6E; Wi-Fi 7 adds 320 MHz channels.
  - Multi-link operation: new in Wi-Fi 7; Wi-Fi 6/6E devices use one link at a time.
  - Target Wake Time: introduced with Wi-Fi 6; unchanged by Wi-Fi 6E; Wi-Fi 7 adds optional
    Restricted TWT.
  - Security: WPA3 required for Wi-Fi 6 certification; Wi-Fi 6E requires WPA3 or Enhanced Open with
    management-frame protection in 6 GHz and no legacy security; Wi-Fi 7 adds its own
    certification security requirements.

**Simplification**

- **FR-008**: Feature chapters MUST have 2–4 steps (3 by default) while keeping the narrative arc
  of constitution Principle II; one step MAY cover several parts of the arc.
- **FR-009**: The technical-depth sections, deep dives and the caption's technical line MUST be
  removed from slides, side panels and hotspots. The side panel holds plain-language points, up to
  three key figures per chapter, and citations.
- **FR-010**: Captions MUST keep 002's word limits (headline ≤ 8 words, takeaway ≤ 16 words), and
  every jargon term MUST still be defined on screen or in a hotspot.
- **FR-011**: Likely questions MUST have plain-language answers. A question whose full answer needs
  technical depth MUST be marked as a follow-up topic.

**Sources and accuracy**

- **FR-012**: Every figure and factual statement MUST be recorded as a claim with its source, the
  location in that source, how the value was obtained, and a verification date, as 001 and 002
  require.
- **FR-013**: Allowed sources are Tier 1 standards bodies and regulators (IEEE, Wi-Fi Alliance,
  IETF, FCC, ECC/CEPT, ETSI, ISED, Ofcom, NIST) and Cisco public-facing documentation (pages and
  documents on Cisco's site that open without a login, partner access or paywall). Tier 2 sources
  remain allowed for healthcare context only. Every other source, including other vendors, blogs,
  news, forums, Wikipedia and AI-generated text, MUST NOT be cited.
- **FR-014**: Standards figures MUST be sourced from Tier 1. Cisco documentation MAY be the source
  for Cisco platform features and deployment guidance, and MAY corroborate a standards figure, but
  MUST NOT be its only source.
- **FR-015**: Citations MUST appear in the side panel, hotspot cards and References, never inside
  the animation.
- **FR-016**: Before release, every claim MUST pass a fact-check against its readable source, and
  every Cisco link MUST be confirmed to open publicly.

**Cisco content**

- **FR-017**: The talk MAY name Cisco Wi-Fi features that are available across Cisco's wireless
  platform. It MUST NOT name or show specific Cisco hardware models, model numbers or product SKUs,
  and MUST NOT use marketing or comparative claims against other vendors.
- **FR-018**: The visual identity MUST stay as it is (neutral palette, no Cisco logos or brand
  styling).

**Governance and outputs**

- **FR-019**: The constitution MUST be amended (MAJOR) so that Principle I allows Cisco
  public-facing documentation as a source and Cisco platform features to be named under FR-017, and
  so that the required feature coverage becomes: new spectrum (6 GHz and 320 MHz), data rates,
  multi-link operation, Target Wake Time, and security.
- **FR-020**: The talk track and the editable talk-track document MUST be updated to match the new
  talk, as 002 requires.
- **FR-021**: All other 002 requirements (clicker, chapter openers, transitions, hotspots,
  accessibility, no-WebGL fallback, single-file build) MUST continue to hold. Testing targets
  Chromium-based browsers (Chrome and Edge) only.

### Key Entities

- **Chapter**: one of the seven chapters, with an opener, 2–4 steps, a "since Wi-Fi 6" summary and
  up to three key figures.
- **Generation**: Wi-Fi 6, Wi-Fi 6E or Wi-Fi 7, each with its standard or certification name.
- **Claim**: a fact or figure with its source, location, method, verification date and, for Cisco
  sources, confirmation that the link is public.
- **Source**: a reference with a tier: Tier 1 standards or regulator, Cisco public documentation,
  or Tier 2 healthcare context.
- **Cisco feature mention**: a named Cisco platform feature, its plain-language description and its
  Cisco public source.
- **Follow-up topic**: a deeper subject flagged in likely questions and listed in the closing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The talk has exactly 7 chapters on the clicker path and at most 22 steps (chapter openers
  not counted).
- **SC-002**: The full talk can be delivered in 20–25 minutes at a comfortable pace in rehearsal.
- **SC-003**: 100% of claims used by the talk come from an allowed source, and 100% of Cisco links
  open without a login when checked.
- **SC-004**: The fact-check finds 0 errors in generation attributions (FR-007) and peak-rate
  figures.
- **SC-005**: 0 Cisco hardware model names or numbers appear in audience-visible text.
- **SC-006**: 0 technical-depth sections, deep dives or technical caption lines remain.
- **SC-007**: In a rehearsal with a non-specialist listener, they can state one hospital benefit of
  Wi-Fi 7 for each of the five features.
- **SC-008**: Release validation, unit tests and the Chromium test suite all pass.

## Assumptions

- The side panel's depth defaults to plain language plus citations (the presenter did not choose a
  depth level; this matches "not deep in the weeds" and "simplify").
- "Since Wi-Fi 6" means Wi-Fi 5 drops out of the comparisons.
- Existing scenes for spectrum, multi-link operation, TWT and security are reused and simplified;
  the Data Rates chapter needs a new scene in the same concrete-metaphor style as the others.
- Peak-rate figures already signed off (for example the Wi-Fi 7 single-link peak of 23.1 Gbps with
  8 spatial streams) are reused; denser modulation (4096-QAM) returns only as a plain-language
  reason for higher rates, not as its own chapter.
- Cisco public documentation means content on Cisco's public website (white papers, configuration and
  deployment guides, at-a-glance pages; not model data sheets) that
  opens without signing in.
- No Cisco logos or brand styling are used; the presenter has not asked for them.
- The talk length target (20–25 minutes) is an estimate to be confirmed in rehearsal.
- The presenter signs off claims, as in 002.
