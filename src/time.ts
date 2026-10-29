import type { EvidenceRecord, TimeExtent } from "./model";
export const END_YEAR = 1934;
export function formatYear(year: number): string {
  return `${(year <= 0 ? 1 - year : year).toLocaleString("en-US")} ${year <= 0 ? "BCE" : "CE"}`;
}
export function parseYear(value: string, era: string): number {
  const n = Number(value.replaceAll(",", ""));
  if (
    !Number.isSafeInteger(n) ||
    n < 1 ||
    n > 1_000_000 ||
    !["BCE", "CE"].includes(era)
  )
    throw new Error("Enter a positive whole year and select BCE or CE.");
  return era === "BCE" ? 1 - n : n;
}
export function temporalState(
  t: TimeExtent,
  year: number,
): "absent" | "possible" | "certain" {
  if (
    t.kind === "unplaced" ||
    t.start === null ||
    t.end === null ||
    year < t.start ||
    year > t.end
  )
    return "absent";
  if (t.approximate) return "possible";
  if (t.kind === "occurrence")
    return t.start === t.end ? "certain" : "possible";
  if (
    t.certainStart !== undefined &&
    t.certainEnd !== undefined &&
    (year < t.certainStart || year > t.certainEnd)
  )
    return "possible";
  return "certain";
}
export function activeRecords<T extends EvidenceRecord>(
  records: T[],
  year: number,
): T[] {
  return records.filter((r) => temporalState(r.time, year) !== "absent");
}
/** Illustrative temporal support, not a probability density or population size.
 * No padding outside source bounds; uncertain single-year references stay visible.
 */
export function temporalOpacity(t: TimeExtent, year: number): number {
  const state = temporalState(t, year);
  if (state === "absent") return 0;
  if (state === "certain") return 1;
  if (t.start === t.end) return 0.7;
  const start = t.start!,
    end = t.end!;
  if (
    !t.approximate &&
    t.certainStart !== undefined &&
    t.certainEnd !== undefined
  ) {
    const strength =
      year < t.certainStart
        ? (year - start) / (t.certainStart - start)
        : (end - year) / (end - t.certainEnd);
    return 0.22 + 0.78 * Math.max(0, Math.min(1, strength));
  }
  const phase = (year - start) / (end - start);
  return 0.22 + 0.53 * Math.sin(Math.PI * phase);
}
export function earliestYear(records: EvidenceRecord[]): number {
  return Math.min(
    END_YEAR,
    ...records
      .filter((r) => r.time.kind !== "unplaced" && r.time.start !== null)
      .map((r) => r.time.start!),
  );
}
export function timeLabel(t: TimeExtent): string {
  return t.kind === "unplaced" || t.start === null || t.end === null
    ? "Not placed on timeline"
    : (t.approximate ? "≈ " : "") +
        (t.start === t.end
          ? formatYear(t.start)
          : `${formatYear(t.start)} – ${formatYear(t.end)}`);
}
export function isDisputed(r: EvidenceRecord): boolean {
  return r.claims.some((c) => c.status !== "well-supported");
}
export function advancePlayback(
  records: Pick<EvidenceRecord,'time'>[],
  current: number,
  step: number,
): { year: number; boundary: boolean } {
  const target = Math.min(END_YEAR, current + step);
  const next = records
    .filter((r) => r.time.kind !== "unplaced")
    .flatMap((r) => [r.time.start, r.time.end])
    .filter((n): n is number => n !== null && n > current && n <= target)
    .sort((a, b) => a - b)[0];
  return next === undefined
    ? { year: target, boundary: false }
    : { year: next, boundary: true };
}
