# Feature Specification: Wi-Fi 7 Healthcare Explainer

**Feature Branch**: `001-wifi7-healthcare-explainer`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "Build out a web page to help highlight the features and benefits of Wi-Fi 7
and how they compare and improve upon Wi-Fi 6 and previous. Vendor neutral, visually appealing and
animated (three.js), tailored to healthcare use cases, one tab per feature, each tab an animated story
of what the feature does, how it works, and how it improves on previous generations. Features: 6 GHz
spectrum, MLO, 4K-QAM & preamble puncturing, WPA3, Target Wake Time and battery life, client density,
bandwidth and PoE; plus 320 MHz channels, Multi-RU, Restricted TWT, low/predictable latency, MLO modes
(STR/EMLSR/EMLMR), 16 spatial streams / 46 Gbps peak, an overview tab and a Wi-Fi 8 (802.11bn) roadmap
tab. Local HTML pages for now, transferable to a hosted website later."

## User Scenarios & Testing *(mandatory)*

### Primary audience

- **Healthcare IT / network engineers** evaluating or justifying a Wi-Fi 7 upgrade.
- **Clinical and executive leadership** (CNO, CMIO, CIO) who need the "why" without the jargon.
- **Biomedical / clinical engineering** staff responsible for wireless medical devices.

### User Story 1 - Follow the Wi-Fi 7 story from the overview (Priority: P1)

A viewer opens the page, lands on an Overview tab that sets the scene (a busy hospital whose wireless
network is under growing pressure), sees the generational timeline from Wi-Fi 4 to Wi-Fi 7, and is
guided to the feature tabs in a recommended order.

**Why this priority**: Without the frame and navigation, individual feature tabs have no story to
belong to. Overview + tab navigation + one feature tab is the smallest useful product.

**Independent Test**: Open the page locally, read the Overview, and navigate to every tab using mouse
and keyboard alone; confirm the recommended "next" path visits every tab once.

**Acceptance Scenarios**:

1. **Given** the page is opened locally, **When** it finishes loading, **Then** the Overview tab is
   shown with an animated scene and a visible list of all feature tabs.
2. **Given** any tab is active, **When** the viewer selects "Next", **Then** the next tab in the
   recommended story order opens; the last tab offers a return to the Overview.
3. **Given** a viewer uses only the keyboard, **When** they move between tabs, **Then** focus,
   selection, and the active tab are visibly indicated and every tab is reachable.
4. **Given** a viewer copies the address of a specific tab, **When** that address is opened later,
   **Then** the same tab opens directly.

---

### User Story 2 - Learn one feature through an animated, step-by-step story (Priority: P1)

A viewer opens a feature tab (e.g., Multi-Link Operation) and steps through five story beats — the
healthcare problem, what the feature is, how it works, how it improves on earlier Wi-Fi, and why it
matters in healthcare — with a 3D animation that changes at each beat.

**Why this priority**: This is the core teaching experience the project exists to deliver.

**Independent Test**: On any single feature tab, step forward and back through all five beats; the
text and animation stay in sync and each beat is understandable without the others.

**Acceptance Scenarios**:

1. **Given** a feature tab is open, **When** the viewer presses Play, **Then** the story advances
   through its five beats automatically, with the animation matching the current beat's text.
2. **Given** the story is playing, **When** the viewer presses Pause, Step back, Step forward, or
   Replay, **Then** the animation and text respond immediately and stay synchronized.
3. **Given** any beat that describes a mechanism, **When** the viewer reads it, **Then** every
   technical term is defined in plain language at first use on that tab, with optional deeper
   technical detail available on demand (e.g., expandable "Under the hood" panel).

---

### User Story 3 - Compare Wi-Fi 7 to earlier generations side by side (Priority: P1)

On each feature tab the viewer toggles a comparison view to see how Wi-Fi 6/6E (and where useful
Wi-Fi 5 and 4) handled the same situation, then watches the Wi-Fi 7 version.

**Why this priority**: The project's purpose is to show improvement; without comparison the benefit
is not demonstrated.

