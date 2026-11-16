# Coverage and source decisions · 15 November 2026

Base: deployed v0.10.0, commit `2618e2f`. The candidate has **1,809 records**, up from 1,336. The 473 additions are 41 city phases, 401 encounters, three northern records and 28 topic-only records. A record is not necessarily a unique city, household, vessel or population.

## Cities and geography

| Collection | Included scope | Limits and outstanding coverage |
| --- | --- | --- |
| Mesoamerican local phases | 35 phases at public INAH archaeological zones, including Tenayuca, Calixtlahuaca, Malinalco, Calakmul, Palenque, Monte Albán, Tzintzuntzan, Tulum and others | Selected local chronology, not every known Mexica or Maya town. Wider neighborhoods and individual structures require additional plans. Directory placeholder foundation dates were rejected. |
| Andean places | Ollantaytambo, Pikillacta, Huánuco Pampa construction and colonial occupation, Ingapirca and Tambo Viejo | Six selected records. Inka roads, administrative sites and earlier Andean cities remain incomplete. Most new anchors are explicitly approximate public localities. |
| Machu Picchu correction | Three existing records now use the archaeological-city reference −72.54465, −13.16493 | Mean of public 2014 draft DDC Cusco plan vertices 1–31, WGS84 UTM18S transformed to geographic coordinates. Vertex 32 was inconsistent with the other vertices/distances and excluded. This is a city-area anchor, not a building footprint or legal boundary. |
| Existing trade evidence | Templo Mayor obsidian now has the known public study-site locator; Lake Huron obsidian now has its verified associated calendar context | Neither change invents an exchange route. Huron's 9000–8800 cal BP dates associated occupation at recovery depth, not direct dating of stone. |

Public INAH/SIC locations were cross-checked with local chronology, rather than borrowing dates from a culture's entire lifespan. The SIC directory repeats `1000-01-01`; that is not archaeological dating. Ordinary place names and site coordinates are factual references. No INAH imagery, site plans, copied pages or adapted artwork are distributed.

Ollantaytambo is a qualified construction attestation, not a 1400–1532 occupation interval. The Cusco culture authority reports Sarmiento's attribution to Pachacútec (1438–1471) alongside Garcilaso's attribution to Wiracocha. The displayed reign window is explicitly contested and does not date the whole town's existence. The paper on colonial transformation remains separate supporting context.

## Encounters

The [NPS ABPP map](https://www.nps.gov/orgs/2287/battlefield-boundaries-map.htm) provides public study-area geometry. Its `SITE` identifiers are joined with the [CWSAC structured transcription](https://github.com/jrnold/acw_battle_data/blob/main/build/acw_battle_data/cwsac_battles.csv), retaining its BSD-3-Clause notice. Of 384 inventory rows, 376 are included as new points. Each point is the center of the study area's bounding box, not an exact combat position. The official modern battle page is also cited. Campaign dates on those pages are not substituted for actual battle dates.

Eight rows are held in `data/civil-war-coverage.json`:

- Sand Creek (CO001) and Bear River (ID001) already have violence records; their massacre interpretation is retained.
- Fort McAllister I (GA002), Round Mountain (OK001), Middle Boggy Depot (OK005) and Sewell's Point (VA001) lacked an unambiguous matching geometry in the downloaded inventory.
- White Oak Swamp (VA020A) and Glendale (VA020B) were not duplicated as separate points over their joined parent study-area record (VA020).

Twelve imported entries receive source-specific participant and event summaries. Lawrence, Fort Pillow, Saltville, Poison Spring, the Crater, Whitestone Hill and Killdeer Mountain retain documented civilian, prisoner or village violence instead of a generic military outcome. The seven Minnesota/North Dakota entries identify Dakota/Lakota participants; the inventory's US/CS table format is not evidence of Confederate membership. Casualty totals and individual death locations are not inferred. Source links and exact onset dates remain per record.

Twenty-five separately sourced encounters add Queenston Heights, Châteauguay, the Plains of Abraham, Sainte-Foy, Louisbourg, the Alamo, San Jacinto in Texas, Palo Alto, Resaca de la Palma, Chapultepec, Puebla, Chacabuco, Maipú, Junín, Ayacucho, Boyacá, Carabobo, Pichincha, Riachuelo, Guararapes, Vuelta de Obligado, Santa Rosa, Rivas, San Jacinto in Nicaragua and Vertières. Sources are linked per claim. Coverage of wars in Central/South America and Indigenous conflicts is still much less systematic than the Civil War inventory. No “all battles” claim is made.

## Northern and topic evidence

Kitsissut uses the primary paper's actual **4400–3938 cal BP** seabird date, including its Marine20/ΔR qualification; rounded press descriptions were not used as exact bounds. This is an occurrence/attestation window for a specimen, not a continuous habitation interval for the camp. Somerset Island and Tuktut Nogait are regional settlement references, not invented dwelling coordinates. The contextual northern story also reuses the existing Dorset, Thule and Alaska records.

Horse and maize records cite original scientific publications. The Patagonia 1650–1700 display window is an explicitly approximate early-phase summary, not a newly calculated confidence interval. Approximate regional anchors are labeled as such. The manuscript/archive language records identify whether a map point is a publication place, an encounter locality or a broad subject region. A book printed in Europe is not plotted in America as though its printing occurred there.

Selected language-family classification facts come from [Glottolog](https://glottolog.org/), consulted November 2026; see [the CC BY 4.0 license](https://github.com/glottolog/glottolog-cldf/blob/master/LICENSE). Family diagrams omit intermediate branches unless named. Dates of documentation are not dates of language origin. The Austronesian root point is a rounded central estimate from Gray, Drummond and Greenhill (2009), not an attestation or a dated migration itinerary. Sáliba of the Orinoco is distinguished from unrelated Austronesian Saliba.

The trade movie distinguishes provenance from direct commerce, named voyages from long-running systems, and forced transport from voluntary movement. Its coverage includes American and Pacific connections but is not a complete network at every date. Proposed social effects of exchange are explained without declaring a common religion or language merely from imported goods.

## Research and reuse

Two new Consensus **Deep** runs were completed for this revision. The standing cumulative budget is **31 calls of 100**, including the 25 previously recorded calls and six new submission/poll calls. Original sources were checked before adding claims. Full generated reports remain private and are not redistributed or treated as independent evidence.

Original prose and copyrightable curation remain CC BY-NC-SA 4.0; software remains PolyForm Noncommercial 1.0.0. Third-party notices remain in force and factual/public-domain material is not made exclusively noncommercial. Glottolog attribution and the CWSAC transcription's BSD notice are included. No license to an underlying paper, archive image or complete external database is implied by a citation. See `THIRD_PARTY.md` and `LICENSE.md`.
