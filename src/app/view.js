// Leadership | Technical audience view (research R13). The view is a data-view attribute on <html>;
// switching never re-mounts the scene or changes the current tab or beat.
import * as prefs from './preferences.js';
import * as router from './router.js';
import { announce } from './tabs.js';

const LABELS = { leadership: 'Leadership', technical: 'Technical' };
const group = document.getElementById('audience');
let current = 'leadership';

/** Opens technical detail in Technical view; closes what the viewer didn't open in Leadership view. */
export function syncDisclosures() {
  for (const details of document.querySelectorAll('.deep-dive, .deep-section')) {
    if (current === 'technical') details.open = true;
    else if (!details.hasAttribute('data-viewer-opened')) details.open = false;
  }
}

function apply(view, { announceChange = false, updateUrl = true } = {}) {
  current = view;
  document.documentElement.dataset.view = view;
  for (const input of group.querySelectorAll('input')) input.checked = input.value === view;
  syncDisclosures();
  if (updateUrl && router.getRoute()) router.replace({ set: { view } });
  document.dispatchEvent(new CustomEvent('viewchange', { detail: { view } }));
  if (announceChange) announce(`${LABELS[view]} view`);
}

export function getView() {
  return current;
}

export function setView(view) {
  if (!LABELS[view] || view === current) return;
  prefs.set('view', view);
  apply(view, { announceChange: true });
}

export function toggleView() {
  setView(current === 'leadership' ? 'technical' : 'leadership');
}

export function initView() {
  for (const view of Object.keys(LABELS)) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'audience';
    input.value = view;
    input.addEventListener('change', () => setView(view));
    const text = document.createElement('span');
    text.textContent = LABELS[view];
    label.append(input, text);
    group.append(label);
  }

  // URL view wins over the stored preference; the default is Leadership.
  const fromUrl = router.parse(location.hash).params.get('view');
  apply(LABELS[fromUrl] ? fromUrl : prefs.get('view'), { updateUrl: false });

  router.onRoute((route) => {
    const v = route.params.get('view');
    if (LABELS[v] && v !== current) apply(v, { updateUrl: false });
  });

  // Remember disclosures the viewer opened themselves, so Leadership view doesn't close them.
  document.addEventListener('click', (e) => {
    const summary = e.target.closest('.deep-dive > summary, .deep-section > summary');
    if (summary) summary.parentElement.toggleAttribute('data-viewer-opened', !summary.parentElement.open);
  });

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest?.('input[type="text"], textarea, select, [contenteditable="true"], [role="dialog"]')) return;
    if (e.key === 'v' || e.key === 'V') {
      e.preventDefault();
      toggleView();
    }
  });
}
