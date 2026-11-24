import type { DisplayRecord, EvidenceRecord, MapRecord, Source } from "./model";
import { deepTimeLabel, type WorldData, type WorldEvidence } from "./world-model";
import { normalizeEurope, type EuropeData } from "./europe-data";

export interface ExploreSourceMeta {
  regionHref: string;
  guideId?: string;
  sources: { title: string; url: string }[];
}

const exploreMetaById = new Map<string, ExploreSourceMeta>();

export const WORLD_CANONICAL_EQUIVALENTS: Readonly<Record<string, readonly string[]>> = {
  "wreck-dokos": ["wreck-ancient-dokos"],
  "wreck-cape-gelidonya": ["wreck-ancient-gelidonya"],
  "wreck-kyrenia": ["wreck-ancient-kyrenia"],
  "wreck-mary-rose": ["wreck-ukho-19160"],
  "wreck-batavia-abrolhos-1629": ["wreck-wam-812"],
  "wreck-goodwin-sands-1703": ["wreck-ukho-14745"],
  "wreck-scilly-1707": ["wreck-ukho-21806"],
  "wreck-birkenhead-agulhas-1852": ["wreck-ukho-75657"],
  "med-uluburun-wreck": ["wreck-ancient-uluburun"],
  "spread-madjedbebe-occupation": ["px-madjedbebe-onset"],
  "asho-nan-madol-polynesia-1900": ["r6-nan-madol-sealevel", "d19-nan-early-phase"],
  "p30k-as-boodie-cave": ["px-boodie-onset"],
  "sp-nz-wairau-bar": ["context-wairau-bar"],
  "spar-pac-palau-babeldaob-terraces": ["ym-babeldaob-earthworks", "px-babeldaob-earthworks"],
  "spar-aus-budj-bim-aquaculture": ["px-budj-bim-living-landscape"],
  "spar-aus-brewarrina-ngunnhu": ["regional-brewarrina-1848"],
  "apea-nawarla-gabarnmang-arnhem": ["au-gabarnmang-onset"],
  "apea-lake-mungo-willandra": ["px-mungo-mortuary"],
  "apea-warratyi-arid-australia": ["px-warratyi-early"],
  "apea-niah-great-cave-borneo": ["island-niah-early"],
  "apea-buang-merabak-new-ireland": ["island-buang-merabak-early"],
  "spread-teouma-genomes": ["px-teouma-midden"],
  "asho-lapita-teouma-oceania": ["px-teouma-midden"],
  "sp-fiji-sigatoka-bourewa": ["px-bourewa-model"],
  "spar-pac-marianas-latte-taga": ["px-marianas-onset"],
  "spar-pac-roi-mata-vanuatu-fiji": ["sv-mangaas-residence"],
  "spar-phil-butuan-laguna-900": ["island-butuan-boat1"],
};

function regionHrefForWorldEvidence(e: WorldEvidence): string {
  const q = `?site=${encodeURIComponent(e.id)}`;
  if (e.regionIds.includes("africa")) return `#atlas/africa${q}`;
  if (e.regionIds.includes("asia-pacific")) return `#atlas/asia-pacific${q}`;
  if (e.regionIds.includes("pacific")) return `#origins/pacific${q}`;
  if (e.regionIds.includes("europe")) return `#origins/europe${q}`;
  return `#origins${q}`;
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
    const eq = WORLD_CANONICAL_EQUIVALENTS[e.id];
    if (eq?.some((cid) => existingIds.has(cid))) continue;
    if (!e.coordinates || e.coordinates.length < 2) continue;
    const [lon, lat] = e.coordinates;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    const primaryTaxon = e.taxonIds.map((id) => taxaById.get(id)).find(Boolean);
    const id = "world:" + e.id;
    const sources = worldSourcesForRecord(data, e.sourceIds);
    const placeLabel = e.title.split("—")[0].split(":")[0].trim() || e.title;
    const isWreck = e.id.startsWith("wreck-") || e.id.endsWith("-wreck");
    const record: EvidenceRecord = {
      id,
      revision: 1,
      type: isWreck ? "event" : e.kind === "fossil" || e.kind === "archaeology" ? "occurrence" : "occupation",
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
      history: { kind: isWreck ? "wreck" : "habitation", claimId: "finding" },
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
    const entry = entriesById.get(r.id);
    if (
      existingIds.has(r.id) ||
      existingIds.has("europe:" + r.id) ||
      (entry?.canonicalRecordId &&
        (existingIds.has(entry.canonicalRecordId) ||
          existingIds.has("world:" + entry.canonicalRecordId)))
    )
      continue;
    const id = "europe:" + r.id;
    exploreMetaById.set(id, {
      regionHref: `#atlas/europe?site=${encodeURIComponent(r.id)}`,
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
