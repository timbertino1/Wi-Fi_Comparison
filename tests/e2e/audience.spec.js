import { test, expect } from '@playwright/test';
import { fileUrl } from './helpers.js';

// The talk always shows the full technical layer; there is no Leadership/Technical switch
// (FR-020, changed 2026-10-30).

async function open(page, hash) {
  await page.goto(fileUrl(hash));
  await page.waitForFunction(() => window.__stage !== undefined);
}

test('every visit shows the technical layer, with no audience switch', async ({ page }) => {
  await open(page, '#/mlo/3?notes&test');
  await expect(page.locator('html')).toHaveAttribute('data-view', 'technical');
  await expect(page.locator('#audience')).toHaveCount(0);
  await expect(page.getByRole('radio', { name: /Leadership|Technical/ })).toHaveCount(0);
  await expect(page.locator('#caption .caption-technical')).toBeVisible();
  await expect(page.locator('.bottom-line')).toContainText('Bottom line');
  await expect(page.locator('.deep-dive')).toHaveAttribute('open', '');
  // The MLO modes section switches the animation, so it waits for the presenter to open it.
  await expect(page.locator('[data-section="mlo-modes"]')).not.toHaveAttribute('open', '');
  // Every key figure shows, with no "Show all figures" toggle.
  await open(page, '#/density/1?notes&test');
  await expect(page.locator('.figures-table tbody tr:visible')).toHaveCount(3);
  await expect(page.locator('.show-all-figures')).toHaveCount(0);
});

test('V does nothing, and an old view=leadership link still shows the technical layer', async ({ page }) => {
  await open(page, '#/mlo/3?view=leadership&test');
  await expect(page.locator('html')).toHaveAttribute('data-view', 'technical');
  const state = await page.evaluate(() => window.__stage.state);
  await page.locator('#stage').click({ force: true });
  await page.keyboard.press('v');
  await expect(page.locator('html')).toHaveAttribute('data-view', 'technical');
  await expect(page.locator('#progress')).toContainText('Step 3 of 5');
  expect(await page.evaluate(() => window.__stage.state)).toBe(state);
});
