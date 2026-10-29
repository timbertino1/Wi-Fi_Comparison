# Feature Specification: Presentation-First Redesign

**Feature Branch**: `002-presentation-first-redesign`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Presentation-first redesign of the Wi-Fi 7 healthcare explainer. The explainer will be delivered live on a 16:9 projector, driven by a presentation clicker, to a mixed clinical-leadership and technical audience. Make the 3D animations and storytelling the focal point and remove the dense side text column. Full-width stage with short captions that fade in at the right moment; tooltip hotspots on 3D objects; one Next/Back control for the whole talk; chapter-to-chapter transitions (camera move out, crossfade, camera move in, with the access point as a shared anchor); animated before/after comparisons kept in every chapter; Leadership/Technical as a depth toggle on the slide; all current text preserved in a talk-track document generated from content and also published as an editable doc; optional presenter view. Existing guarantees (vendor neutrality, provenance, reduced motion, no-WebGL fallback, WCAG 2.2 AA, static delivery, CSP) must be kept."

## User Scenarios & Testing *(mandatory)*

### Primary audience

- **Presenter**: a network or biomed lead who delivers the explainer live in a conference room on a
  16:9 projector, advancing with a handheld clicker, and speaks the detail from a talk track.
- **Room audience**: clinical leadership and technical staff together, watching the projected
  screen from up to the back of a typical conference room. They read little; they watch.

This feature builds on feature 001. Everything 001 guarantees about facts, sources, neutrality,
accessibility, offline use and security continues to apply unless this spec says otherwise.

### User Story 1 - Deliver the whole talk from a clicker, animation first (Priority: P1)

The presenter opens the explainer on the projector and walks the room through the entire story
using only a clicker. Each click advances the animation to its next moment; a short caption fades
in to name what the audience is seeing. After a chapter's last step, the next click carries on into
the next chapter. There is no side column of text to read.

**Why this priority**: This is the delivery format. Without it, nothing else in this feature
matters.

**Independent Test**: On a 16:9 display, use only a clicker (or Right/Left, Page Up/Page Down,
Space) to go from the first step of the opening chapter to the last step of the final chapter and
back, without touching a mouse.

**Acceptance Scenarios**:

1. **Given** the explainer is open on a 16:9 display, **When** the presenter views any step,
   **Then** the animation occupies the slide area and no more than two short lines of caption text
   (plus labels and markers in the scene) are visible.
2. **Given** a step is shown, **When** the presenter presses Next, **Then** the animation advances
   to the next step and that step's caption fades in at the moment its subject appears in the
   animation, not before.
3. **Given** the last step of a chapter is shown, **When** the presenter presses Next, **Then** the
   explainer moves into the next chapter's first step without any other action.
4. **Given** any step, **When** the presenter presses Back, **Then** the previous step (or the last
   step of the previous chapter) is shown in its settled state.
5. **Given** any step, **When** the audience looks at the screen, **Then** a slim indicator shows
   the current chapter and progress through the talk.

---

### User Story 2 - Meaningful transitions between chapters (Priority: P1)

The story opens with why Wi-Fi 7 matters to a hospital, then moves into each feature. Moving from
one chapter to the next feels like one continuous story: the view pulls back from the current
scene, crossfades, and settles into the next scene, with the ceiling access point carried across
as the familiar anchor.

**Why this priority**: The user asked for "nice, meaningful transitions"; hard cuts between
unrelated scenes break the story for a live audience.

**Independent Test**: Step across every chapter boundary in order and confirm each one uses the
pull-back, crossfade, settle sequence with the access point visible on both sides of the
transition.

**Acceptance Scenarios**:

1. **Given** the last step of a chapter, **When** the presenter presses Next, **Then** the view
   moves out from the current scene, crossfades to the next chapter's scene, and moves in to its
   first step, finishing within 2.5 seconds.
2. **Given** a chapter transition, **When** it plays, **Then** an access point is visible before,
   during and after the crossfade in a consistent position or motion path.
3. **Given** a transition is in progress, **When** the presenter presses Next or Back again,
   **Then** the transition completes immediately (skips to its end) and the new press is applied,
   with no stuck or blank frames.
4. **Given** reduced motion is requested, **When** the presenter changes chapter, **Then** the
   camera moves are replaced by a short, plain crossfade or an instant change.

---

### User Story 3 - See each improvement against earlier Wi-Fi (Priority: P1)

