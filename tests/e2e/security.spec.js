import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fileUrl, guardOffline, collectConsoleErrors, trackCspViolations } from './helpers.js';
import { start } from './static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const tabs = fs.readdirSync(path.join(root, 'content', 'tabs')).map((f) => JSON.parse(fs.readFileSync(path.join(root, 'content', 'tabs', f), 'utf8')));

let server;
test.beforeAll(async () => {
  server = await start();
});
test.afterAll(async () => {
  await server?.stop();
});

for (const origin of ['file', 'http']) {
  test(`zero CSP violations, network requests and errors on every beat (${origin})`, async ({ page }) => {
    test.setTimeout(120000);
    const base = origin === 'file' ? fileUrl() : server.url;
    const csp = await trackCspViolations(page);
    const errors = collectConsoleErrors(page);
    const external = [];
    if (origin === 'file') {
      const blocked = await guardOffline(page);
      external.push(blocked);
    } else {
      page.on('request', (req) => {
        if (!req.url().startsWith(server.url) && !/^(data|blob):/.test(req.url())) external.push(() => [req.url()]);
      });
    }
    for (const tab of tabs) {
      const beats = Math.max(1, tab.beats.length);
      for (let b = 1; b <= beats; b++) {
        // ?notes opens the step's notes so their markup is exercised too.
        await page.goto(`${base}#/${tab.id}/${b}?notes`);
        await page.waitForSelector(`#chapter-list a[aria-current="step"][data-chapter="${tab.id}"]`, { state: 'attached' });
      }
      // Open technical detail so its markup is exercised too.
      for (const summary of await page.locator('details summary').all()) await summary.click();
      expect(await csp(), `${tab.id}: CSP violations`).toEqual([]);
    }
    expect(external.flatMap((f) => f())).toEqual([]);
    expect(errors()).toEqual([]);
  });
}

test('only app.js is loaded as script, and storage holds only preferences', async ({ page }) => {
  await page.goto(fileUrl('#/overview'));
  const scripts = await page.evaluate(() => [...document.scripts].map((s) => s.getAttribute('src')));
  expect(scripts).toEqual(['app.js']);
  await page.locator('#settings-toggle').click();
  await page.locator('#theme-toggle').click();
  await page.locator('#motion-toggle').click();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toEqual(['wifi7-explainer:prefs']);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('wifi7-explainer:prefs')));
  expect(Object.keys(stored).sort()).toEqual(['motion', 'theme']);
});

test('external links open safely', async ({ page }) => {
  await page.goto(fileUrl('#/references'));
  for (const link of await page.locator('a[target="_blank"]').all()) {
    const rel = await link.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  }
});

test('hosted pages send the hardening headers', async ({ request }) => {
  const res = await request.get(server.url);
  const headers = res.headers();
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('no-referrer');
});
