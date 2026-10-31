// "Keyboard shortcuts" dialog (opened by ? or the header button), per contracts/ui-navigation.md.

const SHORTCUTS = [
  ['→, ↓, Page Down, Space', 'Next (continues into the next chapter)'],
  ['←, ↑, Page Up, Shift + Space', 'Back (continues into the previous chapter)'],
  ['N', 'Open or close the notes for this step'],
  ['M', 'Open the chapter menu'],
  ['K', 'Play or pause'],
  ['R', 'Replay from the first step of the chapter'],
  ['G', 'Change the generation compared with Wi-Fi 7'],
  ['F or P', 'Full screen on or off'],
  ['B or .', 'Blank the screen'],
  ['Esc', 'Close notes, a menu or a dialog; else leave full screen'],
  ['?', 'Show these shortcuts']
];

let dialog = null;
let returnFocus = null;

function close() {
  if (!dialog) return;
  dialog.remove();
  dialog = null;
  returnFocus?.focus();
}

function open() {
  if (dialog) return;
  returnFocus = document.activeElement;
  dialog = document.createElement('div');
  dialog.className = 'modal-backdrop';
  const panel = document.createElement('div');
  panel.className = 'modal';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'shortcuts-title');
  const title = document.createElement('h2');
  title.id = 'shortcuts-title';
  title.textContent = 'Keyboard shortcuts';
  const list = document.createElement('dl');
  list.className = 'shortcut-list';
  for (const [keys, action] of SHORTCUTS) {
    const dt = document.createElement('dt');
    dt.textContent = keys;
    const dd = document.createElement('dd');
    dd.textContent = action;
    list.append(dt, dd);
  }
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'control';
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', close);
  panel.append(title, list, closeButton);
  dialog.append(panel);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });
  // Keep focus inside the dialog.
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      closeButton.focus();
    }
  });
  document.body.append(dialog);
  closeButton.focus();
}

export function initShortcuts() {
  document.getElementById('shortcuts-toggle').addEventListener('click', open);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dialog) {
      e.preventDefault();
      e.stopImmediatePropagation();
      close();
    } else if (e.key === '?' && !dialog && !e.target.closest?.('input, textarea, [contenteditable="true"]')) {
      e.preventDefault();
      open();
    }
  }, true);
}
