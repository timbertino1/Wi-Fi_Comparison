# Wi-Fi 7 Explained: A Healthcare Story

A vendor-neutral, animated explainer of Wi-Fi 7 and how it improves on earlier Wi-Fi, told through
hospital scenarios. Eight chapters cover why it matters, 6 GHz and 320 MHz channels, Multi-Link
Operation, WPA3, Target Wake Time, client density and latency,
then a closing recap, followed by references and a glossary. Every figure links to the reputable source it came from.

## Viewing it

1. Get the built `dist/` folder (from a release zip, the CI `dist` artifact, or `npm run build`).
2. **Double-click `dist/index.html`.** It runs in any current browser with no server, no
   installation and no internet connection.
3. To host it, copy the contents of `dist/` to any static web host (an intranet share, a static
   site bucket or a web server). It works unchanged. For hardening, add the response headers in
   [docs/hosting-security.md](docs/hosting-security.md).

**Using the page**

- **Audience** switch (top right): *Leadership* shows a short Bottom line on each step and the
  headline figures; *Technical* opens the protocol detail and the full figures table. Press `V`.
- Each tab tells its story in steps: use **Play**, **Next step** / **Back**, the step numbers, or
  the arrow keys. **Compare Wi-Fi 7 with** switches the earlier generation shown.
- Select any small number in brackets, or any key figure, to see **how we know this**: the
  source, the exact clause or table, the calculation and when it was verified.
- **Present** (or `P`) gives full screen and large text for meetings; a presentation clicker's
  Page Up / Page Down moves through steps and tabs. `B` blanks the screen. Press `?` for all
  shortcuts.
- Motion can be turned off, and the page respects your system's reduced-motion setting. Without
  3D graphics support, still images and full text are shown instead.

## How the content stays accurate

- Only reputable sources are cited: standards bodies and regulators (IEEE, Wi-Fi Alliance, IETF,
  FCC, ECC/CEPT, ETSI, ISED, Ofcom, NIST) for technical facts; peer-reviewed research and health
  authorities only for healthcare context. Vendor material, wikis, blogs, news and AI-generated
  text are never cited. See [docs/source-policy.md](docs/source-policy.md).
- Every number is a **claim** in [`content/claims.json`](content/claims.json) with its source
  locations, method (stated, derived or illustrative) and verification record. Derived values,
  such as peak PHY rates and channel counts, are recalculated on every build.
- [docs/provenance-report.md](docs/provenance-report.md) lists every claim for auditors.
- `npm run validate` rejects uncited numbers, sources outside the allowlist, derivations that no
  longer recompute, vendor names and guarantee wording. `npm run validate -- --release` also
  requires every claim to have been verified by a person within the last 12 months.

## Developing

Requires Node.js 20 or later.

```sh
npm ci                       # install pinned tooling (install scripts stay blocked)
npx playwright install       # browsers for snapshots and tests (one time)
npm run validate             # content, sources, claims, derivations, neutrality
npm test                     # validation + content/security unit tests
npm run build                # bundle to dist/ and render the no-WebGL fallback stills
npm run build:fast           # bundle only
npm run watch                # rebuild on change
npm run test:e2e             # Playwright on file:// in Chromium (Chrome and Edge)
npm run provenance           # regenerate docs/provenance-report.md (CI checks it is current)
```

To change a fact, edit `content/` only (never `dist/`), then run `npm run validate` and
`npm run provenance`. The full guide is in
[specs/001-wifi7-healthcare-explainer/quickstart.md](specs/001-wifi7-healthcare-explainer/quickstart.md).

## Contributing and security

- `main` is protected: changes arrive only through pull requests that pass every required
  check (validation, build, end-to-end tests in Chromium, `npm audit`, dependency review
  and CodeQL). Merge with **Squash** or **Rebase**; history on `main` is linear.
- Dependencies are pinned to exact versions. Dependabot proposes updates weekly, and secret
  scanning with push protection is enabled.
- Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).
- Project principles live in [.specify/memory/constitution.md](.specify/memory/constitution.md).
