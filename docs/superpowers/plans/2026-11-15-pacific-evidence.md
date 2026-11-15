# Pacific Evidence and Historical Geography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Extend the atlas with verified Pacific exchange, Indigenous and Caribbean settlements, violence and forced removals, historical dotted boundaries and dated voyages/missions.
**Architecture:** Add source-backed collections through the existing published-data/appendix/workbook/API path. A separate time-indexed boundary layer cannot intercept evidence selection. Extend compatible history metadata for habitation endings and dated itineraries; preserve previous records and visitor drafts.
**Tech Stack:** TypeScript, D3 geographic projection, JSON evidence, Python GIS conversion, existing Node/browser/Python tests.
**Spec:** docs/superpowers/specs/2026-11-15-pacific-evidence-design.md

## Global Constraints
- Maximum 100 Consensus tool calls total; research dispatches Deep. Preserve returned documents/citations verbatim in private research storage; source verification and coordinate audit recorded.
- Atlas ends 1934. Astronomical internal years: 1 BCE = 0. Source date ranges stay ranges; no absence/abandonment inference from missing evidence.
- Political boundaries dotted with no fill, no pointer interception; historic labels and dated replacement, not accumulation. Cessions, claims, reservations and actual control are distinct.
- Existing occupation predates European mention where supported. Violent trauma does not automatically prove killing or identify attackers.
- No completeness claims for cities/violence/global borders. Every addition has supporting sources and geography limits.

## Review Focus
1. Timeline year within a journey stop, exact boundary transition, or uncertain abandonment must not invent an event or animate travel while stopped.
2. A city underneath multiple territory/reservation outlines remains selectable by actual pointer and keyboard.
3. Mainland Asia, southern Australia and small Caribbean/Pacific islands remain locatable on wide and phone maps, without dateline jumps.
4. Source-backed ongoing habitation remains visible through 1934; first European mention never overrides prior occupation.
5. Unresolved geometry or scholarly disagreement remains visible as a gap/qualification and is not silently made precise.

### Task 1: Source register, audit and data preparation
**Files:** data/atlas-expansion-records.json, data/boundary-sources.json, data/location-audit.json, scripts/prepare-historical-geography.py, docs/atlas-expansion.md; work/pacific-research scratch outside repository.
**Interfaces:** Full EvidenceRecord[] additions with unique IDs, provenance and source support; PoliticalBoundary[] versions defined in Task 3; downloaded public geometry with manifest/hash/license.
- [x] Preserve Deep reports, count all calls and extract primary source leads.
- [x] Audit existing coordinates, continuity, regional coverage and conflict classifications; save findings and decisions.
- [x] Verify primary institutional/paper sources for selected migration/exchange, Caribbean/native settlements, violence/removals, missions/voyages and boundary versions.
- [x] Build reusable geometry conversion with public sources; test bounds/validity/chronology and inspect sample paths.

### Task 2: Time semantics, expanded frame and itineraries
**Files:** src/model.ts, src/history.ts, src/history-review.ts, src/voyages.ts, src/map-projection.ts, src/explore.ts, src/map.ts; tests/history.test.ts, tests/voyages.test.ts, tests/map-geometry.test.ts.
**Interfaces:** HistoryMetadata supports habitation, endEvidence bounded range and certainty, connection evidence/cessation, and voyage itinerary stops. sampleVoyage(stops, date) returns position, stop/travel status and transport; interpolation is schematic and pauses over arrival/departure spans. Political date remains separately explicit.
- [x] Write failing tests for uncertain local abandonment vs ongoing Rapa Nui, unknown route direction, arrival/departure stop holds, voyage start/end and dateline interpolation; expanded-frame tests include mainland Asia and Australian south coast.
- [x] Run focused tests and confirm each relevant failure.
- [x] Implement validated compatible metadata, labels and voyage sampling; add regional presets and detailed same-origin coastline fallback.
- [x] Run focused tests/typecheck; preserve existing history/workbook roundtrips.

