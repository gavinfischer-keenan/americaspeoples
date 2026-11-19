# The Spread of Peoples: world entrance and human-family framework

## Intent and confirmed decisions

The user wants the world to be the entrance, with a global summary, existing Consensus acknowledgement, and a globe whose regions carry evidence statistics and open their regional maps. Americas becomes one region. Alaska Blackfish remains the project identity; its subject becomes **The Spread of Peoples**. The user selected **one site with regional paths**, and explicitly required the whole human family, including earlier hominins, Neanderthals, Denisovans, interbreeding, and the fate of other branches. A later clarification requires a substantial genetics discussion on the human-family guide, separating evidence strength and geographic differences.

This is an initial broad research framework, intended to connect later detailed work. It must be playable and sourced, with breadth across Africa, Europe and Asia. It is not an exhaustive fossil inventory or a finished history of every region.

## Verified starting point

Production API returned healthy v0.31.0 with 11,201 archived Americas records. That release includes 396 northern Europe entries, 378 Europe sources, 362 boundary versions, 60 world guides and ordinary timelines ending in 1900. Hawaiʻi statehood retains 1959. The clean checkout starts at 8d880f1. Tripofisch is self-hosted through Caddy in container 703; the separately registered Sites project is not this production deployment.

## Approaches

1. **Selected: one world entrance and regional paths.** Reuse the application and its sources; provide stable region pages and visible world navigation. This keeps the map a destination rather than forcing entry through Americas.
2. Separate regional subdomains would preserve independent addresses but add DNS, TLS and deployment surfaces without improving the interaction. The user chose paths.

Retain existing bookmarks and archive identifiers. No repository rename or wholesale migration of existing evidence is required. Reuse the current TypeScript/D3/Python stack without new dependencies.

## Website and application

- Tripofisch's Alaska Blackfish links lead to `/spread-of-peoples/`. Region pages live below it: `americas/`, `africa/`, `europe/`, `asia-pacific/`. Keep the existing Americas landing address as a compatibility link to the regional material.
- The hub has the project heading, dataset-derived totals, the Consensus provenance box, then the world map. Regional labels show **earliest mapped evidence** and **unique references**, with coverage stage and record counts available in the companion list. Earliest mapped evidence is not a claim of first arrival. A source count is not a vote for a theory.
- A rotatable globe and an all-regions map mode share the same destinations. A persistent list provides keyboard, mobile, and non-hover access. Region click opens that regional map page directly; the map must not be hidden behind a second launch decision.
- The existing detailed Americas and Europe movies remain available. Africa and Asia receive the new playable foundation coverage; Europe also gains a link to this early framework. A global human-family movie spans region boundaries.
- The application root opens the world hub. Explicit old `#movie`, `#explore`, topic and Europe URLs retain their established meaning. New world startup must not await the entire Americas API catalogue.
- A shared mount/dispose lifecycle stops old playback and ignores stale async responses. Existing Americas/Europe state remains intact when switching inside the application. New foundation views keep their own date, selection, and camera.
- Regional website pages may frame the existing map application with a prominent full-window link. If this integration is used, release configuration must narrowly allow the Tripofisch parent origin; current production deliberately disallows framing. Never present a frame as verified before that header and real browser behavior are checked.

## Research and time

Use a dedicated human-family catalogue so deep time does not silently change the old archive's one-million-year validation contract. Dates use integer astronomical years internally; retain the source's original Ma/ka/BP labels, age reference, uncertainty and dating meaning. Do not present a rounded geological age as an exact calendar year. Modern discovery/publication dates never become occupation dates.

Catalogue shards have `{schemaVersion:1,sources,taxa,evidence,waves}`. Sources contain `id,title,url,access` (and optional locator). Taxa contain `id,name,meaning,status,note,sourceIds`; status is `proposed-ancestor|related-lineage|living-lineage|uncertain`. Evidence contains `id,title,taxonIds,regionIds,kind,start,end,dateLabel,dateBasis,coordinates,summary,limits,sourceIds` and optional `guideId`. Kinds are `fossil|archaeology|genetics|movement|historical`. Waves contain `id,title,taxonIds,regionIds,kind,start,end,dateLabel,coordinates,summary,limits,sourceIds`; kind is `dispersal|admixture|population-change`. Wave geometry is a schematic polyline, never a surveyed migration track. Region IDs are `africa|europe|asia-pacific|americas`. Taxon IDs may reference another shard; combined validation is authoritative.

