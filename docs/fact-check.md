# Fact-check, 2026-10-31

Every claim in `content/claims.json` was checked against its cited source where the source is openly readable. Sign-off (`verifiedOn`, `verifiedBy`) is the presenter's step and is not filled in here.

| Result | Claims |
|---|---|
| Confirmed against the source text | 43 |
| Partly confirmed (open source supports part; the rest rests on IEEE text) | 7 |
| Needs IEEE text (clause content is paywalled) | 46 |

## Corrections made during the check

- **vht-dl-mu-mimo:** removed the IEEE 802.11ac "Scope" locator; the listing's scope does not mention MU-MIMO. The claim rests on IEEE 802.11-2020 Clause 21.
- **wpa3-mlo-required:** added the WPA3 Specification as a direct source: PSK, PSK-SHA256 and even plain SAE "are not used in an association that negotiates use of EHT or MLO"; only SAE-GDH remains.
- **wifi7-eht-security:** PMF Required, SAE-GDH, hash-to-element and GCMP-256 are mandatory in WPA3-Personal Only Mode (Table 8), not in every mode; beacon protection is mandatory in all modes (Table 4). Statement and locator narrowed.
- **6ghz-security-options:** the sources state WPA2-Personal is not permitted and WPA3 is mandatory in 6 GHz, and show Enhanced Open for open access there; no explicit ban on unencrypted open networks was found, so the statement no longer asserts one.
- FCC and IEEE scope claims now carry quoted excerpts.

## Confirmed

