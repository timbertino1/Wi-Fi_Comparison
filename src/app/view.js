// Audience depth. The talk always shows the full technical layer (decided 2026-10-30; the
// Leadership/Technical switch was removed). The depth stays a data-view attribute on <html> so
// styles and modules that read it keep one source of truth.
const VIEW = 'technical';

/** Opens the technical disclosures in the notes, except sections that switch the animation. */
export function syncDisclosures() {
  for (const details of document.querySelectorAll('.deep-dive, .deep-section:not([data-scene])')) details.open = true;
}

export function getView() {
  return VIEW;
}

export function initView() {
  document.documentElement.dataset.view = VIEW;
  syncDisclosures();
}
