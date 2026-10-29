# Americas Peoples bulk import guide

**Version compatibility:** the current template uses spreadsheet schema 2 and requires **Americas Peoples v0.2.0**. It adds a sixth tab, Overlays, for trade, conflict, forced removal, epidemics and violence. The app also accepts old five-tab schema 1 workbooks. v0.1 accepts JSON only; v0.1.1 accepts schema 1 XLSX only. JSON packages containing overlays use proposal schema 2; ordinary site-only packages can still use schema 1.

[Download the Excel template](../templates/americas-peoples-import.xlsx). On GitHub, choose **Download raw file** to save the actual `.xlsx` workbook.

Every imported entry becomes a proposal. Choose `draft` while researching or `ready` when complete. Ready means ready for review; neither choice creates a reviewed record or changes the bundled dataset.

## Start with one entry

1. Download the template and save a working copy. Keep all six sheets: `Readme`, `Evidence`, `Claims`, `References`, `ClaimSources`, and `Overlays`. Keep every data header in row 1. The required version marker is `Readme!A1=format_version` and `Readme!B1=2` (a number). Other `Readme` instructions and field descriptions are not evidence data. Extra sheets are rejected. Delete or replace all sample rows across the data sheets before adding your own batch. Keep data contiguous with no blank rows between entries; trailing blank rows are allowed.
2. In `Evidence`, give your entry a stable `record_id`, such as `example-site-01`. Fill the title, culture, dates, location when known, and narrative sections. Use `operation=new` and `proposal_state=draft` to start.
3. In `Claims`, add one row per statement supported by evidence. Repeat the evidence `record_id`; give each statement a `claim_id`.
4. In `References`, enter one row per source with a unique `reference_id` and its bibliographic metadata. A reference may support several claims or records.
5. In `ClaimSources`, connect each claim to its references using the three IDs. Add a precise page, figure, table, section, or archival locator and explain how the source bears on the claim.
6. Save as `.xlsx`, open the application's proposal import control, and select the workbook. Inspect the preview and diagnostics before confirming import. Structural errors reject the entire file: correct the named sheet and row, save, and retry.
7. Review the imported evidence page. Finish missing material in the proposal editor and mark it ready when appropriate. Export native proposal JSON to preserve and share the proposal and its version history.

Use values, not formulas. Enter years as positive whole numbers in ordinary number cells and put `BCE` or `CE` in the adjacent era cell. Do not use Excel date cells, negative BCE years, year zero, or formulas. Enter a source-check date as text, for example `2026-10-28`. Use plain text and paragraph breaks for prose; HTML is not supported.

## How the four sheets connect

This is a relationship example only, not historical evidence:

| Sheet | ID values | Meaning |
| --- | --- | --- |
| Evidence | `record_id=example-site-01` | One proposed evidence record |
| Claims | `record_id=example-site-01`, `claim_id=claim-01` | A claim belonging to that record |
| References | `reference_id=ref-01` | A source described once in this workbook |
| ClaimSources | `record_id=example-site-01`, `claim_id=claim-01`, `reference_id=ref-01` | That source's relationship to that claim |

Repeat `ClaimSources` rows to cite multiple sources. A `challenges` source documents counterevidence; a `context` source supplies background. A citation does not automatically make a claim well-supported. All referenced sources must be included in this workbook, even when a source also appears in the bundled dataset. The resulting proposal embeds its sources. Every References row must be linked by ClaimSources; unused references are rejected rather than silently discarded. Add a separate location claim when a source supports coordinates rather than the primary historical claim.

IDs start with a letter or digit, contain only letters, digits, dots, underscores, and hyphens, and have at most 120 characters. Keep them stable when editing. Evidence IDs are unique within the workbook; claim IDs are unique within their record; reference IDs are unique within `References`.

## Exact column dictionary

Headers are case-sensitive. Column order may change, but **all listed headers must remain present**, including columns whose cells are optional. Leave optional cells genuinely blank. Fill explicit enumerated choices instead of inventing labels. Drafts permit unfinished narrative and citation content, but still require structurally valid IDs, values, and relationships.