| Claim | Statement | Evidence |
|---|---|---|
| gen-naming | Wi-Fi Alliance names 802.11n, 802.11ac and 802.11ax as Wi-Fi 4, Wi-Fi 5 and Wi-Fi 6 | S3: Press release 2018-10-03: “Wi-Fi 6” to identify devices that support 802.11ax technology (likewise Wi-Fi 5 = 802.11ac, Wi-Fi 4 = 802.11n). |
| wifi4-published | IEEE 802.11n (Wi-Fi 4) published | S1: IEEE listing: board approval 2009-09-11, published 2009-10-29. |
| wifi5-published | IEEE 802.11ac (Wi-Fi 5) published | S2: IEEE listing: board approval 2013-12-11, published 2013-12-18. |
| wifi6-cert-launch | Wi-Fi CERTIFIED 6 program launched | S5: Press release 2019-09-16: “The Wi-Fi CERTIFIED 6 certification program from Wi-Fi Alliance is now available”. |
| wifi6e-cert-launch | Wi-Fi 6E certification program launched (Wi-Fi 6 in the 6 GHz band) | S17: Press release 2021-01-07: “Wi-Fi 6E extends into the 6 GHz band the capabilities of Wi-Fi CERTIFIED 6”. |
| wifi7-cert-launch | Wi-Fi CERTIFIED 7 program launched | S16: Press release dated 2024-01-08 introducing Wi-Fi CERTIFIED 7. |
| wifi7-ieee-approved | IEEE 802.11be approved by the IEEE SA Standards Board | S8: IEEE listing: board approval 2024-09-26; status Active Standard. |
| wifi7-ieee-published | IEEE 802.11be published | S8: IEEE listing: published 2025-07-22. |
| wifi8-status | IEEE P802.11bn (Ultra High Reliability, expected to be Wi-Fi 8) is in development and not yet approved | S10: TGbn timeline: D2.0 WG letter ballot done; remaining milestones “Upcoming”, RevCom/SASB approval projected May 2028. |
| eht-max-width | Wi-Fi 7 (EHT) widest channel, 6 GHz only | S15: Wi-Fi CERTIFIED 7 page: “320 MHz channels available in the 6 GHz band provide twice the throughput of Wi-Fi 6.” |
| qam-4k-gain | Peak-rate gain of 4096-QAM over 1024-QAM (12 vs 10 bits per subcarrier) | S15: Wi-Fi CERTIFIED 7 page: “4K QAM achieves 20% higher transmission rates” than 1024 QAM. |
| width-320-vs-160 | A 320 MHz Wi-Fi 7 channel is twice as wide as the widest Wi-Fi 6E channel | S16: Press release 2024-01-08: the 320 MHz channels double the widest current channel size. |
| us-6ghz-band-start | Lower edge of the US 6 GHz unlicensed band | S21: Report and Order: unlicensed use “in the 5.925-7.125 GHz (6 GHz) band”. |
| us-6ghz-band-end | Upper edge of the US 6 GHz unlicensed band | S21: Report and Order: unlicensed use “in the 5.925-7.125 GHz (6 GHz) band”. |
| us-6ghz-total | Spectrum made available for unlicensed use in the US 6 GHz band | S21: Report and Order (statements): “the entire 6 GHz band—a massive 1,200 megahertz … available for unlicensed use”. |
| eu-6ghz-band | European harmonised 6 GHz band for Wi-Fi (lower 6 GHz) | S22: ECC/DEC/(20)01 “on the harmonised use of the frequency band 5945-6425 MHz” for WAS/RLAN. |
| wifi6e-6ghz-origin | 6 GHz operation first became available to Wi-Fi with Wi-Fi 6E (802.11ax in 6 GHz) | S17: Press release 2021-01-07: “Wi-Fi 6E extends into the 6 GHz band the capabilities of Wi-Fi CERTIFIED 6”. |
| 320mhz-6ghz-only | 320 MHz channels are only available where the 6 GHz band is open to Wi-Fi | S16: Press release 2024-01-08: 320 MHz channels are “available in countries that make the 6 GHz band available to Wi-Fi”. |
| fcc-lpi | In the US, low-power indoor access points may operate across the entire 6 GHz band without automated frequency coordination | S21: Report and Order summary: “We also authorize indoor low-power access points across the entire 6 GHz band.” Section III.B: Low-Power Indoor Operations Across the Entire 6 GHz Band. |
| 6ghz-building-loss | Building walls and materials attenuate 6 GHz signals; the FCC relied on this building entry loss when permitting low-power indoor operation | S21: Report and Order: signals “will be significantly attenuated when passing through the walls of buildings. The median signal loss from a traditionally constructed building is 17 dB”. |
| ofdma-ax | OFDMA, which divides a channel into resource units shared by several devices at once, was introduced with 802.11ax (Wi-Fi 6) | S4: Press release 2019-01-08 lists “Uplink and downlink orthogonal frequency division multiple access (OFDMA)” among Wi-Fi 6 features. |
| twt-wifi6 | Target Wake Time is one of the features of Wi-Fi CERTIFIED 6 | S4: Press release 2019-01-08 lists “Target wake time (TWT)” among Wi-Fi 6 features. |
| be-latency-objective | The scope of IEEE 802.11be includes at least one mode of operation with improved worst-case latency and jitter | S8: IEEE listing scope: “This amendment defines at least one mode of operation capable of improved worst case latency and jitter.” |
| latency-histogram-illustrative | The latency histograms show the shape of the improvement Wi-Fi 7 targets (a shorter worst-case tail), not measured values | S8: Scope sentence as for be-latency-objective; the histograms are labelled illustrative and carry no measured values. |
| wpa3-mandatory-cert | WPA3 is required for new Wi-Fi CERTIFIED devices | S20: Security page: “WPA3 is mandatory for Wi-Fi CERTIFIED devices.” Highlights PDF: required “since 2020”. |
| wpa3-6ghz-required | WPA2-Personal networks are not permitted in the 6 GHz band; WPA3 is mandatory there | S19: Guide note 5: “Configuration of a WPA2-Personal BSS in the 6 GHz or Sub 1GHz bands is not permitted.” Highlights: WPA3 “use is mandatory in the 6 GHz band”. |
| wpa3-mlo-required | Password-based authentication over Wi-Fi 7 MLO requires WPA3 | S18: Spec: AKM suite selectors 00-0F-AC:2, :6 and :8 “are not used in an association that negotiates use of EHT or MLO”; only SAE-GDH (WPA3) remains. |
| wpa3-sae | WPA3-Personal uses Simultaneous Authentication of Equals (SAE), which resists offline password guessing | S24: Technology Overview: SAE credentials cannot be obtained “by a passive attack, active attack, or offline dictionary attack”; launch release: SAE gives “stronger protections … against password guessing attempts”. |
| wpa3-forward-secrecy | WPA3-Personal provides forward secrecy: capturing traffic now and learning the password later does not expose that earlier traffic | S24: Technology Overview: “forward secrecy is provided because the SAE handshake assures the PMK cannot be recovered if the password” is later learned. |
| owe-what | Wi-Fi Enhanced Open (OWE) encrypts traffic on open networks, such as guest Wi-Fi, without requiring a password | S20: Security page: Wi-Fi Enhanced Open provides “unauthenticated data encryption”; “there are no public passphrases to maintain, share, or manage”. |
| wifi7-eht-security | Wi-Fi Alliance deployment guidance for Wi-Fi 7 (EHT) networks makes beacon protection mandatory in every WPA3 mode, and in WPA3-Personal Only Mode also PMF Required, SAE hash-to-element, the SAE-GDH key management suite and GCMP-256 encryption | S19: Guide Table 4: Beacon Protection “AP: EHT enabled on BSS MAND”; Table 8 (WPA3-Personal Only Mode, EHT enabled): SAE-GDH MAND, PMF Required MAND, GCMP-256 and CCMP-128 MAND, H2E Only MAND in 6 GHz. |
| legacy-security-disallowed | WEP, TKIP and WPA (version 1) are disallowed in all WPA3 and Wi-Fi Enhanced Open configurations | S19: Guide Table 4 (all WPA3 and Enhanced Open modes): WEP, TKIP and WPA v1 DISALLOW for every AP and STA row. |
| wpa3-ent-pmf-required | In WPA3-Enterprise Only Mode, protected management frames are required (PMF Required) on the access point and the device | S18: Spec 3.2: “The AP’s BSS Configuration shall be PMF Required”. |
| wpa3-ent-sha256 | WPA3-Enterprise Only Mode uses the IEEE 802.1X sign-in with SHA-256 and does not enable the SHA-1 version used by WPA2-Enterprise | S18: Spec 3.2: “shall not enable AKM suite selector: 00-0F-AC:1 (IEEE 802.1X with SHA-1)”. |
| wpa2-ent-pmf-optional | WPA2-Enterprise does not require protected management frames: WPA3-Enterprise transition mode differs from it by disallowing TKIP, enabling PMF and requiring SHA-256 sign-in | S19: Guide: “WPA3-Enterprise transition mode is similar to WPA2-Enterprise, except that TKIP is disallowed, PMF is enabled (Capable) …”. |
| wpa3-ent-cert-validation | A WPA3 device must validate the authentication server’s certificate when it signs in with EAP-TLS, EAP-TTLS or EAP-PEAP | S18: Spec 5.1: “A WPA3 STA shall perform server certificate validation when using EAP-TTLS, EAP-TLS, EAP-PEAPv0 or EAP-PEAPv1”. |
| wpa3-ent-192 | WPA3-Enterprise 192-bit mode, intended for networks with higher security requirements, uses only the Suite B 192-bit sign-in, requires PMF, and uses GCMP-256 and BIP-GMAC-256 encryption | S18: Spec 3.5: 192-bit mode is for networks “with higher security requirements”. |
| wpa3-ent-6ghz-eht | The WPA2-Enterprise sign-in (802.1X with SHA-1) is not used in associations that use Wi-Fi 7 (EHT or MLO) or the 6 GHz band; 6 GHz Enterprise networks run WPA3-Enterprise Only Mode | S18: Spec 3.3 note: 00-0F-AC:1 “is not used in an association that negotiates use of EHT or MLO, nor in an association in the 6 GHz band”. |
| wpa3-dual-ssid-legacy | Wi-Fi Alliance deployment guidance describes a dual-network (Dual-SSID) configuration so older devices that cannot use WPA3 keep connecting during the transition | S19: Guide 3.2.1: “The Dual-SSID configuration for legacy STA interoperability is defined in Table 16.” |
| fcc-sp-afc | In the US, standard-power access points may use only the U-NII-5 (5925–6425 MHz) and U-NII-7 (6525–6875 MHz) parts of the 6 GHz band, under automated frequency coordination (AFC) | S21: Report and Order: “We authorize standard-power access points using an automated frequency coordination (AFC) system.” Section III.A: Standard-Power Operations in U-NII-5 and U-NII-7 Bands. |
| wpa3-launched | Wi-Fi Alliance launched WPA3 certification as its own security program | S23: Press release dated 2018-06-25 introducing Wi-Fi CERTIFIED WPA3. |
| wpa3-ent-transition | WPA3-Enterprise Transition Mode enables both the SHA-1 and SHA-256 802.1X sign-ins and sets PMF Capable rather than PMF Required, so WPA2- and WPA3-Enterprise devices can share one network | S18: Spec 3.3: the AP “shall enable at least AKM suite selectors 00-0F-AC:1 (IEEE 802.1X with SHA-1) and 00-0F-AC:5” and “shall be PMF Capable”. |
| 6ghz-security-options | In the 6 GHz band, WPA2-Personal is not permitted and WPA3 is mandatory; for open access, Wi-Fi Alliance guidance uses Wi-Fi Enhanced Open there | S19: Guide note 5 (no WPA2-Personal in 6 GHz); Highlights (WPA3 mandatory in 6 GHz); guide example A.3 runs open access in 6 GHz as Wi-Fi Enhanced Open Only Mode. |

