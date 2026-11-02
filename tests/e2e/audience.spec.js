import { test, expect } from '@playwright/test';
import { fileUrl } from './helpers.js';

// One plain layer for everyone: no Leadership/Technical switch (FR-020, 2026-10-30) and, since
// feature 003, no technical caption line, deep dives or technical sections (FR-009).

async function open(page, hash) {
  await page.goto(fileUrl(hash));
  await page.waitForFunction(() => window.__stage !== undefined);
}

test('every visit shows one plain layer, with no audience switch and no technical depth', async ({ page }) => {
  await open(page, '#/mlo/3?notes&test');
  await expect(page.locator('#audience')).toHaveCount(0);
  await expect(page.getByRole('radio', { name: /Leadership|Technical/ })).toHaveCount(0);
  await expect(page.locator('#caption .caption-headline')).toBeVisible();
  await expect(page.locator('#caption .caption-technical')).toHaveCount(0);
  await expect(page.locator('.bottom-line')).toContainText('Bottom line');
  await expect(page.locator('.deep-dive, .deep-section')).toHaveCount(0);
  // Every key figure shows, with no "Show all figures" toggle.
  await expect(page.locator('.figures-table tbody tr:visible')).toHaveCount(2);
  await expect(page.locator('.show-all-figures')).toHaveCount(0);
});

test('V does nothing, and an old view=leadership link still opens the step', async ({ page }) => {
  await open(page, '#/mlo/3?view=leadership&test');
  const state = await page.evaluate(() => window.__stage.state);
  await page.locator('#stage').click({ force: true });
  await page.keyboard.press('v');
  await expect(page.locator('#progress')).toContainText('Step 3 of 4');
  expect(await page.evaluate(() => window.__stage.state)).toBe(state);
});
