// Healthcare scenario card for each feature tab (fictional composites, labelled as illustrative).
import { scenarioById, markupContext } from './content.js';
import { renderInline } from './markup.js';
import * as story from './story.js';

const root = document.getElementById('scenario');

function render({ tab }) {
  root.replaceChildren();
  for (const id of tab?.scenarioIds ?? []) {
    const s = scenarioById.get(id);
    if (!s) continue;
    const card = document.createElement('section');
    card.className = 'card scenario-card';
    card.setAttribute('aria-labelledby', `scenario-${s.id}`);

    const kicker = document.createElement('p');
    kicker.className = 'scenario-kicker';
    kicker.textContent = 'Illustrative scenario';
    const title = document.createElement('h3');
    title.id = `scenario-${s.id}`;
    title.textContent = s.location;

    const devices = document.createElement('ul');
    devices.className = 'scenario-devices';
    devices.setAttribute('aria-label', 'Devices involved');
    for (const d of s.deviceTypes) {
      const li = document.createElement('li');
      li.textContent = d;
      devices.append(li);
    }

    const problem = document.createElement('p');
    problem.innerHTML = renderInline(s.problem, markupContext); // safe: renderMarkup
    const outcomeTitle = document.createElement('h4');
    outcomeTitle.textContent = 'What this supports';
    const outcome = document.createElement('p');
    outcome.innerHTML = renderInline(s.outcomeSupported, markupContext); // safe: renderMarkup

    card.append(kicker, title, devices, problem, outcomeTitle, outcome);
    root.append(card);
  }
}

export function initScenario() {
  story.on('tab', render);
}
