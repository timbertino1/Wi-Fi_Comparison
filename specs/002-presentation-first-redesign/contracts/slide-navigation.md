# Contract: Slide, Navigation, Hotspots, Notes and Presenter View

Replaces the tablist, pager and presentation-mode parts of feature 001's
[ui-navigation contract](../../001-wifi7-healthcare-explainer/contracts/ui-navigation.md). Its
provenance-panel and security-constraints sections still apply unchanged.

## Slide structure

```text
┌ header (slim) ─ title · chapter menu ▾ · Audience [Leadership|Technical] · ⚙ ┐
│ ┌──────────────────────────── slide (16:9) ─────────────────────────────┐  │
│ │ WebGL canvas (aria-hidden)                                            │  │
│ │ label + hotspot layer (hotspot buttons are focusable)                 │  │
│ │                     ┌ caption panel (aria-live=polite) ┐              │  │
│ │                     │ headline · takeaway · [technical]│              │  │
│ │                     └──────────────────────────────────┘              │  │
│ │ [gen switch]          ◀ Back  ▶ Next   ⏯   Notes   chapter · ━━━━━    │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

- The settings menu (⚙) holds theme, motion, fullscreen, presenter view and keyboard shortcuts.
- The header hides in fullscreen; the slide then fills the screen.
- "What the animation shows" moves into the Notes drawer and remains the step's text description
  for screen readers (visually hidden live region on the slide).

## URLs (unchanged scheme, new meanings)

| Hash | Opens |
|------|-------|
| `#/<chapterId>/<n>` | Chapter, step *n* (settled) |
| `…?gen=` / `…?view=` / `…?test` | As in 001 |
| `…?notes` | Same position with the Notes drawer open |
| `…?presenter` | Presenter view window (opened by the main window; see below) |
| `#/references…` | References and glossary page (reachable from the chapter menu; not in the clicker path) |
| `…?present` | Accepted for old links; same as normal (the slide is always presentation-ready) |

Step changes use `history.replaceState`; chapter changes assign `location.hash` (Back button moves
between chapters, as in 001).

## Keyboard and clicker map

| Key | Action |
|-----|--------|
| `→`, `PageDown`, `Space`, `↓` | Next (crossing chapters) |
| `←`, `PageUp`, `Shift+Space`, `↑` | Back (crossing chapters, settled) |
| `Escape` | Close card/drawer/menu; else exit fullscreen |
| `K` | Play/pause current step |
| `R` | Replay current step |
| `G` | Cycle comparison generation |
| `V` | Toggle Leadership/Technical |
| `N` | Toggle Notes drawer |
| `F` or `P` | Toggle fullscreen |
| `B` or `.` | Blank/unblank |
| `H` | Focus the first hotspot (then `Tab` through hotspots) |
| `M` | Open chapter menu |
| `S` | Open presenter view (user gesture) |
| `?` | Keyboard shortcuts dialog |

Rule: while a hotspot card, the Notes drawer or the chapter menu is open, the Next/Back keys close
it and do nothing else (FR-019). Shortcuts are ignored while focus is in a text control.

## Hotspots

- Marker: `<button class="hotspot" aria-label="<term name>: more information"
  aria-expanded="false" aria-controls="<card id>">` containing an "i" glyph; 28 px at 1080p;
  ≥ 3:1 contrast against the scene; visible focus ring.
- Card: non-modal `role="dialog"` labelled by the term name; contents in order: term name,
  definition, figure (value + qualifier + "Source" button opening the provenance panel), technical
  line (Technical depth only). Focus moves into the card on open and returns to the marker on close.
- Placement: on the side of the anchor with more room; never clipped by the slide edge.
- Markers hide during chapter transitions and reappear when the step settles.
- Fallback (no WebGL): numbered list of the same buttons beside the caption; numbers match badges in
  the still image.

## Notes drawer

- `<aside id="notes" aria-label="Notes for this step">`, closed by default; toggled by the Notes
  button or `N`; closed by Escape and automatically on any Next/Back.
- Contents: heading, body, bottom line, deep dive (Technical depth), key figures table, scenario,
  "What the animation shows" — rendered with the 001 escaping renderer, glossary and provenance
  components.

## Presenter view

- Opened by a user gesture (settings menu item or `S` from the main window) with
  `window.open(<same file>#/<chapter>/<step>?presenter, 'wifi7-presenter')`.
- Shows: current chapter/step, current step notes (Say + Technical + Figures + Likely questions),
  next step's caption, elapsed timer, Back/Next buttons; no 3D scene.
- Sync: each window sends `goto` after every settled change and accepts only messages from the
  peer window with the exact shapes in [data-model.md](../data-model.md#presenter-message-runtime-window-to-window).
  Origin is not used for trust (it is `null` in Firefox on `file://`); `event.source` identity is.
- If `window.open` returns `null` (popup blocked), the main window shows a notice pointing to the
  talk track; nothing else changes.

## Accessibility

- Landmarks: `header`, `main` (slide), `aside` (notes). The caption panel is an `aria-live="polite"`
  region announcing headline and takeaway on each settled step.
- Progress text ("Chapter 3 of 10 · Step 2 of 5") is visible in the progress strip and announced
  on chapter change.
- Chapter menu: a disclosure button with a list of links; current chapter has `aria-current="step"`.
- All controls are native buttons with text labels or `aria-label`s; touch targets ≥ 44 px.