### Evidence

| Header | Value and purpose |
| --- | --- |
| `start_year` | Positive whole start year for a bounded time extent; blank for `unplaced`. |
| `start_era` | `BCE` or `CE`; blank for `unplaced`. |
| `end_year` | Positive whole end year; use the same year for a single-year occurrence; blank for `unplaced`. |
| `end_era` | `BCE` or `CE`; blank for `unplaced`. |
| `culture_name` | Human-readable people/culture label, including an explicit unknown label when appropriate. |
| `location_name` | Origin/site label; leave all location cells blank for a nonspatial or undisclosed location. |
| `title` | Short evidence-record title; required for ready. |
| `record_id` | Stable evidence ID; also used by `Claims` and `ClaimSources`. |
| `operation` | `new` or `correction`. |
| `base_revision` | Exact positive revision of the current bundled target for a correction; blank for a new record. |
| `record_type` | `occupation`, `occurrence`, `movement`, or `event`. |
| `time_model` | `interval`, `occurrence`, or `unplaced`; see temporal guidance below. |
| `approximate` | `true` or `false`; marks rounded reference dates without inventing a confidence interval. |
| `certain_start_year` | Optional positive whole start year of a certain core, for `interval` only. |
| `certain_start_era` | `BCE` or `CE` when a certain core is supplied. |
| `certain_end_year` | Optional positive whole end year of a certain core; supply both boundaries together. |
| `certain_end_era` | `BCE` or `CE` when a certain core is supplied. |
| `culture_id` | Stable culture/people ID. Reused IDs must describe the same entity consistently. |
| `culture_kind` | `culture`, `people`, or `unknown`. |
| `culture_color` | Six-digit hexadecimal color beginning with `#`, such as `#526A80`. |
| `location_id` | Stable site/origin ID when a location is supplied. |
| `longitude` | Numeric longitude from −180 through 180 when location is supplied. |
| `latitude` | Numeric latitude from −90 through 90 when location is supplied. |
| `coordinate_precision` | Describe precision/generalization, such as “regional proxy”; required whenever any location fields are supplied, including drafts. |
| `location_source` | Provenance of origin/site coordinates; required whenever any location fields are supplied, including drafts. |
| `destination_id` | Stable destination ID when supplied; ready movements require a destination. |
| `destination_name` | Destination label. |
| `destination_longitude` | Numeric destination longitude from −180 through 180. |
| `destination_latitude` | Numeric destination latitude from −90 through 90. |
| `destination_precision` | Precision/generalization of destination coordinates. |
| `destination_source` | Provenance of destination coordinates. |
| `original_dates` | Source's original dating wording and uncertainty; required for ready. |
| `dating_method` | How dates were established, including calibration provenance where relevant; required for ready. |
| `date_interpretation` | Explain the chosen time model and bounds; required for ready. |
| `rationale` | Explain why this proposal should be added or what a correction changes. |
| `proposal_state` | `draft` or `ready`. Neither means reviewed. |
| `source_check_date` | Text date recording the source check, exactly `YYYY-MM-DD`; required for ready. |
| `review_provenance` | Who/what produced the review and how sources were checked; required for ready. |
| `related_ids` | Semicolon-separated IDs of related bundled evidence records; blank if none. |
| `summary` | Evidence synthesis in plain-text paragraphs; ready requires substantive prose of at least 40 characters. |
| `limitations` | Dating, identification, geographic, sampling, or source limitations; required for ready. |
| `discussion` | Competing interpretations and counterevidence; required when any claim is `under discussion` or `disputed`. |

### Claims

| Header | Value and purpose |
| --- | --- |
| `record_id` | Existing ID from this workbook's `Evidence` sheet. |
| `claim_id` | Stable ID unique within this record. |
| `claim` | The specific evidence-based statement; required for ready. |
| `scholarly_status` | `well-supported`, `under discussion`, or `disputed`. |
| `status_explanation` | Explain the assessment and its evidentiary basis; required for ready. |

