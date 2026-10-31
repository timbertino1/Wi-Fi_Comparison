import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fileUrl, hasWebGL } from './helpers.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const tabs = fs.readdirSync(path.join(root, 'content', 'tabs'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(root, 'content', 'tabs', f), 'utf8')))
  .filter((t) => t.sceneId && t.beats.length);
const haveSnapshots = fs.existsSync(path.join(root, 'dist', 'fallback'));

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no auto-play, motion shown as off, and the scene settles immediately', async ({ page }) => {
    await page.goto(fileUrl('#/mlo/1?test'));
    await page.waitForFunction(() => window.__stage !== undefined);
    await expect(page.locator('#motion-toggle')).toHaveText('Motion: Off');
    await expect(page.locator('#play')).toHaveAttribute('aria-pressed', 'false');
    const progress = await page.locator('#progress').textContent();
    await page.waitForTimeout(1500);
    await expect(page.locator('#progress')).toHaveText(progress);
    await page.locator('#step-forward').click();
    await expect.poll(() => page.evaluate(() => window.__stage.state)).toBe('what-is-mlo');
    // With no ambient motion the render loop goes idle.
    await expect.poll(() => page.evaluate(() => window.__stage.running), { timeout: 3000 }).toBe(false);
  });

  test('the motion toggle turns animation back on', async ({ page }) => {
    await page.goto(fileUrl('#/mlo/1'));
    await page.locator('#settings-toggle').click();
    await page.locator('#motion-toggle').click();
    await expect(page.locator('#motion-toggle')).toHaveText('Motion: On');
  });
});

test('losing the WebGL context switches to still images without losing the place', async ({ page, browserName }) => {
  test.skip(!haveSnapshots, 'Run `npm run build` (with snapshots) first');
  test.skip(browserName === 'webkit', 'WEBGL_lose_context is unreliable in headless WebKit');
  await page.goto(fileUrl('#/mlo/3'));
  test.skip(!(await hasWebGL(page)), 'No WebGL in this browser; nowebgl.spec.js covers the fallback');
  await page.waitForSelector('#stage canvas');
  await page.evaluate(() => {
    const canvas = document.querySelector('#stage canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    gl.getExtension('WEBGL_lose_context').loseContext();
  });
  await expect(page.locator('#stage img.stage-fallback')).toHaveAttribute('src', 'fallback/mlo/3.jpg');
  await expect(page.locator('#progress')).toContainText('Step 3 of 5');
});

test('hiding the page stops the render loop', async ({ page }) => {
  await page.goto(fileUrl('#/mlo/3?test'));
  test.skip(!(await hasWebGL(page)), 'No WebGL in this browser, so there is no render loop');
  await page.waitForFunction(() => window.__stage?.running === true);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => page.evaluate(() => window.__stage.running)).toBe(false);
});

for (const [width, height] of [[360, 740], [768, 1024], [1920, 1080], [3840, 2160]]) {
  test(`no horizontal scroll at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    for (const id of ['overview', 'density', 'references']) {
      await page.goto(fileUrl(`#/${id}`));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${id} at ${width}px`).toBeLessThanOrEqual(0);
    }
  });
}