Every feature chapter includes a step where the audience watches the earlier generation struggle
and Wi-Fi 7 cope with the same situation, in the animation itself. The presenter can switch which
earlier generation is shown on the slide.

**Why this priority**: Generational comparison is a constitution principle (IV) and the core of the
argument to leadership.

**Independent Test**: In each feature chapter, reach the comparison step and confirm the earlier
generation and Wi-Fi 7 are both shown animating the same scenario, labelled with both naming
schemes, and that the generation switch changes the earlier generation shown.

**Acceptance Scenarios**:

1. **Given** a feature chapter's comparison step, **When** it plays, **Then** the earlier generation
   and Wi-Fi 7 are shown side by side or as a before/after in the animation, each labelled (for
   example "Wi-Fi 6E (802.11ax)" and "Wi-Fi 7 (802.11be)").
2. **Given** the comparison switch is on screen, **When** the presenter selects another earlier
   generation, **Then** the animation updates without leaving the step.

---

### User Story 4 - Answer questions from the scene with tooltip hotspots (Priority: P2)

When someone asks "what's that?" or "where does that number come from?", the presenter clicks a
small info marker on the object in the scene (for example a band, the access point, a packet or a
device). A short card opens with a plain definition, a key figure with its source, and, in
Technical depth, a technical detail line.

**Why this priority**: Hotspots replace the text column as the place where definitions, figures
and provenance live on screen, so the constitution's provenance and jargon rules stay satisfied.

**Independent Test**: In each chapter, open every hotspot, confirm each card shows its definition
and any figure with a visible source, and that it can be closed with the clicker or Escape.

**Acceptance Scenarios**:

1. **Given** a step with hotspots, **When** it is shown, **Then** each hotspot appears as a small,
   unobtrusive marker attached to its object and follows the object as it moves.
2. **Given** a hotspot, **When** it is activated by click, tap, or keyboard, **Then** a card opens
   next to the object showing a definition of no more than 30 words and, where relevant, a figure
   with its source and an "illustrative" or "up to" label as the content requires.
3. **Given** a card shows a figure, **When** the presenter opens its source, **Then** the full
   provenance (reference, location, verification) is shown, as in feature 001.
4. **Given** a card is open, **When** the presenter presses Next, Escape, or clicks elsewhere,
   **Then** the card closes; Next then advances the story on the following press.

---

### User Story 5 - Prepare and deliver from a talk track (Priority: P1)

Before the talk, the presenter reads a talk-track document that contains everything the page used
to show as text, organised by chapter and step, and annotates it with their own notes. During the
talk they can follow it step by step.

**Why this priority**: Removing text from the screen only works if none of it is lost; the user
explicitly needs it to build their talk.

**Independent Test**: Generate the talk track and confirm every piece of text from the current
content (stories, bottom lines, deep sections, key figures, scenarios, glossary, references)
appears in it exactly once in the right chapter and step, then open the editable copy and add a
note.

**Acceptance Scenarios**:

1. **Given** the content is built, **When** the talk track is generated, **Then** for each chapter
   and step it lists: what is on screen, what to say for leadership, the technical depth, the
   figures with their sources, and likely questions with answers.
2. **Given** a figure or sentence is changed in the content, **When** the explainer is rebuilt,
   **Then** the generated talk track reflects the change with no manual edit.
3. **Given** the generated talk track, **When** it is published as an editable document, **Then**
   the presenter can add their own notes there without affecting the generated file.

---

### User Story 6 - Switch depth on the slide (Priority: P2)

For a mostly technical room the presenter switches to Technical depth: captions gain a second
technical line, extra hotspots appear, and key figures show on screen at the comparison step. For
leadership it stays clean.

**Why this priority**: The same talk must serve both audiences (constitution Principle II).

**Independent Test**: Toggle depth on a step in each chapter and confirm the technical layer appears
and disappears without changing the chapter, step, or animation state.

**Acceptance Scenarios**:

1. **Given** Leadership depth, **When** a step is shown, **Then** only the plain caption and
   leadership hotspots are visible.
2. **Given** Technical depth, **When** the same step is shown, **Then** a second caption line,
   additional technical hotspots, and (on comparison steps) an on-screen figures overlay appear.
3. **Given** either depth, **When** the presenter toggles it, **Then** the place in the story and
   the animation state are unchanged.

---

