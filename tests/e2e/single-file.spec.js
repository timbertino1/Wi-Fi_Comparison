import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { collectConsoleErrors, trackCspViolations, talkChapters } from './helpers.js';

// The one-file copy (dist/wifi7-explainer.html) must run on its own: copied alone into an empty
// folder, it loads no other file, breaks no CSP rule, and plays the talk like the full site.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const single = path.join(root, 'dist', 'wifi7-explainer.html');

let copy;
test.beforeAll(() => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wifi7-single-'));
  copy = path.join(dir, 'wifi7-explainer.html');
  fs.copyFileSync(single, copy);
});
const url = (hash) => pathToFileURL(copy).href + hash;

test('the copied file alone loads, plays and crosses chapters with no other requests', async ({ page }) => {
  const csp = await trackCspViolations(page);
  const errors = collectConsoleErrors(page);
  const requests = [];
  page.on('request', (req) => {
    if (!/^(data|blob):/.test(req.url())) requests.push(req.url());
  });
  const [first, second] = talkChapters();
  await page.goto(url(`#/${first.id}/${first.beats.length}?test`));
  await page.waitForFunction(() => window.__stage?.phase === 'settled');
  await expect(page.locator('#caption')).toBeVisible();
  await page.keyboard.press('PageDown');
  await expect.poll(() => page.evaluate(() => location.hash)).toContain(`#/${second.id}/1`);
  await expect(page.locator('#opener')).toBeVisible();
  await page.keyboard.press('PageDown');
  await expect(page.locator('#progress')).toContainText('Step 1 of');
  expect(await csp()).toEqual([]);
  expect(errors()).toEqual([]);
  // Firefox does not report file:// requests; elsewhere the only one is the file itself. Any other
  // file would also be refused by the policy (no 'self') and show up as a violation above.
  for (const r of requests) expect(r.split('#')[0]).toBe(pathToFileURL(copy).href);
});

test('the copied file keeps the strict policy: no self, only hashed inline blocks', () => {
  const html = fs.readFileSync(copy, 'utf8');
  const policy = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  expect(policy).not.toContain("'self'");
  expect(policy).not.toContain('unsafe');
  expect(policy).toMatch(/script-src 'sha256-[A-Za-z0-9+/=]+';/);
  expect(policy).toMatch(/style-src 'sha256-[A-Za-z0-9+/=]+';/);
  expect(html).not.toMatch(/<(link|script)[^>]+(href|src)=/);
});