**Independent Test**: On each feature tab, switch between generations; confirm the scene changes,
the generation is labeled with both its Wi-Fi Alliance name and IEEE amendment, and key figures
update.

**Acceptance Scenarios**:

1. **Given** a feature tab, **When** the viewer selects a generation (e.g., Wi-Fi 6), **Then** the
   animation shows that generation's behavior and a figure panel shows its relevant values.
2. **Given** any comparison, **When** a value is a theoretical maximum, **Then** it is labeled as
   theoretical and distinguished from typical real-world values.
3. **Given** a feature that existed before Wi-Fi 7 (6 GHz, TWT, WPA3, preamble puncturing), **When**
   the comparison is shown, **Then** the tab names the generation that introduced it and states
   precisely what Wi-Fi 7 adds.
4. **Given** the viewer moves between tabs, **When** they look at generation colors, **Then** each
   generation uses the same color on every tab.

---

### User Story 4 - Connect each feature to a healthcare scenario (Priority: P2)

A clinical leader reads a tab and sees a concrete hospital situation (e.g., a nurse's voice badge
call dropping while walking between units, or telemetry alarms delayed during a crowded shift
change) and how the feature changes the outcome.

**Why this priority**: Healthcare relevance is the differentiator, but the technical story must
exist first.

**Independent Test**: For each tab, a reviewer identifies the named healthcare scenario, the devices
involved, and the stated benefit, and confirms no clinical-outcome or compliance guarantees are made.

**Acceptance Scenarios**:

1. **Given** any feature tab, **When** the "problem" beat is shown, **Then** it describes a specific
   healthcare scenario with named device types (e.g., infusion pumps, telemetry, voice badges,
   mobile workstations, imaging, RTLS tags, telehealth carts).
2. **Given** any healthcare claim, **When** reviewed, **Then** it is phrased as enabling/supporting
   and does not promise clinical outcomes or regulatory compliance.

---

### User Story 5 - Use the page on limited hardware or with accessibility needs (Priority: P2)

A viewer on an older hospital workstation, a phone, a browser without 3D support, or with
reduced-motion preferences still gets the complete story.

**Why this priority**: Hospital hardware varies widely; the story must reach everyone.

**Independent Test**: Open the page with 3D graphics disabled and with reduced motion enabled;
confirm every tab's full story is still available through static visuals and text.

**Acceptance Scenarios**:

1. **Given** 3D graphics are unavailable, **When** a tab opens, **Then** a static or 2D illustration
   and all text are shown, with a brief notice explaining why.
2. **Given** reduced motion is requested, **When** a tab opens, **Then** animations do not auto-play
   and transitions are minimal, while the step controls still work.
3. **Given** a screen reader user, **When** a scene is shown, **Then** a text description of what
   the animation depicts is available for each beat.

---

### User Story 6 - Present the story live to a group (Priority: P3)

A network manager presents to a hospital leadership meeting on a conference-room display, using
fullscreen presentation mode and a handheld clicker to advance through beats and tabs.

**Why this priority**: Live presentation is a key use of the material, but it builds on the
self-paced experience.

**Independent Test**: Turn on presentation mode, then use only a presentation clicker (or the
arrow/Page Down keys) to walk from the Overview to the last tab.

**Acceptance Scenarios**:

1. **Given** presentation mode is on, **When** the presenter presses "next", **Then** the story
   advances one beat, and moves to the next tab after a tab's last beat.
2. **Given** presentation mode is on, **When** it is viewed on a large display, **Then** the text
   is readable from the back of a typical conference room and the scene fills the available space.
3. **Given** a presenter leaves presentation mode, **When** the page returns to normal view,
   **Then** the same tab and beat are still shown.

---

### User Story 7 - Validate every figure and its sources, and host the site later (Priority: P2)

An engineer or reviewer doubts a figure, such as "46 Gbps". They click it and see the claim, the
reputable source it comes from, the exact clause or table, a short excerpt, how the number was
calculated (e.g., 16 spatial streams × 2,882 Mbps per stream), and when it was last verified.
Before release, the project owner runs one command that rejects any uncited number, disallowed
source, or derived value that doesn't recompute, and produces a provenance report for auditors.
Later, the owner copies the site's files to a web host and it works unchanged.

