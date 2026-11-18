import test from 'node:test';
import assert from 'node:assert/strict';
import {densityGroups,type DensityAnchor} from '../src/map-density';
const anchor=(key:string,x:number,y:number,active=1,prior=0,protectedPoint=false):DensityAnchor=>({key,x,y,active,prior,protectedPoint});
test('neighboring source anchors share a mark, preserving phases, status and protected places',()=>{
  const input=[anchor('a',0,0,2,1),anchor('b',2,3,0,1),anchor('focus',1,1,1,0,true),anchor('sparse',160,50)];
  const result=densityGroups(input,38);
  assert.deepEqual(result,densityGroups([...input].reverse(),38));
  const group=result.find(g=>g.members.length===2)!;
  assert.deepEqual(group.members.map(a=>a.key),['a','b']);
  assert.equal(group.active,2);assert.equal(group.prior,2);
  assert.equal(result.length,3);
});
test('projected world edges remain separate and thousands of eligible anchors remain represented',()=>{
  const input=Array.from({length:6000},(_,i)=>anchor(String(i),i%300,Math.floor(i/300)));
  const result=densityGroups(input,32);
  assert.equal(new Set(result.flatMap(g=>g.members.map(a=>a.key))).size,6000);
  assert.equal(densityGroups([anchor('east',999,0),anchor('west',1,0)],30).length,2);
});

import {placeChange} from '../src/map-density';
import type {HistoryMetadata} from '../src/model';
test('local ending symbols require explicit evidence and retain its entire date range',()=>{
  const h:HistoryMetadata={kind:'habitation',claimId:'use'};
  assert.equal(placeChange({...h,endMeaning:'unknown'},1500),null);
  assert.equal(placeChange({...h,continuity:'ongoing'},1500),null);
  const moved:HistoryMetadata={...h,endYear:1280,endMeaning:'relocated'};
  assert.equal(placeChange(moved,1279),null);
  assert.deepEqual(placeChange(moved,1280),{kind:'relocated',inWindow:true,possible:false});
  assert.deepEqual(placeChange(moved,1400),{kind:'relocated',inWindow:false,possible:false});
  const ended:HistoryMetadata={...h,endEvidence:{start:1280,end:1300,meaning:'abandoned',certainty:'inferred',claimId:'end',note:'Local site evidence.'}};
  assert.deepEqual(placeChange(ended,1290),{kind:'abandoned',inWindow:true,possible:true});
  assert.deepEqual(placeChange(ended,1400),{kind:'abandoned',inWindow:false,possible:true});
});

import {changeCaption} from '../src/map-density';
import {fixture} from './fixtures';
test('movie captions retain conflict, loss and foundation source windows',()=>{
  const record=fixture();
  record.time={...record.time,start:1640,end:1643,kind:'occurrence'};
  const conflict={...record,title:'Battle of Cedar Crossing',overlay:{kind:'conflict' as const,basis:'documented' as const,geometry:null,precision:'named town',provenance:'fixture'}};
  assert.match(changeCaption(conflict,1641)??'',/Battle of Cedar Crossing.*1,?640.*1,?643/);
  assert.equal(changeCaption(conflict,1644),null);
  assert.match(changeCaption({...record,title:'Seabird wreck',history:{kind:'wreck',claimId:'wreck'}},1641)??'',/Seabird wreck.*1,?640.*1,?643/);
  assert.match(changeCaption({...record,title:'Foundation of Riverport',type:'event',history:{kind:'settlement',claimId:'foundation'}},1641)??'',/Foundation of Riverport.*1,?640.*1,?643/);
  assert.equal(changeCaption({...record,type:'occupation',time:{...record.time,kind:'interval'}},1641),null);
});

test('movie captions name dated evidence and documented endings within a bounded label',()=>{
  const record=fixture();
  const dated={...record,title:'Riverport pottery from the west bank and upper terrace',time:{...record.time,start:1640,end:1643,kind:'occurrence' as const}};
  const caption=changeCaption(dated,1641)??'';
  assert.match(caption,/^Riverport pottery.*… · 1,?640 CE–1,?643 CE$/);
  assert.ok(caption.split(' · ')[0].length<=36);
  const ending={...record,title:'McKean — guano camp and workings',history:{kind:'habitation' as const,claimId:'camp',endEvidence:{start:1870,end:1870,meaning:'abandoned' as const,certainty:'documented' as const,claimId:'camp',note:'The last workers left.'}}};
  assert.match(changeCaption(ending,1870)??'',/McKean.*departure.*1,?870 CE/);
  assert.equal(changeCaption(ending,1871),null);
});
