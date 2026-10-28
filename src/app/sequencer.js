// Talk sequencer (research P6): one Next/Back across every step of every chapter. Within a chapter
// it defers to story.js; at a chapter's ends it moves to the neighbouring chapter. Back always lands
// on a settled step. Open overlays close first and swallow the press (FR-019).
import { tabs } from './content.js';
import * as router from './router.js';
import * as story from './story.js';
import * as overlays from './overlays.js';
import { setBoundaryHandlers } from './controls.js';

const NEXT_KEYS = new Set(['ArrowRight', 'PageDown', 'ArrowDown', ' ']);
const BACK_KEYS = new Set(['ArrowLeft', 'PageUp', 'ArrowUp']);
let settleNextRoute = false;

/** Chapters in the clicker path: everything with steps except the references page (FR-010). */
export function talkChapters() {
  return tabs.filter((t) => t.kind !== 'references' && t.beats.length);
}

function chapterIndex() {
  return talkChapters().findIndex((t) => t.id === story.snapshot().tabId);
}

function goChapter(offset) {
  const chapters = talkChapters();
  const i = chapterIndex();
  const target = chapters[i + offset];
  if (i < 0 || !target) return false;
  // Moving back lands on the previous chapter's last step, settled; forward plays its first step.
  settleNextRoute = offset < 0;
  router.goTab(target.id, offset < 0 ? target.beats.length : 1);
  return true;
}

/** True once for the route change that a Back across chapters caused (main.js shows it settled). */
export function consumeSettle() {
  const settle = settleNextRoute;
  settleNextRoute = false;
  return settle;
}

function isEditable(target) {
  return target.closest?.('input, textarea, select, [contenteditable="true"]');
}

export function initSequencer() {
  setBoundaryHandlers({
    last: () => goChapter(1),
    first: () => goChapter(-1),
    hasNext: () => chapterIndex() < talkChapters().length - 1,
    hasPrev: () => chapterIndex() > 0
  });

  // Capture phase, so an open overlay swallows the press before the story controls see it.
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isEditable(e.target)) return;
    const isMove = NEXT_KEYS.has(e.key) || BACK_KEYS.has(e.key);
    if (!isMove && e.key !== 'Escape') return;
    if (e.key === ' ' && e.target.closest?.('button, a, summary')) return; // Space activates the control
    if (isMove && e.target.closest?.('#chapter-menu, #settings-menu')) return; // arrows move within menus
    // Glossary popovers, the provenance panel and the shortcuts dialog handle their own keys first;
    // overlays registered here mark their dialogs with data-overlay.
    if (document.querySelector('[role="dialog"]:not([data-overlay])')) return;
    if (overlays.closeTop()) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
}
