export type BoundaryKind='acquisition'|'colony'|'territory'|'state'|'reservation'|'nation';
export interface BoundaryGeometry {type:'Polygon'|'MultiPolygon';coordinates:any[]}
export interface PoliticalBoundary {
 id:string;name:string;kind:BoundaryKind;start:string;end:string;geometry:BoundaryGeometry;
 labelPoint:[number,number];sourceIds:string[];precision:string;note:string;citation:string;
 labelPoints?:[number,number][];detail?:'broad'|'regional';sourceName?:string;labelSource?:string;
}
export interface BoundarySource {id:string;title:string;url:string;license:string;note:string}
/** Annual map state is December 31; never show both sides of a midyear replacement. */
export function boundariesAt(rows:readonly PoliticalBoundary[],year:number):PoliticalBoundary[]{
 if(!Number.isSafeInteger(year)||year<1||year>1934)return [];
 const date=String(year).padStart(4,'0')+'-12-31';
 return rows.filter(r=>r.start<=date&&r.end>=date);
}
export function validateBoundaries(rows:readonly PoliticalBoundary[],sources:ReadonlySet<string>):string[]{
 const errors:string[]=[],ids=new Set<string>();
 const iso=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
 for(const b of rows){
  if(ids.has(b.id))errors.push(`Duplicate boundary ${b.id}`);ids.add(b.id);
  if(!b.id||!b.name?.trim()||!['acquisition','colony','territory','state','reservation','nation'].includes(b.kind)||!iso(b.start)||!iso(b.end)||b.start>b.end)errors.push(`Invalid boundary chronology ${b.id}`);
  if(!b.sourceIds?.length||b.sourceIds.some(id=>!sources.has(id))||!b.precision?.trim()||!b.note?.trim()||!b.citation?.trim())errors.push(`Missing boundary provenance ${b.id}`);
  const point=(p:any)=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90;
  if(b.labelPoints!==undefined&&(!Array.isArray(b.labelPoints)||!b.labelPoints.length||b.labelPoints.some(p=>!point(p))))errors.push(`Invalid boundary label anchors ${b.id}`);
  if(b.detail!==undefined&&!['broad','regional'].includes(b.detail))errors.push(`Invalid boundary detail ${b.id}`);
  if(!point(b.labelPoint)||!['Polygon','MultiPolygon'].includes(b.geometry?.type))errors.push(`Invalid boundary geometry ${b.id}`);
  else{
   const polygons=b.geometry.type==='Polygon'?[b.geometry.coordinates]:b.geometry.coordinates;
   if(!polygons.length||polygons.some(poly=>!Array.isArray(poly)||!poly.length||poly.some((ring:any)=>!Array.isArray(ring)||ring.length<4||ring.some((p:any)=>!point(p))||JSON.stringify(ring[0])!==JSON.stringify(ring.at(-1)))))errors.push(`Invalid boundary rings ${b.id}`);
  }
 }
 return errors;
}
