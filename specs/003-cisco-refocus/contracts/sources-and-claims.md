# Contract: Sources, Claims and Cisco Naming

## Allowed sources

| Tier | Publishers | May source |
|---|---|---|
| 1 | IEEE, Wi-Fi Alliance, IETF, FCC, ECC/CEPT, ETSI, ISED, Ofcom, NIST | Every claim kind; required for `technical` |
| cisco | Cisco public documentation (`www.cisco.com`, `documentation.meraki.com`), open without login | `platform` claims; extra source on `technical` |
| 2 | Peer-reviewed (DOI), FDA, AAMI, WHO | `context` claims only |

Not allowed: other vendors, Cisco community or Learning Network posts, Cisco marketing pages, event
decks, model data sheets, gated or partner-only material, blogs, news, forums, Wikipedia, AI text.

## Claim record (additions)

```json
{
  "id": "cisco-afc-standard-power",
  "kind": "platform",
  "statement": "Cisco networks can run 6 GHz at standard power through AFC, on both the controller-based platform and the Meraki dashboard.",
  "sources": [{ "referenceId": "cisco-afc-faq", "location": "What is AFC; platform support", "excerpt": "…verbatim…" }],
  "method": "stated",
  "verification": { "verifiedOn": "YYYY-MM-DD", "verifiedBy": "…" }
}
```

## Validator rules (new or changed)

| Rule | Check |
|---|---|
| 13 | `cisco` references: allowlisted domain, `access: "open"`, `edition` and `checkedOn` present |
| 14a | `technical` claims have ≥ 1 Tier 1 source |
| 14b | `platform` claims have ≥ 1 `cisco` source |
| 7 | Vendor denylist (Cisco and Meraki removed) |
| 7a | Model-number patterns: no match in audience-visible strings |
| 11 | `deepDive`, `caption.technical`, `hotspots[].technical` MUST NOT be present |
| 3 | Feature chapters 2–4 steps; 7 clicker chapters |
| 26 | Feature chapters have `sinceWifi6` with `wifi7` and at least one of `wifi6`/`wifi6e`, all cited |
| 27 | `cisco` blocks cite only `platform` claims |

## Display

Citations render in the side panel, hotspot cards and References only. Cisco references appear in
References under their own heading, "Cisco public documentation", after Tier 1.
