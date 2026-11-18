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
