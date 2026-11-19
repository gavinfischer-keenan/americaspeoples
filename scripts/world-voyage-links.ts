import type {Voyage} from '../src/voyages';
import type {PlannedAtlasId} from '../src/atlas-catalog';
import {esc} from '../src/dom';
export interface AtlasVoyageLink {voyageId:string;atlasId:PlannedAtlasId;stops:{index:number;name:string;arrival:string;departure:string}[]}
export function validateAtlasVoyageLinks(links:AtlasVoyageLink[],voyages:Voyage[]){
 const seen=new Set<string>();
 for(const link of links){
  const v=voyages.find(v=>v.id===link.voyageId),key=link.atlasId+'/'+link.voyageId;
  if(!v||!['africa','europe','asia-pacific'].includes(link.atlasId)||seen.has(key)||!link.stops.length)throw Error('Invalid cross-atlas voyage '+key);seen.add(key);
  let previousIndex=-1;
  for(const anchor of link.stops){const stop=v.stops[anchor.index];if(!Number.isInteger(anchor.index)||anchor.index<=previousIndex||!stop||stop.name!==anchor.name||stop.arrival!==anchor.arrival||stop.departure!==anchor.departure)throw Error('Stale cross-atlas stop '+key);previousIndex=anchor.index;}
 }
}
export function worldVoyagesHTML(atlas:PlannedAtlasId,links:AtlasVoyageLink[],voyages:Voyage[],sources:{id:string;title:string;url:string}[],guideVoyageIds:string[]):string{
 validateAtlasVoyageLinks(links,voyages);
 const selected=links.filter(l=>l.atlasId===atlas).sort((a,b)=>voyages.find(v=>v.id===a.voyageId)!.stops[0].arrival.localeCompare(voyages.find(v=>v.id===b.voyageId)!.stops[0].arrival));
 const declared=new Set(guideVoyageIds);
 if(declared.size!==guideVoyageIds.length||declared.size!==selected.length||selected.some(link=>!declared.has(link.voyageId))){
  throw Error('Voyage guide membership does not match the regional catalogue: '+atlas);
 }
 return `<section id="connected-voyages"><h2>Journeys and their documented stops</h2><p>${selected.length} itineraries in the shared catalogue include anchors in this regional collection. Open a journey to follow its existing timeline. Dates and notes below come directly from the same canonical itinerary; a passage or sighting is not automatically a landing.</p>${selected.map(link=>{const v=voyages.find(v=>v.id===link.voyageId)!;return `<details id="voyage-${esc(v.id)}"><summary>${esc(v.name)}</summary><p>${esc(v.summary)}</p><p><a href="../#voyage/${encodeURIComponent(v.id)}">Follow this journey on the shared map ↗</a></p><ol class="voyage-stops">${link.stops.map(anchor=>{const s=v.stops[anchor.index];return `<li><strong>${esc(s.name)}</strong> · ${esc(s.arrival)}${s.departure!==s.arrival?' – '+esc(s.departure):''}<p>${esc(s.note)}${s.gapAfter?' The following movement is not reconstructed.':''}</p>${s.recordId?`<a href="../#review/${encodeURIComponent(s.recordId)}">Read the linked evidence</a>`:''}</li>`;}).join('')}</ol><p>${esc(v.precision)}</p><ul>${[...new Set([...v.sourceIds,...link.stops.flatMap(a=>v.stops[a.index].sourceIds??[])])].map(id=>{const s=sources.find(s=>s.id===id);if(!s)throw Error('Missing canonical voyage source '+id);return `<li><a href="${esc(s.url)}">${esc(s.title)}</a></li>`;}).join('')}</ul></details>`;}).join('')}</section>`;
}
