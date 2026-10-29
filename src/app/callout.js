// Slide callout (FR-005a): a short titled card of 2–4 points that slides in after the caption on
// steps that declare one. It appears at `callout.atMs`, by default a beat after the caption; settled
// steps and reduced motion show it at once. The next step replaces or removes it.
import { markupContext } from './content.js';
import { renderInline } from './markup.js';
import * as story from './story.js';
import * as prefs from './preferences.js';

const DEFAULT_CAPTION_AT_MS = 600;
const AFTER_CAPTION_MS = 1200;
// The share of the stage width kept free for the callout on steps that have one; the 3D picture is
// fitted into the rest, so the card on the right does not cover the scene.
const STAGE_SHIFT = 0.36;
const root = document.getElementById('callout');
let timer = 0;
let stage = null;

function show() {
  clearTimeout(timer);
  timer = 0;
  if (!root.hidden || !root.childElementCount) return;
  root.hidden = false;
  story.setCalloutShown(true);
}

function hide() {
  clearTimeout(timer);
  timer = 0;
  root.hidden = true;
  story.setCalloutShown(false);
}

function render({ beat, animated, intro }) {
  hide();
  root.replaceChildren();
  const callout = intro ? null : beat?.callout; // the chapter opener stands alone
  stage?.setShift(callout ? STAGE_SHIFT : 0, { animate: animated && prefs.effectiveMotion() !== 'reduced' });
  if (!callout) return;
  const title = document.createElement('p');
  title.className = 'callout-title';
  title.innerHTML = renderInline(callout.title, markupContext); // safe: renderMarkup
  const list = document.createElement('ul');
  list.className = 'callout-points';
  for (const point of callout.points) {
    const li = document.createElement('li');
    li.innerHTML = renderInline(point, markupContext); // safe: renderMarkup
    list.append(li);
  }
  root.append(title, list);
  if (!animated || prefs.effectiveMotion() === 'reduced') show();
  else timer = setTimeout(show, callout.atMs ?? (beat.captionAtMs ?? DEFAULT_CAPTION_AT_MS) + AFTER_CAPTION_MS);
}

/** `stage` is the 3D stage (null without WebGL), shifted aside while a callout is up. */
export function initCallout(options = {}) {
  stage = options.stage ?? null;
  story.on('beat', render);
}
