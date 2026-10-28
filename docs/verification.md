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
- Browser storage is a convenience. Exported JSON is the portable backup; packages must fit 4 MB / 500 proposals. A proposal that cannot be exported is rejected before leaving the editor.
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

`npm test` passes 59 tests; `npm run typecheck`, `npm run validate` and `npm run build` pass. The actual researched XLSX imports all published records as corrections and preserves dates, claims, source mappings, population estimates and overlay geometry. The older schema-1 template and current sample template still import. Malformed archives, formula/macro content, unsafe links, byte/count limits and stale revisions remain checked. The native JSON cap is deliberately 4 MB/500 proposals so the complete snapshot fits; XLSX stays at 5 MB compressed/20 MB expanded.

Independent read-only review found a broken internal population-citation anchor and stale workbook references/revisions. Both were corrected and independently rechecked. The reviewer found no remaining blockers and confirmed tests/type checking. A further regression verifies that records without a usable location or date explain why map navigation is unavailable.

Browser checks on the built local atlas verified individual Hovenweep-area records, deep map focus, unknown striped symbols, separate population-range halos, culture/date information and population citation navigation without losing the review route. Date fading is illustrative; no statistical posterior is invented. Current archaeological reference coastlines are not a detailed local street map. Additional named-site datasets still need source-supported dates and public coordinates; this release is selected coverage, not a complete inventory of settlements.
