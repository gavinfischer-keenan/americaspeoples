# Current source release verification

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
