# Release verification

Release 0.1.1 — October 28, 2026.

## Automated checks

- 28 Node tests cover BCE/CE conversion, inclusive boundaries, gaps, uncertain occurrences, approximate reference dates, validation, unsafe links, portable drafts, duplicate/conflicting imports, stable category identity, schematic-only routes, and playback boundary snapping.
- TypeScript strict type checking and dataset validation run before release.
- Eight evidence records have substantive review pages and valid source mappings. Fourteen distinct sources are cited. Source-access limits are explicit, including abstract-only checks; automated validation is not a scientific peer review.

## Browser coverage

The browser suites use real file URLs, not an HTTP server. Network access is disabled at browser-context level. They exercise year input and playback; all eight bibliography/review routes; corrections and new drafts; download/import round trips; duplicate detection; unreviewed-data isolation; storage-denied behavior; hostile text rendering; culture conflict normalization; time-bounded synthetic movement arrows; overlap discovery; post-pan selection; approximate-date preservation; export-size validation; fixed-panel layout; and a 390-pixel mobile viewport.

The final release is tested after extracting the ZIP using installed Microsoft Edge and Google Chrome. Verified versions: Microsoft Edge 156.0.4314.42 and Google Chrome 156.0.8078.73. All three offline browser suites passed in both browsers against the extracted ZIP. Desktop/mobile viewport rendering is checked; no claim is made for testing a physical phone, Firefox or Safari.

An independent read-only code review identified three issues: a draft could save despite being unexportable; imported novel cultures could disagree on color; and invented curves could be labeled supported routes. Each was reproduced and fixed with regression coverage. The review did not independently audit scholarly publications or replace browser verification.

Bulk tests additionally cover the actual distributed XLSX example, workbook relationships, complete correction bases, repeat-import deduplication, BCE/CE parsing, reference metadata and formatting, formulas, macros and bounded archive parsing. A follow-up code review found that the second ZIP parser could bypass the first parser's declared-size bound. The importer now rebuilds a stored archive from bounded buffers before the second parser; a forged-size regression covers this case.

## Limits and deliberate decisions

- Eight entries demonstrate the research model; they do not supply comprehensive geographic or temporal coverage. No migration route is asserted in the starter corpus. Synthetic movement tests never ship as scholarly records.
- All displayed route curves are schematic endpoint connections. Schema version 1 rejects purportedly supported path geometry; intermediate route reconstruction requires a later schema extension.
- Bulk bibliography and claim mappings use the documented XLSX tables. The single-record form also offers structured JSON editors. The ordinary narrative, location, culture and date fields have labeled form controls.
- Browser storage is a convenience. Exported JSON is the portable backup; packages must fit 2 MB / 200 proposals. A proposal that cannot be exported is rejected before leaving the editor.
- Approximate single-year references are not expanded into fabricated date ranges. Playback lands on boundaries and holds briefly, making them visible; review links can also jump directly to them.
- Unknown occupation bounds remain unplaced unless a defensible bounded interval is supplied. The reviewed dataset determines the timeline minimum; proposals do not silently redefine it.
- The basemap shows generalized present-day coastlines. It is not a reconstruction of ancient shorelines, sea levels, ice sheets or political boundaries.
- No hosted app, telemetry, auto-update service, account system or central suggestion collection is part of this local release.
