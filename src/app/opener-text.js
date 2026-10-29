// Chapter opener wording (FR-011a), shared by the slide (opener.js) and the talk-track generator so
// the tag and lineage badge read the same in both. Pure: no DOM.

const TAGS = { feature: 'Wi-Fi 7 feature', overview: 'Why it matters', roadmap: 'What’s next' };

/**
 * @param {object} tab        A chapter from content/tabs.
 * @param {number} number     Its 1-based position in the talk.
 * @param {Map} genById       Generations by id.
 * @returns {{ label: string, tag: string, badge: string|null }}
 */
export function openerParts(tab, number, genById) {
  const tag = TAGS[tab.kind] ?? 'Chapter';
  let badge = null;
  if (tab.kind === 'feature' && tab.opener?.badge !== false) {
    const first = genById.get(tab.introducedIn);
    badge = !tab.introducedIn || tab.introducedIn === 'wifi7' || !first ? 'New in Wi-Fi 7' : `Improved in Wi-Fi 7 · first in ${first.name}`;
  }
  return { label: `Chapter ${number}`, tag, badge };
}
