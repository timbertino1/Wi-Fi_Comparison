# Contract: Talk Track

## Generator

| Item | Value |
|------|-------|
| Script | `scripts/talk-track.mjs` |
| Output | `docs/talk-track.md` (committed; never copied into `dist/`) |
| Modes | `node scripts/talk-track.mjs` writes the file; `--check` exits non-zero if the committed file differs from a fresh generation |
| Runs in | `npm run build` (write) and the CI `validate` job (`--check`) |
| Inputs | `content/**` only; no network, no scene code |

## Document layout

```markdown
# Wi-Fi 7 Explained — Talk Track
Generated from `content/` (no date, so output is deterministic). Do not edit; annotate the editable copy instead.

## Contents
1. Why Wi-Fi 7, and why now … 10. What's next: Wi-Fi 8 · Glossary · References

## 1. <Chapter title>
Healthcare scenario: <scenario title> — <summary>

### Step 1 — <caption headline>
**On screen:** <headline> / <takeaway>. <sceneDescription> Hotspots: <term>, <term>.
**Say (leadership):** <heading>. <body as plain Markdown> **Bottom line:** <bottomLine>
**Technical depth:** <caption.technical> <deepDive> <technical hotspot lines>
**Figures:**
| Figure | Value | Source | Where |
|---|---|---|---|
**Likely questions:**
- **Q:** … **A:** …

### Deep sections (chapter-level, Technical)
…

## Glossary
## References (Tier 1, Tier 2)
```

## Rendering rules

- `[[term]]` / `[[term|text]]` → the display text; the first use in each chapter is followed by
  the definition in parentheses.
- `{{claim-id}}` → a bracketed source marker `[S12]` that links to the References section; the
  figure rows show value with qualifier ("up to", "theoretical", "optional", "illustrative").
- `{{ref:id}}` → `[S<n>]` the same way.
- `**text**` → `**text**`.
- No HTML is emitted; output is plain GitHub-flavoured Markdown.

## Coverage check (FR-023, SC-004)

`tests/content/talk-track.test.mjs` walks every string field under `content/` except identifiers,
URLs, dates and enum values, normalises markup as above, and asserts each appears in the generated
document. A missing field fails with its JSON path.

## Editable copy

After the first generation the file is published once as an editable document in the user's
document workspace, titled "Wi-Fi 7 Explained — Talk Track (annotate here)". The generator never
writes to it. When content changes, quickstart step T3 explains how to publish a fresh copy for
comparison; merging annotations is manual (spec Assumptions).
