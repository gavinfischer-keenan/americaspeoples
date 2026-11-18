# A readable atlas at every scale — proposed design

Status: approved design, implemented for v0.26.0; publication is verified separately in the release receipt. Baseline audited v0.25.0, source commit d4e56c7, on 18 November 2026. The initial design audit used no Consensus calls. The subsequent evidence campaign used four; 45 remain.

The atlas has two different density problems: many places lack local history, while the places with evidence produce too many competing symbols. The shared date and interconnected world remain the foundation. Zoom changes how evidence is drawn, not which historical world the user enters.

## The ten sparsest regional areas

Ranked by distinct dated locality IDs across all twelve existing coverage periods through 1934, with ties alphabetical. This measures collected local evidence, not population, land-area density or archaeological research completeness. Local means the audit's named non-overlay occupation, occurrence or site-event record. Trade paths, regional interpretations, violence overlays and undated leads are separate; a zero does not mean a blank map or an empty past.

| Area | Dated places | What the collection currently contains |
|---|---:|---|
| Southern/central Idaho | 0 | The existing rectangle's lone point is Camp Fortunate in Montana; it is excluded from this Idaho count. |
| Kiribati — Gilbert Islands | 0 | One undated locality lead, without an integrated dated local sequence. |
| Kiribati — Line Islands | 0 | No dated local-place record in this audit area. |
| Kiribati — Phoenix Islands | 0 | No dated local-place record in this audit area. |
| Western coastal Louisiana | 0 | Regional/context records exist, but no dated local-place entry in the defined area. |
| Central/eastern Montana | 1 | Anzick: an early human-remains observation; later local history remains sparse. |
| Central/eastern Nevada basins | 1 | Silver Zone Pass: proposed communal trapping evidence. |
| Southern Nevada | 1 | Pueblo Grande de Nevada: an eleventh-century village record. |
| Eastern Wyoming | 1 | La Prele: mammoth-associated activity. |
| Western Wyoming | 1 | Colby: bone-pile activity. |

The 65 editorial audit rectangles have unequal sizes and overlap. Named US subregions were additionally checked against the bundled state polygons as of 1934, solely to avoid attributing neighboring places to the wrong modern named area. These polygons do not assert ancient state boundaries. Camp Fortunate's Montana location is also corroborated by the [Bureau of Reclamation](https://www.usbr.gov/gp/mtao/clarkcanyon/). Japan/Ryukyus is excluded from the detailed ranking because the user's mainland-origin policy does not call for a local-town campaign there. The two Fiji–Tonga–Samoa date-line sectors together have ten dated locality IDs; treating the western half's one locality as the whole group would create a false priority. These corrections are included in the v0.26.0 geographic audit.

This strict low-count list is not automatically the best order for research. Three Kiribati rows should become one island-history campaign, starting with original settlement evidence and then continuity. The inland western US rows could become a coordinated Great Basin/northern Rockies campaign. Western Louisiana needs named communities rather than additional regional circles.

Larger regions have serious time gaps too: Venezuela has four dated locality IDs overall, the southern Lesser Antilles three, the northern Lesser Antilles four, and Rapa Nui two. Australia has fifty overall but only two in each of 1–500 and 501–1000 CE, compared with thirty-five in 1701–1934. The Guianas have ten overall, nine represented in the latest period. Research priorities should therefore use place × time gaps after supported settlement, alongside geography, rather than the smallest total alone. These counts describe this atlas and do not establish absence or abandonment.

## What the live display does today

The audit used a 1600 × 1000 desktop viewport, with a 1250 × 761 map. The following counts are rendered place/event symbols, excluding natural-hazard symbols and area polygons. A crowded symbol has another center within 24 screen pixels; this is a proximity diagnostic, not a claim that every pair's visible ink overlaps.

