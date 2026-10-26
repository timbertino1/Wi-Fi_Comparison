# Wi-Fi 7 Explained: A Healthcare Story Constitution

## Core Principles

### I. Vendor Neutrality & Technical Accuracy (NON-NEGOTIABLE)

- The site MUST NOT name, depict, endorse, or imply any equipment vendor, chipset maker, or
  product line. No vendor logos, product imagery, model numbers, or proprietary feature names.
- Every technical claim (data rates, channel widths, modulation orders, latency, power figures,
  security requirements) MUST trace to a neutral primary source: IEEE 802.11 amendments
  (802.11ax, 802.11be, etc.), Wi-Fi Alliance certification material, IEEE 802.3 (PoE), or
  regulatory bodies (e.g., FCC). Sources MUST be listed in a references area of the site.
- Theoretical maximums MUST be labeled as such ("up to", "theoretical PHY rate") and MUST NOT be
  presented as typical real-world throughput.
- Features that are optional in the standard or certification MUST be identified as optional;
  mandatory features MUST NOT be overstated.

Rationale: The audience will use this content to make infrastructure decisions; credibility depends
on neutrality and on numbers that hold up to scrutiny.

### II. Teach by Telling a Story

- Each feature MUST live on its own tab, and each tab MUST follow the same narrative arc:
  1. **The problem** — a healthcare scenario that exposes a limitation of earlier Wi-Fi.
  2. **What it is** — a plain-language definition of the Wi-Fi 7 feature.
  3. **How it works** — an animated, step-by-step explanation of the mechanism.
  4. **How it improves** — explicit before/after versus Wi-Fi 6/6E and earlier.
  5. **Why it matters in healthcare** — the outcome for clinicians, patients, or IT.
- Copy MUST be written for a mixed audience (clinical leadership, biomed, and network
  engineers): lead with plain language, then offer technical depth on demand.
- Audience depth MUST be layered within one story, not split into separate versions: a shared
  plain-language core seen by everyone, a leadership layer (impact, risk, cost, planning), and a
  technical layer (mechanism and protocol detail). Every layer draws on the same facts and
  references.
- Jargon MUST be defined at first use on each tab.

Rationale: The goal is understanding, not a spec sheet. A consistent arc lets learners build a
mental model tab by tab.

### III. Healthcare-Grounded Context

- Every feature tab MUST anchor to at least one concrete healthcare use case (e.g., clinician
  voice-over-Wi-Fi badges and smartphones, infusion pumps, wireless patient telemetry,
  RTLS/asset tags, mobile workstations, imaging transfer, telehealth video, AR/VR training).
- The site MUST NOT make clinical-outcome, patient-safety, or regulatory-compliance guarantees
  (e.g., "ensures HIPAA compliance"). Phrase as enabling or supporting, and note that medical
  device behavior depends on the device manufacturer's validation.
- No real patient data, PHI, or identifiable facility information may appear anywhere.

Rationale: Healthcare is the lens that makes the story relevant; overclaiming in a regulated
domain would undermine trust.

### IV. Generational Comparison

- Each feature tab MUST explicitly compare Wi-Fi 7 (802.11be) against Wi-Fi 6/6E (802.11ax) and,
  where it aids the story, Wi-Fi 5 (802.11ac) and Wi-Fi 4 (802.11n).
- Comparisons MUST use consistent generation naming (both the Wi-Fi Alliance name and IEEE
  amendment) and a consistent visual language (same color per generation across all tabs).
- Where a feature first appeared in an earlier generation (e.g., TWT, WPA3, preamble puncturing,
  6 GHz), the tab MUST state that origin and explain precisely what Wi-Fi 7 adds or changes.

Rationale: Value is only clear relative to what came before; precise lineage prevents the common
error of crediting Wi-Fi 7 with features it inherited.

### V. Purposeful 3D Animation

- three.js is the primary visualization engine. Every animation MUST depict a real mechanism
  (spectrum, links, symbols, frames, sleep schedules, power budgets) — decoration alone is not
  sufficient justification.
- Each tab's scene MUST support a before/after or side-by-side mode showing the earlier
  generation's behavior against Wi-Fi 7.
- Animations MUST be narratively paced and controllable: play/pause, step forward/back, and
  replay for each story beat.
- Scenes MUST be lazy-initialized per tab and disposed (geometries, materials, textures,
  render loop) when a tab is left.

Rationale: Animation is the teaching medium; if it does not explain, it distracts and costs
performance.

### VI. Accessible & Performant by Default

- The page MUST meet WCAG 2.2 AA: keyboard-operable tabs (WAI-ARIA tabs pattern), sufficient
  contrast, visible focus, and text equivalents for every animated concept.
- `prefers-reduced-motion` MUST be honored with static or minimal-motion alternatives that
  convey the same information.
