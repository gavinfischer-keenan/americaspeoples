import type { GeoProjection } from "d3-geo";

export interface TerrainTile {
  id: string;
  file: string;
  bounds: readonly [number, number, number, number];
  minZoom: number;
  source: string;
}

export const terrainTiles: TerrainTile[] = [
  {
    id: "earth",
    file: "natural-earth-relief.webp",
    bounds: [-180, -90, 180, 90],
    minZoom: 1,
    source: "Natural Earth II · global shaded relief",
  },

  {
    id: "hawaiian-islands",
    file: "hawaiian-islands.webp",
    bounds: [-160.5, 18.8, -154.7, 22.4],
    minZoom: 12,
    source: "USGS 3DEP · Hawaiian Islands relief",
  },

  {
    id: "oahu",
    file: "oahu.webp",
    bounds: [-158.35, 21.18, -157.62, 21.75],
    minZoom: 120,
    source: "USGS 3DEP · Oʻahu relief",
  },
  {
    id: "maui",
    file: "maui.webp",
    bounds: [-156.75, 20.5, -155.95, 21.08],
    minZoom: 120,
    source: "USGS 3DEP · Maui relief",
  },
  {
    id: "north-hawaii",
    file: "north-hawaii.webp",
    bounds: [-156.05, 19.9, -155.4, 20.28],
    minZoom: 120,
    source: "USGS 3DEP · northern Hawaiʻi relief",
  },
  {
    id: "four-corners",
    file: "four-corners.webp",
    bounds: [-110.5, 35, -106.5, 38.5],
    minZoom: 30,
    source: "USGS 3DEP · Four Corners relief",
  },

  {
    id: "chaco",
    file: "chaco.webp",
    bounds: [-108.03, 36, -107.88, 36.12],
    minZoom: 600,
    source: "USGS 3DEP · Chaco Canyon relief",
  },

  {
    id: "mesa-verde",
    file: "mesa-verde.webp",
    bounds: [-108.6, 37.1, -108.35, 37.4],
    minZoom: 350,
    source: "USGS 3DEP · Mesa Verde relief",
  },

  {
    id: "hovenweep",
    file: "hovenweep.webp",
    bounds: [-109.2, 37.3, -108.65, 37.7],
    minZoom: 250,
    source: "USGS 3DEP · Hovenweep and Canyons of the Ancients relief",
  },
];

/** Equirectangular raster registration; repeat across the projection seam. */

export function rasterRects(
  projection: GeoProjection,
  bounds: readonly [number, number, number, number],
) {
  const rotation = projection.rotate()[0],
    origin = projection([-rotation, 0])!,
    unit = (projection.scale() * Math.PI) / 180;

  const [west, south, east, north] = bounds,
    width = (east - west) * unit,
    height = (north - south) * unit;

  const x =
      origin[0] +
      (((((west + rotation + 180) % 360) + 360) % 360) - 180) * unit,
    y = origin[1] - north * unit;

  return [-1, 0, 1].map((wrap) => ({
    x: x + wrap * 360 * unit,
    y,
    width,
    height,
  }));
}

export type ViewBounds = readonly [
  readonly [number, number],
  readonly [number, number],
];

export function intersectsView(bounds: ViewBounds, view?: ViewBounds): boolean {
  return (
    !view ||
    (bounds[1][0] >= view[0][0] &&
      bounds[0][0] <= view[1][0] &&
      bounds[1][1] >= view[0][1] &&
      bounds[0][1] <= view[1][1])
  );
}

export function terrainHTML(
  projection: GeoProjection,
  zoom: number,
  view?: ViewBounds,
): string {
  const visible = terrainTiles
    .filter((tile) => zoom >= tile.minZoom)
    .map((tile) => {
      const rects = rasterRects(projection, tile.bounds).filter((r) =>
        intersectsView(
          [
            [r.x, r.y],
            [r.x + r.width, r.y + r.height],
          ],
          view,
        ),
      );

      return { tile, rects };
    });
  // A global raster becomes millions of screen pixels wide at building zoom.
  // Drop hidden coarse layers and bound each remaining image's painting surface
  // to the viewport, without changing its geographic registration.
  let coveringIndex = 0;
  if (view)
    visible.forEach(({ rects }, index) => {
      if (
        rects.some(
          (r) =>
            r.x <= view[0][0] &&
            r.y <= view[0][1] &&
            r.x + r.width >= view[1][0] &&
            r.y + r.height >= view[1][1],
        )
      )
        coveringIndex = index;
    });
  return visible
    .slice(Math.max(0, coveringIndex))
    .map(({ tile, rects }) => {
      const images = rects
        .map((r) => {
          const image = `<image href="terrain/${tile.file}" x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" preserveAspectRatio="none"/>`;
          if (!view) return image;
          const x = Math.max(r.x, view[0][0]),
            y = Math.max(r.y, view[0][1]);
          const width = Math.min(r.x + r.width, view[1][0]) - x;
          const height = Math.min(r.y + r.height, view[1][1]) - y;
          return `<svg class="terrain-crop" x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${x} ${y} ${width} ${height}" overflow="hidden">${image}</svg>`;
        })
        .join("");
      return images
        ? `<g class="terrain-tile" data-terrain="${tile.id}"><title>${tile.source}. Modern terrain reference; not a reconstruction for the map year.</title>${images}</g>`
        : "";
    })
    .join("");
}
