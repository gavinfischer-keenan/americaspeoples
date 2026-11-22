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
 {id:'origin-stories',title:'Origin Stories',mark:'✦',description:'Where did we come from? Religious, sacred and Indigenous creation and emergence accounts from oral and written traditions worldwide — distinct from the factual physical map.'},
] as const;
export type DiveCategory=typeof diveCategories[number]['id'];
interface DiveLink {href:string;label:'Independent movie'|'Contextual movie'|'Read guide'}
export interface DeepDive {id:string;title:string;description:string;category:DiveCategory;atlasIds:string[];links:DiveLink[];expansion?:string;parentGuideId?:string}
const ALL_REGIONS = ['americas','pacific','africa','europe','asia-pacific'];
function atlasIdsForSiteRegion(region: string): string[] {
 const s = region.toLowerCase();
 const out: string[] = [];
 if (/pacific|polynesia|micronesia|melanesia|australia|hawai|rapa nui|easter island|new guinea|yap|marianas|tonga|samoa|fiji|aotearoa|tahiti|marquesas|torres|solomon|vanuatu|palau|chuuk|pohnpei|kosrae|niue|tuvalu|kiribati|nan madol|sahul/.test(s)) out.push('pacific');
 if (/africa|egypt|nile|levant|sahara|ethiopia|swahili|sahel|zimbabwe|nubia|maghreb|congo|kalahari|chad/.test(s)) out.push('africa');
 if (/europe|mediterranean|rome|greece|aegean|iberia|alps|britain|scandinavia|anatolia|danube|viking/.test(s)) out.push('europe');
 if (/asia|china|india|indus|steppe|silk|angkor|borobudur|bagan|japan|korea|mongol|mekong|persia|iran|mesopotamia|arabia|anatolia/.test(s)) out.push('asia-pacific');
 if (/america|peru|andes|maya|aztec|mexic|olmec|mississip|chaco|amazon|brazil|colombia|chile|patagonia|arctic|aleut|inuit|canada|alaska|caribbean|pueblo|hopewell|cahokia|iroquois|haudenosaunee|mesa verde|tiwanaku|inca/.test(s) || !out.length) out.push('americas');
 return [...new Set(out)];
}
function atlasIdsForStoryScenes(id: string, scenes: readonly {scope?: string}[]): string[] {
 const out = new Set<string>();
 if (/pacific|yap|micronesia|hawaii|kuk|rapa|samoa|austronesian|aus-|sahul|oceania/.test(id.toLowerCase())) out.add('pacific');
 if (/africa|nile|sahara/.test(id.toLowerCase())) out.add('africa');
 if (/europe|roman|greek|norse/.test(id.toLowerCase())) out.add('europe');
 if (/asia|silk|khan|chinese|indus/.test(id.toLowerCase())) out.add('asia-pacific');
 for (const sc of scenes) {
  if (sc.scope === 'pacific') out.add('pacific');
  else if (sc.scope === 'world') ALL_REGIONS.forEach(r => out.add(r));
  else if (sc.scope) out.add('americas');
 }
 if (!out.size) out.add('americas');
 return [...out];
}
const topicCategory:Record<string,DiveCategory>={languages:'languages','andean-languages':'languages','iroquoian-languages':'languages','maya-languages':'languages','austronesian-languages':'languages',haudenosaunee:'cultures','amazonian-peoples':'cultures'};
const storyCategory:Record<string,DiveCategory>={
 'pacific-arrivals':'subjects','hawaii-connections':'places','built-places':'subjects','chaco-connections':'places',
 'pacific-exchange':'subjects','connected-oceans':'subjects','early-american-evidence':'subjects',
 'caribbean-latin-cities':'places','communities-westward-colonization':'subjects','coercion-and-atlantic-crossings':'subjects',
 'peoples-of-the-north':'cultures','caral-supe':'places',kuk:'places',upano:'places',
};
const expansionPlaces=new Set(['chaco','hovenweep','mesa-verde','canyons-of-the-ancients','machu-picchu','cahokia']);
const combinedStories=new Set(siteGuides.map(g=>g.storyId).filter(Boolean));
const planned=(id:string,title:string,description:string,category:DiveCategory,atlasIds:string[]=['americas']):DeepDive=>({id,title,description,category,atlasIds,links:[]});
const worldGuideMovies: Record<string, string> = {
 'world-human-family': '#origins',
 'world-genghis-khan': '#study/genghis-khan',
 'world-marco-polo': '#study/marco-polo',
 'world-silk-roads': '#study/silk-roads',
 'world-hannibal': '#study/hannibal',
 'world-ibn-fadlan': '#study/ibn-fadlan',
 'world-chinese-explorers': '#study/chinese-explorers',
 'world-ancient-shipwrecks': '#study/ancient-shipwrecks',
 'world-roman-empire': '#study/roman-empire',
 'world-pre-1ma-world': '#study/pre-1ma-world',
 'world-australopithecus-fossils': '#study/australopithecus',
 'world-neanderthal-fossils': '#study/neanderthals',
};
const availableDives:DeepDive[]=[
 ...worldGuides.map(g=>({id:g.id,title:g.title,description:g.description,category:g.category,atlasIds:g.id==='world-human-family'?ALL_REGIONS:g.atlasIds,links:[{href:g.href,label:'Read guide' as const},...(worldGuideMovies[g.id]?[{href:worldGuideMovies[g.id],label:'Independent movie' as const}]:[])]})),
 ...topics.map(t=>{
  const linkedGuides=siteGuides.filter(g=>g.topicId===t.id);
  const atlasIds=linkedGuides.length?[...new Set(linkedGuides.flatMap(g=>atlasIdsForSiteRegion(g.region)))]:atlasIdsForStoryScenes(t.id,t.scenes);
  return {id:'topic-'+t.id,title:t.title,description:t.description,category:topicCategory[t.id]??'subjects',atlasIds,links:[{href:'#topic/'+t.id,label:'Independent movie' as const},...linkedGuides.map(g=>({href:g.href,label:'Read guide' as const}))]};
 }),
 ...siteGuides.filter(g=>!g.topicId).map(g=>({id:'place-'+g.id,title:g.title,description:g.description,category:(g.kind==='culture'?'cultures':g.kind==='route'?'subjects':'places') as DiveCategory,
  atlasIds:atlasIdsForSiteRegion(g.region),
  links:[{href:g.href,label:'Read guide' as const},...stories.filter(s=>s.id===g.storyId).map(s=>({href:'#story/'+s.id,label:'Contextual movie' as const}))],
  ...(g.parentGuideId?{parentGuideId:g.parentGuideId}:{}),
  ...(expansionPlaces.has(g.id)?{expansion:'Expanded building detail and local chronology. Coverage remains selected.'}:{})})),
 ...stories.filter(s=>!combinedStories.has(s.id)).map(s=>{
  if(!storyCategory[s.id])throw new Error('Assign a deep-dive category to story '+s.id);
  return {id:'story-'+s.id,title:s.title,description:s.description,category:storyCategory[s.id],atlasIds:atlasIdsForStoryScenes(s.id,s.scenes),links:[{href:'#story/'+s.id,label:'Contextual movie' as const}]};
 }),
];
const plannedDives:DeepDive[]=[
 planned('australian-wool','Australia: convicts, stations and wool ships','Transportation, town and station growth, Aboriginal dispossession and resistance, and the ships connecting wool ports to Britain.','subjects',['pacific']),
 planned('australian-mining','Australia: mines, towns and export ports','Extraction, labour, growing towns and infrastructure, linked to Indigenous land and water dispossession. Through 1934.','subjects',['pacific']),
 ...[
  ['chavin','Chavín de Huántar','Architecture, ritual spaces and connections across the Andes.',['americas']],
  ['tiwanaku','Tiwanaku','Buildings, farming landscapes and regional connections.',['americas']],
  ['chan-chan','Chan Chan','Compounds, water systems and the communities of Chimor.',['americas']],
  ['teotihuacan','Teotihuacan','Neighbourhoods, apartment compounds and the changing city.',['americas']],
  ['monte-alban','Monte Albán','Construction, valley settlements and political change.',['americas']],
  ['calakmul','Calakmul','Urban landscapes and connections with other Maya centres.',['americas']],
  ['copan','Copán','Buildings, inscriptions and communities in the valley.',['americas']],
  ['paquime','Paquimé','Multistorey dwellings, water systems and exchange.',['americas']],
  ['poverty-point','Poverty Point','Earthworks, habitation and long-distance materials.',['americas']],
  ['hopewell','Hopewell earthworks','Individual complexes, construction and connections.',['americas']],
  ['san-agustin','San Agustín','Settlements, monuments and their local chronologies.',['americas']],
  ['tierradentro','Tierradentro','Tombs, settlement and the limits of current evidence.',['americas']],
  ['casarabe','Casarabe: Cotoca and Landívar','Individual centres, engineered landscapes and connections.',['americas']],
  ['nan-madol','Nan Madol','A dedicated study beyond the existing Pacific complexes guide.',['pacific']],
  ['budj-bim','Budj Bim','Gunditjmara Country, settlement and engineered waterways.',['pacific']],
 ].map(([id,title,description,atlasIds])=>planned(id as string,title as string,description as string,'places',atlasIds as string[])),
 planned('austronesian-languages','Austronesian languages across the islands','A dedicated study of proposed family branches, contact and the limits of mapping language movement.','languages',['pacific']),
 planned('andean-languages','Quechuan and Aymaran histories','Language relationships, regional spread and contact; political boundaries are not language boundaries.','languages',['americas']),
 planned('iroquoian-languages','Iroquoian languages','Distinct communities, related languages and changing distributions.','languages',['americas']),
 planned('maya-languages','Maya languages','Branches, inscriptions and living languages, with separate kinds of evidence.','languages',['americas']),
 planned('wari','Wari histories','Provincial centres, networks and regional change.','cultures',['americas']),
 planned('moche','Moche communities','Local histories, architecture and exchange along the north coast of Peru.','cultures',['americas']),
 planned('lapita','Lapita communities and successors','Pottery, voyaging and later island histories, without equating an archaeological label with one people.','cultures',['pacific']),
 planned('gunditjmara','Gunditjmara histories','A community history connected to the proposed Budj Bim place study.','cultures',['pacific']),
];