**Why this priority**: The site will inform infrastructure decisions; every figure has to be
checkable against reputable sources. Raised from P3 at stakeholder request (2026-10-26).

**Independent Test**: Pick five figures at random; for each, the provenance view names a Tier 1
source with a clause/table location and derivation, and an independent reviewer with the source
reaches the same value. Change one derivation input in content and confirm validation fails.
Copy the site folder to a static web host and confirm all tabs work.

**Acceptance Scenarios**:

1. **Given** any figure or citation, **When** the viewer activates it, **Then** a provenance panel
   shows the claim, each source (title, publisher, tier, location, excerpt, link), how the value
   was obtained (stated or derived, with formula and inputs), and the verification date.
2. **Given** a content change that adds a number without a claim citation, cites a source outside
   the allowlist, or breaks a derivation, **When** validation runs, **Then** it fails and names the
   problem.
3. **Given** the References tab, **When** opened, **Then** it explains the source policy (tiers and
   what is excluded) and how figures are derived and verified, and lists every claim with its
   status.
4. **Given** a release build, **When** any claim is unverified or was verified more than 12 months
   earlier, **Then** release validation fails.
5. **Given** the site folder, **When** it is placed on a static web host without changes, **Then**
   all tabs, animations, and links work.

---

### User Story 8 - Get the right depth for a leadership or technical audience (Priority: P2)

A CIO opens the site and sees each step's plain-language story plus a short "Bottom line" on
impact, risk and planning. A network engineer switches to Technical view and sees the same story
with protocol detail expanded and the full figures table. A presenter in a mixed room switches
views live as questions come up.

**Why this priority**: The audience is mixed; without layering, the content is either too shallow
for engineers or too dense for leaders. It builds on the story engine (US2).

**Independent Test**: On any feature tab, switch between Leadership and Technical views; the beat,
scene and position stay the same, while the Bottom line, Under the hood, deep sections and figures
change as specified; the view survives a reload and a shared link.

**Acceptance Scenarios**:

1. **Given** a first-time visitor, **When** the site opens, **Then** Leadership view is active and
   each feature-tab beat shows its Bottom line.
2. **Given** Technical view, **When** a feature tab opens, **Then** Under the hood text and deep
   sections are expanded and all key figures are shown.
3. **Given** either view, **When** the viewer switches during presentation mode, **Then** the
   current tab and beat are unchanged.
4. **Given** a link containing `view=technical`, **When** it is opened, **Then** Technical view is
   active.

---

### User Story 9 - Trust the site and its repository (Priority: P2)

A hospital security reviewer inspects the site before it is hosted on the intranet and finds a
strict content security policy, no third-party code, no network calls, and documented hosting
headers. The project owner knows that nothing reaches `main` without passing automated checks.

**Why this priority**: The site will be hosted on clinical networks; it must pass a security
review, and the repository must resist accidental or malicious changes.

**Independent Test**: Open every tab from a local file and from a web host with CSP violation
reporting on — zero violations; try to push directly to `main` — rejected; open a pull request
with a failing test — merge blocked.

**Acceptance Scenarios**:

1. **Given** any tab, **When** it is loaded, **Then** the browser reports zero CSP violations and
   no network requests.
2. **Given** content containing `<script>` or HTML, **When** it is rendered, **Then** it appears
   as plain text.
3. **Given** a direct push or force push to `main`, **When** attempted, **Then** it is rejected.
4. **Given** a pull request with a failing required check or a newly added dependency with a
   high/critical vulnerability, **When** merge is attempted, **Then** it is blocked.

---

### Edge Cases

- 3D graphics unavailable or the graphics context is lost mid-animation → fall back to static view
  for that tab without losing the viewer's place in the story.
- Very small screens (360 px wide) or portrait phones → scene and text stack vertically; controls
  remain usable by touch.
