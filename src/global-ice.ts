import type { IceGeometry } from "./ice-geometry";

export interface GlobalIceSlice {
  id: string;
  label: string;
  region: string;
  ageKa: number;
  minAgeKa: number;
  maxAgeKa: number;
  seaLevelM: number;
  sourceId: string;
  areaMillionKm2?: number;
  note: string;
  geometry: IceGeometry;
}

export interface GlobalIceArchive {
  method: string;
  slices: GlobalIceSlice[];
}

export interface GlobalIceFrame {
  geometry: IceGeometry;
  label: string;
  slice: GlobalIceSlice | null;
  seaLevelM: number;
}

let cachedPromise: Promise<GlobalIceArchive | null> | undefined;
let cachedData: GlobalIceArchive | null = null;

export function currentGlobalIce(): GlobalIceArchive | null {
  return cachedData;
}

export function loadGlobalIce(): Promise<GlobalIceArchive | null> {
  if (cachedData) return Promise.resolve(cachedData);
  return (cachedPromise ??= fetch("global-ice-sheets.json")
    .then((r) => (r.ok ? (r.json() as Promise<GlobalIceArchive>) : null))
    .then((data) => {
      if (data && Array.isArray(data.slices)) {
        cachedData = data;
        return data;
      }
      return null;
    })
    .catch(() => null));
}

/** Resolve continuous Northern Hemisphere / Eurasian / North American ice-sheet extent
 * for any historical or deep-time astronomical year (year <= 1900). */
export function globalIceAtYear(
  archive: GlobalIceArchive | null,
  year: number,
  region: "global" | "europe" | "americas" = "global",
): GlobalIceFrame | null {
  if (!archive?.slices.length) return null;
  const ageKa = (1950 - year) / 1000;
  if (ageKa > 3600) {
    return {
      geometry: { type: "MultiPolygon", coordinates: [] },
      label: "Pre-3.6 Ma · Minimal Northern Hemisphere continental ice (Pliocene–Miocene)",
      slice: null,
      seaLevelM: 25,
    };
  }

  let match = archive.slices.find(
    (s) => ageKa >= s.minAgeKa && ageKa <= s.maxAgeKa,
  );
  if (!match) {
    match = archive.slices.reduce((best, s) =>
      Math.abs(s.ageKa - ageKa) < Math.abs(best.ageKa - ageKa) ? s : best,
    );
  }

  let prefix =
    match.sourceId === "batchelor2019"
      ? "Batchelor et al. (2019)"
      : match.sourceId === "nadi1-dated1"
        ? "DATED-1 + NADI-1"
        : "NADI-1 Reference";
  if (region === "europe" && match.sourceId === "nadi1-dated1") {
    prefix = "DATED-1 Eurasian Ice Sheets";
  } else if (region === "americas" && match.sourceId === "batchelor2019") {
    prefix = "Batchelor et al. (2019) Quaternary NH";
  }

  return {
    geometry: match.geometry,
    label: `${prefix} · ${match.label} · Sea level ~${match.seaLevelM > 0 ? "+" : ""}${match.seaLevelM} m`,
    slice: match,
    seaLevelM: match.seaLevelM,
  };
}
