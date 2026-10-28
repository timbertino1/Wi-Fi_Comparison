// Feature 002 content rules 20–25: captions, hotspots, likely questions, on-screen jargon, callouts, openers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContent, loadContent } from '../../scripts/validate-content.mjs';

const base = loadContent();
const glossaryTerm = base.glossary[0];

/** A feature tab whose steps all carry valid captions; `edit(beats)` changes them. */
function tabWith(edit = () => {}) {
  const beat = (type) => ({
    type,
    heading: `Heading for ${type}`,
    body: 'Plain language body text.',
    bottomLine: 'A short leadership takeaway.',
    deepDive: type === 'how' || type === 'improvement' ? 'Protocol detail.' : null,
    sceneState: `state-${type}`,
    sceneDescription: 'An access point and several clinical devices are shown on a hospital floor while packets move between them over the air.',
    durationMs: 10000,
    caption: { headline: 'A short headline', takeaway: 'One plain line that says why this step matters.' }
  });
  const beats = ['problem', 'what', 'how', 'improvement', 'why'].map(beat);
  edit(beats);
  return {
    id: 'fixture', order: 3, kind: 'feature', title: 'Fixture', summary: 'A fixture.', introducedIn: 'wifi7', wifi7Adds: null,
    opener: { promise: 'A short promise', problem: 'The problem this chapter solves, in a sentence.' },
    compareGenerations: ['wifi6', 'wifi7'], defaultCompare: 'wifi6', sceneId: null, scenarioIds: [], sections: [],
    beats, keyFigures: [], _file: 'tabs/fixture.json'
  };
}

/** Errors for content where tab 3 is `tab`, keeping only feature-002 rules and this fixture. */
async function errorsFor(tab, glossary = base.glossary) {
  const content = structuredClone(base);
  content.glossary = glossary;
  content.tabs = content.tabs.map((t) => (t.order === tab.order ? tab : t));
  const { errors } = await validateContent({ content, denylist: [] });
  return errors.filter((e) => /\[rule 2[0-5]\]/.test(e) && e.includes('fixture')).join('\n');
}

test('valid captions, hotspots and questions pass', async () => {
  const tab = tabWith((beats) => {
    beats[0].hotspots = [{ id: 'what-it-is', anchor: 'ap', term: glossaryTerm.id }];
    beats[0].questions = [{ q: 'Does this need new devices?', a: 'Both ends must support the feature.', audience: 'both' }];
    beats[0].captionAtMs = 1200;
  });
  assert.equal(await errorsFor(tab), '');
});

test('missing caption and missing fields are errors', async () => {
  const tab = tabWith((beats) => {
    delete beats[0].caption;
    beats[1].caption = { headline: 'Only a headline' };
  });
  const errors = await errorsFor(tab);
  assert.match(errors, /fixture\/1: caption required/);
  assert.match(errors, /fixture\/2: caption\.takeaway required/);
});

test('caption word limits are enforced with counts in the message', async () => {
  const tab = tabWith((beats) => {
    beats[0].caption.headline = 'one two three four five six seven eight nine';
    beats[1].caption.takeaway = Array.from({ length: 17 }, (_, i) => `w${i}`).join(' ');
    beats[2].caption.technical = Array.from({ length: 21 }, (_, i) => `t${i}`).join(' ');
  });
  const errors = await errorsFor(tab);
  assert.match(errors, /fixture\/1: caption\.headline has 9 words \(max 8\)/);
  assert.match(errors, /fixture\/2: caption\.takeaway has 17 words \(max 16\)/);
  assert.match(errors, /fixture\/3: caption\.technical has 21 words \(max 20\)/);
});

test('markup does not count towards caption words', async () => {
  const tab = tabWith((beats) => {
    beats[0].caption.headline = `[[${glossaryTerm.id}|Seven]] words in this short headline here`;
  });
  assert.equal(await errorsFor(tab), '');
});

test('headline citations and out-of-range captionAtMs are errors', async () => {
  const tab = tabWith((beats) => {
    beats[0].caption.headline = `Cited ${'{{' + base.claims[0].id + '}}'}`;
    beats[1].captionAtMs = 20001;
  });
  const errors = await errorsFor(tab);
  assert.match(errors, /fixture\/1: caption\.headline must not contain citations/);
  assert.match(errors, /fixture\/2: captionAtMs must be an integer from 0 to durationMs/);
});

