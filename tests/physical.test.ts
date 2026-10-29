import {test} from 'node:test';
import assert from 'node:assert/strict';
import {climateKinds, iceSnapshot, eventsAt, climateCategory,hazardEvents,isUncertainHazard,openHazardDate,setPhysicalData} from '../src/physical';
import ice from '../data/ice-snapshots.json';
import hazards from '../data/hazard-events.json';
setPhysicalData(hazards,ice);
import {dataset} from '../src/published-data';
test('ice boundaries use an explicitly dated nearest snapshot, never extrapolation',()=>{
 assert.equal(iceSnapshot(-30000),null);assert.equal(iceSnapshot(1500),null);
 const s=iceSnapshot(1950-20000)!;assert.equal(s.ageCalBP,20000);assert.equal(s.scenario,'optimal');
 assert.equal(iceSnapshot(1950-20000,'min')!.scenario,'min');
});
test('climate events retain source, method and uncertainty and only appear at their dates',()=>{
 const events=eventsAt(1877,new Set());assert.ok(events.some(e=>e.kind==='el-nino'));
 assert.ok(events.every(e=>e.start<=1877&&e.end>=1877&&e.sourceId&&e.limitations));
 assert.equal(eventsAt(1877,new Set(climateKinds)).length,0);
});
test('climate classification requires environment metadata, not a mention of drought in human claims',()=>{
 const human=dataset.records.find(r=>r.id==='central-mexico-drought-continuity')!;
 assert.equal(climateCategory(human),null);
});
test('numeric eruption date uncertainty is explicit; supported ongoing eruptions remain visible',()=>{
 const edge=hazardEvents.find(e=>e.id==='gvp-eruption-20425')!;assert.ok(isUncertainHazard(edge));assert.ok(!eventsAt(-2200,new Set(),false).some(e=>e.id===edge.id));
 const dukono=hazardEvents.find(e=>e.title==='Dukono'&&e.start===1933)!;assert.equal(openHazardDate(dukono),false);assert.ok(eventsAt(1934,new Set(),false).includes(dukono));
});
