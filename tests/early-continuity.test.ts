import test from 'node:test';
import assert from 'node:assert/strict';
import {dataset} from '../src/published-data';
import incoming from '../data/early-continuity-expansion-records.json';
import {topicOnlyIds} from '../src/topic-dives';
import {recordsForView} from '../src/atlas-view';
import {historyState} from '../src/history';
import {stories} from '../src/stories';
import {siteGuides} from '../src/site-guides';
const record=(id:string)=>{const r=dataset.records.find(r=>r.id===id);assert.ok(r,id);return r;};
test('new observations belong to the shared world and export collection',()=>{
 for(const r of incoming.records){
  assert.ok(!topicOnlyIds.has(r.id));assert.ok(record(r.id));
  assert.equal(recordsForView(dataset.records,'movie',r.time.start).dated.some(x=>x.id===r.id),r.time.start<=1900,r.id);
  for(const id of r.review.relatedIds)assert.ok(record(id).review.relatedIds.includes(r.id),r.id+' reciprocal '+id);
 }
});
test('El Gigante phases do not bridge the long mid-Holocene gap',()=>{
 const phases=incoming.records.filter(r=>r.id.startsWith('early-gigante-'));
 assert.ok(phases.length>=6);
 assert.equal(phases.some(r=>r.time.start<=-3500&&r.time.end>=-3500),false);
 assert.equal(record('early-gigante-esperanza').time.start,1950-10985);
 assert.equal(record('early-gigante-late-marcala').time.start,1950-4400);
});
test('later Kuk use and relocation have separate dates and evidence semantics',()=>{
 const p=record('early-kuk-phase5');assert.equal(p.time.start,1310);assert.equal(p.time.end,1650);
 assert.equal(historyState(p,1100),'outside');
 const r=record('early-kuk-kawelka-departure');assert.match(r.review.limitations,/oral|tradition/i);assert.match(r.time.original,/1914|1920/);
 assert.equal(record('early-kuk-1933').time.start,1933);
});
test('site phases, catchment signals and regional interpretation stay distinct',()=>{
 const sangay=record('early-upano-sangay');assert.match(sangay.time.interpretation,/phase|regional/i);
 assert.match(record('early-upano-cormoran-later').review.limitations,/catchment|watershed/i);
 assert.equal(record('early-vichama-later').time.start,1000);
 assert.equal(record('early-vichama-early').time.end,1-1500);
 assert.ok(record('early-pernil-village').location!.lat>-14.49,'original monograph coordinates, not the misplaced secondary pin');
});
test('three place stories and guides use published shared evidence',()=>{
 for(const id of ['caral-supe','kuk','upano']){
  const story=stories.find(s=>s.id===id),guide=siteGuides.find(g=>g.id===id);assert.ok(story&&guide,id);
  assert.ok(story.scenes.length>=4);
  for(const s of story.scenes)assert.ok(s.recordIds.some(id=>historyState(record(id),s.year)==='active'),s.title);
  for(const id of guide.recordIds)assert.ok(record(id));
 }
});
