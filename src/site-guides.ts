import catalog from '../data/site-guides.json';
import { esc } from './dom';

/** Explicit editorial links, independent of chronology and cultural classification.
 * No title matching: a regional article must not claim every similarly named site.
 * Detailed articles remain static documents, loaded only when opened.
 */
export interface SiteGuide {
 id:string; title:string; href:string; region:string; description:string;
 recordIds:string[]; kind:'site'|'culture'|'route'; report:string; relatedGuideIds?:string[];
 storyId?:string; topicId?:string; parentGuideId?:string; level?:'region'|'complex'|'building'; referenceRecordIds?:string[];
 mapAspectRatio?:number;
 /** Optional local terrain selection; the guide and shared movie retain all evidence. */
 mapRecordIds?:string[];
}
export const siteGuides = catalog.guides as SiteGuide[];
const byRecord = new Map(siteGuides.flatMap(g => g.recordIds.map(id => [id, g] as const)));
const buildingByRef = new Map<string, SiteGuide[]>();
for (const g of siteGuides) {
  if (g.level !== 'building') continue;
  for (const id of [...g.recordIds, ...(g.referenceRecordIds ?? [])]) {
    const list = buildingByRef.get(id) ?? [];
    if (!list.includes(g)) list.push(g);
    buildingByRef.set(id, list);
  }
}
export const guideForRecord = (id: string) => byRecord.get(id);
export const buildingGuidesForRecord = (id: string): readonly SiteGuide[] => buildingByRef.get(id) ?? [];
export function guideLink(id: string): string {
  const guide = guideForRecord(id);
  const buildings = buildingGuidesForRecord(id).filter(b => b.id !== guide?.id);
  const mainLink = guide ? `<a class="site-guide-link" href="${esc(guide.href)}">◈ Explore ${esc(guide.title)} · Site guide ↗</a>` : '';
  const buildingLinks = buildings.map(b => `<a class="site-guide-link" href="${esc(b.href)}">◈ ${esc(b.title)} · 3D &amp; site deep dive ↗</a>`).join('');
  return mainLink + buildingLinks;
}
