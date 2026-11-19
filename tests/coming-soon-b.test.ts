import {comingSoonBStories} from '../src/coming-soon-b-stories';
import test from 'node:test';
import assert from 'node:assert/strict';
import {dataset} from '../src/published-data';
import {deepDives,deepDiveIndexHTML,diveCategories} from '../src/deep-dives';
import {topics,topicOnlyIds} from '../src/topic-dives';
import {stories} from '../src/stories';
import {siteGuides} from '../src/site-guides';
import {historyState} from '../src/history';
import {recordsForView} from '../src/atlas-view';
import {relatedDivesHTML} from '../src/topic-context';
import content from '../data/site-guide-content.json';

const places=['poverty-point','hopewell','san-agustin','tierradentro','casarabe','nan-madol','budj-bim'];
const cultures=['lapita','gunditjmara'];
const independent=['austronesian-languages','australian-wool','australian-mining'];
const byId=new Map(dataset.records.map(r=>[r.id,r]));
test('Carrington observations and chapter use the historical Port Stephens locality',()=>{
 const anchor=[152.0145581,-32.6663159]; // TLCMap historical gazetteer 2012, entry td3dd2.
 const closeToCarrington=(point:readonly number[])=>
  Math.hypot((point[0]-anchor[0])*93.7,(point[1]-anchor[1])*111.2)<2;
 for(const [id,year] of [['d19-au-carrington-1826',1826],['d19-au-carrington-network-1828',1828]] as const){
  const r=byId.get(id);assert.ok(r?.location,id);
  assert.ok(closeToCarrington([r.location.lon,r.location.lat]),id+' exceeds declared 2 km locality tolerance');
  assert.equal(r.time.start,year,id+' original date');
  const source=r.sources.find(s=>s.url.includes('tlcmap.org'));
  assert.ok(source,id+' checked geographic source');
  assert.ok(r.claims.some(c=>c.support.some(s=>s.sourceId===source.id&&s.stance==='context')),id+' geographic context exported');
 }
 const scene=topics.find(t=>t.id==='australian-wool')?.scenes.find(s=>s.id==='australian-wool-6');
 assert.ok(scene?.center&&closeToCarrington(scene.center),'chapter camera must center on Carrington');
});
test('related studies can link subjects to a place guide with an explanatory reason',()=>{
 const html=relatedDivesHTML('test',[['machu-picchu','Compare a local built landscape with its wider connections.']]);
 assert.match(html,/href="sites\/machu-picchu.html"/);
 assert.match(html,/Compare a local built landscape/);
});
test('remaining twelve dedicated studies finish the accepted queue in their correct categories',()=>{
 for(const [category,ids] of [['places',places],['cultures',cultures],['languages',[independent[0]]],['subjects',independent.slice(1)]] as const){
  for(const id of ids){
   const href=(category==='places'||category==='cultures')?'sites/'+id+'.html':'#topic/'+id;
   const card=deepDives.find(d=>d.links.some(l=>l.href===href));
   assert.ok(card,href);assert.equal(card.category,category);
   assert.equal(deepDives.some(d=>d.id===id&&!d.links.length),false,id+' still planned');
  }
 }
 assert.equal(deepDives.filter(d=>!d.links.length).length,0);
 assert.ok(deepDives.filter(d=>d.links.length).length>=70,'completed campaign remains available as further studies are added');
});
test('completed lists do not display empty coming-soon sections',()=>{
 for(const c of diveCategories){
  const html=deepDiveIndexHTML(c.id);
  assert.doesNotMatch(html,/class="dive-queue"/);
  assert.doesNotMatch(html,/0 coming soon/);
 }
});
test('nine new place and culture movies retain current shared evidence and substantial guides',()=>{
 for(const id of [...places,...cultures]){
  const guide=siteGuides.find(g=>g.id===id);assert.ok(guide,id);
  const story=stories.find(s=>s.id===guide.storyId);assert.ok(story,id);
  const archive=comingSoonBStories.find(s=>s.id===guide.storyId)!;
  assert.ok(archive.scenes.length>=5,id+' archived chapters');
  assert.deepEqual(story.scenes,archive.scenes.filter(scene=>scene.year<=1900));
  for(const scene of story.scenes){
   assert.ok(scene.body.length>250,scene.title+' detail');
   assert.ok(scene.recordIds.some(id=>{const r=byId.get(id);return r?.location&&!topicOnlyIds.has(id)&&historyState(r,scene.year)==='active';}),scene.title+' current shared location');
  }
  const page=content.pages.find(p=>p.id===id);assert.ok(page,id);
  assert.ok(page.sections.length>=4,id+' sections');assert.ok(page.sources.length>=2,id+' sources');
 }
});
test('Austronesian, wool and mining studies use independent timelines with dated map evidence',()=>{
 for(const id of independent){
  const topic=topics.find(t=>t.id===id);assert.ok(topic,id);
  assert.ok(topic.scenes.length>=6,id+' chapters');
  for(const scene of topic.scenes){
   assert.ok(scene.year<=1900,scene.title+' shared historical scope');
   assert.ok(scene.body.length>250,scene.title+' detail');
   assert.ok(scene.recordIds.some(id=>{const r=byId.get(id);return r?.location&&historyState(r,scene.year)==='active';}),scene.title+' current mapped evidence');
  }
 }
 assert.ok(topics.find(t=>t.id==='austronesian-languages')?.languageFamilyIds?.includes('aust1307'));
});
test('new local history reaches the master with reciprocal links and qualified sources',()=>{
 const incoming=dataset.records.filter(r=>r.id.startsWith('d19-'));
 const shared=incoming.filter(r=>!topicOnlyIds.has(r.id));assert.ok(shared.length>=25,'new local observations');
 for(const r of incoming){
  assert.ok(r.sources.length&&r.claims.length,r.id);
  if(r.location)assert.ok(r.location.precision&&r.location.provenance,r.id+' location basis');
  for(const id of r.review.relatedIds)assert.ok(byId.get(id)?.review.relatedIds.includes(r.id),r.id+' reciprocal '+id);
  if(!topicOnlyIds.has(r.id)&&r.time.start!==null)assert.equal(recordsForView(dataset.records,'movie',r.time.start).dated.some(x=>x.id===r.id),r.time.start<=1900,r.id+' master');
 }
});
test('reused Oyster Cove relocation retains its distinct origin and destination',()=>{
 const r=byId.get('sovereignty-oyster-cove');assert.ok(r?.location&&r.destination);
 assert.ok(r.location.lon>147.5&&r.location.lon<148.2&&r.location.lat>-40.4&&r.location.lat<-39.5,'Wybalenna origin on Flinders Island');
 assert.ok(r.destination.lon>146.8&&r.destination.lon<147.4&&r.destination.lat>-43.3&&r.destination.lat<-42.8,'Oyster Cove destination in southern Tasmania');
 assert.deepEqual([r.time.start,r.time.end],[1847,1847]);
});
