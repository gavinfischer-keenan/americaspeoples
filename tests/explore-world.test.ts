import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  adaptEuropeDataForExplore,
  adaptWorldDataForExplore,
  exploreSourceMeta,
  filterByDateRange,
} from "../src/explore-world";
import { validateWorldData, type WorldData } from "../src/world-model";
import type { EuropeData } from "../src/europe-data";
import { dataset } from "../src/published-data";

test("adapts global world and Europe catalogues for Explore without ID collisions", () => {
  const ancestors = validateWorldData(
    JSON.parse(readFileSync("data/world/ancestors.json", "utf8")) as WorldData,
  );
  const europe: EuropeData = {
    schemaVersion: 1,
    regions: [{ id: "mediterranean", title: "Mediterranean" }],
    sources: [
      {
        id: "src-knossos",
        title: "Knossos Bronze Age stratigraphy",
        url: "https://example.org/knossos",
        authors: "Evans et al.",
        year: 2020,
      },
    ],
    entries: [
      {
        id: "eu-knossos",
        regionId: "mediterranean",
        title: "Knossos — Minoan palace complex",
        category: "habitation",
        kind: "interval",
        start: -2000,
        end: -1400,
        approximate: true,
        dateLabel: "c. 2000–1400 BCE",
        dateMeaning: "Architectural phases.",
        coordinates: [25.163, 35.298],
        place: "Knossos, Crete",
        summary: "Minoan court-centered complex.",
        detail: "Multi-period Bronze Age complex.",
        uncertainty: "Phase boundaries remain refined.",
        sourceIds: ["src-knossos"],
        guideId: "world-human-family",
      },
    ],
  };

  const existingIds = new Set(dataset.records.map((r) => r.id));
  const worldRecords = adaptWorldDataForExplore(ancestors, existingIds);
  for (const r of worldRecords) existingIds.add(r.id);
  const europeRecords = adaptEuropeDataForExplore(europe, existingIds);

  const graecopithecus = worldRecords.find(
    (r) => r.id === "world:family-graecopithecus",
  );
  const toumai = worldRecords.find(
    (r) => r.id === "world:family-toros-menalla",
  );
  assert.ok(graecopithecus, "Graecopithecus adapted into Explore");
  assert.ok(toumai, "Toros-Menalla adapted into Explore");
  assert.equal(graecopithecus.time.start, -7238050);
  assert.ok(toumai.time.start! <= -6800000);
  assert.ok(europeRecords.length > 0, "Europe entries adapted into Explore");

  const meta = exploreSourceMeta(toumai);
  assert.ok(meta, "Explore source metadata exists for adapted world records");
  assert.equal(meta.regionHref, "#atlas/africa");
  assert.ok(meta.sources.length > 0);

  const euMeta = exploreSourceMeta(europeRecords[0]);
  assert.ok(euMeta);
  assert.equal(euMeta.regionHref, "#atlas/europe");
  assert.ok(euMeta.sources.length > 0);
});

test("filterByDateRange reveals early hominins chronologically and gates undated context", () => {
  const ancestors = validateWorldData(
    JSON.parse(readFileSync("data/world/ancestors.json", "utf8")) as WorldData,
  );
  const worldRecords = adaptWorldDataForExplore(ancestors, new Set());
  const combined = [...worldRecords, ...dataset.records];
  const fullMin = -7238050;
  const fullMax = 1900;

  const earlyWindow = filterByDateRange(
    combined,
    fullMin,
    -98050,
    fullMin,
    fullMax,
    true,
  );
  assert.ok(
    earlyWindow.dated.some((r) => r.id === "world:family-graecopithecus"),
    "Includes ~7.24 Ma Graecopithecus in earliest window",
  );
  assert.ok(
    earlyWindow.dated.some((r) => r.id === "world:family-toros-menalla"),
    "Includes ~7.0 Ma Toumai in earliest window",
  );
  assert.equal(
    earlyWindow.dated.some((r) => r.id === "r6-te-bakoa"),
    false,
    "Excludes ~2000 BP Te Bakoa ovens from early Pleistocene window",
  );
  assert.equal(
    earlyWindow.context.length,
    0,
    "Excludes unplaced undated context when range is narrowed",
  );

  const allTime = filterByDateRange(
    combined,
    fullMin,
    fullMax,
    fullMin,
    fullMax,
    true,
  );
  assert.ok(
    allTime.dated.some((r) => r.id === "r6-te-bakoa"),
    "Includes dated Te Bakoa when window spans to 1900 CE",
  );
  assert.ok(
    allTime.context.length > 20,
    "Includes unplaced context records in full all-time view when undated toggle is on",
  );
});
