# Historical release verification

These are dated observations for past builds, not the current hosting contract.

# Release verification

Release 0.2.1 — October 28, 2026.

## Automated checks

- 42 Node tests cover BCE/CE conversion, inclusive boundaries, gaps, uncertain occurrences, approximate reference dates, validation, unsafe links, portable drafts, duplicate/conflicting imports, stable category identity, schematic-only routes, and playback boundary snapping.
- TypeScript strict type checking and dataset validation run before release.
- Eight evidence records have substantive review pages and valid source mappings. Fourteen distinct sources are cited. Source-access limits are explicit, including abstract-only checks; automated validation is not a scientific peer review.

## Browser coverage

The five offline browser suites use real file URLs, not an HTTP server. Network access is disabled at browser-context level. They exercise year input and playback; all eight bibliography/review routes; corrections and new drafts; download/import round trips; duplicate detection; unreviewed-data isolation; storage-denied behavior; hostile text rendering; culture conflict normalization; time-bounded synthetic movement arrows; overlap discovery; post-pan selection; approximate-date preservation; export-size validation; fixed-panel layout; and a 390-pixel mobile viewport.

The final release is tested after extracting the ZIP using installed Microsoft Edge and Google Chrome. Verified versions: Microsoft Edge 156.0.4314.50 and Google Chrome 156.0.8078.73. All five offline browser suites passed in both browsers against the extracted ZIP. Desktop/mobile viewport rendering is checked; no claim is made for testing a physical phone, Firefox or Safari.

An independent read-only code review identified three issues: a draft could save despite being unexportable; imported novel cultures could disagree on color; and invented curves could be labeled supported routes. Each was reproduced and fixed with regression coverage. The review did not independently audit scholarly publications or replace browser verification.

Bulk tests additionally cover the actual distributed XLSX example, workbook relationships, complete correction bases, repeat-import deduplication, BCE/CE parsing, reference metadata and formatting, formulas, macros and bounded archive parsing. A follow-up code review found that the second ZIP parser could bypass the first parser's declared-size bound. The importer now rebuilds a stored archive from bounded buffers before the second parser; a forged-size regression covers this case.

## Limits and deliberate decisions

- Eight entries demonstrate the research model; they do not supply comprehensive geographic or temporal coverage. No migration route is asserted in the starter corpus. Synthetic movement tests never ship as scholarly records.
- All displayed route curves are schematic endpoint connections. Schema version 1 rejects purportedly supported path geometry; intermediate route reconstruction requires a later schema extension.
- Bulk bibliography and claim mappings use the documented XLSX tables. The single-record form also offers structured JSON editors. The ordinary narrative, location, culture and date fields have labeled form controls.
- Browser storage is a convenience. Exported JSON is the portable backup; packages must fit 8 MB / 1000 proposals. A proposal that cannot be exported is rejected before leaving the editor.
- Approximate single-year references are not expanded into fabricated date ranges. Playback lands on boundaries and holds briefly, making them visible; review links can also jump directly to them.
- Unknown occupation bounds remain unplaced unless a defensible bounded interval is supplied. The reviewed dataset determines the timeline minimum; proposals do not silently redefine it.
- The basemap shows generalized present-day coastlines. It is not a reconstruction of ancient shorelines, sea levels, ice sheets or political boundaries.
- This release prepares static hosting but does not verify a public deployment. There is no telemetry, auto-update service, account system or central suggestion collection. A hosted URL requires initial network access; the extracted ZIP supplies the supported fully offline mode.

Overlay checks cover geometry validation, schema-version preservation, time bounds, layer toggles, review navigation to hidden layers, editor/export preservation and comparison of removed overlay metadata. Point and LineString overlays are supported. Polygons are deliberately rejected; no territorial boundaries are inferred. The populated research batch remains an importable set of proposals, separate from the eight-record bundled corpus.

The researched workbook adds 51 proposals (30 ordinary records and 21 overlays), 145 claims, 123 bibliography entries and 201 claim/source mappings. Every saved XLSX record is validated and opened in the offline browser. Selected coverage includes six forced removals, five epidemic records and six violence records. Five overlays remain unmapped where the evidence does not support a defensible geometry. These proposals are not independently peer-reviewed or exhaustive.

The 1934 extension uses one shared endpoint for validation, timeline input and playback. Further review caught coerced array values bypassing the overlay-kind enum and directional wording on point-only removal records. Regression tests now reject non-string kinds and reserve arrow wording for lines; point locators use a neutral symbol.

## v0.2.1 deployment preparation checks (historical)

`npm ci`, `npm test` (42 passing), `npm run typecheck`, `npm run validate` and `npm run build` passed. Node.js 24.19.0 was used. The clean build includes all runtime assets and all 59 appendix records while keeping the eight bundled entries distinct from the 51 optional proposals. Appendix tests preserve complete JSON records, escape text, and verify per-record provenance, source-check dates, history and geographic caveats in readable HTML.

