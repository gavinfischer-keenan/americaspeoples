import {validateBoundaries,type BoundarySource,type PoliticalBoundary} from './boundaries';
import {END_YEAR} from './time';

const authorities=['kingdom','shared-crown','state-union','crown-territory','settlement-district','autonomous-administration','regional-jurisdiction','confederation','imperial-territory'] as const;
export interface EuropeBoundary extends PoliticalBoundary {
 authority:typeof authorities[number];
 sourceRows:string[];
}
export interface EuropeBoundaryBundle {
 schemaVersion:1;
 boundaries:EuropeBoundary[];
 sources:BoundarySource[];
 gaps:string[];
}
/** Validate the lazy regional asset before packaging it with the European evidence. */
export function validateEuropeBoundaries(value:unknown):EuropeBoundaryBundle {
 if(!value||typeof value!=='object')throw Error('Missing Europe boundary bundle');
 const bundle=value as EuropeBoundaryBundle;
 const text=(s:unknown)=>typeof s==='string'&&s.trim().length>0;
 if(bundle.schemaVersion!==1||![bundle.boundaries,bundle.sources,bundle.gaps].every(a=>Array.isArray(a)&&a.length)
   ||!bundle.gaps.every(text))throw Error('Incomplete Europe boundary bundle');
 const ids=new Set<string>();
 for(const source of bundle.sources){
  if(!source||![source.id,source.title,source.url,source.license,source.note].every(text)
   ||!/^https:\/\//.test(source.url)||ids.has(source.id))throw Error('Invalid Europe boundary source');
  ids.add(source.id);
 }
 for(const row of bundle.boundaries){
  if(!row||!authorities.includes(row.authority)||!Array.isArray(row.sourceRows)||!row.sourceRows.length
    ||!row.sourceRows.every(text)||row.end>`${END_YEAR}-12-31`)throw Error('Invalid Europe boundary authority, coverage or source rows');
 }
 const errors=validateBoundaries(bundle.boundaries,ids);
 if(errors.length)throw Error(errors.join('\n'));
 return bundle;
}
