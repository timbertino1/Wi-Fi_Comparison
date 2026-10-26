import { test, expect } from '@playwright/test';
import { fileUrl } from './helpers.js';

const fontSize = (page) => page.locator('#story p:not(.beat-kicker)').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

test('P toggles presentation mode with larger text, without moving the story', async ({ page }) => {
  await page.goto(fileUrl('#/mlo/2'));
  const normal = await fontSize(page);
  await page.locator('#stage').click({ force: true });
  await page.keyboard.press('p');
  await expect(page.locator('html')).toHaveAttribute('data-present', '');
  await expect(page.locator('#present-toggle')).toHaveAttribute('aria-pressed', 'true');
  expect(await fontSize(page)).toBeGreaterThanOrEqual(normal * 1.4);
  await expect(page.locator('#progress')).toContainText('Step 2 of 5');
  await page.keyboard.press('p');
  await expect(page.locator('html')).not.toHaveAttribute('data-present', '');
  await expect(page.locator('#progress')).toContainText('Step 2 of 5');
});

test('clicker keys move through beats and across tab boundaries', async ({ page }) => {
  await page.goto(fileUrl('#/spectrum/4'));
  await page.locator('#present-toggle').click();
  await page.keyboard.press('PageDown');
  await expect(page.locator('#progress')).toContainText('Tab 2 of 11 · Step 5 of 5');
  await page.keyboard.press('PageDown');
  await expect(page.locator('#tab-mlo')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#progress')).toContainText('Step 1 of 5');
  await page.keyboard.press('PageUp');
  await expect(page.locator('#tab-spectrum')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#progress')).toContainText('Step 5 of 5');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-mlo')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press(' ');
  await expect(page.locator('#progress')).toContainText('Step 2 of 5');
});

test('B blanks and unblanks the screen; Escape exits and keeps the position', async ({ page }) => {
  await page.goto(fileUrl('#/twt/3'));
  await page.locator('#present-toggle').click();
  await page.keyboard.press('b');
  await expect(page.locator('#blank')).toBeVisible();
  await page.keyboard.press('.');
  await expect(page.locator('#blank')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).not.toHaveAttribute('data-present', '');
  await expect(page.locator('#progress')).toContainText('Tab 6 of 11 · Step 3 of 5');
});

test('a shared ?present link offers a Start presenting prompt and keeps the position', async ({ page }) => {
  await page.goto(fileUrl('#/mlo/2?present'));
  const start = page.getByRole('button', { name: 'Start presenting' });
  await expect(start).toBeVisible();
  await start.click();
  await expect(page.locator('html')).toHaveAttribute('data-present', '');
  await expect(page.locator('#progress')).toContainText('Step 2 of 5');
});

test('the audience view can be switched while presenting', async ({ page }) => {
  await page.goto(fileUrl('#/mlo/3'));
  await page.locator('#present-toggle').click();
  await page.keyboard.press('v');
  await expect(page.locator('html')).toHaveAttribute('data-view', 'technical');
  await expect(page.locator('#progress')).toContainText('Step 3 of 5');
});
