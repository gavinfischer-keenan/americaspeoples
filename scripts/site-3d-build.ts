import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import type { EvidenceRecord } from '../src/model';
import {
  guideImageHTML,
  guideImageCaptionHTML,
  htmlEscape as esc,
  safeSourceURL,
  type GuideMedia,
  type GuideSource,
} from './guide-enrichment';

export type Site3DClassification =
  | 'observed-survey'
  | 'observed-photogrammetry'
  | 'survey-derived-reconstruction'
  | 'interpretive-reconstruction';

export interface Site3DAnnotation {
  id: string;
  label: string;
  recordId: string;
  position: [number, number, number];
  dates?: string;
  summary?: string;
}

export interface Site3DExternalSurvey {
  title: string;
  creator: string;
  url: string;
  note: string;
}

export interface Site3DModel {
  id: string;
  guideIds: string[];
  siteRecordId: string;
  title: string;
  classification: Site3DClassification;
  classificationLabel: string;
  file: string;
  format: 'glb';
  bytes: number;
  sha256: string;
  vertexCount: number;
  triangleCount: number;
  scaleNote: string;
  provenance: {
    creator: string;
    creatorUrl?: string;
    captureDate: string;
    publicationDate?: string;
    method: string;
    processing?: string;
    revision: number;
    sourcePage: string;
    sourceUrl?: string;
    citations: GuideSource[];
  };
  license: {
    name: string;
    url: string;
    evidence: string;
    projectLicenseApplies: boolean;
  };
  fallback: {
    mediaId: string;
    alt: string;
    summary: string;
    spatialNotes: string;
  };
  camera: {
    position: [number, number, number];
    target: [number, number, number];
    fovDeg: number;
  };
  annotations: Site3DAnnotation[];
  relatedExternalSurveys?: Site3DExternalSurvey[];
}

export interface Site3DManifest {
  version: number;
  models: Site3DModel[];
}

const SLUG = /^[a-z0-9][a-z0-9-]*$/;
const GLB_FILE = /^[a-z0-9-]+\.glb$/;
const MAX_GLB_BYTES = 15_000_000;
const VALID_CLASSIFICATIONS = new Set<Site3DClassification>([
  'observed-survey',
  'observed-photogrammetry',
  'survey-derived-reconstruction',
  'interpretive-reconstruction',
]);
const hasText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

function checkSafeHttps(url: string, context: string): void {
  if (!hasText(url) || !/^https:\/\//i.test(url)) {
    throw new Error(`Unsafe 3D provenance URL (${context}): ${url}`);
  }
  safeSourceURL(url);
}

