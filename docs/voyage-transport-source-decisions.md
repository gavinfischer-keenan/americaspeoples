# Voyage and transport source decisions

Reviewed 15 November 2026. The research reports supplied leads; the catalog and claims cite the underlying primary texts, archives, institutional histories or research publications.

## Delivered data

- `data/voyages.json`: 10 itineraries, 69 dated anchors, and a shared source catalog.
- `data/voyage-expansion-records.json`: 54 full evidence records, including separate Balboa, Norse and Lewis–Clark return evidence.
- `data/transport-expansion-records.json`: 21 full transport records.
- `data/rail-network.json`: 1,755 display groups derived from 76,849 historical source features, approximately 4.29 MB.

Both expansion files use `{ "records": [...] }`. The voyage file uses `{ "voyages": [...], "sources": [...] }`; all `sourceIds` and `recordIds` resolve. Visit records use ordinary `event` records: an explorer visit is not silently classified as a settlement or continuing occupation.

## Dated anchors are not daily tracks

Coordinates are approximate named-place references. Even a precisely dated observation does not establish a precisely surveyed coordinate. A held interval is only used for a documented regional port or camp stay. Boats, local soundings and movements inside the named bay are not reconstructed. Arrival and departure on the same day means a dated observation waypoint unless the note explicitly describes departure or return; it does not assert that an unknown port visit lasted one day.

The line and moving marker between anchors are schematic interpolation. They can cross land or omit detours and cannot be used for navigation or to establish intermediate presence. The catalog names incomplete phases explicitly. An omitted route does not imply that it did not happen. European and Asian departure coordinates are permitted as context; they do not create detailed collections of European settlements.

Dates retain the convention used by the cited historical text. Early modern nautical days and Russian Old Style dates are not silently converted to modern Gregorian local civil dates. Exact-looking date strings retain this limitation. FitzRoy's calendar adjustment at Tahiti is described in the relevant stop.

