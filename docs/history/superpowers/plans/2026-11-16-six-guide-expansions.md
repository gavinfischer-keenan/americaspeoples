# Six Guide Expansions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Inline integration with independent source-checking subtasks and one fresh whole-branch review. Steps use checkbox syntax.

**Goal:** Make six archaeological landscapes more legible through individual public features, dated phases, local timelines and shared-context movies.
**Architecture:** Extend EvidenceRecord, existing guide catalog/content and StoryScene arrays. Canonical locations connect phases; the shared dataset supplies master/Explore/movie/export views. Add observation titles to the close-up chronology list.
**Tech Stack:** Existing TypeScript, static guide builder, SQLite/JSON and Playwright/Edge. No new dependencies.
**Spec:** docs/superpowers/specs/2026-11-16-six-guide-expansions-design.md

## Global Constraints
Consensus began at 74 lifetime calls; two Deep reports completed at 80. The user then replaced the old cap with 75 additional calls. None of that new allowance is used. Shared observations, main1934limit, existingHawaii1959exception, noncommercialreuse terms, sourceaccess/uncertainty, publiccoordinatesonly, currentplusonepreviousretention. AllsixguideURLs and Chaco's existingstoryID retained. Root integrates; researchsubtasks write private proposals only.

## Review Focus
1. Reused timber/sample dates masquerading as complete building/use lifespans: test scoped temporal interpretation and source-linked phase records.
2. Different named structures silently sharing a park centroid: test geographic source/precision and independent checked anchor tolerances; same-building phases must share canonicalgeometry.
3. A large circle or stale chapter hiding all current local evidence: test each chapter's current located evidence in sharedmode and actualvisiblefeature aftercamera moves.
4. Older guides/stories/cards lost or duplicated during expansion: test originalGUIDEURLs/recordIDs and ChacostoryID retained, uniqueownership and onecardperguide.
5. Close-up phase links lose event names/dates or detach from sharedtime: test title/date labels and browser phaseclick/zoom-out withsharedcontext.

## Task1 — Checked evidence and guide/story integration
**Files:** new data/six-guide-expansion-records.json, src/six-guide-stories.ts, tests/six-guides.test.ts; modify data/site-guides.json, data/site-guide-content.json, src/stories.ts, src/published-data.ts, src/deep-dives.ts and relevant canonical oldrecordcollections only for independentlyverified corrections/reciprocallinks.
**Interfaces:** checkedprivate proposals → EvidenceRecord[] and GuideContent/Story arrays; outputs consumedbybuild and browser. Prefix newrecords `g20-`; reuse existingPlace.id for phases; everyrelatedID resolvesreciprocally.
- [x] Write tests requiring allsixguides withcontextualmovies, meaningfuladditionalsharedphase/featureevidence, retainedoldrecords/URLs, uniqueguideownership, source/coordinatecontracts and no newtopic-onlymembership; run RED.
- [x] ObtainoneDeepdossier, recordeverycall, checkoriginalsources/maps independently in threeprivate domains; root spot-checks and reconciles against frozenv0191records.
- [x] Add checkednewrecords, source-supported corrections, reciprocallinks, sixexpandedguides andmovies (keepchaco-connections ID). Updateexpansionlabels tocompletedselectedexpansion, withoutclaimingexhaustivecoverage.
- [x] Run targetedcontracts and existingvalidation; expectedGREEN withnoinvalidreferences/cultureIDs/duplicateplaces. Commit.

## Task2 — Close-up chronology and release packaging
**Files:** src/local-chronology.ts, tests/local-chronology.test.ts or existingowner; new tests/six-guides.browser.mjs; scripts/build.ts, scripts/verify-release.mjs, scripts/world-coverage-audit.ts; versionfiles, generatedsites/workbook/audits; docs/six-guide-expansions.md, docs/roadmap.md, README.md, verificationreceipt.
**Interfaces:** Task1's sharedrecords+storyIDs → localizedmovieviews, staticguides, workbook/API, releaseassets; existingdata-local-record/year handlers preserve shareddate.
- [x] Add failing assertion that close-up chronology names eachphase ratherthanrepeatingonlytheplace; implementobservationtitlewithplacename/date keptreadable.
- [x] Add desktop/tabletbrowser checks for everynewchapter's currentvisiblefeature, overlapinspection and phaseclick, sharedcontext afterzoom-out, guide/cardnavigation and exportedrecordequality.
- [x] Registercollections/buildconversion/browserphase; updatev0.20.0/audits/documentation/researchbudget. Buildandrununits/types/validation/package/newbrowserchecks; expectedallpass.
- [x] Runcomplete releasegate; onefreshreview againstwholebranchbase/spec/ledger and primarysource spotchecks. FixCritical/Important once with RED→GREEN and requiredchecks; recordlimits andminorfindings. Commitverifiedresult.

