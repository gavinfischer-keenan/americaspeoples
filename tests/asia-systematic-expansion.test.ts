import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { readEuropeData } from "../scripts/europe-build";
import { createWorldSummary, mergeWorldShards } from "../scripts/world-build";
import { readWorldGuides } from "../scripts/world-guide-data";
import { worldGuideHTML } from "../scripts/world-guide-build";
import { dataset } from "../src/published-data";
import { worldMapLayout } from "../src/world-guide-model";
import type { WorldData } from "../src/world-model";

const ROOT = path.resolve(import.meta.dirname, "..");
const loadJson = <T>(rel: string): T =>
  JSON.parse(readFileSync(path.join(ROOT, rel), "utf8")) as T;

const EXPECTED_ASIA_GUIDES = [
  "world-russia-siberia-paleolithic-steppe",
  "world-russia-rus-muscovy-culture",
  "world-russia-siberian-rivers-fur-tea",
  "world-great-wall-of-china",
  "world-china-dynastic-capitals-canal",
  "world-mongolia-steppe-empires-culture",
  "world-japan-shogunate-samurai",
  "world-japan-historic-castles",
  "world-korea-kingdoms-fortresses",
  "world-himalaya-tea-horse-road",
  "world-central-asia-oases-steppes",
  "world-southeast-asia-maritime-spice",
];

test("asia systematic shard merges cleanly, covers trade/campaign routes, and raises asia-pacific summary", async () => {
  const shards = readdirSync(path.join(ROOT, "data/world"))
    .filter((n) => n.endsWith(".json"))
    .sort()
    .map((n) => loadJson<WorldData>(`data/world/${n}`));
  const merged = mergeWorldShards(shards);

  const asxEvidence = merged.evidence.filter((e) => e.id.startsWith("asx-"));
  const asxWaves = merged.waves.filter((w) => w.id.startsWith("asx-wave-"));
  const asxSources = merged.sources.filter((s) => s.id.startsWith("asx-src-"));

  assert.ok(asxEvidence.length >= 220, `Expected >= 220 new Asia evidence pins, got ${asxEvidence.length}`);
  assert.ok(asxWaves.length >= 25, `Expected >= 25 new Asia waves, got ${asxWaves.length}`);
  assert.ok(asxSources.length >= 150, `Expected >= 150 verified DOI sources, got ${asxSources.length}`);

  for (const e of asxEvidence) {
    assert.ok(e.regionIds.includes("asia-pacific"), e.id);
    assert.ok(e.start <= e.end && e.end <= 1900, `${e.id}: ${e.start}..${e.end}`);
    assert.ok(e.sourceIds.length >= 1, e.id);
  }
  for (const w of asxWaves) {
    assert.ok(w.regionIds.includes("asia-pacific"), w.id);
    assert.ok(w.start <= w.end && w.end <= 1900, `${w.id}: ${w.start}..${w.end}`);
    assert.ok(w.coordinates.length >= 2, w.id);
  }
  for (const s of asxSources) {
    assert.match(s.url, /^https:\/\/doi\.org\/10\./, s.id);
  }

  assert.ok(asxWaves.some((w) => w.kind === "trade" && /Tea Horse/i.test(w.title)));
  assert.ok(asxWaves.some((w) => w.kind === "trade" && /Grand Canal/i.test(w.title)));
  assert.ok(asxWaves.some((w) => w.kind === "trade" && /Kiakhta/i.test(w.title)));
  assert.ok(asxWaves.some((w) => w.kind === "trade" && /Maluku|Spice/i.test(w.title)));
  assert.ok(asxWaves.some((w) => w.kind === "campaign" && /Imjin War/i.test(w.title)));

  const linkedGuides = new Set(asxEvidence.map((e) => e.guideId).filter(Boolean));
  for (const gid of EXPECTED_ASIA_GUIDES) {
    assert.ok(linkedGuides.has(gid), `No evidence pin links to ${gid}`);
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
  const asia = summary.regions.find((r) => r.id === "asia-pacific")!;
  assert.ok(asia.guides >= 72, `Expected >= 72 asia-pacific guides, got ${asia.guides}`);
  assert.ok(asia.records >= 900, `Expected >= 900 asia-pacific records, got ${asia.records}`);
});

test("all 12 new Asia Deep Dive guides validate, have media, and have shaded terrain webp maps", async () => {
  const pack = loadJson<{ guides: { id: string }[] }>(
    "data/atlases/asia-pacific/asia-systematic-deep-dives.json",
  );
  assert.deepEqual(
    pack.guides.map((g) => g.id),
    EXPECTED_ASIA_GUIDES,
  );

  const media = loadJson<{ assets: { id: string; guideIds: string[] }[] }>("data/world-guide-media.json");
  const coveredByMedia = new Set(media.assets.flatMap((a) => a.guideIds));

  const allGuides = await readWorldGuides();
  const packIds = new Set(EXPECTED_ASIA_GUIDES);
  const loaded = allGuides.filter((g) => packIds.has(g.id));
  assert.equal(loaded.length, 12);

  const land = { type: "FeatureCollection" as const, features: [] };
  for (const g of loaded) {
    assert.ok(g.atlasIds.includes("asia-pacific"), g.id);
    assert.ok(g.sections.length >= 4, `${g.id} sections=${g.sections.length}`);
    assert.ok((g.relatedGuideIds?.length ?? 0) >= 2, `${g.id} missing relatedGuideIds`);
    assert.ok(coveredByMedia.has(g.id), `${g.id} missing media entry in data/world-guide-media.json`);
    assert.ok(existsSync(path.join(ROOT, "data/guide-terrain", `${g.id}.webp`)), `${g.id} missing .webp terrain`);
    const layout = worldMapLayout(g);
    assert.ok(layout.height >= 400 && layout.height <= 1400, `${g.id} height=${layout.height}`);
    const html = worldGuideHTML(g, allGuides, land);
    assert.match(html, /<h2>The whole area in view<\/h2>/);
  }
});
