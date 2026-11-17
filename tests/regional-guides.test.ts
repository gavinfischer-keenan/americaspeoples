import test from 'node:test';
import assert from 'node:assert/strict';
import {siteGuides} from '../src/site-guides';
import {deepDives,deepDiveIndexHTML} from '../src/deep-dives';
import {stories} from '../src/stories';
import {dataset} from '../src/published-data';
import {guideMovieNavigationHTML} from '../src/guide-navigation';

test('Four Corners is a regional entry with its four existing local studies beneath it',()=>{
 const parent=siteGuides.find(g=>g.id==='four-corners');assert.ok(parent,'regional guide');
 assert.equal(parent.storyId,'four-corners');assert.ok(stories.some(s=>s.id===parent.storyId));
 const html=deepDiveIndexHTML('places');assert.match(html,/data-region="four-corners"/);
 for(const id of ['chaco','mesa-verde','hovenweep','canyons-of-the-ancients']){
  const child=siteGuides.find(g=>g.id===id);assert.ok(child,id);
  assert.equal((child as typeof child&{parentGuideId?:string}).parentGuideId,parent.id,id+' parent');
  const card=deepDives.find(d=>d.id==='place-'+id);assert.ok(card,id+' preserved card');
  assert.equal(html.split(`data-dive="place-${id}"`).length-1,1,id+' not duplicated');
 }
});

test('guide hierarchy is resolvable and has no cycles or false historical ownership',()=>{
 for(const child of siteGuides){
  const seen=new Set([child.id]);let cursor=child as typeof child&{parentGuideId?:string};
  while(cursor.parentGuideId){
   assert.equal(seen.has(cursor.parentGuideId),false,child.id+' hierarchy cycle');seen.add(cursor.parentGuideId);
   const p=siteGuides.find(g=>g.id===cursor.parentGuideId);assert.ok(p,child.id+' missing parent');cursor=p;
  }
  for(const id of child.referenceRecordIds??[])assert.ok(dataset.records.some(r=>r.id===id),child.id+' unresolved reference '+id);
 }
 const owners=siteGuides.flatMap(g=>g.recordIds);assert.equal(new Set(owners).size,owners.length);
});

test('regional and local movie links expose the same shared world, with referenced studies first',()=>{
 const region=siteGuides.find(g=>g.id==='four-corners');assert.ok(region);
 const bonito=siteGuides.find(g=>g.id==='pueblo-bonito');assert.ok(bonito);
 assert.equal(bonito.parentGuideId,'chaco');
 const html=guideMovieNavigationHTML('chaco-connections',bonito.referenceRecordIds??[]);
 assert.match(html,/#story\/four-corners/);assert.match(html,/#story\/pueblo-bonito/);
 assert.match(guideMovieNavigationHTML('pueblo-bonito',[]),/#story\/chaco-connections/);
 assert.match(html,/share the world timeline/);
});
