import type { EvidenceRecord } from "./model";
import { END_YEAR } from "./time";
export type TimelineScale = "log" | "linear";
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));
// Shifted logarithm stays finite across BCE/CE. It allocates more space to recent
// years; it never alters evidence dates or represents archaeological certainty.
const age = (year: number) => Math.log1p(Math.max(0, END_YEAR - year) / 1000);
export function timelinePosition(
  year: number,
  start: number,
  end: number,
  scale: TimelineScale,
): number {
  if (end <= start) return 0;
  const y = clamp(year, start, end);
  return scale === "linear"
    ? (y - start) / (end - start)
    : (age(start) - age(y)) / (age(start) - age(end));
}
export function timelineYear(
  position: number,
  start: number,
  end: number,
  scale: TimelineScale,
): number {
  if (end <= start) return start;
  const p = clamp(position, 0, 1);
  if (p === 0) return start;
  if (p === 1) return end;
  const y =
    scale === "linear"
      ? start + p * (end - start)
      : END_YEAR - 1000 * Math.expm1(age(start) - p * (age(start) - age(end)));
  return clamp(Math.round(y), start, end) || 0;
}
/** UI pacing from evidence coverage, never a population or confidence measure.
 * Broad intervals have capped weight so one uncertain early span cannot dominate.
 * Nearby boundaries slow the approach; advancePlayback still prevents skipping.
 */
export function smartYearsPerSecond<T extends Pick<EvidenceRecord, "time">>(
  records: T[],
  year: number,
): number {
  let activity = 0,
    nearby = 0;
  for (const { time: t } of records) {
    if (t.kind === "unplaced" || t.start === null || t.end === null) continue;
    const weight = Math.min(1, 1000 / Math.max(1, t.end - t.start + 1));
    if (year >= t.start && year <= t.end) activity += weight;
    const boundaries = new Set([t.start, t.end, t.certainStart, t.certainEnd]);
    for (const b of boundaries)
      if (b !== undefined) nearby += Math.max(0, 1 - Math.abs(b - year) / 1000);
  }
  return clamp(12000 / (1 + 3 * activity + 2 * nearby), 25, 12000);
}
