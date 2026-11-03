// All site content, bundled at build time (static imports; no runtime fetch — works from file://).
import generationsJson from '../../content/generations.json';
import glossaryJson from '../../content/glossary.json';
import scenariosJson from '../../content/scenarios.json';
import claimsJson from '../../content/claims.json';

const index = (list) => new Map(list.map((x) => [x.id, x]));


import tab01 from '../../content/tabs/01-overview.json';
import tab02 from '../../content/tabs/02-6ghz-320mhz.json';
import tab03 from '../../content/tabs/03-data-rates.json';
import tab04 from '../../content/tabs/04-mlo.json';
import tab05 from '../../content/tabs/05-twt.json';
import tab06 from '../../content/tabs/06-closing.json';

export const tabs = [tab01, tab02, tab03, tab04, tab05, tab06].sort((a, b) => a.order - b.order);
export const tabById = index(tabs);
export const generations = generationsJson.generations;
export const genById = index(generations);
export const glossary = glossaryJson.terms;
export const termById = index(glossary);
export const scenarios = scenariosJson.scenarios;
export const scenarioById = index(scenarios);
export const claims = claimsJson.claims;
export const claimById = index(claims);

/** The only way app and scene code obtain a number to display (contracts/scene-module.md). */
export function claim(id) {
  const c = claimById.get(id);
  if (!c) throw new Error(`Unknown claim "${id}"`);
  return { value: c.value, unit: c.unit, method: c.method, statement: c.statement };
}

/** Context object for renderMarkup(). */
export const markupContext = { termById };
