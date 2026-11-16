import type {MapPoint} from './map-picking';
export const MAX_MAP_ZOOM=65536;
export const clampZoom=(zoom:number)=>Math.max(1,Math.min(MAX_MAP_ZOOM,Number.isFinite(zoom)?zoom:1));

/** The smallest longitude arc keeps Pacific connections on the nearby side of the globe. */
export function geographicCenter(points:readonly MapPoint[]):MapPoint {
  if(!points.length)return [0,0];
  const longitudes=points.map(p=>((p[0]%360)+360)%360).sort((a,b)=>a-b);
  let gap=-1,start=longitudes[0];
  for(let i=0;i<longitudes.length;i++){
    const next=longitudes[(i+1)%longitudes.length]+(i===longitudes.length-1?360:0);
    if(next-longitudes[i]>gap){gap=next-longitudes[i];start=next%360;}
  }
  const longitude=((start+(360-gap)/2+540)%360)-180;
  return [longitude,(Math.min(...points.map(p=>p[1]))+Math.max(...points.map(p=>p[1])))/2];
}

export function fitMapBounds(bounds:[MapPoint,MapPoint],width:number,height:number,padding=48,minSpan=1){
  const [[left,top],[right,bottom]]=bounds;
  const scale=clampZoom(Math.min(Math.max(1,width-2*padding)/Math.max(minSpan,right-left),Math.max(1,height-2*padding)/Math.max(minSpan,bottom-top)));
  return {scale,tx:width/2-(left+right)/2*scale,ty:height/2-(top+bottom)/2*scale};
}
