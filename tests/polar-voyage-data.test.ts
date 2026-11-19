import test from 'node:test';
import assert from 'node:assert/strict';
import raw from '../data/voyages.json';
import {validateItinerary,sampleVoyage,dateValue,type Voyage} from '../src/voyages';
import {activeExpeditions} from '../src/expedition-context';
const voyages=raw.voyages as Voyage[];
test('the expanded inventory includes the polar and American voyage campaigns',()=>{
 assert.ok(voyages.length>=50,'major-voyage inventory is expanded');
 for(const fragment of ['endurance','nimrod','amundsen','franklin','nansen','ross','cartier','hudson','malaspina','humboldt'])assert.ok(voyages.some(v=>v.id.includes(fragment)),fragment);
 for(const v of voyages)assert.deepEqual(validateItinerary(v.stops),[],v.id);
});
test('simultaneous Shackleton parties retain their original 1916 positions in the archive only',()=>{
 const entries=activeExpeditions(voyages,dateValue('1916-05-01'),()=>false);
 assert.deepEqual(entries,[]);
 for(const part of ['caird','elephant'])assert.ok(voyages.some(v=>v.id.includes(part)&&sampleVoyage(v.stops,dateValue('1916-05-01'))));
 for(const v of voyages.filter(v=>v.id.includes('endurance')))assert.equal(v.scope,'global');
});
