# Pacific topic movies and shared-context audit

**Goal:** Add sweet-potato, boat and dog movies, with reliable shared-history links across all seven topic dives and the requested future queue.

**Architecture:** Add a separate Pacific topic registry and evidence collections to the existing controller. Reuse `review.relatedIds` for reciprocal links, with a small context helper/UI and an explicit shared-atlas review action. Subject membership remains separate from global temporal eligibility. Existing records are reused before any new general-context record is created.

**Spec:** `docs/superpowers/specs/2026-11-15-pacific-topic-dives.md`

**Tech stack:** TypeScript, SVG/d3-geo, JSON evidence, Python/SQLite, Playwright, existing workbook/build tooling.

## Global constraints

- Preserve independent topic clocks and normal shared-world playback.
- Main atlas gets supported human context; topical specimens/reconstructions do not automatically become global layers.
- Distinguish specimen/context/model/observation dates and inferred versus observed craft.
- No universal crop route, lineage-to-arrival conversion, unsupported extinction or fabricated habitation interval.
- Noncommercial licensing and source attribution remain intact; no raw Consensus report in public builds.
- Cumulative Consensus budget is at most 100 calls, Deep only, including polls; start from 31.
- Deliver a reviewable PR; do not merge/deploy without a later instruction.

## Review focus

- Sweet-potato contact claims where genetic dates, archaeological dates and sampled locations differ.
- A boat or dog specimen used as a proxy for occupation or human ancestry.
- Shared context reachable through topic reviews, preserving return behavior without leaking topic filters.
- Existing four topics accidentally losing main-map evidence or gaining duplicated settlement markers.
- Tablet portrait/landscape and desktop layout, with simple phone fallback; topic-index growth must not make queued subjects look playable.
- Detailed island coastlines on direct topic entry and after assets have loaded; returning to topics must not lose geography.

### Task 1: Source and coverage audit

- [x] Complete one combined Consensus Deep dossier, preserve it privately, and record every call.
- [x] Verify original papers/institutional records and actual dated material, competing interpretations and location scope.
- [x] Inventory existing relevant records and missing general context across all seven dives.
- [x] Write a coverage/decision table and formal references; preserve unresolved dates as unresolved.

### Task 2: Evidence and cross-references

**Files:** `data/pacific-topic-evidence-records.json`, `data/pacific-topic-context-records.json`, affected canonical source collections, `src/published-data.ts`, `scripts/build.ts`, new Pacific evidence tests.

- [x] Write failing assertions for three topic IDs, supported scenes, chronological semantics and master-map eligibility.
- [x] Add sourced evidence and only missing human context; link new and existing records reciprocally.
- [x] Audit original horses, maize, trade and language topics for shared-context links.
- [x] Validate coordinates, source mappings, duplicate IDs and workbook round trips.

### Task 3: Movies, shared-context navigation and future queue

**Files:** `src/pacific-topic-dives.ts`, `src/topic-dives.ts`, `src/topic-context.ts`, `src/topic-page.ts`, `src/main.ts`, `src/deep-dive-backlog.ts`, relevant browser/unit tests.

- [x] Add three evidence-driven chapter sequences and substantive explanations with precise uncertainty.
- [x] Show related shared history through canonical records; explicitly entering it selects the supported date and place while topic state remains recoverable.
- [x] Preserve ordinary topic return and existing view/clock contracts.
- [x] Add the prioritized future queue; remove completed subjects from the backlog.
- [x] Check all seven movies, related reviews, shared-map navigation, tablet/computer layouts, basic phone fallback and direct links.

### Task 4: Release candidate

- [x] Update version, coverage notes, attribution, generated workbook and package.
- [x] Run required unit/data/API/package/browser verification and inspect screenshots.
- [x] Obtain one fresh-context whole-branch review, then one combined material-fix pass with reproducing tests.
- [x] Commit/push and open a PR with evidence limits and cumulative research usage; leave live release unchanged. PR: https://github.com/gavinfischer-keenan/americaspeoples/pull/8
