import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {dataset} from '../src/published-data';
import {topicOnlyIds} from '../src/topic-dives';
import {siteGuides,guideForRecord} from '../src/site-guides';
import {stories} from '../src/stories';
import type {EvidenceRecord} from '../src/model';
import {historyState,historyLabel,historyDates,historyOpacity} from '../src/history';
import {historyHTML} from '../src/history-review';
import {validateRecord} from '../src/validation';
import {activeRecords} from '../src/time';

const guideIds=['lower-central-america','atlantic-brazil','solomons-vanuatu'];
test('separate calibrated windows do not activate intervening years on the shared clock',()=>{
 for(const [id,active,gap] of [
  ['lca-el-cano-tomb-7',[800,940],[906,910,919]],
  ['sv-matantas-late-lapita',[-620,-420],[-499,-470,-441]],
 ] as const){
  const r=dataset.records.find(r=>r.id===id)!;assert.deepEqual(validateRecord(r),[]);
  for(const year of active)assert.equal(historyState(r,year),'active');
  for(const year of gap){
   assert.deepEqual(activeRecords([r],year),[]);
   assert.equal(historyState(r,year),'past-place');
   assert.ok(historyOpacity(r,year)!<historyOpacity(r,active[0])!);
   assert.match(historyLabel(r,year),/earlier evidence.*outside its supported dating windows/i);
  }
  assert.doesNotMatch(historyLabel(r,active[0]),/voyage|contact/);
  assert.match(historyHTML(r),/Separate supported dates/);
  for(const w of r.history!.windows!)assert.ok(historyDates([r]).includes(w.end+1));
  const invalid=structuredClone(r);invalid.history!.windows![0].start=r.time.start!-1;
  assert.ok(validateRecord(invalid).length,'out-of-bounds windows are rejected');
 }
});

test('three later source-to-find lines are explicitly linked to their local find records',()=>{
 for(const [local,route] of [['sv-kahula-adzes','trade-pacific-tutuila-kahula-1296'],['sv-sikopo-obsidian','trade-pacific-kutau-sikopo-1319'],['sv-emae-vanua-lava-glass','trade-pacific-vanua-lava-emae-1565']]){
  const a=dataset.records.find(r=>r.id===local)!,b=dataset.records.find(r=>r.id===route)!;
  assert.ok(a.review.relatedIds.includes(route));assert.ok(b.review.relatedIds.includes(local));
  assert.match(b.review.discussion,/same archaeological evidence/);
 }
});
test('three regional histories have connected guides and dated scenes in the shared world',()=>{
 for(const id of guideIds){
  const guide=siteGuides.find(g=>g.id===id);assert.ok(guide,`Missing ${id}`);
  assert.equal(guide.storyId,id);assert.ok(!guide.topicId);
  const story=stories.find(s=>s.id===id);assert.ok(story);
  assert.ok(story.scenes.length>=4);
  for(const scene of story.scenes){
   const records=scene.recordIds.map(id=>dataset.records.find(r=>r.id===id));
   assert.ok(records.every(Boolean));assert.ok(records.every(r=>!topicOnlyIds.has(r!.id)));
   assert.ok(scene.year<=1934);
   assert.ok(records.some(r=>r!.location&&r!.time.start!==null&&r!.time.end!==null&&r!.time.start<=scene.year&&r!.time.end>=scene.year),`${id}/${scene.id} needs dated local evidence`);
  }
 }
});

test('each new observation belongs to the master map and an accessible regional history',async()=>{
 const raw=await readFile('data/three-regional-gaps-expansion-records.json','utf8').catch(()=>null);assert.ok(raw,'Missing regional observations');
 const {records}=JSON.parse(raw) as {records:EvidenceRecord[]};assert.ok(records.length);
 for(const r of records){
  assert.deepEqual(dataset.records.find(old=>old.id===r.id),r);
  assert.ok(!topicOnlyIds.has(r.id));assert.ok(guideIds.includes(guideForRecord(r.id)?.id??''));
  assert.equal(siteGuides.filter(g=>g.recordIds.includes(r.id)).length,1,`${r.id} needs one owning guide`);
  assert.ok(r.sources.length&&r.claims.some(c=>c.support.some(s=>s.stance==='supports')));
  assert.ok(r.location?.provenance&&r.location?.precision);
  assert.doesNotMatch(r.location!.name,/display anchor|regional reference|modelled coordinate/i);
  if(r.time.start!==null)assert.ok(r.time.end!==null&&r.time.start<=r.time.end);
 }
});

test('before-and-after audit starts with the actual last published master map',async()=>{
 const baseline=JSON.parse(await readFile('data/three-regional-gaps-baseline.json','utf8'));
 assert.equal(baseline.version,'0.23.1');assert.equal(baseline.recordCount,2531);assert.equal(baseline.sharedRecordCount,2458);
 assert.equal(baseline.detailed.length,65);
 const audit=JSON.parse(await readFile('data/coverage-audit.json','utf8'));
 assert.equal(audit.recordCount,dataset.records.filter(r=>!topicOnlyIds.has(r.id)).length);
 const content=JSON.parse(await readFile('data/site-guide-content.json','utf8'));
 for(const id of guideIds){
  const page=content.pages.find((p:any)=>p.id===id);assert.ok(page);
  assert.ok(page.sections.reduce((n:number,s:any)=>n+s.paragraphs.map((p:any)=>p.text).join(' ').split(/\s+/).length,0)>500,`${id} needs actual history, not just a list`);
 }
});
