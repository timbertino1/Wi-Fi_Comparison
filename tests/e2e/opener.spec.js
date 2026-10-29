// FR-011 chapter transitions and FR-011a chapter openers.
import { test, expect } from '@playwright/test';
import { fileUrl, talkChapters, positionKey, plainMarkup, hasWebGL } from './helpers.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const generations = JSON.parse(fs.readFileSync(path.join(root, 'content', 'generations.json'), 'utf8')).generations;
const chapters = talkChapters();
const TAGS = { feature: 'Wi-Fi 7 feature', overview: 'Why it matters', roadmap: 'What’s next' };

function expectedBadge(tab) {
  if (tab.kind !== 'feature' || tab.opener.badge === false) return null;
  if (!tab.introducedIn || tab.introducedIn === 'wifi7') return 'New in Wi-Fi 7';
  return `Improved in Wi-Fi 7 · first in ${generations.find((g) => g.id === tab.introducedIn).name}`;
}

test('every chapter opener shows its number, tag, title, promise, problem and lineage badge', async ({ page }) => {
  test.setTimeout(90000);
  for (const [i, tab] of chapters.entries()) {
    await page.goto(fileUrl(`#/${tab.id}/1?intro&test`));
    await page.waitForFunction((id) => window.__stage?.tab === id && window.__stage.intro, tab.id);
    const opener = page.locator('#opener');
    await expect(opener).toBeVisible();
    await expect(opener.locator('.opener-number')).toHaveText(`Chapter ${i + 1}`);
    await expect(opener.locator('.opener-tag')).toHaveText(TAGS[tab.kind]);
    await expect(opener.getByRole('heading', { level: 2 })).toHaveText(tab.title);
    await expect(opener.locator('.opener-promise')).toHaveText(plainMarkup(tab.opener.promise));
    await expect(opener.locator('.opener-problem')).toContainText(plainMarkup(tab.opener.problem));
    const badge = expectedBadge(tab);
    if (badge) await expect(opener.locator('.opener-badge')).toHaveText(badge);
    else await expect(opener.locator('.opener-badge')).toHaveCount(0);
    // The opener stands alone: no caption, callout or hotspot markers; progress says so.
    await expect(page.locator('#caption')).toBeHidden();
    await expect(page.locator('#callout')).toBeHidden();
    expect(await page.evaluate(() => window.__stage.hotspots)).toEqual([]);
    await expect(page.locator('#progress')).toContainText(`Chapter ${i + 1} of ${chapters.length} · Opener`);
  }
});

test('Next on a last step moves out, crossfades and lands on the next opener within 2.5 s', async ({ page }) => {
  test.skip(!(await hasWebGL(page)), 'The move-out and frame crossfade need the 3D stage');
  const [first, second] = chapters;
  await page.goto(fileUrl(`#/${first.id}/${first.beats.length}?test`));
  await page.waitForFunction(() => window.__stage?.phase === 'settled');
  const phases = [];
  await page.exposeFunction('__notePhase', (p) => phases.push(p));
  await page.evaluate(() => {
    let last = '';
    const tick = () => {
      if (window.__stage.phase !== last) window.__notePhase((last = window.__stage.phase));
      requestAnimationFrame(tick);
    };
    tick();
  });
  const started = Date.now();
  await page.keyboard.press('PageDown');
  await expect.poll(() => positionKey(page)).toBe(`${second.id}/opener`);
  await expect(page.locator('#transition-frame')).toBeHidden({ timeout: 2500 });
  expect(Date.now() - started).toBeLessThan(2500 + 500); // allow for test-harness polling
  expect(phases).toContain('chapter-out');
  await expect.poll(() => page.evaluate(() => window.__stage.phase)).toBe('settled');
});

test('with reduced motion there is no move-out and the opener arrives at once', async ({ browser }) => {
  const page = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
  const [first, second] = chapters;
  await page.goto(fileUrl(`#/${first.id}/${first.beats.length}?test`));
  await page.waitForFunction(() => window.__stage?.phase === 'settled');
  await page.keyboard.press('PageDown');
  await expect.poll(() => positionKey(page), { timeout: 1000 }).toBe(`${second.id}/opener`);
  await expect(page.locator('#transition-frame')).toBeHidden({ timeout: 1000 });
  await page.context().close();
});

test('Next from an opener plays step 1 with its caption; Back from step 1 returns to the opener', async ({ page }) => {
  const tab = chapters[2];
  await page.goto(fileUrl(`#/${tab.id}/1?intro&test`));
  await page.waitForFunction(() => window.__stage?.intro === true);
  await page.keyboard.press('PageDown');
  await expect.poll(() => positionKey(page)).toBe(`${tab.id}/1`);
  await expect(page.locator('#opener')).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.__stage.captionShown), { timeout: 8000 }).toBe(true);
  await expect(page).not.toHaveURL(/intro/);
  await page.keyboard.press('PageUp');
  await expect.poll(() => positionKey(page)).toBe(`${tab.id}/opener`);
  await expect(page).toHaveURL(/intro/);
  await expect(page.locator('#caption')).toBeHidden();
});
