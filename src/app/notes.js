// Notes drawer (FR-021, research P7): the step's full text — story, bottom line, deep dive, key
// figures, scenario and what the animation shows — closed by default and closed again on every
// Next/Back so the projected slide stays clean. story.js and the 001 renderers fill its content.
import * as story from './story.js';
import * as router from './router.js';
import * as overlays from './overlays.js';
import { plainText } from './markup.js';
import { announce } from './chapter-menu.js';

const drawer = document.getElementById('notes');
const closeButton = document.getElementById('notes-close');
const description = document.getElementById('notes-description');
const toggle = document.createElement('button');
toggle.type = 'button';
toggle.className = 'control';
toggle.id = 'notes-toggle';
toggle.textContent = 'Notes';
toggle.setAttribute('aria-controls', 'notes');
toggle.setAttribute('aria-expanded', 'false');

let returnFocus = null;
const isReferences = () => document.documentElement.dataset.tab === 'references';

export function isOpen() {
  return !drawer.hidden && !isReferences();
}

export function setOpen(open, { focus = true } = {}) {
  if (isReferences()) return;
  if (open === isOpen()) return;
  drawer.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  if (open) {
    returnFocus = document.activeElement;
    router.replace({ set: { notes: '' } });
    if (focus) closeButton.focus({ preventScroll: true });
    announce('Notes open');
  } else {
    router.replace({ remove: ['notes'] });
    if (focus && drawer.contains(document.activeElement)) (returnFocus ?? toggle).focus({ preventScroll: true });
  }
}

export function initNotes() {
  document.getElementById('controls').append(toggle);
  toggle.addEventListener('click', () => setOpen(!isOpen()));
  closeButton.addEventListener('click', () => setOpen(false));
  overlays.register('notes', { isOpen, close: () => setOpen(false) });

  // A link with ?notes opens the drawer at that step; any other step change closes it.
  let openOnNextBeat = false;
  router.onRoute((route) => {
    openOnNextBeat = route.params.has('notes');
  });
  story.on('beat', ({ beat, tab }) => {
    description.textContent = plainText(beat?.sceneDescription ?? tab?.summary ?? '');
    // The references page shows this content as a page, not a drawer.
    if (isReferences()) {
      drawer.hidden = false;
      return;
    }
    setOpen(openOnNextBeat, { focus: false });
    openOnNextBeat = false;
  });

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest?.('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      setOpen(!isOpen());
    }
  });
}