### User Story 7 - Presenter view with notes (Priority: P3)

With a laptop and a projector, the presenter sees the current step's talk-track notes and the next
step's caption on the laptop while the projector shows only the slide. Both stay in step as the
clicker advances.

**Why this priority**: Valuable but optional; the printed or editable talk track already covers the
need, and it depends on the two windows being able to stay in sync when opened from a local file.

**Independent Test**: Open the presenter view from the explainer opened as a local file, advance
with the clicker, and confirm both windows show the same step.

**Acceptance Scenarios**:

1. **Given** the explainer is open, **When** the presenter opens presenter view, **Then** a second
   window shows the current step's notes, the next step's caption, and the talk progress.
2. **Given** both windows are open, **When** Next or Back is pressed in either one, **Then** both
   show the same chapter and step within half a second.
3. **Given** presenter view cannot stay in sync in the current browser or when opened from a local
   file, **When** the presenter tries to open it, **Then** they are told it is unavailable and
   pointed to the talk-track document, and the main explainer is unaffected.

---

### Edge Cases

- A viewer opens the file on their own after the talk (no presenter): they step through the same
  slides and can open each step's Notes drawer for the full text (FR-021).
- The presenter clicks Next many times quickly: steps and transitions are skipped to their settled
  states in order; the story never ends up between steps.
- 3D graphics are unavailable on the presenting machine: each step shows its still image with the
  same caption and progress indicator, hotspots become numbered callouts on the still, and chapter
  changes use a plain crossfade.
- Reduced motion is requested: no auto-play, no camera moves, captions appear without animation,
  and transitions are instant or a short fade.
- The display is not 16:9 (4:3 projector, ultrawide, laptop, phone): the slide keeps its 16:9 area
  and is letterboxed or pillarboxed; on narrow screens captions move below the slide.
- A hotspot sits near the slide edge: its card opens on the side with room and is never clipped.
- A caption would exceed its length limit in content: the build fails with a message naming the
  chapter and step.
- The browser tab is hidden during the talk: animation pauses and resumes at the same step.

## Requirements *(mandatory)*

### Functional Requirements

**Slide layout and captions**

- **FR-001**: Every chapter step MUST be presented as a 16:9 slide in which the animation is the
  dominant element; on a 16:9 display the slide MUST fill the viewport apart from a slim progress
  indicator and the on-slide controls.
