import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { readEuropeData } from "../scripts/europe-build";
import { createWorldSummary, mergeWorldShards } from "../scripts/world-build";
import { readWorldGuides } from "../scripts/world-guide-data";
import { worldGuideHTML } from "../scripts/world-guide-build";
import { historyState } from "../src/history";
import type { EvidenceRecord, MapRecord } from "../src/model";
import { dataset } from "../src/published-data";
import { topics } from "../src/topic-dives";
import { validateDataset, validateRecord } from "../src/validation";
import { worldMapLayout } from "../src/world-guide-model";
import type { WorldData } from "../src/world-model";

const ROOT = path.resolve(import.meta.dirname, "..");
const loadJson = <T>(rel: string): T =>
  JSON.parse(readFileSync(path.join(ROOT, rel), "utf8")) as T;

const NEW_GUIDE_IDS = [
  "world-global-genetic-drift-divergence",
  "world-archaic-interbreeding-introgression",
  "world-americas-trade-before-100ce",
];

test("Americas pre-100 CE trade expansion validates, enters #topic/trade, and avoids protected DOI", () => {
  const { records } = loadJson<{ records: EvidenceRecord[] }>("data/americas-pre100ce-trade-expansion-records.json");
  assert.ok(records.length >= 58, `Expected >= 58 records, got ${records.length}`);

  for (const r of records) {
    assert.deepEqual(validateRecord(r), [], r.id);
    assert.equal(r.history?.kind, "exchange", r.id);
    assert.equal(r.overlay?.kind, "trade", r.id);
    assert.equal(r.overlay?.geometry?.type, "LineString", r.id);
    assert.ok(r.location && r.destination, r.id);
    assert.ok(r.time.start !== null && r.time.end !== null && r.time.start <= r.time.end && r.time.end <= 100, r.id);
    assert.ok(r.sources.every((s) => s.doi !== "10.1371/journal.pone.0250840"), r.id);
  }

  assert.deepEqual(validateDataset(dataset), []);
  const datasetIds = new Set(dataset.records.map((r) => r.id));
  for (const r of records) assert.ok(datasetIds.has(r.id), `${r.id} missing from dataset`);

  const trade = topics.find((t) => t.id === "trade")!;
  for (const r of records) assert.ok(trade.recordIds.includes(r.id), `${r.id} missing from #topic/trade`);

  const scenesFile = loadJson<{
    scenes: { id: string; year: number; recordIds: string[] }[];
  }>("data/americas-pre100ce-trade-scenes.json");
  assert.equal(scenesFile.scenes.length, 5);
  for (const sc of scenesFile.scenes) {
    for (const rid of sc.recordIds) {
      const rec = dataset.records.find((r) => r.id === rid)!;
      assert.equal(historyState(rec as MapRecord, sc.year), "active", `${sc.id}/${rid}`);
    }
  }
});

test("world shard adds >=12 Americas pre-100 CE trade waves and >=24 global genetics pins", async () => {
  const shards = readdirSync(path.join(ROOT, "data/world"))
    .filter((n) => n.endsWith(".json"))
    .sort()
    .map((n) => loadJson<WorldData>(`data/world/${n}`));
  const merged = mergeWorldShards(shards);

  const amWaves = merged.waves.filter((w) => w.id.startsWith("amtr-wave-"));
  const genEv = merged.evidence.filter((e) => e.id.startsWith("gdr-"));
  const genWaves = merged.waves.filter((w) => w.id.startsWith("gdr-wave-"));

  assert.ok(amWaves.length >= 12, `Expected >= 12 Americas pre-100 CE waves, got ${amWaves.length}`);
  for (const w of amWaves) {
    assert.ok(w.regionIds.includes("americas") && w.kind === "trade" && w.end <= 100, w.id);
  }
  assert.ok(genEv.length >= 24, `Expected >= 24 global genetics pins, got ${genEv.length}`);
  assert.ok(genWaves.length >= 10, `Expected >= 10 genetics dispersal/admixture waves, got ${genWaves.length}`);

  const linked = new Set(merged.evidence.map((e) => e.guideId).filter(Boolean));
  for (const gid of NEW_GUIDE_IDS) {
    assert.ok(linked.has(gid), `No evidence pin links to ${gid}`);
  }

  const allGuides = await readWorldGuides();
  const europe = await readEuropeData();
  const summary = createWorldSummary({
    version: dataset.version,
    records: dataset.records,
    europe,
    world: merged,
    guides: allGuides,
  });
  assert.ok(summary.guides >= 152, `Expected >= 152 total guides, got ${summary.guides}`);
});

test("expanded world-human-family and 3 new Deep Dives validate with media and terrain maps", async () => {
  const media = loadJson<{ assets: { id: string; guideIds: string[] }[] }>("data/world-guide-media.json");
  assert.equal(media.assets.length, 182);
  const covered = new Set(media.assets.flatMap((a) => a.guideIds));

  const allGuides = await readWorldGuides();
  const whf = allGuides.find((g) => g.id === "world-human-family")!;
  assert.ok(whf.sections.length >= 17, `Expected >= 17 sections in world-human-family, got ${whf.sections.length}`);
  assert.ok(
    whf.sections.some((s) => /Aboriginal Australians/i.test(s.heading)),
    "world-human-family missing Australia divergence section",
  );
  assert.ok(whf.relatedGuideIds?.includes("world-global-genetic-drift-divergence"));
  assert.ok(whf.relatedGuideIds?.includes("world-archaic-interbreeding-introgression"));

  const land = { type: "FeatureCollection" as const, features: [] };
  for (const gid of NEW_GUIDE_IDS) {
    const g = allGuides.find((x) => x.id === gid)!;
    assert.ok(g, `Missing guide ${gid}`);
    assert.ok(g.sections.length >= 4, `${gid} sections=${g.sections.length}`);
    assert.ok((g.relatedGuideIds?.length ?? 0) >= 2, `${gid} relatedGuideIds missing`);
    assert.ok(covered.has(gid), `${gid} missing media asset`);
    assert.ok(existsSync(path.join(ROOT, "data/guide-terrain", `${gid}.webp`)), `${gid} missing terrain webp`);
    const layout = worldMapLayout(g);
    assert.ok(layout.height >= 400 && layout.height <= 1400, `${gid} height=${layout.height}`);
    const html = worldGuideHTML(g, allGuides, land);
    assert.match(html, /<h2>The whole area in view<\/h2>/);
  }
});
