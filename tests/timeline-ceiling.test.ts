import test from 'node:test';
import assert from 'node:assert/strict';
import {geoEquirectangular} from 'd3-geo';
import {AtlasContext} from '../src/atlas-context';
import {recordsForView} from '../src/atlas-view';
import {sharedContextRecords} from '../src/topic-context';
import {topicRecords,topics} from '../src/topic-dives';
import {stories} from '../src/stories';
import {dataset} from '../src/published-data';
import {topicEndYear,recordEndYear} from '../src/topic-scope';
import {END_YEAR,earliestYear,formatYear} from '../src/time';
import {historyLabel} from '../src/history';
import {historyHTML} from '../src/history-review';
import {PlaybackIndex} from '../src/playback-index';
import {smartYearsPerSecond,timelinePosition,timelineYear} from '../src/timeline';
import {dateValue,sampleVoyage,type Voyage} from '../src/voyages';
import {scopedVoyageDate,scopedVoyageGeometry,scopedVoyageWindows} from '../src/shared-movie';
import {validateRecord} from '../src/validation';

const reference=dataset.records.find(r=>r.id==='topic-hawaii-admission-1959')!;
const record=(id:string,start:number,end=start)=>({...reference,id,history:undefined,time:{...reference.time,start,end,eventDate:undefined}});
test('1900 includes uncertain or continuing evidence while later archive events stay off ordinary maps',()=>{
 assert.equal(END_YEAR,1900);
 const rows=[record('before',-853000,-800000),record('boundary',1900),record('continuing',1898,1934),record('later',1901)];
 assert.equal(earliestYear(rows),-853000);assert.equal(formatYear(0),'1 BCE');
 assert.deepEqual(recordsForView(rows,'explore',0).dated.map(r=>r.id),['before','boundary','continuing']);
 assert.deepEqual(recordsForView(rows,'movie',1901).dated,[]);
 const earlyWindow={...rows[2],time:{...rows[2].time,eventDate:'1901-01-20'}};
 assert.equal(recordsForView([earlyWindow],'explore',0).dated.length,0);
 assert.deepEqual(sharedContextRecords(['later'],rows),[]);
 assert.equal(recordEndYear('archived-event'),1934);
 assert.deepEqual(validateRecord(reference),[]);
});
test('ordinary story and topic chapter dates remain original and only Hawaii reaches 1959',()=>{
 assert.ok(stories.every(s=>s.scenes.length&&s.scenes.every(c=>c.year<=1900)));
 assert.ok(topics.every(s=>s.scenes.length&&s.scenes.every(c=>c.year<=topicEndYear(s.id))));
 for(const presentation of [...stories,...topics]){
  for(const field of ['description','subtitle','method','dateNote'] as const){
   const copy=field in presentation?Reflect.get(presentation,field):undefined;
   if(typeof copy==='string')assert.doesNotMatch(copy,/through 1934|to 1934|–1934/i,presentation.id);
  }
 }
 const hawaii=topics.find(t=>t.id==='hawaii-statehood')!;
 assert.equal(topicEndYear(hawaii.id),1959);
 assert.ok(hawaii.scenes.some(s=>s.year===1959));
 const other=topics.find(t=>t.id!=='hawaii-statehood')!;
 assert.equal(topicRecords({...other,recordIds:[reference.id]},[reference]).length,0);
 assert.equal(topicRecords(hawaii,[reference]).length,1);
 for(const year of [1899,1900,1901,1934,1958,1959]){
  assert.equal(timelineYear(timelinePosition(year,500,1959,'log'),500,1959,'log'),year);
 }
});
test('ongoing habitation may reach either supported ceiling without claiming a later source date',()=>{
 const original=dataset.records.find(r=>r.history?.continuity==='ongoing'&&r.time.start!<1899)!;
 const atEnd=(end:number)=>({...original,time:{...original.time,end}});
 assert.deepEqual(validateRecord(atEnd(1900)),[]);
 assert.deepEqual(validateRecord(atEnd(1934)),[]);
 assert.ok(validateRecord(atEnd(1899)).length);
 for(const copy of [historyLabel(atEnd(1900),1900),historyHTML(atEnd(1900))]){
  assert.match(copy,/1900/);
  assert.doesNotMatch(copy,/1934/);
 }
});
const stop=(name:string,day:string,lon:number)=>({name,arrival:day,departure:day,coordinates:[lon,15] as [number,number],mode:'sea' as const,note:'Dated anchor'});
const voyage:Voyage={id:'crossing',name:'Test voyage',recordIds:[],sourceIds:[],summary:'',precision:'',scope:'global',stops:[stop('Before','1899-07-01',-70),stop('Beyond','1902-07-01',-100)]};
test('a voyage crossing 1900 ends on the interpolated leg and exposes no future stop or destination',()=>{
 const lastDay=dateValue('1900-12-31');
 for(const scope of ['atlas','global'] as const){
  const v={...voyage,scope};
  assert.equal(scopedVoyageDate(v,1),lastDay);
  const geometry=scopedVoyageGeometry(v);
  assert.deepEqual(geometry.coordinates.at(-1)?.at(-1),sampleVoyage(v.stops,lastDay)!.coordinates);
  const layer=new AtlasContext();layer.voyages=[v];layer.options={boundaries:false,rails:false,voyages:true,voyageId:v.id,voyageDate:lastDay};
  const html=layer.draw(geoEquirectangular(),1900,1);
  assert.ok(html.includes('selected-traveler'));
  assert.ok(!html.includes('Beyond'));
 }
 assert.equal(voyage.stops[1].arrival,'1902-07-01');
});
test('a wholly later voyage offers no playable date or drawn track',()=>{
 const v={...voyage,stops:[stop('Later','1901-01-01',-70),stop('Later still','1902-01-01',-90)]};
 assert.deepEqual(scopedVoyageWindows(v),[]);assert.ok(Number.isNaN(scopedVoyageDate(v,0)));
 assert.deepEqual(scopedVoyageGeometry(v).coordinates,[]);
});


test('archived later events do not slow the displayed timeline',()=>{
 const before=[record('one-observation',1884,1884)];
 const includingFuture=[...before,record('later-discovery',1903,1903)];
 assert.equal(new PlaybackIndex(includingFuture).yearsPerSecond(1888),new PlaybackIndex(before).yearsPerSecond(1888));
 assert.equal(smartYearsPerSecond(includingFuture,1888),smartYearsPerSecond(before,1888));
});
