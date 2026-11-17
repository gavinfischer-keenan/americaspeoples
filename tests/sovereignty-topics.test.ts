import test from 'node:test';
import assert from 'node:assert/strict';
import {dataset} from '../src/published-data';
import {topics,topicOnlyIds,topicRecords} from '../src/topic-dives';
import {extendedTopicOnlyIds,topicEndYear} from '../src/topic-scope';
import {sharedContextRecords} from '../src/topic-context';
import {historyState} from '../src/history';
import {futureDives} from '../src/deep-dive-backlog';
import audit from '../data/topic-context-audit.json';

const row=(id:string)=>{const r=dataset.records.find(r=>r.id===id);assert.ok(r,'Missing '+id);return r;};
test('three land and sovereignty movies have ordered sourced chapters and live map evidence',()=>{
 for(const id of ['forced-relocations','hawaii-statehood','territorial-purchases']){
  const t=topics.find(t=>t.id===id);assert.ok(t,'Missing '+id);assert.ok(t.scenes.length>=8);
  const rows=topicRecords(t,dataset.records);assert.equal(rows.length,t.recordIds.length);
  let previous=-Infinity;
  for(const s of t.scenes){
   assert.ok(s.year>=previous&&s.year<=topicEndYear(id),s.id);previous=s.year;
   assert.ok(s.body.length>=180&&s.note.length>=55,s.id);
   assert.ok(s.recordIds.every(x=>t.recordIds.includes(x)),s.id);
   assert.ok(rows.some(r=>s.recordIds.includes(r.id)&&historyState(r,s.year)==='active'&&(r.location||r.overlay?.geometry)),s.id+' needs dated mapped evidence');
  }
 }
 assert.equal(topics.length,23);assert.equal(futureDives.length,0);
});
test('later Hawaii evidence is isolated, audited and linked back to earlier human context',()=>{
 const later=dataset.records.filter(r=>(r.time.end??-Infinity)>1934);
 assert.deepEqual(later.map(r=>r.id).sort(),[...extendedTopicOnlyIds].sort());
 for(const r of later){
  assert.ok(topicOnlyIds.has(r.id));assert.ok(audit.records.some(a=>a.recordId===r.id));
  assert.ok(topics.find(t=>t.id==='hawaii-statehood')!.recordIds.includes(r.id));
  assert.ok(sharedContextRecords([r.id],dataset.records).every(x=>!topicOnlyIds.has(x.id)&&(x.time.end??1934)<=1934));
 }
 assert.equal(row('topic-hawaii-statehood-vote-1959').time.eventDate,'1959-06-27');
 assert.equal(row('topic-hawaii-admission-1959').time.eventDate,'1959-08-21');
});
test('purchases preserve signing, transfer and payment as different observations',()=>{
 assert.equal(row('sovereignty-alaska-signing').time.eventDate,'1867-03-30');
 assert.equal(row('sovereignty-alaska-transfer').time.eventDate,'1867-10-18');
 assert.equal(row('sovereignty-alaska-payment').time.eventDate,'1868-08-01');
 assert.ok(row('sovereignty-alaska-signing').location!.lon>-78);
 assert.ok(row('sovereignty-alaska-transfer').location!.lon< -130);
 assert.match(row('sovereignty-alaska-signing').claims[0].text,/Indigenous|Native/);
 assert.equal(row('sovereignty-louisiana-transfer').time.eventDate,'1803-12-20');
 assert.ok(topics.find(t=>t.id==='territorial-purchases')!.recordIds.includes('louisiana-purchase'));
});
test('removal chapters reuse canonical evidence and add different regions without invented routes',()=>{
 const t=topics.find(t=>t.id==='forced-relocations')!;assert.ok(t);
 for(const id of ['community-garifuna-deportation','removal-cherokee-1838-1839','removal-dine-return-1868'])assert.ok(t.recordIds.includes(id));
 for(const id of ['sovereignty-wybalenna','sovereignty-martin-garcia','sovereignty-yaqui-1905','sovereignty-rapanui-1914','sovereignty-napalpi-1924']){
  const r=row(id);assert.ok(t.recordIds.includes(id));assert.ok(!topicOnlyIds.has(id));
  assert.ok(r.location?.precision&&r.sources.length&&r.claims[0].support[0].locator);
  for(const other of r.review.relatedIds)assert.ok(row(other).review.relatedIds.includes(id),id+' reciprocal '+other);
 }
 assert.equal(row('sovereignty-napalpi-1924').overlay?.kind,'violence');
 assert.match(row('sovereignty-carlisle-1879').claims[0].text,/children|families/);
});
test('Australia and Aotearoa additions show institutions and coercion on their own dates',()=>{
 for(const [id,start] of [['sovereignty-cootamundra',1912],['sovereignty-kinchela',1924],['sovereignty-palm-island',1918],['sovereignty-parihaka-prisoners',1880],['sovereignty-parihaka-invasion',1881]] as const){
  const r=row(id);assert.equal(r.time.start,start);assert.ok(!topicOnlyIds.has(id));
  assert.ok(topics.find(t=>t.id==='forced-relocations')!.recordIds.includes(id));
 }
 assert.match(row('sovereignty-kinchela').time.interpretation,/1934.*not.*clos/i);
 assert.equal(row('sovereignty-parihaka-invasion').time.eventDate,'1881-11-05');
 assert.equal(row('sovereignty-parihaka-prisoners').overlay?.geometry?.type,'LineString');
});
