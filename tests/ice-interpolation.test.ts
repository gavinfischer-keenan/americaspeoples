import test from 'node:test';
import assert from 'node:assert/strict';
import {iceBracket,interpolateIce} from '../src/ice-interpolation';
import type {IceGeometry} from '../src/ice-geometry';
const square=(r:number):IceGeometry=>({type:'Polygon',coordinates:[[[-r,-r],[r,-r],[r,r],[-r,r],[-r,-r]]]});
const grid={west:-12,east:12,south:-12,north:12,step:.25};
const vertices=(g:IceGeometry):number[][]=>g.type==='GeometryCollection'?g.geometries.flatMap(vertices):g.type==='Polygon'?g.coordinates.flat():g.coordinates.flat(2);

test('ice brackets surrounding dates within one scenario and never extrapolates',()=>{
 const index=[{scenario:'optimal',ageCalBP:1000},{scenario:'optimal',ageCalBP:1500},{scenario:'min',ageCalBP:1250}];
 assert.deepEqual(iceBracket(index,1950-1250,'optimal'),{olderAge:1500,youngerAge:1000,fraction:.5});
 assert.deepEqual(iceBracket(index,1950-1000,'optimal'),{olderAge:1000,youngerAge:1000,fraction:0});
 assert.equal(iceBracket(index,1950-1600,'optimal'),null);
});
test('ice retains source endpoints and retreats gradually between different outlines',()=>{
 const a=square(10),b=square(4);
 assert.equal(interpolateIce(a,b,0,grid),a);assert.equal(interpolateIce(a,b,1,grid),b);
 const middle=vertices(interpolateIce(a,b,.5,grid));
 assert.ok(Math.abs(Math.max(...middle.map(p=>p[0]))-7)<.4);
 const before=vertices(interpolateIce(a,b,.49,grid)),after=vertices(interpolateIce(a,b,.51,grid));
 assert.ok(Math.abs(Math.max(...before.map(p=>p[0]))-Math.max(...after.map(p=>p[0])))<.25);
});
test('interpolated ice preserves holes, disconnected parts and finite empty-endpoint retreat',()=>{
 const hole:IceGeometry={type:'Polygon',coordinates:[(square(10) as any).coordinates[0],(square(3) as any).coordinates[0]]};
 const mid=interpolateIce(hole,hole,.5,grid);
 assert.equal(mid.type,'MultiPolygon');if(mid.type==='MultiPolygon')assert.equal(mid.coordinates[0].length,2);
 const parts:IceGeometry={type:'MultiPolygon',coordinates:[[[[-9,-2],[-5,-2],[-5,2],[-9,2],[-9,-2]]],[[[5,-2],[9,-2],[9,2],[5,2],[5,-2]]]]};
 const split=interpolateIce(parts,parts,.5,grid);if(split.type==='MultiPolygon')assert.equal(split.coordinates.length,2);else assert.fail('multipolygon expected');
 const empty:IceGeometry={type:'MultiPolygon',coordinates:[]};
 const fading=vertices(interpolateIce(square(10),empty,.1,grid));
 assert.ok(fading.length>0);assert.ok(fading.flat().every(Number.isFinite));
});
