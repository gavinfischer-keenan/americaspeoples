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
