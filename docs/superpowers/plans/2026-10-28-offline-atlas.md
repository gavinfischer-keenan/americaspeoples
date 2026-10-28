# Americas Peoples Implementation Plan

> Use superpowers:executing-plans to implement this plan task by task.

**Goal:** Deliver the offline evidence atlas described in the supplied brief.
**Architecture:** Typed scholarly records feed pure temporal queries, an SVG vector map, hash-routed evidence pages, and isolated proposal workspaces. A build embeds data into a classic script and packages a double-clickable ZIP.
**Tech stack:** TypeScript, DOM components, d3-geo, esbuild, Node test runner, Playwright.
**Spec:** `docs/implementation-brief.txt`.

## Global constraints
- Fully offline file:// distribution, no server, CDN, account, or service worker.
- Earliest included evidence through 1803; astronomical internal years, BCE/CE display.
- Claim-specific uncertainty; substantive review page per row; imported proposals never promote themselves.
- Do not publish or merge. Develop on feat/offline-atlas in the fresh clone.

## Review focus
- Boundary dates, uncertain occurrences, gaps and backward scrubbing must not imply continuous settlement.
- Share packages can be hostile, duplicate, too large, or refer to stale revisions.
- Browser storage may throw; downloads must still work.
- File routes and source links must be safe and work from the extracted ZIP.
- Map overlap, unknown categories, long titles, and keyboard operation must remain usable.

## Task 1 — Evidence and time contracts
Files: src/model.ts, src/time.ts, src/validation.ts, tests/core.test.ts.
Interfaces: EvidenceRecord, Dataset, Proposal; formatYear(year), temporalState(time, year), earliestYear(records), validateRecord(record), validateDataset(dataset).
- [x] Add tests asserting year 0 displays 1 BCE; inclusive bounds; repeated episodes absent in gaps; null time stays unplaced; uncertain occurrence always returns possible, never certain.
- [x] Run npm test; observe absent implementation.
- [x] Implement the contracts and validators, including claim-to-source references, required review text, valid calendar ranges and geographic bounds.
- [x] Run npm test and npm run typecheck; expect zero failures.

## Task 2 — Portable suggestions
Files: src/proposals.ts, tests/proposals.test.ts.
Interfaces: parsePackage(text), makePackage(proposals), inspectImport(incoming, existing, dataset), mergeImport(incoming, existing).
- [x] Test correction base revisions, duplicate identity, competing versions, malformed and oversized payloads, unsafe links, prototype keys, and draft round trips.
- [x] Run tests before implementation, then implement immutable, validated import/export and deterministic conflict handling.
- [x] Run the complete test suite; expect zero failures.

## Task 3 — Offline map and evidence UI
Files: src/main.ts, src/map.ts, src/review.ts, src/editor.ts, src/dom.ts, src/styles.css, index.html, scripts/build.ts, scripts/browser-test.mjs.
Interfaces: MapView.update(records, year), MapView.focus(record); route #map, #evidence, #review/ID, #proposals, #edit/ID, #new.
- [x] Write browser checks for timeline inputs, complete review navigation, proposal editing/export/import, no network, hostile text rendering and storage failure.
- [x] Run against the empty build to confirm missing functionality.
- [x] Implement persistent shell/timeline, map pan/zoom, searchable legend, all/current table, detailed review and proposal editor.
- [x] Build a classic bundle with embedded dataset/geometry; no runtime fetch.
- [x] Run browser tests via file:// with offline contexts and inspect screenshots.

## Task 4 — Scientific starter corpus
Files: data/evidence.json, data/land.geojson, docs/evidence-policy.md, scripts/validate.ts.
- [x] Read actual primary scholarly/archival sources; retain access limitations and critical literature.
- [x] Populate a modest reviewed starter corpus with claim-specific support, no invented occupation or migrations.
- [x] Validate all records, source IDs and dates; manually read each review.
- [x] Keep synthetic scenarios only in tests.

## Task 5 — Release and review
Files: README.md, docs/data-format.md, THIRD_PARTY.md, scripts/build.ts, docs/verification.md.
- [x] Document date semantics, editing and sharing, local-only limitations, build and maintenance.
- [x] Run unit tests, typecheck, dataset validation, build and extracted-ZIP browser tests.
- [x] Request an independent whole-change review, fix substantive findings with regression coverage.
- [x] Commit locally and deliver application/source ZIPs with exact tested-browser and dataset limitations.

## Execution notes
The supplied brief explicitly directs implementation in working increments, so proceed inline without another plan-approval gate. Fresh empty clone has no baseline code, tests or AGENTS.md; reuse it rather than create an additional worktree. No shared checkout changes are involved.

## Completion evidence

16 unit tests passed; strict typecheck and eight-record dataset validation passed. Both browser suites passed against the extracted offline ZIP in Edge 156.0.4314.42 and Chrome 156.0.8078.73. Independent review findings were reproduced and corrected. See docs/verification.md for limitations.
