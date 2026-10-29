import { writeFile } from "node:fs/promises";
import { dataset } from "../src/published-data";
import { version as appVersion } from '../package.json';
import { BULK_HEADERS, OVERLAY_HEADERS } from "../src/bulk-schema";

const tables: Record<string, unknown[][]> = {
  Readme: [
    ["format_version", 2],
    ["title", "Americas Peoples — complete published evidence"],
    ["app_version", appVersion],
    ["records", dataset.records.length],
    [
      "scope",
      "All author-published evidence; no import is needed to view it in the app.",
    ],
    [
      "editing",
      "Rows are corrections against this published version. Preserve base revisions when editing.",
    ],
    [
      "dates",
      "Plain year numbers with BCE/CE. BP is before 1950 unless a source explicitly states AD 2000.",
    ],
    [
      "uncertainty",
      "Dates and certain cores remain source-linked; opacity is illustrative, not a probability or population size.",
    ],
    [
      "regions",
      "Cloud anchors are approximate regions, not settlements, traced routes or confidence polygons.",
    ],
    ["access", "Reference access_notes distinguish abstracts from full text."],
    [
      "records_with_no_date",
      "Unplaced rows remain in the evidence index. Do not invent years to map them.",
    ],
  ],
  Evidence: [[...BULK_HEADERS.Evidence]],
  Claims: [[...BULK_HEADERS.Claims]],
  References: [[...BULK_HEADERS.References]],
  ClaimSources: [[...BULK_HEADERS.ClaimSources]],
  Overlays: [[...OVERLAY_HEADERS]],
};
const years = (year: number | null | undefined) =>
  year == null
    ? ["", ""]
    : [year <= 0 ? 1 - year : year, year <= 0 ? "BCE" : "CE"];
for (const r of dataset.records) {
  const [start_year, start_era] = years(r.time.start),
    [end_year, end_era] = years(r.time.end),
    [certain_start_year, certain_start_era] = years(r.time.certainStart),
    [certain_end_year, certain_end_era] = years(r.time.certainEnd);
  const row: Record<string, unknown> = {
    start_year,
    start_era,
    end_year,
    end_era,
    certain_start_year,
    certain_start_era,
    certain_end_year,
    certain_end_era,
    culture_name: r.culture.name,
    location_name: r.location?.name ?? "",
    title: r.title,
    record_id: r.id,
    operation: "correction",
    base_revision: r.revision,
    record_type: r.type,
    time_model: r.time.kind,
    approximate: r.time.approximate ?? false,
    culture_id: r.culture.id,
    culture_kind: r.culture.kind,
    culture_color: r.culture.color,
    location_id: r.location?.id ?? "",
    longitude: r.location?.lon ?? "",
    latitude: r.location?.lat ?? "",
    coordinate_precision: r.location?.precision ?? "",
    location_source: r.location?.provenance ?? "",
    destination_id: r.destination?.id ?? "",
    destination_name: r.destination?.name ?? "",
    destination_longitude: r.destination?.lon ?? "",
    destination_latitude: r.destination?.lat ?? "",
    destination_precision: r.destination?.precision ?? "",
    destination_source: r.destination?.provenance ?? "",
    original_dates: r.time.original,
    dating_method: r.time.method,
    date_interpretation: r.time.interpretation,
    rationale:
      "Published evidence snapshot; edit this row with its cited sources before proposing a correction.",
    proposal_state: "ready",
    source_check_date: r.review.reviewedAt,
    review_provenance: r.review.provenance,
    related_ids: r.review.relatedIds.join(";"),
    summary: r.review.summary,
    limitations: r.review.limitations,
    discussion: r.review.discussion,
    population_json: r.population ? JSON.stringify(r.population) : "",
    language_json: r.linguistics ? JSON.stringify(r.linguistics) : "",
  };
  const key = r.overlay ? "Overlays" : "Evidence",
    headers = r.overlay ? OVERLAY_HEADERS : BULK_HEADERS.Evidence;
  if (r.overlay)
    Object.assign(row, {
      overlay_type: r.overlay.kind,
      geometry_basis: r.overlay.basis,
      geometry_geojson: JSON.stringify(r.overlay.geometry),
      geometry_precision: r.overlay.precision,
      geometry_source: r.overlay.provenance,
      reach_radius_km: r.overlay.radiusKm ?? "",
      direction: r.overlay.direction ?? "",
    });
  tables[key].push(headers.map((h) => row[h] ?? ""));
  // Scope reference IDs by record; historical batches may use the same short ID for different references.
  const refID = (id: string) => r.id + "--" + id;
  for (const s of r.sources) {
    const sr: Record<string, unknown> = {
      ...s,
      reference_id: refID(s.id),
      reference_type:
        s.referenceType ??
        (s.url.startsWith("https://doi.org/")
          ? "journal-article"
          : "web-resource"),
      access_notes: s.access,
    };
    tables.References.push(BULK_HEADERS.References.map((h) => sr[h] ?? ""));
  }
  for (const c of r.claims) {
    tables.Claims.push([r.id, c.id, c.text, c.status, c.explanation]);
    for (const x of c.support)
      tables.ClaimSources.push([
        r.id,
        c.id,
        refID(x.sourceId),
        x.stance,
        x.locator,
        x.note,
      ]);
  }
}
await writeFile("data/workbook-tables.json", JSON.stringify(tables));
console.log(
  Object.fromEntries(Object.entries(tables).map(([k, v]) => [k, v.length - 1])),
);
