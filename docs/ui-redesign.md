# Watch and Explore — UI review and redesign

Version 0.8.0 is a separate release candidate after PR #3 and the deployed v0.7.1 packaging patch.

## What the review found

| Area | Problem in the previous interface | Result in this revision |
| --- | --- | --- |
| First use | Many competing navigation links, filters and timeline settings; no clear educational path | Watch, Explore and Library define three clear activities |
| Educational playback | A global year ticker paused for 700 ms, including changes outside the view | Six authored journeys, 32 scenes, readable holds, explicit date notes and source links |
| Understanding motion | Routes had no visible endpoint names; movement alone did not explain its significance | Highlighted history routes name their geographic endpoints; scene text explains the supported change |
| Time controls | Large permanent controls obscured maps and research pages | Compact story transport; date and speed settings open on demand; research pages have no movie footer |
| Geographic canvas | Fixed 1000×800 frame left much of a wide stage unused | Responsive projection and viewport, preserving geographic shapes and camera context |
| Covered cities | Broad invisible area targets intercepted clicks on earlier places | Screen-coordinate picking ranks places first and offers every overlapping record in an explicit choice |
| Local focus | Some place actions jumped to 256×; routes focused only their first endpoint | Useful point context and complete route/area fitting, pointer-centered wheel zoom and touch pinch |
| Local discovery | Hundreds of records without a place search or event hierarchy | Global search, named regions, chronological viewport lists, and category/date filters |
| Conflict evidence | Existing conflict and violence records were difficult to discover | A dedicated filter includes explicit conflict, violence and forced-removal metadata without guessing from titles |
| Map readability | Dense shading, scaled text outlines and overlapping labels obscured geography | Quiet regional evidence, stable text strokes, selected highlights and collision-aware labels |
| Inspecting evidence | Details compressed the map and could be inaccessible on phones | Bounded inspector with close control, overlap choice, direct local zoom, date view, source review and site guide |
| Mobile use | Horizontal navigation and large movie controls consumed the screen | Compact navigation, map plus readable story/local drawer, accessible transport and pace settings |
| Keyboard use | Map features lacked keyboard activation; drawers left focus behind them | Keyboard map selection, pan/zoom, explicit drawer focus/return, skip link, and list alternatives |
| Research workflow | Full sources and contributions were mixed into the primary viewing controls | Library organizes evidence, places, movement, environment, contributions and methods |

## Watching a story

The default journey is **Across the Pacific**. Other journeys compare built places, follow Chaco's connections, examine changing Pacific exchange, connect colonial ports and ocean crossings, and introduce early American evidence. They last approximately one to two minutes at the default pace. Play, pause, previous/next scene, restart, progress seeking and slower reading are available. Focus view keeps the current explanation over the map. Reduced-motion preferences disable decorative movement.

Each scene's year is a viewing position, not a newly asserted exact historical date. Notes remain visible alongside the narration. Source links remain accessible even when the associated route is no longer active. Free timeline mode retains the complete dated atlas and its evidence-aware pacing.

## Exploring a place

Choose a region or search for a place, people or event. Search spans the included atlas; without a query, the list follows the map. Local lists order records by source date. Filters distinguish places, connections, conflict/violence, regional research and shipwrecks. Explore can show all periods or evidence at the chosen map year.

A map click selects the nearest relevant place before a broad region. When multiple records overlap, the inspector provides a choice. “Zoom to this place” gives geographic context, “View its time” applies the record's dating, and full reviews retain claims, sources, interpretation and limitations. Layers and culture controls remain available in a drawer.

## Evidence boundaries

- This revision reorganizes existing historical evidence. It adds no fabricated warfare, population counts, sovereignty polygons or building footprints.
- Foundation/arrival records accumulate as historical memory; they do not prove uninterrupted occupation or continuing colonial control.
- Earlier occupation markers mean earlier evidence, not demonstrated abandonment. Positive regional habitation records remain distinct.
- Active routes use their supported windows. Ending a window does not identify the last voyage or prove all contact ceased.
- Ships lost in a fleet are not individually located unless the source record provides those positions.
- Natural Earth coastlines are generalized modern reference geometry. Close zoom makes source points and connections usable; it cannot create streets, excavated architecture, ancient shorelines or topography absent from the source data.
- Conflict coverage is incomplete. An empty filtered view is a collection gap, not evidence of peace.

## Validation

The release check includes the existing source/data/API/import/privacy checks and new browser checks for guided playback, seeking and completion, real coordinate overlap selection, global search, conflict filters, local focus, responsive resize, touch pinch, keyboard activation, route labels, collision avoidance and mobile drawers. Tests use actual coordinate clicks for the covered-city regression rather than dispatching clicks directly onto a selected SVG element.

An independent review checked story accuracy against cited records and application state transitions. It caught an overbroad construction-date note, stale Explore filters in Watch, source-to-map navigation entering the wrong story, paused travel restoring the wrong year, missing mobile pace access and drawer focus handling. These were corrected before the release-candidate checks.
