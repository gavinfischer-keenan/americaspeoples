import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { esc } from '../src/dom';
import type { WorldGuideMedia } from './world-guide-media';

export type RockArtRegion = 'north-america' | 'africa-middle-east' | 'europe' | 'asia-pacific' | 'south-america';
export type RockArtMedium = 'pictograph' | 'petroglyph' | 'cave-art' | 'geoglyph' | 'relief-architecture';
export type RockArtScale = 'monumental-cave' | 'open-air-panel' | 'desert-overhang' | 'earth-surface' | 'settlement-sanctuary';
export type RockArtEra = 'pleistocene' | 'early-mid-holocene' | 'late-holocene';

export interface RockArtSpecimen {
  id: string;
  mediaId: string;
  guideIds: string[];
  region: RockArtRegion;
  regionLabel: string;
  culture: string;
  site: string;
  location: string;
  medium: RockArtMedium;
  mediumLabel: string;
  scale: RockArtScale;
  scaleLabel: string;
  era: RockArtEra;
  eraLabel: string;
  dateLabel: string;
  summary: string;
  exploreQuery: string;
}

const VALID_REGIONS = new Set<RockArtRegion>(['north-america', 'africa-middle-east', 'europe', 'asia-pacific', 'south-america']);
const VALID_MEDIA = new Set<RockArtMedium>(['pictograph', 'petroglyph', 'cave-art', 'geoglyph', 'relief-architecture']);
const VALID_SCALES = new Set<RockArtScale>(['monumental-cave', 'open-air-panel', 'desert-overhang', 'earth-surface', 'settlement-sanctuary']);
const VALID_ERAS = new Set<RockArtEra>(['pleistocene', 'early-mid-holocene', 'late-holocene']);
const nonempty = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

export function validateRockArtSpecimens(input: unknown, mediaAssets: readonly WorldGuideMedia[]): RockArtSpecimen[] {
  const payload = input as { schemaVersion?: unknown; specimens?: unknown } | null;
  if (!payload || payload.schemaVersion !== 1 || !Array.isArray(payload.specimens)) {
    throw new Error('Invalid rock-art gallery manifest');
  }
  const mediaById = new Map(mediaAssets.map(a => [a.id, a]));
  const ids = new Set<string>();
  for (const s of payload.specimens as RockArtSpecimen[]) {
    if (!s || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.id) || ids.has(s.id)) {
      throw new Error('Invalid or duplicate rock-art specimen id: ' + s?.id);
    }
    ids.add(s.id);
    if (!mediaById.has(s.mediaId)) {
      throw new Error(`Specimen ${s.id} references missing mediaId ${s.mediaId}`);
    }
    if (!Array.isArray(s.guideIds) || !s.guideIds.length || s.guideIds.some(g => !/^world-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(g))) {
      throw new Error(`Specimen ${s.id} has invalid guideIds`);
    }
    if (!VALID_REGIONS.has(s.region) || !VALID_MEDIA.has(s.medium) || !VALID_SCALES.has(s.scale) || !VALID_ERAS.has(s.era)) {
      throw new Error(`Specimen ${s.id} has invalid classification taxonomy`);
    }
    if (![s.regionLabel, s.culture, s.site, s.location, s.mediumLabel, s.scaleLabel, s.eraLabel, s.dateLabel, s.summary, s.exploreQuery].every(nonempty)) {
      throw new Error(`Specimen ${s.id} is missing required descriptive fields`);
    }
  }
  return payload.specimens as RockArtSpecimen[];
}

export async function readRockArtSpecimens(mediaAssets: readonly WorldGuideMedia[]): Promise<RockArtSpecimen[]> {
  const raw = JSON.parse(await readFile('data/rock-art-gallery.json', 'utf8'));
  return validateRockArtSpecimens(raw, mediaAssets);
}

export async function copyRockArtGalleryAssets(mediaAssets: readonly WorldGuideMedia[]): Promise<RockArtSpecimen[]> {
  const specimens = await readRockArtSpecimens(mediaAssets);
  await mkdir('sites', { recursive: true });
  await copyFile('scripts/rock-art-gallery-browser.js', 'sites/rock-art-gallery.js');
  return specimens;
}

