# Accuracy & Neutrality Gate Log

**Purpose**: Evidence for the constitution's accuracy review gate (Principle I) and neutrality gate.
**Feature**: [spec.md](../spec.md) · FR-024, FR-046–FR-053, SC-003, SC-013, SC-014 · quickstart V14, V15, V21, V22

## Automated checks (pass as of 2026-10-26)

- [x] `npm run validate` — 0 errors: every number cited (rule 17), sources on the allowlist and the
      publisher's own domain (rule 13), Tier 1 for every technical claim (rule 14), every derived
      value recomputes from its inputs (rule 15), key figures equal their claims (rule 16), no
      orphan claims or references (rules 10, 18), no vendor names (rule 7)
- [x] `docs/provenance-report.md` current (`npm run provenance -- --check`)
- [x] Reference links: 25/25 reachable (`node scripts/check-links.mjs`; CEPT serves an incomplete TLS
      chain but is reachable in browsers)
- [x] Neutrality: denylist test passes over all content and the built `dist/` string literals

## Checked against source text during implementation (not yet a formal verification)

These were read against the source while writing; each still needs a named human verifier.

- WPA3 deployment guide v1.1: WPA2-Personal not permitted in 6 GHz (excerpt recorded); EHT-enabled
  networks require beacon protection, PMF, SAE-H2E, SAE-GDH and GCMP-256 (Tables 4–5, pp. 13–14);
  the guide states its guidelines are not certification requirements, and the site says so.
- IEEE SA listing for 802.11be: approved 2024-09-26, published 2025-07-22; scope includes improved
  worst-case latency and jitter and ≥ 30 Gb/s at the MAC data service access point.
- P802.11bn PAR / TGbn page: in development; ≥ 25% throughput and 25% lower 95th-percentile latency
  goals versus 802.11be.
- Wi-Fi Alliance: Wi-Fi CERTIFIED 7 launched 2024-01-08; Wi-Fi 6 naming 2018-10-03; Wi-Fi CERTIFIED 6
  launch 2019-09-16; Wi-Fi 6E program 2021-01-07.
- FCC 20-51: 5.925–7.125 GHz, 1200 MHz unlicensed; low-power indoor across the band.
- Derived figures reproduced by `tests/content/derivations.test.mjs`: 600 Mbps, 6.93 / 9.61 /
  46.1 Gbps peak PHY rates; 20% 4K-QAM gain; US 6 GHz channel counts 59 / 29 / 14 / 7 / 3.

## Human verification (T118) — outstanding

- [ ] For each of the 94 claims in `content/claims.json`: open the source at the recorded locator,
      confirm value and wording, tighten the locator to the exact clause/table/page, add an excerpt
      where licensing allows, then set `verification.verifiedOn` and `verifiedBy` (initials or role).
      Most locators for IEEE standards are marked "exact table to confirm" because the standards are
      paywalled; access via purchase, an institutional subscription or the IEEE GET Program is needed.
- [ ] Priority items (research.md R11 ⚠): Wi-Fi 7 security requirements wording; preamble puncturing
      in 802.11ax (MU-only); 46 Gbps / 16 spatial streams and the "not in current devices"
      qualifier (needs a Tier 1 source, otherwise reword to "the most the standard allows");
      802.11be publication date; other-region 6 GHz; Wi-Fi 8 status.
- [ ] Regenerate `docs/provenance-report.md`, then `npm run validate -- --release` must pass (T120).

## Independent spot check (T119) — outstanding

- [ ] A second reviewer with source access reproduces 10 random figures using only the provenance
      panel (target 10/10). Record results here.

## Visual neutrality scan

- [x] Screens for every tab were reviewed during implementation in light and dark themes: no vendor
      names, logos or product imagery; devices are generic silhouettes.
- [ ] Human pass over all 48 fallback stills in `dist/fallback/` before release.
