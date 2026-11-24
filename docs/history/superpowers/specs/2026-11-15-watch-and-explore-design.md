# Watch and explore: an educational atlas

The user has asked for a complete UI redesign and delegated design judgment and implementation. The current UI defines the information requirements, not the layout to preserve. PR #3 is already merged and deployed as v0.7.1; this redesign is a separate development branch.

## Audit and intent

The current map occupies only about 500 pixels of a 970-pixel-wide stage because its fixed SVG frame letterboxes. A 205-pixel timeline, a dense header, an always-open list, and multiple toolbars compete with the geography. Earlier places render under large regional hit areas. Clicks trust the top painted element, so broad areas intercept city selection. Place selection does not offer an obvious useful local view; direct record focus jumps to 256×. Explore shows hundreds of overlapping records without search or a local event hierarchy. Movie runs a global date ticker and holds for 700 ms, including changes outside the viewport, with no explanatory story. Information is rigorous but the viewing experience is not educational without substantial prior knowledge.

## Chosen approach

Build two complementary experiences on the existing TypeScript/SVG atlas: Watch and Explore. Retain the source data, reviews, site guides, offline package, and proposal workflow. A cosmetic re-skin would leave the interaction and pacing failures; a new external map platform would add hosting dependencies without solving the story. The chosen implementation uses the current renderer with responsive geometry, proper selection, and an explicit narrative controller.

## Watch

The default Watch view has a generous map, a compact story rail, and a small transport bar. Source-linked journeys group coherent scenes around peopling, Pacific voyaging/exchange, settlements/buildings, and colonial ports/fleets. Each scene sets a relevant year and geographic frame, explains what the evidence supports, and links directly to the underlying review. Automatic playback spends enough time on each scene to read it, moves through years between scenes, and stops at the end. Pause, previous/next scene, restart, speed, and progress are always understandable. Motion honors reduced-motion preferences. An optional focus view removes ancillary panels. Free timeline playback remains available with advanced date controls.

Narrative text must be grounded in existing record summaries/claims, distinguish estimated dates from exact events, and never turn missing evidence into abandonment, a foundation into uninterrupted occupation, schematic routes into navigation tracks, or regional construction dates into dates for every building. No fabricated warfare or population totals. Migration/trade lines animate only in supported windows; earlier places and wrecks retain their established semantics.

## Explore

Search across mapped evidence; choose a named region; filter places, connections, conflict/violence, and regional research. The visible list follows the map, orders local evidence clearly, and provides a keyboard-accessible alternative to clicking. Selecting a result reveals an inspector with useful local zoom, dates, meaning, and sources. Nearby overlaps produce a ranked chooser with places before areas, not an arbitrary top painted hit. A region must remain inspectable even when it overlaps a place. The user can inspect all periods or evidence at the selected year. Existing explicitly categorized conflict/violence/forced-removal records become discoverable; absence in the collection is described as a coverage gap.

## Geometry, accessibility, presentation

Use the actual stage aspect ratio. Keep geographic shapes undistorted; resize preserves the user's geographic center and approximate scale. Wheel zoom anchors under the pointer. Region/record focus fits useful extents instead of a 256× jump. Provide sensible zoom limits, reset, scale/context feedback, stable controls, keyboard pan/zoom and selection. Broad evidence areas are quiet backgrounds; places, routes, and selected records have strong hierarchy. Labels emerge at useful local scales. Present-day reference coasts remain clearly identified.

Use a restrained ocean/ink palette with warm readable paper-like panels, larger type, clear selected states, and generous space. Primary navigation is Watch / Explore / Library, with research/contribution/about pages reachable through the library menu. Existing secondary pages receive a consistent readable shell. Mobile keeps map and transport usable; drawers have bounded heights and clear close controls. No horizontal page overflow at 360 px, no inaccessible offscreen inspector, no endless live-region announcements during playback.

## Verification

Regression checks cover hidden city selection under clouds, overlap choice, nearby geographic focus, responsive aspect ratio, viewport list correctness, story timing/pause/resume/end, dated route boundaries, search/facets, and mobile drawers. Existing data/API/import/review checks remain required. Browser review covers Watch, Explore, overlap, local zoom, sources, library, and narrow screens. Record limitations and any remaining geographic/data gaps in the final report.
