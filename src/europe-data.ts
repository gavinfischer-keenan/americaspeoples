import type {EvidenceRecord, Source} from './model';
import {END_YEAR} from './time';
import {historyState} from './history';

export const europeCategories={habitation:'Places & habitation',exchange:'Trade & exchange',state:'Kingdoms & government',religion:'Religion & institutions',conflict:'Conflict & conquest',industry:'Work & transport',voyage:'Voyages & migration',environment:'Land & environment'} as const;
export interface EuropeSource {id:string;title:string;url:string;authors:string;year:number|null}
export interface EuropeEntry {
 id:string;regionId:string;title:string;category:keyof typeof europeCategories;
 kind:'interval'|'occurrence';start:number;end:number;approximate:boolean;dateLabel:string;dateMeaning:string;
 coordinates:[number,number];place:string;summary:string;detail:string;uncertainty:string;sourceIds:string[];
 guideId?:string;canonicalRecordId?:string;destination?:[number,number];destinationName?:string;
 networkKind?:'trade'|'road'|'rail';routeCoordinates?:[number,number][];
 population?:{year:number;min:number;max:number;basis:'census'|'estimate';note:string;sourceIds:string[]}[];
 populationInterpolation?:{scope:string;note:string};
 warfare?:{kind:'raid'|'battle'|'siege'|'campaign'|'civil-war'|'repression';participants:string[];outcome:string};
 endEvidence?:{start:number;end:number;meaning:'abandoned'|'relocated';label?:string;certainty:'documented'|'inferred';note:string};
 activityWindows?:{start:number;end:number;certainty:'documented'|'approximate';note:string}[];
 continuity?:'ongoing';
 historyKind?:'attestation'|'habitation'|'settlement'|'visit';
}
export interface EuropeData {schemaVersion:1;regions:{id:string;title:string}[];sources:EuropeSource[];entries:EuropeEntry[]}
const nonempty=(v:unknown):v is string=>typeof v==='string'&&!!v.trim();
const point=(p:unknown):p is [number,number]=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90;
const identifier=(v:unknown)=>nonempty(v)&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
const secure=(value:string)=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
export function validateEuropeData(input:unknown):EuropeData {
 const d=input as EuropeData;
 if(!d||d.schemaVersion!==1||![d.entries,d.sources,d.regions].every(Array.isArray))throw Error('Invalid Europe catalogue');
 const regions=new Set<string>(),sources=new Set<string>(),ids=new Set<string>();
 for(const r of d.regions){if(!identifier(r.id)||!nonempty(r.title)||regions.has(r.id))throw Error('Invalid Europe region');regions.add(r.id);}
 for(const s of d.sources){if(!identifier(s.id)||sources.has(s.id)||![s.title,s.authors].every(nonempty)||!secure(s.url)||(s.year!==null&&(!Number.isSafeInteger(s.year)||s.year<1)))throw Error(`Invalid Europe source ${s.id}`);sources.add(s.id);}
 const cited=(values:unknown):values is string[]=>Array.isArray(values)&&values.length>0&&values.every(id=>sources.has(id));
 for(const e of d.entries){
  const fail=(s:string):never=>{throw Error(`${e.id}: ${s}`);};
  if(!identifier(e.id)||ids.has(e.id)||!regions.has(e.regionId))fail('invalid identity or region');ids.add(e.id);
  if(!(e.category in europeCategories)||!['interval','occurrence'].includes(e.kind)||typeof e.approximate!=='boolean'||![e.title,e.place,e.summary,e.detail,e.uncertainty,e.dateLabel,e.dateMeaning].every(nonempty))fail('missing evidence text');
  if(!Number.isSafeInteger(e.start)||!Number.isSafeInteger(e.end)||e.start < -1_600_000||e.start>e.end||e.end>END_YEAR)fail('invalid timeline dates');
  if(!point(e.coordinates)||!cited(e.sourceIds))fail('invalid location or source links');
  if(e.guideId&&!/^world-[a-z0-9-]+$/.test(e.guideId))fail('invalid guide ID');
  if(e.destination&&!point(e.destination))fail('invalid destination');
  if(e.networkKind&&!['trade','road','rail'].includes(e.networkKind))fail('invalid network kind');
  if(e.routeCoordinates&&(!Array.isArray(e.routeCoordinates)||e.routeCoordinates.length<2||!e.routeCoordinates.every(point)))fail('invalid route coordinates');
  if(e.networkKind&&!e.destination&&!e.routeCoordinates)fail('network requires mapped endpoints');
  if(e.population){
   if(!Array.isArray(e.population)||e.destination||e.routeCoordinates||e.networkKind)fail('population requires a town, not a route');
   for(const p of e.population)if(!Number.isSafeInteger(p.year)||p.year<e.start||p.year>e.end||!Number.isSafeInteger(p.min)||!Number.isSafeInteger(p.max)||p.min<1||p.max<p.min||p.max>100_000_000||!['census','estimate'].includes(p.basis)||!nonempty(p.note)||!cited(p.sourceIds))fail('invalid population observation');
  }
  if(e.populationInterpolation&&(!e.population||e.population.length<2||!nonempty(e.populationInterpolation.scope)||!nonempty(e.populationInterpolation.note)||new Set(e.population.map(p=>p.year)).size!==e.population.length))fail('interpolation needs comparable, uniquely dated observations and an explicit scope');
  if(e.warfare&&(e.category!=='conflict'||!['raid','battle','siege','campaign','civil-war','repression'].includes(e.warfare.kind)||!Array.isArray(e.warfare.participants)||!e.warfare.participants.length||!e.warfare.participants.every(nonempty)||!nonempty(e.warfare.outcome)))fail('invalid warfare evidence');
  if(e.endEvidence&&(!Number.isSafeInteger(e.endEvidence.start)||!Number.isSafeInteger(e.endEvidence.end)||e.endEvidence.start>e.endEvidence.end||e.endEvidence.start<e.start||e.endEvidence.end>END_YEAR||!nonempty(e.endEvidence.note)))fail('invalid end evidence');
  if(e.activityWindows&&(!Array.isArray(e.activityWindows)||!e.activityWindows.length||e.activityWindows.some(w=>!Number.isSafeInteger(w.start)||!Number.isSafeInteger(w.end)||w.start<e.start||w.end>e.end||w.end<w.start||!['documented','approximate'].includes(w.certainty)||!nonempty(w.note))))fail('invalid activity windows');
  if(e.continuity&&e.continuity!=='ongoing'||e.historyKind&&!['attestation','habitation','settlement','visit'].includes(e.historyKind))fail('invalid historical meaning');
 }
 return d;
}

