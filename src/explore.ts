import type { DisplayRecord } from './model';
export type ExploreCategory='all'|'rock-art'|'places'|'connections'|'conflict'|'research'|'wrecks';
export const exploreCategories:Record<ExploreCategory,string>={all:'Everything','rock-art':'Rock art & visual records',places:'Places',connections:'Connections',conflict:'Conflict & violence',research:'Regional research',wrecks:'Shipwrecks'};
const ROCK_ART_RE=/\b(rock[\s-]?art|pictographs?|petroglyphs?|cave[\s-]?(?:art|paintings?|murals?)|mud[\s-]?glyphs?|geoglyphs?|intaglios?|painted[\s-]?(?:cave|shelter|rock|bluff|murals?)|ochre[\s-]?(?:engraving|workshop)|hand[\s-]?stencils?|rock[\s-]?(?:engravings?|paintings?)|lascaux|chauvet|altamira|blombos|apollo 11|bhimbetka|tassili|acacus|twyfelfontein|kondoa|laas geel|cueva de las manos|serra da capivara|chiribiquete|maros-pangkep|murujuga|tanum|gobustan|dabous|qurta|camel site|chongoni|drakensberg.*(?:art|paint|murals)|winnemucca lake)\b/i;
export function exploreCategory(r:DisplayRecord):Exclude<ExploreCategory,'all'>{
 if(r.history?.kind==='wreck')return 'wrecks';
 if(['conflict','violence','forced-removal'].includes(r.overlay?.kind??''))return 'conflict';
 if(r.history?.kind==='migration'||r.history?.kind==='exchange'||r.type==='movement'||r.overlay?.kind==='trade')return 'connections';
 if(r.id.startsWith('nara-')||r.id.startsWith('world:amea-art-')||ROCK_ART_RE.test(`${r.title} ${r.review.summary}`))return 'rock-art';
 if(r.overlay)return 'research';
 return 'places';
}
const normalize=(s:string)=>s.normalize('NFKD').replace(/[\u0300-\u036f'’ʻʼ]/g,'').toLocaleLowerCase();
export function exploreRecords(all:readonly DisplayRecord[],visible:readonly DisplayRecord[],filter:{query:string;category:ExploreCategory;hideWrecks?:boolean}):DisplayRecord[]{
 const query=normalize(filter.query.trim()),words=query.split(/\s+/);
 return (query?all:visible).filter(r=>{
  if(filter.hideWrecks&&filter.category!=='wrecks'&&exploreCategory(r)==='wrecks')return false;
  if(filter.category!=='all'&&exploreCategory(r)!==filter.category)return false;
  const text=query?normalize([r.title,r.location?.name,r.culture.name,r.review.summary].join(' ')):'';
  return !query||words.every(w=>text.includes(w));
 }).sort((a,b)=>(a.time.start??Infinity)-(b.time.start??Infinity)||a.title.localeCompare(b.title));
}