| View | Point symbols in view | Within 24 px of another | Older-evidence point symbols |
|---|---:|---:|---:|
| Americas, 1200 CE | 270 | 241 | 116 |
| Americas, 1492 CE | 331 | 303 | 181 |
| Americas, 1863 CE | 600 | 579 | 332 |
| Four Corners, 1150 CE | 47 | 41 | 7 |

Current strengths worth preserving: viewport culling, exact-coordinate grouping, overlap choosers, label collision checks, supported route windows, one shared clock, independent topic mode, topography, and individual site phases. Current limitations:

- Nearby but different coordinates remain separate symbols at every scale. Fixed screen-size symbols eventually compete for the same screen area.
- Label decluttering does not solve symbol crowding. Small symbols still carry several rings, badges and phase counts at continental scale.
- Earlier evidence accumulates; it needs a different visual role from current activity and new changes.
- Active migration/exchange lines are 2 px, with line opacity 0.85. Approximate windows give their whole group opacity 0.7: the line is effectively about 0.595 opaque before antialiasing, and its halo fades too. Older generic movement paths use another style. Relief and labels further compete with them.
- Magnification is a custom atlas scale, not standard web-map zoom. Label thresholds are mixed (some at scale 4, others at 16), so new rules should use actual screen distances and visible geographic span.

## Approaches considered

1. **Fixed zoom levels only.** Simple, but Chaco can remain crowded at a scale where another region has three isolated sites.
2. **Zoom plus local screen crowding — recommended.** Zoom sets the vocabulary; local density determines when places or connections combine. Sparse features remain visible, and dense features expand as space becomes available.
3. **More manual layer filtering.** Useful as an optional expert control, but it asks viewers to reconstruct context and undermines the sit-back movie.

The recommended approach retains manual filters and a compact/standard/detailed display preference, with standard as the default. That preference changes grouping and label budgets, not historical eligibility. A map viewer should not need to manage filters to understand the default movie.

## Four levels of presentation

Distance bands below are starting points for design, measured across the visible map; they are not final hard-coded thresholds. Local crowding can retain an individual sparse point at any level or keep a dense complex grouped one level longer.

| View | Places and events | Movement and terrain |
|---|---|---|
| Whole Americas/Pacific, roughly >3,000 km across | Named regional groups with counts of mapped places and explicit current-change badges; a small set of labeled context anchors; selected places always individual. Remove per-record rings and room/phase badges. | Strong active connection corridors, readable arrowheads and occasional route names. Quiet but visible topography. Old evidence and wrecks remain summarized. |
| Region, roughly 300–3,000 km | Individual towns where space permits; dense valley/island groups split into smaller groups. Active battles, foundations and relocations are emphasized. | Separate source-supported connections; endpoints, goods and peoples accessible on selection. Terrain becomes more descriptive. |
| Local area, roughly 10–300 km | Named settlements and nearby archaeological complexes; local roads, missions, ports and event locations. The local timeline exposes rebuilding, relocation and changes in use. | Local route branches and stops. Maintain direction cues on short routes. Crowded nearby sites expand with leader lines or a chooser. |
| Site, roughly <10 km | Surveyed buildings, plazas, mounds, kivas and dated phases where mapped source geometry exists. A single public site anchor remains a site anchor when the building layout is unknown. | Local paths and more detailed relief, with current structures distinguished from earlier remains and location precision available on selection. |

An overview group is a display collection, not a territory or population estimate. It needs a named geographic anchor and an expandable member list. A count such as “18 places” must be based on reconciled place identities; phases, multiple sources, and point/route views of one find cannot inflate it. Until identity reconciliation is available for an item, label counts explicitly as “mapped locations” or “records,” as appropriate. Grouping must not claim that every earlier-evidence place was occupied at the selected date.

Every in-view, time-eligible item remains accounted for individually or within an expandable group. Group badges distinguish current changes, continuing habitation when supported, and earlier evidence. Selected records, the active journey and chapter focus remain individually traceable. Curated context anchors should represent multiple inhabited regions and Indigenous as well as colonial histories; documentary abundance alone must not determine prominence. The 1492 example must retain Columbus and Taos alongside visible activity elsewhere.

