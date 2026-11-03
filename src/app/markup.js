// Renders the content markup defined in contracts/content-schema.md to a safe HTML string.
// Everything is escaped first; only the controlled forms below produce markup.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/**
 * @param {string} text  Content text with [[term]], [[term|label]], {{claim}}, {{ref:id}}, **bold**.
 *   Citations are not shown on the slides; they are listed on the sources page (dist/references.html).
 * @param {object} ctx   { termById }
 */
export function renderMarkup(text, ctx = {}) {
  const { termById = new Map() } = ctx;
  const escaped = escapeHtml(text);

  const withTerms = escaped.replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, (_, id, label) => {
    const term = termById.get(id);
    const shown = label ?? term?.term ?? id;
    if (!term) return shown;
    return `<button type="button" class="term" data-term="${id}" aria-haspopup="dialog">${shown}</button>`;
  });

  const withoutCitations = withTerms.replace(/\s*\{\{(?:ref:)?[a-z0-9-]+\}\}/g, '');

  const withBold = withoutCitations.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // A term button keeps the punctuation right after it on the same line.
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
    .replace(/\s*\{\{(?:ref:)?[a-z0-9-]+\}\}/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
