import test from 'node:test';
import assert from 'node:assert/strict';
import {dataset} from '../src/published-data';
import {topics,topicOnlyIds,topicRecords} from '../src/topic-dives';
import {historyState} from '../src/history';
const record=(id:string)=>{const r=dataset.records.find(r=>r.id===id);assert.ok(r,'Missing '+id);return r;};

test('Pacific topic chapters resolve to mapped evidence without exposing subject finds globally',()=>{
 for(const id of ['sweet-potatoes','boats','dogs']){
  const t=topics.find(t=>t.id===id);assert.ok(t,'Missing topic '+id);
  const rows=topicRecords(t,dataset.records);assert.ok(rows.length>=5);
  assert.equal(rows.length,t.recordIds.length);
  for(const s of t.scenes)assert.ok(rows.some(r=>s.recordIds.includes(r.id)&&historyState(r,s.year)!=='outside'&&(r.location||r.overlay?.geometry)),s.id);
 }
 assert.ok(topicOnlyIds.has('topic-sweet-mangaia'));
 assert.ok(topicOnlyIds.has('topic-dog-wairau'));
 assert.ok(!topicOnlyIds.has('context-wairau-bar'));
 assert.ok(!topicOnlyIds.has('r6-rapanui-admixture'));
});

test('Mangaia crop evidence uses the revised context, and earlier human contact stays a different claim',()=>{
 const crop=record('topic-sweet-mangaia');
 assert.equal(historyState(crop,1100),'outside');
 assert.equal(historyState(crop,1400),'active');
 assert.equal(historyState(crop,1500),'past-place');
 assert.deepEqual([crop.time.start,crop.time.end],[1361,1466]);
 assert.match(crop.time.method,/coral|context/i);
 assert.ok(crop.review.relatedIds.includes('r6-tangatatau-coral'));
 assert.equal(historyState(record('r6-rapanui-admixture'),1300),'active');
});

test('dog specimen dates do not become earlier lineage dates or settlement foundations',()=>{
 const dog=record('topic-dog-alaska');
 assert.equal(historyState(dog,-14000),'outside');
 assert.equal(historyState(dog,-8200),'active');
 assert.equal(dog.history?.kind,'attestation');
 const dingo=record('topic-dog-madura');
 assert.deepEqual([dingo.time.start,dingo.time.end],[-1398,-1131]);
 assert.equal(historyState(dingo,-2000),'outside');
});

test('new human context and canonical topic links resolve in both directions',()=>{
 for(const [topic,context] of [['topic-dog-wairau','context-wairau-bar'],['topic-sweet-triangle-flat','context-triangle-flat'],['topic-horse-isabela','settlement-la-isabela'],['topic-maize-balsas','r12v-xihuatoxtla-layer-d'],['topic-language-mutsun','mission-san-juan-bautista'],['topic-trade-balsa','context-ruiz-merchants']]){
  assert.ok(record(topic).review.relatedIds.includes(context),topic);
  assert.ok(record(context).review.relatedIds.includes(topic),context);
  assert.ok(!topicOnlyIds.has(context));
 }
});

test('Kohala uses the primary publication’s specimen window rather than a later retelling',()=>{
 const r=record('topic-sweet-kohala');
 assert.equal(historyState(r,1295),'active');
 assert.equal(historyState(r,1425),'active');
 assert.equal(historyState(r,1431),'past-place');
 assert.equal(r.claims[0].status,'under discussion');
});

test('Hawaiian dog observations connect to independently attested human provisioning',()=>{
 const dog=record('topic-dog-hawaii'),context=record('context-hawaii-provisioning-1779');
 assert.ok(dog.review.relatedIds.includes(context.id));
 assert.ok(context.review.relatedIds.includes(dog.id));
 assert.equal(historyState(context,1778),'outside');
 assert.equal(historyState(context,1779),'active');
 assert.equal(historyState(context,1780),'past-place');
 assert.ok(!topicOnlyIds.has(context.id));
 assert.match(context.claims[0].text,/provision|suppl/i);
});
