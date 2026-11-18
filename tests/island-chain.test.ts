import test from 'node:test';
import assert from 'node:assert/strict';
import {dataset} from '../src/published-data';
import {topicOnlyIds,topics} from '../src/topic-dives';
import {siteGuides} from '../src/site-guides';
import {stories} from '../src/stories';

test('island communities and documented rai voyages enter shared history; thematic explanations stay in their topic',()=>{
 for(const id of ['island-niah-early','island-kota-batu-centre','island-butuan-boat1','island-dili-1769','island-waim-crafts','ym-ulong-early','ym-cheyne-stone-gift-1843','ym-swan-cargo-1884']){
  assert.ok(dataset.records.find(r=>r.id===id),id);assert.ok(!topicOnlyIds.has(id),id);
 }
 for(const id of ['topic-rai-making','topic-rai-boats','topic-rai-obligations'])assert.ok(topicOnlyIds.has(id));
 const topic=topics.find(t=>t.id==='rai-stone-money')!;assert.equal(topic.scenes.length,12);
 assert.ok(topic.recordIds.includes('ym-cheyne-stone-gift-1843'));
 for(const id of ['borneo-brunei','cebu-philippines','timor','new-guinea-islands','micronesian-island-networks']){
  const guide=siteGuides.find(g=>g.id===id)!;assert.ok(guide);
  const story=stories.find(s=>s.id===guide.storyId)!;assert.ok(story);
  for(const scene of story.scenes)for(const rid of scene.recordIds){assert.ok(dataset.records.some(r=>r.id===rid),rid);assert.ok(!topicOnlyIds.has(rid),rid);}
 }
});

test('new research enriches the existing Mactan event and separates early Palauan activity from rai quarry dates',()=>{
 assert.ok(!dataset.records.some(r=>r.id==='island-mactan-1521'));
 const m=dataset.records.find(r=>r.id==='visit-magellan-elcano-1519-1522-8')!;
 assert.match(m.review.summary,/Lapulapu/);assert.equal(m.time.eventDate,'1521-04-27');
 const quarry=dataset.records.find(r=>r.id==='ym-metuker-quarry-onset')!;
 assert.equal(quarry.time.start,1700);assert.equal(quarry.time.end,1750);
 const old=dataset.records.find(r=>r.id==='ym-orrak-cemetery')!;
 assert.ok(old.time.start!<0);assert.match(old.review.summary,/burial/);
 for(const id of ['ym-orrak-quarry','ym-uet-inland-quarry'])assert.equal(dataset.records.find(r=>r.id===id)!.time.kind,'unplaced');
 assert.equal(dataset.records.find(r=>r.id==='island-butuan-boat1')!.time.start,777);
});