- Very large / presentation displays → layout scales and text remains readable from a distance.
- Viewer switches tabs rapidly → only the active tab's animation runs; no slow-down accumulates.
- Browser tab hidden or minimized → animation pauses and resumes where it left off.
- Page opened with no internet connection → everything still works (see FR-030).
- Regional differences (e.g., amount of 6 GHz spectrum available varies by country) → the 6 GHz tab
  states which regulatory domain its figures use and notes that availability varies.
- Features in the standard but not in current products (16 spatial streams, 46 Gbps) → always
  labeled "specified in the standard; not in current devices."

## Requirements *(mandatory)*

### Functional Requirements

**Structure & navigation**

- **FR-001**: The site MUST present the following tabs, in this recommended story order:
  1. Overview — the hospital scene, why wireless demand is rising, Wi-Fi 4→7 timeline.
  2. 6 GHz Spectrum & 320 MHz Channels.
  3. Multi-Link Operation (MLO), including an "MLO modes" deeper section.
  4. 4K-QAM, Preamble Puncturing & Multi-RU.
  5. Security: WPA3 and Wi-Fi 7 security requirements.
  6. Target Wake Time, Battery Life & Restricted TWT.
  7. Client Density.
  8. Low & Predictable Latency.
  9. Bandwidth, Peak Rates & PoE / Wired Infrastructure.
  10. What's Next: Wi-Fi 8 (IEEE 802.11bn).
  11. References & Glossary.
- **FR-002**: Every tab MUST be reachable by mouse, touch, and keyboard, and MUST provide
  "Previous" / "Next" navigation following the story order.
- **FR-003**: Each tab MUST have its own shareable address that opens that tab directly.
- **FR-004**: The currently active tab MUST be clearly indicated, and viewers MUST be able to see
  their progress through the story (e.g., "Tab 4 of 11").

**Story & animation (every feature tab, i.e., tabs 2–9)**

- **FR-005**: Each feature tab MUST present five story beats in order: (1) the healthcare problem,
  (2) what the feature is, (3) how it works, (4) how it improves on earlier generations, (5) why it
  matters in healthcare.
- **FR-006**: Each feature tab MUST have a 3D animated scene that changes for each beat and depicts
  the actual mechanism (spectrum, links, symbols, frames, sleep schedules, power budgets), not
  decoration alone.
- **FR-007**: Each feature tab MUST provide Play/Pause, Step back, Step forward, and Replay controls;
  text and animation MUST remain synchronized.
- **FR-008**: Each feature tab MUST provide a generation comparison (Wi-Fi 7 vs Wi-Fi 6/6E at
  minimum; Wi-Fi 5 and Wi-Fi 4 where they aid the story), using both Wi-Fi Alliance names and IEEE
  amendment names (802.11n/ac/ax/be), and a consistent color per generation site-wide.
- **FR-009**: Each feature tab MUST include a short "Key figures" panel comparing generations, with
  theoretical maximums labeled "theoretical" and optional features labeled "optional".
- **FR-010**: Each feature tab MUST provide plain-language explanations first, with deeper
  technical detail available on demand, and MUST define jargon at first use on that tab.
- **FR-011**: Each feature tab MUST name at least one healthcare scenario and the device types
  involved, and MUST NOT claim clinical outcomes or regulatory compliance.

**Per-tab content requirements**

- **FR-012 Overview**: MUST introduce the hospital setting and the growth of wireless clinical
  devices, show a Wi-Fi 4 → 5 → 6 → 6E → 7 timeline with years and IEEE names, and preview each
  feature tab in one sentence.
- **FR-013 6 GHz & 320 MHz**: MUST show the 2.4, 5, and 6 GHz bands to scale; explain that 6 GHz was
  first opened to Wi-Fi with Wi-Fi 6E; show channel counts per width; show 320 MHz channels
  (Wi-Fi 7, 6 GHz only) as double Wi-Fi 6E's widest 160 MHz channel; explain cleaner spectrum (no
  legacy devices) and shorter range/wall penetration trade-offs; and state the regulatory domain
  used for figures and that availability varies by country.
