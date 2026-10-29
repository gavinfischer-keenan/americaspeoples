import {test} from 'node:test';import assert from 'node:assert/strict';
import data from '../data/intake-round6-reviewed.json';
import {temporalState,formatYear} from '../src/time';
const records=data.records as any[];
test('Tangatatau separate tool dates do not fabricate temporal support between samples',()=>{
 const tools=records.filter(r=>r.id.startsWith('r6-tangatatau-coral'));
 assert.equal(tools.length,2);assert.ok(tools.every(r=>temporalState(r.time,1100)==='absent'));
 assert.equal(temporalState(tools.find(r=>r.id==='r6-tangatatau-coral')!.time,1011),'possible');
});
test('Bapot explicit historical BCE labels survive astronomical-year encoding',()=>{
 const r=records.find(r=>r.id==='r6-bapot-revised')!;
 assert.equal(formatYear(r.time.start),'1,250 BCE');assert.equal(formatYear(r.time.end),'1,130 BCE');
});
