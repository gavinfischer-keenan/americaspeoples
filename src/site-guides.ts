import catalog from '../data/site-guides.json';
import { esc } from './dom';

/** Explicit editorial links, independent of chronology and cultural classification.
 * No title matching: a regional article must not claim every similarly named site.
 * Detailed articles remain static documents, loaded only when opened.
 */
export const siteGuides = catalog.guides;
const byRecord = new Map(siteGuides.flatMap(g => g.recordIds.map(id => [id, g] as const)));
export const guideForRecord = (id: string) => byRecord.get(id);
export function guideLink(id: string): string {
  const guide = guideForRecord(id);
  return guide ? `<a class="site-guide-link" href="${esc(guide.href)}">◈ Explore ${esc(guide.title)} · Site guide ↗</a>` : '';
}
export function siteGuideIndex(): string {
  return `<article class="review-page"><div class="eyebrow">PLACES / ARCHITECTURE / CONNECTIONS</div><h2>Places and cultures</h2><p class="lead">Detailed studies of individual complexes and their surrounding communities.</p><p>Each page separates buildings, settlements and wider networks. Research reviews retain their citations and access limits; a regional date is not a construction date for every building.</p>${['site','culture'].map(kind => `<h3>${kind==='site'?'Places and complexes':'Cultures and civilizations'}</h3><div class="guide-grid">${siteGuides.filter(g=>g.kind===kind).map(g => `<section><h3><a href="${esc(g.href)}">${esc(g.title)} ↗</a></h3><p>${esc(g.region)}</p><p>${esc(g.description)}</p></section>`).join('')}</div>`).join('')}<p>On the map, the ◈ symbol and “Site guide available” identify evidence connected to a published page. Natural events have a separate map-layer control; an event near a settlement does not establish an impact.</p></article>`;
}