export async function validateSite3DManifest(
  manifest: Site3DManifest,
  media: GuideMedia,
  records: readonly Pick<EvidenceRecord, 'id'>[],
  baseDir = 'data/site-3d/',
): Promise<void> {
  if (!manifest || !Array.isArray(manifest.models)) {
    throw new Error('Invalid site-3d-models manifest');
  }
  const mediaIds = new Set(media.images.map((m) => m.id));
  const recordIds = new Set(records.map((r) => r.id));
  const seenIds = new Set<string>();

  for (const model of manifest.models) {
    if (!model || !hasText(model.id) || !SLUG.test(model.id)) {
      throw new Error('Invalid 3D model id: ' + model?.id);
    }
    if (seenIds.has(model.id)) throw new Error('Duplicate 3D model id: ' + model.id);
    seenIds.add(model.id);

    if (!GLB_FILE.test(model.file) || model.format !== 'glb') {
      throw new Error('Invalid 3D model filename or format: ' + model.file);
    }
    if (!VALID_CLASSIFICATIONS.has(model.classification) || !hasText(model.classificationLabel)) {
      throw new Error('Invalid 3D classification: ' + model.id);
    }
    if (!Array.isArray(model.guideIds) || !model.guideIds.length) {
      throw new Error('3D model requires at least one guideId: ' + model.id);
    }
    if (!recordIds.has(model.siteRecordId)) {
      throw new Error(`Unknown siteRecordId ${model.siteRecordId} in 3D model ${model.id}`);
    }
    if (!Number.isSafeInteger(model.bytes) || model.bytes <= 0 || model.bytes > MAX_GLB_BYTES) {
      throw new Error('Invalid 3D file byte size: ' + model.id);
    }

    const bytes = await readFile(baseDir + model.file);
    if (bytes.length !== model.bytes) {
      throw new Error(`3D byte count mismatch for ${model.id}: expected ${model.bytes}, got ${bytes.length}`);
    }
    const sha = createHash('sha256').update(bytes).digest('hex');
    if (sha !== model.sha256) {
      throw new Error(`3D SHA-256 mismatch for ${model.id}`);
    }
    if (bytes.length < 20 || bytes.readUInt32LE(0) !== 0x46546c67 || bytes.readUInt32LE(4) !== 2) {
      throw new Error(`Invalid glTF 2.0 binary header for ${model.id}`);
    }

    const p = model.provenance;
    if (!p || !hasText(p.creator) || !hasText(p.captureDate) || !hasText(p.method) || !Number.isSafeInteger(p.revision) || p.revision < 1) {
      throw new Error('Incomplete 3D provenance metadata: ' + model.id);
    }
    checkSafeHttps(p.sourcePage, model.id + ' sourcePage');
    if (p.creatorUrl) checkSafeHttps(p.creatorUrl, model.id + ' creatorUrl');
    if (p.sourceUrl) checkSafeHttps(p.sourceUrl, model.id + ' sourceUrl');
    if (!Array.isArray(p.citations) || !p.citations.length) {
      throw new Error('3D model requires citations: ' + model.id);
    }
    for (const c of p.citations) {
      if (!c || !hasText(c.title)) throw new Error('Citation missing title in ' + model.id);
      checkSafeHttps(c.url, model.id + ' citation');
    }

    if (!model.license || !hasText(model.license.name) || !hasText(model.license.evidence) || model.license.projectLicenseApplies !== false) {
      throw new Error('Invalid 3D license metadata: ' + model.id);
    }
    checkSafeHttps(model.license.url, model.id + ' license.url');

    if (!model.fallback || !mediaIds.has(model.fallback.mediaId) || !hasText(model.fallback.summary)) {
      throw new Error('3D model requires verified fallback image in guide-media: ' + model.id);
    }

    for (const ann of model.annotations) {
      if (!ann || !hasText(ann.id) || !hasText(ann.label) || !recordIds.has(ann.recordId)) {
        throw new Error(`Invalid 3D annotation in ${model.id}: ${ann?.recordId}`);
      }
      if (!Array.isArray(ann.position) || ann.position.length !== 3 || !ann.position.every(Number.isFinite)) {
        throw new Error(`Invalid 3D annotation coordinates in ${model.id}: ${ann.id}`);
      }
    }
    for (const ext of model.relatedExternalSurveys ?? []) {
      checkSafeHttps(ext.url, model.id + ' relatedExternalSurvey');
    }
  }
}

