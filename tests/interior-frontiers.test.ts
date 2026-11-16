import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dataset} from '../src/published-data';
import {topicOnlyIds} from '../src/topic-dives';
import {recordsForView} from '../src/atlas-view';
import {historyState,historyLabel} from '../src/history';
import {temporalState} from '../src/time';
import baseline from '../data/interior-frontier-baseline.json';
import expansion from '../data/interior-frontier-expansion-records.json';

const get=(id:string)=>{const r=dataset.records.find(x=>x.id===id);assert.ok(r,`shared record ${id} must be published`);return r;};

test('interior settlement and conflict evidence enters the shared master movie',()=>{
 for(const id of ['interior-barcelos-labor','interior-san-fernando-1750','interior-cuyuni-1758']){
  const r=get(id);assert.equal(topicOnlyIds.has(id),false);
  assert.ok(recordsForView(dataset.records,'movie',r.time.start!).dated.some(x=>x.id===id));
 }
 const conflict=get('interior-cuyuni-1758');
 assert.equal(conflict.overlay?.kind,'conflict');
 assert.equal(temporalState(conflict.time,1757),'absent');
 assert.equal(temporalState(conflict.time,1759),'absent');
 assert.equal(conflict.history,undefined,'a fight must not persist as an established settlement');
});

test('a dated supply shipment does not invent continuous trade or its cessation',()=>{
 const r=get('interior-barcelos-borba-1758');
 assert.equal(r.history?.kind,'exchange');
 assert.ok(r.location&&r.destination);
 assert.equal(r.overlay?.geometry?.type,'LineString');
 assert.equal(historyState(r,1757),'outside');
 assert.equal(historyState(r,1758),'active');
 assert.equal(historyState(r,1759),'outside');
 assert.equal(r.history?.connection?.cessation,'unknown');
 assert.equal(r.history?.connection?.lastEvidence,1758);
 assert.deepEqual(r.location,get('interior-barcelos-labor').location);
});

test('interior records preserve canonical places, reciprocal context and source-window limits',()=>{
 const ids=new Set(expansion.records.map(r=>r.id));
 const rows=dataset.records.filter(r=>ids.has(r.id));
 assert.ok(rows.length>=30,'substantial settlements, exchange and conflict coverage across three regions');
 assert.ok(rows.filter(r=>r.history?.kind==='exchange').length>=5,'map connections, not just prose mentioning trade');
 for(const r of rows){
  assert.ok(r.time.start!==null&&r.time.end!==null&&r.time.end<=1934,r.id);
  assert.ok(r.location?.precision&&r.location?.provenance,r.id);
  for(const p of [r.location,r.destination].filter(Boolean)){
   for(const other of dataset.records)for(const q of [other.location,other.destination])if(q?.id===p!.id)assert.deepEqual(q,p,r.id+' canonical place');
  }
  for(const c of r.claims)assert.ok(c.support.some(s=>s.stance==='supports'&&r.sources.some(x=>x.id===s.sourceId)),r.id);
  for(const id of r.review.relatedIds)assert.ok(get(id).review.relatedIds.includes(r.id),`${r.id} -> ${id}`);
  if(r.history?.kind==='exchange'){
   assert.ok(r.history.windows?.length,r.id);
   for(const w of r.history.windows!)assert.ok(w.start>=r.time.start!&&w.end<=r.time.end!,r.id);
  }
 }
});

test('pre-expansion snapshots remain distinct and immutable in meaning',()=>{
 assert.equal(baseline.recordCount,2003);assert.equal(baseline.sharedRecordCount,1945);
 const prior=JSON.parse(readFileSync('data/regional-gap-baseline.json','utf8'));
 assert.equal(prior.recordCount,1960);assert.equal(prior.sharedRecordCount,1902);
 assert.ok(Array.isArray(JSON.parse(readFileSync('data/world-coverage-baseline.json','utf8'))));
});

test('present lower-Lawa Cottica uses its 1861 attestation, not an ambiguous early namesake',()=>{
 const r=get('interior-cottica-early');
 assert.equal(r.time.start,1861);
 assert.equal(r.time.end,1861);
 assert.equal(r.history?.kind,'attestation');
 assert.equal(historyState(r,1815),'outside');
 assert.doesNotMatch(historyLabel(r,1815),/Established by/);
 assert.equal(historyState(r,1861),'active');
 assert.equal(historyState(r,1900),'past-place');
 assert.match(r.review.discussion,/Anapa[iï]k[eé]/);
});

test('Maripaston imports show only the evidenced inward goods flow',()=>{
 const r=get('interior-maripaston-paramaribo-1905');
 assert.deepEqual(r.location,get('settlement-paramaribo').location);
 assert.deepEqual(r.destination,get('interior-maripaston-1905').location);
 assert.equal(r.overlay?.direction,'forward');
 assert.deepEqual(r.overlay?.geometry?.coordinates,[[r.location!.lon,r.location!.lat],[r.destination!.lon,r.destination!.lat]]);
 assert.equal(historyState(r,1905),'active');
 assert.equal(historyState(r,1906),'outside');
 assert.equal(r.history?.connection?.cessation,'unknown');
});
