import {contours} from 'd3-contour';
import {normalizeIceGeometry,type IceGeometry} from './ice-geometry';

export function iceBracket(index:readonly {scenario:string;ageCalBP:number}[],year:number,scenario:string){
 const age=1950-year,ages=[...new Set(index.filter(s=>s.scenario===scenario).map(s=>s.ageCalBP))].sort((a,b)=>a-b);
 if(!ages.length||age<ages[0]||age>ages.at(-1)!)return null;
 const olderAge=ages.find(a=>a>=age)!,youngerAge=[...ages].reverse().find(a=>a<=age)!;
 return {olderAge,youngerAge,fraction:olderAge===youngerAge?0:(olderAge-age)/(olderAge-youngerAge)};
}
export interface IceGrid{west:number;east:number;south:number;north:number;step:number}
// Covers every archived NADI-1 vertex, with an ice-free margin. This is a
// display grid, not a physical model of ice velocity or local uncertainty.
const defaultGrid:IceGrid={west:-175,east:-30,south:35,north:88,step:.25};
const fields=new WeakMap<IceGeometry,Map<string,Float32Array>>();
function polygons(g:IceGeometry):number[][][][]{
 return g.type==='GeometryCollection'?g.geometries.flatMap(polygons):g.type==='Polygon'?[g.coordinates]:g.coordinates;
}
function distanceField(geometry:IceGeometry,grid:IceGrid,width:number,height:number){
 const key=JSON.stringify(grid);let cached=fields.get(geometry);const found=cached?.get(key);if(found)return found;
 const inside=new Uint8Array(width*height);
 // Scanline even/odd filling preserves holes; separate polygons are unioned.
 for(const polygon of polygons(geometry)){
  for(let y=0;y<height;y++){
   const lat=grid.south+(y+.5)*grid.step,crossings:number[]=[];
   for(const ring of polygon)for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[j],b=ring[i];
    if((a[1]>lat)!==(b[1]>lat))crossings.push(a[0]+(lat-a[1])*(b[0]-a[0])/(b[1]-a[1]));
   }
   crossings.sort((a,b)=>a-b);
   for(let c=0;c+1<crossings.length;c+=2){
    const lo=Math.max(0,Math.ceil((crossings[c]-grid.west)/grid.step-.5)),hi=Math.min(width-1,Math.floor((crossings[c+1]-grid.west)/grid.step-.5));
    for(let x=lo;x<=hi;x++)inside[y*width+x]=1;
   }
  }
 }
 // Two-pass, eight-neighbor chamfer distance. Horizontal distances are scaled
 // by cos(60°), a fixed North American reference latitude; no precision claim.
 const horizontal=.5,vertical=1,diagonal=Math.hypot(horizontal,vertical),far=Math.hypot(width*horizontal,height);
 const distance=(target:number)=>{
  const d=new Float32Array(inside.length);for(let i=0;i<d.length;i++)d[i]=inside[i]===target?0:far;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const i=y*width+x;let v=d[i];if(x)v=Math.min(v,d[i-1]+horizontal);
   if(y){v=Math.min(v,d[i-width]+vertical);if(x)v=Math.min(v,d[i-width-1]+diagonal);if(x+1<width)v=Math.min(v,d[i-width+1]+diagonal);}d[i]=v;
  }
  for(let y=height-1;y>=0;y--)for(let x=width-1;x>=0;x--){
   const i=y*width+x;let v=d[i];if(x+1<width)v=Math.min(v,d[i+1]+horizontal);
   if(y+1<height){v=Math.min(v,d[i+width]+vertical);if(x)v=Math.min(v,d[i+width-1]+diagonal);if(x+1<width)v=Math.min(v,d[i+width+1]+diagonal);}d[i]=v;
  }
  return d;
 };
 const toInside=distance(1),toOutside=distance(0),signed=new Float32Array(inside.length);
 // Half-cell offset puts a source edge between adjacent opposite-state cells.
 for(let i=0;i<signed.length;i++)signed[i]=inside[i]?Math.max(.01,toOutside[i]-.25):-Math.max(.01,toInside[i]-.25);
 if(!cached){cached=new Map();fields.set(geometry,cached);}cached.set(key,signed);return signed;
}

/** Linear interpolation of signed distances, followed by an approximate contour.
 * Handles changing topology without matching unrelated polygon vertices. Source
 * geometries are returned untouched at their exact dates; never extrapolates. */
export function interpolateIce(older:IceGeometry,younger:IceGeometry,fraction:number,grid=defaultGrid):IceGeometry{
 if(fraction<=0)return older;if(fraction>=1)return younger;
 const width=Math.ceil((grid.east-grid.west)/grid.step),height=Math.ceil((grid.north-grid.south)/grid.step);
 const a=distanceField(older,grid,width,height),b=distanceField(younger,grid,width,height),mixed=new Array<number>(a.length);
 for(let i=0;i<mixed.length;i++)mixed[i]=a[i]*(1-fraction)+b[i]*fraction;
 const contour=contours().size([width,height]).smooth(true).contour(mixed,0);
 const geometry:IceGeometry={type:'MultiPolygon',coordinates:contour.coordinates.map(polygon=>polygon.map(ring=>ring.map(([x,y])=>[grid.west+x*grid.step,grid.south+y*grid.step])))};
 return normalizeIceGeometry(geometry);
}
