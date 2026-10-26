// WAI-ARIA tablist with automatic activation, Previous/Next paging and progress text.
import { tabs } from './content.js';
import * as router from './router.js';

const tablist = document.getElementById('tablist');
const panel = document.getElementById('panel');
const prevButton = document.getElementById('prev');
const nextButton = document.getElementById('next');
const progress = document.getElementById('progress');
const announcer = document.getElementById('announcer');

let buttons = [];
let activeIndex = 0;

export function announce(text) {
  announcer.textContent = '';
  // A separate task so screen readers notice repeated messages.
  setTimeout(() => {
    announcer.textContent = text;
  }, 30);
}

function select(index, { focus = false } = {}) {
  const tab = tabs[index];
  router.goTab(tab.id);
  if (focus) buttons[index].focus();
}

export function initTabs() {
  buttons = tabs.map((tab, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tab';
    button.id = `tab-${tab.id}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', 'panel');
    button.setAttribute('aria-selected', 'false');
    button.tabIndex = -1;
    const number = document.createElement('span');
    number.className = 'tab-number';
    number.textContent = String(tab.order);
    number.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.textContent = tab.title;
    button.append(number, label);
    button.addEventListener('click', () => select(i));
    tablist.append(button);
    return button;
  });

  tablist.addEventListener('keydown', (e) => {
    const keys = { ArrowRight: activeIndex + 1, ArrowLeft: activeIndex - 1, Home: 0, End: tabs.length - 1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    e.stopPropagation();
    const next = (keys[e.key] + tabs.length) % tabs.length;
    select(next, { focus: true });
  });

  prevButton.addEventListener('click', () => select(activeIndex - 1));
  nextButton.addEventListener('click', () => select(activeIndex === tabs.length - 1 ? 0 : activeIndex + 1));
}

/** Reflects the active tab in the tablist and pager. */
export function setActiveTab(tabId) {
  activeIndex = Math.max(0, tabs.findIndex((t) => t.id === tabId));
  buttons.forEach((b, i) => {
    const selected = i === activeIndex;
    b.setAttribute('aria-selected', String(selected));
    b.tabIndex = selected ? 0 : -1;
    if (selected) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
  panel.setAttribute('aria-labelledby', buttons[activeIndex].id);

  prevButton.hidden = activeIndex === 0;
  prevButton.textContent = activeIndex > 0 ? `← ${tabs[activeIndex - 1].title}` : 'Previous';
  const last = activeIndex === tabs.length - 1;
  nextButton.textContent = last ? 'Back to Overview' : `${tabs[activeIndex + 1].title} →`;
  nextButton.setAttribute('aria-label', last ? 'Back to Overview' : `Next: ${tabs[activeIndex + 1].title}`);
}

export function setProgress(tabId, beatIndex, beatCount) {
  const tab = tabs.find((t) => t.id === tabId);
  const step = beatCount ? ` · Step ${beatIndex + 1} of ${beatCount}` : '';
  progress.textContent = `Tab ${tab.order} of ${tabs.length}${step}`;
}
