# Research: Presentation-First Redesign

Decisions for feature 002. Feature 001's research (R1–R16 in
[../001-wifi7-healthcare-explainer/research.md](../001-wifi7-healthcare-explainer/research.md))
still applies; decisions here are numbered P1–P12 to avoid confusion.

## P1. Slide frame and sizing

**Decision**: The slide is a single 16:9 box sized `min(100vw, 177.78vh)` wide, centred and
letterboxed/pillarboxed, containing the WebGL canvas, the label/hotspot layer, the caption, the
progress strip and the on-slide controls. All slide typography is sized in slide-relative units
(a CSS custom property `--slide-h` = slide height) so a 1280×720 and a 1920×1080 projector show the
same composition. Below 600 px wide the caption moves under the slide.

**Rationale**: Projectors are 16:9 (user, 2026-10-27). Slide-relative sizing makes rehearsal on a
laptop representative of the projected result.

**Alternatives considered**: Fluid full-viewport stage (composition shifts between rehearsal and
projector); fixed 1920×1080 scaled with `transform: scale` (blurry text, hit-testing quirks).

## P2. Caption legibility from the back of the room

**Decision**: Headline at 4.4 % of slide height (≈ 48 px at 1080p), takeaway at 3.3 % (≈ 36 px),
technical line at 2.8 % (≈ 30 px); weight 600/500; caption sits on a solid surface panel with
≥ 7:1 contrast (AAA for large text, comfortably above the AA requirement). Word limits from the
spec (headline ≤ 8, takeaway ≤ 16) are enforced by the content validator.

**Rationale**: A common projection rule of thumb is that text must be at least 1/200 of the
viewing distance per unit of screen height; at 8 m from a ≈ 1.5 m-tall image this gives ≈ 40 px at
1080p for comfortable reading (SC-007). The panel avoids text over a moving scene.

**Alternatives considered**: Text over the scene with a shadow (unreadable over light floors, and
text shadows/blur proved costly on software rendering — see P11); smaller type with more words
(contradicts the "animation first" goal).

## P3. Caption timing ("appears at the right moment")

**Decision**: Each step has a `captionAtMs` (default 600) measured from the start of its scene
transition. Scenes MAY additionally call `ctx.cue('caption')` to release the caption exactly when
the subject appears; the caption shows at whichever comes first. Reduced motion and settled
states (deep links, Back, snapshots) show the caption immediately.

**Rationale**: A content-side delay covers most steps with no scene change; the cue handles the
few where timing depends on animation (e.g. the moment voice packets reroute in MLO). The
"whichever first" rule guarantees a caption never fails to appear.

**Alternatives considered**: Scene-only cues (every scene must change; a missed cue hides the
caption); fixed fade with the step (caption precedes the thing it names).

## P4. Chapter-to-chapter transition

**Decision**: The shell runs a three-phase transition with one scene alive at a time:

1. **Out** (≈ 700 ms): the shell dollies the camera away from the outgoing scene's anchor
   (the access point), easing out.
2. **Crossfade** (≈ 600 ms): the last rendered frame is copied synchronously, right after
   `renderer.render`, into a 2D overlay canvas (no `preserveDrawingBuffer` needed). The outgoing
   scene is disposed, the next one mounted at its "wide" framing, and the overlay fades out over
   it.
3. **In** (≈ 900 ms): the shell dollies from the wide framing to the first step's framing.

Total ≤ 2.2 s, inside the 2.5 s limit (FR-011). Each scene exposes an `anchor` object (its access
point) and the shell positions the incoming wide shot so the anchor lands where the outgoing
anchor left the screen, giving the "same place" continuity (FR-012). A press during any phase
jumps the transition to its end, then applies the press (FR-008). Reduced motion: phases 1 and 3
are skipped and the crossfade shortens to 200 ms, or is instant when motion is off.

**Rationale**: Keeps the existing one-scene-at-a-time memory model and scene contract (001 R4),
costs one extra 2D canvas, and never renders two 3D scenes at once, which matters on integrated
GPUs and the software renderer used in CI.

**Alternatives considered**: Render both scenes to render targets and blend (doubles GPU cost
during transitions; two scenes in memory); a single continuous world (rejected by the user as too
large); plain CSS fade of the whole stage (no camera motion, reads as a cut).

## P5. Hotspots

**Decision**: Hotspots are buttons in the existing CSS2D label layer, anchored to named scene
objects that each scene publishes through `instance.anchors()` (e.g. `ap`, `band-6`, `badge`).
Content declares hotspots per step: target anchor, glossary term (definition), optional claim
(figure + provenance), optional technical line, and which depth shows it. Activation opens a
non-modal popover card positioned on the side of the anchor with more room. The marker is a 28 px
"i" disc with a visible label on focus/hover; it follows the anchor every frame.

**Rationale**: Reuses the label layer that already tracks objects, keeps text in content (scenes
expose only anchors, not copy), and satisfies jargon-at-first-use and provenance on screen
(FR-016–FR-018).

