import test from 'node:test';
import assert from 'node:assert/strict';
import {localChronologyHTML} from '../src/local-chronology';
import {dataset} from '../src/published-data';
test('local chronology distinguishes observations at the same building and keeps date navigation',()=>{
 const early=dataset.records.find(r=>r.id==='site-mesa-step-house-pithouses')!;
 const late=dataset.records.find(r=>r.id==='site-mesa-step-house-masonry')!;
 assert.deepEqual([early.location!.lon,early.location!.lat],[late.location!.lon,late.location!.lat]);
 const html=localChronologyHTML([late,early],700);
 for(const r of [early,late]){
  assert.ok(html.includes(r.title),r.id+' observation title');
  assert.ok(html.includes(r.location!.name),r.id+' place label');
  assert.ok(html.includes(`data-local-record="${r.id}"`),r.id+' record navigation');
  assert.ok(html.includes(`data-local-year="${r.time.start}"`),r.id+' original date');
 }
 assert.ok(html.indexOf(early.title)<html.indexOf(late.title),'chronological ordering');
});
