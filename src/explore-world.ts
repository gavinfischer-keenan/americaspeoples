import type { DisplayRecord, EvidenceRecord, MapRecord, Source } from "./model";
import { deepTimeLabel, type WorldData, type WorldEvidence } from "./world-model";
import { normalizeEurope, type EuropeData } from "./europe-data";

export interface ExploreSourceMeta {
  regionHref: string;
  guideId?: string;
  sources: { title: string; url: string }[];
}

const exploreMetaById = new Map<string, ExploreSourceMeta>();

function regionHrefForWorldEvidence(e: WorldEvidence): string {
  if (e.regionIds.includes("pacific")) return "#atlas/pacific";
  if (e.regionIds.includes("europe")) return "#atlas/europe";
  if (e.regionIds.includes("africa")) return "#atlas/africa";
  if (e.regionIds.includes("asia-pacific")) return "#atlas/asia-pacific";
  return "#origins";
}

function worldSourcesForRecord(data: WorldData, sourceIds: readonly string[]): Source[] {
  const byId = new Map(data.sources.map((s) => [s.id, s]));
  return sourceIds
    .map((id) => byId.get(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => ({
      id: s.id,
      authors: "",
      title: s.title,
      year: null,
      venue: "",
      url: s.url,
      access: s.access,
    }));
}

export function adaptWorldDataForExplore(
  data: WorldData,
  existingIds: ReadonlySet<string>,
): DisplayRecord[] {
  const taxaById = new Map(data.taxa.map((t) => [t.id, t]));
  const adapted: DisplayRecord[] = [];
  for (const e of data.evidence) {
    if (existingIds.has(e.id) || existingIds.has("world:" + e.id)) continue;
    if (!e.coordinates || e.coordinates.length < 2) continue;
    const [lon, lat] = e.coordinates;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    const primaryTaxon = e.taxonIds.map((id) => taxaById.get(id)).find(Boolean);
    const id = "world:" + e.id;
    const sources = worldSourcesForRecord(data, e.sourceIds);
    const placeLabel = e.title.split("—")[0].split(":")[0].trim() || e.title;
    const record: EvidenceRecord = {
      id,
      revision: 1,
      type: e.kind === "fossil" || e.kind === "archaeology" ? "occurrence" : "occupation",
      title: e.title,
      culture: {
        id: "world-" + (primaryTaxon?.id ?? "hominin"),
        name: primaryTaxon?.name ?? "Human-family find",
        kind: "culture",
        color: "#569E56",
      },
      location: {
        id: "world-loc-" + e.id,
        name: placeLabel,
        lon,
        lat,
        precision: "Published site coordinate",
        provenance: "World Human Family catalogue",
      },
      destination: null,
      routeKind: "schematic",
      time: {
        kind: "interval",
        start: e.start,
        end: e.end,
        approximate: true,
        original: e.dateLabel || `${deepTimeLabel(e.start)}–${deepTimeLabel(e.end)}`,
        method: e.dateBasis,
        interpretation: e.limits,
      },
      history: { kind: "habitation", claimId: "finding" },
      claims: [
        {
          id: "finding",
          text: e.summary,
          status: primaryTaxon?.status === "uncertain" ? "under discussion" : "well-supported",
          explanation: e.limits,
          support: [],
        },
      ],
      sources,
      review: {
        summary: e.summary,
        limitations: e.limits,
        discussion: primaryTaxon ? `${primaryTaxon.name}: ${primaryTaxon.note}` : "",
        provenance: "World Human Family catalogue",
        reviewedAt: "2026-11-21",
        history: [],
        relatedIds: [],
      },
    };
    exploreMetaById.set(id, {
      regionHref: regionHrefForWorldEvidence(e),
      guideId: e.guideId,
      sources: sources.map((s) => ({ title: s.title, url: s.url })),
    });
    adapted.push(record);
  }
  return adapted;
}

export function adaptEuropeDataForExplore(
  data: EuropeData,
  existingIds: ReadonlySet<string>,
): DisplayRecord[] {
  const entriesById = new Map(data.entries.map((e) => [e.id, e]));
  const normalized = normalizeEurope(data);
  const adapted: DisplayRecord[] = [];
  for (const r of normalized) {
    if (existingIds.has(r.id) || existingIds.has("europe:" + r.id)) continue;
    const id = "europe:" + r.id;
    const entry = entriesById.get(r.id);
    exploreMetaById.set(id, {
      regionHref: "#atlas/europe",
      guideId: entry?.guideId,
      sources: r.sources.map((s) => ({ title: s.title, url: s.url })),
    });
    adapted.push({ ...r, id });
  }
  return adapted;
}

export function exploreSourceMeta(
  r: Pick<DisplayRecord, "id">,
): ExploreSourceMeta | undefined {
  return exploreMetaById.get(r.id);
}

export function filterByDateRange<T extends MapRecord>(
  records: readonly T[],
  minYear: number,
  maxYear: number,
  fullMin: number,
  fullMax: number,
  includeUndated: boolean,
): { dated: T[]; context: T[] } {
  const lo = Math.min(minYear, maxYear);
  const hi = Math.max(minYear, maxYear);
  const isFullRange = lo <= fullMin && hi >= fullMax;
  const dated: T[] = [];
  const context: T[] = [];
  for (const r of records) {
    if (r.time.kind === "unplaced" || r.time.start === null) {
      if (includeUndated && isFullRange) context.push(r);
      continue;
    }
    const start = r.time.start;
    const end = r.time.end ?? start;
    if (start <= hi && end >= lo) dated.push(r);
  }
  return { dated, context };
}
