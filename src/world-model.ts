import { geoArea } from "d3-geo";
export type WorldRegion = "americas" | "africa" | "europe" | "asia-pacific";
export type WorldScope = WorldRegion | "world";
export interface WorldSource {
  id: string;
  title: string;
  url: string;
  access: string;
  locator?: string;
}
export interface WorldTaxon {
  id: string;
  name: string;
  meaning: string;
  status:
    | "proposed-ancestor"
    | "related-lineage"
    | "living-lineage"
    | "uncertain";
  note: string;
  sourceIds: string[];
}
interface DatedWorldItem {
  id: string;
  title: string;
  taxonIds: string[];
  regionIds: WorldRegion[];
  start: number;
  end: number;
  dateLabel: string;
  summary: string;
  limits: string;
  sourceIds: string[];
}
export interface WorldEvidence extends DatedWorldItem {
  kind: "fossil" | "archaeology" | "genetics" | "movement" | "historical";
  dateBasis: string;
  coordinates: [number, number];
  guideId?: string;
  population?: {
    year: number;
    min: number;
    max: number;
    basis: "estimate" | "census";
    note: string;
    sourceIds: string[];
  }[];
}
export interface WorldWave extends DatedWorldItem {
  kind:
    | "dispersal"
    | "admixture"
    | "population-change"
    | "journey"
    | "trade"
    | "campaign";
  coordinates: [number, number][];
}
export interface WorldTerritory {
  id: string;
  title: string;
  start: number;
  end: number;
  geometry:
    | { type: "Polygon"; coordinates: [number, number][][] }
    | { type: "MultiPolygon"; coordinates: [number, number][][][] };
  meaning: "approximate-control" | "claim" | "campaign-reach";
  limits: string;
  sourceIds: string[];
  regionIds: WorldRegion[];
}
export interface WorldStudy {
  id: string;
  title: string;
  summary: string;
  guideId: string;
  regionIds: WorldRegion[];
  evidenceIds: string[];
  waveIds: string[];
  territoryIds: string[];
  start: number;
  end: number;
}
export interface WorldData {
  schemaVersion: 1;
  sources: WorldSource[];
  taxa: WorldTaxon[];
  evidence: WorldEvidence[];
  waves: WorldWave[];
  studies?: WorldStudy[];
  territories?: WorldTerritory[];
}
export interface RegionSummary {
  id: WorldRegion;
  title: string;
  records: number;
  references: number;
  earliest: number | null;
  earliestLabel: string;
  coverage: string;
  guides: number;
}
export interface WorldSummary {
  version: string;
  records: number;
  references: number;
  guides: number;
  regions: RegionSummary[];
  method: string;
  foundation: { evidence: number; waves: number; taxa: number };
  studies?: Pick<WorldStudy, "id" | "title" | "summary" | "guideId">[];
}
export const worldRegions: {
  id: WorldRegion;
  title: string;
  center: [number, number];
  href: string;
  color: string;
}[] = [
  {
    id: "americas",
    title: "Americas & Pacific",
    center: [-92, 24],
    href: "#movie",
    color: "#FA742A",
  },
  {
    id: "africa",
    title: "Africa & Middle East",
    center: [24, 10],
    href: "#atlas/africa",
    color: "#72B273",
  },
  {
    id: "europe",
    title: "Europe & Mediterranean",
    center: [18, 53],
    href: "#atlas/europe",
    color: "#97C798",
  },
  {
    id: "asia-pacific",
    title: "Asia",
    center: [104, 30],
    href: "#atlas/asia-pacific",
    color: "#DCEBDD",
  },
];
const nonempty = (v: unknown): v is string =>
  typeof v === "string" && !!v.trim();
const identity = (v: unknown) =>
  nonempty(v) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
const point = (v: unknown): v is [number, number] =>
  Array.isArray(v) &&
  v.length === 2 &&
  v.every(Number.isFinite) &&
  Math.abs(v[0]) <= 180 &&
  Math.abs(v[1]) <= 90;
