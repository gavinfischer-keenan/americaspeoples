import { geoDistance, geoEquirectangular, geoOrthographic, type GeoProjection } from "d3-geo";
export type MapScope = "americas" | "pacific" | "atlantic" | "world";
export const DEFAULT_GLOBE_ROTATION: [number, number, number] = [-15, -22, 0];
export function globeProjection(
  width = 1000,
  height = 800,
  rotation: [number, number, number] = DEFAULT_GLOBE_ROTATION,
) {
  const radius = Math.max(120, Math.min(width, height) * 0.44);
  return geoOrthographic()
    .clipAngle(90)
    .precision(0.5)
    .rotate(rotation)
    .scale(radius)
    .translate([width / 2, height / 2]);
}

/** d3-geo point calls ignore clipAngle(); enforce spherical clipping for pins. */
export function projectPoint(
  projection: GeoProjection,
  point: readonly [number, number],
): [number, number] | null {
  const clip = projection.clipAngle?.();
  if (clip != null && Number.isFinite(clip) && clip > 0) {
    const [rx, ry] = projection.rotate();
    const maxRad = (clip * Math.PI) / 180;
    if (geoDistance([point[0], point[1]], [-rx, -ry]) > maxRad + 1e-6) {
      return null;
    }
  }
  return projection([point[0], point[1]]);
}
/** Pacific overview fits 95E–330E and 60S–80N in both wide and tall viewports.
 * Mainland departure regions and southern Australia must not be lost to aspect ratio. */
export function mapProjection(scope: MapScope = "pacific", width=1000, height=800) {
  // Keep the Americas near the center while retaining Australia and Pacific
  // arrivals at the left: the earliest scene must not play on an empty ocean.
  if(scope==='americas')return geoEquirectangular().rotate([110,0]).center([0,10])
    .scale(Math.min(width/(300*Math.PI/180),height/(140*Math.PI/180))).translate([width/2,height/2]);
  if(scope==='pacific')return geoEquirectangular().rotate([147.5,0]).center([0,10])
    .scale(Math.min(width/(235*Math.PI/180),height/(140*Math.PI/180)))
    .translate([width/2,height/2]);
  return geoEquirectangular()
    .rotate(
      scope === "atlantic"
          ? [40, 0]
          : scope === "world"
            ? [0, 0]
            : [100, 0],
    )
    .center([0, 15])
    .scale(
      (scope === "world"
          ? 155
          : scope === "atlantic"
            ? 280
            : 300) * width / 1000,
    )
    .translate([width/2, height/2]);
  // The SVG viewport clips after camera transforms. Pre-clipping here would
  // permanently discard geography that should enter the view during a pan.
}