test('callout rules: title, point count, point length, citations and atMs (rule 24)', async () => {
  const tab = tabWith((beats) => {
    beats[0].callout = { title: 'A title that runs on for far too many words', points: ['Only one point'] };
    beats[1].callout = { title: `Cited ${'{{' + base.claims[0].id + '}}'}`, points: ['One', 'Two', 'Three', 'Four', 'Five'], atMs: 20001 };
    beats[2].callout = { title: 'Fine', points: ['ok', 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen'] };
    beats[3].callout = { title: 'Fine too', points: ['A short point', 'Another short point'] };
  });
  const errors = await errorsFor(tab);
  assert.match(errors, /fixture\/1: callout\.title has 10 words \(max 6\)/);
  assert.match(errors, /fixture\/1: callout needs 2–4 points/);
  assert.match(errors, /fixture\/2: callout\.title must not contain citations/);
  assert.match(errors, /fixture\/2: callout needs 2–4 points/);
  assert.match(errors, /fixture\/2: callout\.atMs must be an integer from 0 to durationMs/);
  assert.match(errors, /fixture\/3: callout point 2 has 15 words \(max 14\)/);
  assert.doesNotMatch(errors, /fixture\/4: callout/);
});

test('chapter opener rules: required, word limits, no term links, badge (rule 25)', async () => {
  const missing = tabWith();
  delete missing.opener;
  assert.match(await errorsFor(missing), /fixture: opener required/);

  const bad = tabWith();
  bad.opener = { promise: 'one two three four five six seven eight nine ten eleven', problem: `Uses [[${glossaryTerm.id}]] here.`, badge: 'yes' };
  const errors = await errorsFor(bad);
  assert.match(errors, /fixture: opener\.promise has 11 words \(max 10\)/);
  assert.match(errors, /fixture: opener\.problem must not contain term links/);
  assert.match(errors, /fixture: opener\.badge may only be false/);

  const noBadge = tabWith();
  noBadge.opener.badge = false;
  assert.equal(await errorsFor(noBadge), '');
});

test('hotspot rules: ids, anchor, term, depth and per-depth limit', async () => {
  const tab = tabWith((beats) => {
    beats[0].hotspots = [
      { id: 'Bad Id', anchor: 'ap', term: glossaryTerm.id },
      { id: 'dup', anchor: 'ap', term: glossaryTerm.id },
      { id: 'dup', anchor: '', term: 'no-such-term' },
      { id: 'deep', anchor: 'ap', term: glossaryTerm.id, depth: 'expert' }
    ];
    beats[1].hotspots = Array.from({ length: 5 }, (_, i) => ({ id: `h${i}`, anchor: 'ap', term: glossaryTerm.id }));
  });
  const errors = await errorsFor(tab);
  assert.match(errors, /hotspot Bad Id: id must be kebab-case/);
  assert.match(errors, /hotspot dup: duplicate id/);
  assert.match(errors, /hotspot dup: anchor required/);
  assert.match(errors, /hotspot deep: depth must be "all" or "technical"/);
  assert.match(errors, /fixture\/2: 5 hotspots at depth "all" \(max 4\)/);
});

test('hotspot terms with long definitions need a short definition', async () => {
  const long = { ...glossaryTerm, definition: Array.from({ length: 35 }, (_, i) => `d${i}`).join(' ') };
  delete long.short;
  const glossary = base.glossary.map((t) => (t.id === long.id ? long : t));
  const tab = tabWith((beats) => {
    beats[0].hotspots = [{ id: 'long', anchor: 'ap', term: long.id }];
  });
  assert.match(await errorsFor(tab, glossary), /needs a short definition \(≤ 30 words\)/);
  long.short = 'A brief definition.';
  assert.equal(await errorsFor(tab, glossary), '');
});

test('likely-question limits and audience values', async () => {
  const tab = tabWith((beats) => {
    beats[0].questions = [
      { q: Array.from({ length: 26 }, (_, i) => `q${i}`).join(' '), a: 'Fine.' },
      { q: 'Fine?', a: Array.from({ length: 81 }, (_, i) => `a${i}`).join(' ') },
      { q: 'Fine?', a: 'Fine.', audience: 'everyone' }
    ];
  });
  const errors = await errorsFor(tab);
  assert.match(errors, /question 1: q has more than 25 words/);
  assert.match(errors, /question 2: a has more than 80 words/);
  assert.match(errors, /question 3: audience must be leadership, technical or both/);
});

test('jargon in captions must be defined on screen at or before first use', async () => {
  const used = tabWith((beats) => {
    beats[1].caption.headline = `About ${glossaryTerm.term} today`;
  });
  assert.match(await errorsFor(used), new RegExp(`fixture/2: caption uses "${glossaryTerm.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" before it is defined on screen`));

  const linkedEarlier = tabWith((beats) => {
    beats[0].caption.headline = `Meet [[${glossaryTerm.id}]]`;
    beats[1].caption.headline = `About ${glossaryTerm.term} today`;
  });
  assert.equal(await errorsFor(linkedEarlier), '');

  const hotspotSameStep = tabWith((beats) => {
    beats[1].caption.headline = `About ${glossaryTerm.term} today`;
    beats[1].hotspots = [{ id: 'term', anchor: 'ap', term: glossaryTerm.id }];
  });
  assert.equal(await errorsFor(hotspotSameStep), '');
});
