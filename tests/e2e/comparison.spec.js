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
    const options = tab.compareGenerations.filter((g) => g !== 'wifi7');
    const group = page.getByRole('radiogroup', { name: 'Compare Wi-Fi 7 with' });
    await expect(group.getByRole('radio')).toHaveCount(options.length);
    for (const g of options) await expect(group.getByText(`${genName(g).name} (${genName(g).ieee})`)).toBeVisible();
    await expect(group.getByRole('radio', { checked: true })).toHaveValue(tab.defaultCompare);

    // Selecting a generation updates the URL, the scene and the highlighted figure column.
    const other = options.find((g) => g !== tab.defaultCompare);
    if (other) {
      await group.locator(`input[value="${other}"]`).check({ force: true });
      await expect.poll(() => page.evaluate(() => location.hash)).toContain(`gen=${other}`);
      await expect.poll(() => page.evaluate(() => window.__stage.generation)).toBe(other);
      await expect(page.locator(`.figures-table th[data-gen="${other}"]`)).toHaveClass(/is-selected/);
    }

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
    // Comparisons start at Wi-Fi 6 (FR-006).
    for (const old of ['wifi4', 'wifi5']) await expect(group.locator(`input[value="${old}"]`)).toHaveCount(0);
  });
}

test('G cycles the comparison generation and deep links restore it', async ({ page }) => {
  await open(page, 'spectrum', '&gen=wifi6');
  await expect(page.getByRole('radiogroup', { name: 'Compare Wi-Fi 7 with' }).getByRole('radio', { checked: true })).toHaveValue('wifi6');
  await page.locator('#stage').click({ force: true });
  await page.keyboard.press('g');
  await expect(page.getByRole('radiogroup', { name: 'Compare Wi-Fi 7 with' }).getByRole('radio', { checked: true })).toHaveValue('wifi6e');
});

test('generation colours are identical on every tab', async ({ page }) => {
  const colours = new Set();
  for (const id of ['spectrum', 'rates', 'mlo']) {
    await open(page, id);
    colours.add(await page.locator('.swatch-wifi7').first().evaluate((el) => getComputedStyle(el).backgroundColor));
  }
  expect(colours.size).toBe(1);
});