All five offline suites and the additional hosted suite passed in both Edge 156.0.4314.50 and Chrome 156.0.8078.73 against the extracted v0.2.1 ZIP. The hosted suite uses the same files at a loopback HTTP root with the recommended CSP, MIME and caching headers. It checks hash deep-link reloads, 51-record workbook import and deduplication, JSON download, exact preservation of existing storage across reloads, the 1864 removal/violence overlays, 59 appendix entries, unavailable-browser-API help and JavaScript-disabled help. No application uploads, external resource requests, page errors or CSP violations were observed in that workflow. Public Caddy/Cloudflare behavior remains for the deployment agent to verify.

The dependency audit identified a malformed-ZIP64 parsing issue in fflate 0.8.2. The lockfile now pins the upstream [0.8.3 fix](https://github.com/101arrowz/fflate/releases/tag/v0.8.3); its license notice is updated. `npm audit --audit-level=moderate` reports zero known vulnerabilities as of October 28, 2026. The workbook archive-bounds and malformed-input regression tests pass. An audit is not proof that every dependency is vulnerability-free.

An independent read-only deployment review found missing record/geographic provenance in the readable appendix. This was reproduced, corrected and checked for every record. The reviewer confirmed the finding resolved. Screenshots of the built appendix and map were inspected for readable layout. Animal branding and the final hostname remain to be supplied/confirmed by the deployment work; no infrastructure was changed.

## v0.3.0 literature and settlement release

October 28, 2026: 267 published records (55 ordinary evidence rows and 212 overlays), 389 claims and 426 record-scoped reference entries. Twenty-three complete author-supplied text exports are archived with SHA-256 hashes. Source reconciliation retains excluded comparisons, unresolved metadata, abstract-only access and corrections; a synthesis is not mislabeled as primary research.

`npm test` passes 59 tests; `npm run typecheck`, `npm run validate` and `npm run build` pass. The actual researched XLSX imports all published records as corrections and preserves dates, claims, source mappings, population estimates and overlay geometry. The older schema-1 template and current sample template still import. Malformed archives, formula/macro content, unsafe links, byte/count limits and stale revisions remain checked. The native JSON cap is deliberately 8 MB/1000 proposals so the complete snapshot fits; XLSX stays at 5 MB compressed/20 MB expanded.

Independent read-only review found a broken internal population-citation anchor and stale workbook references/revisions. Both were corrected and independently rechecked. The reviewer found no remaining blockers and confirmed tests/type checking. A further regression verifies that records without a usable location or date explain why map navigation is unavailable.

Browser checks on the built local atlas verified individual Hovenweep-area records, deep map focus, unknown striped symbols, separate population-range halos, culture/date information and population citation navigation without losing the review route. Date fading is illustrative; no statistical posterior is invented. Current archaeological reference coastlines are not a detailed local street map. Additional named-site datasets still need source-supported dates and public coordinates; this release is selected coverage, not a complete inventory of settlements.


## v0.3.3 consolidated intake release

500 records and 759 claims; all 482 prior record IDs retained. Twenty original uploads are archived with verified SHA-256 hashes. Eighteen reviewed additions and five existing-record context updates preserve unresolved claims separately. All 67 tests, validation, typecheck, offline and hosted browser checks pass. Workbook round-trip preserves the complete snapshot. Proposal packages are bounded at 8 MB and 1000 proposals, allowing the full workbook plus existing local suggestions. Published app bytes and three download hashes verified after atomic deployment to NODE01 CT101 release 20261029T052034Z. Previous release 20261029T005925Z remains available for rollback.


## v0.3.4 consolidated research release

Validated 515 records and 774 claims. All 67 tests, TypeScript checks, production build, and hosted Chromium checks passed. Browser checks covered full-snapshot import/export, persistence, deep links, CSP and no data uploads. Independent review checked preservation of the previous 500 records, four intended contextual updates, chronology and citation metadata. Corrections included Angi 3900 BCE encoded as astronomical year -3899 and three exact citation titles. Public deployment bytes match the tested build (apart from the disclosed Cloudflare beacon); all three download SHA-256 checksums passed. NODE01 CT101 release: 20261029T060245Z; rollback: 20261029T052034Z.


## v0.3.5 contrast and direction cues

Audited map symbol and label palettes against ocean #122730 and land #2d454d. Opaque symbol colors meet 3:1 and labels meet 4.5:1. Temporal fade intentionally lowers contrast at uncertain date boundaries; qualitative glows remain soft. Bright dashed cloud centers, dotted cultural-area contours and dark-backed text/direction symbols improve visibility. Explicit direction supports forward, reverse, two-way and multidirectional; missing metadata remains unspecified. Seven source-described dispersal records have direction cues, including the Davis and Madsen scenario. Multiple directions are schematic, not four literal routes.

69 tests pass, typecheck/build and hosted browser checks pass, and the target scenario with direction symbol was checked in a 1600x1000 screenshot. Legacy workbooks import without the optional direction column. Full snapshot retains 515 records and 774 claims. Public app matches built bytes and all three download checksums pass. NODE01 CT101 release 20261029T185850Z; rollback 20261029T060245Z.


## v0.3.6 Pacific intake and map workspace

All19 original uploads are archived with hashes and complete secondary-provenance text.32 new records plus7 contextual updates yield547 records and818 claims; all515 previous records preserved. Fresh review caught and fixes resolved desktop hidden-panel grid placement, explicit Bapot BCE encoding, and disjoint Tangatatau tool dates. Bayesian site-method metadata is explicit for model filtering.73 tests, typecheck, build, complete-workbook import/export, hosted-browser privacy/CSP/deep links, viewport zoom/pan/reset, all8 panel-toggle combinations at2 desktop widths and mobile overflow checks passed. Live asset comparison and three download hashes verified. Reconciliation register identifies exclusions and source leads still pending.

## Pending release: Smart timeline (2026-10-29)

78 unit tests and typecheck pass. Dedicated browser checks confirm Smart/log defaults, changing scale preserves the date, exact BCE/CE keyboard steps, local windows, pointer seeking, playback and responsive controls at1440/1100/768/390px. Map panel regression passes. Sparse/dense pacing is coverage-based and independent of scholarly status. No source dates or published dataset records changed; deployment held with open round7 intake.


## v0.3.7 release candidate

Authoritative hosted structured data, optional spreadsheet export, Smart/log timeline,280-record chronology review(64 recovered windows and5 disjoint additions), default-on separate unresolved-context geography, and a geographic/time audit.565 archaeological/context records,861 claims.13 full-review skeletal contexts integrated; latest19 intake items all captured/screened, additional synthesis claims explicitly pending original-source verification. Physical data are separate:49 NADI-1 snapshots with3 scenarios, NOAA ENSO reconstruction1525–1934, NOAA tsunami source catalog and GVP Holocene eruptions within documented bounds. Complete NOAA pagination is checked; open eruption-date modifiers are excluded from annual animation and retained in catalog review. Uncertain/discredited reports are opt-in. Current/wind arrows are modern schematic orientation, not a historical simulation. No unsupported human-impact causality or open-water area is fabricated.

Final candidate verification:86 unit tests, typecheck and complete dataset validation pass. Dedicated physical-layer browser, Smart/log timeline, map-panel/viewport regression, file:// offline operations and hosted privacy/CSP/import-export checks pass. Independent review findings on numeric eruption uncertainty and supported ongoing eruptions were fixed with regression tests. Release payload switches only NODE01 CT101 public-web content; the existing release remains available for rollback.

Public release verified2026-10-29: NODE01 CT101 /srv/tripofisch/releases/20261029T220044Z; rollback /srv/tripofisch/releases/20261029T194704Z. Public app, audit and physical-catalog files match built bytes; CSP/cache/MIME and404 checks pass. Three hosted downloads match SHA256 manifests. Live product-page launch, Smart/log defaults, ENSO/source review and public coverage report pass. Git release tag:v0.3.7.


## Research batch candidate — superseded by the0.4.0hybrid release

Round8 source synthesis with complete339-candidate decisions;37 source-checked additions and49 visibly labelled author-authorized AI colonial entries. Disjoint Checua burials remain separate, one-sided Ocmulgee constraints remain unplaced, source-to-recipient arrows are schematic, and conflicting population cells are excluded. Prior climate catalogs and hosting behavior are preserved. Validation results are recorded after final checks.


Pre-deployment verification:92 unit tests, strict typecheck and dataset validation pass. Offline, hosted, map panels, Smart/log timeline and physical-layer browser suites pass. Complete651-record workbook import/export and reload persistence pass; a bounded compressed local-storage envelope preserves legacy JSON and ordinary JSON exports. Independent review found and corrected Checua DOI, Darien/New Jersey conflicting wording and partial Tonga/Samoa reconciliation. Browser checks include visible AI attribution and339 decision entries.


## v0.4.0hybrid release candidate

92unit tests and strict type/data checks pass. Actual Python/SQLite API integration verifies exact full-source export, paginated summaries, indexed time/bounding-box/search queries, destination bounds, metadata-only search, invalid-query rejection, read-only methods and private-path exclusions. The API and browser keep published source dates and AI attribution. Full review/hazard details and dated ice geometry are loaded on demand; map/hazard summary indexes preload for smooth animation. App JavaScript reduced from21,517,688bytes to about666KB, a97%reduction before HTTP compression. This is not a complete viewport-streaming implementation.

Current browser checks use HTTP plus the actual Python API, not file://. Map panels/zoom/pan, Smart/log timeline, ice/scenario changes, hazards/source reviews, mobile width, full-workbook import/export, local collection reload, version consistency, source-decision pages and visible AI labels are exercised. A focused independent pre-deploy review found FTS location/language omissions and movement-destination bounds, now fixed with integration regressions. Full performance/modularity audit is next, after this deployment.


Hybrid public release verified2026-10-29: NODE01 CT101 static/API releases20261029T234257Z. Public API, bytes/headers, source-decision pages, three hosted download hashes and live product-page launch pass. Extracted self-host bundle starts independently and serves frontend, full record and ice requests. Proxmox64GBhost remains low-load with about60GBavailable; CT101memory increased1024→2048MiB,2cores unchanged, no partition change. Atlas dedicated non-root service:512MiBmemory ceiling,100%CPUquota,8requests,read-only SQLite; observed~13MiBservice memory. Twelve neighboring public app homepages remained byte-identical. Rollback static release20261029T220044Z and Caddy backupCaddyfile.before-americas-20261029T234257Z retained. Whaling/census intake held for next content round; complete code/performance/modularity audit follows this release.


## v0.4.3 research release — 29 October 2026

Round10 adds 54 source-linked findings to the prior738 records: 30 named-locality evidence records and37 with explicit calendar windows. These are records, not54 new settlements. Three receipt batches preserve37 file receipts,31 distinct hashes and one further Inca duplicate from round9. Fifty-two interpretation groups remain explicitly held;40 table rows retain their discovery trail. Source checks distinguish original full text, abstracts and institutional summaries. Uncalibrated BP, one-sided canal construction timing, pottery sample sizes and cultural/language assignments retain their limitations. No resident population inferred from samples.

All18 ordered release stages passed:122 unit tests, strict typecheck,792-record validation, production build,10 Python API tests, extracted self-host package and complete792-record workbook/review import, plus hosted privacy/CSP, layout/mobile, panels, Smart/log chronology, climate, map contrast/direction, DOM identity and network resilience. Nine added audit rectangles refine Idaho, Wyoming, both sides of the Aleutian dateline and Kiribati island groups;62 audit regions total. Deployment verification recorded separately after publication.


v0.4.4 navigation patch: About → Latest research source decisions now opens round10; previous decisions opens round9. The792 evidence records,54 additions and all scientific decisions are unchanged. Full release checks rerun for the final package.

## Archived 0.4.2 verification notes

Version 0.4.2 was the research release described by these historical notes. It follows the verified 0.4.1 maintenance and 0.4.0 hybrid releases. Current runtime requires HTTP and the Python/SQLite API; file:// checks are historical only.

Round-nine verification, October 29, 2026 (America/Los_Angeles):
- All 18 ordered release phases passed: 120 unit tests, 10 Python API tests, strict TypeScript, full dataset validation, actual workbook import and all 738 full review pages, privacy/CSP, map/timeline/mobile/physical layers, network failures and extracted self-host bundle.
- 87 new source-checked records; 651 preceding full records byte-identical. Hazards and ice geometry unchanged. Repeated Louisiana and Central American trade findings reconciled. Source-access limits and 31 held interpretation groups are explicit in the public round-nine report.
- Public build/assets, four new report/data files, five sampled new API reviews, 53-region coverage audit, launch flow, ENSO sources, latest-research link and all three hosted download checksums passed.
- Static release: `/srv/tripofisch/releases/20261030T005513Z`. API/database release: `/srv/americaspeoples/releases/20261030T005513Z`. Both preceding rollback directories end in `20261030T002228Z`.
- All 12 neighboring public app responses remained byte-identical. Proxmox had about 60 GB available memory and low load; public container storage 61% used. API service active at approximately 14 MB memory. No Caddy, resource or other-app changes in this release.
- [Future issue #1](https://github.com/gavinfischer-keenan/americaspeoples/issues/1) and [future issue #2](https://github.com/gavinfischer-keenan/americaspeoples/issues/2) created and independently read back with the exact `feature request` label. These features were not implemented.

The following observations describe the preceding 0.4.1 maintenance release.

Run `npm run verify:release` for the ordered current checks, including the extracted self-host bundle and actual API/browser tests. [Code audit](code-audit-2026-10-29.md) records findings and measurements. [Developer guide](developer-guide.md) explains module contracts. [Historical verification](release-verification-history.md) preserves earlier observations without treating them as current guarantees.

Production verification completed 2026-10-30 UTC.


Final source/package verification: all18phases pass, including116unit tests and10PythonAPItests. Fresh independent integration review found no new blocking issue; the conservative circle-edge advisory was fixed. Complete source records, uncertainty and metadata remain covered by exact-export/parity tests. Root before/after measurements and limits are in the code-audit report.

Production maintenance release:
- Static files: `/srv/tripofisch/releases/20261030T002228Z`.
- API/database: `/srv/americaspeoples/releases/20261030T002228Z`.
- Both rollback targets: preceding `20261029T234257Z` release in their respective release directories.
- All 17 public assets/documents matched the build; all three hosted download hashes matched. API manifest, full citations, dated ice snapshot, product launch, Smart/log timeline, ENSO review and coverage page passed live checks.
- All 12 neighboring public application responses remained byte-identical. Proxmox had approximately 60 GB available memory and low load; container storage was 59% used. API service active, approximately 13 MB memory.
- Deployment compared every full evidence record, hazard and ice snapshot against v0.4.0 in both directions: identical. No new facts or 3D features were included.
- The live climate check now waits for the visible ENSO marker: climate data intentionally loads after the core atlas, so an immediate count was a test timing error. The corrected live check passes.


---

## Source candidate 0.9.0 — 15 November 2026

Version **0.9.0 source release candidate**, checked 15 November 2026. These observations describe the review branch and locally built self-host package. They do not claim a production deployment; the live site remains on the previous release.

## Results

All 25 required release phases passed, with failed checks corrected and the affected phases rerun. Validation included:

- 220 unit tests, strict TypeScript, and validation of all 1,266 published evidence records.
- 10 Python/SQLite API integration tests; exact full-data export and compact-catalog contracts.
- Actual researched-workbook import, every one of the 1,266 evidence reviews, bibliography rendering, duplicate detection, editing, and reimport.
- Production build, packaged guides and license notices, and an independently extracted self-host bundle serving frontend, full reviews, and dated ice requests.
- Privacy/CSP and same-origin read-only requests; no automatic upload of visitor suggestions.
- Dated boundary replacement, transparent outline hit testing, actual pointer selection of Taos beneath context layers, accumulated rail construction, boat movement, port holds, and precise arrival cutoffs.
- Existing story playback, Movie/Explore separation, overlapping evidence choice, keyboard navigation, map/timeline behavior, mobile overflow, keyed panel identity, and network/search recovery.

The expanded Layers section initially displaced the close button in keyboard order. It now follows the panel header; the existing keyboard-focus browser regression passes. New browser assertions were corrected to follow the button's Show/Hide label and compare current boundary names separately from explanatory notes. Historical visit markers are explicitly accepted as past context, without claiming continued occupation.

After the final interface correction, TypeScript and 12 focused unit/publication checks passed again, as did the affected browser group. Desktop and 390-pixel phone views were visually inspected. Fresh independent whole-branch and delta reviews were completed and material findings resolved. These are engineering checks, not independent historical peer review or a legal opinion.

## Data and publication audit

The collection contains 1,266 evidence records, 1,243 dated boundary versions, nine stories with 49 scenes, and ten expedition itineraries with 69 dated anchors. Railway context contains 1,755 U.S. display groups and 20 selected regional built segments. Coverage and chronology limits are documented in [the expansion guide](atlas-expansion.md).

Eight Consensus Deep research runs used 22 total connector calls including polls, below the requested cap of 100. Full responses remain private. Current public research paths contain source-access notices; new packages do not include raw reports. Seventeen legacy ZIP files containing raw reports were verified against byte-identical private backups and withdrawn from the current source tree. Earlier Git history, tags, downloaded copies, and prior deployments are not erased by this change.

Original software uses PolyForm Noncommercial 1.0.0; original educational content and copyrightable curated data use CC BY-NC-SA 4.0. Third-party terms and unrestricted facts/public-domain material retain their separate status. See [reuse and contributions](reuse-and-contributing.md).

Run `npm run verify:release` to reproduce the complete ordered check set. [Historical verification](release-verification-history.md) preserves past release observations separately.


## v0.10 source-candidate observations (preserved)

# Current source release verification

Version **0.10.0 source release candidate**, checked 15 November 2026. These observations describe the review branch and locally built self-host package. The live site remains on 0.9.0 until this candidate is merged and deployed.

## Results

All 26 required release phases passed, with affected checks corrected and rerun. Validation included:

- 236 unit tests, strict TypeScript, and validation of all 1,336 published evidence records.
- 10 Python/SQLite API integration tests; exact full-data export and compact-catalog contracts.
- Actual researched-workbook import, every evidence review and bibliography, duplicate detection, editing and reimport, including compatibility with earlier workbook templates.
- Production build, packaged guides and licensing, and an independently extracted self-host bundle serving frontend, full reviews and dated ice requests.
- Privacy/CSP, same-origin read-only requests, and no automatic upload of visitor suggestions.
- Automatic Americas playback; Columbus and Taos in one 1492 world; contextual Beagle playback, fractional clock continuity and exclusion of out-of-scope itinerary phases.
- Chaco building selection beneath regional context, local phase dates, terrain registration/cropping, viewport filtering, zoom-out context and Hawaiian conflict context.
- Boundary replacement, accumulated rail construction and wrecks, contemporary boats, port holds and exact arrival/onset cutoffs.
- Keyboard/touch controls, Movie/Explore behavior, panel focus, responsive layouts, loading failures and search cancellation.

Desktop and 390-pixel phone previews were inspected. A deep-zoom visual check found oversized terrain painting surfaces: covered coarse rasters are now omitted, and the remaining rasters are clipped to visible viewports. Decorative regional circles avoid excessive dashes at local zoom; political borders remain dotted. The browser suite targets the interactive root map separately from nested raster viewports and waits for coalesced viewport updates.

Fresh-context whole-branch review and focused terrain review were completed. Material findings were resolved: shared-clock continuity, a Mesa Verde coordinate mismatch, Sun Temple construction semantics, exact-day event gating and voyage geometry caching. Independent checks confirmed deep global-only relief at Taos and local Chaco rendering. These engineering checks are not independent historical peer review or a legal opinion.

## Data and publication audit

The collection contains 1,336 evidence records, including 70 additions in this revision: 42 local archaeological places/phases, 18 Pacific and contemporary-context records, and 10 Hawaiian local records. There are 1,243 dated boundary versions, ten stories with 61 scenes, and ten expedition itineraries with 69 dated anchors. Railway context retains 1,755 U.S. display groups and 20 selected regional built segments.

The nine self-hosted terrain images total approximately 3.9 MB. They provide modern reference relief, not ancient landscape reconstruction. Public building/site anchors are not surveyed footprints; local chronology does not interpolate town sizes or population. Coverage gaps and source limits are documented in [the shared history update](shared-history-update.md).

Nine Consensus Deep research runs used 25 total connector calls including polls, below the requested cap of 100. Raw responses remain private. Public records contain original source-linked summaries, not provider reports.

Original software uses PolyForm Noncommercial 1.0.0; original educational content and copyrightable curated data use CC BY-NC-SA 4.0. Third-party terms and unrestricted facts/public-domain material retain their separate status. See [reuse and contributions](reuse-and-contributing.md).

Run `npm run verify:release` to reproduce the ordered checks. [Historical verification](release-verification-history.md) preserves earlier release observations.


---

# Current source release verification

Version **0.11.0 source release candidate**, checked 15 November 2026. These observations describe the review branch and locally built self-host package. The live site remains on the already deployed v0.10.0; this revision has not been merged or deployed.

## Results

All 27 required release phases passed in a complete run after the requested presentation and citation cleanup. Rolling-retention checks were then added and verified separately against real Linux directory symlinks; packaging and Python checks were rerun for that operational addition.

- 248 unit tests, strict TypeScript and validation of all 1,809 published records.
- 10 Python/SQLite API integration tests, full-data export and compact catalog contracts, plus five Linux retention-safety tests. Windows skips the latter where directory-symlink creation is unavailable; all five ran and passed on the target Linux host.
- The researched workbook imports all 1,809 records, including dates, history/linguistics metadata, geography, claims and references. Every imported review page rendered; reimport preserved correction/duplicate behavior.
- Production build, packaged documentation/licenses, and an independently extracted self-host package serving frontend, evidence reviews and dated ice requests.
- Shared Americas playback, simultaneous Columbus/Taos, contextual Beagle and regional stories, exact date gates, zoomed local places, relief, boundaries, rails, boats and loss history.
- Four focused topic controllers: direct links, all chapters with mapped evidence, play/pause/seek, 1799 language evidence, source review/return/locate, no unrelated context, and restoration of global year, fractional expedition date, selected journey, camera and Explore search, including entry through Library. Manual playback headings follow the live year and topic styling preserves header-link contrast.
- Desktop and 390-pixel phone screenshots inspected. Topic navigation fits, the map and transport remain usable, and additional narrative scrolls within its own panel. Source links and headings have explicit dark colors against the light panel.
- Privacy/CSP, same-origin read-only requests, editing/sharing, keyboard/touch interaction, map selection, panel identity, network failures and canceled searches.

The independent review led to corrections for Kitsissut’s specimen-date semantics, Ollantaytambo’s qualified construction attribution, and twelve imported encounter summaries. Source-described massacres and village attacks are distinguished from generic battle outcomes; Dakota/Lakota participants are not labeled Confederate from an inventory column heading. New regression tests failed before these fixes and passed afterward.

The two presentation follow-ups were completed before deployment: ordinary-story detail styling now targets the rendered blocks, and 14 source entries covering 12 scientific papers have formal titles, authors, journal details and DOIs checked against publisher-deposited metadata. Publication years follow journal issues where available.

## Coverage and limits

The 473 added records comprise 41 city and local-phase records, 401 encounter points, three northern evidence records and 28 topic-only records. Eleven ordinary stories contain 66 scenes; four separate topic movies contain 31 chapters. Ten expedition itineraries and the existing boundary/railway inventories remain shared-world context.

Source locations range from public archaeological-site references to explicitly approximate regional anchors. A historical document, construction window, specimen age and occupation interval remain different evidence. The language family forest is independent of the selected date; a 1799 frame is not a complete census or a guessed language polygon map. See [coverage decisions](cities-conflicts-coverage.md).

Two additional Consensus Deep runs bring the standing ledger to **31 calls out of 100**, including submission and polling calls. Raw generated reports remain private. Public records contain independently written claims and underlying source references.

Original software uses PolyForm Noncommercial 1.0.0; original educational content and copyrightable curated data use CC BY-NC-SA 4.0. Upstream BSD and CC BY terms, and unrestricted facts/public-domain material, retain their separate status. See [reuse and contributions](reuse-and-contributing.md).

Run `npm run verify:release` to reproduce all 27 ordered phases. [Historical verification](release-verification-history.md) preserves earlier observations.


## v0.12 source verification, before deployment


Version **0.12.0 source release candidate**. Live remains the deployed v0.11.0. This revision has not been merged or deployed.

Final revision checks passed: **255 unit tests**, TypeScript contracts, validation of all **1,834 records**, production build, the complete workbook round trip, packaged documentation, extracted self-host startup and all four topic browser suites.

The 27-phase release gate also passed before the final two review fixes, at 1,833 records and 253 unit tests. That gate covered all source reviews, hosted privacy/security, map behavior, spreadsheet editing, API and package checks. Python ran 15 cases: ten passed and five filesystem-symlink retention cases were skipped on this Windows host. Those five are not claimed as newly verified here.

The one whole-branch review identified two material issues, both reproduced and fixed: manual topic dates and review actions can now reach evidence earlier than the opening chapter, and the Hawaiian dog observation links reciprocally to an independently supported visit/provisioning record in shared history. Four new browser scenarios passed for these fixes. No critical issues, deferred minor findings or unjudged behaviors remain from that review.

The final topic browser suites checked all seven movies and 52 chapters, tablet portrait/landscape, basic phone layout, seven navigation regressions, and detailed island coastlines on both delayed and cached loads. A timing-only assertion was corrected to wait for the asynchronous evidence page before checking its return link. All these regression checks are included in the release gate.

Screenshots were inspected at 1,440 × 960 desktop, 1,024 × 768 tablet landscape and 768 × 1,024 tablet portrait. Small Pacific islands are present; tablet playback controls remain on screen and both map and narrative retain usable space.

Coverage: 1,834 records; seven separate topics, 52 chapters; 11 contextual stories, 66 scenes. New intake: 16 topic records and nine shared human-context records. Cumulative Consensus Deep calls:34/100. See [source decisions and limitations](pacific-topic-dives.md).

Tablet/computer are primary targets; phone is best effort. Current timelines retain the 1934 endpoint; queued topic-specific exceptions are not implemented yet.

Subsequent deployment: PR #8 merged and v0.12.0 went live, verified at 2026-11-16T06:35:45Z. All five Linux retention tests passed. Current and one previous release are retained; see docs/releases/v0.12.0-verification.json.


## v0.13 source verification

# Current source release verification

Version **0.13.0 source candidate**, not merged or deployed. Live is **v0.12.0**, merged from PR #8 and publicly verified on 2026-11-16 UTC; see [deployment receipt](releases/v0.12.0-verification.json).

The complete **28-phase release gate passed** on 2026-11-16: **261 unit tests**, TypeScript contracts, validation of all **1,860 records**, production build, three packaged-documentation checks, extracted self-host startup, API checks, every imported review and source bibliography, and all browser suites. The researched workbook imported and reimported all 1,860 records without duplicates.

Python ran 15 cases on Windows: ten passed and five filesystem-symlink retention cases were skipped. The unchanged retention code separately passed all five Linux safety tests during the v0.12 deployment in this session. These are distinct runs, not a claim that Windows executed the skipped cases.

The new browser suite checks all **31 new chapters**, three promoted bookmarks, shared-record dates, independent topic return state, named Amazonian sites, desktop and tablet navigation, and basic phone width. Existing suites passed for all ten topic movies, cached/delayed island coastlines, earlier manual dates, map picking, physical layers, and shared-world playback. Automatic Americas opening, simultaneous Columbus/Taos and contextual expeditions remain verified.

Desktop (1,440 × 960), tablet landscape (1,024 × 768) and tablet portrait (768 × 1,024) screenshots were inspected. Cotoca and Landívar are individually visible and the chapter text and playback controls remain usable. A simple one-column phone index fixes horizontal overflow at 390 px without changing the tablet layout.

A chapter date includes the whole calendar year. A November treaty is visible in its year rather than being hidden by a January 1 cutoff; expedition playback retains day-level dates. The packaged community source guide was verified after a reproducing missing-document failure. A pre-existing Atlantic test fixture now validates cross-collection links against the full published registry.

Coverage: **1,860 records; ten separate topics / 83 chapters; 11 contextual stories / 66 scenes**. New intake: 24 shared historical records and two topic-only lacrosse records. **Consensus Deep cumulative usage:38/100**, including dispatch and polling. See [source decisions and gaps](community-topic-dives.md). These checks establish software consistency, not scholarly completeness.

One fresh whole-branch review found two duplicated Casarabe centers. The reproducing check failed with two Cotoca records, then passed after verified coordinates were merged into the original Cotoca and Landívar records. Original site claims and reciprocal network links are retained. The same pass corrected the Cuban collection’s holding institution to UCLA. No critical findings remain; no second reviewer was dispatched.

Tablet/computer remain primary targets; phone is best effort. The shared horizon remains 1934. Queued later-date exceptions remain unimplemented.

Subsequently merged as PR #9 and deployed; see releases/v0.13.0-verification.json.


---

# Archived v0.14 source verification

Version **0.14.0 source and packaged release**. This document verifies the source and downloadable package; public activation is checked separately. The preceding release was merged in PR #9; its public deployment receipt is retained in the repository.

Coverage: **1,960 records; 20 independent topics / 184 chapters; 11 contextual stories / 66 scenes**. This update adds 100 observations: 88 shared historical/archaeological records and 12 focused records. All ten previously queued movies are implemented. That completes the requested movie queue, not the historical research.

The shared map and ordinary topics still end in 1934. Only the Hawaiian political topic extends through 1959, with four exact later record IDs excluded from shared history. Tests cover manual dates, playback, validation, workbook round trips and returning to shared history.

The gap audit distinguishes source windows from continuous occupation and missing evidence from human absence. The detailed audit now includes previously omitted shared history/expansion collections and Australia/Aotearoa. Sixteen targeted gap observations and eight Australasia observations include local phases, built places, coercion and documented activity. Broad regional pins are explicitly marked; protected Australian sites retain generalized locations.

Source verification separates a site chronology from one specimen's date, a fort from a separate labor-coercion event, a naval capture from a wreck, and a colonial purchase from Indigenous consent. The research reports serve as discovery aids; original public claims cite underlying research and community/institutional sources. **Consensus Deep cumulative usage: 53/100**, conservatively including submission and polling calls. Raw generated reports remain private.

All **30 required release phases passed in one complete final run** after the corrections below: **277 unit tests**, TypeScript, 1,960-record validation, production package, complete workbook import/reimport and every evidence page, API, self-host startup, and all browser suites. Earlier runs identified an obsolete queued-topic expectation and the manual-date race; the final run includes their corrections. Reproduce the ordered checks with `npm run verify:release`; regenerate the researched workbook with `node --import tsx scripts/workbook-tables.ts` after changing records.

The new suites checked all 100 chapters across the ten newly completed movies, their current evidence and cameras, plus the earlier movies. The additional Pūrākaunui chapter also passed the existing Pacific topic checks. The index contains 20 playable cards and no unfinished requested queue entries. Hawaiʻi manual dates, slider, review navigation and shared-context isolation passed. Desktop (1440×960), tablet landscape (1024×768) and tablet portrait (768×1024) screenshots were inspected.

Python ran 15 cases on Windows: ten passed and five filesystem-symlink retention cases were skipped there. All five retention safety cases separately ran and passed on the target Linux host. Shared-world playback still verifies the automatic Americas opening, simultaneous Columbus/Taos, contextual Beagle journey and ordinary stories.

One fresh independent whole-branch review found repeated observations incorrectly counted as distinct localities and an incorrect Early Classic/Postclassic label. Three reproducing tests failed before correction and passed afterward. Nine verified locality groups now retain canonical place identity, while separate observations and genuinely distinct nearby sites remain separate. The audit and workbook were regenerated.

The final stress checks also exposed animation overwriting typed dates. A reproducing browser scenario failed in each movie mode; focusing the manual date form now pauses that movie. All five network/date/search resilience scenarios and the complete final gate passed. No second reviewer was used; no unresolved material findings or deferred minors remain.

The review did not certify exhaustive history, every citation's full text or future deployment. Those are not claimed here. The author rechecked the locally retained Admission Act and accessible GPO transcription after the reviewer's PDF request timed out. Actual public deployment, download hashes, neighboring pages and rolling retention are verified separately during activation.

Tablet/computer are primary targets; phone remains best effort. Selected geographic and chronological gaps are listed in [the coverage report](world-coverage-audit.md), with source decisions for [land and sovereignty](land-sovereignty-dives.md), [trade, missions and materials](remaining-topic-dives.md), and [Australia/Aotearoa](australasia-archaeology.md).


## v0.20.0 — archaeological places and readable history

All 40 source release stages passed, including 339 unit tests, all published workbook records and 110 expanded/new chapters. One fresh review produced three important findings; all were corrected and checked. Source and publication details: [v0.20.0 receipt](releases/v0.20.0-verification.json).

Merged as [PR #17](https://github.com/gavinfischer-keenan/americaspeoples/pull/17), deployed as `20261117T071811Z-americas-v0.20.0`, and verified publicly. Only v0.19.1 remains as the previous rollback release.


## Archived v0.20.0 verification



Version **0.20.0** expands six archaeological guides and adds the connected Four Corners family of local studies. It contains **2,317 records: 2,247 shared and 70 focused**, including 99 new shared observations; 47 contextual stories, 26 independent topic movies, 43 guides and 79 available directory cards. The expanded/new local and regional movies contain 110 chapters.

Reader-first pages, 322 rewritten record descriptions, 213 story/guide edits, 35 labeled terrain maps, collapsible Watch sections, broad tile links and non-obscuring hover text are included. The 11,966 BCE ice inversion is corrected, with regression checks across all 147 snapshots. Source coordinates and uncertainty qualifications remain available.

All **40 release stages passed**, including **339 unit tests**, all 2,317 workbook records, all 110 expanded/new chapters, labeled terrain registration, browser interaction and package checks. The three findings from the fresh whole-branch review were corrected and the affected regressions passed. Publication and public verification are recorded in [the release receipt](https://github.com/gavinfischer-keenan/americaspeoples/blob/main/docs/releases/v0.20.0-verification.json).

Two Consensus Deep dossiers completed before the latest allowance change, bringing conservative lifetime tool usage to 80 calls. **0 of the 75 newly authorized calls have been used**. Raw provider reports remain private. The main atlas ends in 1934; the existing Hawaiʻi-specific extension remains isolated.