**Alternatives considered**: Hotspots in WebGL with raycasting (not keyboard-accessible, not
screen-reader reachable); fixed-position callouts (don't follow moving objects).

## P6. One navigation model for clicker, keyboard, touch

**Decision**: A single talk sequencer replaces the per-tab beat stepper and tab pager. It flattens
chapters × steps into one ordered list; Next/Back move along it, crossing chapters with the P4
transition. Keys: Right, PageDown, Space, Down → Next; Left, PageUp, Shift+Space, Up → Back.
If a hotspot card or the Notes drawer is open, Next/Back/Escape first close it and do not move
(FR-019). A compact chapter menu (button + list) replaces the tablist for direct jumps; chapter
and step remain addressable as `#/<chapterId>/<step>` (unchanged from 001, so existing links
work).

**Rationale**: Clickers send exactly these keys; "close first" prevents an accidental skip in
front of the room.

**Alternatives considered**: Keep the tablist (takes a row on the slide; the user wants the
animation to dominate); separate keys for chapters (clickers have two buttons).

## P7. Notes drawer (FR-021, option C)

**Decision**: A side drawer, closed by default, overlays the right 40 % of the slide (bottom sheet
under 600 px). It renders the step's existing story body, bottom line, deep-dive text, key figures
and scenario with the existing escaping renderer, glossary and provenance components. It closes
on Escape, on its button, and automatically on Next/Back, so the projected slide is clean after
every advance.

**Rationale**: Self-paced viewers keep access to the full text; it reuses 001 renderers, so no
content is duplicated.

**Alternatives considered**: Reader-mode toggle restoring the 001 layout (two layouts to maintain);
slides only (user chose C).

## P8. Talk-track generation

**Decision**: `scripts/talk-track.mjs` builds `docs/talk-track.md` from content on every build and
in CI (like `docs/provenance-report.md`, with a `--check` mode that fails when the committed file
is stale). Per chapter and step it emits: **On screen** (caption + scene description + hotspots),
**Say (leadership)** (story body + bottom line), **Technical depth** (deep dive, technical caption
line, technical hotspots), **Figures** (each with value, qualifier, source, locator), and **Likely
questions** (from new content). Markup is rendered to plain Markdown: glossary links become the
term with its definition on first use per chapter, claim citations become footnote-style source
references. A coverage test walks every text field in content and asserts it appears in the
generated file (FR-023, SC-004).

**Editable copy**: after the first generation, the file is published once to the user's document
workspace as an editable doc (user chose "both formats"). Regeneration never touches that doc;
quickstart describes re-publishing a fresh copy when content changes.

**Rationale**: Generated Markdown in `docs/` is reviewable in PRs, stays in sync, and is not part of
`dist/`, so the audience never receives it (FR-025).

**Alternatives considered**: Hand-written talk track (drifts); generating into `dist/` (would ship
to anyone the folder is shared with); HTML/PDF output (Markdown is easiest to diff and to import
into a doc).

## P9. Presenter view over `file://`

**Decision**: The main window opens the presenter view with `window.open(sameFile + '?presenter')`
on a user gesture (button or `N` key). The two windows sync with `postMessage(…, '*')`, and each
side accepts messages **only** when `event.source` is the known peer window and the payload
matches a strict shape (`{ type: 'goto', chapter, step }` or `{ type: 'hello' }`). The presenter
window shows current-step notes (from the talk-track data in the bundle), the next caption,
elapsed time and progress, and can send Next/Back.

**Evidence**: Spike on 2026-10-27 opening a local file in Playwright: `window.open` +
`postMessage` round-trip succeeded in Chromium, Firefox and WebKit under a CSP with
`connect-src 'none'`; `BroadcastChannel` failed in WebKit (Firefox reports origin `null` for
`file://`, so origin checks must use `event.source`, not `event.origin`).

**Rationale**: Works offline and from a local file in all target browsers without network access,
which the constitution forbids.

**Alternatives considered**: `BroadcastChannel` (fails in WebKit on `file://`); `localStorage`
`storage` events (origin-dependent on `file://`, and the constitution limits storage to
preferences).

## P10. No-WebGL fallback with hotspots

**Decision**: The snapshot script renders each step with its hotspot markers drawn as numbered
badges (1, 2, 3…) and the caption hidden, then captures the still. In fallback mode the slide shows
the still, the caption and progress as usual, and a numbered list of hotspot buttons whose
numbers match the badges in the image; each opens the same card.

**Rationale**: Positions are baked into the image at build time, so no coordinate data has to be
loaded at runtime (a JSON fetch is blocked on `file://`).

**Alternatives considered**: Ship anchor coordinates as JSON (fetch blocked); hide hotspots in
fallback (loses definitions and provenance, violating FR-029).

## P11. Performance guard-rails learned in the stage polish (PR #3)

**Decision**: Slide UI layered over the canvas must not use `backdrop-filter`, `box-shadow` or
`filter` on elements that move every frame (hotspot markers, labels); captions and drawer may use
static shadows because they do not move. The transition overlay is a plain 2D canvas with opacity
only. Frame time is checked uncapped (`--disable-gpu-vsync --disable-frame-rate-limit`) against
the main branch for every scene and for transitions.

**Rationale**: On 2026-10-27, label blur/shadows and an environment map each added measurable
frame time on software rendering and caused CI timeouts; capped frame rates hid the cost.

## P12. Migration of feature 001 UI and content

**Decision**:

- Keep: content files, claims/provenance, glossary, references, scene modules (extended per the
  contract), stage, fallback, preferences, view switch, generation switch, provenance panel.
- Replace: tablist and pager → chapter menu + talk sequencer; side column → caption + Notes
  drawer; presentation mode → the slide is always presentation-ready, with fullscreen (`F`/`P`) and
  blanking (`B`/`.`) kept.
- Add content: per step `caption` (`headline`, `takeaway`, optional `technical`), `captionAtMs`,
  `hotspots[]`, `questions[]`; per chapter transition metadata comes from scene anchors, not
  content.
- Tests: e2e specs that target the tablist, pager and side column are rewritten against the slide;
  provenance, security, a11y, nowebgl, resilience and performance specs keep their intent.

**Rationale**: Maximises reuse; the data that the talk track needs already exists, so only caption,
hotspot and question copy is new.
