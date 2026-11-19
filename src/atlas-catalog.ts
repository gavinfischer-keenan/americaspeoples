import africa from '../data/atlases/africa/manifest.json';
import europe from '../data/atlases/europe/manifest.json';
import asiaPacific from '../data/atlases/asia-pacific/manifest.json';

export type PlannedAtlasId = 'africa' | 'europe' | 'asia-pacific';
export type AtlasId = 'americas' | PlannedAtlasId;
export interface PlannedAtlasManifest {
  schemaVersion: 1;
  id: PlannedAtlasId;
  title: string;
  status: 'coming-soon';
  map: { projection: 'orthographic'; center: [number, number]; scale: number };
  dataFiles: string[];
  recordIds: string[];
  storyIds: string[];
  overlayFiles: string[];
  sourceIds: string[];
}

const plannedIds: readonly string[] = ['africa', 'europe', 'asia-pacific'];
const contentLists = ['dataFiles', 'recordIds', 'storyIds', 'overlayFiles', 'sourceIds'] as const;

/** Coming-soon manifests cannot activate any evidence or historical overlays. */
export function validatePlannedAtlasManifest(value: unknown): PlannedAtlasManifest {
  if (!value || typeof value !== 'object') throw new Error('Invalid atlas manifest.');
  const m = value as PlannedAtlasManifest;
  if (m.schemaVersion !== 1 || !plannedIds.includes(m.id) || m.status !== 'coming-soon' || typeof m.title !== 'string' || !m.title.trim()) {
    throw new Error('Invalid planned atlas identity or status.');
  }
  for (const key of contentLists) {
    if (!Array.isArray(m[key]) || m[key].length !== 0) throw new Error(`Coming-soon atlas ${key} must be empty.`);
  }
  if (m.map?.projection !== 'orthographic' || !Array.isArray(m.map.center) || m.map.center.length !== 2 ||
      !m.map.center.every(Number.isFinite) || Math.abs(m.map.center[0]) > 180 || Math.abs(m.map.center[1]) > 90 ||
      !Number.isFinite(m.map.scale) || m.map.scale <= 0 || m.map.scale > 1000) {
    throw new Error('Invalid atlas preview map configuration.');
  }
  return m;
}

const manifests: Record<PlannedAtlasId, PlannedAtlasManifest> = {
  africa: validatePlannedAtlasManifest(africa),
  europe: validatePlannedAtlasManifest(europe),
  'asia-pacific': validatePlannedAtlasManifest(asiaPacific),
};

/** Bundled configuration only; this hook never loads a regional evidence catalog. */
export function loadAtlasManifest(id: PlannedAtlasId): PlannedAtlasManifest {
  return manifests[id];
}

export const atlases: readonly { id: AtlasId; title: string; status: 'available' | 'coming-soon'; href: string }[] = [
  { id: 'americas', title: 'Americas', status: 'available', href: '#movie' },
  ...Object.values(manifests).map(m => ({ id: m.id, title: m.title, status: m.status, href: `#atlas/${m.id}` })),
];

export function resolveAtlasRoute(hash: string): PlannedAtlasId | null {
  return Object.values(manifests).find(m => hash === `#atlas/${m.id}`)?.id ?? null;
}
