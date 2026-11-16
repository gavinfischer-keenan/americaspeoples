# Land and sovereignty topic implementation plan

> Implement inline with superpowers:executing-plans; one fresh whole-branch reviewer at the end. Do not delegate implementation.

**Goal:** All ten remaining source-grounded movies, shared human context, Australia/Aotearoa and region-period coverage, and an isolated Hawaiʻi1959 extension, in one verified deployment.
**Architecture:** Existing TypeScript/JSON topic registry and controller; pure narrow scope policy for record validation and topic clocks; no new dependencies or worksheet/server schema.
**Spec:** docs/superpowers/specs/2026-11-15-land-sovereignty-dives.md

## Superseding user expansion

Finish all ten remaining dives in v0.14, plus an Australia/New Zealand archaeological coverage pass; the user explicitly authorizes merge/push/deploy after completion. The former new-PR-only and seven-left-queued constraints below are superseded. Reuse this feature branch and inline workflow. Tasks1–3 continue; add Task3b for Australasia sites and Task3c for the seven remaining topic modules. Task4 runs once after all content is complete: 20 playable topics, no remaining requested queue entries, one fresh final review, full release checks, merge and verified deployment, current+one previous retention. Keep 1934/1959 limits and research cap unchanged.

### Task 3b: Australia and Aotearoa New Zealand coverage

- [x] Inventory canonical published sites, dates, precision and evidence gaps; one Deep audit plus underlying source checks.
- [x] Add supported missing archaeological localities/activity phases and reciprocal human-context links; no sensitive site coordinates or manufactured continuity.
- [x] Include mainland Australian child-removal institutions and Parihaka history in forced-relocations, with dated coercion evidence and country-specific distinctions.
- [x] Test publication, dates, geometry, shared membership and views.

### Task 3c: Complete the seven remaining topics

- [x] Combined Deep dossier; primary/community source checks and canonical reuse inventory.
- [x] Implement Pacific fur trades, whaling, Spanish treasure, missionaries, pottery, obsidian, copper as independent movies with substantive chapters and source/uncertainty explanations.
- [x] Share independently supported human context, keep subject objects/technology/extraction evidence topic-only, audit every focused record.
- [x] Promote every requested queue link; verify all20movies, crosslinks, clocks, desktop/tablet and packaged source guides.
- [x] Commit green modules; final scope and counts replace earlier13/7 assumptions.

## Global constraints

- IDs forced-relocations, hawaii-statehood, territorial-purchases.
- Shared map and all other topics end1934; only Hawaiʻi may reach1959.
- Exact allowlisted post1934 IDs remain subject-only and fully source/review/workbook compatible.
- Research cap100 Deep calls, starting38; raw generated output private.
- Reuse canonical records, preserve original claims and links; no fabricated consent, routes or boundaries.
- Merge/push/deploy the complete verified v0.14 release under the user's explicit authorization. Tablet/computer primary; retain current and one previous release only.

## Review focus

- Post1934 records leaking into shared maps, ordinary topic manual dates, import validation or review actions.
- Treaty signing plotted as local occupation/transfer, or interstate sale equated with Indigenous consent/title.
- Removal, schooling and confinement inferred from an institution’s founding without supporting evidence of coercion.
- New records duplicating existing sites, especially Louisiana, Bosque Redondo, Hawaiian ports and Garifuna routes.
- Hawaiʻi independence claims, 1959 ballot scope and Indigenous agency flattened into a single inevitable political transition.
- All ten queued topics playable, source-backed chapters visible in their cameras, related links promoted, and focused objects separated from independently supported shared human context.
- Radiocarbon/calendar conversions, phase versus occupation semantics, regional versus site coordinates, and sensitive Australia/NZ location handling.
- Region-period audit inclusion and exclusions, stale generated counts, duplicate localities, and any implication that blank cells or cultural succession establish absence or extermination.
- Mission foundations versus rebuilt structures, forced labor versus generic construction, and whaling/treasure events versus unsupported routes or casualty totals.
- Public package provenance, source links, rights notices and exclusion of raw Consensus reports; cumulative research cap and desktop/tablet usability.

### Task 1: Research and canonical inventory

**Files:** private ../sovereignty-topic-research; public docs/land-sovereignty-dives.md.
**Interface:** audited evidence/source/place/date decisions for Task3.
- [x] Complete one Deep dossier, preserve verbatim privately, update call ledger.
- [x] Inspect underlying primary/community sources; map supported chapters and reuse published IDs.
- [x] Document uncertainties, source locators, precision and membership; minimum8 chapters each, meaningful regional diversity for removals.

### Task 2: Narrow extended topic dates

**Files:** src/topic-scope.ts; src/topic-session.ts; src/topic-page.ts; src/validation.ts; tests/topic-session.test.ts; tests/topic-scope.test.ts.
**Interface:** topicEndYear(id):number, extendedTopicOnlyIds, recordEndYear(id):number; no dependence on full topic registry.
- [x] RED: Hawaiʻi manual/playback reaches1959, other topics clamp1934; known post1934 IDs validate, arbitrary1959 IDs and1960 fail; workbook roundtrip retains exact dates.
- [x] Implement pure limits and shared exclusion; replace topic UI END_YEAR with session.maxYear and visible scope note.
- [x] GREEN focused tests/typecheck, commit.

### Task 3: Evidence, movies and linked queue

**Files:** data/sovereignty-topic-context-records.json; data/sovereignty-topic-evidence-records.json; src/sovereignty-topic-dives.ts; registries/build/audit/canonical relatedIds; tests/sovereignty-topics.test.ts and .browser.mjs; backlog, topic details.
**Interface:** sovereigntyTopics and sovereigntyTopicOnlyIds; all post1934 IDs match scope policy/audit.
- [x] RED missing three IDs, ordered sourced chapters, unique canonical places, shared membership and scoped record routes.
- [x] Author original records/prose, preserve canonical evidence; promote links and queue.
- [x] Browser check every chapter,1959 manual+slider/playback, return to shared1934, older shared links, master exclusion, tablet views; final20live/0queued.
- [x] GREEN focused tests/build/validation/workbook; commit.

### Task 3d: Region-period gap audit

- [x] Compare shared locality observations by region/time; complete Deep discovery and verify primary sources.
- [x] Add source-supported dated places/phases and conflict, distinguish absence from missing coverage, and repair audit collection loading.
- [x] Package current coverage matrix and source decisions; verify publication and location/date limits.

### Task 4: Verified release and deployment

**Files:** version/lock0.14.0, source guide/rights/README/verification, v0.13 deployment receipt, generated workbook.
- [x] Package linked source guide and current queue, document scope and limits.
- [x] Full release verification; inspect desktop/tablet output and actual record/source UI.
- [x] One fresh whole-branch review, then one material-fix pass with RED→GREEN and green full suite.
- [x] Commit/push/create PR; merge and deploy v0.14 after checks, preserving only v0.13 as the immediately previous rollback release. User authorization is explicit.
