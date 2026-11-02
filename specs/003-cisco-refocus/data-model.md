# Data Model: Refocused, Simpler Wi-Fi 7 Talk

**Feature**: 003-cisco-refocus | **Date**: 2026-11-02

Changes against the 002 data model. Anything not listed is unchanged.

## Tab (chapter)

| Field | Change | Rule |
|---|---|---|
| `order` | Renumbered | Clicker path: 1 overview, 2 spectrum, 3 data rates, 4 MLO, 5 TWT, 6 security, 7 closing; 8 references (off path). Exactly 8 tabs. |
| `compareGenerations` | Changed | Feature chapters: subset of `wifi6`, `wifi6e`, `wifi7`; MUST include `wifi7` and one of `wifi6`/`wifi6e`; MUST NOT include `wifi5`. |
| `sinceWifi6` | **New** (feature chapters) | `{ wifi6, wifi6e, wifi7 }`: one plain sentence each, with `{{claim}}` citations; `"No change"` style wording allowed but MUST still cite a source. Shown in the side panel. Replaces `lineage` for these chapters. |
| `beats` | Count changed | Feature chapters: 2–4 (3 default), still covering the five-part arc via `type` + `covers`. Closing: 2–4. |
| `keyFigures` | Limit | ≤ 3 per chapter. Qualifier values unchanged. |
| `wifi7Adds`, `lineage` | Superseded | Replaced by `sinceWifi6` on feature chapters. |

## Beat (step)

| Field | Change | Rule |
|---|---|---|
| `deepDive` | **Removed** | MUST NOT be present. |
| `caption.technical` | **Removed** | MUST NOT be present. Headline ≤ 8 words, takeaway ≤ 16 unchanged. |
| `hotspots[].technical` | **Removed** | MUST NOT be present; hotspot keeps definition and figure. |
| `sections[]` with technical content | Removed | Plain sections only. |
| `questions[].followUp` | **New** (optional boolean) | `true` marks a question whose full answer belongs to a follow-up session; the answer still gives a short plain reply. |
| `cisco` | **New** (optional) | `{ feature, text }`: a named Cisco platform feature and one plain sentence with `{{claim}}` citations to `platform` claims. Shown in the side panel. |

## Claim

| Field | Change | Rule |
|---|---|---|
| `kind` | New value `platform` | `technical` and `context` unchanged. `platform` = a statement about what Cisco networks support or Cisco deployment guidance. |
| sources | Rule | `technical`: ≥ 1 Tier 1 source (Cisco may be an extra source). `platform`: ≥ 1 `cisco` source. `context`: Tier 1 or Tier 2. |
| `verification` | Unchanged | `verifiedOn`, `verifiedBy` required for release; Cisco links re-checked open. |

## Reference

| Field | Change | Rule |
|---|---|---|
| `publisher` | New value `cisco` | Domains `www.cisco.com`, `cisco.com`, `documentation.meraki.com`. |
| `tier` | New tier value `"cisco"` (not numeric) | Matches the publisher entry in `source-policy.json`. |
| `access` | Rule | `cisco` references MUST be `open`. |
| `edition` / `checkedOn` | Required for `cisco` | Document revision or release (for example "IOS XE 17.18.x", "rev 10.0") and the date it was read. |

## Source policy

New publisher entry `cisco` (name "Cisco public documentation", tier `"cisco"`, domains above, use
"Cisco platform features and deployment guidance; never the only source for a standards figure").
New field `platformKindTier: "cisco"`.

## Naming rules (validator)

- Denylist: "Cisco" and "Meraki" removed; all other vendors remain.
- New `tests/content/model-patterns.txt`: regular expressions for Cisco hardware model names and
  numbers (access points, controllers, switches) and release numbers. Any match in an
  audience-visible string is an error. Claim records' `location`/`edition` fields are exempt.

## Generations

Unchanged data. `wifi6e` gains `peakSameAs: "wifi6"` only if the comparison figures need it;
otherwise the claim note carries "6E adds spectrum, not a higher peak".

## Removed entities

Tabs `06-density`, `07-latency`; scenes `density`, `latency`; scenarios used only by them; claims
used only by them (orphan check, rule 18).
