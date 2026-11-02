# Research: Refocused, Simpler Wi-Fi 7 Talk for a Cisco Session

**Feature**: 003-cisco-refocus | **Date**: 2026-11-02 | **Spec**: [spec.md](./spec.md)

Each item gives the decision, why, and what else was considered. Cisco sources were read on
2026-11-02 and opened without signing in.

## R1. Which Cisco documents count as "public-facing"

**Decision**: Accept only pages on `www.cisco.com` and `documentation.meraki.com` that open without a
login: configuration guides, technical notes, deployment guides and FAQs. Exclude Cisco Learning
Network and Community posts (community content, not Cisco documentation), marketing pages ("What
is Wi-Fi 7?"), event slide decks, and model data sheets (they name hardware). Each Cisco reference
records `access: "open"` and the date it was checked.

**Candidate sources (read 2026-11-02)**:

| Id (proposed) | Title | URL | Use |
|---|---|---|---|
| `cisco-migrate-wifi7` | Migrate to 6 GHz and Wi-Fi 7 with Cisco Wireless (Doc ID 223061, rev 10.0, 22 Jul 2026) | cisco.com/c/en/us/support/docs/wireless/catalyst-9800-series-wireless-controllers/223061-migrate-to-wi-fi-7-and-6ghz.html | 6 GHz and Wi-Fi 7 security on Cisco platforms; WPA2 clients and MLO; readiness check |
| `cisco-9800-wifi7-ops` | Catalyst 9800 Configuration Guide, IOS XE 17.18.x — Wi-Fi 7 Operations (30 Sep 2026) | cisco.com/c/en/us/td/docs/wireless/controller/9800/17-18/config-guide/b_wl_17_18_cg/m_wi-fi-7_operations.html | MLO description, 320 MHz opt-in, beacon protection, downgrade to 802.11ax |
| `meraki-wifi7-guide` | Wi-Fi 7 (802.11be) Technical Guide (Meraki documentation) | documentation.meraki.com/Wireless/Design_and_Configure/Architecture_and_Best_Practices/Wi-Fi_7_(802.11be)_Technical_Guide | 4096-QAM needs a strong signal; 320 MHz channel limits; MLO modes clients implement |
| `cisco-afc-faq` | Automated Frequency Coordination (AFC) FAQ (3 Jun 2026) | cisco.com/c/en/us/products/collateral/networking/wireless/access-points/automated-frequency-coordination-faq.html | Standard-power 6 GHz through AFC on both Cisco management platforms |
| `cisco-6e-band-ops` | Define Wi-Fi 6E Band Operations and Client Connectivity (tech note 220526) | cisco.com/c/en/us/support/docs/wireless/catalyst-9166-series-access-points/220526-configure-and-verify-wi-fi-6e-band-opera.html | 6 GHz security on Cisco (WPA3 / OWE, PMF, no mixed mode) |
| `cisco-9800-twt` | Catalyst 9800 Configuration Guide — Target Wake Time | cisco.com/c/en/us/td/docs/wireless/controller/9800/… (release to pin during content work) | TWT on Cisco networks. **Body not yet readable by fetch**: read the PDF before citing |

**Rationale**: The presenter asked for "public facing documentation only". Configuration guides
and tech notes are factual and versioned; marketing pages are not.

**Alternatives considered**: Cisco Learning Network articles have useful summaries, but they are
community content, and their syntax disagreed with the official guide. The single-page design
guide "Wi-Fi 7 and the Growing Future of Wi-Fi" is an infographic with little text to cite.

## R2. Standards first; what Cisco may source

**Decision**: Every standards figure (rates, channel widths, frequencies, certification rules) keeps
a Tier 1 source, from the references already signed off in 002. Cisco documents are the primary
source only for **platform claims**: what Cisco networks support and Cisco deployment guidance.
They may be a second source on a standards claim. A new claim kind `platform` encodes this.

**Rationale**: FR-014; the audience's engineers can check figures against the standard, and vendor
documents occasionally differ from it (see R6).

## R3. Cisco features to name (platform-wide, no models)

**Decision**: Name these, each cited to R1 sources:

| Chapter | Cisco feature or guidance | Source |
|---|---|---|
| New spectrum | Standard-power 6 GHz through AFC, supported on Cisco's controller-based platform and in the Meraki dashboard | `cisco-afc-faq` |
| New spectrum | 320 MHz is opt-in on Cisco controllers (160 MHz maximum by default), and only one 320 MHz channel fits under US standard power | `cisco-9800-wifi7-ops`, `meraki-wifi7-guide` |
| Data rates | 4096-QAM only works close to the access point with a very strong signal | `meraki-wifi7-guide` |
| MLO | Cisco Wi-Fi 7 networks support MLO; a WPA2 client cannot use MLO or Wi-Fi 7 | `cisco-migrate-wifi7`, `cisco-9800-wifi7-ops` |
| Security | WLANs that don't meet Wi-Fi 7 security run as Wi-Fi 6/6E; beacon protection turns on automatically for compliant WLANs; a Wi-Fi 7 readiness check exists in Cisco's Wireless Configuration Analyzer Express | `cisco-migrate-wifi7`, `cisco-9800-wifi7-ops` |
| TWT | TWT is configurable on Cisco networks (wording pending the source read) | `cisco-9800-twt` |

Allowed names: "Cisco", "Cisco Meraki dashboard", "Cisco Catalyst Center", "Cisco wireless
controllers". Not allowed: model numbers or model families of access points or controllers (for
example CW91xx, Catalyst 91xx, "9800"), firmware or software release numbers on slides (they may
appear in the claim record), and comparisons with other vendors.

