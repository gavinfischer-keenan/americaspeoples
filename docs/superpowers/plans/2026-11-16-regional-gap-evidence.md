# Regional Gap Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add verified human places, events and connections to the shared atlas where Central/South America after 1700 and Australia are thin.

**Architecture:** One shared EvidenceRecord collection using the established publication pipeline; canonical places and reciprocal links connect it to existing records. Preserve the old coverage baseline and report this campaign against a new immutable pre-change snapshot.

**Tech Stack:** TypeScript, JSON, Python, existing build and browser checks.

**Spec:** `docs/superpowers/specs/2026-11-16-regional-gap-evidence.md`

## Global Constraints

- Shared endpoint 1934. No new topic-only records or dependencies.
- Consensus Deep only; starting usage 53/100, counting submissions and polls.
- Original summaries with underlying source locators; private research stays out of public packages.
- Date uncertainty and public locality precision explicit; no absence-to-abandonment inference.
- Existing records and canonical locality metadata reused where applicable.

## Review Focus

- Events mistaken for continuous occupation: assert narrow temporal semantics and no unsupported ongoing continuity.
- Multiple observations counted as multiple towns: assert canonical locality equality for new repeated phases.
- Focused evidence accidentally substituted for master context: assert every new record is shared and active in its supported year.
- New data omitted from offline/download packages: verify exported collection, workbook and SQLite through the existing release gate.
- Counts compared against a silently changed baseline: pin pre-change total and unchanged old snapshot; check region deltas using actual IDs.

### Task 1: Research and source decisions

**Files:** private `work/regional-gaps/`; public `docs/regional-gap-evidence.md`; immutable `data/regional-gap-baseline.json`.
**Interfaces:** consumes current published EvidenceRecord IDs and coverage matrix; produces verified candidates with dates, locations, sources, caveats and reuse decisions.

- [x] Run one complete Consensus Deep brief and preserve its returned document privately verbatim. Track each call.
- [x] Inventory existing mapped and unplaced records in target regions; verify candidate claims against primary or custodial sources. Record held claims and coordinate limits.
- [x] Save source decisions and baseline; commit the research guide.

### Task 2: Shared data and coverage integration

**Files:** `data/regional-gap-expansion-records.json`, `src/published-data.ts`, `scripts/build.ts`, `scripts/world-coverage-audit.ts`, existing generated coverage/workbook outputs; `tests/regional-gap-evidence.test.ts`.
**Interfaces:** consumes verified candidates; publishes EvidenceRecord[] through dataset and all existing exports.

- [x] Write semantic tests for shared membership, source-supported temporal states, canonical locations, reciprocal links and baseline comparison. Observe meaningful failures before integrating records.
- [x] Add verified records, reuse canonical metadata and update reciprocal relationships. Wire collection into publication and build manifest.
- [x] Update coverage documentation/generation to distinguish this campaign from v0.14; preserve old baseline. Regenerate workbook and coverage; run targeted tests, validation and typecheck. Expected: all pass.
- [x] Commit the complete data integration.

### Task 3: Whole-change verification and delivery

**Files:** verification documentation and private review package.
**Interfaces:** consumes integrated dataset and guides; produces verified branch and reviewable PR.

- [x] Run `npm run verify:release`; expected all phases pass. Inspect master-map examples from each target region and dates before/during/after local events using browser checks.
- [x] Obtain one fresh whole-branch review; resolve material findings in one fix pass with focused failing/passing tests and appropriate complete checks.
- [ ] Record final research usage, exact coverage gains and remaining gaps. Commit, push and create the PR; finish applicable authorized delivery.

## Verification outcome

All 31 release phases passed, including 281 unit tests, the full 2,003-record workbook and rendered imported reviews, self-host/SQLite checks, and the three regional master-map examples. A fresh independent whole-branch review found no actionable findings. The implementation is verified at d1b24ae; this is a candidate, not a deployment. Consensus remains at 58/100 calls.
