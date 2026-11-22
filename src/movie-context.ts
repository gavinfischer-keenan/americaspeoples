import { geoDistance } from "d3-geo";
import type { DisplayRecord } from "./model";
import { historyState } from "./history";
import { esc } from "./dom";
import { recordHref } from "./review";
import { formatYear } from "./time";

const point = (r: DisplayRecord): [number, number] | null =>
  r.location
    ? [r.location.lon, r.location.lat]
    : r.overlay?.geometry?.type === "Point"
      ? r.overlay.geometry.coordinates
      : null;
function region(r: DisplayRecord): string {
  const p = point(r);
  if (!p) return "Connections";
  const [lon, lat] = p;
  if (lon > 95 || lon < -125) return "Pacific & Australia";
  if (lat < 13) return "South America";
  if (lat < 30 && lon > -90) return "Caribbean & Central America";
  return "North America";
}
/** A small reading aid; the map still contains every eligible enabled record. */
export function movieContextHTML(
  records: readonly DisplayRecord[],
  year: number,
  near?: [number, number],
): string {
  const eligible = records.filter(
    (r) => !r.id.startsWith("visit-") && point(r),
  );
  const score = (r: DisplayRecord) => {
    const state = historyState(r, year),
      event = ["conflict", "violence", "forced-removal", "epidemic"].includes(
        r.overlay?.kind ?? "",
      );
    return (
      (state === "active" ? 1000 : 0) +
      (event ? 400 : 0) +
      (r.history?.kind === "habitation" ? 150 : 0) +
      (['migration','exchange'].includes(r.history?.kind??'') ? 100 : 0) -
      Math.min(500, Math.abs(year - (r.time.start ?? year))) / 10
    );
  };
  const sorted = [...eligible].sort(
    (a, b) => score(b) - score(a) || a.id.localeCompare(b.id),
  );
  const chosen: DisplayRecord[] = [];
  if (near) {
    const local = [...eligible]
      .filter((r) => geoDistance(near, point(r)!) < 0.24)
      .sort(
        (a, b) =>
          geoDistance(near, point(a)!) - geoDistance(near, point(b)!) ||
          score(b) - score(a),
      );
    chosen.push(...local.slice(0, 2));
  }
  const seenRegions = new Set<string>();
  for (const r of sorted) {
    const key = region(r);
    if (!seenRegions.has(key) && !chosen.includes(r)) {
      chosen.push(r);
      seenRegions.add(key);
    }
    if (chosen.length >= 6) break;
  }
  const card = (r: DisplayRecord) =>
    `<a href="${recordHref(r)}"><small>${esc(region(r))} · ${historyState(r, year) === "active" ? "Evidence at this time" : "Earlier place / recorded history"}</small><strong>${esc(r.title)}</strong></a>`;
  return `<div class="context-kicker"><span class="eyebrow">${near ? "AROUND THE JOURNEY & ELSEWHERE" : "AT THE SAME TIME"}</span><span>${esc(formatYear(year))}</span></div><p class="context-explainer">Contemporary places across the map. Zoom out to see other regions.</p><div class="concurrent-records">${chosen.map(card).join("") || "<p>No dated records fall on this date in the active view.</p>"}</div>`;
}
