// All site content, bundled at build time (static imports; no runtime fetch — works from file://).
import generationsJson from '../../content/generations.json';
import referencesJson from '../../content/references.json';
import glossaryJson from '../../content/glossary.json';
import scenariosJson from '../../content/scenarios.json';
import claimsJson from '../../content/claims.json';
import sourcePolicyJson from '../../content/source-policy.json';
import tab01 from '../../content/tabs/01-overview.json';
import tab02 from '../../content/tabs/02-6ghz-320mhz.json';
import tab03 from '../../content/tabs/03-mlo.json';
import tab04 from '../../content/tabs/04-qam-puncturing-multiru.json';
import tab05 from '../../content/tabs/05-security.json';
import tab06 from '../../content/tabs/06-twt.json';
import tab07 from '../../content/tabs/07-density.json';
import tab08 from '../../content/tabs/08-latency.json';
import tab09 from '../../content/tabs/09-bandwidth-poe.json';
import tab10 from '../../content/tabs/10-wifi8.json';
import tab11 from '../../content/tabs/11-references.json';

const index = (list) => new Map(list.map((x) => [x.id, x]));

export const tabs = [tab01, tab02, tab03, tab04, tab05, tab06, tab07, tab08, tab09, tab10, tab11].sort((a, b) => a.order - b.order);
export const tabById = index(tabs);
export const generations = generationsJson.generations;
export const genById = index(generations);
export const glossary = glossaryJson.terms;
export const termById = index(glossary);
export const references = referencesJson.references;
export const refById = index(references);
export const scenarios = scenariosJson.scenarios;
export const scenarioById = index(scenarios);
export const claims = claimsJson.claims;
export const claimById = index(claims);
export const sourcePolicy = sourcePolicyJson;
export const publisherById = index(sourcePolicy.publishers);

/** The only way app and scene code obtain a number to display (contracts/scene-module.md). */
export function claim(id) {
  const c = claimById.get(id);
  if (!c) throw new Error(`Unknown claim "${id}"`);
  return { value: c.value, unit: c.unit, method: c.method, statement: c.statement };
}

// Citation numbers are stable across the whole site: claims are numbered in order of first use.
const citationOrder = new Map();
for (const tab of tabs) {
  for (const [, id] of JSON.stringify(tab).matchAll(/\{\{([a-z0-9-]+)\}\}/g)) {
    if (claimById.has(id) && !citationOrder.has(id)) citationOrder.set(id, citationOrder.size + 1);
  }
  for (const k of tab.keyFigures ?? []) {
    for (const id of Object.values(k.claimIds ?? {})) if (!citationOrder.has(id)) citationOrder.set(id, citationOrder.size + 1);
  }
}
export function citationNumber(claimId) {
  if (!citationOrder.has(claimId)) citationOrder.set(claimId, citationOrder.size + 1);
  return citationOrder.get(claimId);
}

/** Glossary term id → ids of tabs where it is marked up. */
export const termTabs = new Map(glossary.map((t) => [t.id, []]));
for (const tab of tabs) {
  const text = JSON.stringify(tab);
  for (const t of glossary) if (text.includes(`[[${t.id}]]`) || text.includes(`[[${t.id}|`)) termTabs.get(t.id).push(tab.id);
}

/** Context object for renderMarkup(). */
export const markupContext = { termById, claimById, refById, citationNumber };
