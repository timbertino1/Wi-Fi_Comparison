import { test, expect } from '@playwright/test';
import { start } from './static-server.mjs';

// FR-032: the same dist/ folder works unchanged on a static web host.
let server;
test.beforeAll(async () => {
  server = await start();
});
test.afterAll(async () => {
  await server?.stop();
});

test('navigation, deep links and the story work over HTTP with hardening headers', async ({ page }) => {
  const external = [];
  page.on('request', (req) => {
    if (!req.url().startsWith(server.url) && !/^(data|blob):/.test(req.url())) external.push(req.url());
  });
  await page.goto(server.url);
  await expect(page.locator('#chapter-list a')).toHaveCount(6);
  await page.goto(`${server.url}#/overview/4`);
  await page.locator('#step-forward').click();
  await expect(page.locator('#chapter-list a[data-chapter="spectrum"]')).toHaveAttribute('aria-current', 'step');
  await page.goto(`${server.url}#/mlo/2`);
  await expect(page.locator('#progress')).toContainText('Step 2 of 4');
  await page.locator('#step-forward').click();
  await expect(page.locator('#progress')).toContainText('Step 3 of 4');
  // The sources page, styled from references.css under the hosting CSP header (FR-022).
  await page.goto(`${server.url}references.html`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Wi-Fi 7 Explained: Sources');
  await expect.poll(() => page.locator('.claim').first().evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe('solid');
  expect(external).toEqual([]);
});
