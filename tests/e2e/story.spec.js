import { test, expect } from '@playwright/test';
import { fileUrl, collectConsoleErrors, plainMarkup } from './helpers.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const tabsDir = path.join(root, 'content', 'tabs');
const storyTabs = fs.readdirSync(tabsDir)
  .map((f) => JSON.parse(fs.readFileSync(path.join(tabsDir, f), 'utf8')))
  .filter((t) => !t.draft && t.beats.length);

async function open(page, id, beat = 1, { notes = false } = {}) {
  await page.goto(fileUrl(`#/${id}/${beat}?${notes ? "notes&" : ""}test`));
  await page.waitForFunction(() => window.__stage !== undefined);
}

async function expectBeat(page, tab, index) {
  const beat = tab.beats[index];
  await expect(page.locator('#story h3')).toHaveText(plainMarkup(beat.heading));
  await expect(page.locator('#caption .caption-headline')).toHaveText(plainMarkup(beat.caption.headline));
  await expect(page.locator('#progress')).toContainText(`Step ${index + 1} of ${tab.beats.length}`);
  await expect.poll(() => page.evaluate(() => window.__stage.state)).toBe(beat.sceneState);
}

for (const tab of storyTabs) {
  test.describe(`story: ${tab.id}`, () => {
    test('step forward/back and replay keep caption, text and scene in sync', async ({ page }) => {
      const errors = collectConsoleErrors(page);
      await open(page, tab.id);
      await expectBeat(page, tab, 0);
      await page.locator('#step-forward').click();
      await expectBeat(page, tab, 1);
      // Two-step chapters (the closing recap) have no third step to visit.
      if (tab.beats.length >= 3) {
        await page.locator('#stage').click({ force: true });
        await page.keyboard.press('ArrowRight');
        await expectBeat(page, tab, 2);
        await page.keyboard.press('PageUp');
        await expectBeat(page, tab, 1);
      }
      await page.keyboard.press('r');
      await expectBeat(page, tab, 0);
      expect(errors()).toEqual([]);
    });

    test('play advances beats automatically and pause stops', async ({ page }) => {
      // Software WebGL in parallel WebKit workers can drop to a few frames a second, so steps settle slowly.
      test.setTimeout(60000);
      await open(page, tab.id);
      await page.evaluate(() => { window.__dwellMs = 300; });
      await page.locator('#play').click();
      await expect(page.locator('#play')).toHaveAttribute('aria-pressed', 'true');
      // Auto-play advances on its own; it may pass step 3 before we look, so check it got at least that
      // far (or to the last step of a shorter chapter, where auto-play may already have stopped).
      await expect.poll(() => page.evaluate(() => window.__stage.beat), { timeout: 25000 }).toBeGreaterThanOrEqual(Math.min(3, tab.beats.length));
      if ((await page.locator('#play').getAttribute('aria-pressed')) === 'true') await page.keyboard.press('k');
      await expect(page.locator('#play')).toHaveAttribute('aria-pressed', 'false');
      const stopped = await page.locator('#progress').textContent();
      await page.waitForTimeout(900);
      await expect(page.locator('#progress')).toHaveText(stopped);
    });

    test('scene description updates with each beat', async ({ page }) => {
      await open(page, tab.id);
      await page.locator('#step-forward').click();
      const words = tab.beats[1].sceneDescription.split(' ').slice(0, 6).join(' ');
      await expect(page.locator('#scene-description')).toContainText(words);
    });
  });
}

test('glossary popover in the notes opens on a term and closes on Escape', async ({ page }) => {
  await open(page, 'mlo', 1, { notes: true });
  const term = page.locator('#story .term').first();
  await term.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('h4')).not.toBeEmpty();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(term).toBeFocused();
});

test('Under the hood is open on beats with technical depth, and can be closed', async ({ page }) => {
  await open(page, 'mlo', 3, { notes: true });
  const details = page.locator('.deep-dive');
  await expect(details).toHaveCount(1);
  await expect(details).toHaveAttribute('open', '');
  await expect(details.locator('.deep-body')).toContainText('multi-link');
  await details.locator('summary').click();
  await expect(details).not.toHaveAttribute('open', '');
});

test('MLO modes section changes the scene state and restores it when closed', async ({ page }) => {
  await open(page, 'mlo', 2, { notes: true });
  const section = page.locator('[data-section="mlo-modes"]');
  await section.locator('summary').click();
  await expect.poll(() => page.evaluate(() => window.__stage.state)).toBe('modes-compare');
  await section.locator('summary').click();
  await expect.poll(() => page.evaluate(() => window.__stage.state)).toBe('what-is-mlo');
});
