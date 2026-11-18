import {formatYear} from './time';
import type {MapRecord,HistoryMetadata} from './model';

/** Coordinates are projected pixels before camera translation, quantized to a zoom band
 * by the caller. Panning or changing the date never moves the grouping lattice. */
export interface DensityAnchor {
  key:string; x:number; y:number; active:number; prior:number; protectedPoint:boolean; inView?:boolean;
}
export interface DensityGroup {
  key:string; anchor:DensityAnchor; members:DensityAnchor[]; active:number; prior:number;
}
export function densityGroups(anchors:readonly DensityAnchor[],spacing:number):DensityGroup[] {
  const cells=new Map<string,DensityGroup>();
  const anchorDistances=new Map<string,number>();
  const rowHeight=spacing*Math.sqrt(3)/2;
  for(const point of [...anchors].sort((a,b)=>a.key.localeCompare(b.key))){
    // Find the closest center in two staggered rows (a hexagonal partition).
    const firstRow=Math.floor(point.y/rowHeight);
    let distance=Infinity,cell='';
    for(const row of [firstRow,firstRow+1]){
      const offset=Math.abs(row%2)*0.5;
      const column=Math.round(point.x/spacing-offset);
      const d=Math.hypot(point.x-(column+offset)*spacing,point.y-row*rowHeight);
      if(d<distance){distance=d;cell=row+','+column;}
    }
    const key=point.protectedPoint?'single:'+point.key:'cell:'+cell;
    const group=cells.get(key)??{key,anchor:point,members:[],active:0,prior:0};
    // Keep the representative on a real source coordinate and inside the screen
    // whenever a member is visible. An edge member in the culling margin may
    // still be inspected without placing the whole group beyond the edge.
    const score=distance+(point.inView===false?spacing*2:0);
    if(score<(anchorDistances.get(key)??Infinity)){
      group.anchor=point;
      anchorDistances.set(key,score);
    }
    group.members.push(point);
    group.active+=point.active;
    group.prior+=point.prior;
    cells.set(key,group);
  }
  return [...cells.values()];
}

/** A dated record ending alone cannot establish local abandonment. */
export function placeChange(history:HistoryMetadata|undefined,year:number){
  const evidence=history?.endEvidence;
  if(evidence&&year>=evidence.start)return {
    kind:evidence.meaning,inWindow:year<=evidence.end,possible:year<evidence.end||evidence.certainty==='inferred'
  };
  if(history?.endYear!==undefined&&year>=history.endYear&&(history.endMeaning==='abandoned'||history.endMeaning==='relocated')){
    return {kind:history.endMeaning,inWindow:year===history.endYear,possible:false};
  }
  return null;
}

/** This cue describes the documented change window, never the lifespan of a community. */
export function changeCaption(record:MapRecord,year:number):string|null {
  const {start,end}=record.time;
  const ending=placeChange(record.history,year);
  if(ending?.inWindow){
    const evidence=record.history?.endEvidence;
    const from=evidence?.start??year,to=evidence?.end??year;
    const kind=ending.kind==='relocated'?'Local relocation':'Local abandonment';
    return datedCaption((ending.possible?'Possible ':'')+kind,from,to);
  }
  if(start===null||end===null||year<start||year>end)return null;
  const kind=record.overlay?.kind==='conflict'?'Conflict':
    record.overlay?.kind==='violence'?'Violence':
    record.overlay?.kind==='forced-removal'?'Forced relocation':
    record.history?.kind==='wreck'?'Shipwreck':
    record.history?.kind==='visit'?'Visit':
    record.history?.kind==='settlement'&&record.type!=='occupation'?'Foundation':
    record.time.kind==='occurrence'?'Dated evidence':null;
  if(!kind)return null;
  const supported=record.history?.windows?.find(window=>year>=window.start&&year<=window.end);
  if(record.history?.windows&&!supported)return null;
  return datedCaption(kind,supported?.start??start,supported?.end??end);
}
function datedCaption(kind:string,start:number,end:number){
  return kind+' · '+formatYear(start)+(start===end?'':'–'+formatYear(end));
}
