import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContent, loadContent, uncitedNumbers } from '../../scripts/validate-content.mjs';

const clone = (x) => structuredClone(x);
const base = loadContent();

/** A minimal, valid feature tab used as a fixture. */
function featureTab(overrides = {}) {
  const beat = (type) => ({
    type,
    heading: `Heading for ${type}`,
    body: 'Plain language body text.',
    bottomLine: 'A short leadership takeaway.',
    deepDive: type === 'how' || type === 'improvement' ? 'Protocol detail.' : null,
    sceneState: `state-${type}`,
    sceneDescription: 'An access point and several clinical devices are shown on a hospital floor while packets move between them over the air.',
    durationMs: 10000
  });
  return {
    id: 'fixture', order: 3, kind: 'feature', title: 'Fixture', summary: 'A fixture.', introducedIn: 'wifi7', wifi7Adds: null,
    compareGenerations: ['wifi6', 'wifi7'], defaultCompare: 'wifi6', sceneId: null, scenarioIds: [], sections: [],
    beats: ['problem', 'what', 'how', 'improvement', 'why'].map(beat), keyFigures: [], _file: 'tabs/fixture.json',
    ...overrides
  };
}

/** Content with tab 3 replaced by `tab`. */
function withTab(tab) {
  const c = clone(base);
  c.tabs = c.tabs.map((t) => (t.order === tab.order ? tab : t));
  return c;
}

async function errorsFor(content, opts = {}) {
  const { errors } = await validateContent({ content, denylist: ['Acmevendor'], ...opts });
  return errors.join('\n');
}

test('real content has no errors in draft mode', async () => {
  const { errors } = await validateContent();
  assert.deepEqual(errors, []);
});

test('fixture feature tab is valid', async () => {
  assert.equal(await errorsFor(withTab(featureTab())), '');
});

test('rule 1: duplicate ids and non-contiguous order', async () => {
  const c = clone(base);
  c.claims.push(clone(c.claims[0]));
  c.tabs[0].order = 42;
  const e = await errorsFor(c);
  assert.match(e, /\[rule 1\] claims: duplicate id/);
  assert.match(e, /\[rule 1\] tab order must be contiguous/);
});

test('rule 2: unresolved term, claim and reference markup', async () => {
  const t = featureTab();
  t.beats[0].body = 'See [[no-such-term]] and {{no-such-claim}} and {{ref:no-such-ref}}.';
  const e = await errorsFor(withTab(t));
  assert.match(e, /unknown glossary term/);
  assert.match(e, /unknown claim/);
  assert.match(e, /unknown reference/);
});

test('rule 3: feature beats out of order', async () => {
  const t = featureTab();
  t.beats.reverse();
  assert.match(await errorsFor(withTab(t)), /\[rule 3\]/);
});

