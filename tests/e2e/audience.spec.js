import { test, expect } from '@playwright/test';
import { fileUrl } from './helpers.js';

async function open(page, hash) {
  await page.goto(fileUrl(hash));
  await page.waitForFunction(() => window.__stage !== undefined);
}

test('fresh visit opens in Leadership view with Bottom lines and headline figures', async ({ page }) => {
  await open(page, '#/mlo/3?notes&test');
  await expect(page.locator('html')).toHaveAttribute('data-view', 'leadership');
  await expect(page.getByRole('radio', { name: 'Leadership' })).toBeChecked();
  await expect(page.locator('.bottom-line')).toContainText('Bottom line');
  await expect(page.locator('.deep-dive')).not.toHaveAttribute('open', '');
  await expect(page.locator('[data-section="mlo-modes"]')).not.toHaveAttribute('open', '');
  // Bandwidth tab: one non-headline figure hidden until "Show all figures".
  await open(page, '#/bandwidth-poe/1?notes&test');
  await expect(page.locator('.figures-table tbody tr:visible')).toHaveCount(2);
  await page.getByRole('button', { name: /Show all figures/ }).click();
  await expect(page.locator('.figures-table tbody tr:visible')).toHaveCount(3);
  await expect(page.getByRole('button', { name: /headline figures only/ })).toHaveAttribute('aria-expanded', 'true');
});

test('V and the Audience switch change depth without moving the story', async ({ page }) => {
  await open(page, '#/mlo/3?test');
  const state = await page.evaluate(() => window.__stage.state);
  await page.locator('#stage').click({ force: true });
  await page.keyboard.press('v');
  await expect(page.locator('html')).toHaveAttribute('data-view', 'technical');
  await expect(page.locator('.deep-dive')).toHaveAttribute('open', '');
  await expect(page.locator('[data-section="mlo-modes"]')).toHaveAttribute('open', '');
  await expect(page.locator('#progress')).toContainText('Step 3 of 5');
  expect(await page.evaluate(() => window.__stage.state)).toBe(state);
  await expect.poll(() => page.evaluate(() => location.hash)).toContain('view=technical');
  await expect(page.locator('#announcer')).toHaveText('Technical view');
  await page.getByRole('radio', { name: 'Leadership' }).check({ force: true });
  await expect(page.locator('html')).toHaveAttribute('data-view', 'leadership');
});

test('the URL view wins over the stored preference, and the choice persists', async ({ page }) => {
  await open(page, '#/security/2?view=technical&test');
  await expect(page.locator('html')).toHaveAttribute('data-view', 'technical');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-view', 'technical');
  await open(page, '#/security/2?test');
  await expect(page.locator('html')).toHaveAttribute('data-view', 'technical');
});
