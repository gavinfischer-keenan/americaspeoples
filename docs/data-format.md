# Evidence and proposal format

The runtime contracts are in `src/model.ts`; validation is in `src/validation.ts` and `src/proposals.ts`. Evidence/dataset schema is 1; the proposal envelope uses 2 for overlays or linguistic metadata (1 remains readable for ordinary rows). API protocol version 1is separate from both. Dataset/app release version is independent. Run `npm run validate` after editing.

## Identity and self-contained rows

Each evidence record has a stable `id`, positive `revision`, `type`, title, culture, location or null, destination or null, time, claims, sources and review. Supported types are occupation, occurrence, movement and event. IDs use letters, digits, dots, underscores and hyphens, up to 120 characters.

Full evidence exports embed source and site/culture metadata to make file sharing self-contained. Within a reviewed dataset, a reused culture or site ID must keep consistent metadata. Related record IDs refer to other bundled reviews. A source has authors, title, publication year (null for undated), venue, a safe HTTP(S) URL and access notes. Publication date is never substituted for the event date.

Each claim has an ID, text, status, an editorial explanation, and source mappings. A mapping identifies a source, locator, stance (supports/challenges/context), and interpretation. Scholarly status is well-supported, under discussion, or disputed. Every completed row must have at least one sourced claim, source and substantive review; disputed claims require discussion.

## Temporal semantics

Internal years are integers in astronomical numbering: 1 = 1 CE, 0 = 1 BCE, −1 = 2 BCE. BCE/CE display never shows a year zero. The program's supported range is −1,000,000 through 1934. Endpoints are inclusive. Every temporal definition keeps `original`, `method` and `interpretation` strings.

- `interval`: documentary/archaeological occupation or another supported duration, with start and end. Optional `certainStart` and `certainEnd` must both be present and fall inside that envelope; outside the certain core markers are outlined.
- `occurrence`: something is dated within a start/end window, without asserting residence throughout. Multi-year windows are always possible, not certain. A single-year occurrence can be exact only when the source supports annual precision.
- `unplaced`: start and end are null. The row remains in the table but is excluded from timeline queries. Use this for unresolved/unknown boundaries that do not support a bounded display interval; do not extend an unknown endpoint automatically to 1934.
- `approximate: true`: rounded reference date(s), with no invented confidence interval. Display is marked ≈ and the marker is outlined. For an approximate single-year reference, only that reference year is plotted; use review navigation to jump to it. For a rounded phase interval, the marker is conservatively outlined throughout the displayed interval. This does not erase the evidence for the phase.

Calibrated BP uses 1950 CE as the reference; astronomical year = 1950 − calibrated BP. Preserve calibration provenance and original uncertainty. Do not apply this conversion to an uncalibrated radiocarbon determination. Disjoint occupation episodes are separate records, never one interval spanning the gap.

Map state is a pure query at the selected integer year. Playback advances at the selected rate between evidence boundaries and holds for 700 ms at the next included start/end boundary, so brief events are not silently skipped. The hold does not extend the scientific date range. Exact-year input, table search and Show on map also provide deterministic access. The minimum slider year is derived from bundled reviewed records, not imported proposals. Proposals earlier than the dataset boundary can be reviewed in the table but require a future reviewed release to extend the timeline.

## Coordinates and movements

A place includes ID, name, longitude, latitude, precision and provenance. Null locations are valid for nonspatial events or undisclosed sites. Generalized or proxy coordinates must be labeled. Movement records need both origin and destination plus independent claim support and a temporal extent. `routeKind` must be `schematic` in schema version 1. The renderer connects endpoints schematically; it does not reconstruct intermediate waypoints. Import validation rejects a claim that this generated path is a supported route. Evidence-backed intermediate route geometry requires a future schema and renderer extension. No relationship is inferred from spatial or temporal proximity.

## Proposals

A proposal includes ID, version, kind (new/correction), target ID and base revision or null, preserved baseRecord or null, proposed record, rationale, state (draft/ready), and timestamps. Drafts may have incomplete prose or missing citations but must still have safe, structurally valid fields. Ready requires all evidence fields; readiness is not verification.

Share packages contain `format: "americas-peoples-proposals"`, `schemaVersion: 1 | 2`, export time and proposals. A package is limited to 8 MB UTF-8 and 1000 proposals. Source and place dependencies are embedded. HTTP(S) links only; markup is rendered as escaped text. Prototype-related JSON keys are rejected.

Duplicate detection compares canonical full proposal contents, ignoring object key ordering. Identical copies are skipped. Different content with the same ID/version is a conflict and is retained separately; different versions are retained as separate proposals. Corrections whose original or revision differs from the recipient dataset are marked as conflicts in the import preview. Previewing a proposal never promotes it to the dataset.

