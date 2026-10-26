// Validates content/ against data-model.md "Validation rules" 1–19.
// Usage: node scripts/validate-content.mjs [--release]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { formulas, recompute } from './derivations.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const BEAT_ORDER = ['problem', 'what', 'how', 'improvement', 'why'];
const NARRATIVE_BEATS = ['intro', 'context', 'outlook'];
const GUARANTEE_PHRASES = ['ensures compliance', 'guarantee', 'guarantees', 'guaranteed', 'eliminates risk', 'hipaa compliant', 'prevents patient harm'];

export const TERM_RE = /\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g;
export const CLAIM_RE = /\{\{([a-z0-9-]+)\}\}/g;
export const REF_RE = /\{\{ref:([a-z0-9-]+)\}\}/g;

// Numbers with units that must carry a claim citation (rule 17), and the patterns exempt from it.
const NUMBER_WITH_UNIT_RE = /(?<![\w.])\d+(?:[.,]\d+)*\s?(?:%|percent\b|[GMk]bps\b|[GM]b\/s\b|[GMk]Hz\b|W\b|watts?\b|ms\b|µs\b|us\b|dBm?\b|spatial streams?\b|streams?\b|channels?\b|subcarriers?\b|bits?\b|×|x\b)/i;
const EXEMPT_RES = [/Wi-Fi\s?\d+E?/gi, /802\.\d+[a-z]*(?:-\d{4})?/gi, /\b(?:Type|Class|Clause|Table|Annex|Step|Tab)\s\d+/gi, /\b\d+(?:st|nd|rd|th)\b/gi, /\b(?:19|20)\d{2}\b/g];

export function loadContent(dir = path.join(root, 'content')) {
  const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const tabsDir = path.join(dir, 'tabs');
  const tabs = fs.readdirSync(tabsDir).filter((f) => f.endsWith('.json')).sort()
    .map((f) => ({ ...JSON.parse(fs.readFileSync(path.join(tabsDir, f), 'utf8')), _file: `tabs/${f}` }));
  return {
    generations: read('generations.json').generations,
    references: read('references.json').references,
    glossary: read('glossary.json').terms,
    scenarios: read('scenarios.json').scenarios,
    claims: read('claims.json').claims,
    sourcePolicy: read('source-policy.json'),
    tabs
  };
}

export function loadDenylist(file = path.join(root, 'tests', 'content', 'denylist.txt')) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}

const words = (s) => (s ?? '').trim().split(/\s+/).filter(Boolean).length;
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const matchAll = (text, re) => [...(text ?? '').matchAll(new RegExp(re.source, re.flags))];
const stripMarkup = (text) => (text ?? '').replace(TERM_RE, (_, id, label) => label ?? id).replace(REF_RE, '').replace(CLAIM_RE, '').replace(/\*\*/g, '');

/** Every string in an object tree, with a path for messages. */
function* strings(value, at) {
  if (typeof value === 'string') yield [at, value];
  else if (Array.isArray(value)) for (const [i, v] of value.entries()) yield* strings(v, `${at}[${i}]`);
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) if (!k.startsWith('_')) yield* strings(v, `${at}.${k}`);
}

/** Text fields of a tab that hold prose (used by rules 2, 9, 12, 17). */
function tabTextFields(tab) {
  const out = [];
  out.push([`${tab._file}.summary`, tab.summary]);
  if (tab.wifi7Adds) out.push([`${tab._file}.wifi7Adds`, tab.wifi7Adds]);
  for (const [i, b] of (tab.beats ?? []).entries()) {
    for (const f of ['heading', 'body', 'bottomLine', 'deepDive', 'sceneDescription']) if (b[f]) out.push([`${tab._file}.beats[${i}].${f}`, b[f]]);
  }
  for (const [i, s] of (tab.sections ?? []).entries()) {
    for (const f of ['heading', 'body']) if (s[f]) out.push([`${tab._file}.sections[${i}].${f}`, s[f]]);
  }
  for (const [i, k] of (tab.keyFigures ?? []).entries()) if (k.note) out.push([`${tab._file}.keyFigures[${i}].note`, k.note]);
  return out.filter(([, t]) => typeof t === 'string');
}

function hostAllowed(host, domains) {
  return domains.some((d) => (d.startsWith('*.') ? host === d.slice(2) || host.endsWith(d.slice(1)) : host === d));
}

