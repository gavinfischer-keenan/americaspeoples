# Trade, Voyages and Map Clarity Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for central implementation and dispatching-parallel-agents for isolated research; obtain a fresh independent review after integration.

**Goal:** Expand evidence-grounded pre-1200 trade and missing voyage phases, replace statistical hover copy with place descriptions, and smooth ice changes with disclosed interpolation.
**Architecture:** Existing evidence/history/route contracts; descriptive catalog-only tooltip entries; bracketing ice cache plus a pure geometry interpolation module.
**Tech Stack:** TypeScript, SVG, d3-geo/contours, JSON, Python/SQLite and existing self-host pipeline.
**Spec:** docs/superpowers/specs/2026-11-18-trade-voyages-map-clarity.md

## Global Constraints
- User addition: import every usable public shipwreck inventory record within the atlas time span; separate undated wrecks and modern discoveries from loss dates, avoid duplicate/obstruction records, fade losses into persistent background, expose oldest secure dates and major maritime graveyard deep dives. Coverage must be reported honestly against the chosen inventories.
- User additions: map later Inca/Aztec exchange, tribute and redistribution at their actual dates; connect the Norse North Atlantic story and add a L'Anse aux Meadows-focused deep dive; extend Greenland and Iceland from earliest supported histories to 1934.
- Add Northwest Passage and southern passages (Strait of Magellan, Beagle Channel, Cape Horn/Drake Passage) deep dives with high-resolution area maps, licensed photographs and sourced seasonal weather/wave context. Modern climatology must be labeled separately from historical observations.
- Shared clock ends 1934-12-31; trade research prioritizes evidence before 1200 CE, including BCE.
- Preserve source precision and uncertainty; no fabricated direct journeys, trading frequencies or exact ice margins.
- Separate expedition parties and independent activity; unsupported legs stay gaps.
- Preserve noncommercial licensing, protected/generalized archaeology, tooltip accessibility and scoped research edits.

## Review Focus
- California Pacific versus Gulf of California provenance; later networks backdated; goods movement mistaken for direct trade.
- Earlier place evidence presented as contemporaneous habitation; dense tooltips hiding all meaningful names.
- Ice holes/splits, boundary source years, scenario changes, failed/obsolete fetches and out-of-range dates.
- Route chords crossing land and ships following separate shore or flight parties.
- Workbook/release capacity and mobile layout with expanded evidence.

### Task 1: Descriptive map previews
Files: src/map-tooltip.ts, src/map.ts, src/styles.css, tests/map-tooltip.test.ts, tests/map-interaction.browser.mjs and a production-data browser regression.
- [x] Add failing contracts for the Fishing Bridge group, distinct named places, useful descriptions, concise dates and older evidence.
- [x] Implement catalog-only grouped entries and single-place copy, retaining safe DOM text and dismissal behavior.
- [x] Verify focused tests, desktop/phone screenshots and no duplicate/native tooltip.

### Task 2: Stable interpolated ice
Files: src/ice-interpolation.ts, src/physical-data.ts, src/latest-request-cache.ts, src/map.ts, src/main.ts, src/physical-reference.ts, styles, source/third-party docs and ice/cache/browser tests.
- [x] Add failing tests for bracketing, smooth midpoint retreat, holes/splits, exact endpoints, two-load bounds, latest-selection failure and retained frames.
- [x] Implement signed-distance contour interpolation and required/prefetch cache requests with bounded memory.
- [x] Add visible interpolation/source/loading labels; preserve scenario and coverage limits.
- [x] Verify numerical geometry and responsive playback/seek under delayed requests.

### Task 3: Research and integrate trade and voyage gaps
Files: work/voyage-depth handoffs; canonical data records, itineraries/activity/inventory, trade audit/scenes, source documentation and data/browser tests.
- [x] Finish bounded voyage handoffs and research dated trade material transfers across the four geographic domains.
- [x] Audit existing records and classify source-supported connections, reconstructed corridors and held questions.
- [x] Integrate reviewed data with stable identities, dates, routes and public source locators; improve trade explanations on the map.
- [x] Check representative California/Chaco, Atlantic coast and global pre-1200 connections on the shared clock.

### Task 4: Review and release
- [x] Fresh independent source/date/geography and UI/ice review; resolve material findings.
- [x] Full release gate, workbook round trip, browser regressions and standalone self-host verification.
- [ ] Merge, publish, verify public API/assets/browser, retain current plus previous release and save receipt.

### Approved additions: North Atlantic continuity and four atlases
- [x] Record Western/Eastern Greenland settlement and inferred abandonment separately, retain the 1408 written observation, preserve Iceland habitation through 1934, and qualify the later papar testimony.
- [x] Add North Atlantic contextual story, L’Anse local/site-plan maps and whole-area reference map.
- [x] Set up Americas; Africa & human origins; Europe & Mediterranean; Asia & Pacific in one repository, with empty COMING SOON basemaps for the latter three.
- [x] Record shared-engine / separate-manifest ownership and future repository split criteria in docs/multi-atlas-plan.md.
- [x] Add trade chapters and shipwreck topic; publish six graveyard guides and two major sea-route guides with individually credited maps and climate context.
- [ ] Finish source-inventory normalization review, regenerated workbook/audits, full gate, publication and live checks.
