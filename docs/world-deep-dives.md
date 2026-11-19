# World deep dives

## Four destinations in one atlas

The combined release brings illustrated reading guides to Africa & human origins, Europe & Mediterranean, and Asia & Pacific. Americas remains the playable historical atlas. Regional destinations use the shared application, navigation, site-guide renderer, and release pipeline from one repository. Their overview basemaps mark the regional movie maps as coming soon. Each illustrated guide has its own source notes and, where appropriate, a locality map.

The guide set comprises 40 regional deep dives and the shared `world-everyday-writing` collection guide, for 41 unique pages. Pages can appear in several atlas menus. The regional guides cover the Congo and early hominin evidence, Egyptian writing and the Rosetta Stone, Lascaux, Roman cities and frontiers, Stonehenge and Scotland’s monuments, and histories across Asian archaeology, writing, and religious and philosophical traditions. Existing Americas guides supply context for the Americas writing examples.

## Everyday writing

The collection pairs 87 historical originals with published English readings. It includes 25 Mesopotamian, 25 Greek, 12 Egyptian, 12 Chinese and Latin, and 13 Americas examples. The Americas selection combines pre-contact Classic Maya inscriptions with colonial Nahuatl, Valley Zapotec, and Quechua documents. Readers can search and filter by language, kind of text, and atlas. [Writing corpus and item-level sources](https://github.com/gavinfischer-keenan/americaspeoples/tree/refs/tags/v0.30.0/data/writing-examples)

Originals appear as photographs of the surviving writing or as original-script text in a credited edition. The cards identify the object or manuscript, language, script, dating, geographical context, and the translator and edition. A full text or excerpt label records the scope of the English reading. Brackets and witness notes preserve ambiguities in readings or the condition of the original. Image records carry their own reuse terms, credits, dimensions, and SHA-256. The two Noto typefaces display Coptic and cuneiform locally. [Asset provenance](https://github.com/gavinfischer-keenan/americaspeoples/blob/refs/tags/v0.30.0/data/world-guide-context-sources.json) · [Third-party notices](../THIRD_PARTY.md)

## Shared voyages

The regional guides reference the existing itinerary catalogue by canonical ID and stop index. They reuse 251 dated stops across 80 distinct itineraries, presented through 114 regional associations.

| Guide | Itineraries in the regional collection |
| --- | ---: |
| Europe & Mediterranean | 58 |
| Africa & human origins | 15 |
| Asia & Pacific | 41 |

A voyage can appear in several guides. Validation matches each linked anchor’s name, arrival, and departure to the canonical stop. A guide opens the existing shared voyage detail, and the voyage can link back to other regional guides. The canonical record supplies the route notes, uncertainty, and any gaps in reconstruction. [Regional associations](https://github.com/gavinfischer-keenan/americaspeoples/blob/refs/tags/v0.30.0/data/atlas-voyage-links.json) · [Canonical itineraries and sources](https://github.com/gavinfischer-keenan/americaspeoples/blob/refs/tags/v0.30.0/data/voyages.json)

## Map context and a future boundary model

Guide maps locate specific evidence with modern coastlines, generalized rivers, and modern elevation where available. The point and its source describe the precision of the location. A map point identifies evidence in the surrounding landscape. The maps treat the physical basemap as present-day reference and the dated archaeological or historical evidence as a separate layer. [River and font provenance](https://github.com/gavinfischer-keenan/americaspeoples/blob/refs/tags/v0.30.0/data/world-guide-context-sources.json) · [Guide terrain provenance](https://github.com/gavinfischer-keenan/americaspeoples/blob/refs/tags/v0.30.0/data/guide-terrain/sources.json)

A future historical boundary layer can use independently sourced, dated geometries attached to stable entities and a defined relationship, such as administration, a sovereignty claim, tributary ties, or military presence. A geometry should carry its own validity window, spatial precision, evidence references, and uncertainty. Competing claims and overlapping kinds of authority can be displayed together. Approximate frontiers can use broad zones or dashed limits, with alternative outlines where sources disagree. Changes should follow the dated evidence and distinguish a treaty claim from the timing of effective control. Unknown dates or extents remain explicit. The combined release stops at mapped guide evidence and links to the existing itineraries. [Atlas ownership and future data model](multi-atlas-plan.md)
