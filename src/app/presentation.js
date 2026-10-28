// Full screen and screen blanking (T024). The slide is always presentation-ready (feature 002), so
// this only toggles full screen; position lives in the URL, so it never moves the story.
import { announce } from './chapter-menu.js';

const button = document.getElementById('present-toggle');
const blank = document.getElementById('blank');

function setBlank(on) {
  blank.hidden = !on;
}

function render() {
  const full = !!document.fullscreenElement;
  if (full) document.documentElement.dataset.present = '';
  else delete document.documentElement.dataset.present;
  button.textContent = full ? 'Exit full screen' : 'Full screen';
  button.setAttribute('aria-pressed', String(full));
}

export async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen().catch(() => {});
    return;
  }
  if (!document.fullscreenEnabled) return;
  try {
    await document.documentElement.requestFullscreen();
    document.getElementById('slide').focus({ preventScroll: true });
    announce('Full screen. Use Page Down and Page Up, or the arrow keys, to move through the talk.');
  } catch {
    // Refused (e.g., no user gesture): the slide still works in the window.
  }
}

export function initPresentation() {
  button.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', render);
  render();

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest?.('input[type="text"], textarea, select, [contenteditable="true"], [role="dialog"]')) return;
    if (['f', 'F', 'p', 'P'].includes(e.key)) {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key === 'b' || e.key === 'B' || e.key === '.') {
      e.preventDefault();
      setBlank(blank.hidden);
    } else if (!blank.hidden) {
      setBlank(false);
    }
  });
}