## Partly confirmed

| Claim | Statement | Evidence |
|---|---|---|
| us-6ghz-channels-20 | Non-overlapping 20 MHz channels in the US 6 GHz band | Band edges confirmed in FCC 20-51; the channel raster (IEEE 802.11ax Annex E) is not openly readable; the count is recomputed at every build. |
| us-6ghz-channels-40 | Non-overlapping 40 MHz channels in the US 6 GHz band | As for us-6ghz-channels-20. |
| us-6ghz-channels-80 | Non-overlapping 80 MHz channels in the US 6 GHz band | As for us-6ghz-channels-20. |
| us-6ghz-channels-160 | Non-overlapping 160 MHz channels in the US 6 GHz band | As for us-6ghz-channels-20. |
| us-6ghz-channels-320 | Non-overlapping 320 MHz channels in the US 6 GHz band | As for us-6ghz-channels-20. |
| 6ghz-no-legacy | Only Wi-Fi 6E and later devices operate in the 6 GHz band; earlier Wi-Fi generations cannot use it | Wi-Fi 6E launch release ties 6 GHz access to Wi-Fi 6E devices (“no congestion from legacy devices”); the IEEE 802.11ax Annex E rule itself is not openly readable. |
| mlo-bands | A Wi-Fi 7 multi-link connection can combine links in the 2.4 GHz, 5 GHz and 6 GHz bands | Wi-Fi Alliance confirms MLO lets devices “transmit and receive data simultaneously over multiple links”; the 2.4/5/6 GHz link combination rests on IEEE 802.11be Clause 35. |

