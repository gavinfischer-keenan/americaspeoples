import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

test("reference totals join DOI links to publisher DOI pages", async () => {
  const {sourceKey} = await world();
  assert.equal(sourceKey("https://doi.org/10.1038/s41586-023-06557-9"), sourceKey("https://www.nature.com/articles/s41586-023-06557-9.pdf"));
  assert.equal(sourceKey("https://doi.org/10.1073/pnas.1117620109"), sourceKey("https://www.pnas.org/doi/full/10.1073/pnas.1117620109"));
});

test("early Africa keeps the 15,000 BCE cutoff distinct from 15 ka BP", async () => {
  const { africaEarlyData, AFRICA_EARLY_END, worldRoute } = await world();
  const d = fixture();
  d.evidence.push({
    ...d.evidence[0],
    id: "later",
    start: 1950 - 15000,
    end: 1950 - 14000,
  });
  d.evidence.push({
    ...d.evidence[0],
    id: "boundary",
    start: -14999,
    end: -14999,
  });
  d.evidence.push({ ...d.evidence[0], id: "outside", regionIds: ["europe"] });
  const selected = africaEarlyData(d as any);
  assert.equal(AFRICA_EARLY_END, -14999);
  assert.deepEqual(
    selected.evidence.map((e) => e.id),
    ["old", "boundary"],
  );
  assert.equal(worldRoute("#atlas/africa/early"), "africa-early");
  assert.deepEqual(selected.territories, []);
});

async function world() {
  assert.ok(
    existsSync(new URL("../src/world-model.ts", import.meta.url)),
    "The world chronology model exists",
  );
  return import("../src/world-model");
}
const fixture = () => ({
  schemaVersion: 1,
  sources: [
    {
      id: "paper",
      title: "Dated evidence",
      url: "https://example.org/paper",
      access: "abstract",
    },
  ],
  taxa: [
    {
      id: "early",
      name: "Early lineage",
      meaning: "Related branch",
      status: "uncertain",
      note: "Placement debated",
      sourceIds: ["paper"],
    },
  ],
  evidence: [
    {
      id: "old",
      title: "Ancient evidence",
      taxonIds: ["early"],
      regionIds: ["africa"],
      kind: "fossil",
      start: -7000000,
      end: -6900000,
      dateLabel: "About 7 Ma",
      dateBasis: "Geological estimate",
      coordinates: [18, 16],
      summary: "A dated specimen.",
      limits: "No exact ancestor relationship.",
      sourceIds: ["paper"],
    },
  ],
  waves: [
    {
      id: "link",
      title: "Dispersal model",
      taxonIds: ["early"],
      regionIds: ["africa", "asia-pacific"],
      kind: "dispersal",
      start: -2000000,
      end: -1800000,
      dateLabel: "About 2 Ma",
      coordinates: [
        [35, 10],
        [44, 41],
      ],
      summary: "An inferred dispersal.",
      limits: "Schematic; no exact route.",
      sourceIds: ["paper"],
    },
  ],
});

test("deep-time chronology accepts earlier hominins but rejects an uncited or reversed interval", async () => {
  const { validateWorldData } = await world();
  assert.equal(validateWorldData(fixture()).evidence[0].start, -7000000);
  const missing = fixture();
  missing.evidence[0].sourceIds = ["absent"];
  assert.throws(() => validateWorldData(missing), /source/i);
  const reversed = fixture();
  reversed.waves[0].end = -2100000;
  assert.throws(() => validateWorldData(reversed), /date|interval/i);
  const wrong = fixture();
  wrong.evidence[0].taxonIds = ["invented"];
  assert.throws(() => validateWorldData(wrong), /taxon/i);
});
test("waves are active only inside inclusive date windows; earlier points stay explicitly historical", async () => {
  const { validateWorldData, worldAtYear } = await world();
  const d = validateWorldData(fixture());
  assert.equal(worldAtYear(d, -2000001, "world").waves.length, 0);
  assert.equal(worldAtYear(d, -2000000, "world").waves.length, 1);
  assert.equal(worldAtYear(d, -1800000, "world").waves.length, 1);
  assert.equal(worldAtYear(d, -1799999, "world").waves.length, 0);
  assert.equal(worldAtYear(d, -1800000, "europe").evidence.length, 0);
  assert.equal(worldAtYear(d, -1800000, "africa").evidence[0].phase, "earlier");
  assert.equal(worldAtYear(d, -6950000, "africa").evidence[0].phase, "dated");
  assert.equal(worldAtYear(d, 1901, "world").waves.length, 0);
});
test("regional reference totals deduplicate shared URLs and preserve deep ages", async () => {
  const { validateWorldData, worldRegionStats, worldSources } = await world();
  const f = fixture();
  f.sources.push({
    id: "paper-copy",
    title: "Same paper",
    url: "https://example.org/paper/",
    access: "abstract",
  });
  f.evidence[0].sourceIds.push("paper-copy");
  const d = validateWorldData(f);
  assert.equal(worldSources(d, ["paper", "paper-copy"]).length, 1);
  const s = worldRegionStats(d, "africa");
  assert.equal(s.references, 1);
  assert.equal(s.earliest, -7000000);
  assert.equal(worldRegionStats(d, "europe").earliest, null);
});
test("new world routes are exact and preserve old explicit region/bookmark routes", async () => {
  const { worldRoute, worldDates } = await world();
  assert.equal(worldRoute(""), "world");
  assert.equal(worldRoute("#world"), "world");
  assert.equal(worldRoute("#origins"), "origins");
  assert.equal(worldRoute("#atlas/africa"), "africa");
  assert.equal(worldRoute("#atlas/asia-pacific"), "asia-pacific");
  assert.equal(worldRoute("#origins/europe"), "europe");
  for (const hash of [
    "#movie",
    "#explore",
    "#atlas/europe",
    "#atlas/africa/extra",
    "#origins?year=1",
  ])
    assert.equal(worldRoute(hash), null);
  assert.deepEqual(
    worldDates(fixture() as any, "africa"),
    [-7000000, -6900000, -6899999, -2000000, -1800000, -1799999, 1900],
  );
});

