// "How we know this" panel for claim citations and key-figure values (contracts/ui-navigation.md).
// Built with DOM APIs and textContent only — no HTML strings.
import { claimById, refById, publisherById } from './content.js';
import { plainText } from './markup.js';

const METHOD = { stated: 'Stated in source', derived: 'Derived', illustrative: 'Illustrative' };
const TIER = { 1: 'Tier 1: standards body / regulator', 2: 'Tier 2: peer-reviewed / health authority' };
const FORMULA = {
  phyRate: 'streams × data subcarriers × bits per subcarrier × coding rate ÷ (symbol time + guard interval)',
  channelCount: 'whole channels that fit between the band edges',
  percentGain: '(new ÷ old − 1) × 100',
  ratio: 'new ÷ old',
  product: 'product of the inputs'
};

let panel = null;
let returnFocus = null;

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const valueText = (c) => (c.value === null || c.value === undefined ? '' : `${c.value}${c.unit ? ` ${c.unit}` : ''}`);

function sourceItem(source) {
  const ref = refById.get(source.referenceId);
  const li = el('li', 'prov-source');
  if (!ref) return li;
  const title = el('a', 'prov-source-title', ref.title);
  title.href = ref.url;
  title.target = '_blank';
  title.rel = 'noopener noreferrer';
  const meta = el('span', 'prov-meta', `${publisherById.get(ref.publisher)?.name ?? ref.publisher} · ${ref.identifier}${ref.edition ? `, ${ref.edition}` : ''}`);
  const where = el('span', 'prov-where');
  where.append(el('strong', '', 'Where: '), document.createTextNode(source.locator));
  const tags = el('span', 'prov-tags');
  tags.append(el('span', 'badge', TIER[ref.tier]), el('span', 'badge badge-muted', ref.access === 'open' ? 'Open access' : 'Paywalled'));
  if (ref.status === 'superseded') tags.append(el('span', 'badge badge-muted', 'Superseded edition'));
  li.append(title, meta, where, tags);
  if (source.excerpt) li.append(el('blockquote', 'prov-excerpt', source.excerpt));
  return li;
}

function close() {
  if (!panel) return;
  panel.remove();
  panel = null;
  document.removeEventListener('pointerdown', onOutside, true);
  returnFocus?.focus();
  returnFocus = null;
}

function onOutside(e) {
  if (panel && !panel.contains(e.target) && !e.target.closest('[data-claim]')) close();
}

function open(trigger) {
  const claim = claimById.get(trigger.dataset.claim);
  if (!claim) return;
  close();
  returnFocus = trigger;
  const technical = document.documentElement.dataset.view === 'technical';

  panel = el('div', 'provenance');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'prov-title');
  panel.tabIndex = -1;

  const header = el('div', 'prov-header');
  header.append(el('p', 'prov-kicker', 'How we know this'));
  const title = el('h2', 'prov-title', claim.statement);
  title.id = 'prov-title';
  header.append(title);
  const facts = el('p', 'prov-facts');
  if (valueText(claim)) facts.append(el('strong', 'prov-value', valueText(claim)), document.createTextNode(' '));
  facts.append(el('span', `badge badge-method-${claim.method}`, METHOD[claim.method] ?? claim.method));
  header.append(facts);
  panel.append(header);

  const v = claim.verification ?? {};
  const verified = el('p', 'prov-verified', v.verifiedOn ? `Verified ${v.verifiedOn} by ${v.verifiedBy}` : 'Not yet verified');

  // Short form (Leadership view): primary source and verification, with "How we know this" to expand.
  const primary = refById.get(claim.sources?.[0]?.referenceId);
  const short = el('p', 'prov-short');
  short.append(el('strong', '', 'Source: '), document.createTextNode(primary ? `${publisherById.get(primary.publisher)?.name ?? primary.publisher} — ${primary.identifier}` : '—'));

  const full = el('div', 'prov-full');
  full.append(el('h3', '', 'Sources'));
  const list = el('ul', 'prov-sources');
  for (const s of claim.sources ?? []) list.append(sourceItem(s));
  full.append(list);

  if (claim.derivation) {
    const d = claim.derivation;
    full.append(el('h3', '', 'How it was calculated'));
    full.append(el('p', 'prov-formula', `${d.explanation || FORMULA[d.formula] || d.formula}`));
    const inputs = el('ul', 'prov-inputs');
    for (const [name, id] of Object.entries(d.inputs ?? {})) {
      const input = claimById.get(id);
      const li = el('li');
      const button = el('button', 'prov-input', `${input?.statement ?? id}: ${input ? valueText(input) : '?'}`);
      button.type = 'button';
      button.dataset.claim = id;
      button.setAttribute('aria-label', `Input ${name}: ${input?.statement ?? id}, ${input ? valueText(input) : ''}. Show its source.`);
      li.append(button);
      inputs.append(li);
    }
    for (const [name, value] of Object.entries(d.constants ?? {})) inputs.append(el('li', 'prov-constant', `${name} = ${value} (defines the question asked)`));
    full.append(inputs);
  }
  if (v.notes) full.append(el('p', 'prov-notes', v.notes));

  const links = el('p', 'prov-links');
  const all = el('a', '', 'All sources');
  all.href = `#/references?ref=${claim.sources?.[0]?.referenceId ?? ''}`;
  const register = el('a', '', 'In the claims register');
  register.href = `#/references?claim=${claim.id}`;
  links.append(all, document.createTextNode(' · '), register);
  for (const a of [all, register]) a.addEventListener('click', close);
  full.append(links);

  const body = el('div', 'prov-body');
  if (technical) {
    body.append(full, verified);
  } else {
    const more = el('details', 'prov-more');
    more.append(el('summary', '', 'How we know this'), full);
    body.append(short, verified, more);
  }
  panel.append(body);

  const closeButton = el('button', 'control prov-close', 'Close');
  closeButton.type = 'button';
  closeButton.addEventListener('click', close);
  panel.append(closeButton);

  document.body.append(panel);
  panel.setAttribute('aria-describedby', 'prov-title');
  panel.dataset.claim = claim.id;
  panel.focus();
  document.addEventListener('pointerdown', onOutside, true);
}

export function initProvenance() {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.cite, .figure-value, .prov-input');
    if (trigger?.dataset.claim) {
      e.preventDefault();
      open(trigger);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel) {
      e.preventDefault();
      e.stopImmediatePropagation();
      close();
    }
  }, true);
}

/** Plain-language summary used by the claims register. */
export function claimSummary(claim) {
  return plainText(claim.statement);
}
