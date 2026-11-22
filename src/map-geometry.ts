import { geoCircle, geoPath, geoStream, type GeoProjection } from "d3-geo";
import type { DisplayRecord } from "./model";
import { projectPoint } from "./map-projection";

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
  lines: Point[][];
  areaRings: Point[][];
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
        r.overlay?.kind??null,
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
    const contextPoint = anchor ? projectPoint(this.projection, anchor) : null;
    const point =
      g?.type === "Point"
        ? contextPoint
        : !r.overlay && location
          ? projectPoint(this.projection, location)
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
    const projectLines=(shape:unknown):Point[][]=>{
      if(!shape)return [];
      const lines:Point[][]=[];let line:Point[]=[];
      geoStream(shape as any,this.projection.stream({point(x,y){line.push([x,y]);},lineStart(){line=[];},lineEnd(){if(line.length)lines.push(line);},polygonStart(){},polygonEnd(){},sphere(){}}));
      return lines;
    };
    const rawBounds = circle
      ? path.bounds(circle)
      : geometry
        ? path.bounds(geometry as any)
        : point && !r.overlay
          ? ([point, point] as Bounds)
          : null;
    const bounds: Bounds | null =
      rawBounds && rawBounds.flat().every(Number.isFinite) ? rawBounds : null;
    if(bounds&&!circle&&r.overlay&&['population-history','regional-evidence','environment','language'].includes(r.overlay.kind)){
      const padding=g?.type==='Point'?35:30;
      bounds[0]=[bounds[0][0]-padding,bounds[0][1]-padding];
      bounds[1]=[bounds[1][0]+padding,bounds[1][1]+padding];
    }
    return {
      point,
      path: geometry ? path(geometry as any) : null,
      areaPath: circle ? path(circle) : null,
      bounds,
      contextKey: anchor ? anchor.join(",") : null,
      contextPoint,
      // Unresolved lines are rendered as a single ? at their first endpoint.
      contextBounds: contextPoint ? [contextPoint, contextPoint] : null,
      lines: geometry?.type==='LineString'?projectLines(geometry):[],
      areaRings:circle?projectLines(circle):[],
    };
  }
}
