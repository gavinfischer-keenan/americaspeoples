import type { DisplayRecord } from './model';
import type { MapScope } from './map-projection';
export type ExploreCategory='all'|'rock-art'|'places'|'connections'|'conflict'|'research'|'wrecks';
export const exploreCategories:Record<ExploreCategory,string>={all:'Everything','rock-art':'Rock art & visual records',places:'Places',connections:'Connections',conflict:'Conflict & violence',research:'Regional research',wrecks:'Shipwrecks'};
export const regions:{id:string;name:string;center:[number,number];zoom:number;scope:MapScope}[]=[
 {id:'world',name:'Whole world',center:[15,18],zoom:1,scope:'world'},
 {id:'africa',name:'Africa & Levant',center:[22,5],zoom:2.2,scope:'world'},
 {id:'europe',name:'Europe & Mediterranean',center:[14,52],zoom:4.8,scope:'world'},
 {id:'asia-region',name:'Asia',center:[95,28],zoom:2.2,scope:'world'},
 {id:'pacific',name:'Pacific Ocean',center:[-155,-12],zoom:1.35,scope:'pacific'},
 {id:'asia',name:'Mainland & Island Southeast Asia',center:[118,8],zoom:3,scope:'pacific'},
 {id:'australia',name:'Australia & Sahul',center:[136,-24],zoom:3.5,scope:'pacific'},
 {id:'melanesia',name:'New Guinea & Melanesia',center:[155,-9],zoom:4,scope:'pacific'},
 {id:'micronesia',name:'Micronesia',center:[150,10],zoom:4,scope:'pacific'},
 {id:'polynesia',name:'Polynesia',center:[-159,-15],zoom:3,scope:'pacific'},
 {id:'hawaii',name:'Hawaiʻi',center:[-157.2,20.7],zoom:22,scope:'pacific'},
 {id:'aotearoa',name:'Aotearoa / New Zealand',center:[173,-41],zoom:9,scope:'pacific'},
 {id:'southwest',name:'Pueblo Southwest',center:[-109,36],zoom:16,scope:'americas'},
 {id:'mississippi',name:'Mississippi Valley',center:[-90,35],zoom:7,scope:'americas'},
 {id:'mesoamerica',name:'Mesoamerica',center:[-96,18],zoom:6,scope:'americas'},
 {id:'caribbean',name:'Caribbean',center:[-74,18],zoom:5,scope:'atlantic'},
 {id:'andes',name:'Andes',center:[-73,-14],zoom:4,scope:'americas'},
 {id:'atlantic',name:'Atlantic ports',center:[-45,25],zoom:1.4,scope:'atlantic'},
];
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
export function exploreRecords(all:readonly DisplayRecord[],visible:readonly DisplayRecord[],filter:{query:string;category:ExploreCategory}):DisplayRecord[]{
 const query=normalize(filter.query.trim()),words=query.split(/\s+/);
 return (query?all:visible).filter(r=>{
  if(filter.category!=='all'&&exploreCategory(r)!==filter.category)return false;
  const text=query?normalize([r.title,r.location?.name,r.culture.name,r.review.summary].join(' ')):'';
  return !query||words.every(w=>text.includes(w));
 }).sort((a,b)=>(a.time.start??Infinity)-(b.time.start??Infinity)||a.title.localeCompare(b.title));
}
