# Story Gate Review: Wi-Fi 7 Healthcare Explainer

**Purpose**: Evidence for the constitution's story gate (Principle II–IV) and the healthcare
overclaim check (Principle III).
**Feature**: [spec.md](../spec.md) · Requirements FR-005–FR-011, FR-036, SC-001

## Copy review — 2026-10-26 (implementation pass, Claude Code)

Automated checks (`npm run validate`): five beats in order on every feature tab (rule 3), glossary
terms marked at first use (rule 9), audience layers present (rule 11), no uncited numbers
(rule 17), guarantee wording flagged and failing release (rule 8).

Manual review findings and fixes:

- [x] **Overclaim scan** — searched all tabs and scenarios for "ensure", "guarantee", "prevent",
      "eliminate", "always", "never", "safe", "compliant/compliance". Only hit of note: the Security
      tab says WPA3 *complements* an organisation's security and compliance processes, which is not a
      compliance claim. No changes needed.
- [x] **Undefined jargon in the technical layer** — PMF, EVM, MPDU, PPDU, AKM and "MAC layer" were
      used without definitions. Added glossary terms and marked first use on each tab.
- [x] **Unsupported device-capability statement** — Bandwidth tab said "real devices use fewer
      streams" without a source. Reworded to a statement that follows from the cited formula
      ("a device with fewer streams has a proportionally lower peak") plus the cited 802.11be MAC
      throughput objective.
- [x] **Scenario consistency** — Imaging scenario listed an "imaging cart" while the story described
      an "imaging workstation"; aligned to the story (caught by `tests/e2e/scenario.spec.js`).
- [x] **Plain language first** — every beat body leads with the clinical situation or a plain
      description; protocol detail is confined to "Under the hood" and deep sections.
- [x] **Healthcare scenarios** — all eight are labelled "Illustrative scenario" on screen, use generic
      device types only, and phrase outcomes as "supports".

## Open items for human review

- [ ] A clinical reviewer reads every Bottom line and scenario outcome for tone and plausibility.
- [ ] The "In the standard; not in current devices" qualifier on 16 spatial streams / 46.1 Gbps is
      required by FR-020, but the claim that no current device ships with 16 streams still needs a
      Tier 1 source (see `eht-max-nss` verification notes). If none is found, change the wording to
      "the most the standard allows".

## Leadership layer review (US8)

- [ ] Every `bottomLine` states an impact, risk, cost or planning implication in ≤ 40 words
- [ ] Every `how`/`improvement` `deepDive` adds real protocol depth rather than repeating the body
- [ ] 2–3 headline figures per feature tab
