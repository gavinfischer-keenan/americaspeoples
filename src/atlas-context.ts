import { geoPath, type GeoProjection } from 'd3-geo';
import { projectPoint } from './map-projection';
import { boundariesAt, type PoliticalBoundary } from './boundaries';
import { dateValue, type Voyage } from './voyages';
import { displayedVoyageStops, MOVIE_END_DATE, sampleMapVoyage, scopedVoyageGeometry } from './shared-movie';
import {expeditionPhase} from './expedition-context';
import {intersectsView,type ViewBounds} from './terrain';
import { esc } from './dom';
import type { EvidenceRecord } from './model';

export interface RailSegment {id:string;name:string;start:number;networkKind?:'road'|'rail';geometry:any;sourceId:string;precision:string;note:string}
export function regionalRailSegments(records:readonly EvidenceRecord[]):RailSegment[]{
 return records.filter(r=>r.id.startsWith('rail-')&&r.overlay?.geometry&&r.time.start!==null).map(r=>({id:'built-'+r.id,name:r.title,start:r.time.start!,geometry:r.overlay!.geometry,sourceId:r.sources[0].id,precision:r.overlay!.precision,note:'Schematic connection built or attested by this year. Continued service is not implied. '+r.review.limitations}));
}
export interface ContextOptions {boundaries:boolean;rails:boolean;voyages:boolean;voyageId:string;voyageDate:number|null}
/** Reference layers deliberately have no hit targets: a border never hides a town. */
export class AtlasContext {
 boundaries:PoliticalBoundary[]=[];
 rails:RailSegment[]=[];
 voyages:Voyage[]=[];
 options:ContextOptions={boundaries:true,rails:false,voyages:true,voyageId:'',voyageDate:null};
 private paths=new Map<string,string>();
 private bounds=new Map<string,[[number,number],[number,number]][]>();
 private projection:GeoProjection|null=null;
 draw(projection:GeoProjection,year:number,scale:number,onlyVoyage=false,view?:ViewBounds):string{
  if(projection!==this.projection){this.paths.clear();this.bounds.clear();this.projection=projection;}
  const path=geoPath(projection);
  const cached=(id:string,geometry:any)=>{if(!this.paths.has(id))this.paths.set(id,path(geometry)??'');return this.paths.get(id)!;};
  const visible=(id:string,geometry:any)=>{if(!this.bounds.has(id))this.bounds.set(id,[path.bounds(geometry)]);return this.bounds.get(id)!.some(b=>intersectsView(b,view));};
  let html='';
  if(this.options.rails&&!onlyVoyage){
   html+='<g class="historical-rails">';
   for(const r of this.rails)if(r.start<=year&&visible(r.id,r.geometry))html+=`<path data-infrastructure="${esc(r.id)}" class="network-${r.networkKind??'rail'}" d="${cached(r.id,r.geometry)}"><title>${esc(r.name)} · built or attested by ${r.start}. Continued service is not established. ${esc(r.note)}</title></path>`;
   html+='</g>';
  }
  if(this.options.boundaries&&!onlyVoyage){
   html+='<g class="political-boundaries">';
   for(const b of boundariesAt(this.boundaries,year)){
    if(b.detail==='regional'&&scale<4)continue;
    if(!this.projectedBounds(b,projection).some(bounds=>intersectsView(bounds,view)))continue;
    const authority='authority' in b&&typeof b.authority==='string' ? ` europe-authority-${esc(b.authority)}` : '';
    const reconstruction=authority&&b.sourceIds.includes('cliopatria') ? ' europe-reconstructed-territory' : '';
    html+=`<path class="boundary-${b.kind}${authority}${reconstruction}" d="${cached(b.id,b.geometry)}"><title>${esc(b.name)} · ${esc(b.start)}–${esc(b.end)}. ${esc(b.note)}</title></path>`;
    const labelPoints=projection.scale()*scale<150?[]:scale<2?[b.labelPoint]:b.labelPoints??[b.labelPoint];
    for(const point of labelPoints){const p=projectPoint(projection,point);if(p&&intersectsView([p,p],view))html+=`<text class="boundary-label" x="${p[0]}" y="${p[1]}" style="font-size:${11/scale}px">${esc(b.name)}</text>`;}
   }
   html+='</g>';
  }
  if(this.options.voyages){
   html+='<g class="voyage-tracks">';
   const selected=this.voyages.find(v=>v.id===this.options.voyageId);
   for(const v of this.voyages){
    const date=this.options.voyageDate??year;
    if(date>MOVIE_END_DATE||date<dateValue(v.stops[0].arrival)||date>dateValue(v.stops.at(-1)!.departure))continue;
    const emphasized=selected?.id===v.id;
    const frame=sampleMapVoyage(v,date);
    const geometry=scopedVoyageGeometry(v,emphasized?Infinity:date);
    if(intersectsView(path.bounds(geometry),view)){
    const d=(emphasized?cached('voyage-'+v.id,geometry):path(geometry))??'';
    html+=`<path class="voyage-casing" aria-hidden="true" d="${d}"/><path class="${emphasized?'selected-voyage':''}" data-voyage-track="${esc(v.id)}" d="${d}"><title>${esc(v.name)} · schematic links between documented stops, not a surveyed track.</title></path>`;
    }
    if(emphasized)for(const s of displayedVoyageStops(v)){const p=projectPoint(projection,s.coordinates),future=dateValue(s.arrival)>date;if(p&&intersectsView([p,p],view))html+=`<circle class="voyage-stop ${future?'future-stop':''}" cx="${p[0]}" cy="${p[1]}" r="${3/scale}"><title>${esc(s.name)} · ${esc(s.arrival)}${future?' · later in this itinerary':''}</title></circle>`;}
    const p=frame&&projectPoint(projection,frame.coordinates);
    if(frame&&p&&intersectsView([p,p],view))html+=`<g class="voyage-traveler ${emphasized?'selected-traveler':''}" data-voyage="${esc(v.id)}" transform="translate(${p[0]},${p[1]}) scale(${1/scale})"><title>${esc(v.name)} · ${esc(expeditionPhase(v,frame))} · ${esc(frame.stopName)}</title><circle r="13"/><text text-anchor="middle" dy=".35em">${v.stops[frame.leg].phase==='ice-drift'?'❄':v.stops[frame.leg].phase==='wintering'&&frame.status==='stopped'?'⌂':frame.mode==='air'?'✈':frame.mode==='land'?'🚶':frame.mode==='river'?'🛶':'⛵'}</text></g>`;
   }
   html+='</g>';
  }
  return html;
 }
 projectedBounds(boundary:PoliticalBoundary,projection:GeoProjection):[[number,number],[number,number]][]{
  if(!this.bounds.has(boundary.id)){
   const geometries=boundary.geometry.type==='Polygon'?[boundary.geometry]:boundary.geometry.coordinates.map(coordinates=>({type:'Polygon' as const,coordinates}));
   this.bounds.set(boundary.id,geometries.map(geometry=>geoPath(projection).bounds(geometry as any)));
  }
  return this.bounds.get(boundary.id)!;
 }
}
