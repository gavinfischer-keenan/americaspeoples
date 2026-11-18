import type { EvidenceRecord } from '../src/model';
import {
  guideImageCaptionHTML, guideImageHTML, guideImagePath, htmlEscape as esc,
  safeSourceURL, type GuideMedia, type GuideSource,
} from './guide-enrichment';

type Landmark = { label: string; description: string; recordIds: string[] };
type Feature = {
  id: string; label: string; shape: 'rect' | 'ellipse';
  x: number; y: number; width: number; height: number; recordIds: string[];
};
type Diagram = {
  width: number;
  height: number;
  features: Feature[];
  connections?: { from: string; to: string; label: string }[];
};
type PlanDetails = {
  id: string; guideId: string; title: string; description: string; landmarks: Landmark[];
};
export type VillagePlan = PlanDetails & (
  | { mediaId: string; surveyDate: string; sources?: GuideSource[]; diagram?: never }
  | { diagram: Diagram; sources: GuideSource[]; surveyDate?: string; mediaId?: never }
);

type PlanRecord = Pick<EvidenceRecord, 'id' | 'title'> & { time: Pick<EvidenceRecord['time'], 'original'> };
const diagramCaption = 'Explanatory diagram — not to scale or geographically positioned';
const slug = /^[a-z0-9][a-z0-9-]*$/;
const recordID = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/;
const hasText = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
const positive = (value: number) => Number.isFinite(value) && value > 0;
const recordHref = (id: string) => '../#review/' + encodeURIComponent(id);

function planSourceURL(value: string): string {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) throw new Error('Unsafe village plan source URL');
  return safeSourceURL(value);
}

function linkedRecords(ids: string[], records: Map<string, PlanRecord>, context: string): PlanRecord[] {
  if (!Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length) throw new Error('Missing or duplicate village plan record links: ' + context);
  return ids.map(id => {
    const record = typeof id === 'string' && recordID.test(id) ? records.get(id) : null;
    if (!record) throw new Error('Invalid village plan record: ' + context + ' (' + id + ')');
    return record;
  });
}

function recordLinksHTML(records: PlanRecord[]): string {
  return `<ul class="village-plan-records">${records.map(record => `<li><a href="${recordHref(record.id)}">${esc(record.title)}</a><span>${esc(record.time.original)}</span></li>`).join('')}</ul>`;
}

function chartHTML(plan: VillagePlan, media: GuideMedia): string {
  const matches = media.images.filter(image => image.id === plan.mediaId);
  const image = matches[0];
  if (matches.length !== 1 || image.role !== 'site-plan' || !image.guideIds.includes(plan.guideId)) {
    throw new Error('Invalid village plan media assignment: ' + plan.id);
  }
  if (![image.title, image.alt, image.caption, image.creator, image.license, image.licenseEvidence, image.changes].every(hasText)) {
    throw new Error('Missing village plan image attribution or labels: ' + image.id);
  }
  for (const url of [image.sourcePage, image.sourceUrl, image.licenseUrl]) planSourceURL(url);
  if (image.creatorUrl !== undefined) planSourceURL(image.creatorUrl);
  return `<p><a href="${guideImagePath(image)}" target="_blank" rel="noopener">Open full-resolution chart (new tab) ↗</a></p>
<figure class="village-plan-chart">${guideImageHTML(image, 'village-plan-image')}${guideImageCaptionHTML(image)}</figure>`;
}

function center(feature: Feature): [number, number] {
  return [feature.x + feature.width / 2, feature.y + feature.height / 2];
}

function boundaryToward(feature: Feature, [x, y]: [number, number]): [number, number] {
  const [cx, cy] = center(feature);
  const dx = x - cx, dy = y - cy;
  const sx = dx / (feature.width / 2), sy = dy / (feature.height / 2);
  const scale = feature.shape === 'ellipse' ? Math.hypot(sx, sy) : Math.max(Math.abs(sx), Math.abs(sy));
  return [cx + dx / scale, cy + dy / scale];
}

