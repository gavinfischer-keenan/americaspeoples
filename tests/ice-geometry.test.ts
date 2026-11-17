import test from 'node:test';
import assert from 'node:assert/strict';
import {geoArea,geoContains,geoBounds} from 'd3-geo';
import ice from '../data/ice-snapshots.json';
import {normalizeIceGeometry,type IceGeometry} from '../src/ice-geometry';

test('every North American ice snapshot covers its local region, never the globe',()=>{
 for(const s of ice.snapshots){
  const label=s.scenario+' '+s.ageCalBP;
  assert.ok(geoArea(s.geometry as any)<1,label+' has an inverted polygon');
  for(const [name,point] of [['Lima',[-77,-12]],['Sydney',[151,-34]],['Honolulu',[-157.8,21.3]]] as const){
   assert.equal(geoContains(s.geometry as any,[...point]),false,label+' incorrectly covers '+name);
  }
  const bounds=geoBounds(s.geometry as any);assert.ok(bounds[0][1]>35,label+' extends outside the North American reconstruction');
 }
});

test('spherical normalization repairs tiny reversed rings without moving vertices or removing holes',()=>{
 const ring=[[-142.79821155921417,61.49885921757868],[-142.77095523939101,61.501295537658734],[-142.85446200471597,61.49383124201796],[-142.79821155921417,61.49885921757868]];
 const g={type:'Polygon' as const,coordinates:[ring]};
 const before=JSON.stringify(g),fixed=normalizeIceGeometry(g);
 assert.ok(geoArea(g)>2*Math.PI);assert.ok(geoArea(fixed)<0.001);
 assert.equal(JSON.stringify(g),before,'source input is not mutated');
 assert.deepEqual((fixed as typeof g).coordinates[0],[...ring].reverse());
 for(const s of ice.snapshots)assert.deepEqual(normalizeIceGeometry(s.geometry as IceGeometry),s.geometry,'normalization is stable');
});
