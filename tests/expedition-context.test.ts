import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {geoEquirectangular} from 'd3-geo';
import {dateValue,type Voyage} from '../src/voyages';
import {scopedVoyageWindows,scopedVoyageGeometry,advanceMovieClock} from '../src/shared-movie';
import {PlaybackIndex} from '../src/playback-index';
import {AtlasContext} from '../src/atlas-context';

const polar={id:'polar-test',name:'Polar <expedition>',summary:'Test chronology',scope:'global',sourceIds:[],recordIds:[],precision:'Schematic',stops:[
 {name:'Ice camp',coordinates:[-45,-75],arrival:'1915-01-18',departure:'1915-10-27',mode:'sea',phase:'wintering',note:'Stationary winter'},
 {name:'Island',coordinates:[-55,-61],arrival:'1916-04-15',departure:'1916-04-24',mode:'sea',phase:'rescue',note:'Documented camp'},
]} as Voyage;

test('global expeditions preserve polar wintering and full dated extent',()=>{
 assert.deepEqual(scopedVoyageWindows(polar),[{start:dateValue('1915-01-18'),end:dateValue('1916-04-24')}]);
 assert.ok(scopedVoyageGeometry(polar).coordinates.flat().some(p=>p[1]<-70));
});

test('a polar traveler is drawn when its position is in the viewport',()=>{
 const context=new AtlasContext();context.voyages=[polar];
 context.options={boundaries:false,rails:false,voyages:true,voyageId:'',voyageDate:dateValue('1915-06-01')};
 const html=context.draw(geoEquirectangular(),1915,1,true);
 assert.match(html,/data-voyage="polar-test"/);
 assert.match(html,/Wintering/);
});

test('locating a legacy expedition outside its playback scope still draws its documented position',()=>{
 const context=new AtlasContext();context.voyages=[{...polar,scope:'atlas'}];
 context.options={boundaries:false,rails:false,voyages:true,voyageId:polar.id,voyageDate:dateValue('1915-06-01')};
 const html=context.draw(geoEquirectangular(),1915,1,true);
 assert.match(html,/data-voyage="polar-test"/);
 assert.match(html,/voyage-stop/);
});

const mod=existsSync(new URL('../src/expedition-context.ts',import.meta.url))?await import('../src/expedition-context'):null;
test('contemporary list includes simultaneous offscreen voyages without future or completed trips',()=>{
 assert.ok(mod,'expedition context module');
 const second={...polar,id:'second',name:'Second'};
 const date=dateValue('1915-06-01');
 const entries=mod.activeExpeditions([polar,second],date,()=>false);
 assert.equal(entries.length,2);assert.ok(entries.every(e=>!e.inView));
 assert.equal(mod.activeExpeditions([polar],dateValue('1914-12-31'),()=>true).length,0);
 assert.equal(mod.activeExpeditions([polar],dateValue('1916-05-01'),()=>true).length,0);
 const html=mod.expeditionsHTML(entries);
 assert.match(html,/Outside this view/);assert.match(html,/Wintering/);
 assert.match(html,/data-follow-expedition="polar-test"/);
 assert.ok(!html.includes('<expedition>'));
});

test('a documented expedition with an untraced interval remains listed without an invented position or connecting track',()=>{
 assert.ok(mod);
 const gap={...polar,stops:polar.stops.map((s,i)=>({...s,...(i===0?{gapAfter:true}:{})}))};
 const entries=mod.activeExpeditions([gap],dateValue('1916-01-01'),()=>true);
 assert.equal(entries.length,1);assert.equal(entries[0].coordinates,null);
 assert.match(entries[0].position,/not reconstructed/);
 const geometry=scopedVoyageGeometry(gap);
 assert.ok(geometry.coordinates.every(line=>line.every(p=>p[0]===line[0][0]&&p[1]===line[0][1])));
});

test('the final atlas year includes expeditions occurring after January 1934',()=>{
 const index=new PlaybackIndex([]);
 const frame=advanceMovieClock(1934,0.5,1,index,[],false);
 assert.ok(frame.date>1934);
 assert.ok(advanceMovieClock(dateValue('1934-12-30'),10,1,index,[],false).date<=dateValue('1934-12-31'));
});

test('coarse voyage dates remain labelled windows, with no invented daily position',()=>{
 assert.ok(mod);
 const row={id:'cabot',name:'Cabot',start:'1497-05',end:'1497-08',region:'North Atlantic',note:'Landfall unidentified',sourceIds:['source']};
 const entries=mod.activityDuring([row],dateValue('1497-06-24'));
 assert.equal(entries.length,1);
 assert.equal(mod.activityDuring([row],dateValue('1497-09-01')).length,0);
 const html=mod.expeditionActivityHTML(entries,[{id:'source',title:'Chronology',url:'https://example.org/chronology'}]);
 assert.match(html,/month precision/);assert.match(html,/Landfall unidentified/);
 assert.doesNotMatch(html,/data-follow-expedition/);
 assert.match(html,/https:\/\/example.org\/chronology/);
 assert.equal(mod.activityDuring([{...row,start:'1497',end:'1497'}],dateValue('1497-01-01')).length,1);
 assert.equal(mod.activityDuring([{...row,start:'1497-13',end:'1497-14'}],dateValue('1497-06-01')).length,0);
 const related={...row,relatedVoyageIds:['cabot']};
 const context={id:'cabot',name:'Cabot',position:'Unknown',phase:'Expedition in progress',coordinates:null,inView:false};
 assert.equal(mod.activityDuring([related],dateValue('1497-06-24'),[context]).length,1,'period context remains visible within a route gap');
 assert.equal(mod.activityDuring([related],dateValue('1497-06-24'),[{...context,coordinates:[-2.6,51.45]}]).length,0,'avoid duplicate context when precise position is shown');
});

test('shared playback notices a coarse expedition window without inventing an event day',()=>{
 assert.ok(mod);
 const periods=mod.activityWindows([{id:'coarse',name:'Voyage',start:'1497-05',end:'1497-08',region:'Ocean',note:'Months only',sourceIds:[]}]);
 const first=advanceMovieClock(1497,10,20,new PlaybackIndex([]),[],true,periods);
 assert.equal(first.date,dateValue('1497-05-01'),'period boundary is a display threshold');
 assert.equal(first.boundary,true);
 assert.ok(advanceMovieClock(first.date,1,20,new PlaybackIndex([]),[],true,periods).date-first.date<0.13,'smart playback slows during period-only journeys too');
});
