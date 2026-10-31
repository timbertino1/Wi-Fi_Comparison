// US5: the talk track holds every piece of on-page text (FR-023, SC-004) and stays in sync (FR-025).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from '../../scripts/validate-content.mjs';
import { buildTalkTrack, OUTPUT } from '../../scripts/talk-track.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const content = loadContent();
const termName = new Map(content.glossary.map((g) => [g.id, g.term]));

/** Plain text of content markup as the page shows it: term display text; citations and bold removed. */
const plainContent = (s) => s
  .replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, (_, id, label) => label ?? termName.get(id) ?? id)
  .replace(/\{\{(?:ref:)?[a-z0-9-]+\}\}/g, '')
  .replace(/\*\*/g, '')
  .replace(/\s+/g, ' ')
  .replace(/ (?=[.,;:!?)])/g, '') // a removed citation can leave a space before punctuation
  .trim();

/** The generated document normalised the same way: source markers, emphasis and escapes removed. */
const plainDoc = (s) => s
  .replace(/\[S\d+(?:, S\d+)*\]/g, '')
  .replace(/\*\*/g, '')
  .replace(/\\\|/g, '|')
  .replace(/\s+/g, ' ')
  .replace(/ (?=[.,;:!?)])/g, '');

/** Every text field the explainer shows on the page, with a JSON path for failure messages. */
function* pageText({ tabs, scenarios, glossary, references, claims, generations }) {
  for (const t of tabs) {
    const at = `tabs/${t.id}`;
    for (const f of ['title', 'summary', 'wifi7Adds']) if (t[f]) yield [`${at}.${f}`, t[f]];
    for (const f of ['promise', 'problem']) if (t.opener?.[f]) yield [`${at}.opener.${f}`, t.opener[f]];
    for (const [i, b] of t.beats.entries()) {
      for (const f of ['heading', 'body', 'bottomLine', 'deepDive', 'sceneDescription']) if (b[f]) yield [`${at}.beats[${i}].${f}`, b[f]];
      for (const f of ['headline', 'takeaway', 'technical']) if (b.caption?.[f]) yield [`${at}.beats[${i}].caption.${f}`, b.caption[f]];
      if (b.callout) {
        yield [`${at}.beats[${i}].callout.title`, b.callout.title];
        for (const [j, p] of b.callout.points.entries()) yield [`${at}.beats[${i}].callout.points[${j}]`, p];
      }
      for (const [j, h] of (b.hotspots ?? []).entries()) if (h.technical) yield [`${at}.beats[${i}].hotspots[${j}].technical`, h.technical];
      for (const [j, q] of (b.questions ?? []).entries()) for (const f of ['q', 'a']) yield [`${at}.beats[${i}].questions[${j}].${f}`, q[f]];
    }
    for (const [i, s] of (t.sections ?? []).entries()) for (const f of ['heading', 'body']) yield [`${at}.sections[${i}].${f}`, s[f]];
    for (const [i, k] of (t.keyFigures ?? []).entries()) {
      yield [`${at}.keyFigures[${i}].metric`, k.metric];
      if (k.note) yield [`${at}.keyFigures[${i}].note`, k.note];
      for (const [g, v] of Object.entries(k.values ?? {})) if (typeof v === 'string') yield [`${at}.keyFigures[${i}].values.${g}`, v];
    }
  }
  for (const s of scenarios) {
    for (const f of ['location', 'problem', 'outcomeSupported']) yield [`scenarios/${s.id}.${f}`, s[f]];
    for (const [i, d] of s.deviceTypes.entries()) yield [`scenarios/${s.id}.deviceTypes[${i}]`, d];
  }
  for (const g of glossary) for (const f of ['term', 'expansion', 'definition', 'short']) if (g[f]) yield [`glossary/${g.id}.${f}`, g[f]];
  for (const r of references.filter((x) => !x.retired)) yield [`references/${r.id}.title`, r.title]; // retired ones are not on the page
  for (const c of claims) {
    yield [`claims/${c.id}.statement`, c.statement];
    for (const [i, s] of c.sources.entries()) {
      yield [`claims/${c.id}.sources[${i}].locator`, s.locator];
      if (s.excerpt) yield [`claims/${c.id}.sources[${i}].excerpt`, s.excerpt];
    }
    if (c.derivation?.explanation) yield [`claims/${c.id}.derivation.explanation`, c.derivation.explanation];
  }
  for (const g of generations) for (const f of ['name', 'ieee']) yield [`generations/${g.id}.${f}`, g[f]];
}

test('every on-page text field appears in the talk track', () => {
  const doc = plainDoc(buildTalkTrack(content));
  const missing = [];
  for (const [at, text] of pageText(content)) {
    if (!doc.includes(plainContent(text))) missing.push(at);
  }
  assert.deepEqual(missing, [], `missing from the talk track:\n${missing.join('\n')}`);
});

test('every step has the five talk-track sections', () => {
  const doc = buildTalkTrack(content);
  const steps = content.tabs.filter((t) => t.kind !== 'references').reduce((n, t) => n + t.beats.length, 0);
  for (const label of ['**On screen:**', '**Say (leadership):**', '**Technical depth:**', '**Figures:**', '**Likely questions:**']) {
    assert.equal(doc.split(label).length - 1, steps, `${label} should appear once per step (${steps})`);
  }
});

test('the talk track is plain Markdown with no HTML', () => {
  assert.doesNotMatch(buildTalkTrack(content), /<\/?[a-z][^>]*>/i);
});

test('the committed talk track is up to date (run npm run build)', () => {
  const committed = fs.readFileSync(path.join(root, OUTPUT), 'utf8');
  assert.equal(committed, buildTalkTrack(content), `${OUTPUT} is stale: run node scripts/talk-track.mjs`);
});

test('the talk track is not shipped in dist/', { skip: !fs.existsSync(path.join(root, 'dist')) }, () => {
  const shipped = fs.readdirSync(path.join(root, 'dist'), { recursive: true }).map(String);
  assert.equal(shipped.filter((f) => /talk-track/i.test(f)).length, 0);
});
