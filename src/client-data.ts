import type {Dataset, EvidenceRecord} from './model';

export let dataset:Dataset;
export let manifest:any;
const details=new Map<string,Promise<EvidenceRecord>>();

export async function getJSON<T=any>(path:string):Promise<T>{
 const response=await fetch(path,{cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw new Error(`Atlas request failed (${response.status}). Please retry.`);
 const version=response.headers.get('X-Atlas-Version');
 if(manifest&&version&&version!==manifest.version)throw new Error('Atlas updated. Reload to use one consistent edition.');
 return response.json();
}
export async function pages<T>(path:string):Promise<T[]>{
 const result:T[]=[];let offset:number|null=0;
 while(offset!==null){
  const part: {records:T[];nextOffset:number|null;version:string}=await getJSON(`${path}${path.includes('?')?'&':'?'}limit=1000&offset=${offset}`);
  if(part.version!==manifest.version)throw new Error('Atlas updated during loading. Reload to use one consistent edition.');
  result.push(...part.records);offset=part.nextOffset;
 }
 return result;
}
export async function initializeDataset(){
 manifest=await getJSON('/api/manifest');
 if(manifest.apiVersion!==1)throw new Error('Unsupported atlas API version.');
 const records=await pages<EvidenceRecord>('/api/catalog');
 dataset={...manifest,records};
}
export function fullRecord(id:string):Promise<EvidenceRecord>{
 let request=details.get(id);
 if(!request){
  request=getJSON<EvidenceRecord>('/api/records/'+encodeURIComponent(id)).then(record=>{
   const index=dataset.records.findIndex(r=>r.id===id);
   if(index>=0)dataset.records[index]=record;
   return record;
  }).catch(error=>{details.delete(id);throw error;});
  details.set(id,request);
 }
 return request;
}
export async function completeDataset(){
 const complete=await getJSON<Dataset>('/api/export');
 if(complete.version!==dataset.version)throw new Error('Atlas updated. Reload before importing against it.');
 dataset.records=complete.records;
 return dataset;
}
export async function searchRecordIds(query:string):Promise<Set<string>>{
 const matches=await pages<EvidenceRecord>('/api/records?q='+encodeURIComponent(query));
 return new Set(matches.map(r=>r.id));
}
