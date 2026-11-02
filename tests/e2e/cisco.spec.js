// Feature 003 FR-017: Cisco platform notes appear in the side panel, and nothing the audience sees
// on a step names a hardware model or software release (source records may quote them).
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fileUrl, plainMarkup, talkChapters } from './helpers.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const modelPatterns = fs.readFileSync(path.join(root, 'tests', 'content', 'model-patterns.txt'), 'utf8')
  .split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => new RegExp(l, 'i'));

test.use({ reducedMotion: 'reduce' });

for (const tab of talkChapters()) {
  test(`no model names on screen or in the notes: ${tab.id}`, async ({ page }) => {
    for (let step = 1; step <= tab.beats.length; step++) {
      await page.goto(fileUrl(`#/${tab.id}/${step}?notes&test`));
      await page.waitForFunction(() => window.__stage?.phase === 'settled');
      const beat = tab.beats[step - 1];
      if (beat.cisco) {
        const note = page.locator('#notes .cisco-note');
        await expect(note).toContainText(`On Cisco networks: ${plainMarkup(beat.cisco.feature)}`);
        await expect(note.locator('[data-claim]').first()).toBeAttached();
      } else {
        await expect(page.locator('#notes .cisco-note')).toHaveCount(0);
      }
      const text = await page.evaluate(() => [document.getElementById('slide'), document.getElementById('notes')].map((el) => el?.innerText ?? '').join('\n'));
      for (const re of modelPatterns) expect(text.match(re)?.[0] ?? null, `${tab.id}/${step}`).toBeNull();
    }
  });
}
