# Current source verification

Version **0.17.0 is merged and deployed** at [the live atlas](https://americaspeoples.11mosswood.us/). PR #13 was merged as `6229cff4b940e79eb2476fc616475ee7deda4dd9`; the published artifact commit is `947a08e44bfef2f5b2fc660d31d390c21ca913be`. The [candidate receipt](https://github.com/gavinfischer-keenan/americaspeoples/blob/main/docs/releases/v0.17.0-verification.json) records this update; [the v0.16 receipt](https://github.com/gavinfischer-keenan/americaspeoples/blob/main/docs/releases/v0.16.0-verification.json) retains the last deployment checks.

This release contains **2,075 records: 2,017 shared and 58 focused**. It adds 37 shared observations at 13 public location anchors, refines two existing Kuk onset windows, and adds Caral/Supe, Kuk and Upano guides with 19 contextual movie chapters. These are dated observations, not 37 newly discovered settlements. Consensus Deep usage is **70/100 calls**, including submission and polls; 30 remain. Complete generated reports stay private.

The Deep dives directory now classifies all **20 independent movies, 14 contextual stories and 15 guides** into Subjects, Places, Languages and Cultures. Four place cards combine a movie and guide. All existing links remain reachable. The 25 Coming soon entries have no play controls; six existing guides are separately marked for expansion.

All **34 release-check stages passed**, including **295 unit tests**, TypeScript, full evidence validation, self-host startup, API behaviour, every imported review page, spreadsheet round-trip, movie playback and navigation. All 37 new records match the packaged dataset and SQLite exactly. Every new chapter has current evidence visible in its camera, and the shared world remains present after zooming out. Old links and shared year/camera restoration pass. Desktop and tablet screenshots were inspected; basic phone overflow checks pass.

The Windows run passed ten Python cases and skipped five Linux symlink-retention cases. Retention code did not change. Browser checks used installed Edge on Windows and do not claim physical-device or exhaustive cross-browser coverage.

One fresh independent whole-branch review found no Critical or Important issues. One minor wording cleanup is deferred: two Kuk background discussion sentences retain older rounded institutional dates alongside the refined calibrated onset fields. The mapped dates are correct.

The ordered release gate ran in two parts: stages 1–24 passed, then a new browser test caught a redraw-timing race while checking Kuk chapters at the same location. A test-only change waits for current evidence and screen geometry together. All 19 scenes and stages 25–34 then passed; no application or data changes intervened. The receipt records both logs and the test-only commit.

The [evidence guide](early-continuity.html) distinguishes full-text, supplement, synopsis and abstract access. Nimowa remains limited to the original author abstract; its point is a generalized island reference. Regional Upano phases do not directly date every structure. Unknown continuation is not abandonment. No new route was invented from an imported object or non-local isotope alone. The [world comparison](world-coverage-audit.html) and [65-region matrix](coverage-audit.html) retain gaps and separate observations from localities. Australian pastoral/wool and mining movies remain queued.

## Public deployment verification

The public API reports v0.17.0 and 2,075 records. Public app assets, guides and downloads match the built release, and all five GitHub release assets match local checksums. Live desktop and tablet checks passed for the shared Americas movie, the four directory categories, all 45 available cards, the 25 planned entries, the three new contextual place movies, source-date locating and independent topic playback.

The merged release passed 295 unit tests and five package checks. Five Linux retention safety tests passed on the host. Server, GitHub and local versioned archives retain **v0.17.0 and v0.16.0 only**. Public verification passed again after cleanup. All 388 unrelated origin files and three neighbouring public pages were verified unchanged.

The next authorized campaign completes the 25 Coming soon entries in two separately merged and deployed batches (13 then 12). New research is not part of this release.
