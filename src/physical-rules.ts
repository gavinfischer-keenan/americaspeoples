import type { MapRecord } from "./model";
import type { HazardEvent } from "./physical-data";
// Pure classification: uncertainty is distinct from date presence and from human impact.
export function openHazardDate(e: HazardEvent) {
  const d = e.detail as Record<string, unknown>;
  return (
    ["<", ">"].includes(String(d.StartDateYearModifier)) ||
    d.EndDateYearModifier === "<"
  );
}
export function isUncertainHazard(e: HazardEvent) {
  const d = e.detail as Record<string, unknown>;
  return (
    /uncertain|discredited|doubtful|questionable|erroneous|unspecified/i.test(
      e.status,
    ) ||
    d.StartDateYearModifier === "?" ||
    d.EndDateYearModifier === "?" ||
    Number(d.StartDateYearUncertainty) > 0 ||
    Number(d.EndDateYearUncertainty) > 0
  );
}
export function climateCategory(r: MapRecord): string | null {
  if (r.overlay?.kind !== "environment") return null;
  const text = r.title + " " + r.claims.map((c) => c.text).join(" ");
  return /drought|arid|drying|dry conditions/i.test(text)
    ? "drought"
    : /cold|cooling|glacial|ice sheet/i.test(text)
      ? "cold"
      : /warming|warm period|heat|hot conditions/i.test(text)
        ? "heat"
        : "other-climate";
}