## Needs IEEE text

These rest on clause-level content of IEEE 802.11-2020, 802.11ax, 802.11be or 802.11ah, which cannot be read without IEEE access. IEEE 802 standards are free through the IEEE GET Program (an IEEE account is needed), so a check with the PDFs open is possible.

| Claim | Statement | Evidence |
|---|---|---|
| ht-max-nss | Wi-Fi 4 (HT) maximum spatial streams | Clause text of S6 is not openly readable (IEEE paywall); check Clause 19 (HT PHY), HT MCS tables. |
| ht-nsd-40 | Data subcarriers in a 40 MHz HT channel | Clause text of S6 is not openly readable (IEEE paywall); check Clause 19, HT timing-related constants table. |
| ht-64qam-bits | Bits per subcarrier at 64-QAM (Wi-Fi 4 highest modulation) | Clause text of S6 is not openly readable (IEEE paywall); check Clause 19, HT modulation-dependent parameters table. |
| vht-max-nss | Wi-Fi 5 (VHT) maximum spatial streams | Clause text of S6 is not openly readable (IEEE paywall); check Clause 21 (VHT PHY), VHT MCS tables. |
| vht-max-width | Wi-Fi 5 (VHT) widest channel | Clause text of S6 is not openly readable (IEEE paywall); check Clause 21 (VHT PHY). |
| vht-nsd-160 | Data subcarriers in a 160 MHz VHT channel | Clause text of S6 is not openly readable (IEEE paywall); check Clause 21, VHT timing-related constants table. |
| vht-256qam-bits | Bits per subcarrier at 256-QAM (Wi-Fi 5 highest modulation) | Clause text of S6 is not openly readable (IEEE paywall); check Clause 21, VHT modulation-dependent parameters table. |
| ofdm-symbol-ht-vht-us | OFDM symbol duration (without guard interval) for HT and VHT | Clause text of S6 is not openly readable (IEEE paywall); check Clauses 19 and 21, timing-related constants (T_DFT). |
| short-gi-ht-vht-us | Short guard interval for HT and VHT | Clause text of S6 is not openly readable (IEEE paywall); check Clauses 19 and 21, timing-related constants (T_GI,S). |
| he-max-nss | Wi-Fi 6 (HE) maximum spatial streams | Clause text of S7 is not openly readable (IEEE paywall); check Clause 27 (HE PHY), HE-MCS tables. |
| he-max-width | Wi-Fi 6 / 6E (HE) widest channel | Clause text of S7 is not openly readable (IEEE paywall); check Clause 27 (HE PHY). |
| he-nsd-160 | Data subcarriers in a 160 MHz HE channel (2×996-tone RU) | Clause text of S7 is not openly readable (IEEE paywall); check Clause 27, HE-MCS rate tables (N_SD). |
| he-1024qam-bits | Bits per subcarrier at 1024-QAM (Wi-Fi 6 highest modulation) | Clause text of S7 is not openly readable (IEEE paywall); check Clause 27, HE-MCS 10–11 parameters. |
| he-eht-symbol-us | OFDM symbol duration (without guard interval) for HE and EHT | Clause text of S7, S8 is not openly readable (IEEE paywall); check Clause 27, timing-related constants; Clause 36, timing-related constants. |
| he-eht-min-gi-us | Shortest guard interval for HE and EHT | Clause text of S7, S8 is not openly readable (IEEE paywall); check Clause 27, guard interval durations; Clause 36, guard interval durations. |
| eht-max-nss | Wi-Fi 7 (EHT) maximum spatial streams defined in the standard | Clause text of S8 is not openly readable (IEEE paywall); check Clause 36 (EHT PHY), EHT-MCS tables. |
| eht-nsd-320 | Data subcarriers in a 320 MHz EHT channel (4×996-tone RU) | Clause text of S8 is not openly readable (IEEE paywall); check Clause 36, EHT-MCS rate tables (N_SD). |
| eht-4096qam-bits | Bits per subcarrier at 4096-QAM (Wi-Fi 7 highest modulation) | Clause text of S8 is not openly readable (IEEE paywall); check Clause 36, EHT-MCS 12–13 parameters. |
| coding-rate-max | Highest coding rate used at the top MCS of Wi-Fi 4 through Wi-Fi 7 | Clause text of S6, S7, S8 is not openly readable (IEEE paywall); check Clauses 19 and 21, MCS tables; Clause 27, HE-MCS tables; Clause 36, EHT-MCS tables. |
| wifi4-peak-phy | Wi-Fi 4 theoretical peak PHY rate: 4 streams, 40 MHz, 64-QAM 5/6, short guard interval | Clause text of S6 is not openly readable (IEEE paywall); check Clause 19, HT MCS 31 rate table. |
| wifi5-peak-phy | Wi-Fi 5 theoretical peak PHY rate: 8 streams, 160 MHz, 256-QAM 5/6, short guard interval | Clause text of S6 is not openly readable (IEEE paywall); check Clause 21, VHT-MCS 9 rate table. |
| wifi6-peak-phy | Wi-Fi 6 / 6E theoretical peak PHY rate: 8 streams, 160 MHz, 1024-QAM 5/6, 0.8 µs guard interval | Clause text of S7 is not openly readable (IEEE paywall); check Clause 27, HE-MCS 11 rate table. |
| wifi7-peak-phy | Wi-Fi 7 theoretical peak PHY rate: 16 streams, 320 MHz, 4096-QAM 5/6, 0.8 µs guard interval | Clause text of S8 is not openly readable (IEEE paywall); check Clause 36, EHT-MCS 13 rate table. |
| 6ghz-ch1-lower-edge | Lower edge of 6 GHz channel 1 (channel starting frequency 5950 MHz; channel 1 centred on 5955 MHz) | Clause text of S7 is not openly readable (IEEE paywall); check Annex E, 6 GHz band operating classes and channel numbering. |
| mlo-defined-be | Multi-Link Operation (MLO) is defined in IEEE 802.11be | Clause text of S8 is not openly readable (IEEE paywall); check Clause 35 (EHT MAC), multi-link operation subclauses. |
| mlo-modes-be | IEEE 802.11be defines STR, NSTR, EMLSR and EMLMR multi-link modes | Clause text of S8 is not openly readable (IEEE paywall); check Clause 35, multi-link device operation and EMLSR/EMLMR subclauses. |
| mlo-tid-mapping | 802.11be lets traffic types be mapped to specific links (TID-to-link mapping), and a multi-link device keeps one association and security context across its links | Clause text of S8 is not openly readable (IEEE paywall); check Clause 35, TID-to-link mapping and MLD association subclauses. |
| single-link-pre-be | Before 802.11be, a device is associated with an access point on one band (link) at a time; moving to another band requires a new association | Clause text of S6, S8 is not openly readable (IEEE paywall); check Clause 11, association and reassociation procedures; Clause 35, multi-link device introduction. |
| puncturing-ax | Preamble puncturing was introduced in 802.11ax for multi-user transmissions | Clause text of S7 is not openly readable (IEEE paywall); check Clause 27, HE MU PPDU preamble puncturing. |
| puncturing-be | 802.11be extends preamble puncturing to single-user and multi-user transmissions using a puncturing bitmap | Clause text of S8 is not openly readable (IEEE paywall); check Clause 36, preamble puncturing. |
| multi-ru-be | 802.11be allows one station to be assigned multiple resource units (MRU); 802.11ax assigns one RU per station | Clause text of S8, S7 is not openly readable (IEEE paywall); check Clause 36, MRU definitions; Clause 27, RU allocation. |
| bss-coloring-ax | 802.11ax BSS coloring marks each network's transmissions so devices can tell their own network from a neighbour's and reuse the channel more often | Clause text of S7 is not openly readable (IEEE paywall); check Clause 26, BSS color and spatial reuse operation. |
| contention-dcf | Under 802.11 contention (DCF/EDCA), devices take turns for the medium; outside multi-user transmissions, one device sends at a time using the whole channel | Clause text of S6 is not openly readable (IEEE paywall); check Clause 10, distributed coordination function (DCF) and EDCA. |
| eht-4kqam-evm | 4096-QAM requires a cleaner signal than 1024-QAM: 802.11be sets a stricter transmit modulation accuracy (EVM) limit for it | Clause text of S8 is not openly readable (IEEE paywall); check Clause 36, transmit constellation error (EVM) requirements table. |
| twt-origin | Target Wake Time was first defined in IEEE 802.11ah | Clause text of S9 is not openly readable (IEEE paywall); check TWT subclause (MAC). |
| rtwt-be | Restricted TWT (r-TWT) in 802.11be reserves protected service periods for latency-sensitive traffic | Clause text of S8 is not openly readable (IEEE paywall); check Clause 35, restricted TWT subclause. |
| twt-what | With Target Wake Time, a device and access point agree on when the device will wake to exchange data, so the device can sleep in between | Clause text of S9, S7 is not openly readable (IEEE paywall); check TWT subclause (MAC); Clause 26, TWT operation. |
| twt-types-ax | 802.11ax defines both individual TWT agreements (per device) and broadcast TWT schedules (shared by groups of devices) | Clause text of S7 is not openly readable (IEEE paywall); check Clause 26, individual and broadcast TWT subclauses. |
| rtwt-protect | During a restricted TWT service period, other devices that support it are expected to end their transmissions before the period starts, so the protected traffic gets the medium | Clause text of S8 is not openly readable (IEEE paywall); check Clause 35, restricted TWT operation. |
| vht-dl-mu-mimo | 802.11ac (Wi-Fi 5) added downlink multi-user MIMO: an access point can send to up to four devices in one transmission, while devices still send to the access point one at a time | Clause text of S6 is not openly readable (IEEE paywall); check Clause 21 (VHT PHY), VHT MU PPDU (downlink, up to four users). |
| he-ul-mu | 802.11ax (Wi-Fi 6) adds uplink multi-user transmission: the access point triggers several devices to send at once, using OFDMA or MU-MIMO | Clause text of S7 is not openly readable (IEEE paywall); check Clause 26, trigger frame and uplink multi-user (UL MU) operation. |
| str-what | In STR mode, a multi-link device can transmit on one link while receiving on another at the same time | Clause text of S8 is not openly readable (IEEE paywall); check Clause 35, multi-link operation: STR and NSTR link pairs. |
| emlsr-what | In EMLSR mode, a multi-link device listens on several links but exchanges frames on only one of them at a time; the mode does not fix how many radios the device has | Clause text of S8 is not openly readable (IEEE paywall); check Clause 35, enhanced multi-link single-radio (EMLSR) operation. |
| emlmr-what | In EMLMR mode, a multi-link device moves its transmit and receive spatial streams between links as traffic requires | Clause text of S8 is not openly readable (IEEE paywall); check Clause 35, enhanced multi-link multi-radio (EMLMR) operation. |
| puncturing-patterns | 802.11be limits single-user preamble puncturing to a defined set of patterns, and the primary 20 MHz channel cannot be punctured | Clause text of S8 is not openly readable (IEEE paywall); check Clause 36, allowed puncturing patterns for non-OFDMA transmissions. |
| rtwt-optional | Restricted TWT is an optional 802.11be capability, advertised in the EHT Capabilities element; only devices that support it take part | Clause text of S8 is not openly readable (IEEE paywall); check Clause 9, EHT Capabilities element (Restricted TWT Support); Clause 35, restricted TWT. |

