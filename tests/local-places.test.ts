import test from "node:test";
import assert from "node:assert/strict";
import { dataset } from "../src/published-data";
import { historyState } from "../src/history";
import { stories } from "../src/stories";

const find = (id: string) => {
  const r = dataset.records.find((r) => r.id === id);
  assert.ok(r, `Missing ${id}`);
  return r;
};
test("Chaco has separate, located great houses, not only a regional marker", () => {
  const ids = [
    "pueblo-bonito",
    "una-vida",
    "chetro-ketl",
    "pueblo-del-arroyo",
    "pueblo-alto",
    "new-alto",
    "kin-kletso",
    "casa-chiquita",
    "penasco-blanco",
    "tsin-kletsin",
    "wijiji",
  ];
  const points = ids.map((id) => find("site-chaco-" + id));
  assert.equal(
    new Set(points.map((r) => JSON.stringify(r.location))).size,
    ids.length,
  );
  for (const r of points) {
    assert.ok(r.location);
    assert.ok(!r.overlay);
    assert.notEqual(historyState(r, 1150), "outside");
    assert.match(r.location.provenance, /National Park Service/);
  }
  const bonito = find("site-chaco-pueblo-bonito");
  assert.ok(Math.abs(bonito.location!.lon + 107.961636) < 0.00001);
  assert.ok(Math.abs(bonito.location!.lat - 36.060579) < 0.00001);
  assert.equal(historyState(find("site-chaco-kin-kletso"), 1100), "outside");
  const story = stories.find((s) => s.id === "chaco-connections")!;
  assert.ok(story.scenes[0].zoom >= 600);
  assert.ok(story.scenes.at(-1)!.zoom >= 600);
});
test("Mesa Verde appears before the late cliff dwellings and keeps phases separate", () => {
  const early = find("site-mesa-step-house-pithouses"),
    late = find("site-mesa-step-house-masonry");
  assert.equal(historyState(early, 700), "active");
  assert.equal(historyState(late, 700), "outside");
  assert.equal(historyState(late, 1250), "active");
  const pithouses = find("site-mesa-badger-house-early");
  assert.equal(pithouses.location!.name, "Basketmaker Pithouses");
  assert.equal(pithouses.location!.lat, 37.189002);
  assert.equal(find("site-mesa-sun-temple").history!.kind, "settlement");
  for (const id of [
    "cliff-palace",
    "balcony-house",
    "spruce-tree-house",
    "long-house",
    "far-view-house",
  ])
    assert.ok(find("site-mesa-" + id).location);
});
test("individual mound and Mesoamerican/Andean places have sourced coordinates and chronology", () => {
  for (const id of [
    "ocmulgee-earth-lodge",
    "ocmulgee-great-temple",
    "tikal",
    "palenque",
    "copan",
    "monte-alban",
    "chan-chan",
    "tiwanaku",
  ]) {
    const r = find("site-" + id);
    assert.ok(r.location && !r.overlay);
    assert.ok(r.sources.length >= 1);
    assert.ok(r.time.start! <= r.time.end!);
    assert.match(r.location.provenance, /https:/);
  }
});
