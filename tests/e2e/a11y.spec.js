import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fileUrl } from './helpers.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const tabs = fs.readdirSync(path.join(root, 'content', 'tabs')).map((f) => JSON.parse(fs.readFileSync(path.join(root, 'content', 'tabs', f), 'utf8')));
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const scheme of ['light', 'dark']) {
  test.describe(`accessibility (${scheme})`, () => {
    test.use({ colorScheme: scheme, reducedMotion: 'reduce' });
    for (const tab of tabs) {
      test(`axe: ${tab.id}`, async ({ page }) => {
        // ?notes opens the step's notes drawer so its text is audited with the slide.
        await page.goto(fileUrl(`#/${tab.id}/${Math.min(2, tab.beats.length || 1)}?notes`));
        await page.waitForSelector(`#chapter-list a[aria-current="step"][data-chapter="${tab.id}"]`, { state: 'attached' });
        // Open technical detail so it is audited too.
        for (const summary of await page.locator('details summary').all()) await summary.click();
        const results = await new AxeBuilder({ page }).withTags(TAGS).exclude('.stage-labels').analyze();
        const summary = results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.nodes[0]?.target.join(' ')}`);
        expect(summary).toEqual([]);
      });
    }
  });
}

test('keyboard only: reach the menus, slide controls, comparison, notes and figures', async ({ page }) => {
  await page.goto(fileUrl('#/mlo/2?notes'));
  const reached = new Set();
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    const id = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.id || el?.className || el?.tagName;
    });
    reached.add(String(id));
  }
  const all = [...reached].join(' ');
  for (const expected of ['chapter-menu-toggle', 'settings-toggle', 'step-forward', 'play', 'replay', 'notes-close', 'figure-value', 'term']) expect(all).toContain(expected);
});

test('scene description is a live region that updates with each beat', async ({ page }) => {
  await page.goto(fileUrl('#/mlo/1'));
  const region = page.locator('#scene-description');
  await expect(region).toHaveAttribute('aria-live', 'polite');
  const before = await region.textContent();
  await page.locator('#step-forward').click();
  await expect(region).not.toHaveText(before);
});

test('keyboard shortcuts dialog opens with ? and closes with Escape', async ({ page }) => {
  await page.goto(fileUrl('#/overview'));
  await page.keyboard.press('?');
  const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});
