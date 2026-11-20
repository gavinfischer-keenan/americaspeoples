import {topics} from './topic-dives';
import {stories} from './stories';
import {siteGuides} from './site-guides';
import {esc} from './dom';
import {worldGuides} from './world-guides';

export const diveCategories=[
 {id:'subjects',title:'Subjects',mark:'↔',description:'Follow a crop, a craft, a trade network or a chapter of shared history.'},
 {id:'places',title:'Places',mark:'◈',description:'Look closely at settlements, buildings and the communities around them.'},
 {id:'languages',title:'Languages',mark:'≋',description:'Explore language relationships, movement and contact—with uncertainty in view.'},
 {id:'cultures',title:'Cultures',mark:'◎',description:'Follow peoples and cultural traditions across places and generations.'},
] as const;
export type DiveCategory=typeof diveCategories[number]['id'];
interface DiveLink {href:string;label:'Independent movie'|'Contextual movie'|'Read guide'}
export interface DeepDive {id:string;title:string;description:string;category:DiveCategory;links:DiveLink[];expansion?:string;parentGuideId?:string}
const topicCategory:Record<string,DiveCategory>={languages:'languages','andean-languages':'languages','iroquoian-languages':'languages','maya-languages':'languages','austronesian-languages':'languages',haudenosaunee:'cultures','amazonian-peoples':'cultures'};
const storyCategory:Record<string,DiveCategory>={
 'pacific-arrivals':'subjects','hawaii-connections':'places','built-places':'subjects','chaco-connections':'places',
 'pacific-exchange':'subjects','connected-oceans':'subjects','early-american-evidence':'subjects',
 'caribbean-latin-cities':'places','communities-westward-colonization':'subjects','coercion-and-atlantic-crossings':'subjects',
 'peoples-of-the-north':'cultures','caral-supe':'places',kuk:'places',upano:'places',
};
const expansionPlaces=new Set(['chaco','hovenweep','mesa-verde','canyons-of-the-ancients','machu-picchu','cahokia']);
const combinedStories=new Set(siteGuides.map(g=>g.storyId).filter(Boolean));
const planned=(id:string,title:string,description:string,category:DiveCategory):DeepDive=>({id,title,description,category,links:[]});
const worldGuideMovies: Record<string, string> = {
 'world-human-family': '#origins',
 'world-genghis-khan': '#study/genghis-khan',
 'world-marco-polo': '#study/marco-polo',
 'world-silk-roads': '#study/silk-roads',
 'world-hannibal': '#study/hannibal',
};
const availableDives:DeepDive[]=[
 ...worldGuides.map(g=>({id:g.id,title:g.title,description:g.description,category:g.category,links:[{href:g.href,label:'Read guide' as const},...(worldGuideMovies[g.id]?[{href:worldGuideMovies[g.id],label:'Independent movie' as const}]:[])]})),
 ...topics.map(t=>({id:'topic-'+t.id,title:t.title,description:t.description,category:topicCategory[t.id]??'subjects',links:[{href:'#topic/'+t.id,label:'Independent movie' as const},...siteGuides.filter(g=>g.topicId===t.id).map(g=>({href:g.href,label:'Read guide' as const}))]})),
 ...siteGuides.filter(g=>!g.topicId).map(g=>({id:'place-'+g.id,title:g.title,description:g.description,category:(g.kind==='culture'?'cultures':g.kind==='route'?'subjects':'places') as DiveCategory,
  links:[{href:g.href,label:'Read guide' as const},...stories.filter(s=>s.id===g.storyId).map(s=>({href:'#story/'+s.id,label:'Contextual movie' as const}))],
  ...(g.parentGuideId?{parentGuideId:g.parentGuideId}:{}),
  ...(expansionPlaces.has(g.id)?{expansion:'Expanded building detail and local chronology. Coverage remains selected.'}:{})})),
 ...stories.filter(s=>!combinedStories.has(s.id)).map(s=>{
  if(!storyCategory[s.id])throw new Error('Assign a deep-dive category to story '+s.id);
  return {id:'story-'+s.id,title:s.title,description:s.description,category:storyCategory[s.id],links:[{href:'#story/'+s.id,label:'Contextual movie' as const}]};
 }),
];
const plannedDives:DeepDive[]=[
 planned('australian-wool','Australia: convicts, stations and wool ships','Transportation, town and station growth, Aboriginal dispossession and resistance, and the ships connecting wool ports to Britain.','subjects'),
 planned('australian-mining','Australia: mines, towns and export ports','Extraction, labour, growing towns and infrastructure, linked to Indigenous land and water dispossession. Through 1934.','subjects'),
 ...[
  ['chavin','Chavín de Huántar','Architecture, ritual spaces and connections across the Andes.'],
  ['tiwanaku','Tiwanaku','Buildings, farming landscapes and regional connections.'],
  ['chan-chan','Chan Chan','Compounds, water systems and the communities of Chimor.'],
  ['teotihuacan','Teotihuacan','Neighbourhoods, apartment compounds and the changing city.'],
  ['monte-alban','Monte Albán','Construction, valley settlements and political change.'],
  ['calakmul','Calakmul','Urban landscapes and connections with other Maya centres.'],
  ['copan','Copán','Buildings, inscriptions and communities in the valley.'],
  ['paquime','Paquimé','Multistorey dwellings, water systems and exchange.'],
  ['poverty-point','Poverty Point','Earthworks, habitation and long-distance materials.'],
  ['hopewell','Hopewell earthworks','Individual complexes, construction and connections.'],
  ['san-agustin','San Agustín','Settlements, monuments and their local chronologies.'],
  ['tierradentro','Tierradentro','Tombs, settlement and the limits of current evidence.'],
  ['casarabe','Casarabe: Cotoca and Landívar','Individual centres, engineered landscapes and connections.'],
  ['nan-madol','Nan Madol','A dedicated study beyond the existing Pacific complexes guide.'],
  ['budj-bim','Budj Bim','Gunditjmara Country, settlement and engineered waterways.'],
 ].map(([id,title,description])=>planned(id,title,description,'places')),
 planned('austronesian-languages','Austronesian languages across the islands','A dedicated study of proposed family branches, contact and the limits of mapping language movement.','languages'),
 planned('andean-languages','Quechuan and Aymaran histories','Language relationships, regional spread and contact; political boundaries are not language boundaries.','languages'),
 planned('iroquoian-languages','Iroquoian languages','Distinct communities, related languages and changing distributions.','languages'),
 planned('maya-languages','Maya languages','Branches, inscriptions and living languages, with separate kinds of evidence.','languages'),
 planned('wari','Wari histories','Provincial centres, networks and regional change.','cultures'),
 planned('moche','Moche communities','Local histories, architecture and exchange along the north coast of Peru.','cultures'),
 planned('lapita','Lapita communities and successors','Pottery, voyaging and later island histories, without equating an archaeological label with one people.','cultures'),
 planned('gunditjmara','Gunditjmara histories','A community history connected to the proposed Budj Bim place study.','cultures'),
];

