import { test, expect } from '@playwright/test';
import { fileUrl, guardOffline, collectConsoleErrors, gotoTab, talkChapters } from './helpers.js';

const chapters = talkChapters();
const CHAPTER_COUNT = chapters.length;

test.describe('chapter navigation', () => {
  test('the explainer opens on the first chapter offline, with no errors', async ({ page }) => {
    const blocked = await guardOffline(page);
    const errors = collectConsoleErrors(page);
    await page.goto(fileUrl());
    await expect(page.locator('#progress')).toContainText(`Chapter 1 of ${CHAPTER_COUNT} · Step 1 of ${chapters[0].beats.length}`);
    await expect(page.locator('#chapter-list a')).toHaveCount(CHAPTER_COUNT + 1);
    await expect(page.locator(`#chapter-list a[data-chapter="${chapters[0].id}"]`)).toHaveAttribute('aria-current', 'step');
    expect(blocked()).toEqual([]);
    expect(errors()).toEqual([]);
  });

  test('chapter menu by keyboard: M opens it on the current chapter; Escape closes it', async ({ page }) => {
    await gotoTab(page, 'mlo', 2);
    await page.keyboard.press('m');
    await expect(page.locator('#chapter-menu')).toBeVisible();
    await expect(page.locator('#chapter-menu-toggle')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#chapter-list a[data-chapter="mlo"]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#chapter-menu')).toBeHidden();
    // Escape closed the menu without moving the story.
    await expect(page.locator('#progress')).toContainText('Step 2 of 5');
  });

  test('deep links open chapters and steps directly; out-of-range steps clamp', async ({ page }) => {
    await gotoTab(page, 'mlo');
    await expect(page.locator('#progress')).toContainText('Multi-Link');
    await gotoTab(page, 'overview', 3);
    await expect(page.locator('#progress')).toContainText('Step 3 of 4');
    await gotoTab(page, 'overview', 99);
    await expect(page.locator('#progress')).toContainText('Step 4 of 4');
  });

  test('unknown chapter shows the first chapter with a notice', async ({ page }) => {
    await page.goto(fileUrl('#/not-a-tab'));
    await expect(page.locator('#chapter-list a[data-chapter="overview"]')).toHaveAttribute('aria-current', 'step');
    await expect(page.getByText('was not found')).toBeVisible();
  });

  test('browser Back returns to the previous chapter, not the previous step', async ({ page }) => {
    await page.goto(fileUrl());
    await page.keyboard.press('ArrowRight'); // step 2 of the overview
    await expect(page.locator('#progress')).toContainText('Step 2');
    await page.locator('#chapter-menu-toggle').click();
    await page.locator('#chapter-list a[data-chapter="mlo"]').click();
    await expect(page.locator('#progress')).toContainText('Multi-Link');
    await page.goBack();
    await expect(page.locator('#chapter-list a[data-chapter="overview"]')).toHaveAttribute('aria-current', 'step');
  });

  test('any chapter, or the references, is reachable in two actions (SC-004)', async ({ page }) => {
    await gotoTab(page, 'latency');
    for (const id of ['overview', 'references', 'spectrum']) {
      await page.locator('#chapter-menu-toggle').click();
      await page.locator(`#chapter-list a[data-chapter="${id}"]`).click();
      await expect(page.locator(`#chapter-list a[data-chapter="${id}"]`)).toHaveAttribute('aria-current', 'step');
    }
  });

  test('the overview final step previews every chapter in its notes', async ({ page }) => {
    await page.goto(fileUrl('#/overview/4?notes'));
    await expect(page.locator('#notes .preview-list li')).toHaveCount(CHAPTER_COUNT);
    await page.getByRole('button', { name: /Start the story/ }).click();
    await expect(page.locator('#chapter-list a[data-chapter="spectrum"]')).toHaveAttribute('aria-current', 'step');
  });
});
