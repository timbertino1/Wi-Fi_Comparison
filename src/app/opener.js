// Chapter opener (FR-011a): the title card that introduces each chapter over its wide shot. It is its
// own click in the talk; the sequencer decides when it shows, this module only draws it.
import { genById, markupContext } from './content.js';
import { renderInline } from './markup.js';
import { openerParts } from './opener-text.js';
import { talkChapters } from './sequencer.js';
import * as story from './story.js';

const root = document.getElementById('opener');
const slide = document.getElementById('slide');

function el(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function render({ tab, intro }) {
  slide.toggleAttribute('data-intro', !!intro);
  if (!intro || !tab?.opener) {
    root.hidden = true;
    root.replaceChildren();
    return;
  }
  const number = talkChapters().indexOf(tab) + 1;
  const parts = openerParts(tab, number, genById);
  const card = el('div', 'opener-card');
  const kicker = el('p', 'opener-kicker');
  kicker.append(el('span', 'opener-number', parts.label), el('span', 'opener-tag', parts.tag));
  if (parts.badge) kicker.append(el('span', 'opener-badge', parts.badge));
  const title = el('h2', 'opener-title', tab.title);
  title.id = 'opener-title';
  const promise = el('p', 'opener-promise');
  promise.innerHTML = renderInline(tab.opener.promise, markupContext); // safe: renderMarkup
  const problem = el('p', 'opener-problem');
  const label = el('strong', 'opener-problem-label', 'The problem: ');
  const text = el('span', '');
  text.innerHTML = renderInline(tab.opener.problem, markupContext); // safe: renderMarkup
  problem.append(label, text);
  card.append(kicker, title, promise, problem);
  root.replaceChildren(card);
  root.hidden = false;
}

export function initOpener() {
  story.on('beat', render);
}
