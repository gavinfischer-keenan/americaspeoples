import test from 'node:test';
import assert from 'node:assert/strict';
import {pickCandidates,type HitCandidate} from '../src/map-picking';
import {geographicCenter,fitMapBounds} from '../src/map-viewport';

test('places rank before every overlapping area regardless of drawing order',()=>{
 const candidates:HitCandidate<string>[]=[{key:'area',value:'area',kind:'area',rings:[[[0,0],[200,0],[200,200],[0,200]]]},{key:'second',value:'second',kind:'place',point:[106,100]},{key:'nearest',value:'nearest',kind:'place',point:[100,100]}];
 assert.deepEqual(pickCandidates(candidates,[100,100]),['nearest','second','area']);
 assert.deepEqual(pickCandidates(candidates,[180,180]),['area']);
});
test('line picking follows individual segments and uses a larger touch target',()=>{
 const route:HitCandidate<string>={key:'route',value:'route',kind:'route',lines:[[[0,0],[100,0]],[[200,0],[300,0]]]};
 assert.deepEqual(pickCandidates([route],[50,12]),[]);
 assert.deepEqual(pickCandidates([route],[50,12],true),['route']);
 assert.deepEqual(pickCandidates([route],[150,0],true),[]);
});
test('Pacific bounds center across the dateline and fit both endpoints',()=>{
 assert.deepEqual(geographicCenter([[170,-10],[-170,-20]]),[-180,-15]);
 const camera=fitMapBounds([[100,100],[500,300]],700,400,50);
 assert.equal(camera.scale,1.5);
 assert.deepEqual([100*camera.scale+camera.tx,500*camera.scale+camera.tx],[50,650]);
});