const colors:Record<EuropeEntry['category'],string>={habitation:'#f1d894',exchange:'#f2b761',state:'#c6b5ed',religion:'#e6d3b5',conflict:'#e9a28c',industry:'#8ad4d3',voyage:'#86c6f0',environment:'#b4d49c'};
export function normalizeEurope(data:EuropeData):EvidenceRecord[]{
 const sources=new Map(data.sources.map(s=>[s.id,{...s,venue:s.authors,access:'Public institutional or scholarly source; see the linked item.'} satisfies Source]));
 return data.entries.map(e=>{
  const linked=[...new Set([...e.sourceIds,...(e.population??[]).flatMap(p=>p.sourceIds)])];
  const support=(ids:string[])=>ids.map(sourceId=>({sourceId,locator:e.title,stance:'supports' as const,note:e.dateMeaning}));
  const location={id:e.id+'-place',name:e.place,lon:e.coordinates[0],lat:e.coordinates[1],precision:'Approximate locality anchor; not a surveyed excavation footprint.',provenance:e.uncertainty};
  const coordinates=e.routeCoordinates??(e.destination?[e.coordinates,e.destination]:undefined);
  const conflict=e.category==='conflict';
  const journey=e.category==='voyage'&&!e.networkKind&&!!coordinates;
  const network=journey?undefined:e.networkKind??(coordinates&&!conflict?'trade':undefined);
  const r:EvidenceRecord={
   id:e.id,revision:1,type:journey?'movement':coordinates||conflict?'event':e.category==='habitation'?'occupation':'occurrence',title:e.title,
   culture:{id:'europe-'+e.regionId,name:data.regions.find(r=>r.id===e.regionId)!.title,kind:'unknown',color:colors[e.category]},
   location,destination:coordinates?{...location,id:e.id+'-destination',name:e.destinationName??'Connected destination — '+e.title,lon:coordinates.at(-1)![0],lat:coordinates.at(-1)![1]}:null,routeKind:'schematic',
   time:{kind:e.kind,start:e.start,end:e.end,approximate:e.approximate,original:e.dateLabel,method:e.dateMeaning,interpretation:e.uncertainty},
   claims:[{id:'evidence',text:e.summary,status:'well-supported',explanation:e.detail,support:support(e.sourceIds)},...(e.population??[]).map((p,i)=>({id:'population-'+i,text:`${p.year}: ${p.min}–${p.max} residents. ${p.note}`,status:'well-supported' as const,explanation:`${p.basis}; dated observation, no interpolation or extrapolation.`,support:support(p.sourceIds)}))],
   sources:linked.map(id=>sources.get(id)!),
   review:{summary:e.summary+' '+e.detail,limitations:e.uncertainty,discussion:e.detail,provenance:'Northern Europe research catalogue. Modern regional bins are navigation labels, not historical borders.',reviewedAt:'2026-11-18',history:[],relatedIds:e.canonicalRecordId?[e.canonicalRecordId]:[]},
   ...(coordinates||conflict?{}:{history:{kind:e.historyKind??(e.category==='habitation'&&e.kind==='interval'?'habitation' as const:'attestation' as const),claimId:'evidence',...(e.continuity?{continuity:e.continuity}:{}),...(e.activityWindows?{windows:e.activityWindows}:{}),...(e.endEvidence?{endEvidence:{...e.endEvidence,claimId:'evidence'}}:{})}}),
   ...(!journey&&(coordinates||conflict)?{overlay:{kind:conflict?'conflict' as const:'trade' as const,networkKind:network,basis:'schematic' as const,geometry:coordinates?{type:'LineString' as const,coordinates}:{type:'Point' as const,coordinates:e.coordinates},precision:coordinates?'Schematic connection between cited places, not a surveyed route.':'Approximate event locality; not a battlefield perimeter.',provenance:e.uncertainty}}:{}),
   ...(e.population?.length?{population:e.population.map((p,i)=>({start:p.year,end:p.year,min:p.min,max:p.max,claimId:'population-'+i,scope:p.note+' Dated observation only; intervening population is unknown.'}))}:{}),
  };
  return r;
 });
}
export function europeSelection(records:readonly EvidenceRecord[],year:number,past:boolean):EvidenceRecord[]{
 if(year>END_YEAR)return [];
 return records.filter(r=>historyState(r,year)==='active'||past&&!r.overlay&&historyState(r,year)==='past-place');
}
/** Visit actual evidence changes, including expiries, instead of skipping isolated early dates. */
export function europeDates(entries:readonly EuropeEntry[]):number[]{
 return [...new Set([END_YEAR,...entries.flatMap(e=>[e.start,e.end,e.end+1,...(e.activityWindows??[]).flatMap(w=>[w.start,w.end,w.end+1]),...(e.population??[]).map(p=>p.year)])])].filter(y=>y<=END_YEAR).sort((a,b)=>a-b);
}
/** Display-only, opt-in linear interpolation. Source observations remain untouched. */
export function europePopulationView(record:EvidenceRecord,entry:EuropeEntry,year:number,enabled:boolean):EvidenceRecord {
 if(!enabled||!entry.populationInterpolation||!entry.population)return record;
 const samples=[...entry.population].sort((a,b)=>a.year-b.year);
 if(samples.some(p=>p.year===year))return record;
 const before=[...samples].reverse().find(p=>p.year<year),after=samples.find(p=>p.year>year);
 if(!before||!after)return record;
 const fraction=(year-before.year)/(after.year-before.year);
 const estimate=(a:number,b:number)=>Math.round(a+(b-a)*fraction);
 const note=`Interpolated between ${before.year} and ${after.year}; ${entry.populationInterpolation.scope}. ${entry.populationInterpolation.note} This is a visual estimate, not a census for this year.`;
 return {...record,population:[{start:year,end:year,min:estimate(before.min,after.min),max:estimate(before.max,after.max),claimId:'population-interpolation',scope:note}],claims:[...record.claims,{id:'population-interpolation',text:note,status:'under discussion',explanation:'Linear display interpolation bounded by the cited observations; no extrapolation.',support:[...new Set([...before.sourceIds,...after.sourceIds])].map(sourceId=>({sourceId,locator:entry.populationInterpolation!.scope,stance:'supports',note:'Supports the observed endpoints, not the interpolated yearly count.'}))}]};
}
