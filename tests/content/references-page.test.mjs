import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { loadContent, CLAIM_RE } from '../../scripts/validate-content.mjs';
import { buildReferencesPage } from '../../scripts/references-page.mjs';

const content = loadContent();
const html = buildReferencesPage(content);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const chapters = content.tabs.filter((t) => t.kind !== 'references' && t.beats.length);

test('sources page: every step has its own section listing each claim it cites (FR-022)', () => {
  const claimById = new Map(content.claims.map((c) => [c.id, c]));
  for (const tab of chapters) {
    tab.beats.forEach((b, i) => {
      const start = html.indexOf(`id="ch-${tab.id}-${i + 1}"`);
      assert.ok(start > 0, `${tab.id} step ${i + 1} has a section`);
      const end = html.indexOf('<h3', start + 1);
      const section = html.slice(start, end === -1 ? undefined : end);
      const ids = [...JSON.stringify(b).matchAll(new RegExp(CLAIM_RE.source, 'g'))].map((m) => m[1]).concat((b.hotspots ?? []).map((h) => h.claim).filter(Boolean));
      for (const id of ids) if (claimById.has(id)) assert.ok(section.includes(esc(claimById.get(id).statement)), `${tab.id} step ${i + 1} lists ${id}`);
    });
  }
});

test('sources page: S numbers match the talk track and every cited source is listed', () => {
  content.references.forEach((r, i) => {
    if (!r.retired) assert.ok(html.includes(`id="S${i + 1}"`), `S${i + 1} (${r.id}) is listed`);
  });
  for (const [, n] of html.matchAll(/href="#S(\d+)"/g)) assert.ok(html.includes(`id="S${n}"`), `S${n} link has a target`);
});

test('sources page: self-contained, no scripts, CSP hash matches its one style block', () => {
  assert.ok(!/<script/i.test(html));
  assert.deepEqual([...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]), ['<link rel="stylesheet" href="references.css">']);
  assert.ok(!/\ssrc=/i.test(html));
  const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  const hash = crypto.createHash('sha256').update(style).digest('base64');
  assert.ok(html.includes(`style-src 'self' 'sha256-${hash}'`));
  assert.match(html, /default-src 'none'/);
  for (const [, attrs] of html.matchAll(/<a ([^>]*href="https?:[^>]*)>/g)) assert.match(attrs, /rel="noopener noreferrer"/);
});

test('sources page: deterministic', () => {
  assert.equal(buildReferencesPage(content), html);
});
