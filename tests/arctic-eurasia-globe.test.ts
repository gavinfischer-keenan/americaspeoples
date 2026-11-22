import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dataset } from "../src/published-data";
import { globeProjection, projectPoint } from "../src/map-projection";
import { mergeWorldShards } from "../scripts/world-build";
import { inWorldScope } from "../src/world-model";

test("Baffin Island and Far North Canada expansion adds 36 primary-sourced records <= 1900 CE", async () => {
  const raw = JSON.parse(
    await readFile("data/baffin-high-arctic-expansion-records.json", "utf8"),
  );
  assert.equal(raw.records.length, 36);
  const byId = new Map(dataset.records.map((r) => [r.id, r]));
  for (const r of raw.records) {
    const published = byId.get(r.id);
    assert.ok(published, `Missing published Arctic record: ${r.id}`);
    assert.ok(published.location, `Missing coordinates: ${r.id}`);
    assert.ok(
      published.time.start !== null &&
        published.time.end !== null &&
        published.time.end <= 1900,
      `Invalid calendar bound <= 1900 on ${r.id}`,
    );
    assert.ok(published.sources.length >= 1, `Missing sources on ${r.id}`);
  }
  for (const expectedId of [
    "baffin-button-point-bylot",
    "baffin-nunguvik-navy-board",
    "baffin-kinngait-cape-dorset",
    "arctic-igloolik-alarnerk-kapuivik",
    "arctic-port-refuge-devon",
    "arctic-skraeling-bache-ellesmere",
    "arctic-qariaraqyuk-somerset",
    "arctic-kitigaaryuit-mackenzie",
  ]) {
    assert.ok(byId.has(expectedId), `Missing flagship Arctic Canada site: ${expectedId}`);
  }
});

test("Arctic Russia, Tibet/Himalaya, Gobi/Interior China, and SE Asia monastery shards merge cleanly", async () => {
  const files = (await readdir("data/world"))
    .filter((f) => f.endsWith(".json"))
    .sort();
  const shards = await Promise.all(
    files.map(async (f) => JSON.parse(await readFile(`data/world/${f}`, "utf8"))),
  );
  const data = mergeWorldShards(shards);
  const rusx = data.evidence.filter((e) => e.id.startsWith("rusx-"));
  const tibh = data.evidence.filter((e) => e.id.startsWith("tibh-"));
  const gchm = data.evidence.filter((e) => e.id.startsWith("gchm-"));
  const seat = data.evidence.filter((e) => e.id.startsWith("seat-"));

  assert.ok(rusx.length >= 40, `Expected >= 40 rusx-* records, got ${rusx.length}`);
  assert.ok(tibh.length >= 30, `Expected >= 30 tibh-* records, got ${tibh.length}`);
  assert.ok(gchm.length >= 40, `Expected >= 40 gchm-* records, got ${gchm.length}`);
  assert.ok(seat.length >= 16, `Expected >= 16 seat-* records, got ${seat.length}`);

  for (const item of [...rusx, ...tibh, ...gchm, ...seat]) {
    assert.ok(!inWorldScope(item, "africa"), `Unexpected africa scope leak on ${item.id}`);
    assert.ok(item.end <= 1900 && item.start <= item.end, `Bad dates on ${item.id}`);
    assert.ok(item.sourceIds.length >= 1, `Missing sourceIds on ${item.id}`);
  }
  for (const titleNeedle of [
    "Zhokhov Island",
    "Solovetsky",
    "Mangazeya",
    "Whale Bone Alley",
    "Quesang",
    "Gurugyam",
    "Burzahom",
    "Tabo",
    "Bayanzag",
    "Khara-Khoto",
    "Sanxingdui",
    "Yungang Grottoes",
    "Mount Wutai",
    "Angkor Wat",
    "Sambor Prei Kuk",
    "Si Thep",
  ]) {
    assert.ok(
      data.evidence.some((e) => e.title.includes(titleNeedle)),
      `Missing expected world site: ${titleNeedle}`,
    );
  }
});

test("globeProjection projects front-hemisphere points finitely and clips back-hemisphere points", () => {
  const proj = globeProjection(1000, 800, [0, 0, 0]);
  const front = projectPoint(proj, [0, 0]);
  const back = projectPoint(proj, [180, 0]);
  assert.ok(front && Number.isFinite(front[0]) && Number.isFinite(front[1]));
  assert.equal(back, null);
});
