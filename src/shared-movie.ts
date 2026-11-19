import { geoInterpolate } from "d3-geo";
import { dateValue, sampleVoyage, type Voyage } from "./voyages";
import type { PlaybackIndex } from "./playback-index";
import { END_YEAR } from "./time";

export type MovieWindow = { start: number; end: number };
export const MOVIE_END_DATE=dateValue(`${END_YEAR}-12-31`);
/** Fixed atlas scope, independent of the viewer's zoom or camera. */
export function inAtlas(point: readonly number[]): boolean {
  const lon = (point[0] + 360) % 360;
  return (
    lon >= 95 - 1e-8 &&
    lon <= 330 + 1e-8 &&
    point[1] >= -60 - 1e-8 &&
    point[1] <= 80 + 1e-8
  );
}
const windowsCache = new WeakMap<Voyage, MovieWindow[]>();
export const inVoyageScope=(v:Voyage,point:readonly number[])=>v.scope==='global'||inAtlas(point);
/** Crossings are derived from schematic great-circle legs, not historical position logs. */
export function scopedVoyageWindows(v: Voyage): MovieWindow[] {
  const cached = windowsCache.get(v);
  if (cached) return cached;
  if(!v.stops.length || dateValue(v.stops[0].arrival)>MOVIE_END_DATE){
    windowsCache.set(v,[]);return [];
  }
  if(v.scope==='global'){
    const windows=[{start:dateValue(v.stops[0].arrival),end:Math.min(MOVIE_END_DATE,dateValue(v.stops.at(-1)!.departure))}];
    windowsCache.set(v,windows);return windows;
  }
  const pieces: MovieWindow[] = [];
  for (let i = 0; i < v.stops.length; i++) {
    const stop = v.stops[i],
      arrival = dateValue(stop.arrival),
      departure = dateValue(stop.departure);
    if (arrival>MOVIE_END_DATE)break;
    if (inAtlas(stop.coordinates))
      pieces.push({ start: arrival, end: departure });
    const next = v.stops[i + 1];
    if (!next) continue;
    if(stop.gapAfter)continue;
    const end = dateValue(next.arrival);
    if (end <= departure) continue;
    const interpolate = geoInterpolate(stop.coordinates, next.coordinates);
    let inside = inAtlas(interpolate(0)),
      start = inside ? 0 : null;
    for (let j = 1; j <= 128; j++) {
      const t = j / 128,
        nextInside = inAtlas(interpolate(t));
      if (nextInside !== inside) {
        let lo = (j - 1) / 128,
          hi = t;
        for (let k = 0; k < 40; k++) {
          const mid = (lo + hi) / 2;
          if (inAtlas(interpolate(mid)) === inside) lo = mid;
          else hi = mid;
        }
        if (nextInside) start = hi;
        else if (start !== null) {
          pieces.push({
            start: departure + start * (end - departure) + 1e-7,
            end: departure + lo * (end - departure) - 1e-7,
          });
          start = null;
        }
        inside = nextInside;
      }
    }
    if (start !== null)
      pieces.push({
        start: departure + start * (end - departure) + (start ? 1e-7 : 0),
        end,
      });
  }
  const merged: MovieWindow[] = [];
  for (const p of pieces) {
    if(p.start>MOVIE_END_DATE)continue;
    p.end=Math.min(p.end,MOVIE_END_DATE);
    const last = merged.at(-1);
    if (last && p.start <= last.end + 1e-9)
      last.end = Math.max(last.end, p.end);
    else merged.push({ ...p });
  }
  windowsCache.set(v, merged);
  return merged;
}
export const isPlayableVoyage=(voyage:Voyage):boolean=>scopedVoyageWindows(voyage).length>0;

/** Keep the original dates and notes for the stops already reached by the policy horizon. */
export const displayedVoyageStops=(voyage:Voyage)=>voyage.stops.filter(s=>dateValue(s.arrival)<=MOVIE_END_DATE);

/** A later anchor still defines the leg's interpolation but is not a displayed destination. */
export function sampleMapVoyage(voyage:Voyage,date:number){
  if(!Number.isFinite(date)||date>MOVIE_END_DATE)return null;
  const frame=sampleVoyage(voyage.stops,date);
  if(frame?.status==='traveling' && dateValue(voyage.stops[frame.leg+1].arrival)>MOVIE_END_DATE){
    return {...frame,stopName:'Under way from '+voyage.stops[frame.leg].name};
  }
  return frame;
}
export function scopedVoyageDate(v: Voyage, progress: number): number {
  const windows = scopedVoyageWindows(v);
  if (!windows.length) return NaN;
  if(progress>=1)return windows.at(-1)!.end;
  let remaining =
    Math.max(0, Math.min(1, progress)) *
    windows.reduce((n, w) => n + w.end - w.start, 0);
  for (const w of windows) {
    const duration = w.end - w.start;
    if (remaining <= duration) return w.start + remaining;
    remaining -= duration;
  }
  return windows.at(-1)!.end;
}
export function scopedVoyageProgress(v: Voyage, date: number): number {
  const windows = scopedVoyageWindows(v),
    total = windows.reduce((n, w) => n + w.end - w.start, 0);
  if (!total) return windows.length && date>=windows.at(-1)!.end ? 1 : 0;
  return (
    windows.reduce(
      (n, w) => n + Math.max(0, Math.min(date, w.end) - w.start),
      0,
    ) / total
  );
}
const arrivalCache = new WeakMap<readonly Voyage[], Map<string, number>>();
/** A chapter about an August arrival must reach August, not January 1.
 * Keep the shared day-level clock, so later events in that year remain future. */
