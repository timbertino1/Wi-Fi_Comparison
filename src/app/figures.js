// Key-figures panel: one column per compared generation, every value a button that opens its
// provenance (claim). Qualifiers are always spelled out in text.
import { genById, claimById, markupContext } from './content.js';
import { renderInline } from './markup.js';
import * as story from './story.js';

const root = document.getElementById('figures');

export const QUALIFIER_TEXT = {
  theoretical: 'Theoretical maximum',
  'specified-not-shipping': 'In the standard; not in current devices',
  optional: 'Optional',
  typical: 'Typical',
  certification: 'Wi-Fi Alliance requirement',
  normative: null
};

function qualifierBadge(qualifier, regulatoryDomain) {
  const text = qualifier === 'regulatory' ? `Varies by country: ${regulatoryDomain}` : QUALIFIER_TEXT[qualifier];
  if (!text) return null;
  const badge = document.createElement('span');
  badge.className = `badge badge-${qualifier}`;
  badge.textContent = text;
  return badge;
}

function swatch(genId) {
  const s = document.createElement('span');
  s.className = `swatch swatch-${genId}`;
  s.setAttribute('aria-hidden', 'true');
  return s;
}

function cellText(figure, genId) {
  const value = figure.values[genId];
  const claim = claimById.get(figure.claimIds?.[genId]);
  const unit = figure.unit ?? (typeof value === 'number' ? claim?.unit : null);
  return unit ? `${value} ${unit}` : String(value);
}


function render({ tab, generation }) {
  root.replaceChildren();
  const figures = tab?.keyFigures ?? [];
  if (!figures.length) return;
  const gens = tab.compareGenerations;

  const card = document.createElement('section');
  card.className = 'card figures';
  card.setAttribute('aria-labelledby', 'figures-title');
  const title = document.createElement('h3');
  title.id = 'figures-title';
  title.textContent = 'Key figures';
  card.append(title);

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  const table = document.createElement('table');
  table.className = 'figures-table';
  const thead = table.createTHead().insertRow();
  const corner = document.createElement('th');
  corner.scope = 'col';
  corner.textContent = 'Figure';
  thead.append(corner);
  for (const genId of gens) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.dataset.gen = genId;
    if (genId === generation || genId === 'wifi7') th.classList.add('is-selected');
    const g = genById.get(genId);
    const name = document.createElement('span');
    name.textContent = g.name;
    const ieee = document.createElement('span');
    ieee.className = 'th-ieee';
    ieee.textContent = g.ieee.replace('IEEE ', '');
    th.append(swatch(genId), name, ieee);
    thead.append(th);
  }

  const body = table.createTBody();
  for (const figure of figures) {
    const row = body.insertRow();
    row.dataset.headline = String(!!figure.headline);
    const th = document.createElement('th');
    th.scope = 'row';
    const metric = document.createElement('span');
    metric.className = 'metric';
    metric.textContent = figure.metric;
    th.append(metric);
    const badge = qualifierBadge(figure.qualifier, figure.regulatoryDomain);
    if (badge) th.append(badge);
    if (figure.note) {
      const note = document.createElement('span');
      note.className = 'figure-note';
      note.innerHTML = renderInline(figure.note, markupContext); // safe: renderMarkup
      th.append(note);
    }
    row.append(th);
    for (const genId of gens) {
      const td = row.insertCell();
      td.dataset.gen = genId;
      if (genId === generation || genId === 'wifi7') td.classList.add('is-selected');
      const value = figure.values[genId];
      if (value === null || value === undefined) {
        td.className += ' not-supported';
        td.textContent = 'Not supported';
        continue;
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'figure-value';
      button.dataset.claim = figure.claimIds[genId];
      button.textContent = cellText(figure, genId);
      button.setAttribute('aria-label', `${figure.metric}, ${genById.get(genId).name}: ${cellText(figure, genId)}. Show source.`);
      td.append(button);
      const cellBadge = qualifierBadge(figure.cellQualifiers?.[genId], figure.regulatoryDomain);
      if (cellBadge) td.append(cellBadge);
    }
  }
  wrap.append(table);
  card.append(wrap);

  root.append(card);
}

export function initFigures() {
  story.on('tab', render);
  story.on('generation', render);
}
