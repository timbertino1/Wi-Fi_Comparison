import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkup, plainText, escapeHtml } from '../../src/app/markup.js';

const ctx = {
  termById: new Map([['mlo', { id: 'mlo', term: 'MLO' }]])
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
  assert.equal(renderMarkup('Uses [[mlo]] here', ctx), '<p>Uses <button type="button" class="term" data-term="mlo" aria-haspopup="dialog">MLO</button> here</p>');
  assert.match(renderMarkup('[[mlo|multi-link]]', ctx), />multi-link<\/button>/);
});

test('a term keeps the punctuation after it on the same line', () => {
  assert.equal(renderMarkup('Uses [[mlo]].', ctx), '<p>Uses <span class="nowrap"><button type="button" class="term" data-term="mlo" aria-haspopup="dialog">MLO</button>.</span></p>');
});

test('citations are not shown on the slides, with the space before them removed (FR-015)', () => {
  assert.equal(renderMarkup('Up to 23.1 Gbps {{wifi7-peak-phy}}; see {{ref:ieee-80211be}} {{a}} {{b}}.', ctx), '<p>Up to 23.1 Gbps; see.</p>');
  assert.equal(renderMarkup('width{{w}}, packs', ctx), '<p>width, packs</p>');
});

test('bold and paragraphs', () => {
  assert.equal(renderMarkup('**One**\n\nTwo', ctx), '<p><strong>One</strong></p><p>Two</p>');
});

test('unknown ids render no markup', () => {
  assert.equal(renderMarkup('[[nope]] {{nope}} {{ref:nope}}', ctx), '<p>nope</p>');
});

test('plainText strips markup', () => {
  assert.equal(plainText('Uses [[mlo]] at **46.1 Gbps** {{wifi7-peak-phy}}.', ctx), 'Uses MLO at 46.1 Gbps.');
  assert.equal(escapeHtml(`<'>`), '&lt;&#39;&gt;');
});
