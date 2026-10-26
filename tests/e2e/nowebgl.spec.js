import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
