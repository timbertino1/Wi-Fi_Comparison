import { test, expect } from '@playwright/test';
import { fileUrl, guardOffline, collectConsoleErrors, gotoTab } from './helpers.js';

const TAB_COUNT = 11;

test.describe('navigation (US1)', () => {
  test('Overview loads with all tabs; Next visits every tab in order', async ({ page }) => {
    const blocked = await guardOffline(page);
    const errors = collectConsoleErrors(page);
    await page.goto(fileUrl());
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(TAB_COUNT);
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#progress')).toContainText(`Tab 1 of ${TAB_COUNT}`);

    for (let i = 2; i <= TAB_COUNT; i++) {
      await page.locator('#next').click();
      await expect(tabs.nth(i - 1)).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('#progress')).toContainText(`Tab ${i} of ${TAB_COUNT}`);
    }
    await expect(page.locator('#next')).toHaveText('Back to Overview');
    await page.locator('#next').click();
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');

    expect(blocked()).toEqual([]);
    expect(errors()).toEqual([]);
  });

  test('tablist keyboard: arrows, Home and End move and activate tabs', async ({ page }) => {
    await page.goto(fileUrl());
    const tabs = page.getByRole('tab');
    await tabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.nth(1)).toBeFocused();
    await page.keyboard.press('End');
    await expect(tabs.nth(TAB_COUNT - 1)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Home');
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowLeft');
    await expect(tabs.nth(TAB_COUNT - 1)).toHaveAttribute('aria-selected', 'true');
    // Only the selected tab is in the tab order.
    await expect(page.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);
  });

  test('deep links open tabs and beats directly; out-of-range beats clamp', async ({ page }) => {
    await gotoTab(page, 'mlo');
    await expect(page.locator('#tab-mlo')).toHaveAttribute('aria-selected', 'true');
    await gotoTab(page, 'overview', 3);
    await expect(page.locator('#progress')).toContainText('Step 3 of 4');
    await gotoTab(page, 'overview', 99);
    await expect(page.locator('#progress')).toContainText('Step 4 of 4');
  });

  test('unknown tab shows the Overview with a notice', async ({ page }) => {
    await page.goto(fileUrl('#/not-a-tab'));
    await expect(page.locator('#tab-overview')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('was not found')).toBeVisible();
  });

  test('browser Back returns to the previous tab, not the previous beat', async ({ page }) => {
    await page.goto(fileUrl());
    await page.keyboard.press('ArrowRight'); // beat 2 of overview
    await expect(page.locator('#progress')).toContainText('Step 2');
    await page.getByRole('tab', { name: /Multi-Link/ }).click();
    await expect(page.locator('#tab-mlo')).toHaveAttribute('aria-selected', 'true');
    await page.goBack();
    await expect(page.locator('#tab-overview')).toHaveAttribute('aria-selected', 'true');
  });

  test('any tab is reachable from any other in one click on the tablist', async ({ page }) => {
    await gotoTab(page, 'latency');
    for (const name of [/Overview|Why Wi-Fi 7/, /References/, /6 GHz/]) {
      await page.getByRole('tab', { name }).click();
      await expect(page.getByRole('tab', { name })).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('overview final beat previews every tab', async ({ page }) => {
    await gotoTab(page, 'overview', 4);
    await expect(page.locator('.preview-list li')).toHaveCount(TAB_COUNT - 1);
    await page.getByRole('button', { name: /Start the story/ }).click();
    await expect(page.locator('#tab-spectrum')).toHaveAttribute('aria-selected', 'true');
  });
});
