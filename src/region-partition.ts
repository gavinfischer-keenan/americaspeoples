import type { EvidenceRecord } from './model';
import type { Story } from './stories';

export type PartitionRegion = 'americas' | 'pacific' | 'africa' | 'europe' | 'asia-pacific';

/**
 * Australia, New Guinea (Sahul), Aotearoa/New Zealand, Melanesia, Micronesia,
 * Polynesia, Rapa Nui, and Hawaiʻi carved cleanly out of both Asia and the Americas.
 */
export function isPacificPoint([lon, lat]: readonly [number, number]): boolean {
  return (
    (lon >= 110 && lat < -10) ||
    (lon >= 130 && lat < 28) ||
    (lon <= -135 && lat < 28) ||
    (lon <= -105 && lat < -10)
  );
}

export function coordinateRegions([lon, lat]: readonly [number, number]): PartitionRegion[] {
  if (isPacificPoint([lon, lat])) return ['pacific'];
  const regions: PartitionRegion[] = [];
  const inAleutianWest = lon < -170 || (lon >= 170 && lat >= 50 && lat <= 56);
  if ((lon >= -170 && lon < -25) || inAleutianWest) {
    regions.push('americas');
  }
  if (lon >= -20 && lon <= 60 && lat >= -36 && lat <= 37.5) {
    regions.push('africa');
  }
  if (lon >= -25 && lon <= 60 && lat >= 35) {
    regions.push('europe');
  }
  if (!regions.length || (lon > 56 && !inAleutianWest)) {
    regions.push('asia-pacific');
  }
  return regions;
}

function collectGeometryPoints(value: unknown, out: [number, number][]): void {
  if (!Array.isArray(value)) return;
  if (typeof value[0] === 'number' && typeof value[1] === 'number') {
    out.push([value[0], value[1]]);
    return;
  }
  for (const item of value) collectGeometryPoints(item, out);
}

const unlocatedPacificPattern =
  /\b(sahul|australia|australian|tasmania|lutruwita|new guinea|papua|raja ampat|wallacea|lapita|polynesia|polynesian|melanesia|melanesian|micronesia|micronesian|austronesian|hawai\w*|oahu|oʻahu|maui|kauai|kauaʻi|lanai|lānaʻi|kahoolawe|kahoʻolawe|honolulu|lahaina|bellows|tuamotu|aotearoa|maori|māori|rapa nui|easter island|fiji|samoa|tonga|tahiti|marquesas|palau|marianas|nan madol|budj bim|gunditjmara|madjedbebe|kuk swamp|pohnpei|kosrae|yap|chuuk)\b/i;

export function isPacificRecord(
  r: Pick<EvidenceRecord, 'id' | 'title' | 'location' | 'destination' | 'overlay'> & { region?: string },
): boolean {
  if (r.location) return isPacificPoint([r.location.lon, r.location.lat]);
  const pts: [number, number][] = [];
  if (r.destination) pts.push([r.destination.lon, r.destination.lat]);
  if (r.overlay?.geometry) collectGeometryPoints(r.overlay.geometry.coordinates, pts);
  if (pts.length) return pts.some((p) => isPacificPoint(p));
  return unlocatedPacificPattern.test(`${r.id} ${r.title} ${r.region ?? ''}`);
}

const unlocatedNonAmericasAsiaPattern = /\b(ryukyu|okinawa|okinawan)\b/i;

export function isAmericasRecord(
  r: Pick<EvidenceRecord, 'id' | 'title' | 'location' | 'destination' | 'overlay'> & { region?: string },
): boolean {
  if (isPacificRecord(r)) return false;
  if (r.location) {
    const { lon, lat } = r.location;
    if (lon >= 56 && lon <= 170 && lat < 50) return false;
    return true;
  }
  return !unlocatedNonAmericasAsiaPattern.test(`${r.id} ${r.title}`);
}

export const pacificStoryIds = new Set<string>([
  'pacific-arrivals',
  'hawaii-connections',
  'pacific-exchange',
  'kuk',
  'nan-madol',
  'budj-bim',
  'gunditjmara',
  'lapita',
  'aotearoa',
  'fiji-tonga-samoa',
  'central-east-polynesia',
  'rapa-nui',
  'solomons-vanuatu',
  'new-guinea-islands',
  'micronesian-island-networks',
  'timor',
]);

export function storiesForAtlasRegion(
  all: readonly Story[],
  region: 'americas' | 'pacific',
): Story[] {
  return all.filter((s) =>
    region === 'pacific'
      ? pacificStoryIds.has(s.id) || s.id === 'connected-oceans'
      : !pacificStoryIds.has(s.id),
  );
}
