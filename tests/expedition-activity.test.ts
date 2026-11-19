import test from 'node:test';
import assert from 'node:assert/strict';
import data from '../data/expedition-activity.json';
import catalog from '../data/voyages.json';
import {activityWindows,activityDuring,expeditionActivityHTML} from '../src/expedition-context';
import {dateValue} from '../src/voyages';

test('coarse expedition entries retain resolvable sources and genuine period precision',()=>{
 const ids=new Set<string>(),sources=new Map(data.sources.map(s=>[s.id,s]));
 for(const a of data.activities){
  assert.ok(!ids.has(a.id),a.id);ids.add(a.id);
  assert.match(a.start,/^\d{4}(-(0[1-9]|1[0-2])(-\d{2})?)?$/);assert.match(a.end,/^\d{4}(-(0[1-9]|1[0-2])(-\d{2})?)?$/);
  assert.equal(activityWindows([a]).length,a.start.slice(0,4)<='1900'?1:0,a.id);
  assert.ok(a.sourceIds.length&&a.name&&a.region&&a.note);
  for(const id of a.sourceIds){const s=sources.get(id);assert.ok(s,a.id+': '+id);assert.ok(s.access&&s.authors&&s.venue);assert.match(s.url,/^https:\/\//);}
  for(const id of 'relatedVoyageIds' in a?a.relatedVoyageIds??[]:[])assert.ok(catalog.voyages.some(v=>v.id===id),id);
 }
});

test('a documented one-day reconnaissance appears only on its supported day',()=>{
 const a={id:'day',name:'Reconnaissance',start:'1854-05-06',end:'1854-05-06',region:'Arctic',note:'Dated observation; no recovered track.',sourceIds:[]};
 assert.equal(activityDuring([a],dateValue('1854-05-05')).length,0);
 assert.equal(activityDuring([a],dateValue('1854-05-06')+0.5/365).length,1);
 assert.equal(activityDuring([a],dateValue('1854-05-07')).length,0);
 assert.match(expeditionActivityHTML([a],[]),/day precision/);
 assert.equal(activityWindows([{...a,start:'1854-02-30'}]).length,0);
 const last=dateValue('1900-12-31');
 assert.deepEqual(activityWindows([{...a,start:'1900-12-31',end:'1901-01-01'}]),[{start:last,end:last}]);
});

test('documented winter context is still available while its exact position is untraced',()=>{
 for(const [fragment,date] of [['cartier','1536-01-15'],['hudson','1611-01-15']]){
  const entries=activityDuring(data.activities,dateValue(date));
  assert.ok(entries.some(a=>a.id.includes(fragment)&&/winter/i.test(a.name+' '+a.note)),fragment);
 }
});

test('Gjøa wintering remains documented beyond the display cutoff',()=>{
 const row=data.activities.find(a=>a.id==='gjoa-king-point-winter-1905')!;
 assert.deepEqual([row.start,row.end],['1905-09','1906-06']);
 assert.deepEqual(activityDuring([row],dateValue('1906-01-15')),[]);
});
