import { test, expect } from '@playwright/test';
import { fileUrl, talkChapters } from './helpers.js';

// No text box covers another on any settled step: the caption, callout, scene labels and hotspot
// markers stay clear of each other and labels stay on the slide. A marker may sit on a label's
// top-left corner, where the stage places it as a badge (renderer unclutterPins).

const SIZES = [
  { width: 1280, height: 720 },
  { width: 1920, height: 1080 }
];

function findOverlaps() {
  const shown = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < 0.2) return false;
    }
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const boxes = [];
  for (const [sel, name] of [['#caption', 'caption'], ['#callout', 'callout']]) {
    const el = document.querySelector(sel);
    if (el?.childElementCount && shown(el)) boxes.push({ name, kind: 'card', r: el.getBoundingClientRect() });
  }
  for (const el of document.querySelectorAll('.stage-label')) {
    if (el.textContent.trim() && shown(el)) boxes.push({ name: `label "${el.textContent.trim()}"`, kind: 'label', r: el.getBoundingClientRect() });
  }
  for (const el of document.querySelectorAll('.hotspot-marker')) {
    if (shown(el)) boxes.push({ name: `marker ${el.dataset.hotspot}`, kind: 'marker', r: el.getBoundingClientRect() });
  }
  const overlap = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;
  const badge = (marker, label) => {
    const cx = (marker.left + marker.right) / 2;
    const cy = (marker.top + marker.bottom) / 2;
    return Math.abs(cx - label.left) <= 2 && Math.abs(cy - label.top) <= 2;
  };
  const issues = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      if (!overlap(a.r, b.r)) continue;
      if (a.kind === 'marker' && b.kind === 'label' && badge(a.r, b.r)) continue;
      if (b.kind === 'marker' && a.kind === 'label' && badge(b.r, a.r)) continue;
      issues.push(`${a.name} covers ${b.name}`);
    }
  }
  const slide = document.querySelector('#slide').getBoundingClientRect();
  for (const b of boxes) {
    if (b.kind === 'card') continue;
    if (b.r.left < slide.left - 1 || b.r.right > slide.right + 1 || b.r.top < slide.top - 1 || b.r.bottom > slide.bottom + 1) issues.push(`${b.name} runs off the slide`);
  }
  return issues;
}

for (const size of SIZES) {
  test.describe(`layout at ${size.width}×${size.height}`, () => {
    test.use({ viewport: size });
    for (const tab of talkChapters()) {
      test(`no text box covers another: ${tab.id}`, async ({ page }) => {
        test.setTimeout(90_000);
        for (let step = 1; step <= tab.beats.length; step++) {
          await page.goto(fileUrl(`#/${tab.id}/${step}?test`));
          await page.waitForFunction(() => window.__stage?.phase === 'settled');
          // Labels fade by opacity and markers are tidied once the frame rests, so a slow machine
          // gets a few seconds before an overlap counts.
          await expect
            .poll(async () => (await page.evaluate(findOverlaps)).map((issue) => `${tab.id}/${step}: ${issue}`), { timeout: 4000 })
            .toEqual([]);
        }
      });
    }
  });
}