Editor revisions replace the corresponding local draft slot with an incremented proposal version. The bundled original evidence remains preserved. Exported prior versions can be imported later as separate proposals. To promote a proposal, a maintainer must inspect its sources, resolve conflicts, edit the reviewed data deliberately, increment record revisions, update the dataset version and build a new release.

## Bulk workbooks and structured bibliography

See [the bulk import guide](bulk-import-guide.md) for the XLSX table schema, supported reference types, required fields and worked examples. App 0.1.1 imports XLSX locally and converts it to the same proposal model. Optional source fields are referenceType, doi, volume, issue, pages, publisher, editors, edition, archive, collection and identifier. Existing v0.1 source records remain compatible. Citations use a consistent author-year display, not a full CSL style engine.

Bulk proposal IDs derive from the evidence record ID. For IDs beginning `bulk-`, duplicate comparison ignores import timestamps, so reimporting unchanged workbook content is idempotent. Substantive changes retain conflict handling. XLSX corrections require a current matching base revision and contain complete replacement records; blank fields are not sparse patches. Native JSON sharing retains the original proposal timestamps and history.

## Overlays

App 0.2.0 optionally adds `overlay` to an event record: kind (trade/conflict/forced-removal/epidemic/violence), basis (documented/schematic/unmapped), geometry (GeoJSON Point/LineString or null), precision and provenance. Schematic connections have exactly two endpoints. Geometry validates finite longitude/latitude and is bounded to 1,000 positions. Existing claims, citations, reviews, time extents and proposal handling apply. `makePackage` emits proposal schema 2 whenever an overlay occurs in either proposed or preserved base records. Old packages without overlays remain schema 1. The new app reads both; it rejects overlays mislabeled as schema 1. Workbook schema 2 requires Overlays; legacy workbook schema 1 retains its five tabs.

## Regional and environmental layers

Version0.3.0 accepts `population-history`, `regional-evidence` and `environment` overlay kinds in schema2 workbooks/JSON. Use event records. Broad cloud anchors are qualitative regional associations, never excavated settlements, statistical boundaries or documented routes. Existing Point/LineString validation and two-endpoint schematic limits apply.

Time opacity uses documented bounds and optional certain cores. Without a core, a symmetric illustrative fade is used for approximate windows, explicitly not a posterior probability. Single rounded reference dates are not padded. Unknown calendar calibration, disjoint windows and open ends must remain unplaced unless a separate supported interval is available.

## Settlement detail and population display

Named settlements remain individual ordinary records, with coordinates, coordinate precision and provenance. Regional syntheses do not become settlement dots. Public access locators are labeled as such; decimal digits are not a claim of survey accuracy. This rule applies throughout the atlas, including Hovenweep and the Caribbean.

Optional `population` entries contain `start`, `end`, `min`, `max`, `claimId` and `scope`. Dates use astronomical calendar years and must lie within the site record's interval. Counts refer to estimated residents at that settlement. Each claimId links to a claim with supporting sources. The map applies entries only within their dates, with no interpolation, extrapolation or addition of overlapping estimates. Population estimates can change through time; a gap returns to unknown. Peak estimates within a broader dated phase must state that qualification in scope.

Dot-radius bands: 1–500, 501–2,500, 2,501–10,000, 10,001–50,000 and 50,001+. Unknown population shares the smallest symbol and is striped. This size is a display convention, **not an estimate of 1–500 residents**. A translucent outer population halo shows an upper estimate crossing a band; alternative estimates are shown as an envelope, not added. Site sample counts, artifacts, building counts and genetic effective population are never automatically converted to resident counts.

`cultural-reach` overlays use a schematic Point center with `radiusKm` (greater than zero, at most 3000). The very soft geographic envelope is an editorial illustration of the named cultural context, not a surveyed border, exclusive territory, statistical confidence area or claim about modern identity. Cite the cultural interpretation and explain the editorial geographic choice separately. It has its own map toggle.


## API catalog and complete records

`CatalogRecord` is a compact map/index contract with `detailLevel: "catalog"`. Its claims carry ID/text/status only; its review carries summary, limitations, reviewedAt and related IDs. It has no bibliography, complete support mappings or record provenance. It is never a valid replacement for an `EvidenceRecord`.

`/api/records/{id}` and `/api/export` return complete records; correction creation, comparison and file export require these. Catalog and full-record caches stay separate and release-version checked. `/api/search` returns IDs only. API time/bbox queries exclude unplaced chronology unless separately requested through the catalog. Bounding matches are conservative candidates for schematic spherical connections, not surveyed route evidence. See api-contracts.ts and DEPLOYMENT.md.
