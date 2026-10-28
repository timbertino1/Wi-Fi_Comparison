// Chapter menu (replaces the 001 tablist), progress strip and the shared screen-reader announcer
// (contracts/slide-navigation.md).
import { tabs } from './content.js';
import * as overlays from './overlays.js';
import { talkChapters } from './sequencer.js';

const toggle = document.getElementById('chapter-menu-toggle');
const menu = document.getElementById('chapter-menu');
const list = document.getElementById('chapter-list');
const progress = document.getElementById('progress');
const progressFill = document.getElementById('progress-fill');
const announcer = document.getElementById('announcer');

let links = [];

export function announce(text) {
  announcer.textContent = '';
  // A separate task so screen readers notice repeated messages.
  setTimeout(() => {
    announcer.textContent = text;
  }, 30);
}

function setOpen(open, { focus = false } = {}) {
  menu.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  if (open && focus) (menu.querySelector('[aria-current="step"]') ?? links[0])?.focus();
}

export function toggleMenu() {
  setOpen(menu.hidden, { focus: true });
}

export function initChapterMenu() {
  const chapters = talkChapters();
  const entries = [...chapters, ...tabs.filter((t) => t.kind === 'references')];
  links = entries.map((tab) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'chapter-link';
    a.href = tab.kind === 'references' ? `#/${tab.id}` : `#/${tab.id}/1`;
    a.dataset.chapter = tab.id;
    const number = document.createElement('span');
    number.className = 'chapter-number';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = tab.kind === 'references' ? '§' : String(chapters.indexOf(tab) + 1);
    const label = document.createElement('span');
    label.textContent = tab.title;
    a.append(number, label);
    a.addEventListener('click', () => setOpen(false));
    li.append(a);
    list.append(li);
    return a;
  });

  toggle.addEventListener('click', toggleMenu);
  overlays.register('chapter-menu', { isOpen: () => !menu.hidden, close: () => setOpen(false) });
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !e.target.closest('#chapter-menu, #chapter-menu-toggle')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest?.('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
    if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      toggleMenu();
    }
  });
}

/** Marks the current chapter in the menu. */
export function setActiveChapter(tabId) {
  for (const a of links) {
    if (a.dataset.chapter === tabId) a.setAttribute('aria-current', 'step');
    else a.removeAttribute('aria-current');
  }
}

/** Progress strip: "<chapter> · Chapter n of N · Step m of k" and a bar for the whole talk. */
export function setProgress(tabId, beatIndex, beatCount) {
  const chapters = talkChapters();
  const index = chapters.findIndex((t) => t.id === tabId);
  const tab = tabs.find((t) => t.id === tabId);
  if (index < 0) {
    progress.textContent = tab?.title ?? '';
    progressFill.style.width = '0';
    return;
  }
  const step = beatCount ? ` · Step ${beatIndex + 1} of ${beatCount}` : '';
  progress.textContent = `${tab.shortTitle ?? tab.title} · Chapter ${index + 1} of ${chapters.length}${step}`;
  const total = chapters.reduce((n, t) => n + t.beats.length, 0);
  const done = chapters.slice(0, index).reduce((n, t) => n + t.beats.length, 0) + beatIndex + 1;
  progressFill.style.width = `${(100 * done) / total}%`;
}
