# Atlantic connections: source decisions

Reviewed 2026-11-15. Added **16 records** supported by **12 distinct primary or institutional source URLs**: seven forced-transport contexts involving enslaved people, six Acadian diaspora legs, and three commercial connections. Two Acadian legs are forced colonial assignments; four are subsequent resettlement episodes. The existing Boston deportation event is linked rather than duplicated.

The completed `atlantic-consensus-response.json` was used for leads and left unchanged. No new Consensus calls were made, no report prose was copied, and no shared application code was edited.

## Classification and geometry

All seven enslaved-person records use `type: event` and `overlay.kind: forced-removal`. None uses voluntary-migration history or a commodity-trade overlay. The direction represents coercive movement of people, not circulation of goods. African embarkation regions do not establish every person's birthplace, language or ethnicity.

Every connector has two approximate endpoints and a numeric geographic uncertainty. These are schematic relationships, not reconstructed ocean tracks. Mainland Europe and Asia appear only as generalized regional connection edges. Named ports remain in evidence text when the source identifies them, but no detailed foreign-city history or precise landing coordinates are invented.

Acadian expulsion, refugee resettlement, and coercive Spanish assignments are different categories. A later self-directed journey does not make the initial displacement voluntary. The Cajun context explicitly includes interaction with Indigenous communities, free people of color, enslaved Africans and other immigrants, based on the [National Park Service synthesis](https://www.nps.gov/jela/learn/historyculture/from-acadian-to-cajun.htm).

## Added records

| Records | Evidence and decision |
|---|---|
| `ax-luanda-virginia-1619` | [Historic Jamestowne](https://historicjamestowne.org/history/the-first-africans/) establishes the staged relationship. The original vessel was heading elsewhere; the connector is not a direct ship itinerary. |
| `ax-henrietta-biafra-jamaica` | The [museum-report-derived artifact record](https://slaveryimages.org/database/image-result.php?objectid=1057) identifies the forced passage. Completed arrival is separated from the vessel's subsequent loss. |
| `ax-clotilda-ouidah-mobile` | The [Alabama Historical Commission's archaeological report](https://ahc.alabama.gov/press/final_1ba704%20report_search_redacted.pdf) supports the historical voyage. Sensitive or false-precision wreck coordinates are unnecessary for this regional movement. |
| `ax-wanderer-congo-jekyll` | [Jekyll Island Authority chronology](https://www.jekyllisland.com/magazine/the-water-and-the-blood/) supports departure and arrival. The record avoids projecting one birthplace onto all captives. |
| `ax-alexandria-new-orleans`, `ax-alexandria-natchez` | The [National Park Service](https://www.nps.gov/places/franklin-and-armfield-office.htm) identifies the partnership and both destination markets. The firm's lifespan does not terminate the wider domestic slave trade. |
| `ax-sierra-leone-havana-1839` | [National Archives documentation](https://www.archives.gov/files/citizen-archivist/images/11-29-2018-amistad.pdf) separates the Atlantic abduction/transport from later resistance and detention. |
| `ax-acadian-halifax-louisiana`, `ax-acadian-attakapas` | Two onward resettlement legs, not a new rendering of the original expulsion. |
| `ax-acadian-st-gabriel`, `ax-acadian-vidalia` | Explicitly classified as forced colonial assignments. |
| `ax-acadian-france-louisiana`, `ax-acadian-lafourche` | Assisted departure and subsequent destination selection remain distinct. |
| `ax-black-ball-packets` | The [South Street Seaport Museum](https://southstreetseaportmuseum.org/packages-papers-and-packets/) distinguishes the announcement, scheduled operation and named line's closure. Both directions are documented for this service. |
| `ax-pacific-mail-china` | [Smithsonian's service account](https://americanhistory.si.edu/explore/exhibitions/on-the-water/online/ocean-crossings/liners-america/pacific-crossings) and [the NPS historical study, p. 39](https://npshistory.com/publications/goga/chinese-am.pdf) support the represented company phase. Cessation is left unknown rather than treating an employment-period endpoint as proof all service stopped. |
| `ax-fujian-manila-1570s` | [Iaccarino's primary study](https://doi.org/10.1163/24684791-01601005) supports repeated connections in the stated decade. It joins the existing Manila-to-Americas network, and its terminal decade is not an asserted end to contact. |

The six Acadian leg claims are intentionally concise and share narrow paragraph locators in [Brasseaux's archival synthesis](https://acadianmemorial.org/acadian-immigration-into-south-louisiana-1764-1785/). A single narrative is not converted into a new, equally extensive derivative account. Details absent from these selected legs remain in the source rather than becoming unsourced map activity.

## Existing records and retained gaps

- `acadian-deportation-boston1755` is an explicit related record. Its presence is checked by the focused tests. No proposed change is made to its original dated evidence.
- Existing Manila galleon and Spanish treasure-fleet routes are not duplicated. The Chinese coastal edge is additional context for that established system.
- Broad regional slave-trade study coverage, legal authorization dates and database screening ranges were not converted into continuously active routes. Further South American and intra-Caribbean corridors need extraction of dated, route-specific observations.
- Sao Jose's intended Brazilian destination was not drawn as a completed arrival. This batch does not duplicate the wreck as a successful Brazil-bound forced passage.
- The 1934 map limit is respected; no route is extended to it solely because the wider network later survived. Canadian Pacific and additional steamship networks remain opportunities for a separately verified follow-up.
- Geographic precision is limited to explicit regional approximations; the selected evidence does not reconstruct the full sequence of every forced march, capture site or onward sale.

## Validation

`node --import tsx --test tests/atlantic-expansion.test.ts` passes four tests. They cover schema/source completeness, the linked existing Acadian event, forced-transport classification, Acadian agency versus imposed settlement, geometry, date limits, and named commercial operation boundaries. All 16 IDs were absent from the pre-integration compiled dataset. Whitespace validation is clean.
