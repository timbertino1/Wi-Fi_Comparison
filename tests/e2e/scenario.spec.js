import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fileUrl } from './helpers.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const tabsDir = path.join(root, 'content', 'tabs');
const scenarios = JSON.parse(fs.readFileSync(path.join(root, 'content', 'scenarios.json'), 'utf8')).scenarios;
const featureTabs = fs.readdirSync(tabsDir)
  .map((f) => JSON.parse(fs.readFileSync(path.join(tabsDir, f), 'utf8')))
  .filter((t) => t.kind === 'feature');

for (const tab of featureTabs) {
  test(`scenario card: ${tab.id}`, async ({ page }) => {
    await page.goto(fileUrl(`#/${tab.id}/1?notes`));
    const card = page.locator('#scenario .scenario-card');
    await expect(card).toHaveCount(tab.scenarioIds.length);
    const s = scenarios.find((x) => x.id === tab.scenarioIds[0]);
    await expect(card.first().locator('h3')).toHaveText(s.location);
    await expect(card.first()).toContainText('Illustrative scenario');
    await expect(card.first()).toContainText('What this supports');
    for (const d of s.deviceTypes) await expect(card.first().locator('li', { hasText: d })).toHaveCount(1);
    // Each device type is part of the tab's story (its key word appears in the beats or scenario).
    const storyText = JSON.stringify(tab.beats).toLowerCase() + s.problem.toLowerCase();
    for (const d of s.deviceTypes) expect(storyText).toContain(d.split(' ').at(-1).toLowerCase().replace(/s$/, ''));
  });
}
