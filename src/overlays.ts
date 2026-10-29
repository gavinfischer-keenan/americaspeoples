import type { Overlay } from "./model";
export const OVERLAY_LABELS: Record<Overlay["kind"], string> = {
  language: "Languages / linguistic relationships",
  trade: "Trade",
  conflict: "Conflict",
  "forced-removal": "Forced removal",
  epidemic: "Epidemic",
  violence: "Massacre / violence",
  "population-history": "Genomic population history",
  "regional-evidence": "Regional archaeological synthesis",
  environment: "Environment / fauna",
  "cultural-reach": "Approximate cultural reach",
};
export function validateOverlay(value: unknown): string[] {
  const o = value as Overlay;
  if (!o || typeof o !== "object") return ["Invalid overlay metadata."];
  const errors: string[] = [];
  if (
    (o.kind === "cultural-reach" || (o.kind === "language" && o.radiusKm !== undefined)) &&
    (o.basis !== "schematic" ||
      o.geometry?.type !== "Point" ||
      !Number.isFinite(o.radiusKm) ||
      o.radiusKm! <= 0 ||
      o.radiusKm! > 3000)
  )
    errors.push(
      "Cultural reach requires a schematic center and illustrative radiusKm from 0 to 3000 km, with source qualifications.",
    );
  if (!["cultural-reach", "language"].includes(o.kind) && o.radiusKm !== undefined)
    errors.push("radiusKm applies only to cultural reach or language areas.");
  if (typeof o.kind !== "string" || !Object.hasOwn(OVERLAY_LABELS, o.kind))
    errors.push(
      "Overlay type must be a supported historical, regional, population-history or environment layer.",
    );
  if (!["documented", "schematic", "unmapped"].includes(o.basis))
    errors.push("Invalid overlay geometry basis.");
  for (const key of ["precision", "provenance"] as const)
    if (typeof o[key] !== "string" || !o[key].trim() || o[key].length > 32767)
      errors.push(`Overlay ${key} is required.`);
  const point = (p: unknown) =>
    Array.isArray(p) &&
    p.length === 2 &&
    p.every(Number.isFinite) &&
    Math.abs(p[0]) <= 180 &&
    Math.abs(p[1]) <= 90;
  if (o.basis === "unmapped") {
    if (o.geometry !== null)
      errors.push("Unmapped overlay geometry must be null.");
  } else if (
    !o.geometry ||
    typeof o.geometry !== "object" ||
    !(o.geometry.type === "Point"
      ? point(o.geometry.coordinates)
      : o.geometry.type === "LineString" &&
        Array.isArray(o.geometry.coordinates) &&
        o.geometry.coordinates.length >= 2 &&
        o.geometry.coordinates.length <= 1000 &&
        o.geometry.coordinates.every(point))
  )
    errors.push(
      "Overlay geometry must be a valid Point or LineString with at most 1000 positions.",
    );
  if (
    o.basis === "schematic" &&
    o.geometry?.type === "LineString" &&
    Array.isArray(o.geometry.coordinates) &&
    o.geometry.coordinates.length !== 2
  )
    errors.push(
      "Schematic connections require exactly two endpoints; intermediate waypoints imply a documented route.",
    );
  return errors;
}
