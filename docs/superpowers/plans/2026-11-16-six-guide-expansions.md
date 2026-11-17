# Six Guide Expansions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Inline integration with independent source-checking subtasks and one fresh whole-branch review. Steps use checkbox syntax.

**Goal:** Make six archaeological landscapes more legible through individual public features, dated phases, local timelines and shared-context movies.
**Architecture:** Extend EvidenceRecord, existing guide catalog/content and StoryScene arrays. Canonical locations connect phases; the shared dataset supplies master/Explore/movie/export views. Add observation titles to the close-up chronology list.
**Tech Stack:** Existing TypeScript, static guide builder, SQLite/JSON and Playwright/Edge. No new dependencies.
**Spec:** docs/superpowers/specs/2026-11-16-six-guide-expansions-design.md

## Global Constraints
Consensus74baseline/100cap; allresearch requests Deep. Shared observations, main1934limit, existingHawaii1959exception, noncommercialreuse terms, sourceaccess/uncertainty, publiccoordinatesonly, currentplusonepreviousretention. AllsixguideURLs and Chaco's existingstoryID retained. Root integrates; researchsubtasks write private proposals only.

## Review Focus
1. Reused timber/sample dates masquerading as complete building/use lifespans: test scoped temporal interpretation and source-linked phase records.
2. Different named structures silently sharing a park centroid: test geographic source/precision and independent checked anchor tolerances; same-building phases must share canonicalgeometry.
3. A large circle or stale chapter hiding all current local evidence: test each chapter's current located evidence in sharedmode and actualvisiblefeature aftercamera moves.
4. Older guides/stories/cards lost or duplicated during expansion: test originalGUIDEURLs/recordIDs and ChacostoryID retained, uniqueownership and onecardperguide.
5. Close-up phase links lose event names/dates or detach from sharedtime: test title/date labels and browser phaseclick/zoom-out withsharedcontext.

## Task1 — Checked evidence and guide/story integration
**Files:** new data/six-guide-expansion-records.json, src/six-guide-stories.ts, tests/six-guides.test.ts; modify data/site-guides.json, data/site-guide-content.json, src/stories.ts, src/published-data.ts, src/deep-dives.ts and relevant canonical oldrecordcollections only for independentlyverified corrections/reciprocallinks.
**Interfaces:** checkedprivate proposals → EvidenceRecord[] and GuideContent/Story arrays; outputs consumedbybuild and browser. Prefix newrecords `g20-`; reuse existingPlace.id for phases; everyrelatedID resolvesreciprocally.
- [ ] Write tests requiring allsixguides withcontextualmovies, meaningfuladditionalsharedphase/featureevidence, retainedoldrecords/URLs, uniqueguideownership, source/coordinatecontracts and no newtopic-onlymembership; run RED.
- [ ] ObtainoneDeepdossier, recordeverycall, checkoriginalsources/maps independently in threeprivate domains; root spot-checks and reconciles against frozenv0191records.
- [ ] Add checkednewrecords, source-supported corrections, reciprocallinks, sixexpandedguides andmovies (keepchaco-connections ID). Updateexpansionlabels tocompletedselectedexpansion, withoutclaimingexhaustivecoverage.
- [ ] Run targetedcontracts and existingvalidation; expectedGREEN withnoinvalidreferences/cultureIDs/duplicateplaces. Commit.

## Task2 — Close-up chronology and release packaging
**Files:** src/local-chronology.ts, tests/local-chronology.test.ts or existingowner; new tests/six-guides.browser.mjs; scripts/build.ts, scripts/verify-release.mjs, scripts/world-coverage-audit.ts; versionfiles, generatedsites/workbook/audits; docs/six-guide-expansions.md, docs/roadmap.md, README.md, verificationreceipt.
**Interfaces:** Task1's sharedrecords+storyIDs → localizedmovieviews, staticguides, workbook/API, releaseassets; existingdata-local-record/year handlers preserve shareddate.
- [ ] Add failing assertion that close-up chronology names eachphase ratherthanrepeatingonlytheplace; implementobservationtitlewithplacename/date keptreadable.
- [ ] Add desktop/tabletbrowser checks for everynewchapter's currentvisiblefeature, overlapinspection and phaseclick, sharedcontext afterzoom-out, guide/cardnavigation and exportedrecordequality.
- [ ] Registercollections/buildconversion/browserphase; updatev0.20.0/audits/documentation/researchbudget. Buildandrununits/types/validation/package/newbrowserchecks; expectedallpass.
- [ ] Runcomplete releasegate; onefreshreview againstwholebranchbase/spec/ledger and primarysource spotchecks. FixCritical/Important once with RED→GREEN and requiredchecks; recordlimits andminorfindings. Commitverifiedresult.

## Task3 — Publish and verify
**Files:** docs/releases/v0.20.0-verification.json and private deploymenthelpers/logs.
**Interfaces:** verifiedbranch → mergedreleasepackage → static/APIdeployment and publicchecks.
- [ ] Push/createPR/merge understandingauthorization; buildmergedartifact, runmergedunits/packagechecks.
- [ ] Stage/publish/deployv0.20.0; verifypublicassets/downloads/API, newguides/movies/masterrecords, exactdatenavigation, desktop/tablet andunchangedneighborcontent.
- [ ] RunLinuxretentionchecks, retain0.20.0+immediatelyprevious0.19.1 only, removeobsoletearchives/payloads afterpathverification; recheckpublicsite, commit/pushfinalreceipt.

Self-review: allspecitems map toTask1 evidence/movies,Task2 localUI/package/tests,Task3 release. No schema/dependencychange planned. Source count targets are aspirations, notpermissiontofabricateevidence; anyunresolvedplacement remains explicit.