- If WebGL is unavailable, the page MUST degrade to a non-3D presentation (static diagrams or
  2D illustration) with all story content intact.
- Targets: 60 fps on a mid-range laptop integrated GPU, usable at 30 fps on a modern mid-range
  phone; responsive layout from 360 px wide upward; initial load (before first tab scene) under
  3 seconds on a typical broadband connection.

Rationale: Hospital audiences include shared workstations, older hardware, and users with
accessibility needs; the story must reach all of them.

### VII. Simplicity & Static Delivery

- The site MUST be deployable as static files with no backend, database, accounts, analytics
  that collect personal data, or third-party tracking.
- Dependencies MUST be minimal and pinned to exact versions; each added library MUST be
  justified by a need three.js and standard web APIs cannot meet.
- Content (copy, figures, sources) SHOULD be separated from rendering code so facts can be
  reviewed and updated without touching scene logic.

Rationale: Static delivery keeps hosting trivial (including on restricted hospital intranets) and
keeps the project maintainable as Wi-Fi standards evolve.

### VIII. Secure by Default

- The page MUST ship a restrictive Content-Security-Policy that blocks inline script, `eval`, and
  all network connections, and MUST work under it both from local files and from a web host.
- All content MUST be rendered through an escaping renderer; raw HTML from content files is never
  injected. External links MUST open with `rel="noopener noreferrer"`.
- The site MUST NOT store anything beyond non-sensitive viewer preferences, and MUST NOT load
  third-party code, fonts, or assets at runtime.
- Dependencies MUST be pinned, installed from a committed lockfile, and scanned for known
  vulnerabilities; high or critical findings block merges.
- Changes reach `main` only through pull requests that pass the required automated checks
  (build, tests, content validation, dependency and code scanning); direct pushes and force pushes
  to `main` are blocked. Secrets MUST never be committed, with push protection enabled.

Rationale: Hospital IT teams will host and share this site on clinical networks; it must be
trustworthy to deploy, and its repository must resist accidental or malicious changes.

## Content & Technology Constraints

**Required feature coverage** — each item below MUST have its own tab following Principle II:

1. 6 GHz spectrum (including channel availability and why clean spectrum matters)
2. Multi-Link Operation (MLO)
3. 4K-QAM (4096-QAM) & Preamble Puncturing
4. WPA3 and Wi-Fi 7 security requirements
5. Target Wake Time (TWT) and client battery life
6. Client density and its healthcare implications
7. Bandwidth and Power over Ethernet (PoE) / wired-infrastructure impact

Additional tabs MAY be added through the spec process, provided they meet all principles. An
overview/introduction and a references section are expected in addition to feature tabs.

**Technology**:

- three.js (exact pinned version) for 3D scenes; plain HTML/CSS/JavaScript (ES modules) unless
  a spec justifies a build tool or framework under Principle VII.
- Must run in current evergreen browsers (Chrome, Edge, Firefox, Safari) without plugins.
- Visual identity MUST be neutral (no vendor color schemes) and MUST support both light and dark
  presentation or one theme with verified AA contrast.

## Development Workflow & Quality Gates

- Work proceeds through Spec Kit: `/speckit-specify` → `/speckit-clarify` (as needed) →
  `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`. Plans MUST include a Constitution
  Check against Principles I–VIII.
- **Merge gate**: every pull request to `main` MUST pass the required CI checks (Principle VIII)
  before merging; reviews MUST confirm constitution compliance.
- **Security gate**: before release, the CSP MUST produce zero violations in all target browsers,
  and dependency, code, and secret scans MUST report no open high or critical findings.
- **Accuracy review gate**: before a tab is considered done, every numeric or normative claim on
  it MUST be checked against its cited source, and theoretical vs. typical values MUST be
  labeled.
- **Neutrality gate**: a scan of copy and assets for vendor names, logos, and trademarks MUST
  pass before release.
- **Story gate**: each tab MUST demonstrably contain all five narrative beats from Principle II
  and a generational comparison per Principle IV.
- **Accessibility & performance gate**: keyboard navigation, reduced-motion mode, WebGL fallback,
  and frame-rate targets MUST be verified manually or by automated checks before release.

## Governance

- This constitution supersedes other project practices. Where a spec, plan, or task conflicts
  with it, the constitution wins unless the conflict is resolved by amendment.
- Amendments are made via `/speckit-constitution`, MUST include a Sync Impact Report, and MUST
  state the reason for the change.
- Versioning follows semantic versioning: MAJOR for removing or redefining a principle, MINOR
  for adding a principle/section or materially expanding guidance, PATCH for clarifications
  and wording.
- Every plan and review MUST verify compliance; any deliberate deviation MUST be recorded with
  justification in the plan's Complexity Tracking (or equivalent) section.

**Version**: 1.1.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-10-26
