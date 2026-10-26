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
      "referenceIds": ["ieee-80211be"]
    }
  ],
  "sections": [
    { "id": "mlo-modes", "heading": "MLO modes: STR, NSTR, EMLSR, EMLMR", "body": "...", "sceneState": "modes-compare" }
  ]
}
```

## Inline markup in `body` / `deepDive`

| Markup | Meaning | Renders as |
|--------|---------|-----------|
| `[[term-id]]` | Glossary term | Underlined term with accessible popover definition |
| `[[term-id\|display text]]` | Glossary term, custom text | Same |
| `{{ref-id}}` | Citation | Superscript link to References tab entry |
| `**text**` | Emphasis | `<strong>` |
| Blank line | Paragraph break | `<p>` |

No raw HTML is allowed in content; the renderer escapes everything else.

## Compatibility

- Adding fields is non-breaking; the validator ignores unknown fields with a warning.
- Renaming/removing fields or changing an `id` is breaking: update all references and the
  matching scene module in the same change.
