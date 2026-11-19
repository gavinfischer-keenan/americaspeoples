# Northern Europe and the 1900 boundary — implementation plan

> **For agentic workers:** Use superpowers:executing-plans for implementation and focused independent reviews. Keep research files and implementation ownership separate.

**Goal:** Activate a playable Europe atlas covering the requested northern regions from their earliest supported evidence through 1900, with deeper regional guides, and apply a 1900 display ceiling to all ordinary map timelines. Hawaiʻi statehood retains its explicit 1959 exception.

**Architecture:** Keep canonical source records and their actual dates intact. Separate publication/validation limits from display limits. Europe uses its own lazily loaded regional evidence catalog, date state and map controller, sharing the existing renderer, chronology utilities and guide system. Switching destinations must preserve the Americas state. Africa and Asia remain guide-first placeholders.

**Tech stack:** Existing TypeScript, D3 SVG MapView, static source JSON, Python preparation, Playwright, and Python/SQLite hosting.

## Scope and decisions

- User explicitly chose to activate the playable Europe timeline in addition to deep dives.
- Northern scope: Norway, Finland, Sweden, Denmark, Sápmi across modern borders, the full UK and Ireland, Iceland, Faroes and Greenland. Svalbard and northern maritime connections receive sourced contextual coverage.
- First time means the earliest dated evidence in the selected atlas, including deep prehistory. An absence or gap remains a coverage gap, never fabricated continuous occupation.
- 1900 is the inclusive final calendar year. Do not change historical source dates or rename a 1934 event as 1900. Hide later scenes, stops and evidence on ordinary map surfaces while retaining original research for future work.
- Modern basemaps, archaeological discovery and conservation information, and publications retain their true dates and clearly identified reference role.
- Hawaiʻi statehood is the only timeline exception. This exception must not leak into the shared maps or other topics.
- Favor connected regional histories and several time periods over a list composed only of famous Viking sites. Preserve Indigenous Sámi and Greenlandic histories and uncertainty about first arrivals and abandonment.
- The initial local hold was superseded by the user's later instruction: **“on further thought - lets push this release - its good discipline.”** Finish verification, then publish v0.31.0 through the established release process, verify the public site and retain the previous release for rollback.

## Tasks

### Expanded movie design (latest user direction)

Europe is now a populated movie, beginning in the northern countries and extending outward through supported connections. Geography remains global; the initial research coverage is northern. Modern country names are navigation filters, never evidence of ancient sovereignty.

1. **Time and playback.** Use an independent Europe clock, earliest supported evidence through 1900, with deep-time and calendar-era jumps. A source-date movie pauses at dated changes; free seeking stays available. Interval evidence remains visible during its supported span. Earlier places may remain as subdued historical context, with their actual dates visible. No extrapolated occupation.
2. **Political territories.** Keep territorial versions separate from event records. Each version has dated validity, geometry, authority type, source IDs, geometry provenance, precision, a label anchor and explanation. A political union must not erase constituent kingdoms. Claims and approximate reconstructions use distinct outlines; effective control and legal sovereignty are not interchangeable. Unsupported periods remain gaps. Do not morph polygons between treaty dates. Provide an inspectable list of territories at the current date, with sources and limitations. Initial coverage must include real dated shapes, not just kingdom point markers.
3. **Population.** Keep dated census/estimate observations with their settlement scope. Render dots from resident counts, not the age or number of records. Where observations cover the same town and scope, optional interpolation must be explicitly described and confined between observations; never extrapolate. Sparse observations are allowed to remain dated snapshots. The legend identifies unknown population and estimate ranges. Geographic aggregation is never population addition.
4. **Networks.** Entries can carry `networkKind: trade|road|rail`, an explicit destination and optional sourced intermediate coordinates. A two-endpoint connection is schematic, with a dashed line and its goods/purpose, dates and uncertainty in the detail panel. Road and rail colors/styles are separate. Opening dates do not by themselves prove perpetual operation. Outside endpoints are selectable and labeled, linking the northern evidence outward without pretending the rest of the world is comprehensively populated.
5. **Voyages.** Reuse canonical itineraries and source records. Region-crossing expeditions must not acquire invented new dates. Source-level stop dates and interpolation/position gaps retain their current meanings; all display stops obey the 1900 ceiling.
6. **Detail and interaction.** One tooltip owner, a keyboard-accessible evidence list, and persistent click details. Hover copy says what happened at the place. Layer switches, region/category filters and date selection are independent. Switching atlases cleans up animation/hover handlers and restores saved camera/time. Regional records open their local full citations, never a nonexistent Americas API record.
7. **Guides.** Add substantial northern regional guides with full-area modern terrain and authoritative reference-map links. Add separate super-deep-dives on Ötzi, other cold-preserved human remains, and Andean summit children. These mummy studies are reading content, not new playable-timeline events. Distinguish the date of death from discovery and research; distinguish glacier preservation, frozen burials and cold desiccation.
8. **Warfare and the Picts.** Include Norse raids, sieges, campaigns and conflicts within Scotland, with participants, outcomes and civilian consequences where supported. Distinguish a locatable battle from an inferred campaign area; never invent an army or fleet track. The Picts guide must explain the evidence for names, language, symbols and the emergence of Alba, without presenting political change as the disappearance of an entire population.