### References

| Header | Value and purpose |
| --- | --- |
| `reference_id` | Stable source ID, unique in this sheet. |
| `reference_type` | One of the eight types below. |
| `authors` | Ordered display names separated by semicolons, e.g. `Example, A.; Sample, B.` Corporate authors are valid. Required for ready. |
| `year` | Publication year, a whole number 1–9999; blank means undated and displays as `n.d.` This is not the event date. |
| `title` | Source title; use chapter title for a chapter, item title for an archive item. Required for ready. |
| `venue` | Journal, containing book, institution, repository, archive, or website as appropriate. Required for ready. |
| `doi` | DOI identifier when known. A DOI can supply a `https://doi.org/…` link when URL is blank; it does not retrieve metadata. |
| `url` | Safe `http://` or `https://` source link, without embedded credentials. Ready sources require a usable link, directly or from DOI. |
| `volume` | Optional journal/series volume. |
| `issue` | Optional issue. |
| `pages` | Optional publication page range or article number; claim-specific locators belong in `ClaimSources`. |
| `publisher` | Optional publisher or issuing institution. |
| `editors` | Optional ordered editor display names, separated by semicolons. |
| `edition` | Optional edition/version description. |
| `archive` | Optional holding archive/repository. |
| `collection` | Optional archival collection/series. |
| `identifier` | Optional report number, accession, shelfmark, dataset identifier, or other stable identifier. |
| `access_notes` | Explain access and what was consulted, including restrictions or abstract-only access. Required for ready. |

### ClaimSources

| Header | Value and purpose |
| --- | --- |
| `record_id` | Evidence ID from this workbook. |
| `claim_id` | Claim ID belonging to that evidence record. |
| `reference_id` | Reference ID from this workbook. |
| `stance` | `supports`, `challenges`, or `context`. |
| `locator` | Exact page, section, figure, table, item, or equivalent locator; required for ready. |
| `support_note` | Explain what the cited passage supports, challenges, or contextualizes; required for ready. |

## Dates, places, and narrative sections

An `interval` represents supported duration. Its optional certain core must have both bounds and sit inside the overall interval. An `occurrence` represents something happening within a dating window; a multi-year occurrence does not claim continuous occupation. Use `unplaced` when timing is unresolved and leave all start/end/certain year and era cells blank. Such records remain reviewable but do not appear in time queries. Do not extend an unknown endpoint to 1934.

Chronology must run from earlier to later, including across BCE/CE. The supported range is 1,000,000 BCE through 1934 CE. Preserve original dates and uncertainty. Calibrated BP has a 1950 CE reference; do not apply a calibrated conversion to uncalibrated radiocarbon determinations. Separate disjoint episodes into separate records. See [the detailed data format](data-format.md) for internal astronomical numbering and map behavior.

Leave a location wholly blank if it cannot responsibly be mapped. Otherwise provide its ID, name, both coordinates, precision, and provenance. Label proxy or generalized coordinates clearly. Ready movement records require both origin and destination and independent supporting claims. Connections are schematic; the line is not an evidence-backed reconstruction of an intermediate route.

Write the evidence page as three clean sections: `summary` explains the evidence and conclusions; `limitations` explains what cannot be established; `discussion` treats disagreements and alternatives. Use blank lines within cells to separate paragraphs. Put detailed source relationships in claims and their mappings, rather than pasting an entire bibliography into `summary`. The application displays structured references in an author–year format; this is not a promise of exact APA or Chicago formatting.

## Reference types and minimum useful detail

For **every ready reference**, supply authors, title, venue, access notes, and an HTTP(S) link or DOI-derived link. Publication year may be blank. Ready references also require these type-specific fields: journal article—`venue`; book—`publisher`; book chapter—`editors`, `pages`, and `publisher`; report—`publisher` or `identifier`; thesis—`publisher`; archival document—`archive`, `collection`, and `identifier`; dataset—`doi` or `identifier`; web resource—`url`. Drafts may omit unfinished metadata while retaining safe field types. Complete other structured columns when known; do not invent missing metadata to fill a cell.

