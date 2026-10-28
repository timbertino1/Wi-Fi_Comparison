import { test, expect } from '@playwright/test';
import { fileUrl } from './helpers.js';

// Frame-time sampling is meaningful only on a real GPU. Locally the tests ask Chromium to use the
// machine's GPU and run one at a time; CI runners have no GPU, so there the numbers are logged rather
// than enforced (quickstart V12 covers the manual check on target hardware).
const enforce = !process.env.CI;

test.use({ launchOptions: { args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=default'] } });
test.describe.configure({ mode: 'serial' });
const BUSIEST = [['overview', 2], ['mlo', 3], ['density', 3], ['latency', 3], ['twt', 3], ['bandwidth-poe', 3]];

test.describe('performance', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Measured in Chromium only');

  test('first beat text is visible within 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto(fileUrl());
    await page.locator('#caption .caption-headline').waitFor();
    expect(Date.now() - start).toBeLessThan(3000);
  });

  for (const [id, beat] of BUSIEST) {
    test(`frame times: ${id}`, async ({ page }) => {
      await page.goto(fileUrl(`#/${id}/${beat}`));
      await page.waitForTimeout(1500);
      const median = await page.evaluate(() => new Promise((resolve) => {
        const samples = [];
        let last = performance.now();
        const end = last + 5000;
        function tick(now) {
          samples.push(now - last);
          last = now;
          if (now < end) requestAnimationFrame(tick);
          else resolve(samples.sort((a, b) => a - b)[Math.floor(samples.length / 2)]);
        }
        requestAnimationFrame(tick);
      }));
      console.log(`${id}: median frame ${median.toFixed(1)} ms`);
      if (enforce) expect(median).toBeLessThanOrEqual(16.7 * 1.25);
    });
  }
});
