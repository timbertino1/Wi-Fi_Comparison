// Compares uncapped median frame times per scene between this build and a baseline build
// (research P11). Uncapped, so extra per-frame cost shows up even when both sides reach 60 fps.
// Usage: node scripts/frame-budget.mjs [--baseline <dist dir>] [--budget-ms 1]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const baseline = opt('--baseline');
const budgetMs = Number(opt('--budget-ms') ?? 1);

const tabsDir = path.join(root, 'content', 'tabs');
const shots = fs.readdirSync(tabsDir).sort()
  .map((f) => JSON.parse(fs.readFileSync(path.join(tabsDir, f), 'utf8')))
  .filter((t) => t.sceneId && t.beats.length)
  .map((t) => `${t.id}/${Math.min(2, t.beats.length)}`);

async function measure(dist) {
  const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--disable-frame-rate-limit'] });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 860 } })).newPage();
  const index = pathToFileURL(path.join(dist, 'index.html')).href;
  const out = {};
  for (const shot of shots) {
    await page.goto(`${index}#/${shot}`);
    await page.waitForTimeout(1500);
    out[shot] = await page.evaluate(() => new Promise((resolve) => {
      const samples = [];
      let last = performance.now();
      const end = last + 2500;
      (function tick(now) {
        samples.push(now - last);
        last = now;
        if (now < end) requestAnimationFrame(tick);
        else resolve(samples.sort((a, b) => a - b)[samples.length >> 1]);
      })(last);
    }));
  }
  await browser.close();
  return out;
}

const current = await measure(path.join(root, 'dist'));
const base = baseline ? await measure(path.resolve(baseline)) : null;
let over = 0;
for (const shot of shots) {
  const now = current[shot].toFixed(1);
  if (!base) {
    console.log(`${shot.padEnd(20)} ${now} ms`);
    continue;
  }
  const delta = current[shot] - base[shot];
  const flag = delta > budgetMs ? '  OVER' : '';
  if (flag) over++;
  console.log(`${shot.padEnd(20)} ${now} ms  (baseline ${base[shot].toFixed(1)}, ${delta >= 0 ? '+' : ''}${delta.toFixed(1)})${flag}`);
}
if (base) console.log(over ? `${over} scene(s) over the ${budgetMs} ms budget` : `All scenes within ${budgetMs} ms of baseline`);
process.exit(over ? 1 : 0);