### Task 3: Dated dotted boundaries
**Files:** src/boundaries.ts, src/boundary-layer.ts, src/map.ts, src/main.ts, src/atlas-shell.ts, src/atlas-ui.css, data/historical-boundaries.json; tests/boundaries.test.ts, tests/historical-geography.browser.mjs.
**Interfaces:** Boundary records carry id, historical name, kind, start/end ISO dates, geometry, label point, source IDs, chronology/precision/control notes. boundariesAt(year) uses December 31 snapshot and never mixes expired versions; the accessible source list is filtered to current viewport/year.
- [x] Write failing tests for Louisiana acquisition to successor territory, Florida territory to state, reservation change, outline pointer transparency, no filled paths and explicit Explore boundary year.
- [x] Implement boundary source validation/selection, cached dotted renderer with decluttered labels, layer controls/source access and timeline updates.
- [x] Run unit and actual-pointer browser checks; test offscreen clipping, mobile panel and city selection through boundaries.

### Task 4: Publish evidence into the application and explain coverage
**Files:** src/published-data.ts, scripts/build.ts, scripts/workbook-tables.ts, src/stories.ts, src/about-page.ts, src/atlas-shell.ts, docs/atlas-expansion.md, tests/atlas-expansion.test.ts, tests/atlas-expansion.browser.mjs, package.json/lock.
**Interfaces:** New collection included exactly once in catalog, API, reviews, appendix and workbook. Source-backed journey choices use verified records and itinerary metadata; source guide lists added coverage and remaining gaps.
- [x] Write failing checks for required Taos/Caribbean/violence/Pacific/mission/voyage examples, source integrity, unchanged legacy counts except recorded corrections, geographic bounds and new packaged guide.
- [x] Add reviewed records, correction revisions, journeys/itinerary playback and truthful labels/controls; bump next release candidate to 0.9.0.
- [x] Run all units, validation, typecheck, API, workbook roundtrip, browser picking/playback/mobile and extracted release checks. Update only obsolete fixed-count assumptions with dataset-derived assertions.
- [x] Visually inspect desktop/mobile and representative dated boundary/voyage states; save screenshots and coverage report.
- [x] Obtain fresh whole-branch review, fix material findings, commit/push and create reviewable PR. Production deployment remains a separate release step.

## Scope incorporated during implementation

The user explicitly confirmed permanent noncommercial educational intent. Original code uses unchanged PolyForm Noncommercial 1.0.0; original educational content and copyrightable curated data use CC BY-NC-SA 4.0; third-party permissions are preserved. Raw Consensus reports are excluded from new public packages and retained privately; older Git history is not rewritten. Add Acadian stages, enslaved transport, Latin American cities and boundaries, actual-built transportation, reservations, and source-specific gaps. Eight Deep reviews used 22 total connector calls including polls, below the cap of 100.

Validation includes source-linked record integrity, schema/geometry/date checks, dated boundary replacement, click-through layers, moving voyages and stop holds, readable mobile layout, build/export packaging, and a fresh whole-branch review. Production deployment awaits a new instruction after this release is reviewable.

## Implementation record

The planned combined evidence file was split into seven source-reviewed expansion collections; correction decisions are recorded in `docs/history-source-corrections.md` and the regional source-decision guides. Boundary rendering is implemented in `src/atlas-context.ts` with loading in `src/atlas-assets.ts`; browser coverage is in `tests/expansion.browser.mjs`. The final collection contains 1,266 evidence records, 1,243 dated boundary versions, nine stories (49 scenes), ten expedition itineraries (69 anchors), and 1,755 U.S. rail display groups plus 20 regional built segments. Coverage remains selective. Fresh independent review and delta review found no remaining material findings after fixes. Desktop and 390-pixel mobile layouts were visually inspected.

Source release is committed and available in [PR #5](https://github.com/gavinfischer-keenan/americaspeoples/pull/5). All 25 release checks passed after corrections and focused reruns; the final package was rebuilt and checked. Production deployment has not been performed.
