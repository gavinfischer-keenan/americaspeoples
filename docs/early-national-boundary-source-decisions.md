# Early national and colonial boundary source decisions

Reviewed 2026-11-15. This layer supplies selected broad reconstructions, not a continuous authoritative political atlas.

## Delivered files and integration

- `data/early-national-boundaries.json`: a plain `PoliticalBoundary[]` containing **298 versions**: **224** in 1809–1885 and **74** before 1701.
- `data/early-national-boundary-sources.json`: a plain `BoundarySource[]` containing 17 geometry, methods, chronology and label sources.
- `scripts/prepare-early-national-boundaries.py`: deterministic preparation from the pinned, locally archived official source; no network calls and no changes to the HGIS or CShapes derivatives.
- `tests/early-national-boundaries.test.ts`: source, date, transition, geographic extent, D3 winding and label-anchor checks.

The stable ID prefix is `cliopatria-`. All records have `detail: "broad"`. Source rows retain their original index, name, year range, identifiers, geometry checksum and retained-component count in `sourceRow`; the existing boundary renderer can ignore this extra audit metadata.

Mexico transition checks also use [Palacio Nacional on the 1823 abdication](https://www.gob.mx/palacionacional/articulos/129906), [AGN on the 1867 imperial collapse](https://www.gob.mx/agn/articulos/agnrecuerda-el-15-de-mayo-la-toma-de-queretaro?idiom=es), and [INEHRM on centralism](https://www.inehrm.gob.mx/es/Constitucion1917/Centralismo). The final Chile and Riograndense checks use the [Chilean National Library](https://www.memoriachilena.gob.cl/602/w3-article-3671.html) and [Rio Grande do Sul state memorial](https://memorial.rs.gov.br/wp-content/uploads/tainacan-items/88/689/CAD018_-A-Paz-dos-Caramurus.pdf).

The layer deliberately has **no 1701–1808** or **1886 onward** records, allowing HGIS and CShapes to supply those periods independently. Annual dates use January 1 and December 31 as encoding conventions. They are not invented exact dates of a constitution, annexation, independence or abolition.

## Source and rights verification

The official repository's [data license](https://github.com/Seshat-Global-History-Databank/cliopatria/blob/5f433377139a6eeaeacbdc894b70f8805b72c8b5/LICENSE.md) explicitly applies **CC BY 4.0 to the data**. Reuse verification therefore does not rely merely on the research article's license. Source attribution, a license link and a description of changes are included in the source manifest and each boundary citation.

The prepared geometry derivative retains **CC BY 4.0**. The atlas's separate noncommercial license for owned content does not narrow the upstream rights to this source geometry. No source map image or historical atlas plate is copied. No endorsement by Seshat or the authors is implied.

| Provenance field | Pinned value |
|---|---|
| Repository | Seshat-Global-History-Databank/cliopatria |
| Commit | `5f433377139a6eeaeacbdc894b70f8805b72c8b5` |
| Archive | `cliopatria.geojson.zip` |
| Archive member | `cliopatria_polities_only_v021.geojson` |
| Archive bytes | 46,005,176 |
| SHA-256 | `e10a4e429fca708788ff9e7572a95fce801fae55852d217cffabc1c59cd4eed4` |
| Retrieval | 2026-11-15 |
| Source features | 13,797 |

Official [README](https://github.com/Seshat-Global-History-Databank/cliopatria/blob/5f433377139a6eeaeacbdc894b70f8805b72c8b5/README.md) documents EPSG:4326 geometry and inclusive `FromYear`–`ToYear` coverage. The primary [methods paper](https://doi.org/10.1038/s41597-025-04516-9), also available in [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11822181/), describes digitization from historical map images at irregular intervals. It explicitly discusses incomplete coverage and unencoded uncertainty/disputes. The nominal size/duration thresholds are not a claim that every smaller or shorter polity is absent: this archive does include several brief confederations.

## Geographic preparation

The derivative selects whole source polygon components. It does **not** cut them against present country borders, interpolate intermediate shapes, or add straight clipping edges.

A component must lie wholly within the American selection envelope (longitude -170 to -30, latitude -57 to 85) and intersect the Latin America/Caribbean focus envelope (longitude -125 to -30, latitude -57 to 34). A contiguous source component may consequently extend north of that focus envelope. European, Asian, African and Australasian components are excluded from this particular layer. The user permits the Pacific/Australia elsewhere, but it is outside this gap-filling task.

For Portuguese imperial rows only the South American mainland component is retained. Suspect unrelated Caribbean components in the source are excluded rather than accepted by empire-name association.

For Spanish source rows from 1824 onward, only whole components within the Cuba and Puerto Rico island-selection envelopes are retained. The source contains stale enclaves around Lima/Callao, La Paz, Chiloé, Río Negro and the Falklands. These components are rejected for every late Spanish version. Selection does not cut a component or invent a new boundary. The [Spanish Ministry of Culture](https://www.cultura.gob.es/en/cultura/archivos/difusion/mc-difusion/bicentenarios/contexto-historico/las-ultimas-posesiones.html) supports the surviving Cuba/Puerto Rico scope; Dominican annexation is withheld from this layer.

Coordinates are simplified at **0.02 degrees**, with topology preservation, rounded to five decimals and oriented clockwise on exterior rings for D3. This display tolerance does not quantify the much larger, geographically variable uncertainty of the historical reconstruction. No selected geometry required invalid-geometry repair in this run. Label anchors use an interior representative point of up to five largest retained components.

The six visually inspected snapshots (1550, 1700, 1810, 1825, 1840 and 1885) showed the intended American components and expected spatial change. Modern reference coastlines do not coincide exactly with the source's generalized coastlines. Neither a shoreline mismatch nor a blank area proves the presence or absence of settlement.

## Selection, naming and omitted transitions

| Case | Published treatment | Reason |
|---|---|---|
| Gran Colombia | Source phases 1822–1829 only | Omit the 1830–1833 source phase across the breakup; do not extend Gran Colombia to 1833 or invent successor geometry |
| Central American Federation | Source phases 1824–1837 | Omit 1838–1839 because constituent secessions began in 1838; 1837 is a coverage cutoff, not its legal dissolution date |
| Peru–Bolivian Confederation | Source phase restricted to 1836–1838 | Omit the transition year 1839; no exact dissolution day is encoded from an annual polygon |
| Argentina | Generic Argentina label | Source `Argentine Confederation` continues long after the Confederation's 1861 dissolution; geometry is retained as a broad Argentine-polity reconstruction, with original label preserved |
| Colombia, 1866–1885 | United States of Colombia | The source's generic Republic of Colombia label would obscure the 1863 constitutional title; the later Republic constitution is 1886 |
| Haiti | Generic Haiti; selected phases from 1822 onward | Do not call all regimes an empire. Omit the inadequately differentiated 1809–1821 row and the 1844–1845 overrun past Dominican independence |
| Spanish possessions, all source phases from 1824 | Cuba/Puerto Rico only, explicitly labeled Spanish Caribbean possessions | Remove stale mainland/southern components and withhold all Dominican components; the original broad source name does not justify continued colonial control of independent mainland places |
| Portuguese possessions, source 1820–1823 | Retain 1820–1821 only | Avoid projecting an undifferentiated Portuguese colonial polygon over the independent Empire of Brazil |
| Portuguese source 1815–1819 | Omitted | Coarse Portuguese/French Guiana attribution overlaps the restoration period; no replacement geometry invented |
| Dutch source `Netherlands Antilles` | Dutch American colonial possessions, 1820–1885 | Source includes mainland Suriname as well as islands. Generic colonial wording avoids an anachronistic constitutional unit |
| French imperial/regnal names | French American colonial possessions | The source's Bourbon label continues past the Restoration; the generic possession label does not assert a particular metropolitan constitution |
| Federal/centralist Mexican source polygons | Distinct attributed territories retained; omit 1835 federal transition and 1846–1847 centralist overrun | Federalist source areas during centralism are territorial reconstructions, not an uninterrupted national federal constitution |
| First and Second Mexican Empires | Omit terminal source years 1823 and 1867 | Both regimes ended before the year-end map date; no replacement geometry is invented |
| Riograndense Republic | Omit terminal 1845 source year | Peace in 1845 does not support an independent republic at December 31 |
| Chile's early source phase | 1812–1813, with 1814 omitted | Royalist victory at Rancagua in October 1814 began the reconquest |
| Cundinamarca and the 1814 Venezuelan republican source phase | Omitted | Single-year wartime transitions need more precise chronology than this source supplies |
| Guayaquil Junta, Los Altos, Republic of Baja California, Republic of the Río Grande | Omitted | Source labels/periods require individual chronology review; counts or visual completeness do not justify retaining suspect phases |
| Imperial aggregate and member rows | One curated aggregate source series selected | Avoid duplicate fills of the same colonial possession under both aggregate and component labels |
| Earlier colonies | Selected Castilian, Spanish and Portuguese American components | Earliest retained Castilian snapshot begins in 1497, which is a dataset coverage date rather than a founding date; French/Dutch/English pre-1701 series were not added without further local-phase review |

Chronology checks use the [Banco de la República Gran Colombia account](https://enciclopedia.banrepcultural.org/El_proyecto_grancolombiano), [Office of the Historian federation account](https://history.state.gov/countries/central-american-federation), [Peruvian congressional constitutional register](https://leyes.congreso.gob.pe/constituciones.aspx), [Argentine historical museum](https://museosarmiento.cultura.gob.ar/noticia/disolucion-de-la-confederacion-argentina/), [Colombian constitutional bibliography](https://enciclopedia.banrepcultural.org/index.php/Constituciones_de_Colombia), [Brazilian National Archive chronology](https://mapa.an.gov.br/index.php/assuntos/79-producao/80-cronologia/509-periodo-imperial-1822-a-1889), [Dominican diplomatic-history account](https://history.state.gov/countries/dominican-republic), and [Library of Congress Haiti profile](https://tile.loc.gov/storage-services/master/frd/copr/Haiti.pdf). They constrain labels and selected periods; they do not supply replacement boundary polygons.

## Coverage and omissions

The 1809–1885 subset contains Mexico's changing source polities, the Central American federation and selected successor republics, Gran Colombia and successor source polities, Peru, Bolivia, the Peru–Bolivian confederation, Chile, Paraguay, Uruguay, the Río de la Plata/Argentine series, the State of Buenos Aires, the Riograndense Republic, Brazil, the Miskitu kingdom, and selected Caribbean/Guiana colonial or national components.

There are 14 active versions at 1825, 18 at 1837, 23 at 1840, 22 at 1850 and 22 at 1885. These are layer-version counts, not counts of independent states or all communities.

Known gaps include:

- Gran Colombia's early 1819–1821 formation and successor geometry during 1830–1833.
- Constituent Central American boundaries during the 1838–1839 dissolution; this source resumes separate successor records in 1840.
- Peru/Bolivia's 1839 transition, omitted rather than filled by a guessed division.
- Portuguese Brazil for 1815–1819; Spanish mainland remnants and Dominican annexation are not reconstructed from the stale late-imperial source components.
- Mexico's imperial terminal transitions in 1823 and 1867, centralist transition in 1846, and the Riograndense Republic's 1845 ending. They are omitted rather than represented as continuing through the year-end display.
- Early Guiana occupation/control differences, independently governed Indigenous and Maroon territories, small colonial dependencies, and many short-lived rebel governments.
- Pre-1701 French, Dutch and English colonial details and most precolonial political geometries.
- Disputed frontiers and degrees of effective authority: source polygons cannot establish exclusive occupation or erase Indigenous sovereignty.
- No national polygon is treated as a population distribution. A source boundary's beginning/end is not the founding/disappearance of a people.

The selected source cannot make 1809–1885 complete. Missing geometry is left missing.

## Historical-name recommendations for the separate CShapes layer

No CShapes record is edited by this task.

| Current source coding label | Recommended 1886–1934 display label | Source support |
|---|---|---|
| Guyana | British Guiana (British colony) | [National Archives of Guyana](https://nationalarchives.gov.gy/other-collections/) and [Dutch National Archives](https://nationaalarchief.nl/onderzoeken/zoekhulpen/overzicht-van-archieven-over-guyana-guiana) describe the 1831 union of Berbice, Demerara and Essequibo |
| Surinam | Suriname (Dutch colony) | [Nationaal Archief colonial records](https://www.nationaalarchief.nl/onderzoeken/zoekhulpen/koloniale-geschiedenis) distinguish Suriname and the Antilles within West Indies records |
| Belize | British Honduras (British colony) | [UK National Archives country guide](https://www.nationalarchives.gov.uk/help-with-your-research/research-guides/other-countries/) identifies British Honduras and the later 1973 renaming |

Use display aliases while retaining CShapes's original geographic coding label and dependency status in the source detail. These naming sources do not adjudicate disputed boundary lines.

## Reproduction and checks

The pinned archive, README, license and download metadata are retained at `../pacific-research/cliopatria/`. The preparation script verifies the archive SHA-256 before reading it.

```text
python scripts/prepare-early-national-boundaries.py --source-dir ../pacific-research/cliopatria --python-libs ../pacific-research/python-libs
node --import tsx --test tests/early-national-boundaries.test.ts
```

The script also writes an omitted-period audit beside the private source archive. Four standalone tests passed, including D3 area/containment checks for every boundary and every label anchor, plus explicit exclusion of all stale late-Spanish mainland/southern enclaves. No same-display-name records overlap in the delivered set. Source HGIS/CShapes files, shared application code and their preparation scripts remain unchanged.