function diagramHTML(plan: VillagePlan, diagram: Diagram, records: Map<string, PlanRecord>): string {
  if (!positive(diagram.width) || !positive(diagram.height) || !Array.isArray(diagram.features) || !diagram.features.length) {
    throw new Error('Invalid village plan diagram dimensions or features: ' + plan.id);
  }
  const features = new Map<string, Feature>();
  const extraRecordLinks: string[] = [];
  const shapes = diagram.features.map(feature => {
    const { id, label, shape, x, y, width, height } = feature;
    if (typeof id !== 'string' || !slug.test(id) || features.has(id) || !hasText(label) || !['rect', 'ellipse'].includes(shape) ||
        !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || !positive(width) || !positive(height) ||
        width > diagram.width - x || height > diagram.height - y) {
      throw new Error('Invalid or duplicate village plan feature: ' + plan.id + ' / ' + id);
    }
    features.set(id, feature);
    const related = linkedRecords(feature.recordIds, records, plan.id + ' / ' + id);
    if (related.length > 1) extraRecordLinks.push(`<li><strong>${esc(label)}</strong>${recordLinksHTML(related)}</li>`);
    const [cx, cy] = center(feature);
    const outline = shape === 'ellipse'
      ? `<ellipse cx="${cx}" cy="${cy}" rx="${width / 2}" ry="${height / 2}"/>`
      : `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6"/>`;
    return `<a href="${recordHref(related[0].id)}" aria-label="${esc(label)}. Atlas history for ${esc(related[0].title)}">
  ${outline}<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central">${esc(label)}</text>
</a>`;
  }).join('');

  const prefix = 'village-plan-' + plan.id;
  if (diagram.connections !== undefined && !Array.isArray(diagram.connections)) throw new Error('Invalid village plan connections: ' + plan.id);
  const arrows = (diagram.connections ?? []).map(({ from, to, label }) => {
    const origin = features.get(from), target = features.get(to);
    if (!origin || !target || !hasText(label)) throw new Error('Invalid village plan connection: ' + plan.id + ' / ' + from + ' to ' + to);
    const start = center(origin), end = center(target);
    if (start[0] === end[0] && start[1] === end[1]) throw new Error('Village plan connection has coincident endpoints: ' + plan.id);
    const [x1, y1] = boundaryToward(origin, end), [x2, y2] = boundaryToward(target, start);
    return `<g role="group" aria-label="${esc(origin.label)} to ${esc(target.label)}. ${esc(label)}">
  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#${prefix}-arrow)"/>
  <text class="village-plan-relationship" x="${x1 / 2 + x2 / 2}" y="${y1 / 2 + y2 / 2 - 9}" text-anchor="middle">${esc(label)}</text>
</g>`;
  }).join('');

  const marker = arrows ? `<defs><marker id="${prefix}-arrow" viewBox="0 0 8 8" refX="8" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs>` : '';
  return `<figure class="village-plan-diagram-figure">
  <div class="village-plan-diagram-scroll" tabindex="0" role="region" aria-label="Scrollable village diagram">
    <svg class="village-plan-diagram" viewBox="0 0 ${diagram.width} ${diagram.height}" role="group" aria-labelledby="${prefix}-title" aria-describedby="${prefix}-description">
      <title id="${prefix}-title">${esc(plan.title)}</title>
      <desc id="${prefix}-description">${diagramCaption}. ${esc(plan.description)}</desc>
      ${marker}${arrows}${shapes}
    </svg>
  </div>
  <figcaption>${diagramCaption}.</figcaption>
</figure>${extraRecordLinks.length ? `<ul class="village-plan-feature-references" aria-label="Additional records for diagram features">${extraRecordLinks.join('')}</ul>` : ''}`;
}

function sourcesHTML(plan: VillagePlan): string {
  if (plan.sources === undefined && !plan.diagram) return '';
  if (!Array.isArray(plan.sources) || !plan.sources.length || plan.sources.some(source => !source || !hasText(source.title))) {
    throw new Error('Missing village plan sources or source titles: ' + plan.id);
  }
  return `<p class="village-plan-sources">Sources · ${plan.sources.map(source => `<a href="${planSourceURL(source.url)}">${esc(source.title)}</a>`).join(' · ')}</p>`;
}

