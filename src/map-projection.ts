import { geoEquirectangular } from "d3-geo";
export type MapScope = "americas" | "pacific" | "atlantic" | "world";
/** Combined frame spans approximately 100E to 330E, centered on 145W.
 * The dateline stays continuous; Africa, Iceland and eastern Greenland are cropped. */
export function mapProjection(scope: MapScope = "pacific", width=1000, height=800) {
  return geoEquirectangular()
    .rotate(
      scope === "pacific"
        ? [145, 0]
        : scope === "atlantic"
          ? [40, 0]
          : scope === "world"
            ? [0, 0]
            : [100, 0],
    )
    .center([0, 15])
    .scale(
      (scope === "pacific"
        ? 245
        : scope === "world"
          ? 155
          : scope === "atlantic"
            ? 280
            : 300) * width / 1000,
    )
    .translate([width/2, height/2]);
  // The SVG viewport clips after camera transforms. Pre-clipping here would
  // permanently discard geography that should enter the view during a pan.
}
