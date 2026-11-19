import test from "node:test";
import assert from "node:assert/strict";
import type { EvidenceRecord, Source } from "../src/model";
import type { EuropeData } from "../src/europe-data";
import type { WorldData } from "../src/world-model";
import { createWorldSummary, mergeWorldShards } from "../scripts/world-build";

const source = (id: string, url: string, doi?: string): Source => ({
  id,
  url,
  doi,
  title: id,
  authors: "Researchers",
  year: 2020,
  venue: "Journal",
  access: "Open",
});
const record = (
  id: string,
  lon: number,
  lat: number,
  sources: Source[],
  start = -100,
): EvidenceRecord => ({
  id,
  revision: 1,
  type: "occurrence",
  title: id,
  culture: {
    id: "unknown",
    name: "Unknown",
    kind: "unknown",
    color: "#ffffff",
  },
  location: {
    id: "place",
    name: "Place",
    lon,
    lat,
    precision: "Regional",
    provenance: "Source",
  },
  destination: null,
  routeKind: "schematic",
  time: {
    kind: "occurrence",
    start,
    end: start,
    original: "About 100 BCE",
    method: "Reported date",
    interpretation: "Dated evidence",
  },
  sources,
  claims: [
    {
      id: "claim",
      text: "Evidence",
      status: "well-supported",
      explanation: "Reported observation",
      support: sources.map((s) => ({
        sourceId: s.id,
        locator: "Study",
        stance: "supports",
        note: "Supports observation",
      })),
    },
  ],
  review: {
    summary: "Evidence",
    limitations: "Selected",
    discussion: "Dated evidence",
    provenance: "Source",
    reviewedAt: "2026-11-18",
    history: [],
    relatedIds: [],
  },
});
const emptyEurope = (): EuropeData => ({
  schemaVersion: 1,
  regions: [],
  sources: [],
  entries: [],
});
const world = (): WorldData => ({
  schemaVersion: 1,
  sources: [
    {
      id: "study",
      title: "Study",
      url: "https://doi.org/10.1234/EXAMPLE",
      access: "Open",
    },
  ],
  taxa: [
    {
      id: "homo",
      name: "Homo",
      meaning: "Genus",
      status: "related-lineage",
      note: "Broad category",
      sourceIds: ["study"],
    },
  ],
  evidence: [
    {
      id: "early",
      title: "Oldest fossil locality",
      taxonIds: ["homo"],
      regionIds: ["africa"],
      kind: "fossil",
      start: -6_998_050,
      end: -5_998_050,
      dateLabel: "About 7–6 Ma",
      dateBasis: "Source geological age",
      coordinates: [18, 15],
      summary: "Fossil evidence",
      limits: "Classification debated",
      sourceIds: ["study"],
    },
  ],
  waves: [],
});

test("summary unions explicit DOI aliases and canonical record identities across catalogues", () => {
  const archive = [
    record("canonical", 20, 36, [
      source("publisher", "https://journal.example/paper", "10.1234/example"),
    ]),
  ];
  const europe: EuropeData = {
    schemaVersion: 1,
    regions: [{ id: "mediterranean", title: "Mediterranean" }],
    sources: [
      {
        id: "doi",
        title: "Study",
        url: "https://dx.doi.org/10.1234/example",
        authors: "Researchers",
        year: 2020,
      },
    ],
    entries: [
      {
        id: "europe-alias",
        canonicalRecordId: "canonical",
        regionId: "mediterranean",
        title: "Same observation",
        category: "habitation",
        kind: "occurrence",
        start: -100,
        end: -100,
        approximate: true,
        dateLabel: "About 100 BCE",
        dateMeaning: "Dated evidence",
        coordinates: [20, 36],
        place: "Place",
        summary: "Evidence",
        detail: "Evidence",
        uncertainty: "Selected",
        sourceIds: ["doi"],
      },
    ],
  };
  const summary = createWorldSummary({
    version: "test",
    records: archive,
    europe,
    world: world(),
    guides: [],
  });
  assert.equal(summary.records, 2);
  assert.equal(summary.references, 1);
  assert.equal(summary.regions.find((r) => r.id === "africa")!.records, 2);
  assert.equal(summary.regions.find((r) => r.id === "europe")!.records, 1);
  assert.equal(
    summary.regions.find((r) => r.id === "africa")!.earliest,
    -6_998_050,
  );
  assert.match(
    summary.regions.find((r) => r.id === "africa")!.earliestLabel,
    /7–6 Ma.*Oldest fossil locality/,
  );
  assert.match(
    summary.regions.find((r) => r.id === "africa")!.earliestLabel,
    /mapped evidence/i,
  );
});

