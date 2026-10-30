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
