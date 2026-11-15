import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { geoArea, geoContains } from "d3-geo";
import { boundariesAt, validateBoundaries, type PoliticalBoundary, type BoundarySource } from "../src/boundaries";
const rows = JSON.parse(readFileSync(new URL("../data/early-national-boundaries.json",import.meta.url),"utf8")) as (PoliticalBoundary & {sourceRow:{index:number;name:string;start:number;end:number}})[];
const sources = JSON.parse(readFileSync(new URL("../data/early-national-boundary-sources.json",import.meta.url),"utf8")) as BoundarySource[];
const at = (year:number) => boundariesAt(rows,year);
test("early boundary versions validate with source and reuse provenance",()=>{
 assert.ok(rows.length>100);
 assert.deepEqual(validateBoundaries(rows,new Set(sources.map(s=>s.id))),[]);
 assert.ok(sources.some(s=>s.id==="cliopatria-data" && /CC BY 4.0/.test(s.license)));
 for(const r of rows){
  assert.equal(r.detail,"broad");
  assert.match(r.note,/coverage/i);
  assert.match(r.precision,/not.*legal|not.*survey/i);
  assert.ok(Number(r.start.slice(0,4))>=r.sourceRow.start);
  assert.ok(Number(r.end.slice(0,4))<=r.sourceRow.end);
 }
});
test("source filtering bridges selected Latin American years without misleading transition phases",()=>{
 assert.ok(at(1825).some(r=>r.name==="Gran Colombia"));
 assert.ok(!at(1833).some(r=>r.name==="Gran Colombia"));
 assert.ok(at(1825).some(r=>/Central American Federation/.test(r.name)));
 assert.ok(!at(1839).some(r=>/Central American Federation/.test(r.name)));
 assert.ok(at(1837).some(r=>/Peru–Bolivian Confederation/.test(r.name)));
 assert.ok(!at(1839).some(r=>/Peru–Bolivian Confederation/.test(r.name)));
 assert.ok(at(1825).some(r=>r.name==="Empire of Brazil"));
 assert.ok(!at(1825).some(r=>/Portuguese/.test(r.name)));
 assert.ok(at(1870).some(r=>r.name==="Argentina"));
 assert.ok(at(1870).some(r=>r.name==="United States of Colombia"));
 assert.ok(!at(1823).some(r=>r.name==="First Mexican Empire"));
 assert.ok(!at(1867).some(r=>r.name==="Second Mexican Empire"));
 assert.ok(!at(1846).some(r=>/centralist polity/.test(r.name)));
 assert.ok(!at(1845).some(r=>r.name==="Riograndense Republic"));
 assert.ok(!at(1814).some(r=>r.name==="Chile"));
 assert.equal(at(1750).length,0,"HGIS owns1701–1808");
 assert.equal(at(1886).length,0,"CShapes owns1886 onward");
});
test("late Spanish reconstruction contains Cuba and Puerto Rico without stale mainland enclaves",()=>{
 const spanish=rows.filter(r=>r.name.startsWith("Spanish") && r.start>="1824");
 assert.ok(spanish.length>0);
 for(const r of spanish){
  assert.equal(r.name,"Spanish Caribbean possessions (Cuba/Puerto Rico)");
  assert.ok(r.sourceIds.includes("spanish-caribbean-scope"));
  const polygons=r.geometry.type==="Polygon"?[r.geometry.coordinates]:r.geometry.coordinates;
  for(const polygon of polygons)for(const ring of polygon)for(const [lon,lat] of ring){
   assert.ok((lon>=-85.5&&lon<=-73.8&&lat>=19.5&&lat<=24.2)||(lon>=-67.5&&lon<=-65.1&&lat>=17.6&&lat<=18.7),r.id);
  }
  for(const p of [[-77.1,-12.1],[-68.2,-16.5],[-74,-42.7],[-63,-40.8],[-58.2,-51.5]])assert.equal(geoContains(r.geometry as any,p as [number,number]),false,r.id);
 }
});
test("whole retained components stay in the Americas and use D3 winding",()=>{
 for(const r of rows){
  const polygons=r.geometry.type==="Polygon"?[r.geometry.coordinates]:r.geometry.coordinates;
  for(const polygon of polygons)for(const ring of polygon)for(const [lon,lat] of ring){
   assert.ok(lon>=-170 && lon<=-30 && lat>=-57 && lat<=85,r.id);
  }
  assert.ok(geoArea(r.geometry as any)>0 && geoArea(r.geometry as any)<2*Math.PI,r.id);
  assert.ok(geoContains(r.geometry as any,r.labelPoint),r.id);
  for(const p of r.labelPoints??[])assert.ok(geoContains(r.geometry as any,p),r.id);
 }
});
