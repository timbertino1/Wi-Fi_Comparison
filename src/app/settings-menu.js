// Settings menu: theme, motion, full screen and keyboard shortcuts behind one header button, so the
// slide keeps the screen (contracts/slide-navigation.md). The items keep their 001 ids and handlers.
import * as overlays from './overlays.js';

const toggle = document.getElementById('settings-toggle');
const menu = document.getElementById('settings-menu');

function setOpen(open) {
  menu.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  if (open) menu.querySelector('.menu-item')?.focus();
}

export function initSettingsMenu() {
  toggle.addEventListener('click', () => setOpen(menu.hidden));
  overlays.register('settings-menu', { isOpen: () => !menu.hidden, close: () => setOpen(false) });
  // Theme and motion cycle in place; full screen and shortcuts take over the screen, so close first.
  for (const id of ['present-toggle', 'shortcuts-toggle']) {
    document.getElementById(id).addEventListener('click', () => setOpen(false));
  }
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !e.target.closest('#settings-menu, #settings-toggle')) setOpen(false);
  });
}
