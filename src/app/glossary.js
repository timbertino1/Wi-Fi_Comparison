// Accessible definition popovers for [[term]] buttons.
import { termById } from './content.js';

let popover = null;
let returnFocus = null;

function close() {
  if (!popover) return;
  popover.remove();
  popover = null;
  document.removeEventListener('pointerdown', onOutside, true);
  returnFocus?.focus();
  returnFocus = null;
}

function onOutside(e) {
  if (popover && !popover.contains(e.target) && !e.target.closest('.term')) close();
}

function open(button) {
  close();
  const term = termById.get(button.dataset.term);
  if (!term) return;
  returnFocus = button;

  popover = document.createElement('div');
  popover.className = 'popover';
  popover.setAttribute('role', 'dialog');
  popover.setAttribute('aria-modal', 'false');
  popover.setAttribute('aria-labelledby', 'popover-title');

  const title = document.createElement('h4');
  title.id = 'popover-title';
  title.textContent = term.term;
  popover.append(title);
  if (term.expansion) {
    const expansion = document.createElement('p');
    expansion.className = 'popover-expansion';
    expansion.textContent = term.expansion;
    popover.append(expansion);
  }
  const definition = document.createElement('p');
  definition.textContent = term.definition;
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'popover-close';
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', close);
  popover.append(definition, closeButton);

  document.body.append(popover);
  const rect = button.getBoundingClientRect();
  const width = Math.min(320, window.innerWidth - 32);
  popover.style.width = `${width}px`;
  popover.style.left = `${Math.max(16, Math.min(rect.left, window.innerWidth - width - 16))}px`;
  popover.style.top = `${rect.bottom + 8}px`;
  popover.tabIndex = -1;
  popover.focus();
  document.addEventListener('pointerdown', onOutside, true);
}

export function initGlossary() {
  document.addEventListener('click', (e) => {
    const button = e.target.closest('.term');
    if (button) open(button);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popover) {
      e.preventDefault();
      close();
    }
  });
}