const availableStudyIds=new Set([...topics.map(t=>t.id),...siteGuides.map(g=>g.id)]);
export const deepDives:DeepDive[]=[...availableDives,...plannedDives.filter(d=>!availableStudyIds.has(d.id))];

function card(d:DeepDive):string{
 return `<article class="dive-card${d.links.length?'':' dive-planned'}" data-dive="${esc(d.id)}"><span class="dive-status">${d.links.length?'Available now':'Coming soon'}</span><h3>${esc(d.title)}</h3><p>${esc(d.description)}</p>${d.expansion?`<p class="dive-expansion">Guide available · ${esc(d.expansion)}</p>`:''}${d.links.length?`<div class="dive-actions">${d.links.map(l=>`<a href="${esc(l.href)}">${l.label} <span aria-hidden="true">↗</span></a>`).join('')}</div>`:''}</article>`;
}
export function diveCardHTML(d:DeepDive):string{return card(d);}
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
 const foundations=`<section class="dive-foundations" aria-label="Foundations: start anywhere"><div class="dive-foundations-head"><span class="eyebrow">FOUNDATIONS · START ANYWHERE</span><p>Reach these foundational guides and global origin studies from any region of the atlas.</p></div><div class="dive-foundations-grid"><article class="dive-foundation-card"><span class="dive-status">Human origins</span><h3>The branching human family</h3><p>Fossil hominin finds from ~7.24 million years ago onward, ancient DNA, and global dispersals across Africa and Eurasia.</p><div class="dive-actions"><a href="sites/world-human-family.html">Read guide ↗</a><a href="#origins">Interactive map ↗</a></div></article><article class="dive-foundation-card"><span class="dive-status">Deep time</span><h3>Human ancestors before 1 Ma</h3><p>Graecopithecus, Toumaï, Australopithecus, Paranthropus, Dmanisi, and the earliest Homo erectus sites.</p><div class="dive-actions"><a href="#study/pre-1ma-world">Play dated study ↗</a><a href="sites/world-pre-1ma-world.html">Read guide ↗</a></div></article><article class="dive-foundation-card"><span class="dive-status">Sacred traditions</span><h3>Origin Stories worldwide</h3><p>Indigenous, oral, and written creation and emergence traditions from every major region, distinct from archaeological dates.</p><div class="dive-actions"><a href="#dives/origin-stories">Browse traditions →</a></div></article></div></section>`;
 const regionFilter=`<div class="dive-filter-bar"><input id="dive-search" type="search" placeholder="Search all deep dives, places, peoples or eras…" aria-label="Search deep dives"><div class="dive-region-chips" role="group" aria-label="Filter deep dives by region"><button type="button" data-dive-region="all" aria-pressed="true">All regions</button><button type="button" data-dive-region="americas" aria-pressed="false">Americas</button><button type="button" data-dive-region="pacific" aria-pressed="false">Pacific</button><button type="button" data-dive-region="africa" aria-pressed="false">Africa</button><button type="button" data-dive-region="europe" aria-pressed="false">Europe</button><button type="button" data-dive-region="asia-pacific" aria-pressed="false">Asia</button></div></div><div id="dive-search-results" class="dive-search-results" hidden></div>`;
 return `<article class="library-page deep-dive-index"><div class="dive-heading"><div><span class="eyebrow">DEEP DIVES · STORIES &amp; ILLUSTRATED GUIDES</span><h2>${selected?esc(selected.title):'Choose your way in.'}</h2><p class="lead">${selected?esc(selected.description):'Illustrated essays, interactive movies, languages, and cultures. Looking for reference tables, citations, or climate data? Visit the Library.'}</p></div><div class="dive-heading-links"><a class="dive-return" href="#library">Library &amp; Reference ↗</a><a class="dive-return" href="${esc(returnHref)}">↔ Return to map</a></div></div><nav class="dive-tabs" aria-label="Deep-dive categories"><a href="#dives" ${!selected?'aria-current="page"':''}>All lists</a>${diveCategories.map(c=>`<a href="#dives/${c.id}" ${selected?.id===c.id?'aria-current="page"':''}>${c.title}</a>`).join('')}</nav>${foundations}${regionFilter}<div class="dive-listing-default">${listing}</div><aside class="dive-modes"><h3>How Deep Dives work</h3><p><strong>Contextual movies</strong> focus the shared atlas on one story while everything contemporary remains visible on the globe.</p><p><strong>Independent movies</strong> isolate a single theme on its own dedicated timeline.</p><p><strong>Illustrated guides</strong> combine terrain maps, dated finds, primary sources, and open scholarly questions.</p></aside></article>`;
}
