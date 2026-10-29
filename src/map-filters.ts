import type { EvidenceRecord } from "./model";

/** Deliberately uses explicit metadata, never scholarly status or routeKind's default. */
export function isModeledRecord(record: EvidenceRecord): boolean {
  return record.overlay?.basis === "schematic" ||
    /\b(?:models?|modelled|modeled|modelling|modeling|simulations?)\b/i.test(record.time.method);
}

export function filterMapRecords<T extends EvidenceRecord>(records: T[], hiddenLayers: ReadonlySet<string>, showModeled: boolean): T[] {
  return records.filter(record =>
    (!record.overlay || !hiddenLayers.has(record.overlay.kind)) &&
    (showModeled || !isModeledRecord(record)));
}

export function boundsInViewport(bounds: [[number, number], [number, number]], scale: number, tx: number, ty: number): boolean {
  const [[x0, y0], [x1, y1]] = bounds;
  return [x0, y0, x1, y1].every(Number.isFinite) &&
    x1 * scale + tx >= 0 && x0 * scale + tx <= 1000 &&
    y1 * scale + ty >= 0 && y0 * scale + ty <= 800;
}
