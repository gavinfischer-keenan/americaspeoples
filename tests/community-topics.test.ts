import test from 'node:test';
import assert from 'node:assert/strict';
import {dataset} from '../src/published-data';
import {topics,topicOnlyIds,topicRecords} from '../src/topic-dives';
import {historyState} from '../src/history';
import {sharedContextRecords} from '../src/topic-context';
import audit from '../data/topic-context-audit.json';

const ids=['haudenosaunee','amazonian-peoples','caribbean-enslavement'];
const row=(id:string)=>{const r=dataset.records.find(r=>r.id===id);assert.ok(r,'Missing '+id);return r;};

test('three community movies have ordered, currently supported mapped evidence in every chapter',()=>{
 for(const id of ids){
  const topic=topics.find(t=>t.id===id);assert.ok(topic,'Missing '+id);assert.ok(topic.scenes.length>=7);
  const rows=topicRecords(topic,dataset.records);assert.equal(rows.length,topic.recordIds.length);
  let year=-Infinity;
  for(const scene of topic.scenes){
   assert.ok(scene.year>=year&&scene.year<=1934,scene.id);year=scene.year;
   assert.ok(scene.recordIds.every(id=>topic.recordIds.includes(id)),scene.id);
   assert.ok(rows.some(r=>scene.recordIds.includes(r.id)&&historyState(r,scene.year)==='active'&&(r.location||r.overlay?.geometry)),scene.id+' needs current mapped evidence');
   assert.ok(scene.body.length>=180&&scene.note.length>=55,scene.id+' needs useful context');
  }
 }
});

test('Mohawk village estimates retain model probability and are not a Confederacy foundation date',()=>{
 const r=row('community-smith-pagerie');
 assert.deepEqual([r.time.start,r.time.end],[1478,1498]);
 assert.match(r.time.method,/68\.3/);assert.equal(historyState(r,1450),'outside');
 assert.equal(historyState(r,1500),'past-place');
 assert.equal(row('topic-haudenosaunee-lacrosse-meaning').time.kind,'unplaced');
 assert.equal(topicOnlyIds.has(r.id),false);
});

test('Amazon sites preserve distinct dated deposits and regional phase uncertainty',()=>{
 const sm=row('community-isla-tesoro-early');assert.deepEqual([sm.time.start,sm.time.end],[-8780,-8528]);
 const cotoca=row('community-cotoca');assert.deepEqual([cotoca.time.start,cotoca.time.end],[500,1400]);
 assert.match(cotoca.time.interpretation,/regional|phase/i);assert.match(cotoca.location!.provenance,/185/);
 assert.equal(cotoca.history?.kind,'attestation');assert.equal(historyState(cotoca,1401),'past-place');
 assert.equal(row('community-putumayo-violence').overlay?.kind,'violence');
});

test('coercive routes and emancipation events keep their different clocks and actors',()=>{
 const route=row('community-garifuna-deportation');assert.equal(route.overlay?.kind,'forced-removal');
 assert.deepEqual([route.time.start,route.time.end],[1797,1797]);
 assert.equal(historyState(route,1798),'outside');
 assert.equal(row('community-jamaica-1834').time.start,1834);
 assert.equal(row('community-jamaica-1838').time.start,1838);
 assert.match(row('community-jamaica-1834').claims[0].text,/apprentice/i);
 assert.equal(row('community-cuba-1886').time.start,1886);
 assert.match(row('community-chenussio-1779').claims[0].text,/Sullivan|American/i);
});

test('new shared places remain globally eligible and related records resolve reciprocally',()=>{
 for(const id of ['community-ganondagan','community-grand-river','community-cotoca','community-landivar','community-haiti-independence','community-putumayo-violence']){
  const r=row(id);assert.ok(!topicOnlyIds.has(id));assert.ok(sharedContextRecords([id],dataset.records).some(x=>x.id===id));
  for(const related of r.review.relatedIds)assert.ok(row(related).review.relatedIds.includes(id),id+' ↔ '+related);
 }
 const subject=row('topic-haudenosaunee-lacrosse-meaning');assert.ok(topicOnlyIds.has(subject.id));
 assert.ok(audit.records.some(a=>a.recordId===subject.id&&a.decision.length>30));
});
