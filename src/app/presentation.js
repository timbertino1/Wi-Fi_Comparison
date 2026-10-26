// Presentation mode for live sessions: fullscreen, larger type, clicker keys that cross tab
// boundaries, and screen blanking. Position lives in the URL, so toggling never moves the story.
import { tabs } from './content.js';
import * as router from './router.js';
import * as story from './story.js';
import { setBoundaryHandlers } from './controls.js';
import { announce } from './tabs.js';

const button = document.getElementById('present-toggle');
const blank = document.getElementById('blank');
let presenting = false;
let prompt = null;

function tabIndex() {
  return tabs.findIndex((t) => t.id === story.snapshot().tabId);
}

function nextTab() {
  const next = tabs[(tabIndex() + 1) % tabs.length];
  router.goTab(next.id, next.beats.length ? 1 : null);
  return true;
}

function previousTab() {
  const prev = tabs[(tabIndex() - 1 + tabs.length) % tabs.length];
  router.goTab(prev.id, prev.beats.length || null);
  return true;
}

function setBlank(on) {
  blank.hidden = !on;
}

async function enter({ fullscreen = true } = {}) {
  prompt?.remove();
  prompt = null;
  presenting = true;
  document.documentElement.dataset.present = '';
  button.textContent = 'Stop presenting';
  button.setAttribute('aria-pressed', 'true');
  setBoundaryHandlers({ last: nextTab, first: previousTab });
  router.replace({ set: { present: '' } });
  if (fullscreen && document.fullscreenEnabled && !document.fullscreenElement) {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen refused (e.g., no user gesture): presentation styles still apply.
    }
  }
  document.getElementById('panel').focus({ preventScroll: true });
  announce('Presenting. Use Page Down and Page Up, or the arrow keys, to move through the story.');
}

function exit() {
  if (!presenting) return;
  presenting = false;
  delete document.documentElement.dataset.present;
  button.textContent = 'Present';
  button.setAttribute('aria-pressed', 'false');
  setBoundaryHandlers({});
  setBlank(false);
  router.replace({ remove: ['present'] });
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  announce('Stopped presenting');
}

export function togglePresentation() {
  if (presenting) exit();
  else enter();
}

function showStartPrompt() {
  prompt = document.createElement('div');
  prompt.className = 'present-prompt';
  const start = document.createElement('button');
  start.type = 'button';
  start.className = 'pager-button pager-next';
  start.textContent = 'Start presenting';
  start.addEventListener('click', () => enter());
  const later = document.createElement('button');
  later.type = 'button';
  later.className = 'control';
  later.textContent = 'Not now';
  later.addEventListener('click', () => {
    prompt.remove();
    prompt = null;
    router.replace({ remove: ['present'] });
  });
  prompt.append(start, later);
  document.body.append(prompt);
  start.focus();
}

export function initPresentation() {
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', togglePresentation);

  document.addEventListener('fullscreenchange', () => {
    // Leaving fullscreen with Escape ends presentation mode but keeps the tab and beat.
    if (!document.fullscreenElement && presenting) exit();
  });

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest?.('input[type="text"], textarea, select, [contenteditable="true"], [role="dialog"]')) return;
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      togglePresentation();
    } else if (presenting && (e.key === 'b' || e.key === 'B' || e.key === '.')) {
      e.preventDefault();
      setBlank(blank.hidden);
    } else if (presenting && e.key === 'Escape') {
      exit();
    } else if (presenting && !blank.hidden) {
      setBlank(false);
    }
  });

  // A shared link with ?present asks to present; fullscreen needs a click, so offer a prompt.
  if (router.parse(location.hash).params.has('present')) showStartPrompt();
}
