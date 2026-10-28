// US1: the slide shows the animation, a short caption and progress — no side text (FR-001–FR-005).
import { test, expect } from '@playwright/test';
import { fileUrl, talkPath, talkChapters, plainMarkup } from './helpers.js';

const path = talkPath();
const chapters = talkChapters();
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;

test.describe('slide content', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1920, height: 1080 } });

  test('every step: caption from content, ≤ 24 words in Leadership, no side text, progress shown', async ({ page }) => {
    test.setTimeout(120000);
    for (const { chapter, step, tab, beat } of path) {
      await page.goto(fileUrl(`#/${chapter}/${step}?view=leadership&test`));
      await page.waitForFunction(([c, s]) => window.__stage?.tab === c && window.__stage?.beat === s, [chapter, step]);
      const caption = page.locator('#caption');
      await expect(caption).toBeVisible();
      await expect(caption.locator('.caption-headline')).toHaveText(plainMarkup(beat.caption.headline));
      // A takeaway's {{claim}} citations render as source buttons; compare the words around them.
      const takeaway = caption.locator('.caption-takeaway');
      await expect.poll(() => takeaway.evaluate((el) => {
        const copy = el.cloneNode(true);
        for (const cite of copy.querySelectorAll('.cite')) cite.remove();
        return copy.textContent.replace(/\s+/g, ' ').trim();
      })).toBe(plainMarkup(beat.caption.takeaway).replace(/\s+/g, ' ').trim());
      await expect(takeaway.locator('.cite')).toHaveCount((beat.caption.takeaway.match(/\{\{[^}]+\}\}/g) ?? []).length);
      expect(words(await caption.innerText()), `${chapter}/${step}`).toBeLessThanOrEqual(24);
      await expect(page.locator('#notes')).toBeHidden();
      const order = chapters.findIndex((c) => c.id === chapter) + 1;
      await expect(page.locator('#progress')).toContainText(`Chapter ${order} of ${chapters.length} · Step ${step} of ${tab.beats.length}`);
      await expect(page.locator('#progress')).toContainText(tab.shortTitle ?? tab.title);
    }
  });

  test('the slide is 16:9 and fills the width of a 16:9 viewport', async ({ page }) => {
    await page.goto(fileUrl('#/mlo/1?test'));
    const box = await page.locator('#slide').boundingBox();
    expect(Math.abs(box.width / box.height - 16 / 9)).toBeLessThan(0.02);
    expect(box.width).toBeGreaterThan(1500);
  });
});

test('caption waits for captionAtMs with motion on, and shows at once with reduced motion', async ({ browser }) => {
  const motion = await browser.newContext({ reducedMotion: 'no-preference' });
  const page = await motion.newPage();
  await page.goto(fileUrl('#/mlo/1?test'));
  await page.waitForFunction(() => window.__stage?.captionShown === true);
  await page.keyboard.press('PageDown');
  await page.waitForFunction(() => window.__stage?.beat === 2);
  expect(await page.evaluate(() => window.__stage.captionShown)).toBe(false);
  await expect.poll(() => page.evaluate(() => window.__stage.captionShown), { timeout: 5000 }).toBe(true);
  await motion.close();

  const reduced = await browser.newContext({ reducedMotion: 'reduce' });
  const still = await reduced.newPage();
  await still.goto(fileUrl('#/mlo/1?test'));
  await still.waitForFunction(() => window.__stage !== undefined);
  await still.keyboard.press('PageDown');
  await still.waitForFunction(() => window.__stage?.beat === 2);
  expect(await still.evaluate(() => window.__stage.captionShown)).toBe(true);
  await reduced.close();
});

test('play/pause and replay remain available on the slide (FR-009)', async ({ page }) => {
  await page.goto(fileUrl('#/mlo/3?test'));
  await expect(page.locator('#play')).toBeVisible();
  await expect(page.locator('#replay')).toBeVisible();
  await page.locator('#replay').click();
  await expect.poll(() => page.evaluate(() => window.__stage.beat)).toBe(1);
});
