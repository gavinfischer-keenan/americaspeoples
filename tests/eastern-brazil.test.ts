import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dataset} from '../src/published-data';
import {topicOnlyIds,topics} from '../src/topic-dives';
import {siteGuides,guideForRecord} from '../src/site-guides';
import {stories} from '../src/stories';
import {historyState} from '../src/history';
import {validateRecord} from '../src/validation';
import type {EvidenceRecord} from '../src/model';

const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
test('eastern Brazilian evidence is local, dated, source linked and on the shared map',()=>{
 const {records}=read('data/eastern-brazil-expansion-records.json') as {records:EvidenceRecord[]};
 assert.ok(records.length>0);
 for(const r of records){
  assert.deepEqual(validateRecord(r),[]);assert.deepEqual(dataset.records.find(x=>x.id===r.id),r);
  assert.ok(!topicOnlyIds.has(r.id));assert.equal(guideForRecord(r.id)?.id,'atlantic-brazil');
  assert.equal(siteGuides.filter(g=>g.recordIds.includes(r.id)).length,1);
  assert.ok(r.location&&r.location.lon>=-48&&r.location.lon<=-34&&r.location.lat>=-25&&r.location.lat<=-1,r.id);
  assert.ok(r.location.provenance&&r.location.precision);
  assert.ok((r.history?.windows??[r.time]).some(w=>w.start!==null&&w.end!==null&&w.start<=1500&&w.end>=501),r.id);
  assert.ok(r.sources.every(s=>s.access.length>10));
  assert.ok(r.sources.every(s=>r.claims.some(c=>c.support.some(link=>link.sourceId===s.id))),r.id+' links every reference to its claim or context');
  assert.ok(r.review.summary.length>60&&r.review.discussion.length>100,'Explain the finds and local history');
 }
});
test('new Brazilian movie chapters have active shared evidence and retain all earlier chapters',()=>{
 const extra=read('data/eastern-brazil-scenes.json');
 const story=stories.find(s=>s.id==='atlantic-brazil')!;
 assert.ok(extra.scenes.length>0);
 for(const scene of extra.scenes){
  assert.ok(story.scenes.some(s=>s.id===scene.id));
  assert.ok(scene.recordIds.some((id:string)=>historyState(dataset.records.find(r=>r.id===id)!,scene.year)==='active'),scene.id);
  assert.ok(scene.recordIds.every((id:string)=>!topicOnlyIds.has(id)));
 }
 assert.ok(story.scenes.some(s=>s.id==='atlantic-brazil-sernambetiba'));
});
test('eastern Brazil coverage preserves its baseline and counts actual localities',()=>{
 const base=read('data/eastern-brazil-baseline.json'),now=read('data/eastern-brazil-coverage.json');
 assert.equal(base.version,'0.24.0');assert.equal(base.recordCount,2612);assert.equal(base.sharedRecordCount,2539);
 assert.equal(now.version,dataset.version);
 const detailed=read('data/coverage-audit.json').matrix.find((r:any)=>r.region==='Eastern Brazil');
 for(const p of now.periods){
  assert.equal(p.beforeLocalityIds.length,0);assert.ok(p.localityIds.length>0);
  assert.deepEqual(p.localityIds,detailed.periods.find((c:any)=>c.start===p.start).localityIds);
 }
});
test('Brazilian exchange chapters share their evidence and identify linked views',()=>{
 const extra=read('data/eastern-brazil-scenes.json'),trade=topics.find(t=>t.id==='trade')!;
 for(const scene of extra.tradeScenes){
  assert.ok(trade.scenes.some(s=>s.id===scene.id));
  for(const id of scene.recordIds){
   assert.ok(trade.recordIds.includes(id));assert.ok(!topicOnlyIds.has(id));
   assert.equal(historyState(dataset.records.find(r=>r.id===id)!,scene.year),'active');
  }
 }
 const local=dataset.records.find(r=>r.id==='eb-ne-canaa-pottery')!,route=dataset.records.find(r=>r.id==='eb-ne-canaa-graphite-movement')!;
 assert.ok(local.review.relatedIds.includes(route.id)&&route.review.relatedIds.includes(local.id));
 assert.match(route.review.limitations,/same archaeological evidence/);
 assert.equal(route.history?.connection?.cessation,'unknown');
 assert.equal(route.claims[0].status,'under discussion');
});
