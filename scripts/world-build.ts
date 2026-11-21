import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EvidenceRecord } from "../src/model";
import type { EuropeData } from "../src/europe-data";
import type { WorldGuide } from "../src/world-guide-model";
import { recordInTimeline } from "../src/time";
import {
  sourceKey,
  validateWorldData,
  worldRegions,
  type WorldData,
  type WorldRegion,
  type WorldSummary,
} from "../src/world-model";
import { renderWorldWebsite } from "../src/world-website";
import { readEuropeData } from "./europe-build";
import { readWorldGuides } from "./world-guide-data";

type Reference = { url: string; doi?: string };
type Guide = Pick<WorldGuide, "id" | "atlasIds" | "sources">;
interface SummaryInput {
  version: string;
  records: readonly EvidenceRecord[];
  europe: EuropeData;
  world: WorldData;
  guides: readonly Guide[];
}
interface Observation {
  key: string;
  title: string;
  regions: WorldRegion[];
  start: number | null;
  label: string;
  references: Reference[];
}

/** Navigation bins, deliberately overlapping in the Mediterranean; never historical borders. */
function coordinateRegions([lon, lat]: [number, number]): WorldRegion[] {
  const regions: WorldRegion[] = [];
  if (
    (lon >= -170 && lon < -25) ||
    lon < -170 ||
    (lon >= 110 && lat < -10) ||
    (lon > 141 && lat < 20)
  )
    regions.push("americas");
  if (lon >= -20 && lon <= 60 && lat >= -36 && lat <= 37.5)
    regions.push("africa");
  if (lon >= -25 && lon <= 60 && lat >= 35) regions.push("europe");
  if (!regions.length || (lon > 56 && !((lon >= 110 && lat < -10) || (lon > 141 && lat < 20))))
    regions.push("asia-pacific");
  return regions;
}
const regionsFor = (coordinates: [number, number][]) => [
  ...new Set(coordinates.flatMap(coordinateRegions)),
];

/** Explicit DOI metadata joins publisher URLs to DOI resolver aliases, transitively. */
function referenceIdentity(references: Reference[]) {
  const parents = new Map<string, string>();
  const root = (key: string): string => {
    const p = parents.get(key);
    if (!p) {
      parents.set(key, key);
      return key;
    }
    if (p === key) return key;
    const r = root(p);
    parents.set(key, r);
    return r;
  };
  const aliases = (s: Reference) => {
    const keys = [sourceKey(s.url)];
    if (s.doi?.trim()) {
      const doi = s.doi
        .trim()
        .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
        .replace(/^doi:\s*/i, "");
      if (/^10\.\d{4,9}\/.+$/i.test(doi)) keys.push("doi:" + doi.toLowerCase());
    }
    return keys;
  };
  for (const s of references) {
    const keys = aliases(s);
    for (const key of keys.slice(1)) parents.set(root(key), root(keys[0]));
    root(keys[0]);
  }
  return (items: Reference[]) =>
    new Set(items.map((s) => root(sourceKey(s.url)))).size;
}