- Opening: principal early hominin branches and early Homo; Africa's multiple research areas; early Eurasian evidence. Branches are not automatically direct ancestors.
- Middle and late Pleistocene: erectus, Neanderthal and Denisovan evidence, African diversity, island lineages, Homo sapiens origins and repeated dispersals. Include competing dates/classifications where materially relevant.
- Later framework: Ice Age and postglacial movements, farming-related population movements, steppe-related expansions, and selected Africa/Asian movements. Reuse existing Americas/Pacific detail through links rather than copying it into the first draft.
- Points represent evidence. Fading earlier points represent earlier observations, not demonstrated ongoing occupation. A last known fossil is not an extinction date. An absent marker is not absence of humans.
- Broad routes animate as clearly identified reconstructions, with active date windows and source panels. Genetics alone does not establish language, culture, direction, or a precise migration path.
- All ordinary views retain 1900 as the endpoint. Foundation playback visits evidence changes instead of spending millions of years on empty frames.

## Genetics guide

Extend `world-human-family` within the existing sourced guide system. Cover ancient nuclear DNA, mitochondrial DNA, proteomics and morphology separately; direct recent ancestry versus inferred older introgression; Neanderthal and Denisovan evidence and regional heterogeneity; back-migration into Africa; variation among sampled African populations; and unresolved claims about unsampled/archaic lineages. Include a geographic comparison table, study dates, ascertainment/sampling limits, and source-level access notes. Do not turn model-dependent percentages into universal population facts. Avoid a definitive family tree where relationships remain debated. A schematic admixture link must never imply a proven meeting location.

## Statistics and packaging

Generate one summary from canonical evidence, guide bibliographies and the new catalogue. Deduplicate sources by normalized URL/DOI and records by canonical identity. Describe each statistic's universe; do not label all 11,201 Americas archive rows as geographic Americas-only or all playable. Existing Pacific coverage crosses the old collection boundary. Broad region summaries may overlap; global totals are unions, not sums. Unknown counts/dates are explicit, never zeros masquerading as evidence.

Keep the website source and generation in the repository so later releases cannot overwrite it from an old external landing snapshot. Produce a staged Tripofisch bundle, local preview and deployment instructions. No new production deployment has yet been requested in this turn; finish and verify reviewable local changes before deciding publication.

## Verification and completion

Test combined catalogue identity/citations, deep-time seeking, interval validity, date-qualified waves, source deduplication, regional isolation, default-root startup without Americas API, explicit legacy routes, browser back/forward, no duplicate playback after remount, and accessible desktop/mobile navigation. Run repository unit/type/data checks, production build and relevant browser suites; the established full release verifier remains mandatory before publication. Inspect the globe and regional maps visually. Preserve source dates and the Hawaiʻi exception.

## Builder discretion

Choose typography consistent with the existing teal/navy identity, label placement, globe rotation controls, modest evidence density and initial scene pacing. Use full-width maps and readable text. Keep the initial framework deliberately small enough to inspect every citation. Additional named taxa or waves may be added when primary evidence supports them; do not claim exhaustive completion.

## Accepted additions during implementation

The user added Genghis Khan, Marco Polo, the Silk Roads and Hannibal as sourced deep dives that also contribute dated map evidence, movement windows and territorial reconstructions. City population sizes are included only with dated support; none is fabricated. The four studies use the same player and navigation as the regional foundation.

The front page is denser, with global and human-family statistics. Its Consensus strip contains only a link, the owner's110+ project Deep-run total and a traceable cited-paper count. Full acknowledgement and clarified non-republication wording belong on the Sources & licenses page. Tool polling does not measure Deep runs. Private research remains private.

All maps use shared World / Region / Map settings / Facts controls. Settings start closed and occupy normal flow; lineage, search and layers move out of the facts column. Selecting evidence closes menus and shows facts. Facts collapse in the same way across regional and historical maps.

The latest requested map expansion is **Africa from earliest evidence through15,000BCE**, an explicit calendar cutoff (astronomical-14999, approximately16,949BP). Inventory all supportable public fossil localities, occupations, archaeological phases, burials and traditions across north/west/central/east/south. Fossils do not automatically establish habitation; tool traditions do not identify ethnic peoples or biological species. Include revised dates, disputed claims and geographic gaps. Exclude later Holocene contexts and make any phase clipping at the cutoff explicit. New research may be extensive, but this remains coverage of supported evidence, not a claim that every possible site is known.

## Africa search placement refinement

The Africa expansion adds a compact site/evidence search immediately above the facts list. It searches across all dates and selecting a future result advances to its evidence date. Offscreen results are brought into view. Lineage, chapter and reading controls stay inside the shared closed-by-default Map settings menu. This keeps the facts column useful for finding a specific site without restoring the large navigation panes. Search and selected facts persist independently per regional map and early-Africa chapter.
