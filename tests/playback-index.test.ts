import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PlaybackIndex} from '../src/playback-index';
import {smartYearsPerSecond} from '../src/timeline';
import {advancePlayback,END_YEAR} from '../src/time';
import type {EvidenceRecord,TimeExtent} from '../src/model';

type Row=Pick<EvidenceRecord,'time'>;
const row=(start:number|null,end:number|null,extra:Partial<TimeExtent>={}):Row=>({time:{kind:'occurrence',start,end,original:'Synthetic dates',method:'Synthetic test',interpretation:'Synthetic test',...extra}});
const close=(actual:number,expected:number)=>assert.ok(Math.abs(actual-expected)<=1e-8,`${actual} != ${expected}`);

test('index preserves inclusive activity, per-record boundary deduplication, cores and unresolved dates',()=>{
 const rows=[row(null,null,{kind:'unplaced'}),row(null,200),row(-5000,-4000),row(0,0),row(1,10,{kind:'interval',certainStart:1,certainEnd:10}),row(1,10,{approximate:true}),row(20,25,{certainStart:22,certainEnd:24}),row(0,0)];
 const index=new PlaybackIndex(rows);
 for(const y of [-6001,-6000,-5001,-5000,-4000,-3999,-1000,-1,0,1,9,10,11,20,22,24,25,26,1000,END_YEAR]){
  close(index.yearsPerSecond(y),smartYearsPerSecond(rows,y));
  for(const step of [0,.5,1,10,1000,10000])assert.deepEqual(index.advance(y,step),advancePlayback(rows,y,step));
 }
});

test('advance uses only start/end boundaries, rounds no dates, and keeps jump/ceiling behavior',()=>{
 const rows=[row(100,200,{certainStart:125,certainEnd:175}),row(300,300),row(END_YEAR,END_YEAR)];
 const index=new PlaybackIndex(rows);
 for(const y of [99,100,100.5,124,125,199,200,300,END_YEAR-1,END_YEAR,END_YEAR+1])
  for(const step of [-10,0,.25,1,25,100,10000])assert.deepEqual(index.advance(y,step),advancePlayback(rows,y,step));
 assert.deepEqual(index.advance(100,100),{year:200,boundary:true});
 assert.deepEqual(index.advance(100,99.5),{year:199.5,boundary:false});
 assert.deepEqual(new PlaybackIndex([]).advance(END_YEAR-1,100),{year:END_YEAR,boundary:false});
 close(new PlaybackIndex([]).yearsPerSecond(0),12000);
});

test('indexed rates and jumps match a deterministic randomized corpus at edge and interior years',()=>{
 let state=794711;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const rows:Row[]=Array.from({length:400},(_,i)=>{
  if(i%17===0)return row(null,null,{kind:'unplaced'});
  const start=Math.floor(random()*100000)-98000,length=i%7===0?0:Math.floor(random()*3000),end=Math.min(END_YEAR,start+length);
  return row(start,end,{kind:i%2?'occurrence':'interval',approximate:i%3===0,certainStart:start+Math.floor((end-start)/3),certainEnd:end-Math.floor((end-start)/3)});
 });
 const index=new PlaybackIndex(rows);
 const years=[...rows.flatMap(r=>r.time.start===null?[]:[r.time.start-1000,r.time.start-1,r.time.start,r.time.end!,r.time.end!+1,r.time.end!+1000]),...Array.from({length:200},()=>random()*103000-100000)];
 for(const y of years){
  close(index.yearsPerSecond(y),smartYearsPerSecond(rows,y));
  const step=random()*5000;
  assert.deepEqual(index.advance(y,step),advancePlayback(rows,y,step));
 }
});

test('ticks use the precomputed snapshot without reading source records again',()=>{
 let reads=0;
 const rows=Array.from({length:1000},(_,i)=>Object.defineProperty({},'time',{get(){reads++;return row(i,i+100).time;}}) as Row);
 const index=new PlaybackIndex(rows),constructedReads=reads;
 for(let i=0;i<100;i++){index.yearsPerSecond(i);index.advance(i,25);}
 assert.equal(reads,constructedReads);
});