export function sourceKey(url: string): string {
  const u = new URL(url);
  let path = decodeURI(u.pathname).replace(/\/+$/, "");
  if (["doi.org", "dx.doi.org"].includes(u.hostname))
    return "doi:" + path.replace(/^\//, "").toLowerCase();
  const publisherDoi = path.match(/\/(?:doi\/(?:full\/|abs\/|pdf\/|epdf\/)?|article\/)(10\.\d{4,9}\/.+)$/i)?.[1];
  if (publisherDoi) return "doi:" + publisherDoi.replace(/\.pdf$/i, "").toLowerCase();
  if (["nature.com", "www.nature.com"].includes(u.hostname) && /^\/articles\/[^/]+$/.test(path))
    return "doi:10.1038/" + path.slice("/articles/".length).replace(/\.pdf$/i, "").toLowerCase();
  for (const k of [...u.searchParams.keys()])
    if (k.startsWith("utm_")) u.searchParams.delete(k);
  return u.hostname.toLowerCase().replace(/^www\./, "") + path + u.search;
}
export function validateWorldData(input: unknown): WorldData {
  const d = input as WorldData;
  if (
    !d ||
    d.schemaVersion !== 1 ||
    ![d.sources, d.taxa, d.evidence, d.waves].every(Array.isArray)
  )
    throw Error("Invalid human-family catalogue");
  const sourceIds = new Set<string>(),
    taxa = new Set<string>(),
    ids = new Set<string>();
  for (const s of d.sources) {
    if (
      !identity(s.id) ||
      sourceIds.has(s.id) ||
      ![s.title, s.access].every(nonempty)
    )
      throw Error("Invalid or duplicate source");
    try {
      const u = new URL(s.url);
      if (u.protocol !== "https:" || u.username || u.password) throw Error();
    } catch {
      throw Error(`Invalid source URL: ${s.id}`);
    }
    sourceIds.add(s.id);
  }
  const cited = (refs: unknown) =>
    Array.isArray(refs) &&
    refs.length > 0 &&
    refs.every((id) => sourceIds.has(id));
  for (const t of d.taxa) {
    if (
      !identity(t.id) ||
      taxa.has(t.id) ||
      ![t.name, t.meaning, t.note].every(nonempty) ||
      ![
        "proposed-ancestor",
        "related-lineage",
        "living-lineage",
        "uncertain",
      ].includes(t.status) ||
      !cited(t.sourceIds)
    )
      throw Error(`Invalid taxon or source: ${t.id}`);
    taxa.add(t.id);
  }
  for (const item of [...d.evidence, ...d.waves]) {
    if (
      !identity(item.id) ||
      ids.has(item.id) ||
      ![item.title, item.dateLabel, item.summary, item.limits].every(nonempty)
    )
      throw Error(`Invalid world identity/text: ${item.id}`);
    ids.add(item.id);
    if (
      ![item.start, item.end].every(
        (n) => Number.isSafeInteger(n) && n >= -10_000_000 && n <= 1900,
      ) ||
      item.end < item.start
    )
      throw Error(`Invalid date interval: ${item.id}`);
    if (!cited(item.sourceIds)) throw Error(`Missing source: ${item.id}`);
    if (
      !Array.isArray(item.taxonIds) ||
      !item.taxonIds.length ||
      !item.taxonIds.every((id) => taxa.has(id))
    )
      throw Error(`Missing taxon: ${item.id}`);
    if (
      !Array.isArray(item.regionIds) ||
      !item.regionIds.length ||
      !item.regionIds.every((id) => worldRegions.some((r) => r.id === id))
    )
      throw Error(`Invalid region: ${item.id}`);
  }
  for (const e of d.evidence) {
    if (
      !point(e.coordinates) ||
      !nonempty(e.dateBasis) ||
      !["fossil", "archaeology", "genetics", "movement", "historical"].includes(
        e.kind,
      ) ||
      (e.guideId && !/^world-[a-z0-9-]+$/.test(e.guideId))
    )
      throw Error(`Invalid evidence: ${e.id}`);
    if (
      e.population &&
      (!Array.isArray(e.population) ||
        e.population.some(
          (p) =>
            !Number.isSafeInteger(p.year) ||
            p.year < e.start ||
            p.year > e.end ||
            !Number.isSafeInteger(p.min) ||
            !Number.isSafeInteger(p.max) ||
            p.min <= 0 ||
            p.min > p.max ||
            !["estimate", "census"].includes(p.basis) ||
            !nonempty(p.note) ||
            !cited(p.sourceIds),
        ))
    )
      throw Error(`Invalid population: ${e.id}`);
  }
  for (const w of d.waves)
    if (
      ![
        "dispersal",
        "admixture",
        "population-change",
        "journey",
        "trade",
        "campaign",
      ].includes(w.kind) ||
      !Array.isArray(w.coordinates) ||
      w.coordinates.length < 2 ||
      !w.coordinates.every(point)
    )
      throw Error(`Invalid wave: ${w.id}`);
  const validDate = (i: { start: number; end: number }) =>
    [i.start, i.end].every(
      (n) => Number.isSafeInteger(n) && n >= -10_000_000 && n <= 1900,
    ) && i.start <= i.end;
  const territoryIds = new Set<string>();
  if (d.territories !== undefined && !Array.isArray(d.territories))
    throw Error("Invalid territories");
  for (const t of d.territories ?? []) {
    if (
      !identity(t.id) ||
      ids.has(t.id) ||
      !nonempty(t.title) ||
      !nonempty(t.limits) ||
      !validDate(t) ||
      !cited(t.sourceIds) ||
      !["approximate-control", "claim", "campaign-reach"].includes(t.meaning)
    )
      throw Error(`Invalid territory: ${t.id}`);
    if (
      !Array.isArray(t.regionIds) ||
      !t.regionIds.length ||
      !t.regionIds.every((id) => worldRegions.some((r) => r.id === id))
    )
      throw Error(`Invalid territory region: ${t.id}`);
    const polys =
      t.geometry?.type === "Polygon"
        ? [t.geometry.coordinates]
        : t.geometry?.type === "MultiPolygon"
          ? t.geometry.coordinates
          : null;
    if (
      !Array.isArray(polys) ||
      !polys.length ||
      polys.some(
        (poly: any) =>
          !Array.isArray(poly) ||
          !poly.length ||
          poly.some(
            (ring: any) =>
              !Array.isArray(ring) ||
              ring.length < 4 ||
              !ring.every(point) ||
              JSON.stringify(ring[0]) !== JSON.stringify(ring.at(-1)),
          ),
      )
    )
      throw Error(`Invalid territory geometry: ${t.id}`);
    ids.add(t.id);
    territoryIds.add(t.id);
  }
  const studyIds = new Set<string>();
  if (d.studies !== undefined && !Array.isArray(d.studies))
    throw Error("Invalid studies");
  for (const s of d.studies ?? []) {
    if (
      !identity(s.id) ||
      studyIds.has(s.id) ||
      !nonempty(s.title) ||
      !nonempty(s.summary) ||
      !/^world-[a-z0-9-]+$/.test(s.guideId) ||
      !validDate(s) ||
      !Array.isArray(s.regionIds) ||
      !s.regionIds.length ||
      !s.regionIds.every((id) => worldRegions.some((r) => r.id === id))
    )
      throw Error(`Invalid study: ${s.id}`);
    if (
      !Array.isArray(s.evidenceIds) ||
      !s.evidenceIds.length ||
      !s.evidenceIds.every((id) => d.evidence.some((e) => e.id === id)) ||
      !Array.isArray(s.waveIds) ||
      !s.waveIds.every((id) => d.waves.some((w) => w.id === id)) ||
      !Array.isArray(s.territoryIds) ||
      !s.territoryIds.every((id) => territoryIds.has(id))
    )
      throw Error(`Missing study evidence or connection: ${s.id}`);
    studyIds.add(s.id);
  }
  return d;
}
export function inWorldScope(
  item: Pick<DatedWorldItem, "regionIds">,
  scope: WorldScope,
) {
  return scope === "world" || item.regionIds.includes(scope);
}
export function worldSources(
  d: WorldData,
  ids: readonly string[],
): WorldSource[] {
  const keys = new Set<string>();
  return d.sources.filter((s) => {
    if (!ids.includes(s.id)) return false;
    const k = sourceKey(s.url);
    if (keys.has(k)) return false;
    keys.add(k);
    return true;
  });
}
export function worldAtYear(
  d: WorldData,
  year: number,
  scope: WorldScope,
  taxon = "all",
) {
  const eligible = (i: DatedWorldItem) =>
    inWorldScope(i, scope) && (taxon === "all" || i.taxonIds.includes(taxon));
  if (year > 1900) return { evidence: [], waves: [] };
  return {
    evidence: d.evidence
      .filter((e) => eligible(e) && e.start <= year)
      .map((e) => ({
        ...e,
        phase: year <= e.end ? ("dated" as const) : ("earlier" as const),
      })),
    waves: d.waves.filter(
      (w) => eligible(w) && w.start <= year && year <= w.end,
    ),
  };
}
export function worldDates(
  d: WorldData,
  scope: WorldScope,
  taxon = "all",
): number[] {
  const items = [...d.evidence, ...d.waves].filter(
    (i) =>
      inWorldScope(i, scope) && (taxon === "all" || i.taxonIds.includes(taxon)),
  );
  const populations = d.evidence
    .filter(
      (i) =>
        inWorldScope(i, scope) &&
        (taxon === "all" || i.taxonIds.includes(taxon)),
    )
    .flatMap((e) => (e.population ?? []).flatMap((p) => [p.year, p.year + 1]));
  const territories = worldTerritories(d, scope, taxon).flatMap((t) => [
    t.start,
    t.end,
    t.end + 1,
  ]);
  return [
    ...new Set([
      1900,
      ...items.flatMap((i) => [i.start, i.end, i.end + 1]),
      ...populations,
      ...territories,
    ]),
  ]
    .filter((y) => y <= 1900)
    .sort((a, b) => a - b);
}
export function worldTerritories(
  d: WorldData,
  scope: WorldScope,
  taxon = "all",
) {
  return taxon === "all" || taxon === "homo-sapiens"
    ? (d.territories ?? []).filter((t) => inWorldScope(t, scope))
    : [];
}
/** D3 uses clockwise spherical exteriors, unlike conventional GeoJSON. Preserve source coordinates. */
export function worldGeometryForD3(
  geometry: WorldTerritory["geometry"],
): WorldTerritory["geometry"] {
  const polygon = (rings: [number, number][][]) =>
    rings.map((ring, index) => {
      const largerHalf =
        geoArea({ type: "Polygon", coordinates: [ring] }) > 2 * Math.PI;
      return largerHalf === (index === 0) ? [...ring].reverse() : [...ring];
    });
  return geometry.type === "Polygon"
    ? { type: "Polygon", coordinates: polygon(geometry.coordinates) }
    : { type: "MultiPolygon", coordinates: geometry.coordinates.map(polygon) };
}
export function worldRegionStats(d: WorldData, scope: WorldScope) {
  const records = d.evidence.filter((e) => inWorldScope(e, scope)),
    waves = d.waves.filter((w) => inWorldScope(w, scope));
  const taxa = d.taxa.filter((t) =>
    [...records, ...waves].some((i) => i.taxonIds.includes(t.id)),
  );
  const ids = [...records, ...waves, ...worldTerritories(d, scope), ...taxa]
    .flatMap((r) => r.sourceIds)
    .concat(
      records.flatMap((e) => (e.population ?? []).flatMap((p) => p.sourceIds)),
    );
  return {
    records: records.length,
    references: worldSources(d, ids).length,
    earliest: records.length ? Math.min(...records.map((e) => e.start)) : null,
    waves: waves.length,
  };
}
export function worldRoute(
  hash: string,
):
  | "world"
  | "origins"
  | "africa-early"
  | WorldRegion
  | `study:${string}`
  | null {
  if (!hash || hash === "#world") return "world";
  if (hash === "#origins") return "origins";
  if (/^#study\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(hash))
    return `study:${hash.slice(7)}`;
  if (hash === "#origins/europe") return "europe";
  if (hash === "#origins/americas") return "americas";
  if (hash === "#atlas/africa/early") return "africa-early";
  if (hash === "#atlas/africa") return "africa";
  if (hash === "#atlas/asia-pacific" || hash === "#atlas/asia") return "asia-pacific";
  return null;
}
/** Astronomical year: 15,000 BCE is -14,999, approximately 16,949 calendar BP. */
export const AFRICA_EARLY_END = -14999;
export function africaEarlyData(data: WorldData): WorldData {
  const eligible = (item: DatedWorldItem) =>
    item.regionIds.includes("africa") && item.start <= AFRICA_EARLY_END;
  return {
    ...data,
    evidence: data.evidence.filter(eligible),
    waves: data.waves.filter(eligible),
    territories: [],
    studies: [],
  };
}
export function deepTimeLabel(year: number): string {
  if (1950 - year >= 1_000_000)
    return `~${((1950 - year) / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 2 })} million years ago`;
  if (year <= -10000)
    return `~${((1950 - year) / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })} thousand years BP`;
  return `${(year <= 0 ? 1 - year : year).toLocaleString("en-US")} ${year <= 0 ? "BCE" : "CE"}`;
}
