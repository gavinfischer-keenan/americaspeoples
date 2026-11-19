import {shieldAleutianLocalStories} from '../src/shield-aleutian-local-stories';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {dataset} from '../src/published-data';
import {siteGuides,guideForRecord} from '../src/site-guides';
import {stories} from '../src/stories';
import {topicOnlyIds} from '../src/topic-dives';
import type {EvidenceRecord} from '../src/model';

test('inland Shield and local Aleutian guides keep regional parents and active shared-world scenes',()=>{
 for(const [id,parent] of [['canada-shield','canada'],['amaknak-bridge','aleutian-islands'],['unalaska-village','aleutian-islands'],['chaluka-nikolski','aleutian-islands']]){
  const guide=siteGuides.find(g=>g.id===id);assert.ok(guide,`Missing ${id} guide`);
  assert.equal(guide.parentGuideId,parent);
  const story=stories.find(s=>s.id===guide.storyId);assert.ok(story,`${id} needs a contextual movie`);
  const archive=shieldAleutianLocalStories.find(s=>s.id===guide.storyId)!;
  assert.ok(archive.scenes.length>=5);
  assert.deepEqual(story.scenes,archive.scenes.filter(s=>s.year<=1900));
  for(const scene of story.scenes){
   assert.ok(scene.year<=1900);
   const records=scene.recordIds.map(id=>dataset.records.find(r=>r.id===id));
   assert.ok(records.every(Boolean));
   assert.ok(records.every(r=>!topicOnlyIds.has(r!.id)));
   assert.ok(records.some(r=>r!.location&&r!.time.start!==null&&r!.time.end!==null&&r!.time.start<=scene.year&&r!.time.end>=scene.year),`${id}/${scene.id} has no active local evidence`);
  }
 }
});

test('existing Amaknak house finds open the new local study rather than losing their guide link',()=>{
 for(const id of ['r10v-amaknak-bridge-architecture','r12v-amaknak-s2-floor','r12v-amaknak-s7-main-room']){
  assert.equal(guideForRecord(id)?.id,'amaknak-bridge',id);
 }
});

test('new inland and village observations publish on the master map with human-readable places',async()=>{
 const raw=await readFile('data/shield-aleutian-local-records.json','utf8').catch(()=>null);assert.ok(raw,'Missing new observations');
 const {records}=JSON.parse(raw) as {records:EvidenceRecord[]};assert.ok(records.length>0);
 for(const r of records){
  assert.deepEqual(dataset.records.find(value=>value.id===r.id),r);
  assert.ok(guideForRecord(r.id),`${r.id} needs a guide link when opened from the master map`);
  assert.ok(!topicOnlyIds.has(r.id));assert.ok(r.sources.length);assert.ok(r.claims.length);
  for(const place of [r.location,r.destination].filter(Boolean)){
   assert.doesNotMatch(place!.name,/display anchor|public locality reference|regional reference|modelled coordinate/i);
   assert.ok(place!.precision);assert.ok(place!.provenance);
  }
 }
});

test('local refinements preserve prior observations through versioned before-and-after corrections',async()=>{
 const raw=await readFile('data/shield-aleutian-local-corrections.json','utf8').catch(()=>null);assert.ok(raw,'Missing local correction history');
 const corrections=JSON.parse(raw);assert.ok(corrections.updates.length>0);
 for(const change of corrections.updates){
  assert.equal(change.beforeRecord.id,change.targetId);assert.equal(change.record.id,change.targetId);
  assert.ok(change.record.revision>change.beforeRecord.revision);assert.ok(change.reason);
  assert.deepEqual(dataset.records.find(r=>r.id===change.targetId),change.record);
 }
});
