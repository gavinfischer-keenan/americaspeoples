import {geoArea} from 'd3-geo';

type Polygon={type:'Polygon';coordinates:number[][][]};
type MultiPolygon={type:'MultiPolygon';coordinates:number[][][][]};
export type IceGeometry=Polygon|MultiPolygon|{type:'GeometryCollection';geometries:IceGeometry[]};

/** D3 evaluates winding on a sphere. A nearly collinear simplified triangle can
 * have the opposite spherical orientation from its planar GIS orientation.
 * Normalize each ring independently; preserve every coordinate and every hole. */
export function normalizeIceGeometry(g:IceGeometry):IceGeometry{
 const polygon=(coordinates:number[][][])=>coordinates.map((ring,index)=>{
  const coversMostOfGlobe=geoArea({type:'Polygon',coordinates:[ring]})>2*Math.PI;
  return (index===0?coversMostOfGlobe:!coversMostOfGlobe)?[...ring].reverse():ring;
 });
 if(g.type==='GeometryCollection')return {...g,geometries:g.geometries.map(normalizeIceGeometry)};
 if(g.type==='MultiPolygon')return {...g,coordinates:g.coordinates.map(polygon)};
 return {...g,coordinates:polygon(g.coordinates)};
}
