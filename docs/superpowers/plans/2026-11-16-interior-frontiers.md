# Interior Frontiers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Fill supported settlement, exchange and conflict gaps in the shared Amazon/Chaco/Guianas atlas.

**Architecture:** Add one shared EvidenceRecord collection, reusing canonical places and reciprocal links. Package it through the existing workbook, SQLite and self-host pipeline, and compare coverage with an immutable v0.15 baseline.

**Tech Stack:** Existing TypeScript, JSON and Python; no dependencies.

**Spec:** `docs/superpowers/specs/2026-11-16-interior-frontiers.md`.

## Global Constraints

- Shared endpoint 1934; no new topic-only records.
- Consensus Deep only; cumulative starting usage 58/100 including polls.
- Original factual prose with source locators; raw reports remain private.
- Named public places and schematic routes carry precision/uncertainty notes.
- Preserve previous records and coverage baselines.

## Review Focus

- A single trade observation must not become a continuously active multi-century route.
- Violence must be tied to source-supported actors and local dates, with no invented casualty certainty.
- Repeated local observations must share canonical locality metadata, with reciprocal links.
- New shared evidence must reach API/catalog, workbook and self-host exports.
- Coverage must distinguish observations from places, and the display cutoff from the end of an ongoing war.

### Task 1: Research and source decisions

**Files:** private `work/interior-frontiers/`; public `docs/interior-frontiers.md`; `data/interior-frontier-baseline.json`.
**Interfaces:** consumes v0.15 published IDs/locations; produces verified candidates with date meaning, locations, sources and related IDs.

- [x] Complete the Deep dossier; preserve its document and citations privately; record all calls.
- [x] Inventory existing evidence; check candidate sources and geography, including route activity and unknown cessation.
- [x] Save source decisions, held leads and immutable baseline; commit research documentation.

### Task 2: Shared-map evidence integration

**Files:** `data/interior-frontier-expansion-records.json`; `src/published-data.ts`; `scripts/build.ts`; `scripts/world-coverage-audit.ts`; generated workbook/coverage; `tests/interior-frontiers.test.ts`.
**Interfaces:** consumes verified candidates; publishes shared records and complete exports.

- [x] Add meaningful tests for shared membership, activity-window endpoints, dated violence, canonical places, reciprocal links and unchanged earlier baselines; observe RED before integration.
- [x] Author new records and links, add collection to publication/build manifests, update current campaign coverage and source guide.
- [x] Regenerate workbook and coverage; run tests, validation and typecheck. Expected: all pass.
- [x] Commit integrated evidence.

### Task 3: Verification and reviewable delivery

**Files:** browser checks and release verification documentation.
**Interfaces:** consumes integrated dataset; produces verified branch/PR.

- [x] Run the full release gate and check representative shared-map points/routes through the browser. Expected: all pass and live-source review links resolve.
- [x] Obtain one fresh whole-branch review; resolve material findings in one fix pass with RED→GREEN and green suite. No second review.
- [x] Record final counts, source limitations, remaining gaps and cumulative calls; commit, push and create a PR.

### Authorized publication and deployment

The user subsequently authorized merging PR #12 and deploying it.

- [x] Merge the reviewed pull request; build and verify the merged release.
- [x] Publish v0.16.0 and activate its API, static app, evidence appendix and downloads.
- [x] Verify live desktop/tablet behaviour, package hashes, new source records and unrelated pages.
- [x] Keep only the current release and one previous rollback; pass Linux retention tests, clean staging payloads and recheck the public site.
- [x] Record the deployment receipt and new research queue without claiming those future additions are already in the map.
