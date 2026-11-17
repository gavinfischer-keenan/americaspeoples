import test from 'node:test';
import assert from 'node:assert/strict';
import {dataset} from '../src/published-data';
import {deepDives} from '../src/deep-dives';
import {topics,topicOnlyIds} from '../src/topic-dives';
import {stories} from '../src/stories';
import {siteGuides} from '../src/site-guides';
import {historyState} from '../src/history';
import {recordsForView} from '../src/atlas-view';
import {languageLineagesHTML} from '../src/language-lineages';
import content from '../data/site-guide-content.json';

const places=['chavin','tiwanaku','chan-chan','teotihuacan','monte-alban','calakmul','copan','paquime'];
const cultures=['wari','moche'];
const languages=['andean-languages','iroquoian-languages','maya-languages'];
const byId=new Map(dataset.records.map(r=>[r.id,r]));
test('first thirteen planned studies become usable in their correct lists',()=>{
 for(const [category,ids] of [['places',places],['cultures',cultures],['languages',languages]] as const){
  for(const id of ids){
   const href=category==='languages'?'#topic/'+id:'sites/'+id+'.html';
   const card=deepDives.find(d=>d.links.some(l=>l.href===href));
   assert.ok(card,href);assert.equal(card.category,category);
   assert.equal(deepDives.some(d=>d.id===id&&!d.links.length),false,id+' still planned');
  }
 }
 assert.equal(deepDives.filter(d=>!d.links.length).length,12);
});
test('ten new place and culture studies have substantive chapters with current shared evidence',()=>{
 for(const id of [...places,...cultures]){
  const guide=siteGuides.find(g=>g.id===id);assert.ok(guide,id);
  const story=stories.find(s=>s.id===guide.storyId);assert.ok(story,id);
  assert.ok(story.scenes.length>=5,id+' chapters');
  for(const scene of story.scenes){
   assert.ok(scene.body.length>180,scene.title+' detail');
   assert.ok(scene.recordIds.some(id=>{const r=byId.get(id);return r&&!topicOnlyIds.has(id)&&historyState(r,scene.year)==='active';}),scene.title+' current evidence');
  }
  const page=content.pages.find(p=>p.id===id);assert.ok(page,id+' guide');
  assert.ok(page.sections.length>=4,id+' guide sections');
  assert.ok(page.sources.length>=2,id+' original sources');
 }
});
test('three language studies retain independent evidence and filtered family diagrams',()=>{
 for(const id of languages){
  const topic=topics.find(t=>t.id===id);assert.ok(topic,id);
  assert.ok(topic.scenes.length>=5,id+' chapters');
  assert.ok(topic.recordIds.some(id=>topicOnlyIds.has(id)),id+' focused evidence');
  for(const scene of topic.scenes){assert.ok(scene.body.length>180);assert.ok(scene.recordIds.every(id=>byId.has(id)),scene.title);}
 }
});
test('family-specific diagrams omit unrelated roots while the overview retains them',()=>{
 // A family-specific view must not imply that unrelated roots belong to this dive.
 const html=languageLineagesHTML(['quec1387','ayma1253']);
 assert.match(html,/Quechuan/);assert.match(html,/Aymaran/);
 assert.doesNotMatch(html,/<summary>Indo-European<\/summary>/);
 assert.match(languageLineagesHTML(),/<summary>Indo-European<\/summary>/);
});
test('new local observations feed the master and retain source/date/geography contracts',()=>{
 const incoming=dataset.records.filter(r=>r.id.startsWith('d18-'));
 assert.ok(incoming.length>=35,'substantive new local observations');
 const shared=incoming.filter(r=>!topicOnlyIds.has(r.id));assert.ok(shared.length>=30);
 for(const r of incoming){
  assert.ok(r.sources.length&&r.claims.length,r.id);
  for(const id of r.review.relatedIds)assert.ok(byId.get(id)?.review.relatedIds.includes(r.id),r.id+' reciprocal '+id);
  if(!topicOnlyIds.has(r.id)&&r.time.start!==null)assert.ok(recordsForView(dataset.records,'movie',r.time.start).dated.some(x=>x.id===r.id),r.id+' master');
 }
});
