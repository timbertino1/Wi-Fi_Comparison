# Source Policy and Data Provenance

This site informs infrastructure decisions, so every figure on it must be checkable. This document
explains which sources we use, how each fact is recorded, and how it is verified. The rules are
enforced automatically by `npm run validate`; the machine-readable allowlist is
[`content/source-policy.json`](../content/source-policy.json).

## Which sources are allowed

**Tier 1 — standards bodies and regulators.** Required for every technical figure.

| Publisher | Used for |
|-----------|----------|
| IEEE (Standards Association, 802 working groups) | 802.11 and 802.3 technical facts; status of amendments in development |
| Wi-Fi Alliance | Certification programs, security requirements, generation names and launch dates |
| IETF / RFC Editor | Protocol and cryptography background |
| FCC, ECC/CEPT, ETSI, ISED, Ofcom | Spectrum allocations and operating rules by region |
| NIST | Cryptography and security background |

**Tier 2 — peer-reviewed research and health authorities.** Allowed for healthcare context and to
corroborate a Tier 1 source. A Tier 2 source alone never supports a technical figure.

| Publisher | Used for |
|-----------|----------|
| Peer-reviewed publications (must have a DOI) | Measured performance and research context |
| FDA, AAMI, WHO | Wireless medical device and healthcare technology context |

**Never cited:** vendor material of any kind (marketing, blogs, white papers, datasheets —
wherever hosted), Wikipedia and other wikis, blogs, forums and social media, news and trade press,
analyst marketing reports, AI-generated text, and uncredited infographics. If one of these points
to a useful fact, find and cite its primary source instead.

Each reference's web address must be on its publisher's own domain (listed in
`content/source-policy.json`), so a copy of a standard hosted elsewhere is not accepted.

## How a fact is recorded: claims

Every number or normative statement on the site is a **claim** in
[`content/claims.json`](../content/claims.json). Text cites it as `{{claim-id}}`; key figures and
3D scene labels read their values from it. A claim records:

- **Statement, value and unit** — e.g., "Wi-Fi 7 theoretical peak PHY rate", 46.1, Gbps.
- **Kind** — `technical` (needs a Tier 1 source) or `context` (healthcare or background; Tier 1
  or Tier 2).
- **Method**
  - `stated` — the value appears in the source;
  - `derived` — it is calculated from other stated claims, with the formula named;
  - `illustrative` — a visual that shows a pattern, not a measurement. Illustrative visuals show no
    numbers and are labeled "Illustrative" on screen.
- **Sources** — each with the reference, the exact **location** (clause, table, section, page or
  paragraph) and, where licensing allows, a short excerpt (≤ 50 words).
- **Verification** — the date it was checked and who checked it (initials or role only).

## How derived values are recomputed

Formulas live in [`scripts/derivations.mjs`](../scripts/derivations.mjs). On every validation run,
each derived claim is recalculated from its input claims; if the result no longer matches the
displayed value (within the stated rounding), validation fails. For example:

> Wi-Fi 7 peak PHY rate = 16 spatial streams × 3,920 data subcarriers × 12 bits × 5/6 coding
> ÷ (12.8 µs symbol + 0.8 µs guard interval) = 46,118 Mbps ≈ **46.1 Gbps**

Every input (16, 3,920, 12, 5/6, 12.8, 0.8) is itself a stated claim with its own location in
IEEE 802.11be.

## How claims are verified

1. Open the cited source at the recorded location.
2. Confirm the value and the wording of the statement. For derived claims, confirm each input.
3. Tighten the location to the exact clause, table or page, and add a short excerpt if allowed.
4. Record `verifiedOn` (YYYY-MM-DD) and `verifiedBy` (initials or role).
5. Regenerate the auditor report: `npm run provenance`.

Claims must be re-verified at least every **12 months**; release validation
(`npm run validate -- --release`) fails on any claim that is unverified or older than that.

**Paywalled standards.** Several IEEE standards require purchase, an institutional subscription,
or the IEEE GET Program. If a Tier 1 text can't be accessed, the claim stays unverified and blocks
release. It is never replaced with a lower-tier source.

**Superseded sources.** IEEE amendments are periodically rolled into new revisions. A claim may
keep citing a superseded amendment only with a note explaining why (for example, "clause text
unchanged in the 2022 revision").

## Proposing a new publisher

Open a pull request that edits `content/source-policy.json` (publisher name, tier, official
domains, and what it will be used for) and explains why the publisher is reputable and neutral.
CODEOWNERS review is required.

## Auditor report

[`docs/provenance-report.md`](provenance-report.md) is generated from the content and lists every
claim with its sources, locations, derivation and verification status. CI fails if it is out of
date.