All examples below are **synthetic syntax examples, not citations to real publications and not historical evidence**. Placeholder titles and names demonstrate the fields only. Replace them with verified source metadata and links before using them.

| `reference_type` | Minimum useful type-specific description | Synthetic field example |
| --- | --- | --- |
| `journal-article` | Article title and journal; volume, issue, pages/article number where available. | `authors=Example, A.; Sample, B.`; `year=2024`; `title=Example article title`; `venue=Example Journal`; `volume=12`; `issue=2`; `pages=20–35` |
| `book` | Book title and publisher; edition when relevant. | `authors=Example, A.`; `year=2020`; `title=Example book title`; `venue=Example Press`; `publisher=Example Press`; `edition=2nd` |
| `book-chapter` | Chapter title, containing book title, editors, publisher, and chapter pages when available. | `authors=Sample, B.`; `year=2021`; `title=Example chapter`; `venue=Example edited volume`; `editors=Example, A.`; `publisher=Example Press`; `pages=40–58` |
| `report` | Report title and issuing institution; report number when assigned. | `authors=Example Research Office`; `year=2022`; `title=Example survey report`; `venue=Example Institution`; `publisher=Example Institution`; `identifier=Report EX-01` |
| `thesis` | Thesis title and awarding institution; degree/type in the available descriptive metadata. | `authors=Sample, B.`; `year=2023`; `title=Example thesis title`; `venue=Example University, doctoral thesis`; `publisher=Example University` |
| `archival-document` | Item title/description, creator, holding archive, collection, and identifier sufficient to locate it. | `authors=Example Office`; `year=`; `title=Example field memorandum`; `venue=Example Archive`; `archive=Example Archive`; `collection=Example Papers`; `identifier=Box 2, folder 4` |
| `dataset` | Dataset title, creator, repository, version, and persistent identifier when available. | `authors=Example Data Group`; `year=2024`; `title=Example observations`; `venue=Example Repository`; `edition=Version 1`; `identifier=EX-DATA-01` |
| `web-resource` | Page title, author/organization, site name, stable URL, and access context. | `authors=Example Museum`; `year=`; `title=Example collection page`; `venue=Example Museum website`; `access_notes=Full page consulted; record the actual check date` |

The native source core maps `reference_id` → `id`, `authors` → `authors`, `title` → `title`, `year` → `year`, `venue` → `venue`, `url` (or DOI-derived URL) → `url`, and `access_notes` → `access`. Structured bibliographic detail supplements those core fields. Keep access notes factual: a DOI or catalogue record alone does not establish that the full text was consulted.

## Other citation formats

The app imports **this XLSX workbook and native Americas Peoples proposal JSON only**. BibTeX, RIS, CSL-JSON, and lists of DOIs can be supplied to an assistant for conversion into the workbook; they are not direct app imports. Bibliographic conversion still needs your evidence dates, places, claims, source locators, interpretation, and review prose.

| Input | Useful when | Conversion to workbook fields |
| --- | --- | --- |
| BibTeX | A research library already exports `.bib` entries. | Entry key → `reference_id`; entry type → `reference_type`; author → ordered `authors`; title → `title`; year → `year`; journal/booktitle → `venue`; volume/number/pages/publisher/editor/edition/doi/url → corresponding fields (`number` usually `issue` for articles). Verify type-dependent mappings. |
| RIS | A reference manager exports tagged records. | Record ID → `reference_id`; TY → type; AU → ordered `authors`; TI → `title`; PY → `year`; journal/secondary-title tags → `venue`; DO → `doi`; UR → `url`; VL/IS/SP–EP/PB → volume/issue/pages/publisher. Verify exporter-specific tags. |
| CSL-JSON | Rich structured metadata and author objects are available. | id → `reference_id`; type → type; author names/literals → ordered `authors`; issued date-parts year → `year`; title → `title`; container-title → `venue`; DOI/URL/volume/issue/page/publisher/editor/edition → matching columns. Retain corporate-author literals. |
| DOI list | You have identifiers but still need bibliography metadata. | DOI → `doi`; online metadata lookup may populate author/title/year/venue and other fields. Check retrieved metadata against the source. Offline import can construct a DOI URL, but cannot fetch the metadata. |
| Native proposal JSON | You are moving existing proposals between app installations or preserving revisions. | Retains the app's full proposal contract, embedded evidence/sources, base record, and proposal versions. It is not interchangeable with CSL-JSON. |