export async function copySite3DModels(manifest: Site3DManifest): Promise<void> {
  await mkdir('sites/models', { recursive: true });
  for (const model of manifest.models) {
    await copyFile('data/site-3d/' + model.file, 'sites/models/' + model.file);
  }
  await writeFile('sites/models/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
}

function formatMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export function site3DHTML(
  guideId: string,
  manifest: Site3DManifest,
  media: GuideMedia,
): string {
  const models = manifest.models.filter((m) => m.guideIds.includes(guideId));
  if (!models.length) return '';

  const cards = models
    .map((m) => {
      const fallbackImage = media.images.find((img) => img.id === m.fallback.mediaId);
      if (!fallbackImage) throw new Error('Missing fallback media for 3D model: ' + m.id);
      const isObserved = m.classification.startsWith('observed-');
      const badgeClass = isObserved ? 'site-3d-badge-observed' : 'site-3d-badge-reconstruction';
      const viewerConfig = JSON.stringify({
        id: m.id,
        title: m.title,
        src: 'models/' + m.file,
        bytes: m.bytes,
        classificationLabel: m.classificationLabel,
        camera: m.camera,
        annotations: m.annotations,
      }).replace(/</g, '\\u003c');

      const citationsHTML = m.provenance.citations
        .map((c) => `<li><a href="${safeSourceURL(c.url)}" target="_blank" rel="noopener">${esc(c.title)} ↗</a></li>`)
        .join('');

      const annotationsHTML = m.annotations.length
        ? `<details class="site-3d-structures"><summary>Structures anchored in this 3D scene (${m.annotations.length})</summary><ul>${m.annotations
            .map(
              (a) =>
                `<li><a href="../#review/${encodeURIComponent(a.recordId)}">${esc(a.label)}</a>${a.dates ? ` · <span>${esc(a.dates)}</span>` : ''}${a.summary ? ` — ${esc(a.summary)}` : ''}</li>`,
            )
            .join('')}</ul></details>`
        : '';

      const externalHTML = m.relatedExternalSurveys?.length
        ? `<details class="site-3d-external"><summary>Additional external 3D surveys (not bundled)</summary><ul>${m.relatedExternalSurveys
            .map(
              (s) =>
                `<li><a href="${safeSourceURL(s.url)}" target="_blank" rel="noopener">${esc(s.title)} ↗</a> — ${esc(s.creator)}. ${esc(s.note)}</li>`,
            )
            .join('')}</ul></details>`
        : '';

      return `<article class="site-3d-card" data-site-3d="${esc(m.id)}">
  <script type="application/json" data-site-3d-config>${viewerConfig}</script>
  <div class="site-3d-header">
    <span class="site-3d-badge ${badgeClass}">${esc(m.classificationLabel)}</span>
    <h3>${esc(m.title)}</h3>
    <p class="site-3d-meta">Creator: ${m.provenance.creatorUrl ? `<a href="${safeSourceURL(m.provenance.creatorUrl)}" target="_blank" rel="noopener">${esc(m.provenance.creator)} ↗</a>` : esc(m.provenance.creator)} · Capture: ${esc(m.provenance.captureDate)} · Revision ${m.provenance.revision}</p>
  </div>
  <div class="site-3d-controls-bar">
    <button type="button" class="site-3d-load-btn" data-load-3d>Load interactive 3D model (${formatMB(m.bytes)})</button>
    <button type="button" data-cancel-3d hidden>Cancel download</button>
    <button type="button" data-unload-3d hidden>Unload 3D (show static photo)</button>
    <p class="site-3d-status" data-3d-status role="status" aria-live="polite">Static documentation photograph displayed. No 3D geometry is loaded until requested.</p>
  </div>
  <div class="site-3d-toolbar" data-3d-toolbar role="group" aria-label="3D view controls" hidden>
    <button type="button" data-3d-action="left" aria-label="Rotate left">↺ Left</button>
    <button type="button" data-3d-action="right" aria-label="Rotate right">↻ Right</button>
    <button type="button" data-3d-action="up" aria-label="Tilt up">↑ Tilt up</button>
    <button type="button" data-3d-action="down" aria-label="Tilt down">↓ Tilt down</button>
    <button type="button" data-3d-action="in" aria-label="Zoom in">+</button>
    <button type="button" data-3d-action="out" aria-label="Zoom out">−</button>
    <button type="button" data-3d-action="labels">Hide labels</button>
    <button type="button" data-3d-action="reset">Reset view</button>
    <button type="button" data-3d-action="fullscreen">Full screen</button>
  </div>
  <div class="site-3d-stage" data-3d-stage hidden>
    <canvas class="site-3d-canvas" data-3d-canvas tabindex="0" aria-label="${esc(m.title)} interactive 3D terrain. Use arrow keys to orbit, plus and minus to zoom, R to reset, L to toggle structure labels."></canvas>
    <div class="site-3d-pins" data-3d-pins aria-label="3D structure labels"></div>
  </div>
  <figure class="site-3d-fallback" data-3d-fallback>
    ${guideImageHTML(fallbackImage, 'site-3d-fallback-img')}
    ${guideImageCaptionHTML(fallbackImage)}
    <p class="site-3d-fallback-note">${esc(m.fallback.summary)} ${esc(m.fallback.spatialNotes)}</p>
  </figure>
  <dl class="site-3d-provenance">
    <div><dt>Classification</dt><dd>${esc(m.classificationLabel)}</dd></div>
    <div><dt>Creator &amp; capture date</dt><dd>${esc(m.provenance.creator)} (${esc(m.provenance.captureDate)}${m.provenance.publicationDate ? `, published ${esc(m.provenance.publicationDate)}` : ''})</dd></div>
    <div><dt>Method &amp; scale</dt><dd>${esc(m.provenance.method)} ${esc(m.scaleNote)}</dd></div>
    <div><dt>Mesh &amp; revision</dt><dd>glTF 2.0 binary (${formatMB(m.bytes)}, ${m.vertexCount.toLocaleString()} vertices, ${m.triangleCount.toLocaleString()} triangles) · Revision ${m.provenance.revision}</dd></div>
    <div><dt>License</dt><dd><a href="${safeSourceURL(m.license.url)}" target="_blank" rel="noopener">${esc(m.license.name)} ↗</a> — ${esc(m.license.evidence)} This 3D asset retains its own terms and is not subject to the atlas’s noncommercial license.</dd></div>
  </dl>
  ${annotationsHTML}
  <details class="site-3d-citations"><summary>3D model provenance &amp; citations (${m.provenance.citations.length})</summary><ul>${citationsHTML}</ul></details>
  ${externalHTML}
</article>`;
    })
    .join('');

  return `<section id="model-3d" class="site-3d-section" aria-labelledby="model-3d-heading">
  <h2 id="model-3d-heading">Interactive 3D survey (loaded on demand)</h2>
  <p>Large 3D survey files are kept separate from the global atlas catalog and load only when you request them. Each model states whether it is observed survey data or an interpretive reconstruction, with capture provenance and an accessible photographic fallback.</p>
  ${cards}
</section>`;
}

export const site3DCSS = `
.site-3d-section{margin:2rem 0;padding:1.25rem;background:#F2F6F8;border:1px solid #8E99A0;border-radius:8px}
.site-3d-section>h2{margin-top:0}
.site-3d-card{background:#fff;border:1px solid #B4BEC4;border-radius:8px;padding:1.1rem;margin-top:1rem}
.site-3d-header h3{margin:.4rem 0 .25rem}
.site-3d-meta{margin:0 0 .8rem;font-size:.9rem;color:#525D64}
.site-3d-badge{display:inline-block;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:3px 9px;border-radius:4px}
.site-3d-badge-observed{background:#DCEBDD;color:#244D26;border:1px solid #72B273}
.site-3d-badge-reconstruction{background:#FBE9D7;color:#7A3A00;border:1px solid #D99B5E}
.site-3d-controls-bar{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin-bottom:.85rem}
.site-3d-load-btn{font:700 14px system-ui,sans-serif;min-height:40px;padding:8px 16px;background:#244D26;color:#F2F6F8;border:1px solid #10171A;border-radius:6px;cursor:pointer}
.site-3d-load-btn:hover:not(:disabled){background:#3B783D}
.site-3d-load-btn:disabled{opacity:.65;cursor:wait}
.site-3d-controls-bar button:not(.site-3d-load-btn){font:600 14px system-ui,sans-serif;min-height:38px;padding:7px 12px;background:#E3E8EB;color:#10171A;border:1px solid #8E99A0;border-radius:5px;cursor:pointer}
.site-3d-status{margin:0;font-size:.88rem;color:#36545F}
.site-3d-toolbar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 10px;background:#10171A;color:#F2F6F8;border-radius:6px 6px 0 0}
.site-3d-toolbar button{font:600 13px system-ui,sans-serif;min-height:34px;padding:5px 10px;background:#F2F6F8;color:#10171A;border:1px solid #8E99A0;border-radius:4px;cursor:pointer}
.site-3d-stage{position:relative;width:100%;height:min(64vh,520px);background:#E3E8EB;border:1px solid #10171A;border-top:0;border-radius:0 0 6px 6px;overflow:hidden}
.site-3d-card:fullscreen{display:flex;flex-direction:column;height:100vh;width:100vw;padding:12px;overflow:auto;border-radius:0}
.site-3d-card:fullscreen .site-3d-stage{flex:1;height:auto;min-height:360px}
.site-3d-canvas{display:block;width:100%;height:100%;touch-action:none;cursor:grab}
.site-3d-canvas:active{cursor:grabbing}
.site-3d-pins{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.site-3d-pin{position:absolute;transform:translate(-50%,-100%);pointer-events:auto;background:rgba(16,23,26,.88);color:#F2F6F8;font-size:12px;font-weight:600;line-height:1.2;padding:3px 7px;border-radius:4px;border:1px solid #72B273;text-decoration:none;white-space:nowrap}
.site-3d-pin:hover,.site-3d-pin:focus-visible{background:#244D26;color:#fff}
.site-3d-fallback{margin:0;background:#F2F6F8;border:1px solid #CFD6DA;border-radius:6px;overflow:hidden}
.site-3d-fallback img{display:block;width:100%;height:auto;max-height:460px;object-fit:contain;background:#E3E8EB}
.site-3d-fallback figcaption,.site-3d-fallback-note{padding:.6rem 1rem;margin:0;font-size:.9rem}
.site-3d-fallback-note{border-top:1px solid #CFD6DA;background:#fff;color:#36545F}
.site-3d-provenance{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:.7rem 1.2rem;margin:1rem 0 0;padding:.9rem 1rem;background:#F2F6F8;border:1px solid #CFD6DA;border-radius:6px;font-size:.88rem}
.site-3d-provenance dt{font-weight:700;color:#10171A}
.site-3d-provenance dd{margin:.15rem 0 0;color:#36545F}
.guide-return-bar{display:inline-flex;align-items:center;gap:8px;margin:.4rem 0 .8rem;padding:6px 12px;background:#DCEBDD;border:1px solid #72B273;border-radius:6px;font-size:.92rem;font-weight:600}
`;
