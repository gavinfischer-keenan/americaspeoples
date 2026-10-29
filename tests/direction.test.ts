import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateOverlay } from '../src/overlays';
const overlay:any={kind:'trade',basis:'schematic',geometry:{type:'LineString',coordinates:[[-80,0],[-70,10]]},precision:'Approximate connection',provenance:'Source-supported exchange'};
test('overlay direction is explicit and constrained; legacy unknown direction stays valid',()=>{
 assert.deepEqual(validateOverlay(overlay),[]);
 for(const direction of ['forward','reverse','both','multidirectional'])assert.deepEqual(validateOverlay({...overlay,direction}),[]);
 assert.ok(validateOverlay({...overlay,direction:'guessed'}).length);
 assert.ok(validateOverlay({...overlay,direction:'forward',geometry:{type:'Point',coordinates:[0,0]}}).length);
});
