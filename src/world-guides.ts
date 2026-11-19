import catalog from '../data/world-guide-index.json';
import {esc} from './dom';
import type {WorldGuideIndex} from './world-guide-model';
import type {PlannedAtlasId} from './atlas-catalog';
export const worldGuides=catalog.guides as WorldGuideIndex[];
export function voyageGuideLinksHTML(id:string):string{
 const guides=worldGuides.filter(g=>g.voyageIds?.includes(id));
 return guides.length?`<p class="voyage-regional-guides">Explore the other shores: ${guides.map(g=>`<a href="${esc(g.href)}#voyage-${esc(id)}">${esc(g.title)}</a>`).join(' · ')}</p>`:'';
}
export function regionalGuidesHTML(atlas:PlannedAtlasId):string{
 const guides=worldGuides.filter(g=>g.atlasIds.includes(atlas));
 if(!guides.length)return '';
 return `<section class="regional-guides" aria-labelledby="regional-guides-title"><p class="eyebrow">START READING</p><h2 id="regional-guides-title">Deep dives available now</h2><p>Explore the places, finds and connections in these illustrated studies. Each guide has its own dated evidence and maps. The regional movie map is coming later.</p><div class="dive-grid">${guides.map(g=>`<article class="dive-card"><h3><a href="${esc(g.href)}">${esc(g.title)}</a></h3><p>${esc(g.description)}</p><a href="${esc(g.href)}">Read the guide ↗</a></article>`).join('')}</div></section>`;
}
