# Coverage, Maps and Expeditions Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for coordinated integration, with bounded independent research under dispatching-parallel-agents.

**Goal:** Fill 15 unreviewed regional gaps, improve full-area place maps and show contemporary voyages through 1934.

**Architecture:** Keep canonical evidence in the existing data pipeline, guides in site-guides/content, and dated itineraries in voyages.json. Extend map presentation with a source-attributed zoomable guide atlas and simultaneous voyage context.

**Tech Stack:** TypeScript, d3-geo, Python terrain preparation, existing HTML guide builder and SQLite release pipeline.

**Spec:** docs/superpowers/specs/2026-11-18-coverage-maps-expeditions-design.md

## Global Constraints

- Shared timeline ends in 1934; ordinary dives preserve contemporary context.
- Source-supported dates and geography only; missing evidence is not absence.
- Keep raw Consensus responses private and track requests against 45 remaining calls.
- Preserve existing noncommercial license, third-party credits and public location precision.
- Reuse clean checkout on a feature branch; preserve existing hosting and audience.

## Review Focus

- Dateline-spanning islands must not become a false density priority.
- Stationary expedition winters and polar drift must not look like nonstop sea travel.
- Simultaneous expeditions remain visible with no selected voyage and while paused.
- Full-area maps must not silently crop a guide's outlying places or blur source resolution claims.
- New guide/evidence IDs must survive build, database and deployed asset generation.

### Task 1: Rank the next 15 gaps

Files: data/coverage-15-baseline.json; docs/coverage-15-review.md; work/coverage-15 research files.
Interface: selected region IDs, bounds, baseline locality counts, prior-review evidence and ranked rationale.
- [x] Recompute/inspect canonical coverage and prior campaign inventories; reconcile excluded and overlapping regions.
- [x] Save a reproducible baseline with 15 selected regions and explicit review-status caveats.
- [x] Research original sources and hold unsupported claims.

### Task 2: Integrate 15 regional histories

Files: data/coverage-15-expansion-records.json; data/coverage-15-stories.json; data/site-guides.json; data/site-guide-content.json; data/site-research-reviews.json; src/published-data.ts; src/stories.ts; tests/coverage-15.test.ts.
Interface: EvidenceRecord[] via records; contextual story definitions following existing regional-gaps schema.
- [x] Add meaningful data-contract tests for 15 guides, source/date integrity, no duplicate locality inflation and shared inclusion; observe failure.
- [x] Add verified local histories, guide narratives, source decisions and shared scenes.
- [x] Run targeted validation/tests and generate before/after counts.

### Task 3: Full-area detailed maps

Files: src/site-overview-map.ts; scripts/site-guide-build.ts; scripts/prepare-guide-terrain.py; data/guide-terrain; new source-map manifest/rendering module; relevant map tests.
Interface: guide ID to registered map assets with bounds, attribution, resolution and full-view controls.
- [x] Test whole-area extent, zoom controls and attribution; observe failure.
- [x] Produce larger honest-resolution terrain assets plus curated authoritative area maps, prioritizing Chaco roads and Machu Picchu relief.
- [x] Make all place guide maps enlargable and inspect rendered full/local views.

### Task 4: Major voyages and polar context

Files: data/voyages.json; voyage evidence collection; src/voyages.ts; src/map.ts; src/main.ts; src/styles.css; tests/voyages.test.ts and new expedition tests; docs/voyage-coverage.md.
Interface: dated voyages with sources, phase precision and optional movement-mode extensions; active-voyage selection from the shared date.
- [x] Inventory missing significant American/polar expeditions and verify dated stages with institutional/primary sources.
- [x] Test date eligibility, simultaneous journeys, stationary winters, offscreen access and valid polar coordinates; observe failure.
- [x] Integrate itineraries, evidence and unobtrusive contemporary/offscreen display.
- [x] Run voyage tests and browser checks at Shackleton and overlapping expedition dates.

### Task 5: Verify and release

Files: release/version metadata; documentation; verification receipt.
- [x] Run npm test, npm run typecheck, npm run validate, npm run build and npm run verify:release; inspect every result.
- [x] Inspect guides and shared movie in browser; run one fresh whole-branch review and resolve actionable findings.
- [ ] Follow established repository deployment, verify live version/assets and report exact delivered scope and remaining limitations.