### Political geometry sourcing

Prefer reproducible imports of licensed historical GIS, then clearly attributed original schematic reconstructions tied to authoritative historical maps. CShapes-Europe supplies dated European states from 1816; its CC BY-NC-SA terms require attribution, a separate dataset license and redistribution notices. It does not solve medieval boundaries or distinguish every overlapping local authority. National libraries and heritage institutions supply earlier maps and treaty histories. Modern Natural Earth administrative polygons can be a labeled reference only, never relabeled as a precise historical frontier. No proprietary Euratlas/Geacron geometry is to be copied.

### Extended regional entry contract

Optional `population` observations are `{year,min,max,basis:'census'|'estimate',note,sourceIds}[]`. Optional network fields are `networkKind:'trade'|'road'|'rail'`, `routeCoordinates:[number,number][]`, and `destination:[number,number]`. Every observation must cite a registered source. The normalizer retains the original entry and turns supported observations into dated map population claims. It must not silently turn a date range for an uncertain event into continuous activity.

### Additional acceptance checks

- Borders can be enabled, inspected and switched off, with sourced historical shapes visible at supported dates; the atlas distinguishes source gaps from an absence of polities.
- Roads, railways and trade have distinct map styles and appear only at their evidenced dates. External endpoints remain in the data and are inspectable.
- At least several towns have sourced population observations, and unknown settlements never acquire implied resident counts.
- New guides contain explicit source-linked findings, conflicting interpretations where relevant, full-area terrain maps, and map/image attribution. Mummy guides remain outside the Europe evidence catalog.
- Coverage reports enumerate region/era counts and remaining gaps, instead of claiming the northern histories are complete.

- [x] Establish centralized display policy and regression tests; apply through ordinary stories/topics, dates, voyages, all-period Explore, contextual layers and launch links without altering underlying historical evidence.
- [x] Research northern coverage with source-level dates, places and qualifications. Author independent per-region files and guides. Audit geographic and chronological gaps explicitly.
- [x] Normalize and validate the Europe evidence catalog; retain stable source IDs and links to guides and canonical Atlantic voyages. Do not duplicate established Greenland/Iceland evidence when reuse is supported.
- [x] Implement the Europe map controller: earliest-to-1900 timeline, play/pause, period/region/category/search filters, evidence selection, sourced details, guide links, camera controls, and retained state across atlas switches.
- [x] Activate the Europe manifest/navigation; leave other planned maps unchanged. Add modern terrain maps to new deep dives and source links to authoritative archaeological plans.
- [x] Review all boundary cases, source/date/identity coverage, desktop and phone behavior; fix findings. Run meaningful focused tests and applicable release checks, then publish the authorized release and verify it publicly.

## Research handoff contract

Each research file is `{schemaVersion:1,regions:[{id,title}],sources:[{id,title,url,authors,year}],entries:[...]}`. Each entry has a stable `id`, `regionId`, `title`, `category` (habitation, exchange, state, religion, conflict, industry, voyage, environment), `kind` (interval or occurrence), `start`, `end`, `approximate`, `dateLabel`, `dateMeaning`, `coordinates:[lon,lat]`, `place`, `summary`, `detail`, `uncertainty`, `sourceIds`, and optional `guideId`, `canonicalRecordId`, `destination:[lon,lat]`. Numeric dates use astronomical years (1 BCE = 0; 1000 BCE = -999). Source publications and discovery dates must not replace the dated historical activity. Modern countries are navigation bins, not projected ancient borders. Map coordinates require source support and approximate references are labeled. All source URLs must be HTTPS.

Guide files use the existing WorldGuide schema. Keep regional narratives, dated point descriptions, institutional reference maps and bibliography together. New guide IDs begin `world-`. Regional coverage is substantial selected evidence, not a claim of exhaustive history.

## Review focus

1. A 1901 arrival, wreck, topic scene or direct journey URL must not appear on an ordinary map, including all-period views. A route crossing 1900 must not jump to its later endpoint.
2. Hawaiʻi may still reach 1959, and returning to either shared map restores that map’s earlier clock.
3. A deep-prehistory date, zero-as-1-BCE and an uncertain date interval must survive timeline seeking and display without year-zero labels or fake continuous occupation.
4. Europe loading, switching, pending fetches and cleanup must not replace or corrupt Americas state or duplicate tooltips/animation loops.
5. Greenland/Norse continuity and retreat, Sámi cross-border histories, disputed early Nordic evidence and empty chronological bins must remain explicitly qualified.