Crossref supports online DOI content negotiation into formats including BibTeX, RIS, and CSL-JSON, and cautions that mappings between schemas are not always direct. This is a separate online service, not a feature of the offline workbook importer. See [Crossref content negotiation](https://www.crossref.org/documentation/retrieve-metadata/content-negotiation/). CSL provides citation-style specifications and processors; the app's author–year display does not imply it runs a CSL processor. See [CSL developer documentation](https://citationstyles.org/developers/).

## Corrections, revisions, and duplicate handling

Use `new` for a new evidence identity. Use `correction` for a proposed change to a bundled record: `record_id` must identify the current bundled record and `base_revision` must match its exact current revision. The importer preserves the original from that dataset. An absent target or mismatched base revision is an error to resolve before retrying.

A correction is a **complete replacement record**, not a sparse patch. Include the full proposed evidence row, every retained claim, all required references, and all source mappings. Leaving out old content does not mean “keep the original.” A workbook is self-contained; it cannot refer to an external spreadsheet, a source in another import, or an unlisted bundled source.

After import, use the proposal editor to revise the local draft. Editor saves increment the proposal version and replace that local draft slot while retaining the bundled original. Use exported native JSON to move those proposals between installations. Reimporting a workbook is not an instruction to overwrite an existing local proposal.

Identical workbook content produces stable bulk proposal identities: repeat imports are skipped, retaining the original import timestamp. Changed content with the same bulk identity is retained as a conflict. Bulk duplicate comparison ignores import timestamps only; it does not ignore substantive content. The native proposal importer otherwise skips identical full proposals. Different contents with the same proposal ID/version are retained as conflicts; different versions remain separate proposals. Corrections imported through native JSON whose preserved original or revision differs from the recipient's dataset appear as conflicts in the preview. Resolve conflicts explicitly. Neither preview nor import promotes a proposal into the reviewed dataset. A maintainer must assess the sources, update reviewed data and revisions deliberately, and publish a new dataset release.

## Limits and troubleshooting

| Limit | Maximum |
| --- | --- |
| XLSX compressed file | 5 MB |
| XLSX decompressed contents | 20 MB |
| Evidence data rows | 500 |
| Data rows in each supporting sheet | 2,000 each in Claims, References, and ClaimSources |
| Characters in one cell | 32,767 |
| Resulting native proposal JSON package | 8 MB UTF-8, at most 1000 proposals |
| Per-record claims and sources | 100 of each |
| Source mappings per claim | 100 |

The cell ceiling matches [Excel's documented 32,767-character limit](https://support.microsoft.com/en-us/excel/excel-specifications-and-limits). The other limits above are application limits. A workbook within the compressed-size limit can still exceed the decompressed or resulting JSON limit, especially when a shared reference is embedded into many records.

Do not include macros or formulas. Use plain values, ordinary year numbers, and text source-check dates. Keep all six sheets, including the `Readme` version marker, even if a draft leaves a supporting data sheet empty apart from headers. Do not add extra sheets, rename headers, merge header cells, or replace IDs with display names.

When import reports a sheet and row, check that row's IDs, enumerated values, number types, and required relationships first. Check the related sheet when a referenced ID is missing. For readiness errors, either complete the missing evidence or choose `draft`; choosing draft does not bypass structural errors. No partial subset is imported after a structural failure. Fix the workbook and retry, then inspect the preview and evidence pages before sharing.


## Thematic overlays (v0.2.0)

The **Overlays** tab uses every Evidence header, in the same order, plus these five columns. Keep an empty Overlays tab when submitting only sites in schema 2. An overlay has a stable record_id shared by its Claims and ClaimSources; cite bibliography rows in References exactly as for ordinary evidence. IDs must be unique across Evidence and Overlays. The combined limit is 500 site and overlay proposals per import.

| Extra column | Values and meaning |
| --- | --- |
| overlay_type | `trade`, `conflict`, `forced-removal`, `epidemic`, or `violence` |
| geometry_basis | `documented`, `schematic`, or `unmapped` |
| geometry_geojson | A GeoJSON Point or LineString geometry object as text, or `null` when unmapped. Coordinates are decimal `[longitude, latitude]`. No Feature/FeatureCollection wrapper, polygons, or altitude. Maximum 1,000 positions. |
| geometry_precision | Explain spatial uncertainty and what the mark represents. A public site locator is not an excavated battlefield location. |
| geometry_source | Citation and locator for the geometry, or why the route is unresolved. This also needs a claim/source mapping. |

Set `record_type=event`. Use occurrence for a dated event or an uncertainty window; interval requires evidence supporting activity over that period. Preserve original dates and dating method. Use `culture_id=unknown` if an overlay covers multiple parties or attribution is unsupported, explaining identified participants in the review. Do not represent exchange as population movement.

A documented Point can locate an affected site; it does not establish the extent of warfare. A documented LineString requires source-supported intermediate geometry. A schematic LineString must have **exactly two endpoints** and establishes a connection only, not an itinerary. Example syntax (illustrative coordinates, not evidence): `{"type":"LineString","coordinates":[[-100,30],[-90,35]]}`. If a commodity's source is known but no defensible route exists, use a receiving-site Point or unmapped geometry. Do not invent a route.

Import, review, save and share overlays through Suggestions. They remain unreviewed proposals. Enable **Preview complete suggestions** and use the individual overlay controls on the map. Overlays follow the year slider, appear in the evidence table with filters for each overlay kind, and open supporting review pages. The editor's **Overlay JSON** field preserves all five geometry/type fields as kind, basis, geometry, precision and provenance. Use `null` to remove overlay metadata deliberately.


Use `forced-removal` for supported coerced displacement, with directed schematic connections from origin to destination. Record return journeys separately. Use `violence` for documented massacres or other violence and `epidemic` for epidemic evidence. An epidemic Point is a declared locality or regional proxy, not the reconstructed origin or extent of transmission. Do not derive a spreading wave from dates alone. Mortality claims must name the affected population, period, source and estimation limits. Where estimates disagree, use separate claims and the discussion fields. Never equate a missing later record with extinction. The 1934 cutoff marks the Indian Reorganization Act for this edition; it does not imply that dispossession ended.

## Optional settlement and reach columns

`population_json` is an optional Evidence column holding the population array documented in data-format.md. Leave it blank for unknown values on new records. On a correction, a blank or omitted column preserves existing population metadata for backward compatibility; enter `[]` to remove it explicitly. Each entry links a `claimId` to Claims and ClaimSources. Do not add raw counts without the supported settlement scope and dates.

`reach_radius_km` is an optional Overlays column used only with `overlay_type=cultural-reach`, `geometry_basis=schematic` and a Point center. It is an illustrative geographic envelope, not an established historical border. Population and reach columns are accepted without making older schema-1/schema-2 workbooks obsolete.

The native JSON limit is now 8 MB and the proposal count limit 1000, so the complete published correction snapshot fits. Compressed XLSX remains limited to 5 MB, expanded ZIP content to 20 MB, archive entries to 200, rows to 2000 and columns to 100. Formula, macro, external-link, unsafe-URL and prototype-key checks remain enabled.
