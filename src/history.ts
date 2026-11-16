import type { EvidenceRecord, MapRecord } from "./model";
import { END_YEAR, formatYear, temporalState } from "./time";

export type HistoryState =
  | "active"
  | "past-place"
  | "founded"
  | "loss"
  | "outside";
export const HISTORY_LABELS = {
  settlement: "Settlements",
  habitation: "Habitation & continuity",
  migration: "Migration",
  exchange: "Trade & exchange",
  wreck: "Shipwrecks",
  visit: "Historical visits",
  attestation: "Dated finds & language attestations",
} as const;

/** Display memory is deliberately separate from the underlying evidence interval. */
export function historyState(record: MapRecord, year: number): HistoryState {
  const { time, history } = record;
  if (
    time.kind === "unplaced" ||
    time.start === null ||
    time.end === null ||
    year < time.start
  )
    return "outside";
  if (history?.windows)
    return history.windows.some((w) => year >= w.start && year <= w.end)
      ? "active"
      : "outside";
  if (temporalState(time, year) !== "absent") return "active";
  if (history?.kind === "wreck") return "loss";
  if (history?.kind === "settlement") return "founded";
  if (history?.kind === "visit" || history?.kind === "attestation") return "past-place";
  if (record.type === "occupation" && record.location && !record.overlay)
    return "past-place";
  return "outside";
}

export function historyLabel(record: MapRecord, year: number): string {
  const state = historyState(record, year),
    h = record.history;
  if(h?.kind==='attestation'&&state!=='outside')return `${state==='active'?'Evidence at its source date':'Earlier evidence'} · ${record.time.original}. This marker does not establish continuous presence or a first arrival.`;
  if(h?.kind==='visit'&&state!=='outside')return `${state==='active'?'Dated':'Historical'} visit · ${h.eventDate||record.time.original}. This visit marker does not establish settlement or continued presence afterward.`;
  if (h?.endEvidence && state !== 'outside' && year >= h.endEvidence.start) {
    const e=h.endEvidence, range=e.start===e.end?formatYear(e.start):`${formatYear(e.start)}–${formatYear(e.end)}`;
    const action=e.meaning==='relocated'?'relocation':'local abandonment';
    return `${year<e.end?'Possible':e.certainty==='inferred'?'Inferred':'Documented'} ${action} · ${range}. ${e.note} The earlier place remains historical context.`;
  }
  if(h?.kind==='habitation'&&state!=='outside'&&h.continuity==='ongoing')
    return 'Evidence of continuing habitation; the display ends in 1934, while community history continues. This is not a year-by-year population count.';
  if (h?.kind === "wreck" && state !== "outside")
    return `Historical loss · ${h.eventDate || formatYear(record.time.start!)}${h.group ? " · " + h.group : ""}. Remains and salvage are separate from the sinking date.`;
  if (h?.endYear !== undefined && year >= h.endYear && state !== "outside")
    return `${h.endMeaning === "relocated" ? "Documented relocation" : "Documented local abandonment"} · ${formatYear(h.endYear)}. The earlier place remains historical context; community histories may continue elsewhere.`;
  if (
    h?.kind === "settlement" &&
    state !== "outside" &&
    year < record.time.end!
  )
    return `Possible establishment · ${formatYear(record.time.start!)}–${formatYear(record.time.end!)}. Arrival is dated within this range, not necessarily at its early bound.`;
  if (
    h?.kind === "settlement" &&
    record.type !== "occupation" &&
    state !== "outside"
  )
    return `Established by ${formatYear(record.time.end!)}${h.foundingPower ? " · " + h.foundingPower + " foundation" : ""}. Founding history, not current sovereignty or a population estimate.`;
  if (state === "past-place" || state === "founded")
    return `Earlier occupation evidence ends ${formatYear(record.time.end!)}. Later occupation is unknown in this record; this does not establish abandonment.`;
  if (h?.windows) {
    const w = h.windows.find((w) => year >= w.start && year <= w.end);
    return w
      ? `${w.certainty === "approximate" ? "Approximate activity window" : "Documented activity period"} · ${formatYear(w.start)}–${formatYear(w.end)}. ${w.note} Animation does not measure voyage frequency.`
      : "No supported activity window at this year; this does not prove that all contact stopped.";
  }
  return "";
}

export function historyOpacity(record: MapRecord, year: number): number | null {
  const state = historyState(record, year);
  if (
    record.history?.kind === "settlement" &&
    state === "active" &&
    temporalState(record.time, year) === "possible"
  )
    return 0.55;
  if (state === "past-place") return 0.48;
  if (state === "founded" || state === "loss") return 0.9;
  if (record.history && state === "active")
    return record.history.windows?.some(
      (w) => year >= w.start && year <= w.end && w.certainty === "approximate",
    )
      ? 0.7
      : 1;
  return null;
}

/** Dates for next/previous change and playback include hiatus boundaries. */
export function historyDates(records: readonly MapRecord[]): number[] {
  return [
    ...new Set(
      records
        .flatMap((r) =>
          r.time.kind === "unplaced"
            ? []
            : [
                r.time.start,
                r.time.end,
                r.history?.endYear ?? null,
                r.history?.endEvidence?.start ?? null,
                r.history?.endEvidence?.end ?? null,
                ...(r.history?.windows?.flatMap((w) => [
                  w.start,
                  w.end,
                  w.end + 1,
                ]) ?? []),
              ],
        )
        .filter((n): n is number => n !== null && n <= END_YEAR),
    ),
  ].sort((a, b) => a - b);
}

