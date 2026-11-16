import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dataset} from '../src/published-data';
import {topicOnlyIds} from '../src/topic-dives';
import {recordsForView} from '../src/atlas-view';
import {temporalState} from '../src/time';
import baseline from '../data/regional-gap-baseline.json';

const record=(id:string)=>{const r=dataset.records.find(x=>x.id===id);assert.ok(r,`shared record ${id} must be published`);return r;};

test('regional discoveries enter the master movie, with battles limited to their year',()=>{
 for(const id of ['regional-matagalpa-1881','regional-canudos-1897','regional-coranderrk-1863','regional-brewarrina-1848']){
  const r=record(id);assert.equal(topicOnlyIds.has(id),false);
  assert.ok(recordsForView(dataset.records,'movie',r.time.start!).dated.some(x=>x.id===id));
 }
 const conflict=record('regional-matagalpa-1881');
 assert.equal(conflict.overlay?.kind,'conflict');
 assert.equal(temporalState(conflict.time,1880),'absent');
 assert.equal(temporalState(conflict.time,1882),'absent');
});

test('a first written fishery observation does not invent a construction or abandonment date',()=>{
 const r=record('regional-brewarrina-1848');
 assert.equal(r.history?.kind,'attestation');
 assert.equal(r.time.kind,'occurrence');
 assert.equal(r.time.start,1848);assert.equal(r.time.end,1848);
 assert.equal(r.history?.endEvidence,undefined);
 assert.match(r.review.limitations,/construction|built/i);
});

test('reserve closure does not erase continuing residents; repeated phases are one place',()=>{
 const start=record('regional-coranderrk-1863'), closure=record('regional-coranderrk-1924');
 assert.deepEqual(start.location,closure.location);
 assert.equal(closure.history?.endEvidence,undefined);
 assert.match(closure.review.limitations,/residen|abandon/i);
 assert.ok(start.review.relatedIds.includes(closure.id));
 assert.ok(closure.review.relatedIds.includes(start.id));
});

test('campaign preserves a pre-change baseline and every new record has resolvable reciprocal links',()=>{
 assert.equal(baseline.recordCount,1960);assert.equal(baseline.sharedRecordCount,1902);
 const rows=dataset.records.filter(r=>r.id.startsWith('regional-'));
 assert.ok(rows.length>=25,'substantial evidence across the three requested regions');
 for(const r of rows){
  assert.ok(r.time.end!==null&&r.time.end<=1934,r.id);
  assert.ok(r.location&&r.location.precision&&r.location.provenance,r.id);
  assert.ok(r.sources.length>0&&r.claims.every(c=>c.support.some(s=>r.sources.some(x=>x.id===s.sourceId))),r.id);
  for(const id of r.review.relatedIds)assert.ok(record(id).review.relatedIds.includes(r.id),`${r.id} -> ${id}`);
 }
 const old=JSON.parse(readFileSync('data/world-coverage-baseline.json','utf8'));
 assert.ok(Array.isArray(old),'v0.14 baseline remains unchanged in its original format');
});
