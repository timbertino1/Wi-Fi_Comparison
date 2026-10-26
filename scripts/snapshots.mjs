// Renders every beat (and deep section) of every animated tab to a still image for the no-WebGL
// fallback (research R5). Runs after the bundle is built: node scripts/snapshots.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const tabsDir = path.join(root, 'content', 'tabs');
const MAX_BYTES = 150 * 1024;

const tabs = fs.readdirSync(tabsDir)
  .map((f) => JSON.parse(fs.readFileSync(path.join(tabsDir, f), 'utf8')))
  .filter((t) => t.sceneId && t.beats.length);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce', colorScheme: 'light', deviceScaleFactor: 1 });
const page = await context.newPage();
const index = pathToFileURL(path.join(dist, 'index.html')).href;
let count = 0;

async function capture(file, expectedState) {
  await page.waitForFunction((s) => window.__stage?.state === s, expectedState, { timeout: 10000 });
  // Let the end state render (reduced motion resolves transitions immediately).
  await page.waitForTimeout(250);
  const stage = page.locator('#stage');
  let quality = 80;
  let buffer = await stage.screenshot({ type: 'jpeg', quality });
  while (buffer.length > MAX_BYTES && quality > 40) {
    quality -= 10;
    buffer = await stage.screenshot({ type: 'jpeg', quality });
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buffer);
  count++;
}

for (const tab of tabs) {
  for (const [i, beat] of tab.beats.entries()) {
    await page.goto(`${index}#/${tab.id}/${i + 1}?test`);
    await capture(path.join(dist, 'fallback', tab.id, `${i + 1}.jpg`), beat.sceneState);
  }
  for (const section of tab.sections ?? []) {
    if (!section.sceneState) continue;
    await page.goto(`${index}#/${tab.id}/1?test`);
    await page.locator(`[data-section="${section.id}"] summary`).click();
    await capture(path.join(dist, 'fallback', tab.id, `${section.id}.jpg`), section.sceneState);
  }
}

await browser.close();
console.log(`Fallback snapshots: ${count} images in dist/fallback/`);
