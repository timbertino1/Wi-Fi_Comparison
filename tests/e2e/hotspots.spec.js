// FR-005a callouts and FR-016–FR-018 hotspots, on the opening chapter (first content to use them).
import { test, expect } from '@playwright/test';
import { fileUrl, hasWebGL } from './helpers.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const overview = JSON.parse(fs.readFileSync(path.join(root, 'content', 'tabs', '01-overview.json'), 'utf8'));
const glossary = JSON.parse(fs.readFileSync(path.join(root, 'content', 'glossary.json'), 'utf8')).terms;
const termName = (id) => glossary.find((t) => t.id === id).term;

async function open(page, step, query = '') {
  await page.goto(fileUrl(`#/overview/${step}?test${query}`));
  await page.waitForFunction(() => window.__stage?.phase === 'settled');
}

test('a step with a callout shows its title and points; the next step without one hides it', async ({ page }) => {
  await open(page, 2);
  const callout = page.locator('#callout');
  await expect(callout).toBeVisible();
  await expect(callout.locator('.callout-title')).toHaveText(overview.beats[1].callout.title);
  await expect(callout.locator('li')).toHaveCount(overview.beats[1].callout.points.length);
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => window.__stage?.beat === 3);
  await expect(callout).toBeHidden();
  expect(await page.evaluate(() => window.__stage.calloutShown)).toBe(false);
});

test('callout waits for its moment with motion on and shows at once with reduced motion', async ({ browser }) => {
  for (const [reducedMotion, expectImmediate] of [['no-preference', false], ['reduce', true]]) {
    const page = await (await browser.newContext({ reducedMotion })).newPage();
    await open(page, 1);
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => window.__stage?.beat === 2);
    expect(await page.evaluate(() => window.__stage.calloutShown), reducedMotion).toBe(expectImmediate);
    await expect.poll(() => page.evaluate(() => window.__stage.calloutShown), { timeout: 8000 }).toBe(true);
    await page.context().close();
  }
});

test.describe('hotspots', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!(await hasWebGL(page)), 'Hotspots attach to the 3D scene; without WebGL there are none yet');
  });

  test('markers match the step; Enter opens a card labelled by the term; Escape returns focus', async ({ page }) => {
    await open(page, 1);
    const expected = overview.beats[0].hotspots.filter((h) => (h.depth ?? 'all') === 'all').map((h) => h.id);
    await expect.poll(() => page.evaluate(() => window.__stage.hotspots)).toEqual(expected);
    const first = overview.beats[0].hotspots[0];
    await page.keyboard.press('h');
    await expect(page.locator(`.hotspot-marker[data-hotspot="${first.id}"]`)).toBeFocused();
    await page.keyboard.press('Enter');
    const card = page.getByRole('dialog', { name: termName(first.term) });
    await expect(card).toBeVisible();
    await expect(page.locator(`.hotspot-marker[data-hotspot="${first.id}"]`)).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(card).toBeHidden();
    await expect(page.locator(`.hotspot-marker[data-hotspot="${first.id}"]`)).toBeFocused();
  });

  test('Next with a card open closes it without advancing, by button and by clicker key', async ({ page }) => {
    await open(page, 1);
    const pump = page.locator('.hotspot-marker[data-hotspot="infusion-pump"]');
    for (const press of [() => page.locator('#step-forward').click(), () => page.keyboard.press('PageDown')]) {
      await pump.click();
      await expect(page.locator('#hotspot-card')).toBeVisible();
      await press();
      await expect(page.locator('#hotspot-card')).toBeHidden();
      expect(await page.evaluate(() => window.__stage.beat)).toBe(1);
    }
  });

  test('the always-present card does not stop Escape and Next from closing the Notes drawer first', async ({ page }) => {
    await open(page, 1);
    await page.keyboard.press('n');
    await expect(page.locator('#notes')).toBeVisible();
    await page.keyboard.press('PageDown');
    await expect(page.locator('#notes')).toBeHidden();
    expect(await page.evaluate(() => window.__stage.beat)).toBe(1);
  });

  test('technical lines show only in Technical view, and the card never covers the caption', async ({ page }) => {
    await open(page, 1);
    await page.locator('.hotspot-marker[data-hotspot="voice-badge"]').click();
    await expect(page.locator('#hotspot-card .hotspot-technical')).toHaveCount(0);
    await open(page, 1, '&view=technical');
    await page.locator('.hotspot-marker[data-hotspot="voice-badge"]').click();
    await expect(page.locator('#hotspot-card .hotspot-technical')).toBeVisible();
    for (const id of ['access-point', 'infusion-pump', 'patient-monitor']) {
      await page.keyboard.press('Escape'); // an open card may cover the next marker
      await page.locator(`.hotspot-marker[data-hotspot="${id}"]`).click();
      const [card, caption] = await Promise.all([page.locator('#hotspot-card').boundingBox(), page.locator('#caption').boundingBox()]);
      expect(card.y, id).toBeGreaterThanOrEqual(caption.y + caption.height);
    }
  });
});
