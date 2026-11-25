import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { readEuropeData } from "../scripts/europe-build";
import { createWorldSummary, mergeWorldShards } from "../scripts/world-build";
import { readWorldGuides } from "../scripts/world-guide-data";
import { worldGuideHTML } from "../scripts/world-guide-build";
import type { EvidenceRecord } from "../src/model";
import { dataset } from "../src/published-data";
import { isPacificPoint } from "../src/region-partition";
import { validateDataset, validateRecord } from "../src/validation";
import { worldMapLayout } from "../src/world-guide-model";
import type { WorldData } from "../src/world-model";

const ROOT = path.resolve(import.meta.dirname, "..");
const loadJson = <T>(rel: string): T =>
  JSON.parse(readFileSync(path.join(ROOT, rel), "utf8")) as T;

test("Australia and Pacific expansion shards validate cleanly inside isPacificPoint", () => {
  const aus = loadJson<{ records: EvidenceRecord[] }>(
    "data/australia-deep-history-expansion-records.json",
  );
  const pac = loadJson<{ records: EvidenceRecord[] }>(
    "data/pacific-islands-systematic-expansion-records.json",
  );
  assert.ok(aus.records.length >= 70, `Expected >= 70 Aus records, got ${aus.records.length}`);
  assert.ok(pac.records.length >= 55, `Expected >= 55 Pac records, got ${pac.records.length}`);

  const combined = [...aus.records, ...pac.records];
  for (const r of combined) {
    assert.deepEqual(validateRecord(r), [], r.id);
    assert.ok(r.location && isPacificPoint([r.location.lon, r.location.lat]), `${r.id} not in isPacificPoint`);
    assert.ok(r.sources.every((s) => /^https:\/\//.test(s.url)), `${r.id} non-https source`);
    assert.ok(r.time.end === null || r.time.end <= 1900, `${r.id} end > 1900`);
  }

  const exchanges = combined.filter((r) => r.history?.kind === "exchange");
  assert.ok(exchanges.length >= 16, `Expected >= 16 mapped exchange corridors, got ${exchanges.length}`);
  for (const r of exchanges) {
    assert.equal(r.overlay?.kind, "trade", r.id);
    assert.equal(r.overlay?.geometry?.type, "LineString", r.id);
    assert.ok(r.destination !== null, r.id);
  }

  const settlements = combined.filter((r) => r.history?.kind === "settlement");
  assert.ok(settlements.length >= 5, `Expected >= 5 settlements, got ${settlements.length}`);

  assert.deepEqual(validateDataset(dataset), []);
});

test("comprehensive Pacific world shard merges with world catalogue and meets summary targets", async () => {
  const shards = readdirSync(path.join(ROOT, "data/world"))
    .filter((n) => n.endsWith(".json"))
    .sort()
    .map((n) => loadJson<WorldData>(`data/world/${n}`));
  const merged = mergeWorldShards(shards);
  const pev = merged.evidence.filter((e) => e.regionIds.includes("pacific"));
  const pwv = merged.waves.filter((w) => w.regionIds.includes("pacific"));
  assert.ok(pev.length >= 80, `Expected >= 80 Pacific world evidence, got ${pev.length}`);
  assert.ok(pwv.length >= 28, `Expected >= 28 Pacific world waves, got ${pwv.length}`);
  assert.ok(pwv.some((w) => w.kind === "trade"), "Missing trade wave");
  assert.ok(pwv.some((w) => w.kind === "campaign"), "Missing campaign wave");
  assert.ok(pwv.some((w) => w.kind === "dispersal"), "Missing dispersal wave");
  assert.ok(
    pev.some((e) => e.taxonIds.includes("homo-floresiensis")),
    "Missing Homo floresiensis Pacific world record",
  );

  const allGuides = await readWorldGuides();
  const europe = await readEuropeData();
  const summary = createWorldSummary({
    version: dataset.version,
    records: dataset.records,
    europe,
    world: merged,
    guides: allGuides,
  });
  const pacSummary = summary.regions.find((r) => r.id === "pacific")!;
  assert.ok(pacSummary.guides >= 19, `pacific guides=${pacSummary.guides}`);
  assert.ok(pacSummary.references >= 948, `pacific references=${pacSummary.references}`);
  assert.ok(pacSummary.records >= 786, `pacific records=${pacSummary.records}`);
});

test("all 12 Australia & Pacific deep dive guides validate and render with >= 3 sections", async () => {
  const pack = loadJson<{ guides: { id: string }[] }>(
    "data/atlases/pacific/pacific-australia-deep-dives.json",
  );
  assert.equal(pack.guides.length, 12);

  const allGuides = await readWorldGuides();
  const packIds = new Set(pack.guides.map((g) => g.id));
  const valid = allGuides.filter((g) => packIds.has(g.id));
  assert.equal(valid.length, 12);
  const land = { type: "FeatureCollection" as const, features: [] };
  for (const g of valid) {
    assert.ok(g.atlasIds.includes("pacific"), g.id);
    assert.ok(g.sections.length >= 3, `${g.id} sections=${g.sections.length}`);
    assert.ok((g.relatedGuideIds?.length ?? 0) >= 2, `${g.id} relatedGuideIds missing`);
    const layout = worldMapLayout(g);
    assert.ok(layout.height >= 599 && layout.height <= 1201, `${g.id} height=${layout.height}`);
    const html = worldGuideHTML(g, allGuides, land);
    assert.match(html, /<h2>The whole area in view<\/h2>/);
  }
});