export function storySceneDate(
 scene:{year:number;recordIds:readonly string[]},
 records:readonly {id:string;time?:{eventDate?:string};history?:{eventDate?:string}}[],
 voyages:readonly Voyage[],
):number {
 const ids=new Set(scene.recordIds);
 const dates=records.filter(r=>ids.has(r.id)).map(r=>r.time?.eventDate??r.history?.eventDate);
 for(const voyage of voyages)for(const stop of voyage.stops)if(stop.recordId&&ids.has(stop.recordId))dates.push(stop.arrival);
 return Math.max(scene.year,...dates.filter((d):d is string=>!!d).map(dateValue).filter(d=>Number.isFinite(d)&&Math.floor(d)===scene.year));
}
export function availableVoyageRecords<
  T extends {
    id: string;
    history?: { eventDate?: string };
    time?: { eventDate?: string };
  },
>(records: readonly T[], voyages: readonly Voyage[], date: number): T[] {
  let arrivals = arrivalCache.get(voyages);
  if (!arrivals) {
    arrivals = new Map();
    for (const v of voyages)
      for (const s of v.stops)
        if (s.recordId) arrivals.set(s.recordId, dateValue(s.arrival));
    arrivalCache.set(voyages, arrivals);
  }
  return records.filter((r) => {
    const onset = r.time?.eventDate ?? r.history?.eventDate;
    return (
      (!arrivals!.has(r.id) || arrivals!.get(r.id)! <= date) &&
      (!onset || !Number.isFinite(dateValue(onset)) || dateValue(onset) <= date)
    );
  });
}
/** Preserve event stops, including fractional itinerary arrivals, while advancing one global clock. */
export function advanceMovieClock(
  date: number,
  seconds: number,
  rate: number,
  index: PlaybackIndex,
  voyages: readonly Voyage[],
  smart: boolean,
  contextWindows:readonly {start:number;end:number}[]=[],
): { date: number; boundary: boolean } {
  const windows = [...voyages.flatMap((v) => scopedVoyageWindows(v)),...contextWindows];
  const traveling = windows.some((w) => date >= w.start && date < w.end);
  const effective = smart
    ? Math.min(
        rate,
        traveling ? 0.12 : date >= 1400 ? 1 : date >= 0 ? 20 : rate,
      )
    : rate;
  let target = Math.min(MOVIE_END_DATE, date + Math.max(0, seconds) * effective);
  const stop = index.advance(
    Math.floor(date),
    Math.max(0, Math.floor(target) - Math.floor(date)),
  );
  let boundary = false;
  if (stop.boundary && stop.year > date && stop.year <= target) {
    target = stop.year;
    boundary = true;
  }
  for (const w of windows)
    for (const edge of [w.start, w.end])
      if (edge > date + 1e-8 && edge <= target) {
        target = edge;
        boundary = true;
      }
  for (const v of voyages)
    for (const s of v.stops)
      for (const edge of [dateValue(s.arrival), dateValue(s.departure)])
        if (inVoyageScope(v,s.coordinates) && edge > date + 1e-8 && edge <= target) {
          target = edge;
          boundary = true;
        }
  return { date: target, boundary };
}
const fullGeometryCache = new WeakMap<
  Voyage,
  { type: "MultiLineString"; coordinates: number[][][] }
>();
/** Clip complete or elapsed schematic tracks to the fixed atlas scope. */
export function scopedVoyageGeometry(
  v: Voyage,
  until = Infinity,
): { type: "MultiLineString"; coordinates: number[][][] } {
  if (until === Infinity && fullGeometryCache.has(v))
    return fullGeometryCache.get(v)!;
  const coordinates: number[][][] = [];
  for (const w of scopedVoyageWindows(v)) {
    const end = Math.min(w.end, until);
    if (end < w.start) continue;
    const dates = [
      w.start,
      ...v.stops
        .flatMap((s) => [dateValue(s.arrival), dateValue(s.departure)])
        .filter((d) => d > w.start && d < end),
      end,
    ];
    let line: number[][] = [];
    for (let i = 0; i < dates.length; i++) {
      const d = dates[i],
        previous = dates[i - 1] ?? d;
      for (let j = 1; j <= 16; j++) {
        const frame = sampleVoyage(
          v.stops,
          previous + ((d - previous) * j) / 16,
        );
        if (frame && inVoyageScope(v,frame.coordinates)) line.push(frame.coordinates);
        else {if(line.length>1)coordinates.push(line);line=[];}
      }
    }
    if (line.length > 1) coordinates.push(line);
  }
  const geometry = { type: "MultiLineString" as const, coordinates };
  if (until === Infinity) fullGeometryCache.set(v, geometry);
  return geometry;
}

const dateCache = new WeakMap<
  object,
  { voyages: readonly Voyage[]; dates: number[] }
>();
export function datedContextKey(
  records: readonly {
    history?: { eventDate?: string };
    time?: { eventDate?: string };
  }[],
  voyages: readonly Voyage[],
  date: number,
): number {
  let cached = dateCache.get(records);
  if (!cached || cached.voyages !== voyages) {
    cached = {
      voyages,
      dates: [
        ...records.map((r) =>
          (r.time?.eventDate ?? r.history?.eventDate)
            ? dateValue((r.time?.eventDate ?? r.history?.eventDate)!)
            : NaN,
        ),
        ...voyages.flatMap((v) => v.stops.map((s) => dateValue(s.arrival))),
      ]
        .filter(Number.isFinite)
        .sort((a, b) => a - b),
    };
    dateCache.set(records, cached);
  }
  let lo = 0,
    hi = cached.dates.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (cached.dates[mid] <= date) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
