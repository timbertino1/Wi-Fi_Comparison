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
    sceneState: `state-${type}`,
    sceneDescription: 'An access point and several clinical devices are shown on a hospital floor while packets move between them over the air.',
    durationMs: 10000,
    caption: { headline: `Caption for ${type}`, takeaway: 'A short slide takeaway.' }
  });
  return {
    id: 'fixture', order: 3, kind: 'feature', title: 'Fixture', summary: 'A fixture.', introducedIn: 'wifi7', wifi7Adds: null,
    opener: { promise: 'A short promise', problem: 'The problem this chapter solves, in a sentence.' },
    compareGenerations: ['wifi6', 'wifi7'], defaultCompare: 'wifi6', sceneId: null, scenarioIds: [], sections: [],
    sinceWifi6: { wifi6: 'Introduced{{twt-wifi6}}.', wifi7: 'Adds a mode{{rtwt-be}}.' },
    // Three steps that cover the five-part arc (feature 003: 2–4 steps per feature chapter).
    beats: [{ ...beat('problem'), covers: ['what'] }, beat('how'), { ...beat('improvement'), covers: ['why'] }], keyFigures: [], _file: 'tabs/fixture.json',
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

test('rule 3: feature chapters have 2–4 steps that cover the arc in order', async () => {
  const t = featureTab();
  const [problem, how, improvement] = t.beats;
  t.beats = [{ ...problem, covers: ['what', 'how'] }, { ...improvement, covers: ['why'] }];
  assert.doesNotMatch(await errorsFor(withTab(t)), /\[rule 3\]/);
  t.beats = [{ ...problem, covers: ['how'] }, { ...how, type: 'what' }, { ...improvement, covers: ['why'] }];
  assert.match(await errorsFor(withTab(t)), /\[rule 3\]/);
  t.beats = [{ ...problem, covers: ['what', 'how', 'improvement', 'why'] }];
  assert.match(await errorsFor(withTab(t)), /need 2–4 steps; found 1/);
  t.beats = ['problem', 'what', 'how', 'improvement', 'why'].map((type) => ({ ...problem, type, covers: undefined }));
  assert.match(await errorsFor(withTab(t)), /need 2–4 steps; found 5/);
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

test('rule 6: inherited features need sinceWifi6.wifi7 (or wifi7Adds)', async () => {
  assert.match(await errorsFor(withTab(featureTab({ introducedIn: 'wifi6', wifi7Adds: '', sinceWifi6: { wifi6: 'Introduced{{twt-wifi6}}.' } }))), /\[rule 6\]/);
  assert.doesNotMatch(await errorsFor(withTab(featureTab({ introducedIn: 'wifi6', wifi7Adds: '', sinceWifi6: { wifi6: 'Introduced.', wifi7: 'Adds a mode.' } }))), /\[rule 6\]/);
});

test('rule 7: denylisted names are rejected', async () => {
  const t = featureTab();
  t.beats[0].body = 'Our Acmevendor access point.';
  assert.match(await errorsFor(withTab(t)), /\[rule 7\]/);
});

test('rule 8: guarantee wording is a warning in draft and an error in release', async () => {
  const t = featureTab();
  t.beats[2].bottomLine = 'This guarantees patient safety.';
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

test('rule 11: plain bottom line required; no technical layer allowed', async () => {
  const t = featureTab();
  t.beats[0].bottomLine = '';
  t.beats[1].bottomLine = Array(41).fill('word').join(' ');
  t.beats[1].deepDive = 'Protocol detail.';
  t.beats[2].caption.technical = 'MLD affiliated STAs.';
  t.beats[2].hotspots = [{ id: 'ap', anchor: 'ap', term: 'access-point', technical: 'Detail.' }];
  t.sections = [{ id: 'modes', heading: 'Modes', body: 'Detail.' }];
  const e = await errorsFor(withTab(t));
  assert.match(e, /bottomLine required/);
  assert.match(e, /bottomLine longer than 40 words/);
  assert.match(e, /deepDive is not allowed/);
  assert.match(e, /caption\.technical is not allowed/);
  assert.match(e, /hotspot ap: technical is not allowed/);
  assert.match(e, /feature chapters have no sections/);
});

test('rule 2: comparisons start at Wi-Fi 6, and at most 3 key figures', async () => {
  const kf = (id) => ({ id, metric: id, unit: 'MHz', values: { wifi7: 320 }, qualifier: 'normative', regulatoryDomain: null, note: null, headline: false, claimIds: { wifi7: 'eht-max-width' } });
  const e = await errorsFor(withTab(featureTab({ compareGenerations: ['wifi5', 'wifi6', 'wifi7'], keyFigures: ['a', 'b', 'c', 'd'].map(kf) })));
  assert.match(e, /compareGenerations may only use wifi6, wifi6e and wifi7; found wifi5/);
  assert.match(e, /4 key figures \(max 3\)/);
});

test('rule 26: feature chapters say what changed since Wi-Fi 6, with citations', async () => {
  let e = await errorsFor(withTab(featureTab({ sinceWifi6: undefined })));
  assert.match(e, /[rule 26] .*needs wifi7 and at least one of wifi6 or wifi6e/);
  e = await errorsFor(withTab(featureTab({ sinceWifi6: { wifi5: 'Old{{twt-wifi6}}.', wifi6: 'No citation.', wifi7: 'Adds a mode{{rtwt-be}}.' } })));
  assert.match(e, /sinceWifi6.wifi5 is not a generation since Wi-Fi 6/);
  assert.match(e, /sinceWifi6.wifi6 needs a {{claim}} citation/);
});

test('rule 27: Cisco notes cite only platform claims', async () => {
  const c = clone(base);
  c.references.push({ id: 'cisco-ok', title: 'Guide', publisher: 'cisco', tier: 'cisco', identifier: 'x', edition: 'rev 10.0', checkedOn: '2026-11-02', date: '2026', status: 'current', access: 'open', url: 'https://www.cisco.com/c/en/us/support/docs/x.html' });
  c.claims.push({ id: 'platform-ok', statement: 'x', value: null, unit: null, kind: 'platform', method: 'stated', sources: [{ referenceId: 'cisco-ok', locator: 'Section 1' }], derivation: null, verification: {} });
  const t = featureTab();
  t.beats[0].cisco = { feature: 'AFC', text: 'Supported{{platform-ok}}.' };
  t.beats[1].cisco = { feature: 'Peak', text: 'Fast{{eht-max-width}}.' };
  t.beats[2].cisco = { feature: '', text: 'No citation.' };
  c.tabs = c.tabs.map((x) => (x.order === t.order ? t : x));
  const e = await errorsFor(c);
  assert.doesNotMatch(e, /fixture\/1: cisco/);
  assert.match(e, /fixture\/2: cisco\.text cites "eht-max-width", which is not a platform claim/);
  assert.match(e, /fixture\/3: cisco needs feature and text/);
  assert.match(e, /fixture\/3: cisco\.text needs a \{\{claim\}\} citation/);
});

test('rule 7a: hardware model names and release numbers are rejected in visible text', async () => {
  const t = featureTab();
  t.beats[0].body = 'Install a CW9176I on each unit.';
  t.beats[1].caption.takeaway = 'Needs IOS XE 17.18 or later.';
  const e = await errorsFor(withTab(t));
  assert.match(e, /\[rule 7a\] .*CW9176I/);
  assert.match(e, /\[rule 7a\] .*IOS XE 17\.18/);
  const c = clone(base);
  c.references.push({ id: 'cisco-guide', title: 'Catalyst 9800 Configuration Guide', publisher: 'cisco', tier: 'cisco', identifier: 'x', edition: 'IOS XE 17.18.x', checkedOn: '2026-11-02', date: '2026', status: 'current', access: 'open', url: 'https://www.cisco.com/c/en/us/td/docs/x.html' });
  assert.doesNotMatch(await errorsFor(c), /\[rule 7a\]/);
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

test('rule 13: Cisco references must be public, with an edition and a checked date', async () => {
  const c = clone(base);
  c.references.push({ id: 'cisco-ok', title: 'Guide', publisher: 'cisco', tier: 'cisco', identifier: 'x', edition: 'rev 10.0', checkedOn: '2026-11-02', date: '2026', status: 'current', access: 'open', url: 'https://www.cisco.com/c/en/us/support/docs/x.html' });
  c.references.push({ id: 'cisco-gated', title: 'Guide', publisher: 'cisco', tier: 'cisco', identifier: 'x', edition: null, date: '2026', status: 'current', access: 'paywalled', url: 'https://www.cisco.com/c/en/us/x.html' });
  c.references.push({ id: 'cisco-off-domain', title: 'Post', publisher: 'cisco', tier: 'cisco', identifier: 'x', edition: 'x', checkedOn: '2026-11-02', date: '2026', status: 'current', access: 'open', url: 'https://learningnetwork.cisco.com/s/article/x' });
  const e = await errorsFor(c);
  assert.doesNotMatch(e, /cisco-ok/);
  assert.match(e, /cisco-gated: Cisco references must be public/);
  assert.match(e, /cisco-gated: Cisco references need an edition/);
  assert.match(e, /cisco-gated: Cisco references need checkedOn/);
  assert.match(e, /cisco-off-domain: host learningnetwork\.cisco\.com is not an allowlisted domain/);
});

test('rule 14: Cisco sources platform claims, never alone a technical claim', async () => {
  const c = clone(base);
  c.references.push({ id: 'cisco-ok', title: 'Guide', publisher: 'cisco', tier: 'cisco', identifier: 'x', edition: 'rev 10.0', checkedOn: '2026-11-02', date: '2026', status: 'current', access: 'open', url: 'https://www.cisco.com/c/en/us/support/docs/x.html' });
  c.claims.push({ id: 'cisco-only-technical', statement: 'x', value: null, unit: null, kind: 'technical', method: 'stated', sources: [{ referenceId: 'cisco-ok', locator: 'Section 1' }], derivation: null, verification: {} });
  c.claims.push({ id: 'platform-no-cisco', statement: 'x', value: null, unit: null, kind: 'platform', method: 'stated', sources: [{ referenceId: 'ieee-80211be', locator: '35.3' }], derivation: null, verification: {} });
  c.claims.push({ id: 'platform-ok', statement: 'x', value: null, unit: null, kind: 'platform', method: 'stated', sources: [{ referenceId: 'cisco-ok', locator: 'Section 1' }], derivation: null, verification: {} });
  c.claims.push({ id: 'technical-with-cisco-second', statement: 'x', value: null, unit: null, kind: 'technical', method: 'stated', sources: [{ referenceId: 'ieee-80211be', locator: '35.3' }, { referenceId: 'cisco-ok', locator: 'Section 1' }], derivation: null, verification: {} });
  const e = await errorsFor(c);
  assert.match(e, /cisco-only-technical: technical claims need a Tier 1 source/);
  assert.match(e, /platform-no-cisco: platform claims need a Cisco public documentation source/);
  assert.doesNotMatch(e, /platform-ok:|technical-with-cisco-second:/);
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
  c.claims.find((x) => x.id === 'eht-max-nss').value = 16;
  assert.match(await errorsFor(c), /wifi7-peak-phy: recomputes to 46.1, but the claim says 23.1/);
});

test('rule 16: key figures must match their claims', async () => {
  const t = featureTab({
    keyFigures: [
      { id: 'peak', metric: 'Peak PHY rate', unit: 'Gbps', values: { wifi7: 40 }, qualifier: 'theoretical', regulatoryDomain: null, note: null, headline: true, claimIds: { wifi7: 'wifi7-peak-phy' } },
      { id: 'width', metric: 'Widest channel', unit: 'MHz', values: { wifi7: 320 }, qualifier: 'normative', regulatoryDomain: null, note: null, headline: true, claimIds: {} }
    ]
  });
  const e = await errorsFor(withTab(t));
  assert.match(e, /shows 40 but claim "wifi7-peak-phy" says 23.1/);
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
  const c = clone(base);
  c.claims.push({ id: 'unused-claim', statement: 'x', value: null, unit: null, kind: 'technical', method: 'stated', sources: [{ referenceId: 'ieee-80211be', locator: 'Clause 1' }], derivation: null, verification: {} });
  c.tabs.at(-1).draft = true;
  const { warnings } = await validateContent({ content: c, denylist: [] });
  assert.ok(warnings.some((w) => w.includes('[rule 18] claim unused-claim')));
  const e = await errorsFor(c, { release: true });
  assert.match(e, /\[rule 18\] claim unused-claim/);
  assert.match(e, /\[rule 3\] .*still marked draft/);
});

test('rule 10: retired references are skipped, but must not be cited', async () => {
  const c = clone(base);
  const retired = c.references.find((r) => r.retired);
  assert.ok(retired, 'expected a retired reference in content');
  assert.doesNotMatch(await errorsFor(c, { release: true }), new RegExp(`reference ${retired.id} is never cited`));
  c.claims.find((x) => x.id === 'mlo-bands').sources.push({ referenceId: retired.id, locator: 'Clause 1' });
  assert.match(await errorsFor(c), new RegExp(`reference ${retired.id} is retired but still cited`));
});

test('rule 19: release requires recent verification', async () => {
  const c = clone(base);
  c.claims[0].verification = { verifiedOn: '2025-01-01', verifiedBy: 'TB', notes: null };
  c.claims[1].verification = { verifiedOn: null, verifiedBy: null, notes: null };
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

test('rule 8: guarantee wording in a scenario fails release validation', async () => {
  const c = clone(base);
  c.scenarios.push({ id: 'overclaim', location: 'Ward', deviceTypes: ['voice badge'], problem: 'Calls drop.', outcomeSupported: 'This guarantees calls never drop.' });
  assert.match(await errorsFor(c, { release: true }), /\[rule 8\] scenarios.*guarantee/);
});
