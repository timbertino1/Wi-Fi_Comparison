// FR-021: a closed-by-default Notes drawer with the step's full text, closed on every advance.
import { test, expect } from '@playwright/test';
import { fileUrl, plainMarkup, contentTabs } from './helpers.js';

const mlo = contentTabs().find((t) => t.id === 'mlo');

test.use({ reducedMotion: 'reduce' });

test('N opens the drawer with the step text; Escape closes it; Next closes it', async ({ page }) => {
  await page.goto(fileUrl('#/mlo/3?test'));
  await page.waitForFunction(() => window.__stage !== undefined);
  const notes = page.locator('#notes');
  await expect(notes).toBeHidden();

  await page.keyboard.press('n');
  await expect(notes).toBeVisible();
  await expect(notes.locator('#story h3')).toHaveText(plainMarkup(mlo.beats[2].heading));
  await expect(notes.locator('.bottom-line')).toContainText(plainMarkup(mlo.beats[2].bottomLine));
  await expect(notes.locator('#notes-description')).toHaveText(plainMarkup(mlo.beats[2].sceneDescription));
  await expect(notes.locator('#figures')).not.toBeEmpty();
  await expect(notes.locator('#scenario')).not.toBeEmpty();

  await page.keyboard.press('Escape');
  await expect(notes).toBeHidden();

  await page.locator('#notes-toggle').click();
  await expect(notes).toBeVisible();
  // The first Next closes the drawer without moving; the step stays on screen.
  await page.keyboard.press('PageDown');
  await expect(notes).toBeHidden();
  expect(await page.evaluate(() => window.__stage.beat)).toBe(3);
  await page.keyboard.press('PageDown');
  await expect.poll(() => page.evaluate(() => window.__stage.beat)).toBe(4);
});

test('?notes opens the drawer at that step', async ({ page }) => {
  await page.goto(fileUrl('#/mlo/2?notes&test'));
  await expect(page.locator('#notes')).toBeVisible();
  await expect(page.locator('#notes #story h3')).toHaveText(plainMarkup(mlo.beats[1].heading));
});
