// Renders the content markup defined in contracts/content-schema.md to a safe HTML string.
// Everything is escaped first; only the controlled forms below produce markup.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/**
 * @param {string} text  Content text with [[term]], [[term|label]], {{claim}}, {{ref:id}}, **bold**.
 * @param {object} ctx   { termById, claimById, refById, citationNumber(claimId) }
 */
export function renderMarkup(text, ctx = {}) {
  const { termById = new Map(), claimById = new Map(), refById = new Map(), citationNumber = () => '?' } = ctx;
  const escaped = escapeHtml(text);

  const withTerms = escaped.replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, (_, id, label) => {
    const term = termById.get(id);
    const shown = label ?? term?.term ?? id;
    if (!term) return shown;
    return `<button type="button" class="term" data-term="${id}" aria-haspopup="dialog">${shown}</button>`;
  });

  const withRefs = withTerms.replace(/\{\{ref:([a-z0-9-]+)\}\}/g, (_, id) => {
    if (!refById.has(id)) return '';
    return `<sup><a class="cite-ref" href="#/references?ref=${id}" aria-label="ref: background reading, ${escapeHtml(refById.get(id).title)}">[ref]</a></sup>`;
  });

  const withClaims = withRefs.replace(/\{\{([a-z0-9-]+)\}\}/g, (_, id) => {
    const claim = claimById.get(id);
    if (!claim) return '';
    return `<sup><button type="button" class="cite" data-claim="${id}" aria-haspopup="dialog" aria-label="Source ${citationNumber(id)}: ${escapeHtml(claim.statement)}">[${citationNumber(id)}]</button></sup>`;
  });

  const withBold = withClaims.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // A term or source button keeps the punctuation right after it on the same line.
  const glued = withBold.replace(/((?:<sup>)?<button [^>]*>[^<]*<\/button>(?:<\/sup>)?)([.,;:!?)’]+)/g, '<span class="nowrap">$1$2</span>');

  return glued
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p}</p>`)
    .join('');
}

/** Like renderMarkup, but for inline contexts: paragraphs are joined with spaces, no <p> wrappers. */
export function renderInline(text, ctx = {}) {
  return renderMarkup(text, ctx).replace(/<\/p><p>/g, ' ').replace(/^<p>|<\/p>$/g, '');
}

/** Plain text with markup removed (for aria labels, alt text and descriptions). */
export function plainText(text, ctx = {}) {
  const { termById = new Map() } = ctx;
  return String(text ?? '')
    .replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, (_, id, label) => label ?? termById.get(id)?.term ?? id)
    .replace(/\{\{ref:[a-z0-9-]+\}\}/g, '')
    .replace(/\{\{[a-z0-9-]+\}\}/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
