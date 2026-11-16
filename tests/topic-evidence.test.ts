import test from 'node:test';
import assert from 'node:assert/strict';
import {dataset} from '../src/published-data';
import {topics,topicOnlyIds,topicRecords} from '../src/topic-dives';
import {languageFamilies,languageLineagesHTML} from '../src/language-lineages';
import {stories} from '../src/stories';
import {storyDetailsHTML} from '../src/story-details';
import {historyState,historyLabel,validateHistory} from '../src/history';
import {historyHTML} from '../src/history-review';

test('seven focused topics resolve dated chapters, map evidence and independent membership',()=>{
 assert.deepEqual(topics.map(t=>t.id),['sweet-potatoes','boats','dogs','horses','maize','trade','languages']);
 for(const t of topics){
  const rows=topicRecords(t,dataset.records);assert.ok(rows.length>=5,t.id);
  assert.equal(rows.length,t.recordIds.length,t.id+' missing evidence');
  let previous=-Infinity;
  for(const s of t.scenes){
   assert.ok(s.year>=previous,s.id);previous=s.year;
   assert.ok(s.recordIds.every(id=>t.recordIds.includes(id)),s.id);
   assert.ok(rows.some(r=>s.recordIds.includes(r.id)&&historyState(r,s.year)!=='outside'&&(r.location||r.overlay?.geometry)),s.id+' needs mapped dated evidence');
  }
 }
 assert.ok(topicOnlyIds.has('topic-language-molina'));
 assert.ok(!topicOnlyIds.has('poverty-point-copper-exchange'));
 assert.ok(!topicOnlyIds.has('history-manila-acapulco-eastbound'));
});

test('earlier language evidence survives at 1799 without claiming continuous speakers or a foundation',()=>{
 const r=dataset.records.find(r=>r.id==='topic-language-molina')!;assert.ok(r);
 assert.equal(historyState(r,1570),'outside');assert.equal(historyState(r,1571),'active');assert.equal(historyState(r,1799),'past-place');
 assert.match(historyLabel(r,1799),/Earlier evidence/);
 assert.match(historyHTML(r),/does not establish continuous/i);
 assert.doesNotMatch(historyHTML(r),/Foundation or arrival milestone/);
 assert.deepEqual(validateHistory(r),[]);
 assert.ok(validateHistory({...r,location:null}).length);
});

test('language families are a sourced forest rather than a fabricated universal root',()=>{
 assert.ok(languageFamilies.length>=8);
 assert.equal(new Set(languageFamilies.map(f=>f.id)).size,languageFamilies.length);
 assert.ok(languageFamilies.every(f=>f.url.startsWith('https://glottolog.org/')&&f.members.length));
 assert.match(languageLineagesHTML(),/Intermediate branches omitted/);
 assert.match(languageLineagesHTML(),/Contact is not descent/);
 assert.ok(languageFamilies.find(f=>f.id==='sali1297')?.members.some(m=>m.id==='sali1298'));
});

test('regular scenes have explanatory evidence and the northern story remains contextual',()=>{
 assert.ok(stories.find(s=>s.id==='peoples-of-the-north'));
 for(const story of stories)for(const scene of story.scenes){
  const html=storyDetailsHTML(scene,dataset.records);
  assert.match(html,/story-detail-blocks/,scene.id);
  assert.match(html,/#review\//,scene.id);
  assert.ok(html.length>350,scene.id);
 }
});
