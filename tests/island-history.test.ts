import test from 'node:test';import assert from 'node:assert/strict';
import {dataset} from '../src/published-data';import {topicOnlyIds} from '../src/topic-dives';import {historyState} from '../src/history';
test('Falkland early visits remain a dated disputed interpretation, not a colony',()=>{
 const r=dataset.records.find(r=>r.id==='r5-falklands-visits')!;assert.equal(r.time.start,1275);assert.equal(r.time.end,1420);assert.equal(r.history,undefined);assert(r.claims.some(c=>c.status==='disputed'));assert.match(r.review.summary,/sea lion|sea-lion/i);
});
test('new island settlements and visits feed the shared map at their own dates',()=>{
 for(const [id,date] of [['islands-port-louis-1764',1764],['islands-port-egmont-1766',1766],['islands-stanley-1843',1843],['islands-floreana-1832',1832],['islands-progreso-1866',1866]] as const){const r=dataset.records.find(r=>r.id===id);assert(r,id);assert.equal(r.time.start,date);assert(!topicOnlyIds.has(id));assert.equal(historyState(r,date-1),'outside');assert.equal(historyState(r,date),'active');}
 const g=dataset.records.find(r=>r.id==='r6-galapagos-reevaluation')!;assert.equal(g.time.kind,'unplaced');assert.equal(g.history,undefined);
});
