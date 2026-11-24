// One-time editorial normalization of the preserved research dossier. Not required to build.
import { readFile, writeFile } from "node:fs/promises";
const dossier = JSON.parse(
  await readFile("docs/research-dossier.json", "utf8"),
);
const colors = {
  unknown: "#9babb5",
  norse: "#dfba7a",
  mississippian: "#79b8a3",
  "cahokia-illini": "#d48d77",
  "france-united-states": "#89a9d4",
};
const names = {
  unknown: "Unknown attribution",
  norse: "Norse",
  mississippian: "Mississippian archaeological tradition",
  "cahokia-illini": "Cahokia people / Illinois Confederation",
  "france-united-states": "France and United States governments",
};
const records = dossier.records.map((row) => {
  const culture = {
    id: row.cultureId,
    name: names[row.cultureId],
    kind:
      row.cultureId === "unknown"
        ? "unknown"
        : row.cultureId === "mississippian"
          ? "culture"
          : "people",
    color: colors[row.cultureId],
  };
  const sources = row.sourceIds.map((id) => {
    const s = dossier.sources.find((s) => s.id === id);
    return {
      id: s.id,
      authors: s.authors,
      title: s.title,
      year: s.year,
      venue: s.venue,
      url: s.url,
      access: s.access + (s.caveat ? " Limitation: " + s.caveat : ""),
    };
  });
  const coordSource = dossier.sources.find(
    (s) => s.id === row.coordinateSource,
  );
  const location = row.coordinates
    ? {
        id: row.siteId,
        name: row.siteName,
        lon: row.coordinates[0],
        lat: row.coordinates[1],
        precision: row.coordinatePrecision,
        provenance: coordSource
          ? `${coordSource.title}; ${row.coordinateLocator ?? coordSource.locator}. ${coordSource.url}`
          : "",
      }
    : null;
  if (location?.id === "monte-verde" && row.id === "chinchihuapi-later-context")
    location.id = "chinchihuapi";
  if (location?.id === "cahokia") {
    location.name = "Cahokia archaeological complex, Illinois";
    location.precision =
      "Generalized archaeological-complex locator, not an individual structure or excavation.";
  }
  const time = {
    kind: row.time.mode.includes("occupation") ? "interval" : "occurrence",
    start: row.time.start,
    end: row.time.end,
    original: row.time.original,
    method: row.time.method,
    interpretation:
      row.time.conversion +
      (row.displayCaution ? " " + row.displayCaution : ""),
  };
  if (row.time.mode.startsWith("approximate")) time.approximate = true;
  const mainStatus =
    row.statuses.humanAgency === "disputed"
      ? "disputed"
      : row.statuses.dating === "disputed"
        ? "disputed"
        : row.statuses.dating === "under discussion"
          ? "under discussion"
          : "well-supported";
  const claims = [
    {
      id: "primary",
      text: row.claim,
      status: mainStatus,
      explanation: row.explanation,
      support: row.support.map((s) => ({
        sourceId: s.sourceId,
        locator: s.locator,
        stance: s.stance,
        note: s.claim,
      })),
    },
  ];
  if (
    row.statuses.dating === "disputed" &&
    row.statuses.humanAgency === "well-supported"
  )
    claims.push({
      id: "human-agency",
      text: "Cultural materials are reported; the dispute concerns their chronological placement.",
      status: "well-supported",
      explanation:
        "The dating dispute is kept separate from evidence of human activity.",
      support: [
        {
          sourceId: row.sourceIds[0],
          locator: "Site descriptions and cultural materials",
          stance: "supports",
          note: "Supports human activity without settling the contested date.",
        },
      ],
    });
  return {
    id: row.id,
    revision: 1,
    type: row.type,
    title: row.title,
    culture,
    location,
    destination: null,
    routeKind: "schematic",
    time,
    claims,
    sources,
    review: {
      summary: row.explanation,
      limitations:
        row.discussion +
        (row.displayCaution ? " " + row.displayCaution : "") +
        (row.additionalPeople
          ? " Also present: " +
            row.additionalPeople +
            ". This category does not describe every participant."
          : ""),
      discussion: row.discussion,
      provenance:
        "Starter corpus compiled from the named publications and archival sources. Editorial source check only; access limitations are recorded per citation. No independent peer review.",
      reviewedAt: dossier.researchDate,
      history: ["2026-10-28: Initial source-traceable starter entry."],
      relatedIds: row.relatedIds,
    },
  };
});
const data = {
  schemaVersion: 1,
  version: "0.1.0",
  reviewedAt: "2026-10-28",
  coverage:
    "Eight source-traceable examples, not comprehensive coverage. Many years and regions have no included records. No migration routes are asserted in this starter release.",
  license:
    "Original summaries are supplied with the application. Scholarly works retain their own copyrights; only citation metadata, links and short original explanations are bundled.",
  records,
};
await writeFile("data/evidence.json", JSON.stringify(data, null, 2) + "\n");
console.log(`Prepared ${records.length} records.`);
