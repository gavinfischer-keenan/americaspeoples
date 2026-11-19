# Human-family foundation research notes

Checked 18 November 2026. This is a selected broad framework, not an exhaustive inventory of fossil specimens, hominin names or proposed genealogies.

`data/world/ancestors.json` contains 45 references, 28 taxon/grouping entries, 37 locality observations and five schematic links. Two grouping entries deliberately retain unresolved genus-level identifications. African sapiens anchors such as Jebel Irhoud and Omo are supplied by the companion dispersal shard; the Oase observation here concerns recent Neanderthal ancestry.

All catalogue observation, wave and source identifiers use `family-`; taxon identifiers are shared plain kebab names. Only already-existing world guide IDs are linked. The original origins guide content is preserved; the human-family guide gains seven genetics sections and eleven bibliography URLs.

## Time and geographic meaning

- Numeric years use `1950 - age in years` only for the common playback scale. Geological ages retain their published Ma/ka labels and dating meaning. The conversion does not turn rounded ages into precise calendar dates.
- Xiahe and Harbin plot minimum-age boundaries, clearly identified as such. The fossils may be older.
- The Sterkfontein Member 4 interval is an envelope of competing age interpretations, not a confidence interval or occupation duration. It does not reuse Little Foot's date as the Member 4 date.
- Dmanisi fossil ages are separated from older local archaeological occupations. A time sequence of sites does not prove direct descent or a route.
- The Denisovan admixture wave connects two model point estimates from Jacobs et al. (2019), approximately 45.7 and 29.8 ka. Its limits retain the much wider reported uncertainty intervals and dependence on recombination assumptions. This is not a date for the final Denisovan or proof of a particular meeting place.
- Points are approximate public site or research-area locations. Polyline vertices are editorial schematic geography, never surveyed migration tracks. Fading evidence remains an earlier observation, not demonstrated continuing occupation.

## Evidence and access

The catalogue's `access` and optional `locator` fields distinguish institutional pages, full-text PDFs, indexed full-text passages and abstracts. Browser challenges prevented reliable direct access to some publisher/PMC pages; access notes do not claim those entire articles were read. Primary-paper excerpts and institutional materials were used to verify the selected claims.

The new guide separates nuclear DNA, mitochondrial DNA, proteins and morphology; a first-generation child from inferred older introgression; and genome-wide ancestry from a selected variant. It provides a geographic comparison with study-specific numbers, explains back-migration to Africa, and juxtaposes [Durvasula and Sankararaman's 2020 unsampled-introgression model](https://qcb.ucla.edu/wp-content/uploads/sites/14/2020/04/PMID-32095519-.pdf) with [Ragsdale et al.'s 2023 structured-stem alternative](https://www.nature.com/articles/s41586-023-06055-y). Neither model is presented as identification of a named fossil species.

## Deliberate gaps and cautions

This first pass emphasizes principal branches and geographically distinct evidence, with limited fossil density. Detailed Neanderthal regional histories, Asian Middle Pleistocene taxonomic proposals and most specimen-level occurrences remain for later expansion. The existing guide retains a broader locality bibliography, including additional Denisovan protein identifications, than this small playable catalogue.

No genome is assigned to unsampled early hominins, and no absence of DNA is interpreted as absence of interbreeding. The disappearance discussion distinguishes a distinct lineage ending from ancestry surviving through admixture. Fossil last occurrences are not extinction dates. Proposed ancestors remain hypotheses.

The pre-existing guide bibliography mislabeled the 2022 review at PMC9703123 as “Stringer et al.”. Its authors have now been corrected to Harvati and Reyes-Centeno after source verification and explicit parent authorization. All other original guide data remains intact.

## Verification

Parsed both JSON files, checked unique catalogue identities, source and taxon references, integer ordered intervals and the 1900 ceiling. Compared the guide against Git HEAD: every other guide is unchanged and every original human-family field and section remains intact; the sole existing bibliography change corrects the verified review authors. Parent task runs the repository validator and runtime/build tests after combining shards.
