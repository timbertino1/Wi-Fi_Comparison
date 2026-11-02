# Quickstart: Validate the Refocused Talk

**Prerequisites**: Node ≥ 20, `npm ci`, Playwright Chromium installed (`npx playwright install chromium`).

## 1. Content and sources

```sh
node scripts/validate-content.mjs --release   # expect 0 errors, 0 warnings
npm run provenance                            # docs/provenance-report.md
```

Expected: every claim used has an allowed source ([sources contract](./contracts/sources-and-claims.md));
`technical` claims have a Tier 1 source; no model-number pattern matches; no depth fields.

## 2. Unit tests and talk track

```sh
npm test                                      # validate + talk-track --check
npm run talk-track                            # docs/talk-track.md
```

Expected: 7 chapters plus References; no "Technical depth" lines.

## 3. Build and browser tests (Chromium only)

```sh
npm run build
npx playwright test --project=chromium --workers=2
```

Expected: all pass, including chapter count 8 in the menu (7 + References), comparison options
limited to Wi-Fi 6 / 6E / 7, and layout overlap checks.

## 4. Manual checks

1. Open `dist/wifi7-explainer.html` in Chrome; click through with the arrow keys. Count chapters and
   steps against the [chapter lineup](./contracts/chapter-lineup.md) (≤ 22 steps).
2. In each feature chapter, open the side panel: the "Since Wi-Fi 6" rows match the comparison
   step, and each citation opens its provenance.
3. Open every Cisco link in References in a private window: each loads without a login.
4. Rehearse with a stopwatch: 20–25 minutes (SC-002). Ask a non-specialist to name one hospital
   benefit per feature (SC-007).
