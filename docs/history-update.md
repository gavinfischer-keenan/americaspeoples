# History atlas — version 0.7.0

The map keeps evidence gaps distinct from abandonment. After an occupation record ends, a muted ring remembers the earlier place; its detail explains that later occupation is unknown in that record. Five new regional habitation intervals provide positive continuity evidence where the sources support it. They do not supply population estimates or imply unchanged culture.

## The new collection

`data/history-records.json` adds 54 source-linked records to the unchanged 962-record corpus:

- 25 foundation or arrival milestones, including 22 colonial establishments/relocations and three Pacific arrival records. Spanish, Portuguese, English, French and Dutch foundations accumulate as dated places. Colors describe founding attribution; they do not map changing sovereignty or territorial boundaries. Panamá Viejo's abandonment in 1671 and the new city's foundation in 1673 remain separate.
- 16 migration and exchange records. Lapita dispersal, East Polynesian founding, several inter-island exchange networks, Manila–Acapulco, treasure-fleet connections and Chaco macaw movement appear only during explicit supported windows. Intervening gaps indicate no supported activity window, not universal isolation. The two galleon directions are separate records; schematic lines join endpoints, not actual sailing tracks. Arrow animation is qualitative, never measured traffic.
- Eight loss records: San Agustín, San Diego, Atocha, Santa Margarita, the 1715 and 1733 fleet disasters, Bounty and Pandora. They accumulate after their loss dates and disappear when the timeline reverses before them. A fleet disaster can represent multiple vessels, so the counter measures records, not hulls. Coincident wreck anchors have a shared selectable marker with a count.
- Five regional habitation intervals: Tonga, American Samoa, Aotearoa, Rapa Nui and Hawaiʻi Island. The 1934 endpoint clips sources describing modern continuation; 1860 and 1821 are evidence boundaries, not abandonment. Source access limitations remain explicit, including the Hawaiʻi indexed-excerpt limitation.

All coordinates are approximate editorial anchors. All records include claim-to-source mappings and access notes. Negative historical source years are converted to the app's astronomical convention (0 = 1 BCE). Broad arrival ranges remain possible before their latest bound. Existing AI-attributed colonial registry rows are preserved with their original cautions and excluded population columns.

## Interface and maintenance

The map is larger, empty details start collapsed, and selections open their explanation. Prominent history filters, earlier-place memory, chapter shortcuts, previous/next changes, Atlantic and world views, active route cues, and a compact mobile timeline help navigate the collection. Both Movie and all-period Explore remain available. Reduced-motion preferences stop route animation.

History metadata is validated and retained in the catalog, complete JSON export, evidence appendix, editor, and spreadsheet round trip. The optional `history_json` column accepts null to remove metadata; older workbooks remain compatible. Routes require mapped trade LineString events with explicit forward/both direction and bounded activity windows. Foundation history requires a located occurrence; wrecks require located loss occurrences. Neither accepts activity windows. A supported abandonment or relocation uses a separate `endYear`.

Run `npm run verify:release`. The build regenerates the complete published workbook and includes all 1,016 source reviews in the API and appendix. No new runtime dependencies are needed.

## Evidence still needed

These are selected historical examples, not a global route inventory or population reconstruction. Useful next research questions for Consensus are:

1. What directly dated archaeological evidence identifies the onset, continuation, interruption and resumption of exchange between each pair of Pacific island groups? Separate artifact manufacture, transport and deposition dates; identify curated/heirloom objects.
2. Which sources demonstrate regional habitation across changes in archaeological period or material culture? Separate regional persistence from abandonment or relocation of particular settlements.
3. Which colonial towns have dated historic plans, occupied-area estimates or resident censuses suitable for successive map stages? Distinguish municipal foundation, relocation, jurisdiction and occupied settlement footprint.
4. Which primary maritime archaeology inventories document each wreck's loss date, identification confidence and location uncertainty, including ships within the 1622, 1715 and 1733 disasters?

Do not turn a late artifact deposit into a fresh voyage automatically. Exact routes for proposed Polynesian–American contact and curated late Society Islands adzes were held out of the new active-route collection where evidence did not establish the required temporal/geographic relationship.
