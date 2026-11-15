import test from "node:test";
import assert from "node:assert/strict";
import { mapProjection } from "../src/map-projection";
import { rasterRects, terrainHTML } from "../src/terrain";
test("topographic rasters register with map coordinates across Pacific recentering", () => {
  for (const scope of ["americas", "pacific", "world"] as const) {
    const projection = mapProjection(scope),
      bbox = [-108.03, 36, -107.88, 36.12] as const;
    const rects = rasterRects(projection, bbox);
    const point = projection([-107.96, 36.06])!;
    const rect = rects.find(
      (r) => point[0] >= r.x && point[0] <= r.x + r.width,
    )!;
    assert.ok(rect);
    assert.ok(
      Math.abs(
        (point[0] - rect.x) / rect.width -
          (-107.96 - bbox[0]) / (bbox[2] - bbox[0]),
      ) < 1e-8,
    );
    assert.ok(
      Math.abs(
        (point[1] - rect.y) / rect.height -
          (bbox[3] - 36.06) / (bbox[3] - bbox[1]),
      ) < 1e-8,
    );
  }
});
test("local terrain is zoom sensitive and offscreen tiles return when the camera moves", () => {
  const p = mapProjection("americas"),
    chaco = p([-107.96, 36.06])!,
    mesa = p([-108.5, 37.2])!;
  const box = (xy: number[]) =>
    [
      [xy[0] - 0.1, xy[1] - 0.1],
      [xy[0] + 0.1, xy[1] + 0.1],
    ] as const;
  assert.doesNotMatch(terrainHTML(p, 1, box(chaco)), /data-terrain="chaco"/);
  assert.match(terrainHTML(p, 1500, box(chaco)), /data-terrain="chaco"/);
  assert.doesNotMatch(
    terrainHTML(p, 1500, box(chaco)),
    /data-terrain="mesa-verde"/,
  );
  assert.match(terrainHTML(p, 1500, box(mesa)), /data-terrain="mesa-verde"/);
});

test("deep terrain draws only the visible crop and omits fully covered coarse relief", () => {
  const p = mapProjection("americas"),
    point = p([-107.96, 36.06])!;
  const view = [
    [point[0] - 0.1, point[1] - 0.1],
    [point[0] + 0.1, point[1] + 0.1],
  ] as const;
  const local = terrainHTML(p, 1500, view);
  assert.doesNotMatch(local, /data-terrain="earth"/);
  assert.match(local, /<svg[^>]+class="terrain-crop"/);
  const ocean = p([-140, 0])!;
  const fallback = terrainHTML(p, 65536, [
    [ocean[0] - 0.01, ocean[1] - 0.01],
    [ocean[0] + 0.01, ocean[1] + 0.01],
  ]);
  assert.match(fallback, /data-terrain="earth"/);
  assert.match(fallback, /<svg[^>]+class="terrain-crop"/);
  assert.doesNotMatch(fallback, /data-terrain="chaco"/);
});
