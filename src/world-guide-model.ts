import type {PlannedAtlasId} from './atlas-catalog';
export interface WorldGuide {
 id:string;atlasIds:PlannedAtlasId[];category:'places'|'subjects'|'cultures'|'languages';title:string;description:string;intro:string;scope:string;
 map:{bounds:[number,number,number,number];scope:string;points:{id:string;label:string;coordinates:[number,number];date:string;description:string;sources:string[]}[]};
 sections:{heading:string;paragraphs:{text:string;sources:string[]}[];columns?:string[];rows?:{cells:string[];sources:string[]}[]}[];
 sources:{title:string;url:string}[];relatedGuideIds?:string[];referenceMaps?:{title:string;url:string;description:string}[];voyageIds?:string[];
}
export type WorldGuideIndex=Pick<WorldGuide,'id'|'atlasIds'|'category'|'title'|'description'|'relatedGuideIds'|'voyageIds'>&{href:string};
const idPattern=/^world-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const text=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0;
const unwrapLongitude=(longitude:number,west:number)=>longitude<west?longitude+360:longitude;
function safeURL(value:string):boolean{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!/[\u0000-\u0020]/.test(value);}catch{return false;}}
/** Guide research is deliberately separate from the movie's bounded chronology. */
export function validateWorldGuides(input:unknown):WorldGuide[]{
 if(!Array.isArray(input))throw Error('Expected world guides');
 const ids=new Set<string>();
 for(const raw of input){
  const g=raw as WorldGuide;
  if(!g||!idPattern.test(g.id)||ids.has(g.id))throw Error('Invalid or duplicate world guide ID');ids.add(g.id);
  const fail=(reason:string):never=>{throw Error(`${g.id}: ${reason}`);};
  if(!['title','description','intro','scope'].every(k=>text(g[k as keyof WorldGuide]))||!['places','subjects','cultures','languages'].includes(g.category))fail('missing guide text');
  if(!Array.isArray(g.atlasIds)||!g.atlasIds.length||new Set(g.atlasIds).size!==g.atlasIds.length||g.atlasIds.some(a=>!['africa','europe','asia-pacific'].includes(a)))fail('invalid atlas membership');
  if(!Array.isArray(g.sources)||!g.sources.length||g.sources.some(s=>!text(s.title)||!safeURL(s.url)))fail('invalid sources');
  const sources=new Set(g.sources.map(s=>s.url));
  const cited=(urls:unknown)=>Array.isArray(urls)&&urls.length>0&&urls.every(u=>sources.has(u));
  const b=g.map?.bounds;
  if(!Array.isArray(b)||b.length!==4||!b.every(Number.isFinite)||b[0]<-180||b[2]>360||b[2]-b[0]>360||b[0]>=b[2]||b[1]<=-85||b[3]>=85||b[1]>=b[3]||!text(g.map.scope))fail('invalid map extent');
  if(!Array.isArray(g.map.points)||!g.map.points.length)fail('missing mapped localities');
  const points=new Set<string>();
  for(const p of g.map.points){
   if(!p||!text(p.id)||!/^[a-z0-9-]+$/.test(p.id)||points.has(p.id)||![p.label,p.date,p.description].every(text)||!cited(p.sources))fail('invalid or uncited map point');points.add(p.id);
   if(!Array.isArray(p.coordinates)||p.coordinates.length!==2||!p.coordinates.every(Number.isFinite)||Math.abs(p.coordinates[0])>180)fail('map point outside extent');
   const longitude=unwrapLongitude(p.coordinates[0],b[0]);
   if(longitude<b[0]||longitude>b[2]||p.coordinates[1]<b[1]||p.coordinates[1]>b[3])fail('map point outside extent');
  }
  if(!Array.isArray(g.sections)||!g.sections.length)fail('missing sections');
  for(const s of g.sections){
   if(!text(s.heading)||!Array.isArray(s.paragraphs)||s.paragraphs.some(p=>!text(p.text)||!cited(p.sources)))fail('uncited section');
   if(s.rows?.length&&(!s.columns?.length||s.rows.some(r=>r.cells.length!==s.columns!.length||!r.cells.every(text)||!cited(r.sources))))fail('invalid table');
  }
  if(g.referenceMaps?.some(m=>!text(m.title)||!text(m.description)||!safeURL(m.url)))fail('invalid reference map');
  if(g.relatedGuideIds?.some(id=>!idPattern.test(id)||id===g.id))fail('invalid related guide');
  if(g.voyageIds?.some(id=>!text(id)))fail('invalid voyage reference');
 }
 for(const g of input as WorldGuide[])if(g.relatedGuideIds?.some(id=>!ids.has(id)))throw Error(`${g.id}: unknown related guide`);
 return input as WorldGuide[];
}
const merc=(lat:number)=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))*180/Math.PI;
const inverse=(y:number)=>(2*Math.atan(Math.exp(y*Math.PI/180))-Math.PI/2)*180/Math.PI;
/** Pad the declared extent to a readable aspect, preserving Mercator geometry. */
export function worldMapLayout(g:WorldGuide){
 let [w,s,e,n]=g.map.bounds;let sy=merc(s),ny=merc(n),dx=e-w,dy=ny-sy;
 if(dy<dx*.5){const middle=(sy+ny)/2;sy=middle-dx*.25;ny=middle+dx*.25;}
 if(dy>dx){const middle=(w+e)/2;w=middle-dy/2;e=middle+dy/2;}
 s=inverse(sy);n=inverse(ny);dx=e-w;dy=ny-sy;
 const height=Math.round(1200*dy/dx);
 return {id:g.id,bounds:[w,s,e,n] as [number,number,number,number],height,outputPixels:[3600,height*3],project:([lon,lat]:[number,number])=>[(unwrapLongitude(lon,w)-w)/dx*1200,(ny-merc(lat))/dy*height] as [number,number]};
}
