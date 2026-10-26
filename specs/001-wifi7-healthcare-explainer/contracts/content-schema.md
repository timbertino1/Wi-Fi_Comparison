# Contract: Content Files

Content authors edit only files under `content/`. Field semantics and validation rules are in
[data-model.md](../data-model.md); this file fixes the on-disk shape.

## Files

| File | Top-level shape |
|------|-----------------|
| `content/generations.json` | `{ "generations": Generation[] }` |
| `content/references.json` | `{ "references": Reference[] }` |
| `content/glossary.json` | `{ "terms": GlossaryTerm[] }` |
| `content/scenarios.json` | `{ "scenarios": HealthcareScenario[] }` |
| `content/source-policy.json` | `SourcePolicy` object (allowlisted publishers, tiers, domains) |
| `content/claims.json` | `{ "claims": Claim[] }` |
| `content/tabs/NN-<id>.json` | one `FeatureTab` object; `NN` equals `order` |

## Example (abridged feature tab)

```json
{
  "id": "mlo",
  "order": 3,
  "kind": "feature",
  "title": "Multi-Link Operation",
  "summary": "One connection that uses several bands at once.",
  "introducedIn": "wifi7",
  "wifi7Adds": null,
  "compareGenerations": ["wifi5", "wifi6e", "wifi7"],
  "defaultCompare": "wifi6e",
  "sceneId": "mlo",
  "scenarioIds": ["voice-badge-hallway"],
  "beats": [
    {
      "type": "problem",
      "heading": "The call that drops between units",
      "body": "A nurse's [[voice-badge]] is tied to a single band ...",
      "bottomLine": "Dropped badge calls mean repeated pages and delays; this is a reliability issue for clinical communication, not just an IT one.",
      "deepDive": null,
      "sceneState": "single-link-congested",
      "sceneDescription": "A nurse walks down a hallway. The badge is linked to an access point by one beam on the 5 GHz band ...",
      "durationMs": 12000
    }
  ],
  "keyFigures": [
    {
      "id": "links",
      "metric": "Simultaneous links per connection",
      "unit": "links",
      "values": { "wifi5": 1, "wifi6e": 1, "wifi7": "up to 3 bands" },
      "qualifier": "normative",
      "regulatoryDomain": null,
      "note": "Device capability varies; see MLO modes.",
      "headline": true,
      "claimIds": { "wifi5": "links-wifi5", "wifi6e": "links-wifi6e", "wifi7": "mlo-links-wifi7" }
    }
  ],
  "sections": [
    { "id": "mlo-modes", "heading": "MLO modes: STR, NSTR, EMLSR, EMLMR", "body": "...", "sceneState": "modes-compare" }
  ]
}
```

## Example claims (abridged `content/claims.json`)

A stated input and a derived figure. Locators and excerpts shown here are placeholders: real values
are filled in, and checked against the standard, during the accuracy gate.

```json
{
  "claims": [
    {
      "id": "eht-nsd-320",
      "statement": "Data subcarriers in a 320 MHz Wi-Fi 7 (EHT) channel",
      "value": 3920,
      "unit": "subcarriers",
      "kind": "technical",
      "method": "stated",
      "sources": [
        { "referenceId": "ieee-80211be", "locator": "<clause/table of EHT tone plan parameters>", "excerpt": null }
      ],
      "derivation": null,
      "verification": { "verifiedOn": null, "verifiedBy": null, "notes": null }
    },
    {
      "id": "wifi7-peak-phy",
      "statement": "Wi-Fi 7 peak PHY rate: 16 spatial streams, 320 MHz, 4096-QAM 5/6, 0.8 µs guard interval",
      "value": 46.1,
      "unit": "Gbps",
      "kind": "technical",
      "method": "derived",
      "sources": [
        { "referenceId": "ieee-80211be", "locator": "<clause/table of EHT MCS and data rates>", "excerpt": null }
      ],
      "derivation": {
        "formula": "phyRate",
        "inputs": { "nss": "eht-max-nss", "nsd": "eht-nsd-320", "bits": "eht-4096qam-bits", "codingRate": "eht-max-coding-rate", "symbolUs": "he-eht-symbol-us", "giUs": "he-eht-min-gi-us" },
        "rounding": { "decimals": 1, "unit": "Gbps" },
        "explanation": "Streams × data subcarriers × bits per subcarrier × coding rate ÷ (symbol + guard interval)"
      },
      "verification": { "verifiedOn": null, "verifiedBy": null, "notes": "Specified in the standard; not in current certified devices." }
    }
  ]
}
```

## Inline markup in `body` / `deepDive` / `bottomLine`

| Markup | Meaning | Renders as |
|--------|---------|-----------|
| `[[term-id]]` | Glossary term | Underlined term with accessible popover definition |
| `[[term-id\|display text]]` | Glossary term, custom text | Same |
| `{{claim-id}}` | Claim citation (required for every number or normative statement) | Superscript button opening the provenance panel for that claim |
| `{{ref:reference-id}}` | Background reading (never for numbers) | Superscript link to the References tab entry |
| `**text**` | Emphasis | `<strong>` |
| Blank line | Paragraph break | `<p>` |

No raw HTML is allowed in content; the renderer escapes everything else.

## Compatibility

- Adding fields is non-breaking; the validator ignores unknown fields with a warning.
- Renaming/removing fields or changing an `id` is breaking: update all references and the
  matching scene module in the same change.
