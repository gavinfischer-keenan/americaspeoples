import type iceArchive from "../data/ice-snapshots.json";
import type hazardArchive from "../data/hazard-events.json";
import type { IceIndexEntry } from "./api-contracts";
import type { EvidenceRecord } from "./model";
import { getJSON, pages, manifest } from "./client-data";
import { LatestRequestCache } from "./latest-request-cache";
import { openHazardDate, isUncertainHazard } from "./physical-rules";
import {iceBracket,interpolateIce} from './ice-interpolation';
import type {IceGeometry} from './ice-geometry';

export type HazardEvent = (typeof hazardArchive.events)[number];
type IceSnapshot = (typeof iceArchive.snapshots)[number];
export let hazardEvents: HazardEvent[] = [];
export let physicalRevision = 0;
export let physicalState: "idle" | "loading" | "ready" | "error" = "idle";
const listeners = new Set<() => void>();
const emit = () => {
  for (const listener of listeners) listener();
};
export function onPhysicalChange(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
let iceIndex: IceIndexEntry[] = [];
let catalogLoad: Promise<void> | undefined;
const fullHazards = new Map<string, HazardEvent>();
const hazardLoads = new Map<string, Promise<HazardEvent>>();
const eventCache = new Map<string, HazardEvent[]>();
const timeCache = new Map<string, Pick<EvidenceRecord, "time">[]>();
const iceCache = new LatestRequestCache<IceSnapshot>((key) =>
  getJSON("/api/ice/" + key),
);
let lastIceLoadState=iceCache.state();
iceCache.subscribe(()=>{
  const state=iceCache.state();
  // Optional neighbor downloads do not change the visible frame. Avoid tearing
  // down the SVG merely because a future animation frame became available.
  if(state!==lastIceLoadState){lastIceLoadState=state;emit();}
});
export interface IceFrame {
  scenario:string;ageCalBP:number;olderAge:number;youngerAge:number;
  geometry:IceGeometry;interpolated:boolean;held:boolean;key:string;
}
const iceFrames=new Map<string,IceFrame>();
let lastIceFrame:IceFrame|null=null;

function changedCatalog() {
  physicalRevision++;
  eventCache.clear();
  timeCache.clear();
  emit();
}
/** Test/editor fixture injection; production only initializes from the pinned API. */
export function setPhysicalData(
  hazards: typeof hazardArchive,
  ice: typeof iceArchive,
) {
  hazardEvents = hazards.events;
  iceFrames.clear();lastIceFrame=null;
  iceIndex = ice.snapshots.map((s) => ({
    scenario: s.scenario,
    ageCalBP: s.ageCalBP,
  }));
  for (const snapshot of ice.snapshots)
    iceCache.seed(snapshot.scenario + "/" + snapshot.ageCalBP, snapshot);
  physicalState = "ready";
  changedCatalog();
}
/** A failed climate catalog must not prevent the evidence atlas from mounting.
 * Publish all pages atomically, so partial data never means "no events". */
export function initializePhysical(): Promise<void> {
  if (catalogLoad) return catalogLoad;
  iceIndex = manifest.iceIndex;
  physicalState = "loading";
  emit();
  catalogLoad = pages<HazardEvent>("/api/hazards/index")
    .then((events) => {
      hazardEvents = events;
      physicalState = "ready";
      changedCatalog();
    })
    .catch(() => {
      physicalState = "error";
      emit();
    })
    .finally(() => {
      catalogLoad = undefined;
    });
  return catalogLoad;
}
export function fullHazard(id: string): Promise<HazardEvent> {
  let request = hazardLoads.get(id);
  if (!request) {
    request = getJSON<HazardEvent>("/api/hazards/" + encodeURIComponent(id))
      .then((event) => {
        fullHazards.set(id, event);
        return event;
      })
      .catch((error) => {
        hazardLoads.delete(id);
        throw error;
      });
    hazardLoads.set(id, request);
  }
  return request;
}
export function hazardDetail(id: string) {
  return fullHazards.get(id);
}
/** Nearest source anchor, for callers checking dataset availability. */
export function iceTarget(year: number, scenario = "optimal") {
  const age = 1950 - year,
    all = iceIndex.filter((s) => s.scenario === scenario);
  if (
    !all.length ||
    age < Math.min(...all.map((s) => s.ageCalBP)) ||
    age > Math.max(...all.map((s) => s.ageCalBP))
  )
    return null;
  return all.reduce((best, s) =>
    Math.abs(s.ageCalBP - age) < Math.abs(best.ageCalBP - age) ? s : best,
  );
}
export function requestIce(year: number, scenario: string) {
  const bracket=iceBracket(iceIndex,year,scenario);
  if(!bracket){lastIceFrame=null;iceCache.request(null);lastIceLoadState=iceCache.state();return;}
  const key=(age:number)=>scenario+'/'+age;
  const ages=iceIndex.filter(s=>s.scenario===scenario).map(s=>s.ageCalBP);
  const neighbors=[bracket.youngerAge-500,bracket.olderAge+500].filter(age=>ages.includes(age));
  iceCache.requestGroup([...new Set([bracket.olderAge,bracket.youngerAge])].map(key),neighbors.map(key));
  lastIceLoadState=iceCache.state();
}
export function iceLoadState() {
  return iceCache.state();
}
export function iceSnapshot(year: number, scenario = "optimal"):IceFrame|null {
  const bracket=iceBracket(iceIndex,year,scenario);
  if(!bracket){lastIceFrame=null;return null;}
  const older=iceCache.get(scenario+'/'+bracket.olderAge),younger=iceCache.get(scenario+'/'+bracket.youngerAge);
  if(!older||!younger)return lastIceFrame?.scenario===scenario?{...lastIceFrame,held:true}:null;
  const fraction=Math.round(bracket.fraction*256)/256,key=`${scenario}/${bracket.olderAge}/${bracket.youngerAge}/${fraction}`;
  let frame=iceFrames.get(key);
  if(!frame){
    frame={scenario,ageCalBP:bracket.olderAge-(bracket.olderAge-bracket.youngerAge)*fraction,olderAge:bracket.olderAge,youngerAge:bracket.youngerAge,
      geometry:interpolateIce(older.geometry as IceGeometry,younger.geometry as IceGeometry,fraction),interpolated:bracket.olderAge!==bracket.youngerAge,held:false,key};
    iceFrames.set(key,frame);if(iceFrames.size>24)iceFrames.delete(iceFrames.keys().next().value!);
  }
  lastIceFrame=frame;return frame;
}
export function iceFrameLabel(frame:IceFrame){
 const ages=frame.interpolated?`${frame.olderAge.toLocaleString()}–${frame.youngerAge.toLocaleString()} cal BP`:`${frame.ageCalBP.toLocaleString()} cal BP`;
 return `NADI-1 ${frame.scenario.toUpperCase()} · ${frame.interpolated?'Interpolated ice, approximate edge':'Dated reconstruction, approximate edge'} · ${ages}${frame.held?' · Previous outline retained while selected dates load':''}`;
}
function filterKey(hidden: ReadonlySet<string>, includeUncertain: boolean) {
  return [...hidden].sort().join(",") + "|" + includeUncertain;
}
export function eventsAt(
  year: number,
  hidden: ReadonlySet<string>,
  includeUncertain = true,
) {
  const key = year + "|" + filterKey(hidden, includeUncertain);
  let events = eventCache.get(key);
  if (!events) {
    events = hazardEvents.filter(
      (e) =>
        !openHazardDate(e) &&
        !hidden.has(e.kind) &&
        e.start <= year &&
        e.end >= year &&
        (includeUncertain || !isUncertainHazard(e)),
    );
    eventCache.set(key, events);
    if (eventCache.size > 64)
      eventCache.delete(eventCache.keys().next().value!);
  }
  return events;
}
/** Playback intervals are immutable per enabled catalog/filter combination. */
export function hazardTimes(
  hidden: ReadonlySet<string>,
  includeUncertain = true,
) {
  const key = filterKey(hidden, includeUncertain);
  let rows = timeCache.get(key);
  if (!rows) {
    rows = hazardEvents
      .filter(
        (e) =>
          !openHazardDate(e) &&
          !hidden.has(e.kind) &&
          (includeUncertain || !isUncertainHazard(e)),
      )
      .map((e) => ({
        time: {
          kind: "occurrence" as const,
          start: e.start,
          end: e.end,
          approximate: true,
          original: "Source catalog dates",
          method: "Catalog / reconstructed context",
          interpretation: "No human impact inferred",
        },
      }));
    timeCache.set(key, rows);
    if (timeCache.size > 32) timeCache.delete(timeCache.keys().next().value!);
  }
  return rows;
}
