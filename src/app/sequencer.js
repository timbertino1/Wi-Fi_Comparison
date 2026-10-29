// Talk sequencer (research P6): one Next/Back across every step of every chapter. Within a chapter
// it defers to story.js; past a chapter's last step it plays the transition to the next chapter's
// opener (FR-011, FR-011a), and Back from a first step shows that chapter's opener. Back always
// lands on a settled step. Open overlays close first and swallow the press (FR-019).
import { tabs } from './content.js';
import * as router from './router.js';
import * as story from './story.js';
import * as overlays from './overlays.js';
import * as prefs from './preferences.js';
import { setBoundaryHandlers } from './controls.js';

const NEXT_KEYS = new Set(['ArrowRight', 'PageDown', 'ArrowDown', ' ']);
const BACK_KEYS = new Set(['ArrowLeft', 'PageUp', 'ArrowUp']);
// Transition timings (research P4): move-out and crossfade; reduced motion skips the move.
const OUT_MS = 700;
const CROSSFADE_MS = 600;
const REDUCED_CROSSFADE_MS = 200;
let settleNextRoute = false;
let stage = null;

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
  if (offset < 0) {
    // Moving back lands on the previous chapter's last step, settled.
    finishTransition();
    settleNextRoute = true;
    router.goTab(target.id, target.beats.length);
  } else {
    playTransition(target);
  }
  return true;
}

// --- Chapter transition (FR-011, research P4): move out, then crossfade onto the next chapter's
// opener over its wide shot; Next from the opener is the move in. A press finishes it at once.
let transition = null;

function playTransition(target) {
  finishTransition();
  const frame = document.getElementById('transition-frame');
  const full = stage && prefs.effectiveMotion() === 'full' && document.visibilityState === 'visible';
  const controller = new AbortController();
  let swapped = false;
  let done = false;
  const swap = () => {
    if (swapped) return;
    swapped = true;
    if (stage) {
      stage.captureFrame(frame);
      frame.classList.remove('is-fading');
      frame.hidden = false;
    }
    router.goTab(target.id, 1, { intro: '' });
  };
  const end = () => {
    if (done) return;
    done = true;
    controller.abort();
    swap();
    frame.hidden = true;
    frame.classList.remove('is-fading');
    transition = null;
    story.setPhase('settled');
  };
  transition = { finish: end };
  (async () => {
    if (full) {
      story.setPhase('chapter-out');
      await stage.dollyOut({ durationMs: OUT_MS, signal: controller.signal });
    }
    if (done) return;
    swap();
    if (!stage) return end();
    story.setPhase('crossfade');
    const ms = full ? CROSSFADE_MS : REDUCED_CROSSFADE_MS;
    frame.style.setProperty('--crossfade-ms', `${ms}ms`);
    requestAnimationFrame(() => requestAnimationFrame(() => frame.classList.add('is-fading')));
    setTimeout(end, ms + 60);
  })();
}

/** Jumps a running chapter transition to its end (the opener), so a press can then apply. */
export function finishTransition() {
  transition?.finish();
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

export function initSequencer(options = {}) {
  stage = options.stage ?? null;
  setBoundaryHandlers({
    last: () => goChapter(1),
    // Back from a chapter's first step shows its opener.
    first: () => {
      story.enterIntro();
      router.replace({ set: { intro: '' } });
      return true;
    },
    hasNext: () => chapterIndex() < talkChapters().length - 1,
    hasPrev: () => chapterIndex() > 0,
    intro: () => story.snapshot().intro,
    introNext: () => {
      story.leaveIntro();
      router.replace({ remove: ['intro'] });
      return true;
    },
    introBack: () => goChapter(-1),
    beforeMove: finishTransition
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
