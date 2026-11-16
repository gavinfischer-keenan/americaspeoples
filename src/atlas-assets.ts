import type { PoliticalBoundary, BoundarySource } from './boundaries';
import type { RailSegment } from './atlas-context';
import type { Voyage } from './voyages';
import transport from '../data/transport-expansion-records.json';
import type { EvidenceRecord } from './model';
import { regionalRailSegments } from './atlas-context';
export const atlasAssets={boundaries:[] as PoliticalBoundary[],boundarySources:[] as BoundarySource[],rails:[] as RailSegment[],voyages:[] as Voyage[],voyageSources:[] as {id:string;title:string;url:string}[],errors:[] as string[],ready:false};
let detailedLand:any;
const landListeners=new Set<(land:any)=>void>();
/** New and already-mounted topic maps share the asynchronously loaded geography. */
export function watchDetailedLand(listener:(land:any)=>void):()=>void{
 landListeners.add(listener);
 if(detailedLand)listener(detailedLand);
 return ()=>{landListeners.delete(listener);};
}
export async function loadAtlasAssets(changed:()=>void,land:(value:any)=>void):Promise<void>{
 const read=async(name:string)=>{const response=await fetch(name);if(!response.ok)throw new Error(name);return response.json();};
 const boundaries=['historical','colonial','national','early-national','reservation'];
 const sources=['boundary-sources','expanded-boundary-sources','early-national-boundary-sources','reservation-boundary-sources'];
 const tasks:[string,()=>Promise<void>][]=[
  ...boundaries.map(name=>[`${name} boundaries`,async()=>{atlasAssets.boundaries.push(...await read(`${name}-boundaries.json`));}] as [string,()=>Promise<void>]),
  ...sources.map(name=>[name,async()=>{atlasAssets.boundarySources.push(...await read(`${name}.json`));}] as [string,()=>Promise<void>]),
  ['Historical railway network',async()=>{atlasAssets.rails.push(...(await read('rail-network.json')).segments);}],
  ['Voyage itineraries',async()=>{const value=await read('voyages.json');atlasAssets.voyages=value.voyages;atlasAssets.voyageSources=value.sources;}],
  ['Detailed coastlines',async()=>{detailedLand=await read('land-detailed.geojson');land(detailedLand);for(const listener of landListeners)listener(detailedLand);}],
 ];
 // A missing regional file must not erase every other successfully loaded layer.
 atlasAssets.rails=regionalRailSegments(transport.records as unknown as EvidenceRecord[]);
 await Promise.all(tasks.map(async([name,task])=>{try{await task();}catch{atlasAssets.errors.push(name);}}));
 atlasAssets.boundaries.sort((a,b)=>a.id.localeCompare(b.id));
 atlasAssets.ready=true;changed();
}