**Rationale**: FR-017. These items explain a benefit or a planning decision a hospital will face,
and each exists on both Cisco management platforms or is stated as controller-only.

**Alternatives considered**: AI-based RRM, Cisco Spaces and location services were left out:
they're not Wi-Fi 7 enhancements, and they would lengthen the talk.

## R4. Restricted TWT on Cisco

**Decision**: Do not claim Cisco support for Restricted TWT unless the TWT configuration guide or
another R1 source states it. The TWT chapter gets its Wi-Fi 7 enhancement from the standard
(`rtwt-be`, `rtwt-optional`), and says "optional, and depends on device support".

**Rationale**: No Cisco public page read so far mentions Restricted TWT; the Wi-Fi 7 Operations
guide and the Meraki technical guide do not.

## R5. Data Rates chapter content

**Decision**: Three steps, healthcare framing (imaging studies and busy shift changes):
1. **Problem**: large imaging files and many devices make speed and headroom matter.
2. **How**: three plain reasons, shown as a road: wider lanes (320 MHz, `eht-max-width`,
   `width-320-vs-160`), fuller trucks (4096-QAM, `eht-4096qam-bits`; about 20% more than 1024-QAM),
   and more roads at once (MLO, `mlo-bands`).
3. **Compare / improvement**: peak rates Wi-Fi 6 and 6E 9.6 Gbps (`wifi6-peak-phy`; 6E adds
   spectrum, not a higher peak) and Wi-Fi 7 23.1 Gbps per link (`wifi7-peak-phy`), marked
   theoretical, with "real devices on a hospital floor see much less".

Reuses the highway kit (`src/stage/kit/traffic.js`) for a new `rates` scene.

**Rationale**: The figures were signed off in 002 and come from the standard; the road metaphor is
already familiar from the spectrum chapter.

**Alternatives considered**: Cisco's Meraki guide says Wi-Fi 7 is "up to four times" faster than
Wi-Fi 6. Not used: it doesn't match the standards-derived single-link figures (about 2.4×), and
it reads as marketing. 4096-QAM gets one plain line, not its own chapter (the presenter removed
that chapter as hard to explain).

