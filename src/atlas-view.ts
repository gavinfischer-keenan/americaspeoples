import type { MapRecord } from './model';
import { temporalState } from './time';

export type AtlasMode = 'movie' | 'explore';
/** Temporal eligibility is separate from layer preferences, viewport clipping,
 * uncertainty styling and playback speed. Undated evidence never enters Movie. */
export function recordsForView<T extends MapRecord>(records: readonly T[], mode: AtlasMode, year: number): {dated:T[];context:T[]} {
  return mode==='movie'
    ? {dated:records.filter(r=>temporalState(r.time,year)!=='absent'),context:[]}
    : {dated:records.filter(r=>r.time.kind!=='unplaced'),context:records.filter(r=>r.time.kind==='unplaced')};
}
export function canSelect(mode:AtlasMode,playing:boolean):boolean {
  return mode!=='movie' || !playing;
}
export function retainCurrentSelection<T extends {id:string;proposalKey?:string}>(selected:readonly T[],eligible:readonly {id:string;proposalKey?:string}[],mode:AtlasMode):T[] {
  // A local correction and its published base can have different dates.
  const key=(r:{id:string;proposalKey?:string})=>JSON.stringify([r.id,r.proposalKey??null]);
  const ids=new Set(eligible.map(key));
  return mode==='movie'?selected.filter(r=>ids.has(key(r))):[...selected];
}