export function villagePlansHTML(guideId: string, plans: VillagePlan[], media: GuideMedia, rows: PlanRecord[]): string {
  const ids = new Set<string>();
  for (const plan of plans) {
    if (!plan || typeof plan.id !== 'string' || !slug.test(plan.id)) throw new Error('Invalid village plan ID');
    if (ids.has(plan.id)) throw new Error('Duplicate village plan ID: ' + plan.id);
    ids.add(plan.id);
  }
  const matching = plans.filter(plan => plan.guideId === guideId);
  if (!matching.length) return '';
  const records = new Map(rows.map(record => [record.id, record]));
  const articles = matching.map(plan => {
    if ((plan.mediaId === undefined) === (plan.diagram === undefined)) throw new Error('Village plan requires exactly one chart or diagram: ' + plan.id);
    if (!hasText(plan.title) || !hasText(plan.description)) throw new Error('Missing village plan title or description: ' + plan.id);
    if ((plan.mediaId !== undefined || plan.surveyDate !== undefined) && !hasText(plan.surveyDate)) throw new Error('Missing village plan date: ' + plan.id);
    if (!Array.isArray(plan.landmarks) || !plan.landmarks.length) throw new Error('Missing village plan landmarks: ' + plan.id);
    const landmarks = plan.landmarks.map(landmark => {
      if (!landmark || !hasText(landmark.label) || !hasText(landmark.description)) throw new Error('Missing village plan landmark label or description: ' + plan.id);
      const related = linkedRecords(landmark.recordIds, records, plan.id + ' / ' + landmark.label);
      return `<li><h5>${esc(landmark.label)}</h5><p>${esc(landmark.description)}</p>${recordLinksHTML(related)}</li>`;
    }).join('');
    const sources = sourcesHTML(plan);
    const figure = plan.diagram ? diagramHTML(plan, plan.diagram, records) : chartHTML(plan, media);
    const date = plan.surveyDate ? `<p class="village-plan-date"><strong>${plan.diagram ? 'Source date' : 'Survey date'}</strong> ${esc(plan.surveyDate)}</p>` : '';
    return `<article class="village-plan" id="village-plan-${plan.id}" data-village-plan="${plan.id}">
  <h3>${esc(plan.title)}</h3>${date}
  <p class="village-plan-description">${esc(plan.description)}</p>
  ${figure}${sources}
  <h4>Places and structures in the atlas</h4>
  <ul class="village-plan-landmarks">${landmarks}</ul>
</article>`;
  }).join('');
  return `<section id="village-plans" aria-labelledby="village-plans-heading"><h2 id="village-plans-heading">Village plans</h2>${articles}</section>`;
}

export const villagePlanCSS = `
#village-plans{margin:2rem 0;border-bottom:1px solid #c8d6dd;padding-bottom:1.25rem}
#village-plans h2{margin:.8rem 0}
.village-plan{margin:1.3rem 0 2rem}
.village-plan h3,.village-plan h4{margin:1rem 0 .4rem}
.village-plan-description{max-width:75ch}
.village-plan-date{color:#425766;font-size:.9rem;margin:.35rem 0}
.village-plan-chart,.village-plan-diagram-figure{margin:1rem 0;background:white;border:1px solid #c8d6dd}
.village-plan-chart img{display:block;width:100%;height:auto;background:#edf1f1}
.village-plan-chart figcaption,.village-plan-diagram-figure figcaption{padding:.5rem 1rem;font-size:.9rem}
.village-plan-chart figcaption p{margin:.45rem 0}
.village-plan-diagram-scroll{overflow:auto}
.village-plan-diagram{display:block;width:100%;min-width:32rem;height:auto;background:#eef4f5}
.village-plan-diagram rect,.village-plan-diagram ellipse{fill:#fff;stroke:#356376;stroke-width:2}
.village-plan-diagram a:hover :is(rect,ellipse),.village-plan-diagram a:focus-visible :is(rect,ellipse){fill:#fff3cc;stroke:#825700;stroke-width:3}
.village-plan-diagram text{font:600 15px system-ui,sans-serif;fill:#17243d}
.village-plan-diagram line{stroke:#356376;stroke-width:2}
.village-plan-diagram marker{fill:#356376}
.village-plan-diagram .village-plan-relationship{font-size:13px;paint-order:stroke;stroke:#eef4f5;stroke-width:4px;stroke-linejoin:round}
.village-plan-landmarks{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:.8rem}
.village-plan-landmarks>li{background:white;border:1px solid #c8d6dd;padding:.9rem 1rem;min-width:0}
.village-plan-landmarks h5{font-size:1rem;margin:0}
.village-plan-landmarks p{margin:.35rem 0 .6rem}
.village-plan-records,.village-plan-feature-references{padding-left:1.25rem;margin:.3rem 0}
.village-plan-records li{margin:.25rem 0}
.village-plan-records span{display:block;font-size:.87rem;color:#425766}
`;
