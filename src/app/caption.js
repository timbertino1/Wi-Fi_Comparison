// Slide caption (FR-003, FR-004, research P3): headline, takeaway and (Technical view) a technical
// line. It appears when the step's subject does: after `captionAtMs`, or earlier on cue('caption')
// from the scene, whichever comes first. Settled steps and reduced motion show it at once.
import { markupContext } from './content.js';
import { renderInline } from './markup.js';
import * as story from './story.js';
import * as prefs from './preferences.js';

const DEFAULT_CAPTION_AT_MS = 600;
const root = document.getElementById('caption');
let timer = 0;

function line(className, text) {
  const p = document.createElement('p');
  p.className = className;
  p.innerHTML = renderInline(text, markupContext); // safe: renderMarkup
  return p;
}

function show() {
  clearTimeout(timer);
  timer = 0;
  if (!root.hidden || !root.childElementCount) return;
  root.hidden = false;
  story.setCaptionShown(true);
}

function hide() {
  clearTimeout(timer);
  timer = 0;
  root.hidden = true;
  story.setCaptionShown(false);
}

function render({ beat, animated }) {
  hide();
  root.replaceChildren();
  const caption = beat?.caption;
  if (!caption) return;
  root.append(line('caption-headline', caption.headline), line('caption-takeaway', caption.takeaway));
  if (caption.technical) root.append(line('caption-technical', caption.technical));
  if (!animated || prefs.effectiveMotion() === 'reduced') show();
  else timer = setTimeout(show, beat.captionAtMs ?? DEFAULT_CAPTION_AT_MS);
}

/** `stage` is the 3D stage (null without WebGL); its scenes may cue the caption early. */
export function initCaption({ stage }) {
  stage?.onCue((name) => {
    if (name === 'caption') show();
  });
  story.on('beat', render);
}
