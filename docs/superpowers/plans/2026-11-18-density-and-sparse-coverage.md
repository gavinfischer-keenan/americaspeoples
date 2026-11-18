# Map clarity and sparse coverage implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the shared historical map legible at every scale and add sourced local histories to all ten sparsest geographic areas.

**Architecture:** Keep canonical historical records and dates unchanged by presentation. A deterministic screen-space grouping layer reconciles exact-coordinate places before crowding, while existing renderers retain details and routes. New research enters the existing validated dataset and source/coverage pipeline.

**Tech Stack:** TypeScript, custom D3 geographic/SVG renderer, JSON evidence, Node tests and Playwright, Python deployment helpers.

**Spec:** `docs/superpowers/specs/2026-11-18-map-density-design.md`; user additionally authorized researching all ten sparse regions in that audit.

## Global Constraints

- Preserve one shared date across ordinary stories, Explore, journeys and master map. Topic dives retain intentionally isolated topic mode.
- Every in-view time-eligible item remains individually represented or in an expandable group; no silent arbitrary top-N deletion.
- Sparse features remain individual even zoomed out; dense groups expand to towns/site buildings as room permits.
- Group counts are mapped locations/places/records according to reconciled identity, never population or traffic volume.
- Keep actual source coordinates/date windows/direction semantics. Only visual simplification/exaggeration.
- Prior evidence remains quieter contextual representation; evidence-window endings are not abandonment.
- Desktop/tablet first; graceful phone fallback. Preserve keyboard, generous targets, pause and reduced motion.
- Playing uses a stylized overview with broad directional corridors and named community groups; pausing fades those graphics into an inspection view with stronger place/route/date detail. Keep camera, date, selection and historical content fixed through the transition. Do not imply population or traffic volume with graphic size. Zoom still controls appropriate detail in either state.
- No invented occupations, routes, battle dates or surveyed buildings. Plain historical prose precedes short uncertainty notes and sources.
- Consensus Deep only for this campaign; 49 calls available at start, count dispatch and retrieval, keep full report private.
- Current plus one previous deployed release; standing user authorization covers push/merge/deploy.

## Review Focus

- Same-place phases and point/route evidence cannot inflate place counts (Task1 reconciliation tests).
- Offscreen endpoints can have onscreen crossing routes; date changes must not reset pan or shared clock (Task1 browser tests).
- Unknown direction must not acquire one-way chevrons; pause/reduced-motion must stop movement (Task1 route tests).
- Broad dating ranges and explicit gaps must not become continuous occupation (Task2 provenance/date tests).
- Sparse ranking must handle modern geographic clipping and dateline island groups without presenting ancient borders (Task2 audit tests).

### Task 1: Implement scale and crowding display

**Files:** Create `src/map-density.ts`, `tests/map-density.test.ts`, `tests/map-density.browser.mjs`; modify `src/map.ts`, `src/map-place-groups.ts` as needed, relevant `src/styles.css`, `src/atlas-context.css`, `src/atlas-ui.css`, map picking/label/tooltip modules as needed.

**Interfaces:** Consume existing DisplayRecord, shared date/state, projection and viewport. Produce pure `densityGroups` helper (typed input/output defined locally and exported) and map renderer integration. Add DOM data attributes for group membership/count accounting and diagnostics. Keep historical/data APIs unchanged.

- [ ] Write failing meaningful unit cases: nearby locations group; sparse stays single; co-located phases count once; input permutation stable; selected/focused records traceable; explicit active/prior counts; dateline and large synthetic fixture; no omitted IDs.
- [ ] Run tests and observe expected missing feature failures.
- [ ] Implement deterministic locality grouping with stable anchors within zoom bands and sensible screen-distance tuning. Reuse exact-coordinate groups first. Expand groups on click; member chooser at maximum useful zoom; no source coordinate mutation. Keep selected place/event and active journey accessible. Labels and symbols cooperate; grouped records retain types and current/prior distinction. Represent regional overlays honestly and reduce their interference. Implement gradual regional/local/site detail and actual-change emphasis without camera jumps or fabricated precision.
- [ ] Strengthen history and legacy movement rendering with opaque dark casing, thicker colored cores and legible arrowheads; migration amber, trade cyan, forced relocation magenta plus shape/text. Preserve unknown/both direction; pause/reduced motion. Bundle only compatible route corridors where useful, with expandable membership. Quiet overview terrain and retain local terrain detail.
- [ ] Implement the user's playback/paused visual distinction above. Test play/pause does not jump camera/date/selection or lose group members; reduced-motion users retain static emphasis. Paused dense views still use safe grouping rather than returning to unreadable overlapping marks.
- [ ] Add browser assertions/screenshots for1200/1492/1832/1863, FourCorners, Chaco, centralMexico, easternBrazil, Hawaii and sparse regions. Prove every eligible mapped member represented, Columbus/Taos shareddate discoverability, labels/targets usable, pan continuity, paused/reduced motion, crossing routes, date gaps Formoso650/Primavera1350. Run focused tests/typecheck/build; report measured density/performance before/after. Commit only owned changes.

### Task 2: Fill ten sparse regions and audit geographic counts

**Files:** Create `data/sparse-ten-expansion-records.json`, `data/sparse-ten-source-decisions.json`, `data/sparse-ten-coverage.json`, `tests/sparse-ten.test.ts`; modify `src/published-data.ts`, coverage/source/index generation and geographic audit as appropriate; add contextual guide/scenes to existing regional guides where supported. Private research under `work/sparse-ten/`.

**Interfaces:** Produce canonical EvidenceRecord[] compatible with existing schema. All sources participate in claims with support or context roles. Include stable locality IDs and explicit history.windows when discontinuous. Root owns canonical integration; independent source investigators own private reports only.

- [ ] Dispatch one complete Consensus Deep request covering all ten; record every call in private ledger, preserve exact final report. Independently verify primary sources and geolocation, reconcile with existing records.
- [ ] Prepare accepted/rejected source decisions and before counts for IdahoS/C, MontanaC/E, NevadaC/E, NevadaS, WyomingE/W, LouisianaWcoast and Gilbert/Phoenix/Line islands. Aim multiple dated localities/periods each without invented quota data; no1937Phoenix scheme inside1934scope. Avoid duplicate existing Anzick/SilverZone/PuebloGrande/LaPrele/Colby.
- [ ] Add meaningful tests for accepted region coverage, source participation, known date gaps, public locality precision, correct geographic bin, canonical/master-map membership and duplicate identity. Observe failures before integration.
- [ ] Integrate accepted evidence with accessible historical text, sources, local timelines and trade/conflict only when supported. Existing guides gain related information/links where relevant; no mandatory new topic mode. Improve sparse audit geographic clipping/dateline grouping and publish before/after with limitations.
- [ ] Build and run tests/validation; inspect representative scenes and map dates. Commit reviewed data/integration.

### Task 3: Verify, release and publish

**Files:** package metadata, release notes, source/license/generated outputs, deployment receipt; private helpers under `../deployment/v0260/` (adjust version if necessary).

- [ ] Independently review Tasks1/2 for spec compliance and quality; fix material issues with targeted tests.
- [ ] Run complete `npm run verify:release`, visual desktop/tablet checks and fresh whole-branch review. Fix new material findings; broaden only when justified.
- [ ] Prepare concrete release notes, push/create PR, merge authorized completed work. Build verified release assets, stage with current source/hash guards, deploy atomically, verify live map/API/assets and neighboring sites.
- [ ] Retain current and one previous release. Do not touch previously rejected old temporary payload deletions. Publish verification receipt and report counts, remaining research calls and live link.
