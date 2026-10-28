import type { EvidenceRecord } from "./model";
export function populationRadius(n: number): number {
  return n <= 500 ? 5 : n <= 2500 ? 7 : n <= 10000 ? 10 : n <= 50000 ? 13 : 17;
}
/** No interpolation, extrapolation, or addition of overlapping estimates. */
export function populationAt(rows: EvidenceRecord[], year: number) {
  const estimates = [
    ...new Map(
      rows
        .flatMap((r) =>
          (r.population ?? []).filter((p) => year >= p.start && year <= p.end),
        )
        .map((p) => [JSON.stringify(p), p]),
    ).values(),
  ];
  if (!estimates.length)
    return {
      unknown: true,
      radius: 5,
      outerRadius: 5,
      label:
        "Unknown population — smallest symbol is a display convention, not a 1–500 estimate",
    };
  const min = Math.min(...estimates.map((p) => p.min)),
    max = Math.max(...estimates.map((p) => p.max));
  return {
    unknown: false,
    radius: populationRadius(min),
    outerRadius: populationRadius(max),
    label: `${min.toLocaleString("en-US")}–${max.toLocaleString("en-US")} residents${estimates.length > 1 ? " — envelope of alternative estimates; not a sum" : ""}`,
  };
}
export function validatePopulation(r: EvidenceRecord): string[] {
  if (r.population === undefined) return [];
  if (!Array.isArray(r.population) || r.population.length > 100)
    return ["Population must contain at most 100 dated resident estimates."];
  const errors: string[] = [];
  if (r.overlay || r.type === "movement" || !r.location)
    errors.push("Resident population requires an ordinary mapped site record.");
  for (const p of r.population) {
    if (
      !p ||
      !Number.isSafeInteger(p.start) ||
      !Number.isSafeInteger(p.end) ||
      p.start > p.end ||
      r.time?.start === null ||
      r.time?.end === null ||
      p.start < r.time?.start! ||
      p.end > r.time?.end!
    )
      errors.push(
        "Population dates must fall within the site evidence interval.",
      );
    if (
      !p ||
      !Number.isSafeInteger(p.min) ||
      !Number.isSafeInteger(p.max) ||
      p.min < 1 ||
      p.max < p.min ||
      p.max > 100000000
    )
      errors.push(
        "Population bounds must be ordered positive resident counts.",
      );
    if (
      !p ||
      typeof p.scope !== "string" ||
      !p.scope.trim() ||
      p.scope.length > 32767
    )
      errors.push(
        "Population needs its settlement scope and dating qualification.",
      );
    const claim = Array.isArray(r.claims)
      ? r.claims.find((c) => c?.id === p?.claimId)
      : null;
    if (
      !Array.isArray(claim?.support) ||
      !claim.support.some(
        (s) =>
          s?.stance === "supports" &&
          Array.isArray(r.sources) &&
          r.sources.some((x) => x?.id === s.sourceId),
      )
    )
      errors.push("Population needs a claim with supporting source mappings.");
  }
  return errors;
}
