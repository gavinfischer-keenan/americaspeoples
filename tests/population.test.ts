import { test } from "node:test";
import assert from "node:assert/strict";
import {
  populationAt,
  populationRadius,
  validatePopulation,
} from "../src/population";
import { fixture } from "./fixtures";
import { dataset } from "../src/published-data";
test("published named settlements remain separate and Cahokia phase boundary changes size", () => {
  const sites = dataset.records.filter((r) => r.id.startsWith("hovenweep-"));
  assert.equal(sites.length, 9);
  assert.equal(new Set(sites.map((r) => r.location?.id)).size, 9);
  assert.ok(
    sites.every(
      (r) =>
        r.location &&
        !r.overlay &&
        r.location.provenance &&
        r.location.precision,
    ),
  );
  const r = dataset.records.find((r) => r.id === "cahokia-urban")!;
  assert.ok(populationAt([r], 1099).radius > populationAt([r], 1100).radius);
  assert.equal(populationAt([r], 1201).unknown, true);
});
test("unknown population shares smallest band but is explicitly unknown", () => {
  const p = populationAt([fixture()], 150);
  assert.equal(p.radius, populationRadius(500));
  assert.equal(p.unknown, true);
  assert.match(p.label, /Unknown population/);
});
test("dated resident estimates change size without inventing growth or summing duplicate sources", () => {
  const r = fixture();
  r.population = [
    {
      start: 100,
      end: 120,
      min: 100,
      max: 200,
      claimId: r.claims[0].id,
      scope: "Residents of the named settlement",
    },
    {
      start: 180,
      end: 200,
      min: 2500,
      max: 10000,
      claimId: r.claims[0].id,
      scope: "Residents",
    },
  ];
  assert.equal(populationAt([r], 150).unknown, true);
  assert.ok(populationAt([r], 190).radius > populationAt([r], 110).radius);
  assert.deepEqual(populationAt([r, r], 190), populationAt([r], 190));
  assert.deepEqual(validatePopulation(r), []);
  r.population[0].claimId = "nonexistent";
  assert.ok(validatePopulation(r).length);
});
test("population range spans bands without a false midpoint", () => {
  const r = fixture();
  r.population = [
    {
      start: 100,
      end: 200,
      min: 400,
      max: 600,
      claimId: r.claims[0].id,
      scope: "Residents",
    },
  ];
  const p = populationAt([r], 150);
  assert.equal(p.radius, 5);
  assert.equal(p.outerRadius, 7);
  assert.equal(p.unknown, false);
});
