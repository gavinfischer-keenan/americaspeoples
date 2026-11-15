# Historical reservation geometry decisions

Reviewed 15 November 2026. These are original reconstructions from historical legal descriptions, not modern reservation polygons and not Indian land-cession polygons. Reservation creation is distinct from Indigenous presence, homeland, population distribution, occupation and the physical movement of people.

`data/reservation-boundaries.json` is an array of four `PoliticalBoundary` rows, all `kind: "reservation"`. `data/reservation-boundary-sources.json` is an array of seven `BoundarySource` records. The files match `src/boundaries.ts`; all source references resolve. Rings are closed and clockwise for the existing D3 display. Dates are inclusive; the annual map selects the version valid on 31 December.

## Navajo: three successive footprints

The Navajo Nation Judicial Branch publishes the [1868 treaty](https://courts.navajo-nsn.gov/Treaty1868.htm). Article II supplies a northern parallel and three named or approximate limits. It explicitly requires the Canyon de Chelly outlet and canyon to be included. A rectangle that mechanically uses 109°30′W would ignore that proviso.

The display coordinates are intentionally coarse:

| Parameter | Display value | Meaning |
| --- | --- | --- |
| Original north | 37°N | Explicit treaty parallel |
| Original south | 35.75°N | Rounded Fort Defiance latitude, not a recovered 1868 survey |
| Original east | 108.55°W | Rounded Fort Lyon / Bear Spring geographic reference |
| Original west | 109.55°W | Coarse interpretation of the approximate meridian plus Canyon de Chelly outlet proviso; not an exact legal meridian |
| 1878 added west | 110°W | Explicit executive-order meridian |
| 1878 added south | 36°N | Explicit executive-order parallel |
| 1880 added east | 108.28°W | Approximately 15 miles east of the former eastern line at this latitude |
| 1880 added south | 35.66°N | Approximately 6 miles below the former southern line |
| 1880 river edge | Chord from 108.55°W, 36.78°N to 108.28°W, 36.73°N | Regional San Juan River approximation; not a traced historic channel |

The original rectangle is combined with the [1878 addition](https://www.presidency.ucsb.edu/documents/executive-order-defining-boundaries-for-navajo-indians), then with the [1880 addition](https://treaties.okstate.edu/treaties/executive-order-navajo-reserve-1880). Each row is the combined reserved footprint, rather than the added tract alone. Every vertex is retained directly in the small JSON file, so the reconstruction is reproducible without a proprietary input or a hidden digitization process. The descriptions above and the polygon vertices are the full derivation; there is no GIS archive to download.

The first displayed interval begins on **12 August 1868**, the proclamation date. Treaty signing on 1 June, ratification advice on 25 July, release from Bosque Redondo and the journey home are separate events. This legal date must not be substituted for an actual return date.

The transitions are 29 October 1878 and 6 January 1880. The third outline ends on 16 May 1884, immediately before [documented changes](https://www.presidency.ucsb.edu/documents/executive-order-added-navajo-lands). No unchanged 1880 outline is stretched to 1934. The resulting later coverage gap is explicit and means **unmapped later versions**, not abolition, abandonment or absence of Navajo people. Later additions, exclusions and restorations need separate reconstruction from their cadastral and river descriptions.

The Navajo geometry has kilometre-scale uncertainty and should remain visibly labeled approximate. It is appropriate for an overview of historical enlargement, not a parcel, jurisdiction, land-rights or modern boundary determination.

## Hopi (Moqui): the 1882 order rectangle

The [16 December 1882 order](https://www.presidency.ucsb.edu/documents/executive-order-establishment-moqui-hopi-reserve) explicitly describes 110°–111°W and 35°30′–36°30′N. The western limit is **111°W**, not 111°30′W. These coordinate facts permit a direct rectangle without substituting the current Hopi reservation or the geometry of later Hopi–Navajo partitions.

The order reserved the area for the Moqui (Hopi) and other Indians whom the Secretary of the Interior might settle there. Consequently the row does not assert exclusive Hopi residence, erase Navajo residents or apply later judicial decisions retroactively. The [1934 statute](https://www.govinfo.gov/content/pkg/STATUTE-48/pdf/STATUTE-48-Pg960.pdf), p. 961, expressly preserves the existing status of the 1882 reservation. The row therefore extends to 31 December 1934, the atlas cutoff, with no termination claim.

## Rights and deferred examples

The underlying treaties, executive orders and statutes are public-domain federal documents. The Navajo and Hopi geometry is newly drawn from their geographic facts; no third-party reservation GIS was copied. Source notes identify the host institutions and preserve attribution. Modern named-place references help locate historical terms but do not convert modern boundaries into historical ones.

Siletz's public tribal ArcGIS service was inspected as a lead, but a blank license field was not treated as permission to redistribute its geometry. The 1855 order incorporates a plat, and the original Coast Reservation, the later northern Siletz tract, the Alsea tract and the post-allotment land base must not be conflated. A useful public-domain next source is [Senate Miscellaneous Document 65, 43rd Congress, first session (1874)](https://www.govinfo.gov/content/pkg/SERIALSET-01584_00_00-066-0065-0000/pdf/SERIALSET-01584_00_00-066-0065-0000.pdf), p. 2, which separately describes the existing Alsea and Siletz tracts after the 1865 reduction. The later [1892 agreement](https://treaties.okstate.edu/treaties/agreement-with-the-indians-of-the-siletz-reservation-1892-22362) expressly requires congressional ratification; its signing date must not automatically become a reduction or public-opening date. No Siletz polygon is delivered until those distinct geometries and dates can be reconciled.

Nez Perce treaty geography also remains deferred. The treaty-reserved land must be reconstructed directly; an ancestral-homeland map, a cession map or a modern reservation outline is not a substitute.

## Checks

`tests/reservation-boundaries.test.ts` checks the source registry, complete rings, D3 orientation, inclusive chronological handoffs, increasing Navajo footprint, the treaty outlet proviso, the Hopi coordinates and shared-use wording, and the explicit 1884/1934 coverage limits.
