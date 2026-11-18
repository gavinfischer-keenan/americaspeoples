import test from 'node:test';
import assert from 'node:assert/strict';
import data from '../data/expedition-activity.json';
import catalog from '../data/voyages.json';
import {activityWindows,activityDuring} from '../src/expedition-context';
import {dateValue} from '../src/voyages';

test('coarse expedition entries retain resolvable sources and genuine period precision',()=>{
 const ids=new Set<string>(),sources=new Map(data.sources.map(s=>[s.id,s]));
 for(const a of data.activities){
  assert.ok(!ids.has(a.id),a.id);ids.add(a.id);
  assert.match(a.start,/^\d{4}(-(0[1-9]|1[0-2]))?$/);assert.match(a.end,/^\d{4}(-(0[1-9]|1[0-2]))?$/);
  assert.equal(activityWindows([a]).length,1,a.id);
  assert.ok(a.sourceIds.length&&a.name&&a.region&&a.note);
  for(const id of a.sourceIds){const s=sources.get(id);assert.ok(s,a.id+': '+id);assert.ok(s.access&&s.authors&&s.venue);assert.match(s.url,/^https:\/\//);}
  for(const id of 'relatedVoyageIds' in a?a.relatedVoyageIds??[]:[])assert.ok(catalog.voyages.some(v=>v.id===id),id);
 }
});

test('documented winter context is still available while its exact position is untraced',()=>{
 for(const [fragment,date] of [['cartier','1536-01-15'],['hudson','1611-01-15'],['gjoa','1906-01-15']]){
  const entries=activityDuring(data.activities,dateValue(date));
  assert.ok(entries.some(a=>a.id.includes(fragment)&&/winter/i.test(a.name+' '+a.note)),fragment);
 }
});
