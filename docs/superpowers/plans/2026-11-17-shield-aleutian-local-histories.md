# Inland Shield and Aleutian local histories implementation plan

> **For agentic workers:** Use superpowers:executing-plans. Research contributors work in separate private folders; the primary agent integrates and verifies the release.

**Goal:** Add supported inland Canadian Shield settlements and local timelines, and detailed Aleutian village studies, to the shared atlas and connected place guides.

**Architecture:** Extend the existing canonical evidence datasets, contextual stories, guide hierarchy and source register. Reuse existing site identities where new research refines an observation. Show geographically supported buildings on the master map; relative excavation layouts belong in clearly identified local diagrams rather than invented geographic positions.

**Tech stack:** TypeScript, JSON evidence, static HTML/SVG guides, Python terrain preparation, existing browser/release checks.

**Spec:** The user's request in this chat: inland Shield coverage, detailed Aleutian village plans, Consensus Deep within the remaining 63 calls, settlements/local timelines on the master map. Existing authority to use judgment and complete/publish updates continues. This plan records implementation choices; no new design approval is needed.

## Global constraints

- Shared history ends in 1934; existing Hawaiian extension remains isolated.
- Start with 63 remaining Consensus tool calls; count dispatch, retrieval and any other invocation conservatively. Root alone calls Consensus.
- Original readable prose with underlying citations. Provider reports stay private. Reused media requires verified item-level terms and attribution.
- Dates retain original methods. A dated hearth is not an occupation lifespan; do not manufacture continuity across gaps.
- Reuse existing record IDs for the same observation. Independent finds at one place remain separately selectable in one grouped marker.
- Precise locations require source support; recognizable place names and “Near…” locators lead, precision detail stays in notes.
- Tablet and desktop first. Site plans need meaningful labels, source references and links to evidence.

## Review focus

1. Duplicated Amaknak observations or changed place IDs separate one settlement into misleading markers.
2. Calibrated BP, uncalibrated radiocarbon dates and BCE/CE accidentally become the same timeline.
3. Relative excavation drawings acquire invented geographic certainty or copyrighted graphics lose their terms.
4. New contextual scenes show no active local evidence, or isolate the wider world.
5. Shared chronology regresses when local guide hierarchy, date links and terrain framing change.

### Task 1: Source-grounded coverage and chronology

**Files:** private `work/shield-authoring/`, `work/aleutian-village-authoring/`, `work/shield-aleutian-local/`; proposed canonical `data/shield-aleutian-local-records.json`.

**Interfaces:** Contributors return canonical `EvidenceRecord` proposals, existing-record changes separately, guide/page/story proposals and source audits. Root owns integration and the Consensus ledger.

- [x] Complete one whole-task Consensus Deep dossier and retain the report privately with citations intact.
- [x] Verify primary sources, public location support, sample/date methods, site identity and plan permissions. Audit existing 2,480 records before adding observations.
- [x] Establish the final supported inventory, including inland precontact continuity and Aleutian building/local settlement sequences.

### Task 2: Master-map records and connected place guides

**Files:** create `data/shield-aleutian-local-records.json`, `data/shield-aleutian-local-stories.json`, `src/shield-aleutian-local-stories.ts`, `tests/shield-aleutian-local.test.ts`; modify `src/published-data.ts`, `scripts/build.ts`, `src/stories.ts`, guide/content/connections catalogs, terrain registrations and corrections as needed.

**Interfaces:** New records remain shared (`topicOnlyIds` excludes them); new contextual stories reference canonical IDs. Canada Shield belongs under Canada; local Aleutian village guides belong under Aleutian Islands.

- [x] Add failing tests for valid shared records, parent/child guide links, active evidence in every new scene, accurate age conventions and preserved identities.
- [x] Integrate verified records, original narrative guides, local/contextual sequences and explained reciprocal links. Publish explicit correction history when revising existing records.
- [x] Generate matching terrain assets and workbook; pass focused unit/data checks.

### Task 3: Village plans and readable local chronology

**Files:** choose the smallest existing media/guide extension supported by the researched plan assets. If an original relative-layout renderer is required, isolate it in `src/village-plan.ts`, with curated `data/village-plans.json` and `tests/village-plan.test.ts`; integrate only through `scripts/site-guide-build.ts`.

**Interfaces:** Plans reference canonical record IDs and source URLs. Relative layouts have no inferred geographic coordinates; a scale or north arrow appears only when the source supports it. Plan sources enter the existing source register through the associated guide's source list.

- [x] Select verified reusable plans or original factual diagrams from the source audit; record why the chosen representation matches the evidence.
- [x] Before adding behavior, write failing tests for record links, bounds/label validity, safe URLs, spatial qualification and chronological labels.
- [x] Add readable, labeled village detail near the top of each local guide; connect structures and phases to their master-map evidence.
- [x] Check desktop/tablet rendering and navigation, including preserved shared-world context.

### Task 4: Review, release and deployment

**Files:** source/reuse notices, release documentation and receipt, `scripts/verify-release.mjs`, new browser checks; private deployment helpers.

- [ ] Add focused browser checks for every new scene and village plan, source credits and guide hierarchy.
- [ ] Perform one independent whole-branch review; reconcile material findings with regression checks.
- [ ] Run the full release gate, verify the self-host package and final source data.
- [ ] Merge/publish/deploy under existing authorization; verify the live site and retain current plus one previous rollback.

Baseline: clean `main` at `5ae8ff4` (v0.22.0 receipt), with 361 unit tests and 44 release stages already verified in this session. Existing checkout and dependencies are reused; no additional worktree or dependency installation is needed.