- **FR-014 MLO**: MUST show how earlier generations connect a client on one band at a time versus
  Wi-Fi 7 using multiple links across bands simultaneously or with fast switching; illustrate
  aggregation, redundancy, and instant failover when one band is congested. The "MLO modes" section
  MUST explain STR (simultaneous transmit and receive), NSTR, EMLSR (enhanced multi-link single
  radio), and EMLMR (enhanced multi-link multi-radio), and why battery-powered devices such as
  phones and badges typically use different modes than laptops or access points.
- **FR-015 4K-QAM, Puncturing & Multi-RU**: MUST visualize constellation density from 256-QAM
  (Wi-Fi 5) to 1024-QAM (Wi-Fi 6) to 4096-QAM (Wi-Fi 7) with bits per symbol and the ~20% peak-rate
  gain, and its need for strong signal / short range; MUST show how preamble puncturing lets a wide
  channel be used around a narrow interferer (including that it was optional and limited in Wi-Fi 6);
  MUST show Multi-RU letting one client receive multiple non-adjacent resource units versus one RU
  per client in Wi-Fi 6.
- **FR-016 Security**: MUST explain WPA3 (SAE, protection against offline password guessing, forward
  secrecy, Enhanced Open/OWE), compare with WPA2's weaknesses, state that WPA3 or OWE is required on
  6 GHz, and describe Wi-Fi 7 certification security requirements (e.g., WPA3 required, stronger
  cipher suites, beacon protection) as stated by the Wi-Fi Alliance; MUST connect to protecting
  clinical and medical-device traffic without claiming compliance.
- **FR-017 TWT & Restricted TWT**: MUST show a device timeline comparing always-listening (pre-TWT)
  behavior with scheduled wake windows; state TWT's origin (802.11ah, brought to mainstream Wi-Fi
  with Wi-Fi 6); illustrate battery-life impact for badges, sensors, and RTLS tags; and show
  Restricted TWT (Wi-Fi 7) reserving protected service periods for latency-sensitive traffic such as
  voice and telemetry.
