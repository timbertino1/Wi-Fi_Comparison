// Hotspots (FR-016–FR-018, research P5): "i" markers pinned to the anchors a scene publishes for the
// current state, each opening a non-modal card with the term's definition, an optional sourced
// figure and (Technical view) a technical line. Scenes publish anchors only; markers, cards and their
// text belong to the shell. A card closes on Escape, an outside click, or Next (via overlays).
import { termById, claimById, markupContext } from './content.js';
import { renderInline } from './markup.js';
import * as story from './story.js';
import * as overlays from './overlays.js';
import { getView } from './view.js';

const slide = document.getElementById('slide');
const card = document.getElementById('hotspot-card');
let stage = null;
let pins = [];
let markers = [];
let openMarker = null;

const visibleFor = (h) => (h.depth ?? 'all') === 'all' || getView() === 'technical';

function clearMarkers() {
  closeCard({ focus: false });
  for (const unpin of pins) unpin();
  pins = [];
  markers = [];
}

function marker(h) {
  const term = termById.get(h.term);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'hotspot-marker';
  button.textContent = 'i';
  button.dataset.hotspot = h.id;
  button.setAttribute('aria-label', `${term?.term ?? h.term}: more information`);
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'hotspot-card');
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    if (openMarker === button) closeCard();
    else openCard(h, button);
  });
  return button;
}

function renderMarkers() {
  clearMarkers();
  const { beat, instance, intro } = story.snapshot();
  if (!stage || !instance?.anchors || intro) {
    story.setHotspots([]);
    return;
  }
  const anchors = instance.anchors();
  for (const h of beat?.hotspots ?? []) {
    const object = anchors[h.anchor];
    if (!object || !visibleFor(h)) continue;
    const button = marker(h);
    pins.push(stage.attach(object, button, h.offset ?? [0, 0.55, 0]));
    markers.push(button);
  }
  story.setHotspots(markers.map((m) => m.dataset.hotspot));
}

function line(className, html) {
  const p = document.createElement('p');
  p.className = className;
  p.innerHTML = html; // safe: renderMarkup output or text set below
  return p;
}

function figureLine(claimId) {
  const c = claimById.get(claimId);
  if (!c) return null;
  const value = c.value === null || c.value === undefined ? '' : `${c.value}${c.unit ? ` ${c.unit}` : ''} — `;
  const p = document.createElement('p');
  p.className = 'hotspot-figure';
  const cite = document.createElement('span');
  cite.innerHTML = renderInline(`{{${claimId}}}`, markupContext); // safe: renderMarkup
  p.append(document.createTextNode(`${value}${c.statement}`), cite);
  return p;
}

function place(button) {
  const s = slide.getBoundingClientRect();
  const m = button.getBoundingClientRect();
  card.style.visibility = 'hidden';
  card.hidden = false;
  const c = card.getBoundingClientRect();
  const gap = 12;
  // A visible callout on the right is a boundary, like the slide edge.
  const callout = document.getElementById('callout');
  const rightEdge = callout && !callout.hidden ? callout.getBoundingClientRect().left : s.right;
  const roomRight = rightEdge - m.right;
  const left = roomRight > c.width + gap ? m.right - s.left + gap : Math.max(gap, m.left - s.left - c.width - gap);
  // Keep the card below the caption so it never covers the headline.
  const caption = document.getElementById('caption');
  const minTop = caption && !caption.hidden ? caption.getBoundingClientRect().bottom - s.top + gap : gap;
  const top = Math.min(Math.max(minTop, m.top - s.top - c.height / 2), s.height - c.height - gap);
  card.style.left = `${left}px`;
  card.style.top = `${top}px`;
  card.style.visibility = '';
}

function openCard(h, button) {
  closeCard({ focus: false });
  const term = termById.get(h.term);
  const heading = document.createElement('h2');
  heading.id = 'hotspot-card-title';
  heading.className = 'hotspot-term';
  heading.textContent = term?.term ?? h.term;
  const body = [heading, line('hotspot-definition', '')];
  body[1].textContent = term?.short ?? term?.definition ?? '';
  if (h.claim) {
    const fig = figureLine(h.claim);
    if (fig) body.push(fig);
  }
  if (h.technical && getView() === 'technical') body.push(line('hotspot-technical', renderInline(h.technical, markupContext))); // safe: renderMarkup
  card.replaceChildren(...body);
  openMarker = button;
  button.setAttribute('aria-expanded', 'true');
  place(button);
  story.setHotspotOpen(h.id);
}

function closeCard({ focus = true } = {}) {
  if (!openMarker) return;
  const button = openMarker;
  openMarker = null;
  card.hidden = true;
  card.replaceChildren();
  button.setAttribute('aria-expanded', 'false');
  if (focus && button.isConnected) button.focus({ preventScroll: true });
  story.setHotspotOpen(null);
}

/** Focuses the first hotspot marker on the slide (H key). */
export function focusFirst() {
  markers[0]?.focus({ preventScroll: true });
}

export function initHotspots(options) {
  stage = options.stage;
  overlays.register('hotspot-card', { isOpen: () => openMarker !== null, close: () => closeCard() });
  // Markers follow the step; the scene publishes the anchors for its state once it is set.
  story.on('beat', () => clearMarkers());
  story.on('settled', renderMarkers);
  document.addEventListener('viewchange', () => {
    if (story.snapshot().instance) renderMarkers();
  });
  document.addEventListener('click', (e) => {
    if (openMarker && !card.contains(e.target) && !e.target.closest('.hotspot-marker, [role="dialog"]:not(#hotspot-card)')) closeCard({ focus: false });
  });
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'Escape' && openMarker) {
      e.preventDefault();
      closeCard();
    } else if ((e.key === 'h' || e.key === 'H') && !e.target.closest?.('input, textarea, select, [contenteditable="true"], [role="dialog"]')) {
      e.preventDefault();
      focusFirst();
    }
  });
}