## Peer review of the claims, 2026-10-31

The 53 claims not fully confirmed above, and a spot check of the 43 confirmed ones, were reviewed by a second model (GPT, High Thinking, with web search). Its verdicts are recorded in each claim's verification notes. It reported 3 Wrong, 13 Imprecise, 1 Wrong locator and the rest Correct; each finding was checked before applying.

**Wrong, corrected:**

- **eht-max-nss:** the final 802.11be standard defines up to 8 spatial streams, not 16. Sixteen appeared in drafts but not in the published amendment.
- **wifi7-peak-phy:** recomputed with 8 streams. The Wi-Fi 7 single-link theoretical peak is **23.1 Gbps** (8 × 2882.4 Mb/s), not 46.1 Gbps. This puts it on the same footing as 600 Mbps, 6.93 Gbps and 9.61 Gbps for Wi-Fi 4–6. The 802.11be scope's "at least 30 Gbit/s at the MAC SAP" is met through multi-link aggregation, not a single link.
- **contention-dcf:** "using the whole channel" removed. The claim now states the TXOP access rule only.

**Imprecise, reworded:**

- **MLO modes:** STR and NSTR describe pairs of links; EMLSR and EMLMR are enhanced modes. Affected claims: mlo-modes-be, str-what, emlmr-what.
- **TID-to-link mapping:** security is described as coordinated across links. Affected claim: mlo-tid-mapping.
- **Association before Wi-Fi 7:** association is per BSS, not per band. Affected claim: single-link-pre-be.
- **Puncturing signalling:** described as preamble signalling plus a BSS disabled-subchannel bitmap. Affected claim: puncturing-be.
- **BSS coloring:** coloring identifies the network; the spatial-reuse rules use that. Affected claim: bss-coloring-ax.
- **Restricted TWT:** it improves protection, but airtime is not exclusive. Affected claims: rtwt-be, rtwt-protect.
- **TWT:** individual TWT is negotiated per device; broadcast TWT is a shared schedule. Affected claim: twt-what.
- **802.11ac uplink:** it defined no uplink multi-user transmission. Affected claim: vht-dl-mu-mimo.
- **6 GHz security:** secured networks use WPA3 and open networks use Enhanced Open. Affected claims: wpa3-6ghz-required, 6ghz-security-options.

**Locators:** 802.11be clause and table numbers were updated where the reviewer gave them with high confidence:
- 35.3.16–35.3.18 (MLO)
- 35.8 (restricted TWT)
- 35.15.2 and Table 36-30 (puncturing)
- Tables 36-51, 36-65 and 36-86

The reviewer read these from a copy of the standard. They should still be confirmed against the official IEEE text when it is available.

**Content changed to match:**
- Chapter 1 step 3 (peak rates).
- Chapter 3 MLO modes section.
- Chapter 5 lineage note.
- Chapter 6 step 4.
- Chapter 9 step 1.
- Glossary entries for STR, NSTR and Restricted TWT.
