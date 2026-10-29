import { geoEquirectangular } from "d3-geo";
export type MapScope = "americas" | "pacific";
/** Combined frame spans approximately 100E to 330E, centered on 145W.
 * The dateline stays continuous; Africa, Iceland and eastern Greenland are cropped. */
export function mapProjection(scope: MapScope = "pacific") {
  return geoEquirectangular()
    .rotate(scope === "pacific" ? [145, 0] : [100, 0])
    .center([0, 15])
    .scale(scope === "pacific" ? 245 : 300)
    .translate([500, 400])
    .clipExtent([[0, 0], [1000, 800]]);
}