export function rockArtGalleryHTML(
  guideId: string,
  specimens: readonly RockArtSpecimen[],
  mediaAssets: readonly WorldGuideMedia[],
  showRegionFilter = true,
): string {
  const subset = specimens.filter(s => s.guideIds.includes(guideId));
  if (!subset.length) return '';
  const mediaById = new Map(mediaAssets.map(a => [a.id, a]));
  const regions = [...new Map(subset.map(s => [s.region, s.regionLabel])).entries()];
  const mediaKinds = [...new Map(subset.map(s => [s.medium, s.mediumLabel])).entries()];
  const scales = [...new Map(subset.map(s => [s.scale, s.scaleLabel])).entries()];
  const eras = [...new Map(subset.map(s => [s.era, s.eraLabel])).entries()];

  const cards = subset.map(s => {
    const asset = mediaById.get(s.mediaId)!;
    return `<article id="specimen-${esc(s.id)}" class="rock-art-card" data-ra-region="${esc(s.region)}" data-ra-medium="${esc(s.medium)}" data-ra-scale="${esc(s.scale)}" data-ra-era="${esc(s.era)}">
      <a class="rock-art-thumb" href="media/${esc(asset.file)}">
        <img src="media/${esc(asset.file)}" width="${asset.width}" height="${asset.height}" loading="lazy" decoding="async" alt="${esc(asset.alt)}">
      </a>
      <div class="rock-art-body">
        <div class="rock-art-tags">
          <span class="rock-art-badge">${esc(s.mediumLabel)}</span>
          <span class="rock-art-scale">${esc(s.scaleLabel)}</span>
        </div>
        <h3>${esc(s.site)}</h3>
        <p class="rock-art-meta"><strong>${esc(s.dateLabel)}</strong> · ${esc(s.location)}</p>
        <p class="rock-art-culture">Culture / attribution: ${esc(s.culture)}</p>
        <p>${esc(s.summary)}</p>
        <div class="rock-art-links">
          <a href="media/${esc(asset.file)}">Full-size image ↗</a>
          <a href="${esc(asset.sourceUrl)}">Wikimedia source ↗</a>
          <a href="${esc(asset.licenseUrl)}">${esc(asset.license)}</a>
          <a href="../#explore?category=rock-art&q=${encodeURIComponent(s.exploreQuery)}">Find in Explore ↗</a>
        </div>
        <p class="rock-art-credit">Photograph: ${esc(asset.credit)}</p>
      </div>
    </article>`;
  }).join('');

  return `<section id="rock-art-gallery" class="rock-art-gallery">
    <h2>In Toto Specimen Archive · Visual records from caves to open overhangs</h2>
    <p>Filter verified open-licensed field photographs across traditions, media, and settings—from deep Paleolithic painted caverns like Lascaux and Chauvet to high-desert Nevada overhangs, Saharan canyons, Southern African shelters, and early stone settlements. Dates on rock art are approximate envelopes established by stratigraphy, luminescence, tufa carbonate, or pigment AMS analysis.</p>
    <div class="rock-art-filters">
      <label>Find a site, culture, or motif<input type="search" id="rock-art-search" placeholder="Try Lascaux, Nevada, ochre, camel, hand stencil…"></label>
      ${showRegionFilter && regions.length > 1 ? `<label>Region<select id="rock-art-region"><option value="">All regions</option>${regions.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select></label>` : ''}
      <label>Medium<select id="rock-art-medium"><option value="">All media</option>${mediaKinds.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select></label>
      <label>Setting &amp; scale<select id="rock-art-scale"><option value="">All settings</option>${scales.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select></label>
      <label>Approximate era<select id="rock-art-era"><option value="">All eras</option>${eras.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select></label>
      <button type="button" id="rock-art-reset">Reset filters</button>
    </div>
    <p id="rock-art-result-count" role="status">${subset.length} exemplar photographs in this archive</p>
    <div class="rock-art-grid">${cards}</div>
    <p id="rock-art-empty" hidden>No matching specimen photographs found. Reset filters to view all ${subset.length} exemplars.</p>
    <script src="rock-art-gallery.js" defer></script>
  </section>`;
}

export const rockArtGalleryCSS = `
.rock-art-gallery{margin:2.2rem 0}
.rock-art-filters{display:flex;gap:.85rem;flex-wrap:wrap;padding:1rem;background:#E8EEF1;border:1px solid #B4BEC4;border-radius:8px;margin-bottom:1rem}
.rock-art-filters label{min-width:0;display:flex;flex:1 1 165px;flex-direction:column;gap:.25rem;font-size:.82rem;font-weight:700;color:#10171A}
.rock-art-filters input,.rock-art-filters select,.rock-art-filters button{font:inherit;padding:.55rem .65rem;border:1px solid #8D99A1;border-radius:5px;background:#fff;color:#10171A;max-width:100%;min-height:42px}
.rock-art-filters button{align-self:end;background:#569E56;color:#10171A;border-color:#244D26;font-weight:700;cursor:pointer;flex:0 0 auto}
.rock-art-filters button:hover{background:#72B273}
#rock-art-result-count{font-weight:700;color:#244D26;margin:.5rem 0 1rem}
.rock-art-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,330px),1fr));gap:1.25rem}
.rock-art-card{display:flex;flex-direction:column;background:#F2F6F8;border:1px solid #B4BEC4;border-bottom:3px solid #3B783D;border-radius:8px;overflow:hidden;min-width:0;scroll-margin-top:1rem}
.rock-art-card[hidden]{display:none}
.rock-art-thumb{display:block;background:#10171A;aspect-ratio:4/3;overflow:hidden}
.rock-art-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.rock-art-body{padding:1rem 1.05rem;display:flex;flex-direction:column;gap:.45rem;min-width:0}
.rock-art-tags{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center}
.rock-art-badge{display:inline-block;padding:.15rem .5rem;border-radius:4px;background:#569E56;color:#10171A;font-size:.74rem;font-weight:700}
.rock-art-scale{display:inline-block;padding:.15rem .5rem;border-radius:4px;background:#E3E8EB;color:#525D64;font-size:.74rem;font-weight:600}
.rock-art-body h3{margin:.15rem 0 0;font-size:1.12rem;line-height:1.3;color:#10171A}
.rock-art-meta{margin:0;font-size:.86rem;color:#A63108}
.rock-art-culture{margin:0;font-size:.86rem;color:#244D26;font-weight:600}
.rock-art-body p{margin:0;font-size:.92rem;line-height:1.5}
.rock-art-links{display:flex;flex-wrap:wrap;gap:.35rem .85rem;margin-top:.35rem;font-size:.82rem}
.rock-art-links a{color:#244D26;font-weight:600}
.rock-art-credit{font-size:.78rem;color:#525D64;overflow-wrap:anywhere}
`;