export function createWorldSummary(input: SummaryInput): WorldSummary {
  const observations: Observation[] = [];
  for (const record of input.records.filter((r) => recordInTimeline(r))) {
    const cited = new Set(
      record.claims.flatMap((c) => c.support.map((s) => s.sourceId)),
    );
    const coordinates = [record.location, record.destination]
      .filter((p) => p !== null)
      .map((p) => [p.lon, p.lat] as [number, number]);
    if (record.overlay?.geometry) {
      const g = record.overlay.geometry;
      coordinates.push(
        ...(g.type === "Point" ? [g.coordinates] : g.coordinates),
      );
    }
    const regions = regionsFor(coordinates);
    observations.push({
      key: record.id,
      title: record.title,
      regions,
      start:
        coordinates.length && record.time.kind !== "unplaced"
          ? record.time.start
          : null,
      label: record.time.original,
      references: record.sources.filter((s) => cited.has(s.id)),
    });
  }
  const europeSources = new Map(input.europe.sources.map((s) => [s.id, s]));
  for (const e of input.europe.entries.filter((e) => e.start <= 1900)) {
    const refs = [
      ...new Set([
        ...e.sourceIds,
        ...(e.population ?? []).flatMap((p) => p.sourceIds),
      ]),
    ].map((id) => {
      const source = europeSources.get(id);
      if (!source) throw Error(`Missing Europe summary source: ${id}`);
      return source;
    });
    observations.push({
      key: e.canonicalRecordId ?? e.id,
      title: e.title,
      regions: regionsFor([
        e.coordinates,
        ...(e.destination ? [e.destination] : []),
        ...(e.routeCoordinates ?? []),
      ]),
      start: e.start,
      label: e.dateLabel,
      references: refs,
    });
  }
  const worldSources = new Map(input.world.sources.map((s) => [s.id, s]));
  const resolve = (ids: string[]) =>
    ids.map((id) => {
      const s = worldSources.get(id);
      if (!s) throw Error(`Missing world summary source: ${id}`);
      return s;
    });
  for (const e of input.world.evidence)
    observations.push({
      key: "foundation:" + e.id,
      title: e.title,
      regions: e.regionIds,
      start: e.start,
      label: e.dateLabel,
      references: resolve([
        ...new Set([
          ...e.sourceIds,
          ...(e.population ?? []).flatMap((p) => p.sourceIds),
        ]),
      ]),
    });
  const waveReferences = input.world.waves.map((w) => ({
    regions: w.regionIds,
    references: resolve(w.sourceIds),
  }));
  const territoryReferences = (input.world.territories ?? []).map((t) => ({
    regions: t.regionIds,
    references: resolve(t.sourceIds),
  }));
  const taxonReferences = input.world.taxa.map((t) => ({
    regions: [
      ...new Set(
        [...input.world.evidence, ...input.world.waves]
          .filter((e) => e.taxonIds.includes(t.id))
          .flatMap((e) => e.regionIds),
      ),
    ],
    references: resolve(t.sourceIds),
  }));
  const allReferences = [
    ...observations,
    ...waveReferences,
    ...territoryReferences,
    ...taxonReferences,
  ]
    .flatMap<Reference>((o) => o.references)
    .concat(input.guides.flatMap((g) => g.sources));
  const countReferences = referenceIdentity(allReferences);
  const guideIds = new Set(input.guides.map((g) => g.id));
  const coverage: Record<WorldRegion, string> = {
    americas:
      "Americas, Australia and Pacific archive; selected coverage from earliest occupation through 1900.",
    africa:
      "Prehistoric to 1900 CE coverage across Southern, South-Central, East, Central, Horn, West, Saharan, Nile, North Africa and the Middle East.",
    europe:
      "Earliest hominin to 1900 CE coverage spanning Pleistocene refugia, Mesolithic–Neolithic dispersals, Aegean palaces, Imperial Rome, Rus’ river corridors and industrial Britain.",
    "asia-pacific":
      "Earliest hominin to 1900 CE coverage across Central Asia, the Indus & South Asia, East Asia, Korea/Japan, Steppes, and Southeast Asia.",
  };
  return {
    version: input.version,
    records: new Set(observations.map((o) => o.key)).size,
    references: countReferences(allReferences),
    guides: guideIds.size,
    regions: worldRegions.map(({ id, title }) => {
      const items = observations.filter((o) => o.regions.includes(id));
      const earliest = items
        .filter((o): o is Observation & { start: number } => o.start !== null)
        .sort((a, b) => a.start - b.start || a.key.localeCompare(b.key))[0];
      const guides = input.guides.filter((g) => g.atlasIds.includes(id));
      const references = [
        ...items,
        ...waveReferences.filter((w) => w.regions.includes(id)),
        ...territoryReferences.filter((t) => t.regions.includes(id)),
        ...taxonReferences.filter((t) => t.regions.includes(id)),
      ]
        .flatMap<Reference>((o) => o.references)
        .concat(guides.flatMap((g) => g.sources));
      return {
        id,
        title,
        records: new Set(items.map((o) => o.key)).size,
        references: countReferences(references),
        earliest: earliest?.start ?? null,
        earliestLabel: earliest
          ? `Earliest mapped evidence: ${earliest.label} · ${earliest.title}`
          : "Earliest mapped evidence: unknown in current dated coverage",
        coverage: coverage[id],
        guides: new Set(guides.map((g) => g.id)).size,
      };
    }),
    method:
      "Records are the union of canonical published archive evidence eligible through 1900 (including undated records), Europe evidence and human-family evidence. Europe canonicalRecordId aliases count once; schematic waves are counted separately. Unmapped archive records contribute to the global count, not a regional bin or earliest mapped date. Regions use approximate navigation bins from locations, destinations and route points: Americas & Pacific covers longitudes −170 to −25 plus Australia and Oceania (lon ≥ 110 south of −10° or lon > 141 south of 20°); Africa & Middle East covers longitude −20 to 60 and latitude −36 to 37.5; Europe & Mediterranean covers longitude −25 to 60 north of 35; Asia covers mainland and island Asia east of 56° (excluding Australia and Oceania). These are not historical borders. Human-family region IDs and guide atlas memberships are authoritative. Regional overlaps are deliberate; global totals are unions, not sums. References count cited evidence, wave and taxon sources plus guide bibliographies, deduplicated by normalized URL and explicit DOI aliases. Reference counts measure coverage, not votes for a theory. Earliest dates retain source labels and identify mapped evidence, not first arrival; unknown dates remain unknown.",
    foundation: {
      evidence: input.world.evidence.filter(
        (e) =>
          !(input.world.studies ?? []).some((s) =>
            s.evidenceIds.includes(e.id),
          ),
      ).length,
      waves: input.world.waves.filter(
        (w) =>
          !(input.world.studies ?? []).some((s) => s.waveIds.includes(w.id)),
      ).length,
      taxa: input.world.taxa.filter(t => !t.id.endsWith("-unassigned")).length,
    },
    studies: (input.world.studies ?? []).map(
      ({ id, title, summary, guideId }) => ({ id, title, summary, guideId }),
    ),
  };
}

