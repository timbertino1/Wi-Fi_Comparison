// Builds the standalone sources page, dist/references.html: for every chapter and step, each claim
// it cites with its source, location, method and verification, then the source list and glossary.
// The slides show no citations (feature 003, FR-021); this page is where viewers check a figure.
// Self-contained (inline CSS under a hashed CSP, plus references.css for hardened hosts),
// deterministic, regenerated on every build.
// Source numbers S1…Sn are the talk track's, so a marker there finds its entry here.
// Usage: node scripts/references-page.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadContent, TERM_RE, CLAIM_RE, REF_RE } from './validate-content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const OUTPUT = 'dist/references.html';
const STYLESHEET = 'references.css';

const METHOD = { stated: 'Stated in the source', derived: 'Derived from cited values', illustrative: 'Illustrative' };
const TIERS = [
  [1, 'Standards bodies and regulators'],
  ['cisco', 'Cisco public documentation'],
  [2, 'Healthcare context']
];

const STYLE = `
:root {
  color-scheme: light dark;
  --bg: #f6f8fb; --surface: #ffffff; --surface-2: #eef2f7; --border: #cfd8e3;
  --fg: #142033; --fg-muted: #4a5a70; --accent: #0b6e66;
}
@media (prefers-color-scheme: dark) {
  :root { --bg: #0b1220; --surface: #121b2d; --surface-2: #19243a; --border: #2b3a55; --fg: #e8eef7; --fg-muted: #a7b4c8; --accent: #3cc7b5; }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.55 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
main { max-width: 860px; margin: 0 auto; padding: 32px 16px 64px; }
h1 { font-size: 1.9rem; line-height: 1.2; margin: 0 0 8px; }
h2 { font-size: 1.4rem; margin: 48px 0 8px; padding-top: 16px; border-top: 2px solid var(--border); }
h3 { font-size: 1.05rem; margin: 28px 0 8px; }
p { margin: 0 0 12px; }
a { color: var(--accent); }
.lead { color: var(--fg-muted); font-size: 1.05rem; }
.toc { display: flex; flex-wrap: wrap; gap: 8px; padding: 0; list-style: none; margin: 16px 0 0; }
.toc a { display: inline-block; padding: 4px 12px; border: 1px solid var(--border); border-radius: 999px; background: var(--surface); text-decoration: none; color: var(--fg); font-size: 0.9rem; }
.step-none { color: var(--fg-muted); font-style: italic; }
.claims { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.claim { padding: 12px 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); }
.claim-statement { font-weight: 600; }
.claim-value { white-space: nowrap; color: var(--accent); font-weight: 700; }
.claim-source { margin-top: 4px; }
.claim-meta, .claim-derivation { margin-top: 4px; color: var(--fg-muted); font-size: 0.9rem; }
.source-no { display: inline-block; min-width: 2.6em; font-weight: 700; color: var(--fg-muted); }
.sources { list-style: none; padding: 0; }
.sources li { margin-bottom: 8px; }
.sources .meta { color: var(--fg-muted); font-size: 0.9rem; }
dl.glossary dt { font-weight: 700; margin-top: 12px; }
dl.glossary dd { margin: 2px 0 0; }
.muted { color: var(--fg-muted); }
@media print { h2 { break-before: page; } .claim { break-inside: avoid; } }
`;

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export function buildReferencesPage(content = loadContent()) {
  const { tabs, scenarios, glossary, references, claims } = content;
  const termById = new Map(glossary.map((g) => [g.id, g]));
  const claimById = new Map(claims.map((c) => [c.id, c]));
  const refById = new Map(references.map((r) => [r.id, r]));
  const scenarioById = new Map(scenarios.map((s) => [s.id, s]));
  // Same numbering as the talk track: file order, retired references included.
  const sourceNo = new Map(references.map((r, i) => [r.id, i + 1]));

  const claimsIn = (...texts) => texts.flatMap((t) => [...String(t ?? '').matchAll(new RegExp(CLAIM_RE.source, 'g'))].map((m) => m[1]));
  const unique = (ids) => [...new Set(ids)].filter((id) => claimById.has(id));
  /** Content markup → HTML for prose: terms by name, citations dropped, bold kept. */
  const prose = (text) => String(text ?? '').split(/\n\s*\n/).map((p) => `<p>${esc(p.trim())
    .replace(TERM_RE, (_, id, label) => label ?? termById.get(id)?.term ?? id)
    .replace(new RegExp(`\\s*${REF_RE.source}`, 'g'), '')
    .replace(new RegExp(`\\s*${CLAIM_RE.source}`, 'g'), '')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</p>`).join('');
  const plain = (text) => String(text ?? '')
    .replace(TERM_RE, (_, id, label) => label ?? termById.get(id)?.term ?? id)
    .replace(new RegExp(`\\s*${REF_RE.source}`, 'g'), '')
    .replace(new RegExp(`\\s*${CLAIM_RE.source}`, 'g'), '');
  const value = (c) => (c.value === null || c.value === undefined ? '' : `${c.value}${c.unit ? ` ${c.unit}` : ''}`);
  const sourceLink = (refId) => {
    const r = refById.get(refId);
    return r ? `<a href="#S${sourceNo.get(refId)}">S${sourceNo.get(refId)}</a> <a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a>` : esc(refId);
  };

  const claimItem = (id) => {
    const c = claimById.get(id);
    const v = value(c);
    const out = [`<li class="claim"><div><span class="claim-statement">${esc(c.statement)}</span>${v ? ` <span class="claim-value">${esc(v)}</span>` : ''}</div>`];
    for (const s of c.sources) out.push(`<div class="claim-source">${sourceLink(s.referenceId)}${s.locator ? ` · ${esc(s.locator)}` : ''}</div>`);
    if (c.method === 'derived' && c.derivation?.explanation) out.push(`<div class="claim-derivation">${esc(c.derivation.explanation)}</div>`);
    const verified = c.verification?.verifiedOn ? `verified ${esc(c.verification.verifiedOn)}` : 'not yet verified';
    out.push(`<div class="claim-meta">${METHOD[c.method] ?? esc(c.method)} · ${verified}</div></li>`);
    return out.join('');
  };
  const claimList = (ids) => (ids.length ? `<ul class="claims">${ids.map(claimItem).join('')}</ul>` : '<p class="step-none">No figures or rules cited.</p>');

  const html = [];
  const chapters = tabs.filter((t) => t.kind !== 'references' && t.beats.length);
  const refTab = tabs.find((t) => t.kind === 'references');
  const latest = claims.map((c) => c.verification?.verifiedOn).filter(Boolean).sort().at(-1);

  html.push('<h1>Wi-Fi 7 Explained: Sources</h1>');
  html.push(`<p class="lead">Every figure and rule in the talk, chapter by chapter and step by step, with the source it rests on. ${claims.length} claims${latest ? `, last verified ${esc(latest)}` : ''}. Source numbers (S1, S2…) match the talk track.</p>`);
  html.push(`<ul class="toc">${chapters.map((t, i) => `<li><a href="#ch-${esc(t.id)}">${i + 1}. ${esc(t.title)}</a></li>`).join('')}<li><a href="#how">How figures are checked</a></li><li><a href="#sources">Sources</a></li><li><a href="#glossary">Glossary</a></li></ul>`);

  chapters.forEach((tab, ci) => {
    html.push(`<section id="ch-${esc(tab.id)}"><h2>${ci + 1}. ${esc(tab.title)}</h2>`);
    // Text outside the steps: the opener, the Notes panel ("Since Wi-Fi 6", key figures, sections) and scenarios.
    const chapterIds = unique([
      ...claimsIn(tab.summary, tab.opener?.promise, tab.opener?.problem, tab.wifi7Adds, ...Object.values(tab.sinceWifi6 ?? {})),
      ...(tab.scenarioIds ?? []).flatMap((id) => claimsIn(scenarioById.get(id)?.problem, scenarioById.get(id)?.outcomeSupported)),
      ...(tab.keyFigures ?? []).flatMap((k) => Object.values(k.claimIds ?? {})),
      ...(tab.sections ?? []).flatMap((s) => claimsIn(s.body))
    ]);
    if (chapterIds.length) {
      html.push(`<h3 id="ch-${esc(tab.id)}-chapter">Chapter opener and Notes panel</h3>`);
      html.push(claimList(chapterIds));
    }
    tab.beats.forEach((b, si) => {
      const ids = unique([
        ...claimsIn(b.caption?.headline, b.caption?.takeaway, b.callout?.title, ...(b.callout?.points ?? []), b.heading, b.body, b.bottomLine, b.cisco?.text, b.sceneDescription),
        ...(b.hotspots ?? []).map((h) => h.claim).filter(Boolean),
        ...(b.questions ?? []).flatMap((q) => claimsIn(q.q, q.a))
      ]);
      html.push(`<h3 id="ch-${esc(tab.id)}-${si + 1}">Step ${si + 1}: ${esc(plain(b.caption?.headline ?? b.heading))}</h3>`);
      html.push(claimList(ids));
    });
    html.push('</section>');
  });

  html.push('<section id="how"><h2>How figures are checked</h2>');
  for (const s of refTab?.sections ?? []) html.push(`<h3>${esc(plain(s.heading))}</h3>${prose(s.body)}`);
  html.push('</section>');

  html.push(`<section id="sources"><h2>Sources</h2>`);
  for (const [tier, heading] of TIERS) {
    const list = references.filter((r) => r.tier === tier && !r.retired);
    if (!list.length) continue;
    html.push(`<h3>${esc(heading)}</h3><ul class="sources">`);
    for (const r of list) {
      const meta = [r.identifier, r.edition, r.date].filter(Boolean).join(' · ');
      html.push(`<li id="S${sourceNo.get(r.id)}"><span class="source-no">S${sourceNo.get(r.id)}</span><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a><div class="meta">${esc(meta)} · ${r.access === 'open' ? 'open access' : 'paywalled'}${r.status === 'superseded' ? ' · superseded edition' : ''}</div></li>`);
    }
    html.push('</ul>');
  }
  html.push('</section>');

  html.push('<section id="glossary"><h2>Glossary</h2><dl class="glossary">');
  for (const g of [...glossary].sort((a, b) => a.term.localeCompare(b.term))) {
    html.push(`<dt>${esc(g.term)}${g.expansion ? ` <span class="muted">(${esc(g.expansion)})</span>` : ''}</dt><dd>${esc(g.definition)}</dd>`);
  }
  html.push('</dl></section>');

  // The same CSS twice: inline (allowed by its hash) for a copy opened on its own, and as
  // references.css for hosts whose CSP header allows only same-origin stylesheets.
  const style = STYLE.trim();
  const hash = crypto.createHash('sha256').update(style).digest('base64');
  const csp = `default-src 'none'; style-src 'self' 'sha256-${hash}'; base-uri 'none'; form-action 'none'`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="referrer" content="no-referrer">
<title>Wi-Fi 7 Explained: Sources</title>
<link rel="stylesheet" href="${STYLESHEET}">
<style>${style}</style>
</head>
<body>
<main>
${html.join('\n')}
</main>
</body>
</html>
`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = path.join(root, OUTPUT);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buildReferencesPage());
  fs.writeFileSync(path.join(path.dirname(file), STYLESHEET), `${STYLE.trim()}\n`);
  console.log(`Sources page: ${OUTPUT}`);
}