test("summary preserves undated records without inventing earliest dates and filters later records", () => {
  const undated = record("undated", -80, 30, [
    source("visible", "https://example.org/study"),
  ]);
  undated.time = { ...undated.time, kind: "unplaced", start: null, end: null };
  undated.sources.push(source("unused", "https://example.org/not-cited"));
  const later = record(
    "later",
    -80,
    30,
    [source("later", "https://example.org/later")],
    1901,
  );
  const d = world();
  d.evidence = [];
  d.taxa = [];
  d.sources = [];
  const summary = createWorldSummary({
    version: "test",
    records: [undated, later],
    europe: emptyEurope(),
    world: d,
    guides: [],
  });
  assert.equal(summary.records, 1);
  assert.equal(summary.references, 1);
  assert.equal(
    summary.regions.find((r) => r.id === "americas")!.earliest,
    null,
  );
  assert.match(
    summary.regions.find((r) => r.id === "americas")!.earliestLabel,
    /unknown/i,
  );
  assert.match(summary.method, /undated/i);
});

test("foundation region membership and real guide atlas membership determine regional coverage", () => {
  const d = world();
  d.evidence[0].regionIds = ["asia-pacific"];
  const summary = createWorldSummary({
    version: "test",
    records: [],
    europe: emptyEurope(),
    world: d,
    guides: [
      {
        id: "world-shared",
        atlasIds: ["africa", "europe"],
        sources: [
          { title: "Guide source", url: "https://guide.example/reference" },
        ],
      },
    ],
  });
  assert.equal(summary.guides, 1);
  assert.equal(summary.references, 2);
  assert.equal(
    summary.regions.find((r) => r.id === "asia-pacific")!.records,
    1,
  );
  assert.equal(summary.regions.find((r) => r.id === "africa")!.records, 0);
  assert.equal(summary.regions.find((r) => r.id === "africa")!.guides, 1);
  assert.equal(summary.regions.find((r) => r.id === "europe")!.references, 1);
  assert.equal(summary.regions.find((r) => r.id === "americas")!.references, 0);
});

test("combined validation permits cross-shard taxa and rejects conflicting source identities", () => {
  const a = world(),
    b = world();
  a.evidence = [];
  b.sources = [];
  b.taxa = [];
  assert.equal(mergeWorldShards([a, b]).evidence.length, 1);
  const conflict = world();
  conflict.evidence = [];
  conflict.taxa = [];
  conflict.sources[0].url = "https://other.example/study";
  assert.throws(() => mergeWorldShards([a, conflict]), /conflicting.*source/i);
  assert.throws(() => mergeWorldShards([]), /missing|empty/i);
});

test("historical studies retain dated territories and population source references across shards", () => {
  const d = world();
  d.sources.push(
    {
      id: "territory-source",
      title: "Territory study",
      url: "https://example.org/territory",
      access: "Open",
    },
    {
      id: "population-source",
      title: "Population study",
      url: "https://example.org/population",
      access: "Open",
    },
  );
  Object.assign(d.evidence[0], {
    start: 100,
    end: 200,
    population: [
      {
        year: 150,
        min: 100,
        max: 200,
        basis: "estimate",
        note: "Source range only",
        sourceIds: ["population-source"],
      },
    ],
  });
  const historical = Object.assign(d, {
    studies: [
      {
        id: "study-history",
        title: "Historical study",
        summary: "Dated map study",
        guideId: "world-study-history",
        regionIds: ["africa", "europe"],
        evidenceIds: ["early"],
        waveIds: [],
        territoryIds: ["territory"],
        start: 100,
        end: 200,
      },
    ],
    territories: [
      {
        id: "territory",
        title: "Approximate reach",
        start: 100,
        end: 200,
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [10, 40],
              [20, 40],
              [20, 50],
              [10, 40],
            ],
          ],
        },
        meaning: "campaign-reach",
        limits: "Schematic reconstruction",
        sourceIds: ["territory-source"],
        regionIds: ["europe"],
      },
    ],
  });
  const combined = mergeWorldShards([historical]) as typeof historical;
  assert.equal(combined.studies.length, 1);
  assert.equal(combined.territories.length, 1);
  const summary = createWorldSummary({
    version: "test",
    records: [],
    europe: emptyEurope(),
    world: combined,
    guides: [],
  });
  assert.equal(summary.records, 1);
  assert.equal(summary.references, 3);
  assert.equal(summary.regions.find((r) => r.id === "africa")!.references, 2);
  assert.equal(summary.regions.find((r) => r.id === "europe")!.references, 1);
  assert.deepEqual(summary.studies, [
    {
      id: "study-history",
      title: "Historical study",
      summary: "Dated map study",
      guideId: "world-study-history",
    },
  ]);
});
