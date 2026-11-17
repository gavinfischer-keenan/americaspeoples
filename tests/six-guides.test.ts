import test from 'node:test';
import assert from 'node:assert/strict';
import {dataset} from '../src/published-data';
import {siteGuides} from '../src/site-guides';
import {stories} from '../src/stories';
import {deepDives} from '../src/deep-dives';
import {topicOnlyIds} from '../src/topic-dives';
import {historyState} from '../src/history';
import {recordsForView} from '../src/atlas-view';
import content from '../data/site-guide-content.json';

const guides=['chaco','machu-picchu','cahokia','mesa-verde','hovenweep','canyons-of-the-ancients'];
const byId=new Map(dataset.records.map(r=>[r.id,r]));
test('each expanded archaeological guide has one contextual movie and its original URL',()=>{
 for(const id of guides){
  const g=siteGuides.find(g=>g.id===id);assert.ok(g,id);
  assert.equal(g.href,`sites/${id}.html`);
  const story=stories.find(s=>s.id===g.storyId);assert.ok(story,id+' contextual movie');
  if(id==='chaco')assert.equal(story.id,'chaco-connections');
  assert.ok(story.scenes.length>=6,id+' local chapters');
  const cards=deepDives.filter(d=>d.links.some(l=>l.href===g.href));assert.equal(cards.length,1,id+' one place card');
  assert.ok(cards[0].links.some(l=>l.href==='#story/'+story.id),id+' linked movie');
  assert.doesNotMatch(cards[0].expansion??'',/planned/i,id+' stale expansion notice');
  const page=content.pages.find(p=>p.id===id);assert.ok(page&&page.sections.length>=4,id+' detailed guide');
  for(const scene of story.scenes){
   assert.ok(scene.body.length>250,scene.id+' explanatory detail');
   assert.ok(scene.recordIds.some(id=>{const r=byId.get(id);return r?.location&&!topicOnlyIds.has(id)&&historyState(r,scene.year)==='active';}),scene.id+' current shared place');
   for(const id of scene.recordIds)assert.ok(byId.has(id),scene.id+' evidence '+id);
  }
 }
});
test('each guide adds separately identified local features or phase observations to the master',()=>{
 for(const id of guides){
  const g=siteGuides.find(g=>g.id===id)!;
  const incoming=g.recordIds.map(id=>byId.get(id)!).filter(r=>r?.id.startsWith('g20-'));
  assert.ok(incoming.length>=6,id+' additional local observations');
  assert.ok(new Set(incoming.map(r=>r.location?.id)).size>=3,id+' distinct named places');
  for(const r of incoming){
   assert.ok(r.location&&(!r.overlay||r.overlay.kind==='violence'),r.id+' local place or documented violence');
   assert.ok(r.time.start!==null&&r.time.end!==null,r.id+' dated observation');
   assert.ok(r.location.precision&&r.location.provenance,r.id+' geographic basis');
   assert.ok(r.sources.length&&r.claims.length,r.id+' evidence');
   assert.equal(topicOnlyIds.has(r.id),false,r.id+' shared not topic-only');
   assert.ok(recordsForView(dataset.records,'movie',r.time.start!).dated.some(x=>x.id===r.id),r.id+' master map');
   assert.equal(siteGuides.filter(g=>g.recordIds.includes(r.id)).length,1,r.id+' guide ownership');
   for(const s of r.sources)assert.ok(r.claims.some(c=>c.support.some(x=>x.sourceId===s.id)),r.id+' exported source '+s.id);
   for(const related of r.review.relatedIds)assert.ok(byId.get(related)?.review.relatedIds.includes(r.id),r.id+' reciprocal '+related);
  }
 }
});

