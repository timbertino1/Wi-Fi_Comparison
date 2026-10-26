# Contract: URLs, Keyboard, and Accessibility Structure

## URL hash scheme

| Hash | Opens |
|------|-------|
| *(none)* or `#/` | Overview, beat 1 |
| `#/<tabId>` | Tab, beat 1 |
| `#/<tabId>/<n>` | Tab, beat *n* (1-based); out-of-range → clamp to nearest valid beat |
| `#/<tabId>/<n>?gen=<genId>` | Same, with comparison generation set |
| `…?present` | Same position, presentation mode requested (fullscreen needs a user gesture; until one occurs, a "Start presenting" prompt is shown) |
| Unknown `tabId` | Overview, with a non-blocking "Section not found" notice |

Beat changes update the hash with `history.replaceState`; tab changes assign `location.hash` (adds a
history entry, works on `file://` in all target browsers), so the
browser Back button moves between tabs, not every beat. Tab ids are stable and form part of the
public contract (shared links).

## Keyboard map

| Key | Normal mode | Presentation mode |
|-----|-------------|-------------------|
| `←` / `→` with focus in the tablist | Previous / next tab (WAI-ARIA tabs, automatic activation) | same |
| `Home` / `End` in the tablist | First / last tab | same |
| `→`, `PageDown`, `Space` (focus on stage/body) | Next beat | Next beat; after last beat → next tab, beat 1 |
| `←`, `PageUp` | Previous beat | Previous beat; before first beat → previous tab, last beat |
| `K` | Play / pause | Play / pause |
| `R` | Replay tab | Replay tab |
| `1`–`5` | Jump to beat | Jump to beat |
| `G` | Cycle comparison generation | same |
| `P` | Enter presentation mode | Exit presentation mode |
| `B` or `.` | — | Blank / unblank stage |
| `Escape` | Close open popover | Exit fullscreen (stays on same tab and beat) |

Shortcuts are ignored while focus is in a text control or an open popover, and are listed in a
"Keyboard shortcuts" dialog (`?`).

## Accessibility structure

- Header `role="banner"`; tablist `role="tablist"` with `aria-label="Wi-Fi 7 story"`; each tab
  `role="tab"` with `aria-controls` → `role="tabpanel"`.
- Stage canvas is `aria-hidden="true"`; adjacent visually-available "What the animation shows"
  region contains the current beat's `sceneDescription` and is an `aria-live="polite"` region,
  updated on beat change.
- Controls are native `<button>`s with text labels; play/pause uses `aria-pressed`.
- Generation switcher is a radio group (`role="radiogroup"`) labeled with Wi-Fi name and IEEE id;
  colors are always paired with text labels (never color alone).
- Focus is visible on every interactive element (≥ 3:1 contrast focus ring).
- Progress text "Tab *n* of 11 · Step *m* of 5" is visible and announced on tab change.
