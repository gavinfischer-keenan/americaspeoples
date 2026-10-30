import { test } from "node:test";
import assert from "node:assert/strict";
import { fixture } from "./fixtures";
import { MapGeometry } from "../src/map-geometry";
import { mapProjection } from "../src/map-projection";
import { boundsInViewport } from "../src/map-filters";

test("context visibility uses its rendered first endpoint rather than a line extent", () => {
  const r = fixture();
  r.overlay = {
    kind: "regional-evidence",
    basis: "schematic",
    geometry: {
      type: "LineString",
      coordinates: [
        [-100, 40],
        [-80, 40],
      ],
    },
    precision: "test",
    provenance: "test",
  };
  const cache = new MapGeometry(mapProjection());
  cache.update([r]);
  const shape = cache.get(r),
    end = mapProjection()([-80, 40])!;
  const scale = 64,
    tx = 500 - end[0] * scale,
    ty = 400 - end[1] * scale;
  assert.equal(boundsInViewport(shape.bounds!, scale, tx, ty), true);
  assert.equal(boundsInViewport(shape.contextBounds!, scale, tx, ty), false);
  assert.deepEqual(shape.contextPoint, mapProjection()([-100, 40]));
});

test("geometry survives year-only updates but changes when coordinates or projection change", () => {
  const r = fixture();
  const cache = new MapGeometry(mapProjection());
  cache.update([r]);
  const first = cache.get(r);
  cache.update([r]);
  assert.equal(cache.get(r), first);
  r.location!.lon = -90;
  cache.update([r]);
  const moved = cache.get(r);
  assert.notEqual(moved, first);
  assert.notDeepEqual(moved.point, first.point);
  cache.setProjection(mapProjection("americas"));
  cache.update([r]);
  assert.notDeepEqual(cache.get(r).point, moved.point);
});

test("overlay bounds and paths invalidate for in-place coordinate and radius changes", () => {
  const r = fixture();
  r.overlay = {
    kind: "cultural-reach",
    basis: "schematic",
    geometry: { type: "Point", coordinates: [-100, 40] },
    radiusKm: 100,
    precision: "test",
    provenance: "test",
  };
  const cache = new MapGeometry(mapProjection());
  cache.update([r]);
  const first = cache.get(r);
  r.overlay.radiusKm = 200;
  cache.update([r]);
  assert.notEqual(cache.get(r).areaPath, first.areaPath);
  const second = cache.get(r);
  r.overlay.geometry!.coordinates[0] = -90;
  cache.update([r]);
  assert.notDeepEqual(cache.get(r).bounds, second.bounds);
});

test("an unmapped overlay does not borrow an ordinary site descriptor", () => {
  const site = fixture(),
    overlay = fixture();
  overlay.overlay = {
    kind: "trade",
    basis: "unmapped",
    geometry: null,
    precision: "test",
    provenance: "test",
  };
  const cache = new MapGeometry(mapProjection());
  cache.update([site, overlay]);
  assert.ok(cache.get(site).bounds);
  assert.equal(cache.get(overlay).bounds, null);
});
