# Americas Peoples

A hosted browser atlas of archaeological and historical evidence in the Americas and Asia-Pacific. Explore the earliest included evidence through1934, inspect source-linked reviews, and exchange proposed updates. Versioned structured data is authoritative; spreadsheets are optional contribution/export formats. See [hosted architecture](docs/hosted-architecture.md).

## Current release

v0.3.7 adds Smart playback and a logarithmic timeline, individually reviews280 formerly unplaced chronologies(64 recovered windows plus5 separated disjoint windows), and separates unresolved geographic context from dated evidence. The coverage audit identifies collection gaps without interpreting blank cells as absence.565 archaeological/historical/context records and861 claims are included;13 newly reviewed skeletal contexts retain source/method limitations. All19 round7 inputs are captured and screened; additional generated syntheses remain explicitly pending original-source checks.

Physical context has separate attributed structured collections:49 NADI-1 dated North American ice-sheet snapshots with three boundary scenarios; NOAA-archived ENSO reconstructions; NOAA/NCEI historical tsunami source events; Smithsonian GVP Holocene eruptions; and schematic NOAA-guided usual currents/trade winds. Catalog entries retain source fields and uncertainty; open-ended dates are not forced into exact years. Source completeness and geographical limits are explicit. Conditions do not automatically establish impacts on settlements. Drought/heat/cold toggles classify existing sourced environmental findings, not continuous global grids. Open-water and paleocoastline reconstructions remain a data gap.

v0.3.6 reconciles19 Pacific research uploads:32 new records and7 existing-record context updates,547 records and818 claims total. All515 prior records remain. The map has a viewport-aware list on the left, selected evidence on the right, a central map and collapsible far-right layer controls. Modeled/schematic evidence can be hidden. The research reconciliation register preserves unresolved source leads and corrections.

v0.3.5 improves map contrast and adds explicit schematic direction symbols for supported dispersal interpretations. Forward, reverse, two-way and multidirectional metadata are supported; unknown directions remain unspecified.

v0.3.4 publishes 515 records and 774 claims, including 15 new round5 records and context updates to four existing records. All 500 previous records are retained. The intake archive preserves 23 synthesis topics from 31 original files; unresolved leads remain explicitly pending. Synthesis uploads are secondary provenance, not primary research.

## Downloads and bulk contributions

