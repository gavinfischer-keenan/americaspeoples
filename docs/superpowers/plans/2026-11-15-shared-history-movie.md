# Shared History Movie Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Restore contextual playback across every timeline and expand Pacific connections.

**Architecture:** A small shared-movie module owns geographic itinerary windows and the fractional global clock. Temporal eligibility stays independent of camera/story; existing map layers and data validation remain authoritative. A source-linked content expansion adds missing connections and contextual events.

**Tech Stack:** TypeScript, d3-geo, SVG, Node test runner, Playwright, JSON evidence collections.

**Spec:** ../specs/2026-11-15-shared-history-movie.md

## Global Constraints

- Every date governs all regions in every timeline; camera and highlighting never filter chronology.
- Atlas frame: 95°E eastward to 30°W, 60°S–80°N; skip off-scope voyage playback.
- Keep dates, uncertainties, source provenance and noncommercial licensing intact.
- Consensus Deep only; maximum 100 cumulative calls including polls.
- No deployment or merge of this new branch without release authorization.

## Review Focus

- A selected voyage must not suppress other voyages or local conflict and habitation.
- A story-to-overview transition must reset both camera and hidden filters.
- Dateline crossings and scope exits/reentries must not interpolate across the wrong ocean or dwell offscreen.
- Fractional voyage dates must not reveal future visits or leak year-end politics into an exact-date claim.
- Missing ancient contact dates must remain explicitly unresolved, not continuous exchange.

### Task 1: Shared clock and contextual movie

**Files:** Create src/shared-movie.ts, tests/shared-movie.test.ts, tests/shared-movie.browser.mjs. Modify src/main.ts, src/atlas-context.ts, src/atlas-shell.ts, src/map.ts, src/atlas-context.css and affected browser contracts.

**Interfaces:** scopedVoyageWindows(voyage), scopedVoyageDate(voyage,progress), scopedVoyageProgress(voyage,date), advanceMovieClock(date,seconds,rate,index,voyages), availableVoyageRecords(records,voyages,date).

- [x] Write failing tests for scope transitions, shared-date eligibility, all travelers and 1492 contextual playback.
- [x] Run focused tests and observe the missing behavior.
- [x] Implement shared clock, contextual rendering, all contemporaneous travelers, default whole movie and context panel.
- [x] Verify tests and desktop/mobile behavior; update old tests only where product behavior intentionally changes.
- [x] Commit the coherent implementation after the combined release gate.

### Task 2: Pacific connections and contextual content

**Files:** data/shared-context-expansion-records.json, data/hawaii-local-expansion-records.json, src/published-data.ts, src/stories.ts, docs/shared-history-update.md, tests/pacific-context.test.ts.

- [x] Audit existing records and completed Deep report; independently verify primary sources for proposed additions and historical country names.
- [x] Write failing coverage/chronology tests for selected additions, with explicit unsupported-date exclusions.
- [x] Add original source-linked evidence and earlier Pacific/Hawaiʻi story chapters; document residual gaps.
- [x] Validate data, source dates, positions and tests; include in the combined release commit.

### Task 2b: Settlement detail and topographic map

**Files:** src/terrain.ts, src/map.ts, src/map-viewport.ts, data/terrain/*, scripts/prepare-terrain.py, data/local-places-expansion-records.json, tests/terrain.test.ts, tests/local-places.test.ts, src/stories.ts.

- [x] Source public topographic relief and verify projection registration with failing/passing tests.
- [x] Source individual archaeological places and public map positions; add construction/occupation evidence without inheriting a regional date for every building.
- [x] Add meaningful close views of Chaco, Mesa Verde and Hovenweep, with local terrain and source-linked detail.
- [x] Verify geographic anchors, chronology, selection at close zoom and context after zooming out.

### Task 3: Release candidate verification

**Files:** package.json/package-lock.json, release documentation, scripts/verify-release.mjs.

- [x] Update version and release notes; add new browser regression to release gate.
- [x] Run final release verification and inspect desktop/mobile screenshots after the terrain crop correction.
- [x] Conduct one fresh-context whole-branch review, resolve important findings and recheck affected behavior.
- [x] Push feature branch and create a reviewable PR, with clear evidence and remaining coverage limits.

## Verification and review record

The fresh-context review identified fractional clock continuity, a Mesa Verde point mismatch, Sun Temple construction semantics, an exact-day conflict onset and repeated voyage geometry work. These were corrected and checked. A further deep-zoom audit removed millions of decorative regional dashes while keeping historical borders dotted. Visual QA also found oversized terrain painting surfaces; coarse covered images are now omitted and remaining images are cropped to the viewport.

All 26 release phases passed, including 236 unit tests; affected browser checks were corrected and rerun after introducing nested terrain viewports. Desktop/mobile previews and deep global-only relief were inspected. The final terrain review found no blocking issue. The content expansion adds 70 records (42 local archaeological places/phases, 18 Pacific and contemporary context records, 10 Hawaiian local records). Consensus remains at 25 calls of 100, with nine Deep research runs. No raw research reports are included.