export function validateHistory(r: EvidenceRecord): string[] {
  const h = r.history;
  if (h === undefined) return [];
  if (!h || typeof h !== "object" || Array.isArray(h))
    return ["History metadata must be an object."];
  const errors: string[] = [];
  const supported=(id:unknown)=>typeof id==='string'&&Array.isArray(r.claims)&&r.claims.some(c=>c?.id===id&&Array.isArray(c.support)&&c.support.some(s=>s?.stance==='supports'&&Array.isArray(r.sources)&&r.sources.some(source=>source?.id===s.sourceId)));
  if (!Object.hasOwn(HISTORY_LABELS, h.kind))
    errors.push("Invalid history kind.");
  const claim = Array.isArray(r.claims)
    ? r.claims.find((c) => c?.id === h.claimId)
    : undefined;
  if (
    !Array.isArray(claim?.support) ||
    !claim.support.some(
      (s) =>
        s?.stance === "supports" &&
        Array.isArray(r.sources) &&
        r.sources.some((source) => source?.id === s.sourceId),
    )
  )
    errors.push("History needs a claim with supporting sources.");
  if (
    !r.time ||
    r.time.kind === "unplaced" ||
    r.time.start === null ||
    r.time.end === null
  )
    errors.push("History requires supported dates.");
  for (const key of ["foundingPower", "eventDate", "group"] as const)
    if (
      h[key] !== undefined &&
      (typeof h[key] !== "string" || !h[key]!.trim() || h[key]!.length > 500)
    )
      errors.push("Invalid history label.");
  if (
    h.endYear !== undefined &&
    (!Number.isSafeInteger(h.endYear) ||
      h.endYear < (r.time?.end ?? Infinity) ||
      h.endYear > END_YEAR ||
      !["abandoned", "relocated"].includes(h.endMeaning ?? ""))
  )
    errors.push("Invalid history end year.");
  if (
    h.endMeaning !== undefined &&
    !["unknown", "abandoned", "relocated"].includes(h.endMeaning)
  )
    errors.push("Invalid history end meaning.");
  if (
    h.kind === "wreck" &&
    (!r.location || r.overlay || r.time?.kind !== "occurrence")
  )
    errors.push("Wreck history requires a located loss occurrence.");
  if (
    h.kind === "settlement" &&
    (!r.location || r.overlay || r.time?.kind !== "occurrence")
  )
    errors.push("Settlement history requires a place.");
  if(h.kind==='habitation'&&(!r.location||r.overlay||r.type!=='occupation'||r.time?.kind!=='interval'))
    errors.push('Habitation history requires a located occupation interval.');
  if(h.kind==='visit'&&(!r.location||r.overlay||r.type!=='event'))errors.push('Visit history requires a located event.');
  if(h.kind==='attestation'&&(!r.location||r.overlay))errors.push('Attestation history requires a located evidence point.');
  if(h.continuity!==undefined&&(h.continuity!=='ongoing'||h.kind!=='habitation'||r.time?.end!==END_YEAR||h.endEvidence||h.endYear!==undefined))
    errors.push('Ongoing habitation must reach the display horizon without an abandonment ending.');
  if(h.endEvidence!==undefined){
    const e=h.endEvidence;
    if(!e||typeof e!=='object'||!Number.isSafeInteger(e.start)||!Number.isSafeInteger(e.end)||e.start>e.end||e.start<(r.time?.start??Infinity)||e.end>END_YEAR||!['abandoned','relocated'].includes(e.meaning)||!['documented','inferred'].includes(e.certainty)||!supported(e.claimId)||typeof e.note!=='string'||!e.note.trim()||!['habitation','settlement'].includes(h.kind)||h.endYear!==undefined)
      errors.push('Invalid or unsupported history ending evidence.');
  }
  if(h.connection!==undefined){
    const e=h.connection;
    if(!e||typeof e!=='object'||!['migration','exchange'].includes(h.kind)||!Number.isSafeInteger(e.lastEvidence)||e.lastEvidence<(r.time?.start??Infinity)||e.lastEvidence>(r.time?.end??-Infinity)||!['documented','inferred','unknown','ongoing'].includes(e.cessation)||!supported(e.claimId)||typeof e.evidence!=='string'||!e.evidence.trim()||typeof e.note!=='string'||!e.note.trim())
      errors.push('Invalid connection evidence or cessation metadata.');
  }
  if (["migration", "exchange"].includes(h.kind) && !h.windows?.length)
    errors.push("Route history needs explicit activity windows.");
  if (
    ["migration", "exchange"].includes(h.kind) &&
    (r.type !== "event" ||
      r.overlay?.kind !== "trade" ||
      r.overlay?.geometry?.type !== "LineString" ||
      !["forward", "both"].includes(r.overlay?.direction ?? ""))
  )
    errors.push(
      "Route history requires a mapped trade LineString event with forward or both directions.",
    );
  if (h.windows !== undefined && !["migration", "exchange"].includes(h.kind))
    errors.push("Activity windows apply only to route history.");
  if (h.windows !== undefined) {
    if (
      !Array.isArray(h.windows) ||
      !h.windows.length ||
      h.windows.length > 100
    )
      errors.push("History activity windows must be a nonempty bounded array.");
    else
      for (const w of h.windows)
        if (
          !w ||
          !Number.isSafeInteger(w.start) ||
          !Number.isSafeInteger(w.end) ||
          w.start > w.end ||
          w.start < (r.time?.start ?? Infinity) ||
          w.end > (r.time?.end ?? -Infinity) ||
          !["documented", "approximate"].includes(w.certainty) ||
          typeof w.note !== "string" ||
          !w.note.trim() ||
          w.note.length > 5000
        )
          errors.push("Invalid history activity window.");
  }
  return errors;
}
