# Early Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Fill early Americas and Pacific continuity gaps and deliver detailed, contextual Caral, Kuk and Upano histories.

**Architecture:** Curate one shared EvidenceRecord collection, plus dedicated site guides and three contextual Watch stories using existing controls. Publish every shared observation through the API, workbook and self-host bundle, comparing coverage with completed v0.16.

**Tech Stack:** Existing TypeScript, JSON, Python and Playwright; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-16-early-continuity.md`.

## Global Constraints

- Shared endpoint 1934; preserve all existing topic-only and shared records.
- Consensus Deep only; start at 66/100 cumulative calls including polls.
- Source-supported dates, public location provenance and reciprocal context links.
- Original atlas prose; private raw research reports; unchanged license policy.
- Existing checkout, feature branch, one final independent review; candidate PR, no deployment in this task.

## Review Focus

- Regional horizon dates must not masquerade as directly dated individual structures.
- Calibrated BP and calendar dates must remain distinct from uncalibrated ages.
- Apparent gaps must not become invented abandonment or permanently active routes.
- New stories must keep the whole shared map and selected year, including on zoom-out.
- Canonical locations, related links, guide records, exported data and coverage counts must agree.

### Task 1: Research, source decisions and baseline

**Files:** private `work/early-continuity/`; `docs/early-continuity.md`; `data/early-continuity-baseline.json`.
**Interfaces:** consumes the v0.16 published dataset, existing source records and completed coverage audit; produces a source-checked candidate table with date semantics, canonical geography and stable related IDs.

- [x] Finish one complete Deep dossier, save its unmodified document privately and ledger every call.
- [x] Check primary papers, supplements and public geography; distinguish new facts, refined existing evidence and held leads.
- [x] Save the immutable v0.16 baseline and source decisions; verify chronology calculations and geographic bounds; commit.

### Task 2: Shared observations and anchor site histories

**Files:** create `data/early-continuity-expansion-records.json`, `src/early-continuity-stories.ts`, `tests/early-continuity.test.ts`; modify `src/published-data.ts`, `scripts/build.ts`, `src/stories.ts`, `src/main.ts`, site-guide JSON catalogs and related records, `scripts/world-coverage-audit.ts`, package version and generated workbook/coverage.
**Interfaces:** consumes checked candidates; produces shared records, site guides `caral-supe`, `kuk`, `upano`, and contextual stories with those stable IDs.

- [x] Write meaningful tests for shared map membership, calibrated date conversion, uncertain regional phases, active/unknown connection windows, canonical coordinates, reciprocal links, preserved baseline, and all three stories linking dated shared evidence. Run to observe missing-feature failures.
- [x] Implement evidence, source-linked site guides, bounded story cameras and contextual chapters using the existing model; label the summary foundation count accurately.
- [x] Generate source-status notices for private research and reciprocal guide links. Keep existing records in their established guides unless a more specific link is deliberate.
- [x] Regenerate workbook and both coverage audits; run unit tests, record validation and TypeScript. Expected: all pass with baseline unchanged. Commit.

### Task 3: Reorganize all deep dives

**Files:** create `src/deep-dives.ts`, `src/deep-dives.css`, `tests/deep-dives.test.ts`, `tests/deep-dives.browser.mjs`; modify `src/main.ts`, `src/atlas-shell.ts`, existing topic/site entry links and navigation tests.
**Interfaces:** consumes the existing `topics`, `stories` and `siteGuides` catalogs plus Task 2 anchors; produces a classified directory with Subjects, Places, Languages and Cultures, truthful availability and preserved old links.

- [x] Write tests requiring every existing movie/story/guide to be reachable in the classified directory, languages/cultures in their own lists, Coming soon entries without play links, and safe fallback for unknown categories. Observe RED.
- [x] Implement the directory, explicit category assignments, planned lists, story deep links and legacy-route handling; relabel navigation Deep dives. Preserve shared-state return and contextual-story behaviour.
- [x] Run unit/type checks and desktop/tablet navigation tests, including direct links and back/forward history. Update affected existing tests to the intended new navigation. Commit.

### Task 4: Browser, package and final review

**Files:** create `tests/early-continuity.browser.mjs`; modify `scripts/verify-release.mjs`, `README.md`, current verification documentation and `docs/releases/v0.17.0-verification.json`; update roadmap status.
**Interfaces:** consumes new shared observations, site guides and contextual stories; produces verified candidate release and PR.

- [x] Check all three stories and guide links, representative early/post-settlement records, surrounding history after zoom-out and desktop/tablet usability. Check guide data and new records in self-host/SQLite/workbook artifacts.
- [x] Run the full ordered release gate. Expected: every required phase passes; inspect representative screenshots.
- [x] Obtain one fresh independent whole-branch review; resolve material findings in one tested fix pass, preserve source-access limitations and held leads.
- [ ] Record source counts, site/observation distinctions, cumulative Consensus calls and review results; commit, push and create the candidate PR.
