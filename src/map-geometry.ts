import { geoCircle, geoPath, type GeoProjection } from "d3-geo";
import type { DisplayRecord } from "./model";

type Point = [number, number];
type Bounds = [Point, Point];
export interface ProjectedRecord {
  point: Point | null;
  path: string | null;
  areaPath: string | null;
  bounds: Bounds | null;
  contextKey: string | null;
  contextPoint: Point | null;
  contextBounds: Bounds | null;
}

/** Projection-only boundary: no dates, filters, DOM or source interpretation.
 * Refresh descriptors on update, fingerprinting coordinates to detect even in-place
 * proposal edits. Reuse D3 paths/bounds across years; discard departed geometry so
 * the cache stays bounded by the current map records. Pan changes no projection.
 */
export class MapGeometry {
  private cached = new Map<string, ProjectedRecord>();
  private records = new WeakMap<DisplayRecord, ProjectedRecord>();
  constructor(private projection: GeoProjection) {}
  setProjection(projection: GeoProjection) {
    this.projection = projection;
    this.cached.clear();
    this.records = new WeakMap();
  }
  update(records: DisplayRecord[]) {
    const next = new Map<string, ProjectedRecord>();
    this.records = new WeakMap();
    for (const r of records) {
      const key = JSON.stringify([
        !!r.overlay,
        r.overlay?.geometry ?? null,
        r.overlay?.radiusKm ?? null,
        r.location ? [r.location.lon, r.location.lat] : null,
        r.type === "movement" && r.destination
          ? [r.destination.lon, r.destination.lat]
          : null,
      ]);
      const shape = next.get(key) ?? this.cached.get(key) ?? this.project(r);
      next.set(key, shape);
      this.records.set(r, shape);
    }
    this.cached = next;
  }
  get(record: DisplayRecord): ProjectedRecord {
    const shape = this.records.get(record);
    if (!shape)
      throw new Error("Map geometry must be prepared before rendering.");
    return shape;
  }
  private project(r: DisplayRecord): ProjectedRecord {
    const path = geoPath(this.projection),
      g = r.overlay?.geometry;
    const location: Point | null = r.location
      ? [r.location.lon, r.location.lat]
      : null;
    const anchor: Point | null =
      g?.type === "Point"
        ? g.coordinates
        : g?.type === "LineString"
          ? g.coordinates[0]
          : location;
    const contextPoint = anchor ? this.projection(anchor) : null;
    const point =
      g?.type === "Point"
        ? contextPoint
        : !r.overlay && location
          ? this.projection(location)
          : null;
    const geometry =
      g ??
      (!r.overlay && r.type === "movement" && location && r.destination
        ? {
            type: "LineString" as const,
            coordinates: [location, [r.destination.lon, r.destination.lat]],
          }
        : null);
    const circle =
      g?.type === "Point" && r.overlay?.radiusKm
        ? geoCircle()
            .center(g.coordinates)
            .radius(((r.overlay.radiusKm / 6371) * 180) / Math.PI)()
        : null;
    // Point symbols use their centers, matching the original viewport rule.
    const pointInFrame =
      point &&
      point[0] >= 0 &&
      point[0] <= 1000 &&
      point[1] >= 0 &&
      point[1] <= 800;
    const bounds = circle
      ? path.bounds(circle)
      : geometry
        ? path.bounds(geometry as any)
        : pointInFrame
          ? ([point, point] as Bounds)
          : null;
    return {
      point,
      path: geometry ? path(geometry as any) : null,
      areaPath: circle ? path(circle) : null,
      bounds,
      contextKey: anchor ? anchor.join(",") : null,
      contextPoint,
      // Unresolved lines are rendered as a single ? at their first endpoint.
      contextBounds: contextPoint ? [contextPoint, contextPoint] : null,
    };
  }
}