/** Text that needs a claim citation but has none (rule 17). Returns offending snippets. */
export function uncitedNumbers(text) {
  const problems = [];
  for (const sentence of (text ?? '').split(/(?<=[.!?])\s+/)) {
    let scrubbed = sentence.replace(TERM_RE, (_, id, label) => label ?? id).replace(REF_RE, '');
    for (const re of EXEMPT_RES) scrubbed = scrubbed.replace(re, ' ');
    const m = scrubbed.match(NUMBER_WITH_UNIT_RE);
    if (m && !CLAIM_RE.test(sentence)) problems.push(m[0]);
    CLAIM_RE.lastIndex = 0;
  }
  return problems;
}

export async function validateContent({ release = false, content = loadContent(), denylist = loadDenylist(), sceneDir = path.join(root, 'src', 'scenes'), today = new Date() } = {}) {
  const errors = [];
  const warnings = [];
  const err = (rule, msg) => errors.push(`[rule ${rule}] ${msg}`);
  const warn = (rule, msg) => warnings.push(`[rule ${rule}] ${msg}`);
  const releaseOrWarn = (rule, msg) => (release ? err(rule, msg) : warn(rule, msg));

  const { generations, references, glossary, scenarios, claims, sourcePolicy, tabs } = content;
  const byId = (list) => new Map(list.map((x) => [x.id, x]));
  const genById = byId(generations);
  const refById = byId(references);
  const termById = byId(glossary);
  const scenarioById = byId(scenarios);
  const claimById = byId(claims);
  const publisherById = byId(sourcePolicy.publishers ?? []);

  // Rule 1: unique ids, contiguous tab order.
  for (const [name, list] of Object.entries({ generations, references, glossary, scenarios, claims, tabs })) {
    const seen = new Set();
    for (const x of list) {
      if (!x.id) err(1, `${name}: entry without id`);
      else if (seen.has(x.id)) err(1, `${name}: duplicate id "${x.id}"`);
      seen.add(x.id);
    }
  }
  for (const c of claims) if (refById.has(c.id)) err(1, `claim id "${c.id}" collides with a reference id`);
  const orders = tabs.map((t) => t.order).sort((a, b) => a - b);
  orders.forEach((o, i) => { if (o !== i + 1) err(1, `tab order must be contiguous from 1; found ${orders.join(',')}`); });
  if (tabs.length !== 11) err(1, `expected 11 tabs, found ${tabs.length}`);

  // Usage tracking for orphan checks (rules 10, 18).
  const citedRefs = new Set();
  const usedClaims = new Set();
  for (const g of generations) {
    for (const r of g.referenceIds ?? []) { citedRefs.add(r); if (!refById.has(r)) err(2, `generation ${g.id}: unknown reference "${r}"`); }
    if (g.yearClaimId) { usedClaims.add(g.yearClaimId); if (!claimById.has(g.yearClaimId)) err(2, `generation ${g.id}: unknown claim "${g.yearClaimId}"`); }
    if (!g.referenceIds?.length) err(2, `generation ${g.id}: needs ≥ 1 reference`);
  }
  if (genById.get('wifi8')?.status !== 'in-development') err(2, 'wifi8 must have status "in-development"');

  const checkMarkup = (where, text, tabTerms) => {
    for (const [, id] of matchAll(text, TERM_RE)) { if (!termById.has(id)) err(2, `${where}: unknown glossary term [[${id}]]`); tabTerms?.add(id); }
    for (const [, id] of matchAll(text, CLAIM_RE)) { usedClaims.add(id); if (!claimById.has(id)) err(2, `${where}: unknown claim {{${id}}}`); }
    for (const [, id] of matchAll(text, REF_RE)) { citedRefs.add(id); if (!refById.has(id)) err(2, `${where}: unknown reference {{ref:${id}}}`); }
    // Rule 12: no markup or script-like content outside the inline forms.
    const bare = stripMarkup(text);
    if (/[<>]/.test(bare) || /javascript:/i.test(bare) || /data:/i.test(bare)) err(12, `${where}: contains "<", ">", "javascript:" or "data:"`);
  };

  // Scenarios (rules 2, 8, 12, 17).
  for (const s of scenarios) {
    for (const f of ['location', 'problem', 'outcomeSupported']) {
      const where = `scenario ${s.id}.${f}`;
      checkMarkup(where, s[f]);
      for (const n of uncitedNumbers(s[f])) err(17, `${where}: "${n}" needs a {{claim}} citation in the same sentence`);
    }
  }

  // Tabs.
  for (const tab of tabs) {
    const where = tab._file ?? tab.id;
    const draft = tab.draft === true;
    if (draft && release) err(3, `${where}: still marked draft`);
    if ((tab.title ?? '').length > 40) err(1, `${where}: title longer than 40 characters`);

    for (const g of tab.compareGenerations ?? []) if (!genById.has(g)) err(2, `${where}: unknown generation "${g}"`);
    if (tab.defaultCompare && !genById.has(tab.defaultCompare)) err(2, `${where}: unknown defaultCompare "${tab.defaultCompare}"`);
    if (tab.introducedIn && !genById.has(tab.introducedIn)) err(2, `${where}: unknown introducedIn "${tab.introducedIn}"`);
    for (const id of tab.scenarioIds ?? []) if (!scenarioById.has(id)) err(2, `${where}: unknown scenario "${id}"`);

    // Rule 6.
    if (tab.kind === 'feature' && tab.introducedIn && tab.introducedIn !== 'wifi7' && !tab.wifi7Adds?.trim()) err(6, `${where}: introducedIn ${tab.introducedIn} requires wifi7Adds`);

    if (tab.kind === 'feature') {
      if (!(tab.compareGenerations ?? []).includes('wifi7') || !(tab.compareGenerations ?? []).some((g) => g === 'wifi6' || g === 'wifi6e')) {
        err(2, `${where}: compareGenerations must include wifi7 and wifi6 or wifi6e`);
      }
    }

    // Rule 3: beat structure.
    const beats = tab.beats ?? [];
    if (!draft) {
      if (tab.kind === 'feature') {
        const types = beats.map((b) => b.type).join(',');
        if (types !== BEAT_ORDER.join(',')) err(3, `${where}: feature beats must be ${BEAT_ORDER.join(' → ')}; found ${types || 'none'}`);
      } else if (tab.kind === 'overview' || tab.kind === 'roadmap') {
        if (beats.length < 3 || beats.length > 6) err(3, `${where}: needs 3–6 beats; found ${beats.length}`);
        for (const b of beats) if (!NARRATIVE_BEATS.includes(b.type)) err(3, `${where}: beat type "${b.type}" must be one of ${NARRATIVE_BEATS.join('/')}`);
      }
    }

    // Field limits.
    for (const [i, b] of beats.entries()) {
      const at = `${where} beat ${i + 1}`;
      if ((b.heading ?? '').length > 60) err(1, `${at}: heading longer than 60 characters`);
      if (words(b.sceneDescription) < 20) err(1, `${at}: sceneDescription needs ≥ 20 words`);
      if (!(b.durationMs >= 6000 && b.durationMs <= 20000)) err(1, `${at}: durationMs must be 6000–20000`);
      // Rule 11: audience layers.
      if (!draft && tab.kind === 'feature') {
        if (!b.bottomLine?.trim()) err(11, `${at}: bottomLine required`);
        else if (words(stripMarkup(b.bottomLine)) > 40) err(11, `${at}: bottomLine longer than 40 words`);
        if ((b.type === 'how' || b.type === 'improvement') && !b.deepDive?.trim()) err(11, `${at}: deepDive required on ${b.type} beats`);
      }
    }

    // Text fields: markup resolution, security, uncited numbers, guarantee phrases.
    const tabTerms = new Set();
    const fields = tabTextFields(tab);
    for (const [at, text] of fields) {
      checkMarkup(at, text, tabTerms);
      if (!draft) for (const n of uncitedNumbers(text)) err(17, `${at}: "${n}" needs a {{claim}} citation in the same sentence`);
    }

    // Rule 9: glossary terms used on the tab are marked up at least once.
    if (!draft) {
      // Rule 9 covers the fields that render markup: beat heading/body/bottomLine/deepDive and section body.
      const plain = fields.filter(([at]) => /\.(heading|body|bottomLine|deepDive)$/.test(at)).map(([, t]) => stripMarkup(t)).join(' \n ');
      for (const term of glossary) {
        const names = [term.term, term.expansion].filter(Boolean);
        const used = names.some((n) => new RegExp(`(?<![\\w-])${escapeRe(n)}(?![\\w-])`, 'i').test(plain));
        if (used && !tabTerms.has(term.id)) err(9, `${where}: uses "${term.term}" but never marks it [[${term.id}]]`);
      }
    }

    // Key figures (rules 5, 16) and minimum counts.
    const figures = tab.keyFigures ?? [];
    for (const k of figures) {
      const at = `${where} figure ${k.id}`;
      if (/peak|max/i.test(k.metric ?? '') && /rate/i.test(k.metric ?? '') && !['theoretical', 'specified-not-shipping'].includes(k.qualifier)) {
        err(5, `${at}: peak/max rates must be qualified theoretical or specified-not-shipping`);
      }
      if (k.qualifier === 'regulatory' && !k.regulatoryDomain) err(5, `${at}: regulatory figures need regulatoryDomain`);
      for (const [gen, value] of Object.entries(k.values ?? {})) {
        if (!genById.has(gen)) err(2, `${at}: unknown generation "${gen}"`);
        if (value === null) continue;
        const claimId = k.claimIds?.[gen];
        if (!claimId) { err(16, `${at}: value for ${gen} has no claimIds entry`); continue; }
        usedClaims.add(claimId);
        const claim = claimById.get(claimId);
        if (!claim) { err(2, `${at}: unknown claim "${claimId}"`); continue; }
        if (claim.method === 'illustrative') err(16, `${at}: illustrative claim "${claimId}" cannot back a displayed number`);
        if (claim.value !== null && String(claim.value) !== String(value)) err(16, `${at}: ${gen} shows ${value} but claim "${claimId}" says ${claim.value}`);
      }
    }
    if (tab.kind === 'feature' && release) {
      if (figures.length < 2) err(16, `${where}: needs ≥ 2 key figures`);
      if (!(tab.scenarioIds ?? []).length) err(16, `${where}: needs ≥ 1 scenario`);
      const headline = figures.filter((k) => k.headline).length;
      if (headline < 2 || headline > 3) err(11, `${where}: needs 2–3 headline figures; found ${headline}`);
    }
  }

  // Rule 4: scene states declared by scene modules.
  for (const tab of tabs) {
    if (!tab.sceneId) continue;
    const file = path.join(sceneDir, `${tab.sceneId}.js`);
    const states = [...(tab.beats ?? []).map((b) => b.sceneState), ...(tab.sections ?? []).map((s) => s.sceneState)].filter(Boolean);
    if (!fs.existsSync(file)) { if (states.length) warn(4, `${tab._file}: scene module src/scenes/${tab.sceneId}.js not found yet`); continue; }
    let mod;
    try { mod = (await import(pathToFileURL(file).href)).default; } catch (e) { err(4, `src/scenes/${tab.sceneId}.js failed to import in Node (must be import-safe): ${e.message}`); continue; }
    for (const s of states) if (!mod?.states?.includes(s)) err(4, `${tab._file}: scene state "${s}" not declared by src/scenes/${tab.sceneId}.js`);
  }

  // Glossary.
  for (const t of glossary) if (words(t.definition) > 50) err(1, `glossary ${t.id}: definition longer than 50 words`);

  // Rule 13: source policy.
  for (const r of references) {
    const pub = publisherById.get(r.publisher);
    if (!pub) { err(13, `reference ${r.id}: publisher "${r.publisher}" is not in source-policy.json`); continue; }
    if (r.tier !== pub.tier) err(13, `reference ${r.id}: tier ${r.tier} does not match publisher tier ${pub.tier}`);
    let url;
    try { url = new URL(r.url); } catch { err(12, `reference ${r.id}: invalid url`); continue; }
    if (url.protocol !== 'https:') err(12, `reference ${r.id}: url must use https`);
    if (!hostAllowed(url.hostname, pub.domains)) err(13, `reference ${r.id}: host ${url.hostname} is not an allowlisted domain of ${pub.name}`);
    if (r.publisher === 'peer-reviewed' && !/^10\.\d{4,}\//.test(r.identifier ?? '')) err(13, `reference ${r.id}: peer-reviewed sources need a DOI identifier`);
    if (!['current', 'superseded'].includes(r.status)) err(13, `reference ${r.id}: status must be current or superseded`);
    if (!['open', 'paywalled'].includes(r.access)) err(13, `reference ${r.id}: access must be open or paywalled`);
  }

  // Rules 14, 15, 19: claims.
  const maxAgeMs = (sourcePolicy.maxVerificationAgeDays ?? 365) * 86400000;
  for (const c of claims) {
    const at = `claim ${c.id}`;
    if (!['technical', 'context'].includes(c.kind)) err(14, `${at}: kind must be technical or context`);
    if (!['stated', 'derived', 'illustrative'].includes(c.method)) err(14, `${at}: method must be stated, derived or illustrative`);
    if (!c.sources?.length) err(14, `${at}: needs ≥ 1 source`);
    const tiers = [];
    for (const s of c.sources ?? []) {
      const ref = refById.get(s.referenceId);
      if (!ref) { err(2, `${at}: unknown reference "${s.referenceId}"`); continue; }
      citedRefs.add(ref.id);
      tiers.push(ref.tier);
      if (!s.locator?.trim()) err(14, `${at}: source ${ref.id} needs a locator`);
      if (s.excerpt && words(s.excerpt) > 50) err(14, `${at}: excerpt longer than 50 words`);
      if (release && ref.status === 'superseded' && !c.verification?.notes) err(19, `${at}: cites superseded ${ref.id} without a note`);
    }
    if (c.kind === 'technical' && !tiers.includes(1)) err(14, `${at}: technical claims need a Tier 1 source`);
    if (c.kind === 'context' && !tiers.some((t) => t <= (sourcePolicy.contextMinTier ?? 2))) err(14, `${at}: context claims need a Tier 1 or Tier 2 source`);

    if (c.method === 'derived') {
      const d = c.derivation;
      if (!d) { err(15, `${at}: derived claims need a derivation`); continue; }
      if (!formulas[d.formula]) { err(15, `${at}: unknown formula "${d.formula}"`); continue; }
      const values = { ...(d.constants ?? {}) };
      let ok = true;
      for (const [name, inputId] of Object.entries(d.inputs ?? {})) {
        usedClaims.add(inputId);
        const input = claimById.get(inputId);
        if (!input) { err(15, `${at}: unknown input claim "${inputId}"`); ok = false; continue; }
        if (input.method !== 'stated') err(15, `${at}: input "${inputId}" must be a stated claim`);
        if (typeof input.value !== 'number') { err(15, `${at}: input "${inputId}" has no numeric value`); ok = false; continue; }
        values[name] = input.value;
      }
      if (ok) {
        const computed = recompute(d.formula, values, d.rounding);
        if (computed !== c.value) err(15, `${at}: recomputes to ${computed}, but the claim says ${c.value}`);
      }
    }

    if (release) {
      const v = c.verification ?? {};
      if (!v.verifiedOn || !v.verifiedBy) err(19, `${at}: not verified (verifiedOn and verifiedBy required)`);
      else if (today - new Date(v.verifiedOn) > maxAgeMs) err(19, `${at}: verified ${v.verifiedOn}, more than ${sourcePolicy.maxVerificationAgeDays} days ago`);
    }
  }

  // Rules 10, 18: orphans.
  for (const r of references) if (!citedRefs.has(r.id)) releaseOrWarn(10, `reference ${r.id} is never cited`);
  for (const c of claims) if (!usedClaims.has(c.id)) releaseOrWarn(18, `claim ${c.id} is never used`);

  // Rule 7: vendor denylist over every string; rule 8: guarantee wording.
  for (const [at, text] of [
    ...strings(content.tabs, 'tabs'), ...strings(scenarios, 'scenarios'), ...strings(glossary, 'glossary'),
    ...strings(claims, 'claims'), ...strings(references.map(({ url, ...r }) => r), 'references'), ...strings(generations, 'generations')
  ]) {
    for (const name of denylist) if (new RegExp(`(?<![\\w])${escapeRe(name)}(?![\\w])`, 'i').test(text)) err(7, `${at}: contains denylisted name "${name}"`);
    for (const phrase of GUARANTEE_PHRASES) if (new RegExp(`\\b${escapeRe(phrase)}\\b`, 'i').test(text)) releaseOrWarn(8, `${at}: guarantee wording "${phrase}"`);
  }

  return { errors, warnings };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const release = process.argv.includes('--release');
  const { errors, warnings } = await validateContent({ release });
  for (const w of warnings) console.warn(`warning ${w}`);
  for (const e of errors) console.error(`error   ${e}`);
  console.log(`${release ? 'Release' : 'Draft'} validation: ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(errors.length ? 1 : 0);
}
