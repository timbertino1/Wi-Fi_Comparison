// US1: one Next/Back walks the whole talk, crossing chapters through their openers (FR-006, FR-008,
// FR-010, FR-011a).
import { test, expect } from '@playwright/test';
import { fileUrl, collectConsoleErrors, clickerPath, talkChapters, positionKey } from './helpers.js';

const path = clickerPath();
const position = (page) => positionKey(page);

test.describe('clicker path', () => {
  test.use({ reducedMotion: 'reduce' });

  test('clicker keys walk every step and opener across chapters and back; references is not in the path', async ({ page }) => {
    test.setTimeout(150000);
    const errors = collectConsoleErrors(page);
    await page.goto(fileUrl(`#/${path[0].chapter}/1?test`));
    await page.waitForFunction(() => window.__stage !== undefined);
    const forward = ['ArrowRight', 'PageDown', 'Space', 'ArrowDown'];
    for (let i = 1; i < path.length; i++) {
      await page.keyboard.press(forward[i % forward.length]);
      await expect.poll(() => position(page)).toBe(path[i].key);
    }
    // Next on the last step stays put: the references page is not part of the talk.
    await page.keyboard.press('PageDown');
    await expect.poll(() => position(page)).toBe(path.at(-1).key);

    const back = ['ArrowLeft', 'PageUp', 'Shift+Space', 'ArrowUp'];
    for (let i = path.length - 2; i >= 0; i--) {
      await page.keyboard.press(back[i % back.length]);
      await expect.poll(() => position(page)).toBe(path[i].key);
    }
    // Back from the first step shows the first chapter's opener, which has no Back.
    await page.keyboard.press('PageUp');
    await expect.poll(() => position(page)).toBe(`${path[0].chapter}/opener`);
    await expect(page.locator('#step-back')).toBeDisabled();
    expect(errors()).toEqual([]);
  });

  test('on-screen Next and Back buttons cross chapter boundaries through the opener', async ({ page }) => {
    const [first, second] = talkChapters();
    await page.goto(fileUrl(`#/${first.id}/${first.beats.length}?test`));
    await page.waitForFunction(() => window.__stage !== undefined);
    await page.locator('#step-forward').click();
    await expect.poll(() => position(page)).toBe(`${second.id}/opener`);
    await page.locator('#step-forward').click();
    await expect.poll(() => position(page)).toBe(`${second.id}/1`);
    await page.locator('#step-back').click();
    await expect.poll(() => position(page)).toBe(`${second.id}/opener`);
    await page.locator('#step-back').click();
    await expect.poll(() => position(page)).toBe(`${first.id}/${first.beats.length}`);
  });

  test('Back lands on a settled step', async ({ page }) => {
    await page.goto(fileUrl('#/mlo/3?test'));
    await page.waitForFunction(() => window.__stage !== undefined);
    await page.keyboard.press('PageUp');
    await expect.poll(() => position(page)).toBe('mlo/2');
    await expect.poll(() => page.evaluate(() => window.__stage.phase)).toBe('settled');
  });
});

test('rapid Next presses settle on the expected position, finishing transitions on the way (FR-008)', async ({ page }) => {
  await page.goto(fileUrl(`#/${path[0].chapter}/1?test`));
  await page.waitForFunction(() => window.__stage !== undefined);
  for (let i = 0; i < 10; i++) await page.keyboard.press('PageDown');
  await expect.poll(() => position(page), { timeout: 15000 }).toBe(path[10].key);
  await expect.poll(() => page.evaluate(() => window.__stage.phase), { timeout: 15000 }).toBe('settled');
});

test('deep links open a settled step or an opener; legacy ?present links still work', async ({ page }) => {
  await page.goto(fileUrl('#/mlo/3?test'));
  await page.waitForFunction(() => window.__stage !== undefined);
  await expect.poll(() => position(page)).toBe('mlo/3');
  await page.goto(fileUrl('#/mlo/1?intro&test'));
  await page.waitForFunction(() => window.__stage?.intro === true);
  await expect.poll(() => position(page)).toBe('mlo/opener');
  await page.goto(fileUrl('#/latency/2?present&test'));
  await page.waitForFunction(() => window.__stage?.tab === 'latency');
  await expect.poll(() => position(page)).toBe('latency/2');
  await expect(page.locator('.present-prompt')).toHaveCount(0);
});

test('the chapter menu jumps to any chapter and lists references', async ({ page }) => {
  await page.goto(fileUrl('#/overview/1?test'));
  await page.waitForFunction(() => window.__stage !== undefined);
  await page.keyboard.press('m');
  const menu = page.locator('#chapter-menu');
  await expect(menu).toBeVisible();
  await expect(menu.locator('a')).toHaveCount(talkChapters().length + 1);
  await menu.getByRole('link', { name: /Multi-Link/ }).click();
  await expect.poll(() => position(page)).toBe('mlo/1');
  await expect(menu).toBeHidden();
  await page.locator('#chapter-menu-toggle').click();
  await expect(menu.locator('[aria-current="step"]')).toContainText('Multi-Link');
});
