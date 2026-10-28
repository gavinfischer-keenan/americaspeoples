# Americas Peoples

A fully offline browser atlas of archaeological and historical evidence in the Americas. Explore the earliest included evidence through 1803, inspect the science behind every row, and exchange proposed updates as files.

## Open the application

Extract `americas-peoples-offline.zip`, then open `americas-peoples/index.html` in a desktop browser. Keep `app.js` and `app.css` beside it. No server, installation, account or network connection is required. External scholarly publication links need internet access. The download includes citation metadata and original explanations, not copies of copyrighted papers.

## Explore

- Drag the bottom slider in either direction, enter a BCE/CE year, or press Play. Speed is measured in years per second between evidence boundaries, with a brief hold at each boundary so short events remain visible. Playback stops at 1803. Select a narrower timeline window for close inspection.
- Pan the map by dragging or focus it and use arrow keys. Use the zoom buttons or mouse wheel. Culture filters and legend search are on the left. “Show all” restores hidden categories.
- The visible evidence list provides keyboard-accessible links to all active records, including overlapping locations and nonspatial events. Selecting a map dot narrows the list to that location; “Show all visible” clears it.
- Open Events / Evidence to search, filter and sort the table. Its Period control explicitly chooses all records or the selected year. Map culture filters also apply.
- Every row opens its own detailed review with claims, sources, date interpretation, limits and discussion. Browser Back/Forward works. “Show on map at this time” jumps to the record's earliest display year.

An outlined marker means possible timing or approximate reference dates. An asterisk marks a scholarly dispute or discussion attached to a particular claim. A dot disappearing means the displayed evidence ends; it does not establish abandonment, extinction or a migration destination. Colors represent cultures or supported identifications, not races. Unknown remains a valid classification.

## Suggest and share updates

Choose Suggest new evidence, or Suggest correction on an existing review. Complete the narrative, dating and location fields. The first release uses structured JSON editors for bibliography entries, source-to-claim mappings, and movement destinations; template buttons provide the expected shapes. A location can remain unmapped, and dating can remain unplaced.

Save draft permits incomplete evidence. Save complete suggestion checks required fields and references; it does **not** certify scientific truth. Both remain unreviewed proposals. Reopen drafts from Suggestions. Corrections retain a full original record and base revision, with a field-by-field comparison.

Select rows in Suggestions and choose Send to others. The app downloads a JSON file for you to send by any preferred channel; nothing is uploaded or emailed. A review page can also export its row as an unchanged draft correction for discussion. Recipients choose Import suggestions and inspect the preview before adding anything. Identical duplicates are skipped, while conflicting copies are retained separately. Reviewed evidence is never overwritten.

Complete proposals appear on the map/table only when Preview suggestions is enabled. Drafts remain in the local workspace and are not mapped. Existing culture IDs retain the bundled dataset's color in previews; conflicting metadata must be reviewed.

**Download files are the portable backup.** Browser storage is only a convenience. File URL storage can vary by browser and file location; private browsing, storage restrictions, moving the app or clearing browser data may remove it. Save/export before closing. The app reports when browser storage is unavailable. Share packages are limited to 2 MB and 200 proposals; export smaller selections if necessary.

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

The build writes `dist/` and `release/americas-peoples-offline.zip`. It bundles a classic script with embedded evidence and vector geometry, so runtime JSON fetching and server routing are unnecessary. No service worker or online first load is used. Dependency versions are locked in `package-lock.json`; build inputs and scripts are tracked.

Browser tests use Playwright with an installed browser. `scripts/browser-test.mjs` and `scripts/regression-browser.mjs` default to the Windows Edge location. Set `BROWSER_PATH` to another Chromium-family executable. Set `APP_PATH` to an extracted release's `index.html` to test the packaged artifact. Neither test starts a server.

```sh
npm run test:browser
node scripts/regression-browser.mjs
```

See `docs/verification.md` for the browsers actually tested and current limitations. Synthetic fixtures under `tests/` are never bundled as evidence.

## Maintain the research

Edit `data/evidence.json`, following `docs/data-format.md` and `docs/evidence-policy.md`. Every evidence row embeds its required citations and review, allowing proposal files to be self-contained. Reused entity IDs must have consistent metadata. Validate data before building. A maintainer must assess proposals academically, increment affected record revisions and the dataset version, and release a new bundle. There is no central submission service or automatic update check.

`docs/research-dossier.json` preserves the source-check dossier for the starter corpus. `scripts/prepare-data.mjs` documents its initial normalization; do not rerun it after editing the dataset unless intentionally rebuilding those initial records.

## Attribution

Natural Earth reference land geometry is public domain. The basemap uses present-day generalized coastlines, not reconstructed ancient coastlines or ice sheets. Dependency notices are in `THIRD_PARTY.md`. Academic sources retain their own copyrights. No publication PDFs are bundled. This repository does not assign an open-source license to the owner's original application code.