test('rule 4: scene states must be declared by the scene module', async () => {
  const t = featureTab({ sceneId: 'mlo' });
  const e = await errorsFor(withTab(t), { sceneDir: new URL('./fixtures/scenes', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1') });
  assert.match(e, /\[rule 4\] .*not declared/);
});

test('rule 5: peak rates must be qualified', async () => {
  const t = featureTab({
    keyFigures: [{ id: 'peak', metric: 'Peak PHY rate', unit: 'Gbps', values: { wifi7: 46.1 }, qualifier: 'normative', regulatoryDomain: null, note: null, headline: true, claimIds: { wifi7: 'wifi7-peak-phy' } }]
  });
  assert.match(await errorsFor(withTab(t)), /\[rule 5\]/);
});

test('rule 6: inherited features need wifi7Adds', async () => {
  assert.match(await errorsFor(withTab(featureTab({ introducedIn: 'wifi6', wifi7Adds: '' }))), /\[rule 6\]/);
});

test('rule 7: denylisted names are rejected', async () => {
  const t = featureTab();
  t.beats[0].body = 'Our Acmevendor access point.';
  assert.match(await errorsFor(withTab(t)), /\[rule 7\]/);
});

test('rule 8: guarantee wording is a warning in draft and an error in release', async () => {
  const t = featureTab();
  t.beats[4].bottomLine = 'This guarantees patient safety.';
  const { warnings } = await validateContent({ content: withTab(t), denylist: [] });
  assert.ok(warnings.some((w) => w.includes('[rule 8]')));
  assert.match(await errorsFor(withTab(t), { release: true }), /\[rule 8\]/);
});

test('rule 9: a glossary term used on a tab must be marked up', async () => {
  const c = withTab(featureTab());
  c.glossary.push({ id: 'ofdma', term: 'OFDMA', expansion: null, definition: 'Splitting a channel among devices.' });
  c.tabs.find((t) => t.order === 3).beats[0].body = 'OFDMA splits the channel.';
  assert.match(await errorsFor(c), /\[rule 9\]/);
});

test('rule 11: audience layers are required on feature tabs', async () => {
  const t = featureTab();
  t.beats[0].bottomLine = '';
  t.beats[2].deepDive = null;
  t.beats[1].bottomLine = Array(41).fill('word').join(' ');
  const e = await errorsFor(withTab(t));
  assert.match(e, /bottomLine required/);
  assert.match(e, /deepDive required/);
  assert.match(e, /bottomLine longer than 40 words/);
});

test('rule 12: markup and script-like content are rejected', async () => {
  const t = featureTab();
  t.beats[0].body = 'Hello <script>alert(1)</script>';
  t.beats[1].body = 'javascript:alert(1)';
  const e = await errorsFor(withTab(t));
  assert.equal((e.match(/\[rule 12\]/g) ?? []).length, 2);
});

test('rule 13: vendor-domain and off-domain references are rejected', async () => {
  const c = clone(base);
  c.references.push({ id: 'vendor-blog', title: 'Blog', publisher: 'ieee', tier: 1, identifier: 'x', edition: null, date: '2024', status: 'current', access: 'open', url: 'https://example-vendor.com/wifi7' });
  c.references.push({ id: 'bad-tier', title: 'Paper', publisher: 'peer-reviewed', tier: 1, identifier: 'not-a-doi', edition: null, date: '2024', status: 'current', access: 'open', url: 'https://doi.org/10.1000/x' });
  c.references.push({ id: 'unknown-pub', title: 'Wiki', publisher: 'wikipedia', tier: 1, identifier: 'x', edition: null, date: '2024', status: 'current', access: 'open', url: 'https://en.wikipedia.org/wiki/Wi-Fi_7' });
  const e = await errorsFor(c);
  assert.match(e, /vendor-blog: host example-vendor\.com is not an allowlisted domain/);
  assert.match(e, /bad-tier: tier 1 does not match/);
  assert.match(e, /bad-tier: peer-reviewed sources need a DOI/);
  assert.match(e, /unknown-pub: publisher "wikipedia" is not in source-policy/);
});

test('rule 14: technical claims need Tier 1 sources and locators', async () => {
  const c = clone(base);
  c.references.push({ id: 'paper', title: 'Paper', publisher: 'peer-reviewed', tier: 2, identifier: '10.1109/x.1', edition: null, date: '2024', status: 'current', access: 'open', url: 'https://doi.org/10.1109/x.1' });
  c.claims.push({ id: 'tier2-only', statement: 'x', value: 1, unit: 'x', kind: 'technical', method: 'stated', sources: [{ referenceId: 'paper', locator: 'p. 3' }], derivation: null, verification: {} });
  c.claims.push({ id: 'no-locator', statement: 'x', value: 1, unit: 'x', kind: 'technical', method: 'stated', sources: [{ referenceId: 'ieee-80211be', locator: '' }], derivation: null, verification: {} });
  const e = await errorsFor(c);
  assert.match(e, /tier2-only: technical claims need a Tier 1 source/);
  assert.match(e, /no-locator: source ieee-80211be needs a locator/);
});

test('rule 15: derived claims must recompute from their inputs', async () => {
  const c = clone(base);
  c.claims.find((x) => x.id === 'eht-max-nss').value = 8;
  assert.match(await errorsFor(c), /wifi7-peak-phy: recomputes to 23.1, but the claim says 46.1/);
});

test('rule 16: key figures must match their claims', async () => {
  const t = featureTab({
    keyFigures: [
      { id: 'peak', metric: 'Peak PHY rate', unit: 'Gbps', values: { wifi7: 40 }, qualifier: 'theoretical', regulatoryDomain: null, note: null, headline: true, claimIds: { wifi7: 'wifi7-peak-phy' } },
      { id: 'width', metric: 'Widest channel', unit: 'MHz', values: { wifi7: 320 }, qualifier: 'normative', regulatoryDomain: null, note: null, headline: true, claimIds: {} }
    ]
  });
  const e = await errorsFor(withTab(t));
  assert.match(e, /shows 40 but claim "wifi7-peak-phy" says 46.1/);
  assert.match(e, /value for wifi7 has no claimIds entry/);
});

test('rule 17: numbers with units need a claim citation in the same sentence', async () => {
  assert.deepEqual(uncitedNumbers('Wi-Fi 7 reaches 46 Gbps. Wi-Fi 7 uses 802.11be in 2024.'), ['46 Gbps']);
  assert.deepEqual(uncitedNumbers('Wi-Fi 7 reaches 46.1 Gbps {{wifi7-peak-phy}}.'), []);
  const t = featureTab();
  t.beats[0].body = 'Channels up to 320 MHz wide.';
  assert.match(await errorsFor(withTab(t)), /\[rule 17\] .*"320 MHz"/);
});

test('rules 10 and 18: orphans are warnings in draft and errors in release', async () => {
  const { warnings } = await validateContent({ denylist: [] });
  assert.ok(warnings.some((w) => w.includes('[rule 18]')));
  const e = await errorsFor(clone(base), { release: true });
  assert.match(e, /\[rule 18\]/);
  assert.match(e, /\[rule 3\] .*still marked draft/);
});

test('rule 19: release requires recent verification', async () => {
  const c = clone(base);
  c.claims[0].verification = { verifiedOn: '2025-01-01', verifiedBy: 'TB', notes: null };
  const e = await errorsFor(c, { release: true, today: new Date('2026-10-26') });
  assert.match(e, new RegExp(`claim ${c.claims[0].id}: verified 2025-01-01, more than 365 days ago`));
  assert.match(e, new RegExp(`claim ${c.claims[1].id}: not verified`));
});

test('field limits: heading, sceneDescription, durationMs', async () => {
  const t = featureTab();
  t.beats[0].heading = 'x'.repeat(61);
  t.beats[1].sceneDescription = 'Too short.';
  t.beats[2].durationMs = 500;
  const e = await errorsFor(withTab(t));
  assert.match(e, /heading longer than 60/);
  assert.match(e, /sceneDescription needs ≥ 20 words/);
  assert.match(e, /durationMs must be 6000–20000/);
});
