// Slide controls: Back, play/pause, Next and replay, and their clicker/keyboard shortcuts
// (contracts/slide-navigation.md). The sequencer installs the chapter-crossing boundary handlers.
import * as story from './story.js';
import * as prefs from './preferences.js';

const root = document.getElementById('controls');
let playing = false;
let playToken = 0;
let testMode = false;
let onLastBeat = () => false; // the sequencer overrides these to cross into the neighbouring chapter
let onFirstBeat = () => false;
let hasNext = () => false;
let hasPrev = () => false;

const el = (tag, props = {}, text = '') => {
  const node = Object.assign(document.createElement(tag), props);
  if (text) node.textContent = text;
  return node;
};

const back = el('button', { type: 'button', className: 'control', id: 'step-back' }, '◀ Back');
const play = el('button', { type: 'button', className: 'control control-play', id: 'play' }, 'Play');
const forward = el('button', { type: 'button', className: 'control control-next', id: 'step-forward' }, 'Next ▶');
const replay = el('button', { type: 'button', className: 'control', id: 'replay' }, '↺ Replay');
back.setAttribute('aria-label', 'Back');
forward.setAttribute('aria-label', 'Next');
replay.setAttribute('aria-label', 'Replay from the first step');

function dwellFor(beat) {
  const override = testMode ? Number(window.__dwellMs) : NaN;
  return Number.isFinite(override) && override > 0 ? override : beat?.durationMs ?? 10000;
}

function setPlaying(value) {
  playing = value;
  playToken++;
  play.setAttribute('aria-pressed', String(playing));
  play.textContent = playing ? 'Pause' : 'Play';
  play.setAttribute('aria-label', playing ? 'Pause the story' : 'Play the story');
  if (playing) loop(playToken);
}

async function loop(token) {
  while (playing && token === playToken) {
    const { beat } = story.snapshot();
    await new Promise((resolve) => setTimeout(resolve, dwellFor(beat)));
    if (!playing || token !== playToken) return;
    if (story.isLastBeat()) {
      if (!onLastBeat()) setPlaying(false);
      return;
    }
    await story.next();
  }
}

export function pause() {
  if (playing) setPlaying(false);
}

export function togglePlay() {
  setPlaying(!playing);
}

export function stepForward() {
  pause();
  if (story.isLastBeat()) return onLastBeat();
  story.next();
  return true;
}

export function stepBack() {
  pause();
  if (story.isFirstBeat()) return onFirstBeat();
  story.prev({ animate: false }); // Back lands on a settled step (data-model.md)
  return true;
}

export function replayTab() {
  pause();
  story.goTo(0);
}

/** The sequencer installs handlers so stepping past either end of a chapter moves between chapters. */
export function setBoundaryHandlers(handlers) {
  onLastBeat = handlers.last ?? (() => false);
  onFirstBeat = handlers.first ?? (() => false);
  hasNext = handlers.hasNext ?? (() => false);
  hasPrev = handlers.hasPrev ?? (() => false);
  update(story.snapshot());
}

function update(snap) {
  const hasBeats = snap.beatCount > 0;
  root.hidden = !hasBeats;
  if (!hasBeats) return;
  back.disabled = snap.beatIndex === 0 && !hasPrev();
  forward.disabled = snap.beatIndex === snap.beatCount - 1 && !hasNext();
  replay.disabled = snap.beatIndex === 0;
}

function isEditable(target) {
  return target.closest?.('input, textarea, select, [contenteditable="true"]');
}

export function initControls({ test = false } = {}) {
  testMode = test;
  root.append(back, play, forward, replay);
  back.addEventListener('click', stepBack);
  forward.addEventListener('click', stepForward);
  play.addEventListener('click', togglePlay);
  replay.addEventListener('click', replayTab);
  setPlaying(false);

  story.on('beat', update);
  story.on('tab', () => pause());

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isEditable(e.target)) return;
    if (e.target.closest?.('[role="dialog"], [role="radiogroup"], details > summary, #chapter-menu, #settings-menu')) {
      if (!['k', 'K', 'r', 'R'].includes(e.key)) return;
    }
    const onButton = e.target.closest?.('button, a');
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
        e.preventDefault();
        stepForward();
        break;
      case ' ':
        if (onButton) return; // Space activates the focused button instead
        e.preventDefault();
        if (e.shiftKey) stepBack();
        else stepForward();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        stepBack();
        break;
      case 'k':
      case 'K':
        e.preventDefault();
        togglePlay();
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        replayTab();
        break;
      default:
    }
  });

  // Auto-play never starts on its own; with reduced motion it stays off until the viewer asks.
  prefs.onChange((key) => {
    if (key === 'motion' && prefs.effectiveMotion() === 'reduced') pause();
  });
}
