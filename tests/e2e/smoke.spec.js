import { test, expect } from '@playwright/test';
import { fileUrl, guardOffline, collectConsoleErrors, trackCspViolations } from './helpers.js';

test('opens from file:// offline with no errors or CSP violations', async ({ page }) => {
  const blocked = await guardOffline(page);
  const errors = collectConsoleErrors(page);
  const csp = await trackCspViolations(page);
  await page.goto(fileUrl());
  await expect(page.locator('.brand-title')).toHaveText('Wi-Fi 7 Explained');
  await expect(page.locator('#stage')).toBeVisible();
  expect(blocked()).toEqual([]);
  expect(errors()).toEqual([]);
  expect(await csp()).toEqual([]);
});