- **FR-002**: The side text column of feature 001 (story text, bottom line, deep sections, "what
  the animation shows", key-figures table, scenario panel) MUST NOT be shown on the slide; that text
  is available only in the closed-by-default Notes drawer (FR-021) and the talk track.
- **FR-003**: Each step MUST have a caption consisting of a headline (≤ 8 words) and a takeaway
  line (≤ 16 words), maintained in content. The build MUST reject captions over these limits.
- **FR-004**: A step's caption MUST appear when the animation reaches the moment it describes,
  using a short fade, and MUST be readable from the back of a typical conference room on a 16:9
  projector (at least the size defined for presentation mode in feature 001).
- **FR-005**: A slim indicator MUST show the current chapter (by name) and progress through the
  talk at all times.
- **FR-005a**: A step MAY declare a callout: a short titled card (≤ 6-word title, 2–4 points of
  ≤ 14 words each) that slides in after the caption to carry context the presenter wants on screen.
  It closes on the next step, follows the same sourcing rules as captions, and appears at once with
  reduced motion. *(Added 2026-10-28 from the presenter's review of chapters 1–2: "pop up some text",
  "more text is fine".)*

**Navigation**

- **FR-006**: A single Next/Back pair MUST step through every step of every chapter in story order,
  crossing chapter boundaries automatically. Clicker keys (Right/Left, Page Down/Page Up, Space,
  Shift+Space), on-screen buttons, and touch MUST all drive it.
- **FR-007**: The separate step-number buttons and the tab-level previous/next pager of feature 001
  MUST be removed. Direct jumps to a chapter MUST remain available through a compact chapter menu
  and through a shareable address for each chapter and step.
- **FR-008**: Pressing Next or Back during an animation or transition MUST settle it immediately
  and then apply the press, so the story is always in a defined step.
- **FR-009**: Play/pause and replay for the current step MUST remain available (constitution
  Principle V) but MUST NOT be required to deliver the talk.

**Story flow and transitions**

- **FR-010**: The talk MUST open with the "why Wi-Fi 7 matters to healthcare" chapter, then proceed
  through the feature chapters in the order of feature 001, then "What's next" (Wi-Fi 8). References
  and the glossary MUST remain reachable from the chapter menu but are not part of the clicker path.
- **FR-011**: Moving between chapters MUST use a transition of: the view moving out from the current
  scene, a crossfade to the next scene, and the view moving in to the first step, completing within
  2.5 seconds.
- **FR-011a**: Each chapter MUST open with a chapter opener, its own click in the talk: after the
  transition's move-out and crossfade, a title card over the chapter's wide shot shows the chapter
  number, a tag (Wi-Fi 7 feature, Why it matters, or What's next), the chapter title, a one-line
  promise (≤ 10 words), the hospital problem it solves (≤ 16 words) and, for features, a lineage
  badge (New in Wi-Fi 7, or Improved in Wi-Fi 7 with the generation that introduced it). Next from
  the opener plays step 1 from the wide shot (the transition's move-in); Back from step 1 returns
  to the opener, and Back from an opener goes to the previous chapter's last step. The opener is
  deep-linkable as `#/<chapter>/1?intro`. *(Added 2026-10-28 from the presenter's feedback: "some
  sort of slide to break up the chapters, introducing the next chapter and its Wi-Fi 7 feature".)*
- **FR-012**: Each chapter's scene MUST include an access point that is visible at the end of the
  chapter and at the start of the next, so the transition reads as one continuous place.
- **FR-013**: Each feature chapter MUST keep the five-part narrative arc of constitution Principle
  II, expressed through its steps, captions and animation rather than through on-page paragraphs.

**Generational comparison**

- **FR-014**: Each feature chapter MUST include at least one step that animates an earlier
  generation and Wi-Fi 7 handling the same healthcare scenario, labelled with both Wi-Fi Alliance
  and IEEE names.
- **FR-015**: The generation comparison switch MUST stay on the slide and change the earlier
  generation shown without leaving the current step.

**Hotspots**

- **FR-016**: Steps MUST be able to declare hotspots attached to scene objects. Each hotspot MUST
  have a plain definition (≤ 30 words), MAY have a figure tied to a verified claim, and MAY have a
  technical detail line shown only in Technical depth.
- **FR-017**: Every jargon term used in a chapter's captions MUST be defined by a hotspot or caption
  in that chapter at its first use (constitution Principle II).
- **FR-018**: Any figure shown on a slide or in a hotspot MUST give access to its full provenance, as
  in feature 001, and MUST carry "up to", "theoretical", "optional" or "illustrative" labels where
  the content requires them.
- **FR-019**: Hotspots MUST be operable by mouse, touch and keyboard, and an open card MUST close on
  Escape, on Next, or on clicking elsewhere; the press that closes a card MUST NOT also advance
  the story.

**Audience depth**

- **FR-020**: The Leadership/Technical switch MUST remain on the slide. Technical depth MUST add a
  second caption line, technical hotspots, and an on-screen figures overlay on comparison steps;
  switching MUST NOT change the step or animation state.

**Viewing without a presenter**

- **FR-021**: Each step MUST offer a "Notes" drawer, closed by default, holding that step's full
  text from content (story, bottom line, deep sections, key figures, scenario) at the current
  depth, so viewers without a presenter can read the detail. Opening or closing the drawer MUST
  NOT change the step; the drawer MUST be dismissible with Escape; and its open/closed state MUST
  NOT carry over when the presenter advances, so the projected slide stays clean.

**Talk track**

- **FR-022**: The build MUST generate a talk-track document from content, organised by chapter and
  step, containing for each step: what is on screen (caption and animation description), what to
  say for leadership, technical depth, figures with sources, and likely questions with answers.
- **FR-023**: The talk track MUST include all text that feature 001 shows on the page: stories,
  bottom lines, deep sections, key figures, scenarios, glossary and references. A check MUST fail
  the build if any content text is missing from it.
- **FR-024**: "Likely questions" MUST be maintained in content, follow the same neutrality and
  provenance rules as all other copy, and be written for both audiences.
- **FR-025**: The talk track MUST be regenerated on every build so it always matches the slides.
  It MUST NOT be shipped as part of what the audience sees, but MUST be available alongside the
  build output.
- **FR-026**: The talk track MUST also be published once as an editable document that the presenter
  can annotate; regenerating the build MUST NOT overwrite the presenter's annotations.

**Presenter view (optional)**

- **FR-027**: If it can be made to work when the explainer is opened from a local file without
  network access, the explainer SHOULD offer a presenter view showing the current step's notes,
  the next step's caption and talk progress, kept in sync with the main window within 0.5 seconds.
  If it cannot, the control MUST explain this and point to the talk track.

**Kept guarantees**

- **FR-028**: All of feature 001's requirements on vendor neutrality, provenance, accessibility
  (WCAG 2.2 AA), reduced motion, no-WebGL fallback, offline and static delivery, performance,
  security and Content-Security-Policy MUST continue to hold for the new slides, captions,
  hotspots, transitions and presenter view.
- **FR-029**: The no-WebGL fallback MUST show each step's still image with its caption and progress
  indicator, and present hotspots as numbered callouts on the still.
- **FR-030**: Screen-reader users MUST receive each step's caption and a text description of the
  animation, and every hotspot's content, in reading order.

**Governance**

- **FR-031**: The constitution MUST be amended (MINOR) so that Principle II allows each feature to
  live in its own chapter of a continuous talk, with the narrative arc carried by steps, captions
  and hotspots, before this feature is merged.

### Key Entities

- **Chapter**: one part of the talk (the opening, one per feature, "What's next"); has a name, its
  scene, its steps, and the access point's position at its start and end for transitions.
- **Step**: one click in the talk; has a caption (headline, takeaway, optional technical line), the
  scene state it shows, the moment the caption appears, an optional callout, its hotspots, and its
  talk-track notes.
- **Hotspot**: an info marker on a scene object; has the object it is attached to, a definition, an
  optional claim-backed figure, an optional technical line, and the depth(s) it appears in.
- **Talk-track entry**: the speaker material for one step: on screen, leadership script, technical
  depth, figures with sources, likely questions and answers.
- **Likely question**: a question and answer pair tied to a chapter or step, held to the same
  sourcing rules as other copy.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A presenter can deliver the full talk, from the opening chapter to "What's next",
  using only a clicker, with zero mouse or keyboard actions other than the clicker's keys.
- **SC-002**: On every step, the caption on the slide is at most 24 words in Leadership depth
  (scene labels, closed hotspot markers and a step's callout are counted separately; a callout is
  at most 62 words: title plus four points).
- **SC-003**: Every chapter transition completes within 2.5 seconds, and in a rehearsal no viewer
  reports a jarring cut or a blank frame between chapters.
- **SC-004**: 100% of the text shown on the page in feature 001 appears in the generated talk track,
  verified automatically on every build.
- **SC-005**: In a review with at least 5 representative viewers (mix of clinical and IT) watching
  a presented run-through, at least 4 can explain in their own words what each feature does and why
  it matters in healthcare, matching or beating feature 001's comprehension result.
- **SC-006**: 100% of figures shown on slides or in hotspots give access to their full provenance in
  one action.
- **SC-007**: Captions remain legible from 8 metres on a 16:9 projector at 1920×1080.
- **SC-008**: The automated accessibility check reports zero WCAG 2.2 AA violations on every step,
  and the full talk can be navigated by keyboard alone.
- **SC-009**: Animation and transitions hold the frame-time targets of feature 001 on the same
  reference hardware.
- **SC-010**: The presenter rates the talk track as sufficient to deliver the talk without the old
  side text (yes/no in a rehearsal).

## Assumptions

- The presenting setup is a laptop driving a 16:9 projector at 1920×1080 or 1280×720, with a
  standard USB presentation clicker that sends Right/Left or Page Down/Page Up.
- Existing story text, bottom lines and deep sections remain the source for the talk track; new
  content needed is limited to captions, hotspot text, likely questions and transition anchors.
- Chapter order is feature 001's tab order; the References and glossary content moves out of the
  clicker path but stays reachable.
- Each chapter keeps its own scene. Transitions are a camera move out, crossfade and camera move in,
  not a single continuous 3D world.
- The editable talk-track document is published once from the generated file; later content
  changes are picked up by regenerating the file, and the presenter merges any changes into their
  annotated copy by hand.
- Feature 001's existing "presentation mode" is superseded: the presentation-first slide is the
  standard experience, with fullscreen still available.
- Presenter view is optional and is dropped without blocking the feature if two windows opened from
  a local file cannot stay in sync.
