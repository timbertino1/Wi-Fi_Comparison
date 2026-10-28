// Generation switcher: which earlier generation Wi-Fi 7 is compared with on a feature tab.
import { genById } from './content.js';
import * as story from './story.js';
import * as router from './router.js';

const root = document.getElementById('compare');

function render({ tab, generation }) {
  root.replaceChildren();
  const options = (tab?.compareGenerations ?? []).filter((g) => g !== 'wifi7');
  if (tab?.kind !== 'feature' || options.length < 1) return;

  const group = document.createElement('div');
  group.className = 'compare-group';
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-labelledby', 'compare-label');
  const label = document.createElement('span');
  label.id = 'compare-label';
  label.className = 'compare-label';
  label.textContent = 'Compare Wi-Fi 7 with';
  root.append(label);

  for (const genId of options) {
    const g = genById.get(genId);
    const option = document.createElement('label');
    option.className = 'compare-option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'compare-gen';
    input.value = genId;
    input.checked = genId === generation;
    input.addEventListener('change', () => select(genId));
    const swatch = document.createElement('span');
    swatch.className = `swatch swatch-${genId}`;
    swatch.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.textContent = `${g.name} (${g.ieee})`;
    option.append(input, swatch, text);
    group.append(option);
  }
  root.append(group);
}

function select(genId) {
  story.setGeneration(genId);
  router.replace({ set: { gen: genId } });
}

/** Cycles to the next comparison generation (G key). */
export function cycleGeneration() {
  const { tab, generation } = story.snapshot();
  const options = (tab?.compareGenerations ?? []).filter((g) => g !== 'wifi7');
  if (tab?.kind !== 'feature' || options.length < 2) return;
  const next = options[(options.indexOf(generation) + 1) % options.length];
  select(next);
  root.querySelector(`input[value="${next}"]`)?.focus({ preventScroll: true });
}

/** Updates the checked radio in place, so the radio a viewer just chose (and its focus) survives. */
function sync({ generation }) {
  for (const input of root.querySelectorAll('input[name="compare-gen"]')) input.checked = input.value === generation;
}

export function initComparison() {
  story.on('tab', render);
  story.on('generation', sync);
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest?.('input[type="text"], textarea, select, [contenteditable="true"], [role="dialog"]')) return;
    if (e.key === 'g' || e.key === 'G') {
      e.preventDefault();
      cycleGeneration();
    }
  });
}
