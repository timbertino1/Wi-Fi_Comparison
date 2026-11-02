# Contract: Chapter Lineup

The clicker path and what each chapter must show. Validated by `scripts/validate-content.mjs`
and the Chromium suite.

| # | Chapter | Kind | Steps | Compare | Must show (since Wi-Fi 6) | Cisco mention |
|---|---|---|---|---|---|---|
| 1 | Why Wi-Fi 7, and why now | overview | 3–4 | — | Generations timeline; hospital demand. Peak rates move to ch 3. | — |
| 2 | New Spectrum: 6 GHz and 320 MHz | feature | 3 | 6E, 7 | 6: no 6 GHz · 6E: opens 6 GHz · 7: 320 MHz channels in 6 GHz; regional availability | AFC standard power; 320 MHz opt-in |
| 3 | Faster Data Rates | feature | 3 | 6, 6E, 7 | 6/6E: 9.6 Gbps peak · 7: 23.1 Gbps per link; three reasons; "theoretical" | 4096-QAM needs close range |
| 4 | Multi-Link Operation | feature | 3 | 6E, 7 | 6/6E: one link at a time · 7: several links (MLO) | WPA2 clients can't use MLO on Cisco Wi-Fi 7 |
| 5 | Target Wake Time & Battery Life | feature | 3 | 6, 7 | 6: TWT introduced · 6E: no TWT change · 7: optional Restricted TWT | TWT on Cisco networks (pending source) |
| 6 | Security | feature | 3 | 6, 6E, 7 | 6: WPA3 for certification · 6E: WPA3/Enhanced Open + PMF, no legacy, in 6 GHz · 7: WPA3 for MLO and 802.11be rates, stronger ciphers, beacon protection | Non-compliant WLANs run as 6/6E; readiness check |
| 7 | Bringing it together | closing | 2–3 | — | One-view recap of the five benefits; follow-up topics | — |
| 8 | References & Glossary | references | — | — | Off the clicker path | — |

## Follow-up topics (closing chapter)

At minimum: 6 GHz design and AFC standard power; MLO client readiness; WPA3 migration for clinical
devices; battery-powered device planning (TWT); capacity planning for imaging and peak density.

## Invariants

- Exactly 7 chapters on the clicker path; ≤ 22 steps in total (openers not counted).
- No chapter shows a technical-depth section, deep dive or technical caption line.
- Each feature chapter's comparison step and `sinceWifi6` panel agree with each other.
- Removed: Client Density, Latency (and earlier 4K-QAM) chapters are absent from the menu.