- [Download v0.3.7 — offline application ZIP](https://github.com/gavinfischer-keenan/americaspeoples/raw/refs/tags/v0.3.7/downloads/americas-peoples-v0.3.7-offline.zip)
- [Release filenames, sizes and SHA-256 checksums](https://github.com/gavinfischer-keenan/americaspeoples/blob/v0.3.7/downloads/v0.3.7-artifacts.json)
- [Read the bulk import and reference guide](docs/bulk-import-guide.md)
- [Download the XLSX template](https://github.com/gavinfischer-keenan/americaspeoples/raw/refs/heads/main/templates/americas-peoples-import.xlsx)
- [Original v0.1 download](https://github.com/gavinfischer-keenan/americaspeoples/raw/refs/heads/main/downloads/americas-peoples-v0.1-offline.zip)

Version 0.2.1 prepares static web hosting, adds a complete HTML/JSON evidence appendix and deployment handoff, and updates the ZIP parser. The app retains the 0.2.0 timeline through 1934 and trade, conflict, forced-removal, epidemic and massacre/violence overlays. The workbook has Evidence, Claims, References and ClaimSources tables plus instructions and an Overlays tab. Evidence begins with dates, culture and location; its final columns hold summary, limitations and discussion. Structured bibliography rows support articles, books, chapters, reports, theses, archival documents, datasets and web resources. Every factual claim links to its sources. All imported rows remain proposals pending review.

The guide and template are also available inside the offline app under Suggestions. Replace the worked sample with your own rows. Import XLSX or the app's JSON packages directly. BibTeX, RIS and CSL-JSON can be supplied to an assistant for conversion; they are not direct app import formats. DOI lookup requires an online research step, never an offline dependency.

The [populated research workbook](templates/americas-peoples-researched-import.xlsx) is the complete published snapshot. All author records already appear by default. Its rows preserve base revisions and can be edited as source-linked corrections. Regional, genomic, environment and cultural-context layers remain distinct from named settlement points. Claim-specific disputes and source-access limits are explicit.

1934 is a chosen policy boundary, not an assertion that dispossession or Indigenous history ended. The researched workbook includes removals, confinement, return journeys, epidemics and massacres as separate evidence records. A marker ending never establishes extinction; casualty estimates retain their source, population scope and uncertainty.

## Open the application

Extract `americas-peoples-offline.zip`, then open `americas-peoples/index.html` in a desktop browser. Keep `app.js` and `app.css` beside it. No server, installation, account or network connection is required. External scholarly publication links need internet access. The download includes citation metadata and original explanations, not copies of copyrighted papers.

## Explore

- Drag the bottom slider in either direction, enter a BCE/CE year, or press Play. Speed is measured in years per second between evidence boundaries, with a brief hold at each boundary so short events remain visible. Playback stops at 1934 (Indian Reorganization Act). Select a narrower timeline window for close inspection.
- Pan the map by dragging or focus it and use arrow keys. Use the zoom buttons or mouse wheel. Culture filters and legend search are on the left. “Show all” restores hidden categories.
- The visible evidence list provides keyboard-accessible links to all active records, including overlapping locations and nonspatial events. Selecting a map dot narrows the list to that location; “Show all visible” clears it.
- Open Events / Evidence to search, filter and sort the table. Its Period control explicitly chooses all records or the selected year. Map culture filters also apply.
- Every row opens its own detailed review with claims, sources, date interpretation, limits and discussion. Browser Back/Forward works. “Show on map at this time” jumps to the record's earliest display year.

An outlined marker means possible timing or approximate reference dates. An asterisk marks a scholarly dispute or discussion attached to a particular claim. A dot disappearing means the displayed evidence ends; it does not establish abandonment, extinction or a migration destination. Colors represent cultures or supported identifications, not races. Unknown remains a valid classification.

## Suggest and share updates

Choose Suggest new evidence, or Suggest correction on an existing review. Complete the narrative, dating and location fields. The single-record form uses structured JSON editors for bibliography entries, source-to-claim mappings, and movement destinations; template buttons provide the expected shapes. A location can remain unmapped, and dating can remain unplaced.

Save draft permits incomplete evidence. Save complete suggestion checks required fields and references; it does **not** certify scientific truth. Both remain unreviewed proposals. Reopen drafts from Suggestions. Corrections retain a full original record and base revision, with a field-by-field comparison.

Select rows in Suggestions and choose Send to others. The app downloads a JSON file for you to send by any preferred channel; nothing is uploaded or emailed. A review page can also export its row as an unchanged draft correction for discussion. Recipients choose Import suggestions and inspect the preview before adding anything. Identical duplicates are skipped, while conflicting copies are retained separately. Reviewed evidence is never overwritten.

Complete proposals appear on the map/table only when Preview suggestions is enabled. Drafts remain in the local workspace and are not mapped. Existing culture IDs retain the bundled dataset's color in previews; conflicting metadata must be reviewed.

**Download files are the portable backup.** Browser storage is only a convenience. File URL storage can vary by browser and file location; private browsing, storage restrictions, moving the app or clearing browser data may remove it. Save/export before closing. The app reports when browser storage is unavailable. Share packages are limited to 4 MB and 500 proposals; export smaller selections if necessary.

## Starter evidence

Dataset 0.1.0 contains eight examples and fourteen distinct citations: Chiquihuite, White Sands, Monte Verde II, a later Chinchihuapi context, L'Anse aux Meadows, Cahokia's urban phase, the later River L'Abbe mission, and the Louisiana Purchase Treaty. It is not comprehensive geographic or temporal coverage. The starter data does not assert any migration route; movement rendering is implemented and exercised with synthetic tests kept outside the scholarly dataset.

Monte Verde II's chronology is marked disputed, including the 2026 challenge and response. Its approximate reference year is not an exact annual occurrence or an invented uncertainty range. White Sands uses a labeled public park-location proxy rather than a footprint excavation coordinate. All sources expose their verification/access limits. Some were checked at abstract level, not through an independent audit of all methods.

## Development

Use Node.js 22 or newer and npm. From this repository:

```sh
npm ci
npm test
npm run typecheck
npm run validate
npm run build
```

The build writes `dist/`, a versioned ZIP and the convenience alias `release/americas-peoples-offline.zip`. It bundles a classic script with embedded evidence and vector geometry, so runtime JSON fetching and server routing are unnecessary. The ZIP needs no online first load. A hosted URL needs its initial assets from the host; offline web reloads are not guaranteed. There is no service worker or installable PWA. Dependency versions are locked in `package-lock.json`; build inputs and scripts are tracked.

Browser tests use Playwright with an installed browser. They default to the Windows Edge location; set `BROWSER_PATH` to another Chromium-family executable. Set `APP_PATH` to an extracted release's `index.html` to test the packaged artifact. The five offline suites use file URLs without a server. `scripts/bulk-browser.mjs` checks the shipped XLSX template and guide. `scripts/overlay-browser.mjs` exercises all overlay layers and the 1934 endpoint; `scripts/research-browser.mjs` imports the complete published workbook and opens every claim and bibliography. `npm run test:hosted` separately starts and stops a loopback HTTP server to verify the built app with the recommended hosting headers.

```sh
npm run test:browser
node scripts/regression-browser.mjs
node scripts/bulk-browser.mjs
node scripts/overlay-browser.mjs
node scripts/research-browser.mjs
npm run test:hosted
```

See `docs/verification.md` for the browsers actually tested and current limitations. Synthetic fixtures under `tests/` are never bundled as evidence.

## Deployment handoff

The app is prepared for static hosting at the root of its own subdomain in the TripoFisch / 11 Mosswood ecosystem. [DEPLOYMENT.md](DEPLOYMENT.md) describes the exact deployable directory, commands, hash routing, response headers, storage/privacy behavior, downloads and remaining work. [Product-page copy](docs/landing-page-content.md) explains the utility and the appendix. No backend, database, login or external runtime API is required.

The build includes `evidence-appendix.html` and `evidence-appendix.json`, preserving every published record, claim, citation and access caveat. The public app is hosted at https://americaspeoples.11mosswood.us/ and the product explanation at https://tripofisch.com/free-utilities/americaspeoples/.

## Maintain the research

Edit `data/evidence.json`, following `docs/data-format.md` and `docs/evidence-policy.md`. Every evidence row embeds its required citations and review, allowing proposal files to be self-contained. Reused entity IDs must have consistent metadata. Validate data before building. A maintainer must assess proposals academically, increment affected record revisions and the dataset version, and release a new bundle. There is no central submission service or automatic update check.

`docs/research-dossier.json` preserves the source-check dossier for the starter corpus. `scripts/prepare-data.mjs` documents its initial normalization; do not rerun it after editing the dataset unless intentionally rebuilding those initial records.

## Attribution

Natural Earth reference land geometry is public domain. The basemap uses present-day generalized coastlines, not reconstructed ancient coastlines or ice sheets. Dependency notices are in `THIRD_PARTY.md`. Academic sources retain their own copyrights. No publication PDFs are bundled. This repository does not assign an open-source license to the owner's original application code.


## Published dataset — v0.3.0

All author-published records load by default. No import or Preview switch is required. Current counts are generated from the data in the app, appendix and workbook. Original intake exports and source reconciliation are bundled. Visitor drafts remain local and opt-in. Hosted pages disclose Cloudflare analytics; the extracted offline edition does not receive hosting-injected analytics.

Named settlements use source-supported locations and date-specific resident estimates where available. Unknown population uses a striped smallest-band symbol. Estimates are not interpolated or summed. Soft cultural envelopes are optional editorial regional context, not surveyed borders. See docs/data-format.md.

## Literature, context and uncertainty — v0.3.0

The author’s literature batches extend coverage across continental America and the Caribbean. New regional clouds distinguish archaeological syntheses, genomic inferences and environmental context from dated sites. Possible dates fade inside their source bounds. Opacity is illustrative, not a probability distribution or population size. Light and strong asterisks distinguish claims under discussion from explicitly disputed claims; review boxes identify the competing interpretations. No confidence is calculated from citation counts or search-result percentages.

The Movement & context view links mechanisms and alternatives, and separates non-American comparisons from American evidence. Abstract-only access is explicitly identified. Uncalibrated or unspecified BP dates and open-ended constraints are retained without invented calendar bounds. The full supplied Consensus exports are archived as secondary provenance in docs/intake; they are not relabeled as primary studies. Original subscription PDFs are not republished.
