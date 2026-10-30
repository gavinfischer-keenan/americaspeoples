# Movie and Explore views

Implement the user's requested separation using the existing map and timeline.

- Movie is the default and the legacy `#map` route. It draws only records whose supported dates include the selected year; undated context and year-independent reference winds/currents are excluded. Broad source-supported date ranges retain their uncertainty styling.
- Explore has its own `#explore` tab. It shows enabled evidence across dates, including unresolved-chronology markers, with its list following the map viewport. Its hidden timeline cannot filter the map.
- During Movie playback, hover provides a short summary. Map/record clicks pause and consume that first click; no selection or hazard navigation occurs until a subsequent click. Starting playback clears prior selection, and changing year removes selections no longer current.
- Both views retain list-left, map-center, selected-detail-right navigation. Movie lists only current evidence. Explore's dates are explicit rather than labelled current. Shared layer preferences survive switching tabs.
- Keep selection/filter policy in a pure `src/atlas-view.ts` module; MapView owns visual interaction/hover, MapPanels owns list/detail DOM, main owns routing and playback.
- Verify policy boundaries and uncertainty; browser-test both views, stale selection, first-click pause, subsequent selection, hazard-anchor interception, hover summaries, keyboard interaction and viewport lists. Run the existing release checks, adapting tests only for deliberately changed Movie/Explore behavior, then deploy atomically.
