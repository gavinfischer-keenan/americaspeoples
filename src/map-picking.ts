export type MapPoint = [number, number];
export interface HitCandidate<T> {
  key: string;
  value: T;
  kind: 'place' | 'context' | 'route' | 'area';
  point?: MapPoint | null;
  radius?: number;
  lines?: MapPoint[][];
  rings?: MapPoint[][];
}

function segmentDistance(p:MapPoint,a:MapPoint,b:MapPoint):number {
  const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
  const t=length?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)):0;
  return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
}
function insideRing(p:MapPoint,ring:MapPoint[]):boolean {
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const a=ring[i],b=ring[j];
    if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}

/** Distances are CSS pixels, independent of SVG paint order and geographic zoom. */
export function pickCandidates<T>(candidates:readonly HitCandidate<T>[],point:MapPoint,touch=false):T[] {
  const ranks={place:0,context:1,route:2,area:3};
  const hits=candidates.flatMap((candidate,index)=>{
    let distance=candidate.point?Math.hypot(point[0]-candidate.point[0],point[1]-candidate.point[1]):Infinity;
    for(const line of candidate.lines??[])for(let i=1;i<line.length;i++)distance=Math.min(distance,segmentDistance(point,line[i-1],line[i]));
    const contained=candidate.rings?.some(ring=>insideRing(point,ring))??false;
    const radius=candidate.radius??(candidate.kind==='route'?(touch?14:8):(touch?24:15));
    return contained||distance<=radius?[{candidate,index,distance:contained?0:distance}]:[];
  }).sort((a,b)=>ranks[a.candidate.kind]-ranks[b.candidate.kind]||a.distance-b.distance||a.index-b.index);
  const seen=new Set<string>();
  return hits.filter(({candidate})=>!seen.has(candidate.key)&&!!seen.add(candidate.key)).map(({candidate})=>candidate.value);
}
