# Cities, Conflicts and Topic Dives Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans task by task. The user authorized judgment and implementation and confirmed separate topic mode; do not repeat design approval questions.

**Goal:** Fill major settlement/conflict gaps and add four independent, explanatory topic movies alongside the contextual world atlas.

**Architecture:** Original sourced evidence collections feed the existing validated catalog, reviews and workbook. Topic membership and independent state live in dedicated modules; ordinary stories keep shared-world temporal eligibility. Scene detail blocks provide explanatory depth and claim/source links.

**Tech Stack:** TypeScript, d3-geo/SVG, JSON, Node test runner, Playwright, Python research/import helpers.

**Spec:** ../specs/2026-11-15-cities-conflicts-topic-dives.md

## Global constraints

- Ordinary stories/expeditions share one global date; focused topic mode is the explicit user-approved exception.
- Earliest evidence through 1934; preserve exact documented dates, approximate windows and unknown cessation separately.
- Public source locations only; no invented footprints, directory placeholder dates, battle outcomes or ancestry claims.
- Deep Consensus only, cumulative maximum 100 calls; start of this revision: 25 calls already used.
- Reuse the existing checkout on a new branch, following desktop workspace preference. No deployment of this branch in this task.

## Review focus

- Topic changes and review/back navigation must not change the saved global clock, filters, selected journey or camera.
- Topic-only evidence must not clutter regular playback; existing archaeological/crop evidence must not accidentally disappear from normal history.
- Evidence windows must not become smooth spreading fronts, continuous traffic or guessed battle durations.
- Source city coordinates, cultural attribution and local phase dates must not be inherited from a whole polity or sanctuary.
- Northern demographic change, language descent and object provenance must not be misrepresented as violence, genetic identity or direct commerce.

### Task 1: Source and coverage audit

**Files:** docs/cities-conflicts-coverage.md; private work/cities-conflicts-research/*; data source manifests as needed.

- [x] Record the current named-site and conflict gaps, baseline commit and Consensus budget.
- [x] Research primary settlement inventories, battlefield records, northern adaptation and topic evidence; save raw reports privately.
- [x] Publish a source-defined coverage ledger and source/access/reuse decisions, including unresolved inventory rows.

### Task 2: Cities, conflict events and northern evidence

**Files:** data/city-expansion-records.json, data/conflict-expansion-records.json, data/northern-expansion-records.json, src/published-data.ts, scripts/build.ts, tests/cities-conflicts.test.ts, relevant corrected source collections.

- [x] Write coverage, chronology, source-link, position and duplicate/phase assertions; observe missing behavior/data.
- [x] Add reviewed settlement phases and better public anchors; add locality conflict events with named parties and source-supported outcomes.
- [x] Add northern public settlements/seasonal sites, adaptation and differentiated demographic/violence evidence.
- [x] Validate all records, regional placement, exact-date gating and workbook round trips.

### Task 3: Independent topic mode

**Files:** src/topic-dives.ts, src/topic-session.ts, src/main.ts, src/atlas-shell.ts, src/map.ts, src/atlas-ui.css, src/atlas-context.css, tests/topic-dives.test.ts, tests/topic-dives.browser.mjs.

**Interfaces:** topic registry supplies Story-compatible chapters and allowed record IDs; TopicSession saves/restores regular playback and camera state and holds independent topic clocks; map rendering receives only eligible topic records while focused.

- [x] Write failing tests for entering/switching/leaving topics, exact state restoration, direct links, reviews/back and regular-world context.
- [x] Implement clearly labeled navigation and independent clock/filter/camera state, reusing existing map and transport controls.
- [x] Ensure asynchronous asset loading cannot restore unrelated overlays while focused; verify keyboard and mobile behavior.

### Task 4: Four topic stories and richer regular scenes

**Files:** data/topic-evidence-records.json, src/topic-dives.ts, src/story-details.ts, src/language-lineages.ts, src/stories.ts, src/main.ts, tests/topic-evidence.test.ts, tests/stories.test.ts.

- [x] Add source-linked horses, maize, trade and language evidence with topic membership that preserves pre-existing main-map evidence.
- [x] Build four dated topic sequences; language relationships distinguish descent/contact/borrowing/disputed hypotheses and historical versus modern location.
- [x] Add Peoples of the North to ordinary contextual stories.
- [x] Add substantive explanation blocks to every regular story step, including known/inferred/unknown watercraft and mechanisms of exchange/adaptation.
- [x] Verify narrative dates/records, rich detail rendering, source navigation and independent topic playback in browser tests.

### Task 5: Release candidate

**Files:** package.json/package-lock.json, README.md, THIRD_PARTY.md, docs/verification.md, scripts/verify-release.mjs, generated workbook and guides.

- [x] Update source documentation, coverage counts, version and generated distribution; include new browser contracts in release verification.
- [x] Run required tests/build/package/browser checks and inspect desktop/mobile screenshots.
- [x] Obtain one fresh-context whole-branch review, resolve material issues and verify affected behavior.
- [x] Commit, push and open a PR with accurate coverage limits and research budget; do not merge or deploy.

Release candidate opened as PR #7: https://github.com/gavinfischer-keenan/americaspeoples/pull/7. All 27 release phases and 248 unit tests passed; source remains unmerged and undeployed.
