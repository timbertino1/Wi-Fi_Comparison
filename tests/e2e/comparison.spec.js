import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fileUrl } from './helpers.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const tabsDir = path.join(root, 'content', 'tabs');
const generations = JSON.parse(fs.readFileSync(path.join(root, 'content', 'generations.json'), 'utf8')).generations;
const genName = (id) => generations.find((g) => g.id === id);
const featureTabs = fs.readdirSync(tabsDir)
  .map((f) => JSON.parse(fs.readFileSync(path.join(tabsDir, f), 'utf8')))
  .filter((t) => t.kind === 'feature');

async function open(page, id, query = '') {
  await page.goto(fileUrl(`#/${id}/1?test${query}`));
  await page.waitForFunction(() => window.__stage !== undefined);
}

for (const tab of featureTabs) {
  test(`comparison: ${tab.id}`, async ({ page }) => {
    await open(page, tab.id);
    // The scene and the highlighted figure column stay on the chapter's default generation.
    await expect.poll(() => page.evaluate(() => window.__stage.generation)).toBe(tab.defaultCompare);
    if (tab.keyFigures.length) await expect(page.locator(`.figures-table th[data-gen="${tab.defaultCompare}"]`)).toHaveClass(/is-selected/);

    // Every qualified figure spells out its qualifier.
    for (const figure of tab.keyFigures) {
      if (figure.qualifier === 'theoretical') await expect(page.locator('.figures-table').getByText('Theoretical maximum').first()).toBeAttached();
      if (figure.qualifier === 'regulatory') await expect(page.locator('.figures-table').getByText(`Varies by country: ${figure.regulatoryDomain}`).first()).toBeAttached();
    }

    // The "Since Wi-Fi 6" panel: one line per generation the chapter describes (feature 003 FR-005).
    const since = page.locator('.since-wifi6');
    await expect(since).toContainText('Since Wi-Fi 6');
    for (const g of ['wifi6', 'wifi6e', 'wifi7']) {
      if (tab.sinceWifi6?.[g]) await expect(since.locator(`li[data-gen="${g}"]`)).toContainText(genName(g).name);
    }
    await expect(since.locator('li')).toHaveCount(Object.keys(tab.sinceWifi6 ?? {}).length);
  });
}

test('no generation switcher: G and gen= links change nothing', async ({ page }) => {
  await open(page, 'spectrum', '&gen=wifi6');
  await expect(page.getByRole('radiogroup')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__stage.generation)).toBe('wifi6e');
  await page.locator('#stage').click({ force: true });
  await page.keyboard.press('g');
  await expect.poll(() => page.evaluate(() => window.__stage.generation)).toBe('wifi6e');
});

test('generation colours are identical on every tab', async ({ page }) => {
  const colours = new Set();
  for (const id of ['spectrum', 'rates', 'mlo']) {
    await open(page, id);
    colours.add(await page.locator('.swatch-wifi7').first().evaluate((el) => getComputedStyle(el).backgroundColor));
  }
  expect(colours.size).toBe(1);
});
