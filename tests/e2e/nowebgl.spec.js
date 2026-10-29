import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { fileUrl } from './helpers.js';

// FR-028: with WebGL unavailable, every animated tab falls back to build-time still images.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const tabs = fs.readdirSync(path.join(root, 'content', 'tabs'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(root, 'content', 'tabs', f), 'utf8')))
  .filter((t) => t.sceneId && t.beats.length);
const haveSnapshots = fs.existsSync(path.join(root, 'dist', 'fallback'));

test.use({ launchOptions: { args: ['--disable-webgl', '--disable-3d-apis'] } });
test.skip(({ browserName }) => browserName !== 'chromium', 'WebGL can only be disabled from the command line in Chromium');
test.skip(!haveSnapshots, 'Run `npm run build` (with snapshots) first');

test('every animated tab shows still images with text alternatives and a notice', async ({ page }) => {
  await page.goto(fileUrl('#/overview'));
  await expect(page.locator('#stage-notice')).toContainText('showing still images');
  for (const tab of tabs) {
    for (const [i, beat] of tab.beats.entries()) {
      await page.goto(fileUrl(`#/${tab.id}/${i + 1}`));
      const img = page.locator('#stage img.stage-fallback');
      await expect(img).toHaveAttribute('src', `fallback/${tab.id}/${i + 1}.jpg`);
      await expect(img).toHaveAttribute('alt', /\w{3,}/);
      expect(await img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
    }
  }
});

test('the still-image notice leaves the comparison and slide controls uncovered', async ({ page }) => {
  // Narrow enough that the slide bar wraps onto two rows, as it does with wider fonts.
  await page.setViewportSize({ width: 1024, height: 640 });
  await page.goto(fileUrl('#/twt/1?test'));
  await expect(page.locator('#stage-notice')).toBeVisible();
  // A real (unforced) click fails if anything sits on top of the control.
  for (const id of ['wifi6', 'wifi5']) {
    await page.locator(`#compare input[value="${id}"]`).click();
    await expect(page.locator(`#compare input[value="${id}"]`)).toBeChecked();
  }
  await page.locator('#step-forward').click();
  await expect(page.locator('#progress')).toContainText('Step 2 of');
});

test('the single-file copy, opened on its own, shows its inlined still images', async ({ page }) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wifi7-single-'));
  const copy = path.join(dir, 'wifi7-explainer.html');
  fs.copyFileSync(path.join(root, 'dist', 'wifi7-explainer.html'), copy);
  await page.goto(pathToFileURL(copy).href + '#/twt/2');
  const img = page.locator('#stage img.stage-fallback');
  await expect(img).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
  await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
});
