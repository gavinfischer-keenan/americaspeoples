import {remainingTopics} from '../src/remaining-topic-dives';
import test from 'node:test';
import assert from 'node:assert/strict';
import {dataset} from '../src/published-data';
import {topics,topicOnlyIds,topicRecords} from '../src/topic-dives';
import {futureDives,topicConnections} from '../src/deep-dive-backlog';
import {historyState} from '../src/history';
import {sharedContextRecords,futureDivesHTML} from '../src/topic-context';
import audit from '../data/topic-context-audit.json';
const ids=['pacific-fur-trades','whaling','spanish-treasure','missionaries','pottery','obsidian','copper'];
test('all requested movies are playable with sourced chronological chapters and live evidence',()=>{
 for(const id of ids){
  const t=topics.find(t=>t.id===id);assert.ok(t,'Missing '+id);const archive=remainingTopics.find(entry=>entry.id===id)!;
  assert.ok(archive.scenes.length>=6);
  assert.deepEqual(t.scenes,archive.scenes.filter(scene=>scene.year<=1900));
  const rows=topicRecords(t,dataset.records);const expected=t.recordIds.filter(recordId=>{
   const row=dataset.records.find(r=>r.id===recordId);assert.ok(row,recordId);
   return row.time.start===null||row.time.start<=1900;
  });
  assert.deepEqual(rows.map(row=>row.id).sort(),expected.sort());
  let before=-Infinity;
  for(const s of t.scenes){assert.ok(s.year>=before&&s.year<=1900,s.id);before=s.year;assert.ok(s.body.length>=180&&s.note.length>=55,s.id);assert.ok(s.recordIds.every(x=>t.recordIds.includes(x)));assert.ok(rows.some(r=>s.recordIds.includes(r.id)&&historyState(r,s.year)==='active'&&(r.location||r.overlay?.geometry)),s.id+' mapped current evidence');}
  assert.ok(topicConnections[id]?.length);
 }
 assert.equal(topics.length,28);assert.equal(futureDives.length,0);assert.doesNotMatch(futureDivesHTML(),/NOT YET PLAYABLE|data-future-topic/);
});
test('new objects stay focused while built places, encounters and wrecks join shared history',()=>{
 for(const id of ['context-fur-kodiak-1784','context-fur-sitka-1804','context-fur-ross-1812','context-whaling-fortune-1853','context-whaling-arctic-1871','context-treasure-potosi-1545','context-treasure-zacatecas-1546','context-treasure-atocha-1622','context-mission-piratininga-1554','context-mission-trinidad-1706','context-mission-rangihoua-1814','context-pottery-taperinha']){assert.ok(dataset.records.some(r=>r.id===id),'Missing '+id);assert.ok(!topicOnlyIds.has(id));}
 for(const id of ['topic-pottery-taperinha','topic-pottery-monagrillo','topic-copper-greatlakes-peak','topic-copper-bordo-marcial','topic-copper-sican','topic-copper-west-mexico']){assert.ok(topicOnlyIds.has(id),id);assert.ok(audit.records.some(a=>a.recordId===id));assert.ok(sharedContextRecords([id],dataset.records).length,id+' shared context');}
 const fort=dataset.records.find(r=>r.id==='context-treasure-san-diego-1615')!;assert.equal(fort.time.start,1615);assert.match(fort.claims[0].text,/labor|repartimiento/);
 const wreck=dataset.records.find(r=>r.id==='context-treasure-atocha-1622')!;assert.equal(historyState(wreck,1800),'loss');
 const mask=dataset.records.find(r=>r.id==='topic-copper-bordo-marcial')!;assert.deepEqual([mask.time.start,mask.time.end],[-1376,-1009]);assert.match(mask.time.method,/associated|burial/i);
 const mexico=dataset.records.find(r=>r.id==='topic-copper-west-mexico')!;assert.equal(mexico.time.start,800);assert.match(mexico.review.limitations,/CE|BCE/);
});
