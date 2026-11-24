import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { geoArea } from "d3-geo";
import { mergeWorldShards } from "../scripts/world-build";
import { dataset } from "../src/published-data";
import { validateWorldData, worldGeometryForD3, type WorldData } from "../src/world-model";

const ROOT = path.resolve(import.meta.dirname, "..");

function loadAllWorldShards(): WorldData {
  const dir = path.join(ROOT, "data", "world");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && f !== "world-catalogue.json" && f !== "world-summary.json")
    .sort();
  return mergeWorldShards(
    files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as WorldData),
  );
}

test("regional polity territories cover >= 50 Asian and African state snapshots with valid D3 winding", () => {
  const shard = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "world", "regional-polity-territories.json"), "utf8"),
  ) as WorldData;
  const territories = shard.territories ?? [];
  assert.ok(territories.length >= 50, `Expected >= 50 territories, got ${territories.length}`);
  assert.ok(territories.some((t) => t.regionIds.includes("africa")));
  assert.ok(territories.some((t) => t.regionIds.includes("asia-pacific")));
  for (const t of territories) {
    assert.ok(t.end <= 1900 && t.start <= t.end, `Invalid interval on ${t.id}`);
    const fixed = worldGeometryForD3(t.geometry);
    const area = geoArea(fixed);
    assert.ok(area > 0 && area < 1.5, `Unexpected spherical geoArea ${area} on ${t.id}`);
  }
});

test("dated city populations span asia-pacific, africa, and pacific within bounds", () => {
  const world = validateWorldData(loadAllWorldShards());
  const withPop = world.evidence.filter((e) => e.population && e.population.length > 0);
  assert.ok(withPop.length >= 22, `Expected >= 22 population records, got ${withPop.length}`);
  const scopes = new Set<string>();
  for (const e of withPop) {
    for (const r of e.regionIds) scopes.add(r);
    for (const p of e.population!) {
      assert.ok(p.year >= e.start && p.year <= e.end, `${e.id} pop year ${p.year} out of [${e.start}, ${e.end}]`);
      assert.ok(p.min > 0 && p.min <= p.max, `${e.id} invalid pop range`);
    }
  }
  assert.ok(scopes.has("asia-pacific"), "Expected asia-pacific city populations");
  assert.ok(scopes.has("africa"), "Expected africa city populations");
  assert.ok(scopes.has("pacific"), "Expected pacific city populations");
});

test("1501-1900 cliff shard and regional thin-spot shard populate target eras and regions", () => {
  const em16 = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "world", "early-modern-asia-africa-1501-1900.json"), "utf8"),
  ) as WorldData;
  assert.ok(em16.evidence.length >= 55, `Expected >= 55 em16 records, got ${em16.evidence.length}`);
  for (const e of em16.evidence) {
    assert.ok(e.start >= 1501 && e.end <= 1900, `${e.id} outside 1501-1900`);
  }

  const rts = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "world", "regional-thin-spots-coverage.json"), "utf8"),
  ) as WorldData;
  assert.ok(rts.evidence.length >= 90, `Expected >= 90 rts records, got ${rts.evidence.length}`);
  for (const e of rts.evidence) {
    assert.ok(e.end <= 1900, `${e.id} exceeds 1900`);
  }
});

test("western amazon pre-0 CE records load cleanly in canonical published dataset", () => {
  const wama = dataset.records.filter((r) => r.id.startsWith("wama-"));
  assert.equal(wama.length, 6);
  for (const r of wama) {
    assert.ok(r.time.start !== null && r.time.start < 0, `Expected pre-0 CE start on ${r.id}, got ${r.time.start}`);
  }
});
