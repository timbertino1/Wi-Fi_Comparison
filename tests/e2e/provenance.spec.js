import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fileUrl } from './helpers.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, 'content', f), 'utf8'));
const claims = read('claims.json').claims;
const references = read('references.json').references;
const featureTabs = fs.readdirSync(path.join(root, 'content', 'tabs')).map((f) => read(`tabs/${f}`)).filter((t) => t.kind === 'feature');

for (const tab of featureTabs) {
  test(`provenance: every citation and figure on ${tab.id} opens its source`, async ({ page }) => {
    test.setTimeout(90000);
    await page.goto(fileUrl(`#/${tab.id}/1?view=technical`));
    const triggers = [];
    for (let b = 1; b <= tab.beats.length; b++) {
      await page.goto(fileUrl(`#/${tab.id}/${b}?view=technical`));
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
      await page.goto(fileUrl(`#/${tab.id}/${b}?view=technical`));
      await page.locator(`[data-claim="${id}"]`).first().click();
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

test('Leadership view shows the short form with a "How we know this" expander', async ({ page }) => {
  await page.goto(fileUrl('#/bandwidth-poe/2?view=leadership'));
  await page.locator('#story .cite').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.prov-short')).toContainText('Source:');
  await expect(dialog.locator('details.prov-more')).not.toHaveAttribute('open', '');
  await dialog.getByText('How we know this', { exact: true }).last().click();
  await expect(dialog.locator('details.prov-more')).toHaveAttribute('open', '');
});

test('derivation inputs link to their own claims, and the register link highlights the claim', async ({ page }) => {
  await page.goto(fileUrl('#/bandwidth-poe/2?view=technical'));
  await page.locator('.figures-table td[data-gen="wifi7"] .figure-value').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.prov-input')).toHaveCount(6);
  await dialog.locator('.prov-input').first().click();
  await expect(page.getByRole('dialog')).toContainText('maximum spatial streams');
  await page.getByRole('dialog').getByRole('link', { name: 'In the claims register' }).click();
  await expect(page.locator('#tab-references')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#claim-eht-max-nss')).toHaveClass(/is-highlighted/);
});

test('References tab lists the source policy, every reference, the register and the glossary', async ({ page }) => {
  await page.goto(fileUrl('#/references'));
  await expect(page.locator('#source-policy')).toContainText('Never cited');
  await expect(page.locator('#reference-list .ref-item')).toHaveCount(references.length);
  await expect(page.locator('#claims-register tbody tr')).toHaveCount(claims.length);
  await page.locator('#claims-register select').selectOption('mlo');
  const visible = await page.locator('#claims-register tbody tr:visible').count();
  expect(visible).toBeGreaterThan(0);
  expect(visible).toBeLessThan(claims.length);
  await expect(page.locator('#glossary dt').first()).toBeVisible();
  await page.goto(fileUrl('#/references?ref=fcc-20-51'));
  await expect(page.locator('#ref-fcc-20-51')).toHaveClass(/is-highlighted/);
});
