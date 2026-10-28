// The slide is always presentation-ready (feature 002): full screen and blanking only. Clicker
// stepping across chapters is covered by talk.spec.js.
import { test, expect } from '@playwright/test';
import { fileUrl } from './helpers.js';

test('F toggles full screen without moving the story', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Headless full screen is reliable only in Chromium');
  await page.goto(fileUrl('#/mlo/2'));
  await page.locator('#stage').click({ force: true });
  await page.keyboard.press('f');
  await expect(page.locator('html')).toHaveAttribute('data-present', '');
  await expect(page.locator('#present-toggle')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.site-header')).toBeHidden();
  await expect(page.locator('#progress')).toContainText('Step 2 of 5');
  await page.keyboard.press('f');
  await expect(page.locator('html')).not.toHaveAttribute('data-present', '');
  await expect(page.locator('#progress')).toContainText('Step 2 of 5');
});

test('the settings menu offers full screen', async ({ page }) => {
  await page.goto(fileUrl('#/mlo/2'));
  await page.locator('#settings-toggle').click();
  await expect(page.locator('#present-toggle')).toBeVisible();
  await expect(page.locator('#present-toggle')).toHaveText('Full screen');
});

test('B and . blank and unblank the screen without moving the story', async ({ page }) => {
  await page.goto(fileUrl('#/twt/3'));
  await page.keyboard.press('b');
  await expect(page.locator('#blank')).toBeVisible();
  await page.keyboard.press('.');
  await expect(page.locator('#blank')).toBeHidden();
  await expect(page.locator('#progress')).toContainText('Step 3 of 5');
});

test('the audience view can be switched on the slide without moving the story', async ({ page }) => {
  await page.goto(fileUrl('#/mlo/3'));
  await page.keyboard.press('v');
  await expect(page.locator('html')).toHaveAttribute('data-view', 'technical');
  await expect(page.locator('#progress')).toContainText('Step 3 of 5');
});
