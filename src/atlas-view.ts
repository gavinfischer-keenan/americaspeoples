import {END_YEAR,recordInTimeline} from "./time";
import type { MapRecord } from "./model";
import { historyState } from "./history";

export type AtlasMode = "movie" | "explore";
/** Temporal eligibility is separate from layer preferences, viewport clipping,
 * uncertainty styling and playback speed. Undated evidence never enters Movie. */
export function recordsForView<T extends MapRecord>(
  records: readonly T[],
  mode: AtlasMode,
  year: number,
  endYear=END_YEAR,
): { dated: T[]; context: T[]; history: T[] } {
  const eligible=records.filter(record=>recordInTimeline(record,endYear));
  if(mode==="movie"&&year>endYear)return {dated:[],context:[],history:[]};
  return mode === "movie"
    ? {
        dated: eligible.filter((r) => historyState(r, year) === "active"),
        context: [],
        history: eligible.filter((r) =>
          ["past-place", "founded", "loss"].includes(historyState(r, year)),
        ),
      }
    : {
        dated: eligible.filter((r) => r.time.kind !== "unplaced"),
        context: eligible.filter((r) => r.time.kind === "unplaced"),
        history: [],
      };
}
export function canSelect(mode: AtlasMode, playing: boolean): boolean {
  return mode !== "movie" || !playing;
}
export function retainCurrentSelection<
  T extends { id: string; proposalKey?: string },
>(
  selected: readonly T[],
  eligible: readonly { id: string; proposalKey?: string }[],
  mode: AtlasMode,
): T[] {
  // A local correction and its published base can have different dates.
  const key = (r: { id: string; proposalKey?: string }) =>
    JSON.stringify([r.id, r.proposalKey ?? null]);
  const ids = new Set(eligible.map(key));
  return mode === "movie"
    ? selected.filter((r) => ids.has(key(r)))
    : [...selected];
}
