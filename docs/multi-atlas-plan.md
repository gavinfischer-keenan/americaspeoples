# Four atlases, one application

## Approved scope

**Northern expansion in v0.31.0:** Europe is activated as a playable atlas through 1900, beginning with the northern regions. Africa and Asia remain guide-first previews. The original placeholder implementation below records the initial architecture; the current implementation and next-pass decisions are documented in [Northern Europe — release review](northern-europe-next-pass.md). The user superseded the initial local hold with authorization to publish this release after verification.

The atlas names are **Americas**, **Africa & human origins**, **Europe & Mediterranean**, and **Asia & Pacific**. Americas remains the working atlas. The other three initially contain only a modern coastline preview and a large **COMING SOON** label. They contain no evidence records, historical overlays, events, claims, stories, or copied research.

Keep one repository and one shared application. Separate the atlas configuration and future data ownership instead of creating three copies of the renderer. The existing renderer, timeline, source-review interfaces, accessibility behavior and release checks should evolve together. Independent repositories would duplicate those systems now; consider that split only when independent teams, release schedules or hosting requirements make it worthwhile.

## Initial implementation

- [x] Add an atlas catalog and three empty manifests under `data/atlases/`.
- [x] Add a keyboard-accessible atlas menu and exact routes `#atlas/africa`, `#atlas/europe`, and `#atlas/asia-pacific`. Americas keeps `#movie`.
- [x] Render each preview from the already bundled Natural Earth coastline with a separate SVG projection. Do not instantiate a second historical map, request additional catalogs, or pass current evidence to it.
- [x] Hide the existing timeline on preview pages. Pause existing playback using the normal router; retain the Americas date, selection, filters and camera in its existing session state.
- [x] Test approved names/routes, strictly empty manifests and evidence-free preview markup. Check a browser round trip back to Americas and narrow-screen navigation. Root integration owns the full dataset build and release checks.

The small JSON manifests are bundled configuration, loaded through `loadAtlasManifest`. `status: "coming-soon"` requires every content list to be empty. No research import is part of this implementation. Existing Americas startup and API behavior remain in place; the previews add no second evidence payload. The map attribution is shared basemap metadata, not a new historical source catalog.

Verification: the five focused catalog tests and TypeScript check pass. The browser gate against the existing release API, with the changed frontend bundled in memory, visited all three previews and returned to the same Americas map element, date (1860 CE), zoom transform, selection and history filter. Preview navigation made no additional catalog requests; each preview contained only two SVG paths and hid the timeline. Desktop and phone layouts were visually inspected; direct reloads and navigation were checked at widths 320, 390, 760 and 800 pixels. This verification does not replace the final integrated dataset build.

Run `node --import tsx --test tests/atlas-catalog.test.ts` for the focused tests, then `node scripts/browser-atlases.mjs` after a full build for the release browser gate. For frontend development before a full build, set `ATLAS_BROWSER_SOURCE=1` when running the browser gate; this substitutes an in-memory frontend bundle while retaining the real release API.

## Data ownership when an atlas is ready

Give every evidence record one authoritative atlas and one globally unique, stable ID. Existing Americas IDs must remain stable. Use an atlas prefix for newly introduced records where necessary, and validate uniqueness across all manifests during the build. A record referenced by two atlases should not become two independently editable copies.

Cross-atlas references should store the authoritative atlas ID and record ID. A voyage or migration may have anchors in more than one region; preserve its primary source identity and explicit scope. Regional presentation can select appropriate anchors without inventing events at atlas boundaries or duplicating claims. Changing an authoritative record should invalidate or rebuild any dependent regional exports.

Each published atlas will have its own manifest listing its catalog, detail shards, story definitions, geographic context and optional overlays. Keep shared schemas, source identity, chronology semantics and renderer code in common modules. The loader should fetch only the selected atlas's required catalog and request detail records as needed. Explicit per-atlas view state should eventually retain date, camera, filters and story progress when several fully populated atlases coexist.

## Human origins and regional histories

Africa & human origins will be the home of the opening human-origins / Out of Africa story and of later African regional histories. The global opening story should link to authoritative evidence in other atlases as its scope expands. It should not turn later African histories into a prologue for other continents, nor make Africa the owner of every later human event worldwide.

Regional narratives will have their own date ranges, geographical scopes and reviewed evidence. Shared chronology supports navigation between them; it does not imply a single synchronous cultural sequence. This document defines future organization only and supplies no human-origins dates, routes, records or claims.

## Sources, rights and exports

Maintain one stable source identity for the same publication or archival object, with explicit record-level locators and relationships. Store each image or dataset's original URL, attribution, license, transformations and checksum. Atlas membership must not replace or broaden the source's license.

Exports should identify the authoritative atlas, schema version and release version; include the required referenced records and source metadata, or clearly identify unresolved external references. Validate dates, IDs, geographic scope and license obligations before an atlas becomes available. An empty preview must never be exported as a researched regional dataset.

## Deployment and migration

Initially deploy all four destinations together under the existing application URL, keeping current deep links valid. Future populated atlases can produce separate versioned data bundles while retaining the same renderer release. Cache keys and API responses must include atlas and release identity to prevent mixed data editions.

Split repositories only when operational independence is real. Before a split, establish a versioned shared renderer/schema package, cross-atlas ID registry, source ownership rules, redirect plan and compatibility tests. A repository split is not required to provide separate atlas navigation or regional data files.
