import { test } from "node:test";
import assert from "node:assert/strict";
import { temporalOpacity } from "../src/time";
import { validateOverlay } from "../src/overlays";
import { fixture } from "./fixtures";
test("cultural reach is explicitly schematic and requires a bounded geographic radius", () => {
  const o = {
    kind: "cultural-reach",
    basis: "schematic",
    geometry: { type: "Point", coordinates: [-109, 37] },
    radiusKm: 150,
    precision: "Illustrative envelope, not a boundary",
    provenance: "Cited regional interpretation",
  };
  assert.deepEqual(validateOverlay(o), []);
  assert.ok(validateOverlay({ ...o, radiusKm: 0 }).length);
  assert.ok(validateOverlay({ ...o, basis: "documented" }).length);
  assert.ok(
    validateOverlay({
      ...o,
      geometry: {
        type: "LineString",
        coordinates: [
          [-109, 37],
          [-108, 36],
        ],
      },
    }).length,
  );
});

test("temporal fading stays inside bounds and reaches full support only at a certain core", () => {
  const t = { ...fixture().time, certainStart: 120, certainEnd: 180 };
  assert.equal(temporalOpacity(t, 99), 0);
  assert.equal(temporalOpacity(t, 201), 0);
  assert.ok(temporalOpacity(t, 100) < temporalOpacity(t, 110));
  assert.ok(temporalOpacity(t, 110) < temporalOpacity(t, 120));
  assert.equal(temporalOpacity(t, 150), 1);
  assert.ok(temporalOpacity(t, 190) < temporalOpacity(t, 180));
  assert.equal(temporalOpacity(fixture().time, 100), 1);
});
test("approximate windows fade symmetrically but never assert certainty", () => {
  const t = {
    ...fixture().time,
    kind: "occurrence" as const,
    approximate: true,
  };
  assert.ok(temporalOpacity(t, 100) < temporalOpacity(t, 125));
  assert.equal(temporalOpacity(t, 125), temporalOpacity(t, 175));
  assert.ok(temporalOpacity(t, 150) < 1);
  assert.ok(temporalOpacity({ ...t, start: 150, end: 150 }, 150) > 0);
  assert.equal(
    temporalOpacity({ ...t, kind: "unplaced", start: null, end: null }, 150),
    0,
  );
});
test("regional and genomic schematic overlays accept only sourced broad connections", () => {
  for (const kind of [
    "population-history",
    "regional-evidence",
    "environment",
  ]) {
    const o = {
      kind,
      basis: "schematic",
      geometry: {
        type: "LineString",
        coordinates: [
          [-155, 65],
          [-125, 45],
        ],
      },
      precision: "Illustrative region, not route or confidence interval",
      provenance: "Source section and broad regional interpretation",
    };
    assert.deepEqual(validateOverlay(o), []);
    assert.ok(
      validateOverlay({
        ...o,
        geometry: {
          type: "LineString",
          coordinates: [
            [-155, 65],
            [-140, 55],
            [-125, 45],
          ],
        },
      }).length,
    );
  }
});

import {reviewHTML} from '../src/review';
import {dataset} from '../src/published-data';
test('unlocated or undated evidence explains why map navigation is unavailable',()=>{
 const r=fixture();r.location=null;
 assert.match(reviewHTML(r,dataset),/data-action="locate" disabled/);
 assert.match(reviewHTML(r,dataset),/Not mapped — date or location unresolved/);
});