### Accepted regional scope addition (before publication)
- [x] Add failing hierarchy contracts: Four Corners regional parent, four existing child studies, unique links, parent/child navigation, preserved shared clock and current evidence.
- [x] Extend guide catalog with optional parentGuideId and study level; render nested place groups, static-guide breadcrumbs/children and story navigation. Preserve existing guide URLs and unique record ownership.
- [x] Check regional Deep dossier against originals; author Four Corners movie/guide with community continuity and qualified movement evidence. Add public Aztec, Salmon, Canyon de Chelly and Cortez-area closer studies where sourced; clarify Peñasco Blanco/Pueblo Bonito and integrate their local treatment.
- [x] Add Chaco road map, authority/inequality debate and post-Chaco architectural/social discussion, with distinct source confidence. Propose other regional groupings in a source-linked roadmap.
- [x] Expand the same new browser release phase to verify regional → local → regional navigation and retained contemporaneous evidence; update counts and budget from final data rather than assumed numbers.

## Task3 — Publish and verify
**Files:** docs/releases/v0.20.0-verification.json and private deploymenthelpers/logs.
**Interfaces:** verifiedbranch → mergedreleasepackage → static/APIdeployment and publicchecks.
- [x] Push/createPR/merge understandingauthorization; buildmergedartifact, runmergedunits/packagechecks.
- [x] Stage/publish/deployv0.20.0; verifypublicassets/downloads/API, newguides/movies/masterrecords, exactdatenavigation, desktop/tablet andunchangedneighborcontent.
- [x] RunLinuxretentionchecks, retain0.20.0+immediatelyprevious0.19.1 only, removeobsoletearchives/payloads afterpathverification; recheckpublicsite, commit/pushfinalreceipt.

Self-review: allspecitems map toTask1 evidence/movies,Task2 localUI/package/tests,Task3 release. No schema/dependencychange planned. Source count targets are aspirations, notpermissiontofabricateevidence; anyunresolvedplacement remains explicit.

Accepted budget revision: both Deep reports completed at lifetime80 calls. The user now authorizes75 additionalcalls fromthatpoint, replacing the old100totalcap. Track the fresh allowance separately from reportedmonthlyaccountcredits65/200; no newresearchcalls currentlyneeded. PuebloBlanco clarified as PuebloBonito; selectedadditionalpublicFourCornerscomplexes are authorized.

## Additional accepted scope — readable evidence panels

The user supplied a Kruger 2 screenshot showing a location-precision note under Where and an editorial audit placeholder instead of an explanation of the discovery. This is part of the current release.

- Replace the main panel with a factual description, recognizable named place, date and plain-language date meaning.
- Keep original dating, geographic precision and limitations in expandable Evidence and uncertainty; preserve source links and disputed interpretations.
- Use the same factual description and named location in hover/full-review introductions.
- Replace process-only summaries across the older record families with source-supported descriptions, including a primary-source pass on the 24 Northeast records. Preserve numeric dates and geometry unless a separately verified correction is explicitly recorded.
- Check catalog/full-record refresh, keyboard identity, uncertainty access, exact-date selection, tablet layout and the user-supplied Kruger case.


## Further accepted display and writing scope

The user added: plain-history inspectors and full reviews; readable place names; a source-backed Maní account; broad fact-first prose cleanup; a labeled topographic map at the top of every place guide; clickable tile surfaces; hover text that leaves Hawaiʻi visible; and independent collapse arrows for the upper two Watch sections. The 11,966 BCE white overlay was investigated and traced to four reversed ice rings. These are implemented in the same authorized release. No additional Consensus calls were used. Full release checks and fresh final review remain required before publication.


Source implementation and the 40-stage gate are complete. The final review and bounded remediation are documented in docs/six-guide-expansions.md. PR #17 is merged and v0.20.0 is live. Public assets, downloads, API, desktop/tablet behavior and retention are verified; v0.19.1 is the single rollback release. See docs/releases/v0.20.0-verification.json.