## Density and interaction rules

- Group after historical filtering, within the viewport plus a modest margin. Routes crossing the viewport remain eligible even when both endpoints are offscreen.
- Use screen-space proximity rather than distance in degrees. Initial tuning: investigate grouping when point centers are within roughly 28–40 px; target around 60–90 overview place/group symbols and 12–20 labels per 1000 × 700 map area. These are starting ceilings to validate, not research or population weights and not permission to discard evidence. Overflow becomes visible expandable groups.
- Use stable geographic membership and anchors within a zoom band, with separate thresholds for entering/leaving a group. Time changes update counts and emphasis rather than causing the whole map to shuffle. Merge/split transitions preserve the viewer's sense of where places went.
- Nearby identities remain separate inside a group even when they share a rounded display anchor. A selected record keeps its identity across zoom, time changes, hover, keyboard focus and redraw.
- Cluster selection fits the members if useful; at maximum useful zoom, open a member list or separate symbols with leader lines back to their actual anchors. Never silently change source coordinates to spread points apart.
- Account for symbol, route-label, boundary-label and control-panel collisions together. Keep touch targets generous without enlarging every visible glyph. Preserve keyboard access and the visible evidence list.
- Ordinary movies, Explore and place stories retain the shared date. Topic dives retain their intentional separate subject scope. Offscreen details can be left unrendered while the shared clock and a compact “Elsewhere now” list continue.

## Movement and contrast

The visual aim is immediate recognition of people moving and places being connected. Positions, dates, direction evidence and route status remain unchanged while symbols are made more legible.

1. **One movement design across record types.** Audit history migration/exchange, older movement records, forced removal, voyages, and network overlays. Use a consistent visual language instead of strengthening only one route class.
2. **Readable lines.** Start with approximately 3–4 px colored lines, a 6–8 px opaque dark casing, and larger screen-size arrowheads. Maintain contrast over pale terrain, forests, ocean and shaded mountains. Display geometry may be simplified at small scales with original endpoints retained; explain schematic paths on selection.
3. **Distinct meanings.** Proposed palette: warm amber for movement of people, cyan for trade, magenta with an explicit forced-relocation symbol/label for forced movement. Voyages have a boat only when vessel travel is supported. Pair color with line pattern, arrow direction, symbols and plain-language labels.
4. **Direction follows evidence.** One-way chevrons where direction is known; two opposing lanes/arrows only for supported two-way activity. An uncertain-direction connection has no invented directional animation. No arrow follows coordinate order merely because a path is stored that way.
5. **Uncertainty stays readable.** Use dashed edges, a hollow arrow or an “Approximate route/date” indication, with details available. Do not make an important uncertain connection nearly disappear. Timing uncertainty and position uncertainty remain separate.
6. **Related routes can be summarized.** Bundle only compatible active links with a shared corridor and meaningful endpoints. Keep migration, trade, forced removal and differing actors/directions distinct. A bundle such as “4 exchange connections” expands to its members. Width describes a display bundle, never an unsupported volume of people or goods.
7. **Motion serves the clock.** Slow moving chevrons or vessel positions run during playback and pause with it. Motion is a direction cue, not an inferred daily sailing frequency. Reduced-motion mode keeps clear static arrows. A route ceases to animate outside its supported window; unknown cessation is not recast as a proven stop.
8. **Quiet terrain, strong foreground.** Keep mountains legible, with reduced relief contrast and label competition at continental scale. Increase terrain detail when local geography matters. A lighter/darker casing should preserve graphic contrast instead of relying on bright color alone.

Use at least 3:1 contrast for meaningful graphical cues against adjacent colors, including the final composed appearance; thin lines need visual testing as well as color calculation. See [W3C non-text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). Playback should pause all continuous decorative route motion as well as the timeline, consistent with [W3C pause/stop guidance](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).

