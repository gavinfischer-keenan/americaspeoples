import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dataset} from '../src/published-data';
import {temporalState} from '../src/time';
const ledger=JSON.parse(readFileSync('data/temporal-review-2026-10-29.json','utf8'));
test('every formerly unplaced record has an individual temporal-review disposition',()=>{
 assert.equal(ledger.items.length,280);assert.equal(new Set(ledger.items.map((x:any)=>x.id)).size,280);
 for(const x of ledger.items){assert.ok(x.reason.length>20);assert.ok(x.originalTime.original);assert.ok(dataset.records.some(r=>r.id===x.id));}
});
test('regional period guides remain possible and do not invent certain occupation cores',()=>{
 const records=dataset.records.filter(r=>r.time.method.includes('period guide'));
 assert.ok(records.length>10);
 for(const r of records){assert.equal(r.time.approximate,true);assert.equal(r.time.kind,'occurrence');assert.equal(temporalState(r.time,Math.round((r.time.start!+r.time.end!)/2)),'possible');assert.ok(r.sources.some(s=>s.id==='chronology-guide'));}
});
test('uncalibrated assay and modern sampled lineages are not silently converted to ancient settlement dates',()=>{
 for(const id of ['plains-jim-pitts-goshen','atlantic-lanse-amour-burial-context','amazon-waorani-maternal-founder','r4-cactus-hill-stratigraphy'])assert.equal(dataset.records.find(r=>r.id===id)!.time.kind,'unplaced');
});
test('two coastal travel windows remain separate with no evidence in the gap',()=>{
 const a=dataset.records.find(r=>r.id==='northwest-praetorius-opportunities')!;
 const b=dataset.records.find(r=>r.id==='northwest-praetorius-opportunities-later')!;
 assert.equal(temporalState(a.time,-18000),'absent');assert.equal(temporalState(b.time,-18000),'absent');
});