## R6. Generation attributions (FR-007), checked against existing claims

| Statement | Claim(s) | Note |
|---|---|---|
| Wi-Fi 6E opened 6 GHz | `wifi6e-6ghz-origin`, `wifi6e-cert-launch` | |
| 320 MHz is Wi-Fi 7 only and 6 GHz only | `eht-max-width`, `320mhz-6ghz-only` | |
| Wi-Fi 6/6E peak 9.6 Gbps; Wi-Fi 7 23.1 Gbps per link | `wifi6-peak-phy`, `wifi7-peak-phy` | 6E's peak equals Wi-Fi 6's (same 160 MHz maximum, `he-max-width`) |
| MLO new in Wi-Fi 7; earlier devices use one link | `mlo-defined-be`, `single-link-pre-be` | |
| TWT from Wi-Fi 6; Restricted TWT in Wi-Fi 7, optional | `twt-wifi6`, `twt-origin`, `rtwt-be`, `rtwt-optional` | 6E made no TWT change: state as "Wi-Fi 6E brought new spectrum, not new TWT features", sourced to the 6E program description (`wifi6e-cert-launch`) |
| WPA3 required for certification; 6 GHz requires WPA3 or Enhanced Open, PMF, no legacy | `wpa3-mandatory-cert`, `wpa3-6ghz-required`, `6ghz-no-legacy`, `6ghz-security-options` | |
| Wi-Fi 7 security: WPA3 required for MLO and 802.11be rates; new cipher and key-management requirements; beacon protection | `wpa3-mlo-required`, `wifi7-eht-security` | Confirm GCMP-256, AKM 24 and beacon protection in the WPA3 Specification (`wfa-wpa3-spec`) before adding new Tier 1 claims; Cisco corroborates |

**Decision**: Reuse these claims; add only what R3 and the Wi-Fi 7 security detail need.

## R7. Removing technical depth

**Decision**: Remove the content, not just hide it: delete `deepDive`, `caption.technical`,
hotspot `technical` lines and technical-only key figures from the content; drop validator rule 11's
`deepDive` requirement and forbid those fields instead. Set the view to the plain layer so the
renderers never show leftovers. The talk track loses its "Technical depth" lines.

**Rationale**: FR-009 and SC-006; removing the text keeps the talk track short and stops it
returning by accident.

**Alternatives considered**: Hiding behind the old Leadership view: simpler, but the text would
still sit in the talk track and the validator would still demand it.

## R8. Vendor denylist and the constitution

**Decision**: Amend the constitution to 4.0.0 (MAJOR): Principle I allows Cisco public-facing
documentation as a platform source and permits naming Cisco platform features (no models, no
marketing, no other vendors); required coverage becomes new spectrum, data rates, MLO, TWT,
security. In tooling: remove "Cisco" and "Meraki" from the denylist; add a model-number pattern
check (access point and controller model patterns) and keep every other vendor name denylisted.

**Rationale**: FR-017–FR-019. A pattern check makes SC-005 automatic.

## R9. Chapter order and files

**Decision**: `01-overview`, `02-6ghz-320mhz`, `03-data-rates` (new), `04-mlo`, `05-twt`,
`06-security`, `07-closing`, `08-references`. Delete `density` and `latency` (tabs and scenes) and
the claims only they use. TWT moves ahead of security to match the spec order.

## R10. Comparison switch

**Decision**: Each feature chapter's `compareGenerations` becomes `wifi6`, `wifi6e`, `wifi7`
(spectrum and MLO may show `wifi6e` as the "before"). Remove Wi-Fi 5 branches from scene compare
states. The overview's generation timeline keeps Wi-Fi 4–7 as context, since it sets up "since
Wi-Fi 6".

## R11. Talk track and editable doc

**Decision**: Regenerate the talk track. Because nearly every step changes, rebuild the Claude Doc
chapters wholesale with fresh review tables, rather than patching text.