const availableStudyIds=new Set([...topics.map(t=>t.id),...siteGuides.map(g=>g.id)]);
export const deepDives:DeepDive[]=[...availableDives,...plannedDives.filter(d=>!availableStudyIds.has(d.id))];

function card(d:DeepDive):string{
 return `<article class="dive-card${d.links.length?'':' dive-planned'}" data-dive="${esc(d.id)}"><span class="dive-status">${d.links.length?'Available now':'Coming soon'}</span><h3>${esc(d.title)}</h3><p>${esc(d.description)}</p>${d.expansion?`<p class="dive-expansion">Guide available · ${esc(d.expansion)}</p>`:''}${d.links.length?`<div class="dive-actions">${d.links.map(l=>`<a href="${esc(l.href)}">${l.label} <span aria-hidden="true">↗</span></a>`).join('')}</div>`:''}</article>`;
}
function countText(entries:DeepDive[]):string{
 const queued=entries.filter(d=>!d.links.length).length;
 return `${entries.filter(d=>d.links.length).length} available${queued?` · ${queued} coming soon`:''}`;
}
/** One directory home per guide, with local studies visibly nested in their region. */
function groupedCards(entries:DeepDive[]):string{
 const render=(d:DeepDive):string=>{
  const guideId=d.id.startsWith('place-')?d.id.slice(6):undefined;
  const children=guideId?entries.filter(c=>c.parentGuideId===guideId):[];
  return children.length?`<section class="dive-region" data-region="${esc(guideId!)}">${card(d)}<div class="dive-region-children"><h4>Look closer · places in this history</h4><div class="dive-grid">${children.map(render).join('')}</div></div></section>`:card(d);
 };
 const roots=entries.filter(d=>!d.parentGuideId||!entries.some(p=>p.id==='place-'+d.parentGuideId));
 const hasChildren=(d:DeepDive)=>entries.some(c=>d.id==='place-'+c.parentGuideId);
 return roots.sort((a,b)=>Number(hasChildren(b))-Number(hasChildren(a))).map(render).join('');
}
export function deepDiveIndexHTML(category?:string,returnHref='#movie'):string{
 const selected=diveCategories.find(c=>c.id===category);
 const entries=deepDives.filter(d=>d.category===selected?.id);
 const queued=entries.filter(d=>!d.links.length);
 const queue=queued.length?`<section class="dive-queue"><h3>Coming soon</h3><p>Planned studies. Some places already have map records or shorter chapters; these entries reserve a dedicated treatment.</p><div class="dive-grid">${queued.map(card).join('')}</div></section>`:'';
 const listing=selected?`<p class="dive-count">${countText(entries)}</p><div class="dive-grid">${groupedCards(entries.filter(d=>d.links.length))}</div>${queue}`:
  `<div class="dive-category-grid">${diveCategories.map(c=>`<a class="dive-category" href="#dives/${c.id}"><span class="dive-mark" aria-hidden="true">${c.mark}</span><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p><small>${countText(deepDives.filter(d=>d.category===c.id))} <span aria-hidden="true">↗</span></small></a>`).join('')}</div>`;
 return `<article class="library-page deep-dive-index"><div class="dive-heading"><div><span class="eyebrow">DEEP DIVES</span><h2>${selected?esc(selected.title):'Choose your way in.'}</h2><p class="lead">${selected?esc(selected.description):'One connected world. Different ways to look more closely.'}</p></div><a class="dive-return" href="${esc(returnHref)}">↔ Return to the shared atlas</a></div><nav class="dive-tabs" aria-label="Deep-dive categories"><a href="#dives" ${!selected?'aria-current="page"':''}>All lists</a>${diveCategories.map(c=>`<a href="#dives/${c.id}" ${selected?.id===c.id?'aria-current="page"':''}>${c.title}</a>`).join('')}</nav>${listing}<aside class="dive-modes"><h3>Two ways to watch</h3><p><strong>Contextual movies</strong> focus the shared atlas on a place or story. Zoom out to see everything else happening at that date.</p><p><strong>Independent movies</strong> follow only their subject, on their own timeline. Returning to the shared atlas restores your view.</p><p><strong>Guides</strong> bring together local detail, sources and open questions. Available does not mean complete.</p></aside></article>`;
}
