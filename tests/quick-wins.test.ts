import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { mergeWorldShards } from "../scripts/world-build";
import { readEuropeData } from "../scripts/europe-build";
import { worldGuides, relatedWorldGuidesFor } from "../src/world-guides";
import { exploreRecords } from "../src/explore";
import { adaptWorldDataForExplore, adaptEuropeDataForExplore } from "../src/explore-world";
import { milestoneAtlasLinks } from "../src/physical-links";
import type { DisplayRecord } from "../src/model";
import type { WorldData } from "../src/world-model";
import type { EuropeData } from "../src/europe-data";
import { dataset } from "../src/published-data";

// Assemble catalogues from source data with the build's own merge functions,
// so these checks do not depend on a prior `npm run build` (dist/ is not in git).
const worldCatalogue = (): WorldData =>
  mergeWorldShards(
    readdirSync("data/world")
      .filter((n) => n.endsWith(".json"))
      .sort()
      .map((n) => JSON.parse(readFileSync(`data/world/${n}`, "utf8"))),
  );

test("all World Deep Dives are reachable from map pins or related guide links", async () => {
  const world = worldCatalogue();
  const europe: { evidence: EuropeData } = { evidence: await readEuropeData() };

  const linkedIds = new Set<string>();
  for (const e of world.evidence) if (e.guideId) linkedIds.add(e.guideId);
  for (const s of world.studies ?? []) if (s.guideId) linkedIds.add(s.guideId);
  for (const e of europe.evidence.entries) if (e.guideId) linkedIds.add(e.guideId);

  const checkIds = [
    ...dataset.records.map((r) => r.id),
    ...world.evidence.map((e) => e.id),
    ...europe.evidence.entries.map((e) => e.id),
  ];
  for (const id of checkIds) {
    for (const g of relatedWorldGuidesFor(id)) linkedIds.add(g.id);
  }

  const unlinked = worldGuides.filter((g) => !linkedIds.has(g.id)).map((g) => g.id);
  assert.deepEqual(unlinked, [], `Unlinked world guides remain: ${unlinked.join(", ")}`);
});

test("Explore deduplicates canonicalRecordId Europe duplicates and verified World equivalents", async () => {
  const world = worldCatalogue();
  const europe: { evidence: EuropeData } = { evidence: await readEuropeData() };
  const existing = new Set(dataset.records.map((r) => r.id));

  const worldAdapted = adaptWorldDataForExplore(world, existing);
  assert.equal(worldAdapted.some((r) => r.id === "world:apea-lake-mungo-willandra"), false);
  assert.equal(worldAdapted.some((r) => r.id === "world:wreck-mary-rose"), false);
  assert.equal(worldAdapted.some((r) => r.id === "world:wreck-cape-gelidonya"), false);
  assert.equal(worldAdapted.some((r) => r.id === "world:spread-madjedbebe-occupation"), false);

  for (const r of worldAdapted) existing.add(r.id);
  const europeAdapted = adaptEuropeDataForExplore(europe.evidence, existing);
  assert.equal(europeAdapted.some((r) => r.id === "europe:eu-ee-korolevo-oldest-europe"), false);
  assert.equal(europeAdapted.some((r) => r.id === "europe:eu-deep-na-reykjavik-longhouse"), false);
});

test("exploreRecords hides shipwrecks when hideWrecks is enabled unless category is wrecks", () => {
  const mk = (id: string, title: string, kind?: "wreck" | "settlement"): DisplayRecord =>
    ({
      id,
      title,
      culture: { id: "c", name: "People", kind: "people", color: "#fff" },
      location: { id: "l", name: "Here", lon: 0, lat: 0, precision: "", provenance: "" },
      destination: null,
      routeKind: "schematic",
      revision: 1,
      type: kind ? "event" : "occurrence",
      time: { kind: "interval", start: 1600, end: 1650, approximate: true, original: "1600", method: "", interpretation: "" },
      ...(kind ? { history: { kind, claimId: "c1" } } : {}),
      claims: [],
      sources: [],
      review: { summary: title, limitations: "", discussion: "", provenance: "", reviewedAt: "2026-11-23", history: [], relatedIds: [] },
    }) as unknown as DisplayRecord;

  const list = [mk("a", "Settlement site", "settlement"), mk("b", "Sunken wreck", "wreck")];
  assert.equal(exploreRecords(list, list, { query: "", category: "all", hideWrecks: false }).length, 2);
  assert.deepEqual(
    exploreRecords(list, list, { query: "", category: "all", hideWrecks: true }).map((r) => r.id),
    ["a"],
  );
  assert.deepEqual(
    exploreRecords(list, list, { query: "", category: "wrecks", hideWrecks: true }).map((r) => r.id),
    ["b"],
  );
});

test("every paleoclimate milestone has Explore and related atlas links", () => {
  const paleo = JSON.parse(readFileSync("data/paleoclimate-series.json", "utf8")) as {
    milestones: { id: string }[];
  };
  for (const m of paleo.milestones) {
    const links = milestoneAtlasLinks(m.id);
    assert.ok(links, `Missing links for milestone ${m.id}`);
    assert.match(links.exploreHref, /^#explore\?from=-?\d+&to=-?\d+&wrecks=0$/);
    assert.ok(links.related.length >= 2);
  }
});

test("static guide pages cross-link to Explore and Climate in page body", () => {
  const worldHtml = readFileSync("sites/world-stonehenge.html", "utf8");
  assert.match(worldHtml, /class="atlas-crosslinks"/);
  assert.match(worldHtml, /#explore\?/);
  assert.match(worldHtml, /#physical/);

  const siteHtml = readFileSync("sites/chaco.html", "utf8");
  assert.match(siteHtml, /class="atlas-crosslinks"/);
  assert.match(siteHtml, /#explore\?/);
  assert.match(siteHtml, /#physical/);
});
