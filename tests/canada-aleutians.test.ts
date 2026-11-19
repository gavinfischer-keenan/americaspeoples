import {canadaAleutianStories} from '../src/canada-aleutian-stories';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {dataset} from '../src/published-data';
import {stories} from '../src/stories';
import {siteGuides} from '../src/site-guides';
import {topicOnlyIds} from '../src/topic-dives';

test('Canada regional histories and the Aleutians are connected guides in the shared atlas',()=>{
  for(const id of ['canada','canada-pacific','canada-prairies','canada-northwest','canada-arctic','canada-great-lakes','canada-st-lawrence','canada-atlantic','aleutian-islands']){
    const guide=siteGuides.find(g=>g.id===id);assert.ok(guide,id);
    const story=stories.find(s=>s.id===guide.storyId);assert.ok(story,id+' needs a contextual movie');
    const archive=canadaAleutianStories.find(s=>s.id===guide.storyId)!;
  assert.ok(archive.scenes.length>=6,id);
  assert.deepEqual(story.scenes,archive.scenes.filter(s=>s.year<=1900));
    for(const scene of story.scenes){assert.ok(scene.year<=1900);for(const rid of scene.recordIds){assert.ok(dataset.records.some(r=>r.id===rid),rid);assert.ok(!topicOnlyIds.has(rid),rid+' must be shared');}}
    if(id.startsWith('canada-'))assert.equal(guide.parentGuideId,'canada');
  }
});

test('Aleutian archaeology preserves dated samples and settlement moves without filling the intervening gaps',async()=>{
  const raw=await readFile('data/aleutian-expansion-records.json','utf8').catch(()=>null);assert.ok(raw);
  const records=JSON.parse(raw).records;
  const byId=(id:string)=>records.find((r:any)=>r.id===id);
  const quarry=dataset.records.find(r=>r.id==='r10v-amaknak-quarry-unl469');assert.ok(quarry);
  assert.equal(quarry.time.start,1950-7730);assert.equal(quarry.time.end,1950-7580);
  assert.match(quarry.time.original,/7730.*7580/);
  assert.ok(!byId('al-korovinski-colonial').history?.continuity);
  assert.equal(byId('al-sanak-relocation-1823').time.start,1823);
  assert.equal(byId('al-sanak-post-1873').time.start,1873);
  assert.equal(byId('al-unalaska-church-1826').time.start,1826);
  assert.ok(records.every((r:any)=>!topicOnlyIds.has(r.id)));
  assert.ok(records.every((r:any)=>r.time.start!==0&&r.time.end!==0));
});

test('Amaknak revisions reuse the existing identities and group house samples at one place',()=>{
 const find=(id:string)=>dataset.records.find(r=>r.id===id)!;
 assert.ok(!find('al-amaknak-quarry-hearth'));
 assert.ok(!find('al-amaknak-stone-houses'));
 assert.deepEqual(find('r10v-amaknak-quarry-unl469').location,find('al-amaknak-quarry-later').location);
 const bridge=find('r10v-amaknak-bridge-architecture');
 assert.equal(bridge.time.start,1950-3922);assert.equal(bridge.time.end,1950-2358);
 for(const id of ['r12v-amaknak-s2-floor','r12v-amaknak-s5-floor','r12v-amaknak-s7-main-room','r12v-amaknak-s3-hearth']){
  assert.deepEqual(find(id).location,bridge.location);
  const guide=siteGuides.find(g=>g.id==='aleutian-islands')!;
  assert.ok([...guide.recordIds,...guide.referenceRecordIds??[]].includes(id));
 }
});

test('the Canadian guide reuses the earlier Quadra garden construction record',()=>{
 assert.ok(!dataset.records.some(r=>r.id==='canada-quadra-clam-gardens'));
 const record=dataset.records.find(r=>r.id==='gap-quadra-clam-gardens')!;
 assert.equal(record.time.start,-1550);
 assert.ok(record.sources.some(s=>s.url==='https://doi.org/10.3389/feart.2022.988111'));
 const guide=siteGuides.find(g=>g.id==='canada-pacific')!;
 assert.ok([...guide.recordIds,...guide.referenceRecordIds??[]].includes(record.id));
});

test('existing evidence refinements retain complete before/after records and increment revisions',async()=>{
 const corrections=JSON.parse(await readFile('data/canada-aleutians-corrections.json','utf8'));
 const local=JSON.parse(await readFile('data/shield-aleutian-local-corrections.json','utf8'));
 assert.equal(corrections.updates.length,8);
 for(const change of corrections.updates){
  assert.equal(change.beforeRecord.id,change.targetId);
  assert.equal(change.record.id,change.targetId);
  assert.ok(change.record.revision>change.beforeRecord.revision);
  assert.ok(change.reason);
  const next=local.updates.find((u:any)=>u.targetId===change.targetId);
  if(next)assert.deepEqual(next.beforeRecord,change.record,'later refinements retain the full prior revision');
  assert.deepEqual(dataset.records.find(r=>r.id===change.targetId),next?.record??change.record);
 }
});
