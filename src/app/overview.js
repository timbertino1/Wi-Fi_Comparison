// The Overview's preview of every tab, shown under its final beat.
import { tabs } from './content.js';
import * as router from './router.js';
import * as story from './story.js';

const extra = document.getElementById('extra');

function render() {
  const card = document.createElement('section');
  card.className = 'card overview-preview';
  card.setAttribute('aria-labelledby', 'overview-preview-title');

  const title = document.createElement('h3');
  title.id = 'overview-preview-title';
  title.textContent = 'In this story';
  card.append(title);

  const list = document.createElement('ol');
  list.className = 'preview-list';
  for (const tab of tabs.filter((t) => t.id !== 'overview')) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#/${tab.id}`;
    link.className = 'preview-link';
    const name = document.createElement('strong');
    name.textContent = tab.title;
    const summary = document.createElement('span');
    summary.textContent = tab.summary;
    link.append(name, summary);
    item.append(link);
    list.append(item);
  }
  card.append(list);

  const start = document.createElement('button');
  start.type = 'button';
  start.className = 'pager-button pager-next';
  start.textContent = `Start the story: ${tabs[1].title}`;
  start.addEventListener('click', () => router.goTab(tabs[1].id));
  card.append(start);
  return card;
}

export function initOverview() {
  let card = null;
  story.on('beat', ({ tabId, beatIndex, beatCount }) => {
    const show = tabId === 'overview' && beatIndex === beatCount - 1;
    if (show && !card) {
      card = render();
      extra.append(card);
    } else if (!show && card) {
      card.remove();
      card = null;
    }
  });
}
