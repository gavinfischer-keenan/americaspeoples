# Future development

1. [Site deep dives and first Hovenweep 3D model — issue #1](https://github.com/gavinfischer-keenan/americaspeoples/issues/1).
2. [Tribal history dendrogram and backward geographic flow — issue #2](https://github.com/gavinfischer-keenan/americaspeoples/issues/2).

Both issues are labelled `feature request`. Site and culture pages are now being implemented in v0.5.0; 3D model ingestion and the ancestry graph remain future work.

Owner request 2026-10-29: eventually host exceptionally detailed historic-site studies, including 3D models of Hovenweep and other places, supporting media, sources and explanations.

Keep these as site-detail resources, separate from the lightweight global catalog. Large 3D meshes, textures and media should load only when a visitor opens the relevant deep dive. Preserve stable site IDs and individual settlement granularity so one regional culture does not become a substitute for a specific building/site. Each future asset needs its own source, capture/reconstruction method, revision and appropriate credit. A reconstruction must remain distinguishable from observed geometry.

For the second feature, selecting present-day tribal geography should open a sourced predecessor graph and allow backward exploration on the map. Distinguish jurisdiction, reservation/reserve lands, traditional territories and overlaps. Keep community histories, cultural relationships, language descent/contact and genetic evidence separate. Support multiple predecessors, admixture and disputed alternatives rather than forcing an exclusive tree. Every relationship needs sources, time guidance and explicit uncertainty; identity and citizenship are not inferred from genetics. Present-day communities require a view beyond the historical animation's 1934 endpoint.

No 3D viewer, model ingestion or ancestry graph is implemented in this release. The initial site-page collection separates locations from culture/civilization summaries, with cited religion/ritual, language and rise/transformation sections. Chaco and Inca pages include schematic geographic road-network maps with explicit source/precision limits. See data/site-research-queue.json for the next regional complexes.


## Current research queue — 16 November 2026

The owner selected **early Central/South America and Pacific continuity first** after the v0.16 coverage/movie review. See [the ranked gaps and archaeological-complex shortlist](coverage-priorities-2026-11-16.md). The two Australian movies below remain requested and queued, with links to forced Indigenous relocations; they are not yet implemented.

The twenty topics requested before v0.14 are now playable: horses, maize, sweet potatoes, dogs, boats/voyaging, trade, languages, Haudenosaunee history and lacrosse, Amazonian peoples, Caribbean forced African migration, forced Indigenous relocations, Hawaiʻi and statehood, territorial purchases, Pacific fur trades, whaling, Spanish treasure shipments, missionaries, pottery, obsidian exchange, and copper working. Their research remains incomplete. The following new requests are recorded here for the next implementation; they are **not yet playable movies** and are not additions to the v0.16 dataset.

### 1. Australia: convict transportation, pastoral expansion and wool ships

One connected, independent-topic movie, within the existing 1934 endpoint. Convict labour and the wool industry have a documented connection; transportation, pastoral expansion and the later clipper era need their own dated chapters rather than being collapsed into one simultaneous process. The key export story is wool, with live-sheep movement identified separately where supported.

- Show actual convict voyages, landings, working institutions, town development and routes between them. Sydney's 1788 establishment marker alone does not represent the transport network or the city's subsequent growth.
- Make growth visible through individually located towns, sheep stations, outstations, yards, sheds, roads, railways and ports as evidence supports their construction and operation. Separate first attestation, establishment, expansion, cessation and surviving ruins. Use dated population, flock or building observations only when sourced; do not animate invented annual totals or equate a pastoral lease with occupied land.
- Keep Aboriginal Country and communities present before, during and after colonial development. Explain whose land and water were appropriated, the claimed legal mechanism, whether consent was actually documented, coercion, resistance, killings, labour arrangements, and continuing community life. A Crown grant, lease or government transaction is not evidence of Indigenous agreement. Do not manufacture precise traditional boundaries or infer abandonment from a source gap.
- Give the ships a substantial chapter: vessel types, documented voyages and cargoes, seasonal departures, wool-loading ports, crews, passage times, hazards and wrecks. Include *Cutty Sark*'s Australian wool voyages (1883–1895) and research other wool clippers. Show supported movements through the atlas, including Cape Horn, with off-map connections labelled toward Britain. A general sailing corridor must remain distinguishable from a log-supported track.
- Add reciprocal, explanatory links to forced Indigenous relocations, trade, boats/voyaging, missionaries, and the Australian mining topic below. Link a named station or town expansion to the particular removal, confinement, exclusion or institution when the evidence establishes that relationship; proximity alone is insufficient.

Initial sources: [National Museum of Australia on merino sheep and convict labour](https://www.nma.gov.au/defining-moments/resources/merino-sheep-introduced), [the Bigge inquiry](https://www.nma.gov.au/defining-moments/resources/first-bigge-report), [transportation's ending](https://www.nma.gov.au/defining-moments/resources/convict-transportation), and [Royal Museums Greenwich on the wool voyages](https://www.rmg.co.uk/stories/maritime-history/history-cutty-sark-10-pictures). These are research starting points, not a completed scholarly intake or permission to reproduce source media.

### 2. Australia: mining, export ports and growing towns

A separate topic linked to pastoral expansion and **forced Indigenous relocations**, also ending in 1934. Mining is firmly within scope: colonial coal extraction/export around 1800, South Australian copper in the 1840s, the 1851 gold rushes, Broken Hill in the 1880s and Western Australian goldfields in the 1890s. The modern post-1934 resource-export boom is outside this request. Indigenous quarrying and mineral exchange predate colonial mining and must not be described as absent.

Show operating mines, camps becoming towns, changing town extent or dated population evidence, labour and migration, water infrastructure, built rail links, smelters, ports and documented export destinations. Distinguish mineral discovery, a paper claim, actual extraction and later industrial growth. Identify affected Indigenous communities, land and water dispossession, resistance, forced labour or relocation where supported, with reciprocal links to the relevant relocation chapters. Follow closures and contraction as well as growth.

Initial sources: [Burra's 1845 copper mining and town growth](https://www.environment.sa.gov.au/topics/heritage/state-heritage-areas/burra), [the 1851 gold rushes](https://www.nma.gov.au/defining-moments/resources/gold-rushes), [Broken Hill and the Mt Gipps sheep-station connection](https://www.nma.gov.au/defining-moments/resources/founding-of-bhp), [Western Australian gold rushes](https://museum.wa.gov.au/explore/wa-goldfields/rush-gold/), and [the State Library on dispossession and restricted water access](https://exhibitions.slwa.wa.gov.au/s/federation/page/gold). Verify early coal voyages individually: published institutional histories disagree about the exact first export date and vessel.

### Shared-map coverage pass

The owner also requests a stronger 10,000 BCE–1 BCE record for Central and South America, plus Australian and northern/eastern island sequences. The v0.16 detailed audit has no dated local-place observations in any of those four early bins for Honduras/El Salvador/Nicaragua or the Guianas; Costa Rica/Panama has only one locality in one bin. Australia's four bins contain only two or three distinct locality IDs apiece. These counts exclude regional context and routes, overlap across rows, and do **not** demonstrate human absence.

Priorities are dated local occupation and construction phases, early food production and exchange, coastal and riverine communities, Brazilian shell-mound landscapes, Andean and Ecuadorian settlements, New Guinea and Bismarck sequences, and Melanesian communities before and after Lapita. Distinguish Near Oceania's older occupation from later Remote Oceanian settlement; do not fill pre-settlement island periods with invented communities. Audit existing records before duplicating sites. Extend the later island pass to documented colonial institutions, plantation labour and coerced recruitment, ports and resistance where evidence supports them.

Australian colonial coverage presently includes Sydney (1788), Hobart (1804) and Perth (1829) establishment observations, but lacks a dedicated convict-voyage/wool-shipping sequence and detailed pastoral growth. These are additions to research, not a claim that the country or its neighbours are already comprehensively mapped.

Every intake must feed independently supported settlements, voyages, peoples, conflicts and relocations into the canonical shared map, with reciprocal topic references. Subject-only interpretation stays in the separate topic mode. Source uncertainty, geographic precision and unknown cessation remain explicit. Consensus research must use Deep and remain within the cumulative **100-call cap**; the v0.16 deployment closes at **66 calls**, including polls, leaving **34**. No further Consensus calls were used for this initial queue and coverage assessment.

## Categorized directory — v0.17 candidate

The live navigation in this candidate reorganizes existing independent movies, contextual stories and guides into Subjects, Places, Languages and Cultures. Coming soon entries are visible but not playable. Caral/Supe, Kuk and Upano now have dedicated place guides and contextual movies. The fifteen other complexes in the 16 November shortlist remain queued; the six established place guides retain an expansion label. Four proposed language studies (Austronesian, Quechuan/Aymaran, Iroquoian and Maya) and four culture studies (Wari, Moche, Lapita and Gunditjmara) seed the new lists. These are research priorities, with no promised completeness or publication date.

The Australian convict/pastoral/wool and mining subjects remain queued with the land-dispossession and forced-relocation requirements above. Consensus cumulative usage is now 70/100 after this intake, leaving 30 calls. See [the candidate evidence and source decisions](early-continuity.md).

## Coming soon campaign — first half implemented, v0.18 candidate

Completed dedicated treatments: Chavín, Tiwanaku, Chan Chan, Teotihuacan, Monte Albán, Calakmul, Copán, Paquimé; Wari and Moche; Quechuan/Aymaran, Iroquoian and Maya languages. The ten place/culture movies retain the shared clock. The three language movies are independent. This intake adds 61 shared and seven focused observations, with 87 chronological chapters. Publication awaits the release checks below, then the authorized merge/deploy.

Second half: Poverty Point, Hopewell earthworks, San Agustín, Tierradentro, Casarabe, Nan Madol, Budj Bim; Lapita, Gunditjmara; Austronesian languages; Australian wool/pastoralism and mining. Six established guide expansions remain a separate list. Consensus usage is 74/100 including status calls, with the full two-batch dossier already complete.
