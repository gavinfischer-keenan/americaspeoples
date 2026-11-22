import type { DisplayRecord } from './model';
import type { MapScope } from './map-projection';
export type ExploreCategory='all'|'places'|'connections'|'conflict'|'research'|'wrecks';
export const exploreCategories:Record<ExploreCategory,string>={all:'Everything',places:'Places',connections:'Connections',conflict:'Conflict & violence',research:'Regional research',wrecks:'Shipwrecks'};
export const regions:{id:string;name:string;center:[number,number];zoom:number;scope:MapScope}[]=[
 {id:'world',name:'Whole world',center:[15,18],zoom:1,scope:'world'},
 {id:'africa',name:'Africa & Levant',center:[22,5],zoom:2.2,scope:'world'},
 {id:'europe',name:'Europe & Mediterranean',center:[12,48],zoom:3.2,scope:'world'},
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
export function exploreCategory(r:DisplayRecord):Exclude<ExploreCategory,'all'>{
 if(r.history?.kind==='wreck')return 'wrecks';
 if(['conflict','violence','forced-removal'].includes(r.overlay?.kind??''))return 'conflict';
 if(r.history?.kind==='migration'||r.history?.kind==='exchange'||r.type==='movement'||r.overlay?.kind==='trade')return 'connections';
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