## Playback emphasis

Make new settlements, arrivals, battles, wrecks and route changes briefly prominent, with a short label saying what changed and when. Several changes at the same date appear as grouped regional activity, not a forced sequence of isolated stories. Persisting places form the background context. Earlier evidence remains available and summarized, without being counted as current inhabitants. The viewer can pause and inspect any group.

Avoid flashes, automatic camera jumps, and endless pulsing. When a record has a date range, the effect represents that source window, not a fabricated exact event. Buildings do not grow smoothly between dates unless the evidence supports such a reconstruction.

## Proposed implementation order

1. **Measure and make movement readable.** Keep the present map behavior, add repeatable density snapshots, unify movement styles and direction handling, improve casing/arrowheads and terrain balance. Correct the audit's geographic labeling and date-line grouping separately from historical data.
2. **Add overview grouping and a stable visual hierarchy.** Reconcile identity/count rules, add local density grouping, historical-context summaries, visible overflow counts and interaction-preserving transitions. Keep every eligible record reachable.
3. **Let regions and sites unfold.** Add the shared level-of-detail policy, combined label placement, local chronological details and surveyed footprints where available. Apply it to ordinary movies and Explore while preserving topic isolation.
4. **Tune the movie and validate learning.** Add restrained change emphasis, test representative years/regions and adjust the provisional thresholds from observed readability and navigation.

This is one coordinated display redesign rather than a new round of historical research. It does not require Consensus. A later research campaign should group the sparse areas into coherent histories and evaluate post-settlement time gaps.

## Acceptance checks

- At 1492 in the overview, Columbus and Taos remain discoverable at the same date, together with representative activity in South America and the Pacific. Zooming never changes the historical clock or removes the rest of the world from the dataset.
- Dense 1200, 1492, 1832 and 1863 snapshots have no unexplained disappearance of records. Count reconciliation proves every eligible item is represented directly or by a group; visible labels and targets remain usable.
- Four Corners, Chaco, Cahokia, central Mexico, eastern Brazil and Hawaiʻi test different local densities. Sparse Kiribati and northern inland regions retain their few genuine points rather than gaining decorative populations or routes.
- Colonies, Indigenous places, battle records, uncertain observations and older evidence have intelligible distinct roles. Regional influence circles and borders never block selection of a place.
- A trade/migration test crosses light land and dark ocean; another crosses high-contrast relief. Verify arrows and labels at desktop and tablet sizes, in color-vision checks and reduced-motion mode.
- Same-site phases, nearby distinct sites, approximate anchors and point/route views retain correct identities and counts. Groups never label unknown population as known.
- Date gaps at Formoso and Primavera remain gaps; route windows and unknown cessation retain their existing semantics. High zoom does not manufacture more precise dates or locations.
- Pausing stops all movement cues; same-date simultaneous events remain represented. Measured responsiveness remains acceptable with current data and a larger synthetic display fixture.

Builder decisions: exact pixel thresholds, palette values, grouping implementation and animation duration should be tuned against these cases. They are proposed defaults, not user-approved final values. The invariants above are fixed by the user's existing requirements.

## Evidence and implementation touchpoints

The accompanying [audit snapshot](../../map-density-audit.json) contains the counts, named records, region exclusions, temporal slices and observed map metrics. Source analysis used the canonical shared dataset and `data/coverage-audit.json`; no production data was edited.

Likely implementation touchpoints: `src/map-place-groups.ts` (identities versus display groups), `src/map.ts` (screen-space rendering and label placement), `src/map-viewport.ts` and `src/map-geometry.ts` (visible geometry), `src/history.ts` (preserve historical state while separating visual emphasis), `src/styles.css` and `src/atlas-context.css` (route/terrain contrast), and existing timeline, topic-context and picking tests. A focused implementation plan should be written after this display proposal is agreed.