test("historical studies bind real evidence and never invent populations or territorial dates", async () => {
  const { validateWorldData, worldRoute } = await world();
  const f: any = fixture();
  f.evidence[0].population = [
    {
      year: -6950000,
      min: 10,
      max: 20,
      basis: "estimate",
      note: "Test observation",
      sourceIds: ["paper"],
    },
  ];
  f.studies = [
    {
      id: "journey",
      title: "A documented journey",
      summary: "Bounded study",
      guideId: "world-journey",
      regionIds: ["africa"],
      evidenceIds: ["old"],
      waveIds: ["link"],
      territoryIds: [],
      start: -7000000,
      end: 1900,
    },
  ];
  assert.equal(validateWorldData(f).studies?.length, 1);
  assert.equal(worldRoute("#study/journey"), "study:journey");
  f.studies[0].evidenceIds = ["made-up"];
  assert.throws(() => validateWorldData(f), /study|evidence/i);
  f.studies[0].evidenceIds = ["old"];
  f.evidence[0].population[0].min = -2;
  assert.throws(() => validateWorldData(f), /population/i);
});

test("playback visits population observations, then resets their dated sizes", async () => {
  const { worldDates, worldRegionStats } = await world();
  const f: any = fixture();
  f.sources.push({
    id: "population",
    title: "Population",
    url: "https://example.org/population",
    access: "Open",
  });
  f.sources.push({
    id: "border",
    title: "Boundary",
    url: "https://example.org/border",
    access: "Open",
  });
  Object.assign(f.evidence[0], {
    start: 100,
    end: 200,
    population: [
      {
        year: 150,
        min: 100,
        max: 200,
        basis: "estimate",
        note: "One observation",
        sourceIds: ["population"],
      },
    ],
  });
  f.waves = [];
  f.territories = [
    {
      id: "area",
      title: "Area",
      start: 125,
      end: 175,
      regionIds: ["africa"],
      sourceIds: ["border"],
    },
  ];
  assert.deepEqual(
    worldDates(f, "africa"),
    [100, 125, 150, 151, 175, 176, 200, 201, 1900],
  );
  assert.equal(worldRegionStats(f, "africa").references, 3);
});

test("territory rendering accepts standard GeoJSON winding without filling its complement", async () => {
  const { worldGeometryForD3 } = await world();
  const { geoArea } = await import("d3-geo");
  const g: any = {
    type: "Polygon",
    coordinates: [
      [
        [10, 40],
        [20, 40],
        [20, 50],
        [10, 50],
        [10, 40],
      ],
      [
        [12, 42],
        [12, 44],
        [14, 44],
        [14, 42],
        [12, 42],
      ],
    ],
  };
  const original = JSON.stringify(g),
    fixed = worldGeometryForD3(g);
  assert.ok(geoArea(fixed) < 0.1);
  assert.ok(geoArea(fixed) > 0);
  assert.deepEqual(worldGeometryForD3(fixed), fixed);
  assert.equal(JSON.stringify(g), original);
  assert.equal(
    geoArea(
      worldGeometryForD3({
        type: "MultiPolygon",
        coordinates: [g.coordinates],
      }),
    ),
    geoArea(fixed),
  );
});
