import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkup, plainText, escapeHtml } from '../../src/app/markup.js';

const ctx = {
  termById: new Map([['mlo', { id: 'mlo', term: 'MLO' }]]),
  claimById: new Map([['wifi7-peak-phy', { id: 'wifi7-peak-phy', statement: 'Peak "rate" <x>' }]]),
  refById: new Map([['ieee-80211be', { id: 'ieee-80211be', title: 'IEEE 802.11be' }]]),
  citationNumber: () => 1
};

test('escapes HTML so script stays inert', () => {
  const html = renderMarkup('<script>alert(1)</script> & "quotes"', ctx);
  assert.equal(html, '<p>&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quotes&quot;</p>');
  assert.ok(!html.includes('<script'));
});

test('event-handler injection through labels is escaped', () => {
  const html = renderMarkup('[[mlo|<img src=x onerror=alert(1)>]]', ctx);
  assert.ok(!html.includes('<img'));
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('glossary terms render as buttons', () => {
  assert.equal(renderMarkup('Uses [[mlo]].', ctx), '<p>Uses <button type="button" class="term" data-term="mlo" aria-haspopup="dialog">MLO</button>.</p>');
  assert.match(renderMarkup('[[mlo|multi-link]]', ctx), />multi-link<\/button>/);
});

test('claim citations render as numbered buttons with escaped labels', () => {
  const html = renderMarkup('46.1 Gbps {{wifi7-peak-phy}}', ctx);
  assert.match(html, /<sup><button type="button" class="cite" data-claim="wifi7-peak-phy" aria-haspopup="dialog" aria-label="Source for: Peak &quot;rate&quot; &lt;x&gt;">\[1\]<\/button><\/sup>/);
});

test('reference links point at the References tab', () => {
  assert.match(renderMarkup('Read {{ref:ieee-80211be}}', ctx), /href="#\/references\?ref=ieee-80211be"/);
});

test('bold and paragraphs', () => {
  assert.equal(renderMarkup('**One**\n\nTwo', ctx), '<p><strong>One</strong></p><p>Two</p>');
});

test('unknown ids render no markup', () => {
  assert.equal(renderMarkup('[[nope]] {{nope}} {{ref:nope}}', ctx), '<p>nope</p>');
});

test('plainText strips markup', () => {
  assert.equal(plainText('Uses [[mlo]] at **46.1 Gbps** {{wifi7-peak-phy}}.', ctx), 'Uses MLO at 46.1 Gbps .');
  assert.equal(escapeHtml(`<'>`), '&lt;&#39;&gt;');
});