| Itinerary | Scope and important decisions |
| --- | --- |
| Beagle, 1831–1836 | Ship movements checked in [FitzRoy, volume II](https://darwin-online.org.uk/content/contentblock?itemID=F10.2&basepage=1&viewtype=text). Darwin's independent inland journeys are excluded. The ship arrived Valparaíso on **22 July 1834** according to FitzRoy p. 361; a Darwin itinerary date must not replace it. The ship left the Galápagos after passing Culpepper on **20 October 1835**, not Darwin's last shore visit on 17 October. Callao combines the published itinerary with FitzRoy's explicit arrival date. Repeated South American cruises and several Atlantic return stops remain omitted. |
| Magellan–Elcano, 1519–1522 | [Participant accounts and Albo's log](https://www.gutenberg.org/ebooks/74723), with the Spanish Ministry of Culture's Victoria chronology. Mactan marks Magellan's death; later positions belong to survivors and then Victoria under Elcano. The track does not place Magellan on the return to Spain. Fleet separations are explained. |
| Lewis and Clark, 1804–1806 | [UNL's scholarly primary-journal edition](https://lewisandclarkjournals.unl.edu/) and institutional camp histories. Outward river travel, the horse/land crossing and resumed canoe travel are distinguished. The animation ends with the Fort Clatsop winter and departure. The 1806 return to St. Louis is a separate dated record because the returning parties took different routes. Small portages, including Great Falls, remain unresolved within schematic river legs. |
| Columbus, 1492–1493 | [Las Casas abstract in Markham's translation](https://ems.kcl.ac.uk/content/etext/e020.html). Guanahaní is an archipelago-scale reference, not an adjudicated exact island. Caribbean harbor identifications and the Santa María wreck location are approximate. Return legs represent surviving vessels, not the wrecked ship. |
| Cabrillo–Ferrelo, 1542–1543 | Current [NPS history](https://www.nps.gov/cabr/learn/historyculture/juan-rodriguez-cabrillo.htm) and the [1959 government brochure](https://npshistory.com/publications/cabr/brochures/1959.pdf). San Diego dates, the Channel Islands regional anchors, Cedros reunion and Navidad return are supported. The northern extreme and Cabrillo's burial island are not fixed. Ferrelo commands after Cabrillo's death. The brochure's dated colonial discovery language is not adopted. |
| Cook, 1768–1770 | [Cook's manuscript transcription](https://paulturnbull.org/project/southseas/journals/cook/17680826.html), NLA context and NMA encounter history. Selected outward anchors stop at the Endeavour River departure. The subsequent Batavia and homeward legs remain outside this iteration. Māori and Pacific occupation, Tupaia and the violent Botany Bay encounter are not erased by a European voyage line. |
| Tasman, 1642–1643 | [Te Ara chronology](https://teara.govt.nz/en/1966/tasman-abel-janszoon) and [NZ History's contact account](https://nzhistory.govt.nz/page/first-contact-between-maori-and-europeans). Only the New Zealand coastal phase is animated. Three Kings observations are not landings. The 1966 article is explicitly unupdated; its Eurocentric terminology is not adopted. |
| Drake, 1577–1579 | Library of Congress primary-account collection and [NPS harbor assessment](https://www.nps.gov/pore/learn/historyculture/people_europeanexplorers_francisdrake.htm). Outward selection ends at California. The Point Reyes coordinate is regional because harbor identification remains contested. There is no invented return across the Pacific. |
| Vancouver, 1792 | [USGS observation chronology](https://www.usgs.gov/volcanoes/mount-st.-helens/science/early-settlement-documentation-mount-st-helens) and Margarita James's [community heritage reflection](https://ojs.library.ubc.ca/index.php/bcstudies/article/download/191653/189030/220987), p. 148. Three dated observations/encounters, not the full 1791–1795 survey or a continuous Discovery anchorage sequence. |
| Bering, 1741 | Frederica de Laguna, [Under Mount Saint Elias, part one](https://repository.si.edu/items/1e0e2b3d-a95d-4603-83d1-953f8c8caa42), p. 108. Two outbound anchors only. Bering's ship is St. Peter, distinct from Chirikov's St. Paul. Old Style dates are retained. The wreck and return are omitted. |

Balboa's overland crossing is retained as **1513 year-level evidence**. The [Costa Rican National Archives catalog](https://www.archivonacional.go.cr/web/educativo/catalogo_pacifico.pdf), especially p. 90, discusses uncertainty in the summit and September chronology. No arbitrary 1 January or precise hill-to-shore daily itinerary is supplied.

The [1021 L'Anse aux Meadows study](https://www.nature.com/articles/s41586-021-03972-8) dates cutting of three wood samples. It does not date a departure from Greenland, first landfall, the length of settlement or a named saga voyager. Consequently there is no invented Norse animated log.

## Historical rail network

The source is Jeremy Atack's [Vanderbilt historical U.S. rail dataset](https://my.vanderbilt.edu/jeremyatack/data-downloads/), archive `RR1826-1911Modified103123.zip`, revised 31 October 2023 and distributed from Vanderbilt's 2024 upload directory. The embedded XML permits free use when the source is properly acknowledged. The generated file retains attribution and does not relicense the original dataset as project-owned data.

The [technical documentation](https://cdn.vanderbilt.edu/t2-my/my-prd/wp-content/uploads/sites/133/2021/02/Creating-Historical-Transportation-Shapefiles-RevisedFeb2021.pdf), especially pp. 39–42, explains the date semantics. `ExactDate`, where nonzero, is the sourced opening year. Otherwise `InOpBy` is an attestation by a particular year, usually a historical map's date, **not** an exact opening year. The layer accumulates built/attested infrastructure; it does not say that every accumulated line remained in operation or survived physically.

The preparation script:

1. Reads the archive's historical shapefile and projection.
2. Keeps its historical date fields, railroad names and state attribution.
3. Groups only features with identical chosen year, exact/attested status, railroad name and state.
4. Joins connected lines, simplifies in the source Albers projection with a 250-metre tolerance, converts to longitude/latitude and rounds display coordinates to five decimal places.
5. Supplies no operation-end field and no interpolated construction progress.

Four features with 1912/1916 attestations in the archive are retained and disclosed. The historical reconstruction itself uses contemporary historical maps, historical USGS sheets and surviving alignments; it is not an unfiltered present-day railway network. Railroad names chiefly identify earlier operators, not a complete corporate history. Lower-48 coverage is incomplete, particularly sidings and yards. There is no verified comprehensive 1912–1934 extension in this dataset.

Reproduction requires Python with `pyshp`, `shapely` and `pyproj`, then:

```text
python scripts/prepare-rail-network.py PATH_TO_UNZIPPED_RR1826-1911Modified103123_ARCHIVE
```

## Regional transport and service boundaries

The regional records complement the detailed U.S. network with schematic, exactly two-endpoint connections. They cover Hawaiʻi, Alaska, Mexico, Chile, Argentina, Brazil, Jamaica, Cuba, Panama, Peru, Ecuador and Costa Rica. The records are selective evidence, not complete national networks.

- Opening/completion milestones are occurrences. They do not create a continuous service interval to 1934.
- The Pony Express interval ends in 1861. [NPS distinguishes official termination on 26 October from the last letters arriving in November](https://www.nps.gov/poex/learn/historyculture/index.htm).
- The [Copper River and Northwestern Railway](https://www.nps.gov/articles/000/copper-river-and-northwestern-railway.htm) has explicit 1911–1938 operation evidence. Its 1934 display end is the atlas cutoff, not an asserted closure.
- The Central Pacific and Union Pacific records mark completion of their connection in 1869. Earlier component openings are carried by Atack's historical segments; proposed whole routes are not displayed as built.
- The Hawaiʻi extension to Kahuku ran around the western and northern coast. Its straight schematic line must not be read as an inland railway.
- The initial Recife–São Francisco railway is limited to Recife–Cabo; its company name does not prove that it had reached the São Francisco River.
- Cuba's first segment is supported by the [PARES archival file](https://pares.cultura.gob.es/ParesBusquedas20/catalogo/description/1333846), including tariffs and subsequent traffic/accident evidence; the full Güines extension is not backdated.
- Ecuador's coastal rail endpoint is Durán, not an invented railway bridge from Guayaquil.
- The Costa Rican source separates 1890 completion from the following year's service inauguration. Peru is kept at year resolution where exact ceremonial and operating dates differ.

## Validation

`tests/voyage-data.test.ts` validates all new full records, catalog source and record references, date ordering, port holds, mixed travel modes, leadership changes, year-only evidence, transport interval semantics and every rail coordinate. It deliberately checks historical boundaries rather than merely checking that the JSON parses. The implementation does not run a build or alter shared generated artifacts.
