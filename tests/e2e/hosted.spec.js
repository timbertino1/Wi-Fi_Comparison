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
  await expect(page.locator('#chapter-list a')).toHaveCount(11);
  await page.goto(`${server.url}#/overview/4`);
  await page.locator('#step-forward').click();
  await expect(page.locator('#chapter-list a[data-chapter="spectrum"]')).toHaveAttribute('aria-current', 'step');
  await page.goto(`${server.url}#/mlo/3?gen=wifi5`);
  await expect(page.locator('#progress')).toContainText('Step 3 of 5');
  await expect(page.getByRole('radiogroup', { name: 'Compare Wi-Fi 7 with' }).getByRole('radio', { checked: true })).toHaveValue('wifi5');
  await page.locator('#step-forward').click();
  await expect(page.locator('#progress')).toContainText('Step 4 of 5');
  await page.goto(`${server.url}#/references`);
  await expect(page.locator('#reference-list')).toBeVisible();
  expect(external).toEqual([]);
});
