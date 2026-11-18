import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {siteGuides} from '../src/site-guides';
import {dataset} from '../src/published-data';
import {stories} from '../src/stories';
import {validateRecord} from '../src/validation';
const read=(name:string)=>{const p=new URL('../data/'+name,import.meta.url);return existsSync(p)?JSON.parse(readFileSync(p,'utf8')):null;};
const baseline=read('coverage-15-baseline.json');
const expansion=read('coverage-15-expansion-records.json');

test('the fifteen selected gaps each have local evidence, a guide and a shared-clock story',()=>{
 assert.ok(expansion,'integrated regional evidence');assert.equal(baseline.regions.length,15);
 for(const region of baseline.regions){
  const guide=siteGuides.find(g=>g.id===region.id);assert.ok(guide,region.id);
  const records=expansion.records.filter((r:any)=>guide.recordIds.includes(r.id));
  assert.ok(records.length>=4,region.id+' needs substantive local additions');
  assert.ok(new Set(records.map((r:any)=>r.location.id)).size>=3,region.id+' must add multiple places');
  assert.ok(stories.some(s=>s.id===guide.storyId&&s.scenes.length>=4),region.id);
  for(const r of records){assert.deepEqual(validateRecord(r),[],r.id);assert.ok(dataset.records.some(d=>d.id===r.id));}
 }
});

test('regional source support stays public while private excerpts stay out of data and guides',()=>{
 assert.ok(expansion);
 const pages=read('site-guide-content.json').pages;
 for(const region of baseline.regions){
  const page=pages.find((p:any)=>p.id===region.id);assert.ok(page,region.id);
  assert.ok(page.sections.length>=4,region.id);
  assert.ok(page.sources.length>=2,region.id);
 }
 const serialized=JSON.stringify(expansion);
 assert.doesNotMatch(serialized,/privateSupport/);
 for(const r of expansion.records){assert.ok(r.time.start!==null&&r.time.end!==null);assert.ok(r.sources.every((s:any)=>s.access.trim()));}
});
