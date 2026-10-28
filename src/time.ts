import type { EvidenceRecord, TimeExtent } from "./model";
export const END_YEAR = 1803;
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
  records: EvidenceRecord[],
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