- **FR-018 Client Density**: MUST depict a crowded hospital space (e.g., ED at shift change) with
  many devices; compare how contention is handled across generations (OFDMA and BSS coloring from
  Wi-Fi 6, plus Wi-Fi 7's wider channels, MLO load balancing, Multi-RU, and puncturing); and relate
  density to device counts per patient bed.
- **FR-019 Low & Predictable Latency**: MUST tell a story combining MLO, Restricted TWT, and Multi-RU
  to show reduced average and worst-case (tail) latency, with scenarios such as telemetry alarms,
  voice calls, and remotely supported procedures; MUST distinguish average latency from
  predictability (jitter/worst-case).
- **FR-020 Bandwidth, Peak Rates & PoE**: MUST compare theoretical peak PHY rates per generation
  (including Wi-Fi 7's 46 Gbps with 16 spatial streams, labeled "specified in the standard; not in
  current devices") against realistic per-client throughput; explain the resulting demand on wired
  uplinks (multi-gigabit Ethernet) and on PoE power budgets (IEEE 802.3af/at/bt classes) for
  access points; and relate this to switch and cabling planning in hospitals.
- **FR-021 Wi-Fi 8**: MUST describe IEEE 802.11bn ("Ultra High Reliability") as in development,
  summarize its stated goals in neutral terms, and clearly mark all content as forward-looking and
  subject to change.
- **FR-022 References & Glossary**: MUST list every source cited across tabs, and a glossary of
  every term defined across tabs.

**Neutrality & accuracy**

- **FR-023**: The site MUST NOT contain vendor names, logos, product names, model numbers, or
  proprietary feature names, in text or imagery.
- **FR-024**: Every numeric or normative claim MUST link or map to an entry in References, through
  a recorded claim (see FR-046–FR-053).
- **FR-025**: All copy, figures, and sources MUST be maintainable separately from the animation
  logic, so a fact can be corrected without changing a scene.

**Accessibility, resilience & delivery**

- **FR-026**: The site MUST meet WCAG 2.2 AA, including keyboard-operable tabs, visible focus,
  sufficient contrast, and a text description of each animated beat.
- **FR-027**: When reduced motion is requested, animations MUST NOT auto-play and transitions MUST be
  minimal; all content MUST remain available.
- **FR-028**: When 3D graphics are unavailable, each tab MUST show a static/2D alternative with all
  text intact.
- **FR-029**: Only the active tab's animation may run; animations MUST pause when the browser tab is
  hidden.
- **FR-030**: The site MUST run without an internet connection — no external network requests at
  runtime — and MUST NOT collect personal data or use tracking.
- **FR-031**: Viewers MUST be able to open the site locally by double-clicking the entry HTML file,
  with no web server, installation, or other software beyond a supported browser; every tab,
  animation, and shareable tab address MUST work when opened this way.
- **FR-032**: The same files MUST work unchanged when copied to a static web host.
- **FR-033**: The site MUST support both self-paced reading (the default) and a presentation mode
  for live group sessions. Presentation mode MUST provide fullscreen display, larger text sized for
  reading across a room, and advancing through beats and tabs with keyboard keys commonly used by
  presentation clickers (arrow keys, Page Up/Page Down, Space). Turning it on or off MUST NOT change
  the viewer's place in the story.
- **FR-034**: Layout MUST work from 360 px wide phones to large displays, in light and dark
  appearance (or a single theme with verified AA contrast).

**Audience layering**

- **FR-035**: The site MUST offer a view switch with two options, **Leadership** (default) and
  **Technical**. Both views show the same tabs, beats, animations, and shared plain-language text;
  only the extra layer differs. The current view MUST be shown on screen at all times.
- **FR-036**: Every feature-tab beat MUST have a leadership "Bottom line" (≤ 40 words: impact,
  risk, cost, or planning implication) shown in Leadership view. Every feature tab MUST have
  technical depth (per-beat "Under the hood" text and any deep sections such as MLO modes) that is
  expanded by default in Technical view and collapsed but still available in Leadership view.
- **FR-037**: In Leadership view, the key-figures panel MUST show only the figures marked as
  headline (2–3 per tab) with a "Show all figures" option; Technical view shows all figures.
- **FR-038**: The view MUST be carried in the shareable address (`view=leadership|technical`),
  remembered for the viewer, and switchable during presentation mode without losing the current
  tab and beat.

**Application security**

- **FR-039**: The page MUST enforce a Content-Security-Policy that allows scripts, styles, and
  images only from the site's own files, blocks inline script and `eval`, blocks all network
  connections, plugins, and form submissions, and MUST work identically from a local file and a
  web host with zero policy violations.
- **FR-040**: All text from content files MUST be escaped before display; content MUST NOT be able
  to inject markup, script, or links other than the controlled citation and glossary forms.
  External reference links MUST open in a new tab with `rel="noopener noreferrer"`, and the page
  MUST send no referrer (`no-referrer` policy).
- **FR-041**: Browser storage MUST hold only theme, motion, and view preferences; all reads and
  writes MUST tolerate storage being unavailable.
- **FR-042**: The project MUST document recommended response headers for web hosting (CSP,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `frame-ancestors 'none'` /
  `X-Frame-Options: DENY`, `Permissions-Policy` disabling unused features).

**Data accuracy & provenance**

- **FR-046**: Every numeric or normative statement shown anywhere (beat text, Bottom line, Under
  the hood, key figures, scene labels, scenario cards) MUST be backed by a recorded **claim** with
  ≥ 1 source, the exact location in each source (clause, table, section, or page), and its
  method: *stated* (value appears in the source), *derived* (computed from cited inputs, with the
  formula shown), or *illustrative* (a non-measured visual, labeled "illustrative" on screen).
- **FR-047**: Only reputable sources may be cited. Tier 1 — standards bodies and regulators
  (IEEE, Wi-Fi Alliance, IETF, FCC, ECC/CEPT, ETSI, ISED, Ofcom, NIST) — is required for every
  technical claim. Tier 2 — peer-reviewed publications with a DOI, and government or standards
  bodies for healthcare context (FDA, AAMI, WHO) — is allowed for healthcare context and
  corroboration. Vendor material, Wikipedia, blogs, forums, news articles, and AI-generated text
  MUST NOT be cited. The allowed publishers and their web domains MUST be kept in a single,
  reviewable list.
- **FR-048**: Derived values (e.g., peak PHY rates, channel counts) MUST be recomputed
  automatically from their cited inputs during validation, and validation MUST fail if the
  displayed value differs from the recomputed value beyond stated rounding.
- **FR-049**: Every claim MUST record when it was verified and by whom (initials or role). Release
  validation MUST fail if any claim is unverified, verified more than 12 months before the build
  date, or relies on a source marked superseded without an explanation.
- **FR-050**: From any figure or citation, viewers MUST be able to open a provenance panel showing
  the claim, its sources (title, publisher, tier, location, excerpt, link), the method and any
  derivation, and the verification date. Leadership view shows a short form (source and date)
  with "How we know this" to expand; Technical view shows the full panel.
- **FR-051**: The References tab MUST include the source policy, a plain-language explanation of
  how figures are derived and verified, and a register of every claim (statement, value, method,
  sources, verified date) filterable by tab.
- **FR-052**: The project MUST generate a provenance report (every claim with sources, locations,
  derivations and verification status) for offline review by auditors; CI MUST fail if the
  committed report is out of date with the content.
- **FR-053**: Reference links MUST be checked for availability on a schedule (outside the site
  itself, which makes no network requests), and broken links MUST be reported for repair.

**Repository & merge security**

- **FR-043**: Changes MUST reach `main` only through pull requests; direct pushes, force pushes,
  and branch deletion on `main` MUST be blocked.
- **FR-044**: Every pull request MUST pass required automated checks before merge: content
  validation and unit tests, build (including bundle-size limit), end-to-end tests including
  accessibility and CSP-violation checks, dependency vulnerability audit (fail on high/critical),
  dependency review of newly added packages, and static code scanning.
- **FR-045**: The repository MUST enable secret scanning with push protection and automated
  dependency update pull requests for npm packages and CI actions; CI actions MUST be pinned to
  full commit SHAs and run with read-only default permissions.

### Key Entities

- **Generation**: A Wi-Fi generation (Wi-Fi 4/5/6/6E/7/8) — Wi-Fi Alliance name, IEEE amendment,
  approximate year, signature color, status (ratified / in development).
- **Feature Tab**: One story unit — title, order, five story beats, comparison generations, key
  figures, healthcare scenario(s), glossary terms used, references used.
- **Story Beat**: One step of a tab's story — beat type (problem / what / how / improvement / why
  it matters), plain-language text, optional deep-dive text, scene state, text description of the
  animation for assistive technology.
- **Key Figure**: A comparable value — metric, value per generation, unit, qualifier (theoretical,
  typical, optional, regulatory-domain-specific), and the claim behind each value.
- **Claim**: One checkable statement or value — statement, value and unit, method (stated /
  derived / illustrative), sources with exact locations and short excerpts, derivation (formula
  and inputs, which are themselves claims), verification date and verifier.
- **Healthcare Scenario**: A clinical setting and situation — location (ED, ICU, med-surg, imaging),
  device types, problem, outcome supported.
- **Reference**: A reputable source — title, publisher (from the allowlist), tier (1 or 2),
  identifier (standard number, docket, or DOI), edition/date, status (current or superseded),
  access (open or paywalled), link.
- **Glossary Term**: Term, plain-language definition, tabs where it appears.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 11 tabs are present and each feature tab (2–9) contains all five story beats, a
  generation comparison, a key-figures panel, and a named healthcare scenario (100% of tabs).
- **SC-002**: In a review with at least 5 representative viewers (mix of clinical and IT), at least
  80% can correctly explain in one sentence what each of MLO, 6 GHz, TWT, and 4K-QAM does and one way
  it improves on Wi-Fi 6 after viewing the relevant tab.
- **SC-003**: 100% of numeric and normative claims trace to a listed neutral reference; 0 vendor
  names, logos, or product names appear (verified by a review pass).
- **SC-004**: A viewer can reach any tab from any other tab in 2 actions or fewer.
- **SC-005**: The first tab is readable within 3 seconds of opening on a typical hospital
  workstation; animations play smoothly (no visible stutter) on a mid-range laptop and remain usable
  on a modern mid-range phone.
- **SC-006**: Every tab's full story is understandable with 3D graphics disabled and with reduced
  motion enabled (verified by walking through all tabs in both modes).
- **SC-007**: An automated accessibility check reports zero WCAG 2.2 AA violations, and every tab is
  completable using only the keyboard.
- **SC-008**: The site works with the network disconnected, and works unchanged after being copied to
  a static web host (verified by both tests).
- **SC-009**: Correcting a single figure requires editing content only, in one place, with no change
  to animation logic.
- **SC-010**: In the comprehension review (SC-002), leadership reviewers using Leadership view and
  technical reviewers using Technical view each rate the content's depth as "about right" in at
  least 80% of responses.
- **SC-011**: Zero Content-Security-Policy violations are reported on any tab in any target
  browser, from both a local file and a web host; at release, dependency, code, and secret scans
  have zero open high or critical findings.
- **SC-012**: 100% of changes merged to `main` after setup arrive through pull requests with all
  required checks passing (verifiable from repository history and settings).
- **SC-013**: 100% of displayed numbers and normative statements map to a verified claim; 100% of
  technical claims have a Tier 1 source with a clause/table location; 0 citations to sources
  outside the allowlist; 100% of derived values recompute exactly (within stated rounding).
- **SC-014**: In a spot check of 10 randomly chosen figures, an independent reviewer with access
  to the cited sources reproduces 10 of 10 values using only the provenance panel's information.

## Assumptions

- Audience is mixed (clinical leadership, biomed, network engineers). Rather than two separate
  versions, one story is layered: a shared plain-language core, a leadership "Bottom line", and
  technical depth, switched by a Leadership/Technical view (FR-035–FR-038). Separate versions were
  rejected because they double accuracy-review work, drift apart, and fail mixed-room
  presentations. Leadership is the default because executives are least likely to look for a switch.
- "Typical hospital workstation" (SC-005) means a 4-year-old business laptop or desktop with
  integrated graphics running a current evergreen browser.
- The GitHub repository is public, so branch rulesets, code scanning, secret scanning, and
  dependency review are available at no cost.
- Verifying exact clauses of IEEE standards needs access to the standard text (purchase,
  institutional subscription, or the IEEE GET Program where the amendment is included). Where a
  Tier 1 text isn't accessible, the claim stays unverified and blocks release; it isn't replaced
  with a lower-tier source.
- The verifier is recorded by initials or role (e.g., "TB", "Network architect"); no other
  personal data is stored.
- Healthcare scenarios remain fictional composites and are labeled "illustrative scenario";
  any factual healthcare statistic shown (e.g., devices per bed) needs a claim with a Tier 1 or
  Tier 2 source, otherwise it is stated qualitatively.
- English only for this version; content structure should not prevent translation later.
- Content is a single site with tabs (one entry page plus supporting files), not separate unrelated
  documents; "local HTML pages" is satisfied by a self-contained folder that can be zipped and shared.
- Regulatory figures for 6 GHz default to the United States (FCC, 5.925–7.125 GHz), with a note on
  other regions.
- Wi-Fi 7 is described per IEEE 802.11be and Wi-Fi Alliance Wi-Fi CERTIFIED 7; Wi-Fi 8 per the
  current IEEE 802.11bn project status as of authoring, clearly marked as forward-looking.
- Supported browsers: current evergreen Chrome and Edge (both Chromium). Narrowed on 2026-10-29 by the presenter, who uses only these; Firefox and Safari are no longer tested.
- Healthcare scenarios are illustrative composites; no real facilities, patients, or PHI.
- three.js is the chosen 3D engine (a stakeholder decision recorded in the constitution); the
  remaining technical approach is decided at planning.
- No analytics, user accounts, or saved user data are in scope.