export function mergeWorldShards(shards: unknown[]): WorldData {
  if (!shards.length)
    throw Error(
      "Missing human-family research: data/world contains no catalogue shards",
    );
  const combined: WorldData = {
    schemaVersion: 1,
    sources: [],
    taxa: [],
    evidence: [],
    waves: [],
  };
  for (const raw of shards) {
    const shard = raw as WorldData;
    if (
      !shard ||
      shard.schemaVersion !== 1 ||
      ![shard.sources, shard.taxa, shard.evidence, shard.waves].every(
        Array.isArray,
      )
    )
      throw Error("Invalid human-family catalogue shard");
    for (const source of shard.sources) {
      const prior = combined.sources.find((s) => s.id === source.id);
      if (prior && JSON.stringify(prior) !== JSON.stringify(source))
        throw Error(`Conflicting world source: ${source.id}`);
      if (!prior) combined.sources.push(source);
    }
    for (const taxon of shard.taxa) {
      const prior = combined.taxa.find((t) => t.id === taxon.id);
      if (prior && JSON.stringify(prior) !== JSON.stringify(taxon))
        throw Error(`Conflicting world taxon: ${taxon.id}`);
      if (!prior) combined.taxa.push(taxon);
    }
    combined.evidence.push(...shard.evidence);
    combined.waves.push(...shard.waves);
    if (shard.studies !== undefined) {
      if (!Array.isArray(shard.studies)) throw Error("Invalid world studies");
      (combined.studies ??= []).push(...shard.studies);
    }
    if (shard.territories !== undefined) {
      if (!Array.isArray(shard.territories))
        throw Error("Invalid world territories");
      (combined.territories ??= []).push(...shard.territories);
    }
  }
  return validateWorldData(combined);
}

/** Generate only local release artifacts. Every returned path is relative to dist. */
export async function buildWorldCatalogue(): Promise<string[]> {
  let names: string[];
  try {
    names = (await readdir("data/world"))
      .filter((n) => n.endsWith(".json"))
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      throw Error("Missing human-family research directory: data/world");
    throw error;
  }
  const catalogue = mergeWorldShards(
    await Promise.all(
      names.map(async (n) =>
        JSON.parse(await readFile(`data/world/${n}`, "utf8")),
      ),
    ),
  );
  if (!catalogue.evidence.length)
    throw Error(
      "Human-family catalogue must contain evidence before publication",
    );
  const [{ dataset }, europe, guides] = await Promise.all([
    import("../src/published-data"),
    readEuropeData(),
    readWorldGuides(),
  ]);
  const summary = createWorldSummary({
    version: dataset.version,
    records: dataset.records,
    europe,
    world: catalogue,
    guides,
  });
  const outputs = new Map<string, string>([
    ["world-catalogue.json", JSON.stringify(catalogue) + "\n"],
    ["world-summary.json", JSON.stringify(summary, null, 2) + "\n"],
  ]);
  const site = "tripofisch-site/spread-of-peoples/";
  outputs.set(
    site + "world-catalogue.json",
    outputs.get("world-catalogue.json")!,
  );
  outputs.set(site + "world-summary.json", outputs.get("world-summary.json")!);
  for (const [name, html] of renderWorldWebsite(summary))
    outputs.set(site + name, html);
  for (const [name, contents] of outputs) {
    const file = path.join("dist", name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, contents);
  }
  return [...outputs.keys()];
}
