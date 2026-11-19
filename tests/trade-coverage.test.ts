import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dataset} from '../src/published-data';
import {topicOnlyIds,topics} from '../src/topic-dives';
import {historyState} from '../src/history';
import {activeRecords} from '../src/time';

test('Lake Huron source review enriches one finding and one chapter without duplicating the flakes',()=>{
 const finds=dataset.records.filter(r=>r.sources.some(s=>s.doi==='10.1371/journal.pone.0250840'));
 assert.equal(finds.length,1,'the same DA-1 flakes must not become a second evidence record');
 const r=finds[0];assert.equal(r.id,'r5-huron-obsidian');
 assert.equal(r.overlay?.geometry?.type,'LineString');
 assert.deepEqual([r.location?.lon,r.location?.lat],[-82.5,44.9],'the canonical place remains the Lake Huron find context');
 assert.deepEqual([r.time.start,r.time.end],[-7050,-6850]);
 assert.equal(r.history?.kind,'exchange');
 assert.match(r.review.limitations,/path|direct procurement/i);
 const chapters=topics.find(t=>t.id==='trade')!.scenes.filter(s=>s.recordIds.includes(r.id));
 assert.equal(chapters.length,1);assert.equal(chapters[0].id,'trade-huron');
 assert.equal(historyState(r,chapters[0].year),'active');
});

test('new exchange links use supported activity windows and remain on the master map',()=>{
 const {records}=JSON.parse(readFileSync('data/trade-0-1200-expansion-records.json','utf8'));
 const trade=topics.find(topic=>topic.id==='trade')!;
 assert.ok(records.length>0);
 for(const r of records){
  assert.deepEqual(dataset.records.find(existing=>existing.id===r.id),r);
  assert.ok(!topicOnlyIds.has(r.id));assert.equal(r.history.kind,'exchange');
  assert.ok(trade.recordIds.includes(r.id),`${r.id} is reachable from the trade topic`);
  assert.equal(r.overlay.geometry.type,'LineString');assert.ok(r.overlay.geometry.coordinates.length>=2);
  assert.ok(r.history.windows.some((w:any)=>w.start<=1200&&w.end>=0));
  assert.ok(r.history.connection?.note&&r.history.connection.evidence);
  for(const w of r.history.windows){
   assert.equal(historyState(r,Math.round((w.start+w.end)/2)),'active');
  }
  const windows=[...r.history.windows].sort((a:any,b:any)=>a.start-b.start);
  for(let i=1;i<windows.length;i++){
   const year=windows[i-1].end+1;
   if(year<windows[i].start&&!windows.some((w:any)=>w.start<=year&&w.end>=year)){
    assert.equal(historyState(r,year),'outside',`${r.id} must not bridge an unsupported gap`);
    assert.deepEqual(activeRecords([r],year),[],`${r.id} evidence-index filter must respect the same gap`);
   }
  }
  assert.equal(historyState(r,r.time.start-1),'outside');
  assert.equal(historyState(r,r.time.end+1),'outside');
 }
});

test('expanded trade chapters use active connections and preserve the older topic chronology',()=>{
 const expanded=JSON.parse(readFileSync('data/trade-0-1200-scenes.json','utf8'));
 assert.ok(expanded.scenes.length>0);
 const trade=topics.find(topic=>topic.id==='trade')!;
 assert.ok(trade.scenes.some(scene=>scene.id==='trade-huron'));
 assert.ok(trade.scenes.some(scene=>scene.id==='trade-silver'));
 assert.deepEqual(trade.scenes.map(scene=>scene.year),trade.scenes.map(scene=>scene.year).sort((a,b)=>a-b));
 for(const scene of expanded.scenes){
  assert.ok(trade.scenes.some(s=>s.id===scene.id));
  for(const id of scene.recordIds){
   const record=dataset.records.find(r=>r.id===id);assert.ok(record,`${scene.id}/${id}`);
   assert.ok(trade.recordIds.includes(id));
   assert.equal(historyState(record,scene.year),'active',`${scene.id}/${id} must be active in its chapter`);
  }
 }
});

test('trade audit excludes founding migrations and preserves the original route inventory',()=>{
 const before=JSON.parse(readFileSync('data/trade-0-1200-baseline.json','utf8'));
 assert.equal(before.version,'0.23.1');assert.equal(before.mappedExchangeIds.length,7);
 assert.ok(!before.mappedExchangeIds.includes('history-west-east-polynesia-migration'));
 const after=JSON.parse(readFileSync('data/trade-coverage-audit.json','utf8'));
 assert.equal(after.version,dataset.version);assert.ok(after.mappedExchangeIds.length>before.mappedExchangeIds.length);
 for(const id of after.mappedExchangeIds){
  const r=dataset.records.find(r=>r.id===id);assert.ok(r&&r.history?.kind!=='migration');
 }
 const pendant=after.pointOrUnmappedClaims.find((c:any)=>c.recordId==='eb-ne-boca-do-rio'&&c.claimId==='greenstone');
 assert.ok(pendant);assert.equal(pendant.dateBasis,'associated context');
 assert.equal(pendant.contextDate.start,889);assert.equal(pendant.contextDate.end,1015);
 assert.match(pendant.explanation,/no direct calendar date/);
 assert.equal(after.pointOrUnmappedIds.filter((id:string)=>id==='eb-ne-boca-do-rio').length,1);
 for(const id of ['eb-ne-cabeludo','eb-ne-caboclo','eb-ne-armindio','eb-ne-encantado'])assert.ok(!after.pointOrUnmappedIds.includes(id));
});
