import test from 'node:test';
import assert from 'node:assert/strict';
import {dataset} from '../src/published-data';
import {placeGroups,placeKey} from '../src/map-place-groups';
import {fixture} from './fixtures';
test('Bluefish is one evidence record, not a second red-star site',()=>{
 const rs=dataset.records.filter(r=>/Bluefish/i.test(r.title));assert.equal(rs.length,1);assert.equal([...placeGroups(rs).values()][0].length,1);
});
test('construction and dated finds share one marker without losing phases',()=>{
 const rs=dataset.records.filter(r=>['g20-hove-castle-architecture','g20-hove-castle-1277-beam'].includes(r.id));
 const groups=placeGroups(rs);assert.equal(groups.size,1);assert.equal([...groups.values()][0].length,2);
});
test('same coordinate event and settlement are one group; routes and areas are not points',()=>{
 const a=fixture(),b={...fixture(),id:'foundation',history:{kind:'settlement' as const,claimId:'c1'}};
 const battle={...fixture(),id:'battle',overlay:{kind:'conflict' as const,basis:'documented' as const,geometry:{type:'Point' as const,coordinates:[a.location!.lon,a.location!.lat] as [number,number]},precision:'locality',provenance:'source'}};
 assert.equal([...placeGroups([a,b,battle]).values()][0].length,3);
 assert.equal(placeKey({...battle,overlay:{...battle.overlay,kind:'regional-evidence'}}),null);
 assert.equal(placeKey({...a,type:'movement',destination:{...a.location!,lon:10}}),null);
 assert.equal(placeGroups([a,{...a,id:'nearby',location:{...a.location!,lon:a.location!.lon+.0001}}]).size,2);
 const correction={...a,proposalKey:'correction'};assert.equal([...placeGroups([a,correction]).values()][0].length,2);
});
