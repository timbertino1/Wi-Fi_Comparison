// References tab: source policy, references by publisher, the claims register and the glossary.
// Built with DOM APIs and textContent; external links open safely.
import { references, claims, glossary, termTabs, tabs, tabById, sourcePolicy, publisherById, claimById } from './content.js';
import * as story from './story.js';
import * as router from './router.js';

const extra = document.getElementById('extra');
const METHOD = { stated: 'Stated in source', derived: 'Derived', illustrative: 'Illustrative' };

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function section(id, title) {
  const s = el('section', 'card ref-section');
  s.id = id;
  s.setAttribute('aria-labelledby', `${id}-title`);
  const h = el('h3', '', title);
  h.id = `${id}-title`;
  s.append(h);
  return s;
}

function externalLink(href, text) {
  const a = el('a', '', text);
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}

/** Which tabs use each claim (text citations, key figures, derivation inputs). */
function claimUsage() {
  const usage = new Map(claims.map((c) => [c.id, new Set()]));
  for (const tab of tabs) {
    for (const [, id] of JSON.stringify(tab).matchAll(/\{\{([a-z0-9-]+)\}\}/g)) usage.get(id)?.add(tab.id);
    for (const k of tab.keyFigures ?? []) for (const id of Object.values(k.claimIds ?? {})) usage.get(id)?.add(tab.id);
  }
  for (const c of claims) for (const id of Object.values(c.derivation?.inputs ?? {})) for (const t of usage.get(c.id) ?? []) usage.get(id)?.add(t);
  return usage;
}

function renderPolicy() {
  const s = section('source-policy', 'Source policy');
  for (const tier of [1, 2]) {
    s.append(el('h4', '', tier === 1 ? 'Tier 1 — required for every technical figure' : 'Tier 2 — healthcare context and corroboration only'));
    const ul = el('ul', 'ref-publishers');
    for (const p of sourcePolicy.publishers.filter((x) => x.tier === tier)) {
      const li = el('li');
      li.append(el('strong', '', p.name), document.createTextNode(` — ${p.use}`));
      ul.append(li);
    }
    s.append(ul);
  }
  s.append(el('h4', '', 'Never cited'));
  const ex = el('ul', 'ref-excluded');
  for (const x of sourcePolicy.excluded) {
    const li = el('li');
    li.append(el('strong', '', x.category), document.createTextNode(` — ${x.description}`));
    ex.append(li);
  }
  s.append(ex);
  return s;
}

function renderReferences() {
  const s = section('reference-list', `References (${references.length})`);
  for (const p of sourcePolicy.publishers) {
    const refs = references.filter((r) => r.publisher === p.id);
    if (!refs.length) continue;
    s.append(el('h4', '', p.name));
    const ul = el('ul', 'ref-list');
    for (const r of refs) {
      const li = el('li', 'ref-item');
      li.id = `ref-${r.id}`;
      li.append(externalLink(r.url, r.title));
      const tags = el('span', 'prov-tags');
      tags.append(el('span', 'badge', `Tier ${r.tier}`), el('span', 'badge badge-muted', r.access === 'open' ? 'Open access' : 'Paywalled'));
      if (r.status === 'superseded') tags.append(el('span', 'badge badge-muted', 'Superseded edition'));
      li.append(el('span', 'prov-meta', `${r.identifier}${r.edition ? ` · ${r.edition}` : ''} · ${r.date}`), tags);
      ul.append(li);
    }
    s.append(ul);
  }
  return s;
}

function renderRegister() {
  const usage = claimUsage();
  const verified = claims.filter((c) => c.verification?.verifiedOn).length;
  const s = section('claims-register', `Claims register (${claims.length} claims, ${verified} verified)`);
  const filterLabel = el('label', 'ref-filter', 'Show claims used on: ');
  const select = el('select');
  select.append(new Option('All tabs', ''));
  for (const t of tabs.filter((x) => x.kind !== 'references')) select.append(new Option(t.title, t.id));
  filterLabel.append(select);
  s.append(filterLabel);

  const wrap = el('div', 'table-wrap');
  const table = el('table', 'figures-table register-table');
  const head = table.createTHead().insertRow();
  for (const h of ['Claim', 'Value', 'Method', 'Sources', 'Verified']) {
    const th = el('th', '', h);
    th.scope = 'col';
    head.append(th);
  }
  const body = table.createTBody();
  for (const c of claims) {
    const row = body.insertRow();
    row.id = `claim-${c.id}`;
    row.dataset.tabs = [...(usage.get(c.id) ?? [])].join(' ');
    const name = el('th');
    name.scope = 'row';
    const button = el('button', 'figure-value', c.statement);
    button.type = 'button';
    button.dataset.claim = c.id;
    name.append(button);
    row.append(name);
    row.insertCell().textContent = c.value === null ? '—' : `${c.value}${c.unit ? ` ${c.unit}` : ''}`;
    row.insertCell().textContent = METHOD[c.method];
    row.insertCell().textContent = (c.sources ?? []).map((x) => `${publisherById.get(refById(x.referenceId)?.publisher)?.name ?? ''} ${refById(x.referenceId)?.identifier ?? x.referenceId} — ${x.locator}`).join('; ');
    row.insertCell().textContent = c.verification?.verifiedOn ? `${c.verification.verifiedOn} (${c.verification.verifiedBy})` : 'Not yet';
  }
  select.addEventListener('change', () => {
    for (const row of body.rows) row.hidden = !!select.value && !row.dataset.tabs.split(' ').includes(select.value);
  });
  wrap.append(table);
  s.append(wrap);
  return s;
}

function refById(id) {
  return references.find((r) => r.id === id);
}

function renderGlossary() {
  const s = section('glossary', `Glossary (${glossary.length} terms)`);
  const dl = el('dl', 'glossary-list');
  for (const t of [...glossary].sort((a, b) => a.term.localeCompare(b.term))) {
    const dt = el('dt', '', t.term);
    dt.id = `term-${t.id}`;
    if (t.expansion) dt.append(el('span', 'glossary-expansion', ` (${t.expansion})`));
    const dd = el('dd', '', t.definition);
    const used = termTabs.get(t.id) ?? [];
    if (used.length) {
      const where = el('span', 'glossary-where', ' Used in: ');
      used.forEach((id, i) => {
        const a = el('a', '', tabById.get(id).title);
        a.href = `#/${id}`;
        where.append(a);
        if (i < used.length - 1) where.append(document.createTextNode(', '));
      });
      dd.append(where);
    }
    dl.append(dt, dd);
  }
  s.append(dl);
  return s;
}

function highlight(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.classList.add('is-highlighted');
  target.scrollIntoView({ block: 'center' });
  setTimeout(() => target.classList.remove('is-highlighted'), 4000);
}

let rendered = null;

export function initReferences() {
  story.on('tab', ({ tabId }) => {
    rendered?.remove();
    rendered = null;
    if (tabId !== 'references') return;
    rendered = el('div', 'references');
    rendered.append(renderPolicy(), renderReferences(), renderRegister(), renderGlossary());
    extra.append(rendered);
  });
  router.onRoute((route) => {
    if (route.tabId !== 'references') return;
    const ref = route.params.get('ref');
    const claim = route.params.get('claim');
    requestAnimationFrame(() => {
      if (ref) highlight(`ref-${ref}`);
      if (claim && claimById.has(claim)) {
        const select = document.querySelector('#claims-register select');
        if (select) {
          select.value = '';
          select.dispatchEvent(new Event('change'));
        }
        highlight(`claim-${claim}`);
      }
    });
  });
}
