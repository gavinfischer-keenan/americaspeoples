import {readdir,readFile,writeFile} from 'node:fs/promises';
import {validateEuropeData,normalizeEurope,type EuropeData} from '../src/europe-data';
import {validateRecord} from '../src/validation';
import {validateEuropeBoundaries} from '../src/europe-boundaries';
import type {Voyage} from '../src/voyages';
import {isPlayableVoyage} from '../src/shared-movie';
export async function readEuropeData():Promise<EuropeData>{
 const combined:EuropeData={schemaVersion:1,regions:[],sources:[],entries:[]};
 for(const name of (await readdir('data/atlases/europe')).filter(n=>n.endsWith('-evidence.json')).sort()){
  const input=validateEuropeData(JSON.parse(await readFile(`data/atlases/europe/${name}`,'utf8')));
  for(const r of input.regions){const prior=combined.regions.find(x=>x.id===r.id);if(prior&&prior.title!==r.title)throw Error(`Conflicting Europe region ${r.id}`);if(!prior)combined.regions.push(r);}
  for(const s of input.sources){const prior=combined.sources.find(x=>x.id===s.id);if(prior&&JSON.stringify(prior)!==JSON.stringify(s))throw Error(`Conflicting Europe source ${s.id}`);if(!prior)combined.sources.push(s);}
  combined.entries.push(...input.entries);
 }
 combined.entries.sort((a,b)=>a.start-b.start||a.id.localeCompare(b.id));
 validateEuropeData(combined);
 if(!combined.entries.length)throw Error('Europe must contain evidence before activation');
 for(const record of normalizeEurope(combined)){const errors=validateRecord(record);if(errors.length)throw Error(`${record.id}: ${errors.join('; ')}`);}
 return combined;
}
export async function buildEuropeCatalogue(){
 const evidence=await readEuropeData();
 const boundaryBundle=validateEuropeBoundaries(JSON.parse(await readFile('data/atlases/europe/boundaries.json','utf8')));
 const voyageArchive=JSON.parse(await readFile('data/voyages.json','utf8'));
 const voyages=(voyageArchive.voyages as Voyage[]).filter(v=>isPlayableVoyage(v)&&v.stops.some(s=>s.coordinates[1]>=49&&s.coordinates[0]>=-75&&s.coordinates[0]<=40));
 const catalogue={schemaVersion:1,evidence,boundaries:boundaryBundle.boundaries,boundarySources:boundaryBundle.sources,boundaryGaps:boundaryBundle.gaps,voyages,voyageSources:voyageArchive.sources};
 await writeFile('dist/europe-catalogue.json',JSON.stringify(catalogue)+'\n');
 const eras=[{id:'deep-prehistory',start:-1_000_000,end:-12000},{id:'hunters-and-farmers',start:-11999,end:-1000},{id:'late-prehistory',start:-999,end:499},{id:'early-medieval',start:500,end:999},{id:'medieval',start:1000,end:1499},{id:'early-modern',start:1500,end:1749},{id:'industry-and-empire',start:1750,end:1900}];
 const audit={reviewedAt:'2026-11-18',scope:'Selected northern evidence through 1900; counts measure research coverage, not historical activity or population.',entries:evidence.entries.length,sources:evidence.sources.length,boundaryVersions:boundaryBundle.boundaries.length,regions:evidence.regions.map(region=>({...region,entries:evidence.entries.filter(e=>e.regionId===region.id).length,eras:eras.map(era=>({era:era.id,count:evidence.entries.filter(e=>e.regionId===region.id&&e.start<=era.end&&e.end>=era.start).length}))})),networks:['trade','road','rail'].map(kind=>({kind,count:evidence.entries.filter(e=>e.networkKind===kind).length})),populationObservations:evidence.entries.reduce((n,e)=>n+(e.population?.length??0),0),boundaryGaps:boundaryBundle.gaps};
 await writeFile('data/atlases/europe/coverage-audit.json',JSON.stringify(audit,null,2)+'\n');
 await writeFile('dist/europe-coverage-audit.json',JSON.stringify(audit,null,2)+'\n');
 return ['europe-catalogue.json','europe-coverage-audit.json'];
}
