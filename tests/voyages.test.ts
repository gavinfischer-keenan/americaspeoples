import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleVoyage, dateValue, validateItinerary } from '../src/voyages';
const stops=[
 {name:'Departure',coordinates:[170,-10] as [number,number],arrival:'1835-01-01',departure:'1835-01-10',mode:'sea' as const,note:'Dated port call'},
 {name:'Island',coordinates:[-170,-10] as [number,number],arrival:'1835-01-20',departure:'1835-01-25',mode:'land' as const,note:'Dated landing'},
 {name:'Inland',coordinates:[-169,-9] as [number,number],arrival:'1835-01-30',departure:'1835-01-30',mode:'land' as const,note:'Dated endpoint'},
];
test('ships hold at ports and only interpolate during travel',()=>{
 assert.equal(sampleVoyage(stops,dateValue('1834-12-31')),null);
 assert.equal(sampleVoyage(stops,dateValue('1835-01-05'))?.status,'stopped');
 assert.deepEqual(sampleVoyage(stops,dateValue('1835-01-05'))?.coordinates,[170,-10]);
 const mid=sampleVoyage(stops,(dateValue('1835-01-10')+dateValue('1835-01-20'))/2)!;
 assert.equal(mid.status,'traveling');assert.ok(Math.abs(mid.coordinates[0])>179,'short crossing at dateline, not through Greenwich');assert.equal(mid.mode,'sea');
 assert.equal(sampleVoyage(stops,dateValue('1835-01-23'))?.stopName,'Island');
 assert.equal(sampleVoyage(stops,dateValue('1835-01-28'))?.mode,'land');
 assert.equal(sampleVoyage(stops,dateValue('1835-02-01')),null);
});
test('itinerary validation rejects fictional calendars, reversals and invalid positions',()=>{
 assert.deepEqual(validateItinerary(stops),[]);
 assert.ok(validateItinerary([{...stops[0],arrival:'1835-02-30'},stops[1]]).length);
 assert.ok(validateItinerary([stops[1],stops[0]]).length);
 assert.ok(validateItinerary([{...stops[0],coordinates:[270,20]},stops[1]] as any).length);
});
