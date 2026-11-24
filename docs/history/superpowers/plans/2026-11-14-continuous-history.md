# Continuous History Atlas Implementation Plan

> **For agentic workers:** Execute inline with superpowers:executing-plans. Source research may proceed independently; use one final independent code review.

**Goal:** Make population continuity, dated settlements, active migration/exchange and cumulative maritime losses readable in the existing atlas.

**Architecture:** Preserve the original evidence corpus and date meanings. Add optional, validated history metadata and a separate sourced historical collection, then derive current evidence, historical places and accumulated losses without fabricating occupation. Retain the Python/SQLite catalog and existing source-review system.

**Tech Stack:** TypeScript, native DOM/SVG, d3-geo, Python/SQLite; no new runtime dependencies.

**Spec:** User request and 2026-11-14 audit in outputs/atlas-audit.html; user explicitly chose “Use your judgment and implement.” Design review and additional execution approvals are waived.

## Global Constraints
- Keep source dates, citation access limits and approximate geography explicit.
- Never convert a dated artefact, arrival window or colonial foundation into continuous population.
- Preserve existing 962 records; additional curated records cite underlying sources.
- Schematic routes show supported activity windows, not measured voyage frequency.
- Wrecks persist as historical losses and disappear when scrubbing before loss.
- Retain 1934 display endpoint; do not imply history ends there.
- Reuse the task's clean clone on codex/continuous-history-atlas; no deployment to production without a finished, verified release.

## Review Focus
- Reverse scrubbing must clear future wrecks/foundations and route hiatuses must stop animation.
- Historical markers cannot enter current population counts or imply abandonment.
- Filters, selection and catalogs must share temporal semantics, including imported proposals.
- Pacific dateline and Atlantic endpoints must remain legible and selectable.
- Narrow screens, open panels and keyboard operation must not cover timeline/map controls.

### Task 1: Temporal history contract
Files: src/model.ts, src/history.ts, src/atlas-view.ts, src/validation.ts; tests/history.test.ts.
Interfaces: HistoryMetadata on EvidenceRecord; historyState(record,year); historyLabel(record,year); recordsForView returns dated/context/history.
- [x] Add and run failing tests for cumulative losses/foundations, reverse scrubbing, occupation history and route hiatuses.
- [x] Implement pure history derivation and metadata validation without altering temporalState.
- [x] Verify node --import tsx --test tests/history.test.ts tests/atlas-view.test.ts and typecheck.

### Task 2: Sourced historical content
Files: data/history-records.json, src/published-data.ts; tests/history-data.test.ts and existing publication counts.
Interfaces: Standard EvidenceRecord records plus validated history metadata, same API/catalog/export pipeline.
- [x] Review independently researched sources and dates; convert into full claims with source locators.
- [x] Add tests for record validation, representative year boundaries, distinct migration/trade and cumulative wrecks.
- [x] Include new collection without mutating original research. Preserve approximate coordinates and founding-power attribution.
- [x] Verify published data validation, source completeness and build/database export.

### Task 3: Map and timeline experience
Files: src/main.ts, src/map.ts, src/map-projection.ts, src/map-panels.ts, src/map-tooltip.ts, src/styles.css.
- [x] Wire history and active route states into rendering, accessible lists, tooltips and selection.
- [x] Add prominent history-layer filters, period shortcuts, previous/next change and per-year counters.
- [x] Collapse empty details by default, open on selection, keep layers in their own panel, reduce cloudy overlays.
- [x] Add Atlantic/world views and restrained route animation with reduced-motion support.
- [x] Check browser at Pacific/Atlantic dates, with reverse scrubbing, layers, selection, narrow viewport.

### Task 4: Verify and deliver
- [x] Run all unit tests, types, data validation, build, Python API checks and repository release checks where supported.
- [x] Fresh independent review; fix material findings and re-run affected checks.
- [x] Save preview screenshots and downloadable self-host release/source changes under outputs.
- [x] Report exactly what changed, what passed and any data/deployment limits.

Verification: 154 unit tests and all 21 release phases passed on 2026-11-14. Independent review found five P2 issues; all were fixed and rechecked. Manual browser checks covered route hiatuses, reverse loss accumulation, coincident wreck selection, filters, Atlantic/Pacific chapters, and 304/390/768/1440-pixel layouts. Source and self-host release are prepared for a draft pull request; production is not deployed.
