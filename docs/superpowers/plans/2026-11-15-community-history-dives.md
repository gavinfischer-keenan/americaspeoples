# Community history topic dives implementation plan

> Implement inline with superpowers:executing-plans, followed by one fresh whole-branch reviewer. Do not delegate implementation tasks.

**Goal:** Three sourced topic movies with supported human context carried into the shared atlas.

**Architecture:** Extend existing TypeScript/SVG TopicDive and JSON evidence registries, reuse canonical records, promote queued links into playable topics, and retain independent clocks.

**Tech stack:** Existing TypeScript, SVG/d3-geo, JSON, SQLite/Python, workbook and Playwright tooling; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-15-community-history-dives.md`

## Global constraints

- IDs: `haudenosaunee`, `amazonian-peoples`, `caribbean-enslavement`.
- All timelines stop at1934; shared Watch/Explore keep simultaneous world context.
- Tablet/computer first; basic phone fallback only.
- Cumulative Consensus maximum100 calls, Deep only; start34, record dispatches/polls.
- Underlying source-specific dates and place precision govern records; no invented habitation, completed voyage or cultural identity.
- Original summaries and source references only; raw research reports stay outside public builds.
- New PR only; do not merge/deploy it without a later instruction.

## Review focus

- A Wendat/other Iroquoian observation incorrectly becoming Haudenosaunee origin evidence; traditions treated as exact foundation dates.
- An Amazonian site date, language model or isolation observation treated as a uniform region/population history.
- A trafficking authorization shown as an actual voyage, or abolition/apprenticeship collapsed into one instant end of coercion.
- Supported human context trapped in topic-only membership or duplicated rather than linked to an existing canonical place.
- Promoted planned-topic URLs, tablet navigation and independent date/camera state across all ten topics.

### Task 1: Source and coverage audit

**Files:** private `work/community-topic-research/` outside repo; `docs/community-topic-dives.md` for original public source decisions.
**Interface:** validated source/date/location decisions consumed by Task2; complete private Deep dossier and call ledger.

- [x] Finish the one combined Deep review, preserve its verbatim report privately and count every call.
- [x] Inspect primary papers, community/institutional sources and documents behind selected claims; retain competing/unknown dates honestly.
- [x] Inventory/reuse existing canonical records; select chapter evidence and finalize exact dated assertions before production authoring.
- [x] Record source locators, public precision, shared/topic membership and withholding decisions. Expected: three defensible ordered chapter sets and no unsupported mapped chronology.

### Task 2: Evidence and three movies

**Files:** new `data/community-topic-evidence-records.json`, `data/community-topic-context-records.json`, `src/community-topic-dives.ts`, `tests/community-topics.test.ts`; modify published-data/topic-dives/build, canonical relatedIds and the context audit.
**Interface:** `communityTopics: TopicDive[]`, `communityTopicOnlyIds: string[]`; ordinary EvidenceRecord arrays, canonical reciprocal `review.relatedIds`.

- [x] Write and run failing tests for all three IDs, at least7 chapters each, resolvable visible dated evidence, shared eligibility, reciprocal references and audited date/attribution cases. Expected: failures identify missing movies/records.
- [x] Add source-backed records and original chapter prose, reusing existing places. Keep unplaced traditions/models out of dated movie evidence.
- [x] Run focused evidence tests, typecheck, validation, build/workbook roundtrip. Expected: no errors, every chapter has mapped supported evidence, all sources and related IDs resolve.
- [x] Commit the evidence/movie change.

### Task 3: Queue promotion and connected navigation

**Files:** `src/deep-dive-backlog.ts`, `src/main.ts`, `tests/community-topics.browser.mjs`, existing topic tests and release gate.
**Interface:** live `#topic/<id>`; old `#topics/<id>` for promoted topics resolves to the live movie; related links retain explanatory reasons.

- [x] Add failing browser cases for a promoted bookmark, shared-map date/action, independent return state and tablet portrait/landscape. Expected: old planned URL cannot yet open the new movie.
- [x] Promote the three topics, preserve useful See also links, update available-topic expectations and wire the new browser suite into verification.
- [x] Verify every new chapter, records/reviews, shared actions and old topics. Expected: all chapter evidence visible; no horizon extension or shared clock leakage; ten playable topics and ten queued topics.
- [x] Commit navigation/queue integration.

### Task 4: Verified candidate

**Files:** package version/lock, README, THIRD_PARTY, docs/verification, release history and generated workbook; deployment receipt for v0.12.

- [x] Bump source candidate to0.13.0, document selected coverage/limits and current livev0.12, and build final package.
- [x] Run release verification, inspect tablet/desktop screenshots and inspect the actual public-claims/date/source output. Expected: required checks pass, declared skips explicit.
- [x] One fresh-context whole-branch review on the most capable available model, then one combined material-fix pass with reproducing RED→GREEN tests and green suite.
- [ ] Commit/push and create a reviewable PR with measured checks and cumulative research use; keep livev0.12 unchanged.
