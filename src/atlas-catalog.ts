import pacific from '../data/atlases/pacific/manifest.json';
import africa from '../data/atlases/africa/manifest.json';
import europe from '../data/atlases/europe/manifest.json';
import asiaPacific from '../data/atlases/asia-pacific/manifest.json';

export type PlannedAtlasId = 'pacific' | 'africa' | 'europe' | 'asia-pacific';
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
export interface ActiveEuropeManifest extends Omit<PlannedAtlasManifest,'id'|'status'> {
  id:'europe';status:'available';
}
export interface ActiveFoundationManifest extends Omit<PlannedAtlasManifest,'id'|'status'> {id:'pacific'|'africa'|'asia-pacific';status:'available'}
export type RegionalAtlasManifest=PlannedAtlasManifest|ActiveEuropeManifest|ActiveFoundationManifest;
export function validateFoundationManifest(value:unknown):ActiveFoundationManifest {
 const m=value as ActiveFoundationManifest;
 const hasData=Array.isArray(m?.dataFiles)&&(m.dataFiles.includes('world-catalogue.json')||m.dataFiles.includes('dataset.json'));
 if(!m||m.schemaVersion!==1||!['pacific','africa','asia-pacific'].includes(m.id)||m.status!=='available'||!m.title?.trim()||!hasData)throw Error('Invalid foundation atlas manifest');
 if(!Array.isArray(m.map?.center)||m.map.center.length!==2||!m.map.center.every(Number.isFinite))throw Error('Invalid foundation map configuration');
 return m;
}
export function validateActiveEuropeManifest(value:unknown):ActiveEuropeManifest {
  const m=value as ActiveEuropeManifest;
  if(!m||m.schemaVersion!==1||m.id!=='europe'||m.status!=='available'||!m.title?.trim()||!Array.isArray(m.dataFiles)||!m.dataFiles.includes('europe-catalogue.json'))throw Error('Invalid active Europe manifest');
  if(!Array.isArray(m.map?.center)||m.map.center.length!==2||!m.map.center.every(Number.isFinite))throw Error('Invalid Europe map configuration');
  return m;
}

const plannedIds: readonly string[] = ['pacific', 'africa', 'europe', 'asia-pacific'];
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

const manifests: Record<PlannedAtlasId, RegionalAtlasManifest> = {
  pacific: validateFoundationManifest(pacific),
  africa: validateFoundationManifest(africa),
  europe: validateActiveEuropeManifest(europe),
  'asia-pacific': validateFoundationManifest(asiaPacific),
};

/** Bundled configuration; evidence is loaded separately by the active controller. */
export function loadAtlasManifest(id: PlannedAtlasId): RegionalAtlasManifest {
  return manifests[id];
}

export const atlases: readonly { id: AtlasId; title: string; status: 'available' | 'coming-soon'; href: string }[] = [
  { id: 'americas', title: 'Americas', status: 'available', href: '#movie' },
  ...Object.values(manifests).map(m => ({ id: m.id, title: m.title, status: m.status, href: `#atlas/${m.id}` })),
];

export function resolveAtlasRoute(hash: string): PlannedAtlasId | null {
  return Object.values(manifests).find(m => hash === `#atlas/${m.id}`)?.id ?? null;
}
