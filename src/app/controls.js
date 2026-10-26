// Story controls: play/pause, step, replay, step dots, and their keyboard shortcuts
// (contracts/ui-navigation.md).
import * as story from './story.js';
import * as prefs from './preferences.js';

const root = document.getElementById('controls');
let playing = false;
let playToken = 0;
let testMode = false;
let onLastBeat = () => false; // presentation mode overrides this to cross into the next tab
let onFirstBeat = () => false;
let crossTabs = false;

const el = (tag, props = {}, text = '') => {
  const node = Object.assign(document.createElement(tag), props);
  if (text) node.textContent = text;
  return node;
};

const back = el('button', { type: 'button', className: 'control', id: 'step-back' }, '◀ Back');
const play = el('button', { type: 'button', className: 'control control-play', id: 'play' }, 'Play');
const forward = el('button', { type: 'button', className: 'control', id: 'step-forward' }, 'Next step ▶');
const replay = el('button', { type: 'button', className: 'control', id: 'replay' }, '↺ Replay');
const dots = el('div', { className: 'beat-dots', role: 'group' });
dots.setAttribute('aria-label', 'Steps');
back.setAttribute('aria-label', 'Previous step');
forward.setAttribute('aria-label', 'Next step');
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
  story.prev();
  return true;
}

export function replayTab() {
  pause();
  story.goTo(0);
}

/** Presentation mode installs handlers so stepping past either end moves between tabs. */
export function setBoundaryHandlers({ last, first }) {
  onLastBeat = last ?? (() => false);
  onFirstBeat = first ?? (() => false);
  crossTabs = !!(last || first);
  update(story.snapshot());
}

function renderDots({ beatCount, beatIndex, tab }) {
  dots.replaceChildren(
    ...Array.from({ length: beatCount }, (_, i) => {
      const dot = el('button', { type: 'button', className: 'beat-dot' }, String(i + 1));
      dot.setAttribute('aria-label', `Step ${i + 1}: ${tab.beats[i].heading}`);
      if (i === beatIndex) dot.setAttribute('aria-current', 'step');
      dot.addEventListener('click', () => {
        pause();
        story.goTo(i);
      });
      return dot;
    })
  );
}

function update(snap) {
  const hasBeats = snap.beatCount > 0;
  root.hidden = !hasBeats;
  if (!hasBeats) return;
  renderDots(snap);
  back.disabled = snap.beatIndex === 0 && !crossTabs;
  forward.disabled = snap.beatIndex === snap.beatCount - 1 && !crossTabs;
  replay.disabled = snap.beatIndex === 0;
}

function isEditable(target) {
  return target.closest?.('input, textarea, select, [contenteditable="true"]');
}

export function initControls({ test = false } = {}) {
  testMode = test;
  root.append(back, play, forward, replay, dots);
  back.addEventListener('click', stepBack);
  forward.addEventListener('click', stepForward);
  play.addEventListener('click', togglePlay);
  replay.addEventListener('click', replayTab);
  setPlaying(false);

  story.on('beat', update);
  story.on('tab', () => pause());

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isEditable(e.target)) return;
    if (e.target.closest?.('[role="tablist"], [role="dialog"], [role="radiogroup"], details > summary')) {
      if (!['k', 'K', 'r', 'R'].includes(e.key)) return;
    }
    const onButton = e.target.closest?.('button, a');
    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
        e.preventDefault();
        stepForward();
        break;
      case ' ':
        if (onButton) return; // Space activates the focused button instead
        e.preventDefault();
        stepForward();
        break;
      case 'ArrowLeft':
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
        if (/^[1-9]$/.test(e.key)) {
          const i = Number(e.key) - 1;
          if (i < story.snapshot().beatCount) {
            e.preventDefault();
            pause();
            story.goTo(i);
          }
        }
    }
  });

  // Auto-play never starts on its own; with reduced motion it stays off until the viewer asks.
  prefs.onChange((key) => {
    if (key === 'motion' && prefs.effectiveMotion() === 'reduced') pause();
  });
}
