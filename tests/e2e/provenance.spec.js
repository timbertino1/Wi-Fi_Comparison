import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fileUrl } from './helpers.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, 'content', f), 'utf8'));
const claims = read('claims.json').claims;
const references = read('references.json').references.filter((r) => !r.retired);
const featureTabs = fs.readdirSync(path.join(root, 'content', 'tabs')).map((f) => read(`tabs/${f}`)).filter((t) => t.kind === 'feature');

for (const tab of featureTabs) {
  test(`provenance: every citation and figure on ${tab.id} opens its source`, async ({ page }) => {
    // Visits every step of the chapter; under parallel software-WebGL load that can exceed 90 s.
    test.setTimeout(180000);
    await page.goto(fileUrl(`#/${tab.id}/1?view=technical&notes`));
    const triggers = [];
    for (let b = 1; b <= tab.beats.length; b++) {
      await page.goto(fileUrl(`#/${tab.id}/${b}?view=technical&notes`));
      for (const t of await page.locator('#story .cite, #deep .cite, .figures-table .figure-value').all()) {
        triggers.push([b, await t.getAttribute('data-claim')]);
      }
    }
    expect(triggers.length).toBeGreaterThan(0);
    // Open a sample of distinct claims (one per claim id) from this tab.
    const seen = new Set();
    for (const [b, id] of triggers) {
      if (seen.has(id)) continue;
      seen.add(id);
      await page.goto(fileUrl(`#/${tab.id}/${b}?view=technical&notes`));
      const trigger = page.locator(`#notes [data-claim="${id}"]`).first();
      // Scene-switching sections (MLO modes) start closed; open them without switching the scene.
      await trigger.evaluate((el) => { const d = el.closest('details'); if (d) d.open = true; });
      await trigger.click();
      const dialog = page.getByRole('dialog');
      const claim = claims.find((c) => c.id === id);
      await expect(dialog).toContainText(claim.statement);
      await expect(dialog.locator('.badge').first()).toBeVisible();
      await expect(dialog.locator('.prov-where').first()).toContainText(claim.sources[0].locator);
      await expect(dialog.getByText(/Tier [12]:/).first()).toBeVisible();
      const link = dialog.locator('a.prov-source-title').first();
      await expect(link).toHaveAttribute('rel', /noopener/);
      await expect(link).toHaveAttribute('rel', /noreferrer/);
      if (claim.derivation) await expect(dialog.getByRole('heading', { name: 'How it was calculated' })).toBeVisible();
      await expect(dialog).toContainText(/Verified|Not yet verified/);
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
    }
  });
}

test('derivation inputs link to their own claims, and the register link highlights the claim', async ({ page }) => {
  await page.goto(fileUrl('#/spectrum/3?view=technical&notes'));
  await page.locator('.figures-table .figure-value[data-claim="us-6ghz-channels-320"]').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.prov-input')).toHaveCount(3);
  await dialog.locator('.prov-input').first().click();
  await expect(page.getByRole('dialog')).toContainText('Lower edge of the US 6 GHz');
  await page.getByRole('dialog').getByRole('link', { name: 'In the claims register' }).click();
  await expect(page.locator('#chapter-list a[data-chapter="references"]')).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('#claim-us-6ghz-band-start')).toHaveClass(/is-highlighted/);
});

test('References tab lists the source policy, every reference, the register and the glossary', async ({ page }) => {
  await page.goto(fileUrl('#/references'));
  await expect(page.locator('#source-policy')).toContainText('Never cited');
  await expect(page.locator('#reference-list .ref-item')).toHaveCount(references.length);
  await expect(page.locator('#claims-register tbody tr')).toHaveCount(claims.length);
  await page.locator('#claims-register .ref-filter-option[data-filter="mlo"]').click();
  const visible = await page.locator('#claims-register tbody tr:visible').count();
  expect(visible).toBeGreaterThan(0);
  expect(visible).toBeLessThan(claims.length);
  await expect(page.locator('#glossary dt').first()).toBeVisible();
  await page.goto(fileUrl('#/references?ref=fcc-20-51'));
  await expect(page.locator('#ref-fcc-20-51')).toHaveClass(/is-highlighted/);
});
