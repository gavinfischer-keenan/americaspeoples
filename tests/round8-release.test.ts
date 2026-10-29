import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dataset } from '../src/published-data';
const read = (p:string) => JSON.parse(readFileSync(p,'utf8'));
test('round8 accounts for every candidate and links only real published records',()=>{
 const intake=read('data/intake-round8-candidates.json');
 const review=read('data/round8-synthesis.json');
 assert.equal(review.decisions.length,339);
 assert.deepEqual(new Set(review.decisions.map((d:any)=>d.candidateId)),new Set(intake.candidates.map((c:any)=>c.id)));
 assert.equal(new Set(review.decisions.map((d:any)=>d.candidateId)).size,339);
 for(const d of review.decisions){
  assert.ok(d.reason.length>20);
  assert.ok(['integrated','reconciled-existing','held-source-check'].includes(d.disposition));
  for(const id of d.recordIds) assert.ok(dataset.records.some(r=>r.id===id),id);
  if(d.disposition==='integrated') assert.ok(d.recordIds.length);
 }
});
test('round8 keeps disjoint burials separate and rejects artifact counts as populations',()=>{
 const rows=dataset.records.filter(r=>r.id.startsWith('r8v-'));
 assert.ok(rows.length>=30);
 assert.ok(rows.every(r=>!r.population));
 const first=rows.find(r=>r.id==='r8v-checua-burial-early')!;
 const later=rows.find(r=>r.id==='r8v-checua-burial-late')!;
 assert.deepEqual([first.time.start,first.time.end],[-5630,-5525]);
 assert.deepEqual([later.time.start,later.time.end],[-3240,-3102]);
 assert.equal(first.sources[0].doi,'10.1016/j.quaint.2020.07.040');
 const raw=rows.find(r=>r.id==='r8v-nare-technology')!;
 assert.equal(raw.time.kind,'unplaced');
 assert.equal(raw.time.start,null);
 for(const r of rows){
  assert.ok(r.sources.every(s=>s.access.includes('Checked')));
  assert.ok(r.review.limitations.length>30);
  if(r.overlay?.geometry?.type==='LineString'){
   assert.equal(r.overlay.basis,'schematic');
   assert.ok(r.overlay.precision.includes('not an observed itinerary'));
  }
 }
});
test('round8 public report contains no private filesystem paths or raw report copies',()=>{
 const report=readFileSync('docs/round8-synthesis.html','utf8');
 assert.ok(report.includes('339'));
 assert.ok(!/C:\\|C:\/Users|\.codex\/attachments|Personal, non-commercial use only/.test(report));
 const audit=readFileSync('docs/coverage-audit.html','utf8');
 assert.ok(audit.includes('round8-synthesis.html'));
});
test('colonial AI facts are visible by default and conflicting populations never size markers',()=>{
 const registry=read('data/colonial-ai-registry.json');
 assert.equal(registry.entries.length,49);
 const rows=dataset.records.filter(r=>r.id.startsWith('ai-colony-'));
 assert.equal(rows.length,49);
 for(const r of rows){
  assert.ok(r.title.includes('AI generated facts'));
  assert.ok(r.claims.every(c=>c.text.startsWith('AI generated facts')));
  assert.equal(r.population,undefined);
 }
 assert.ok(rows.find(r=>r.id==='ai-colony-12')!.claims[0].text.includes('Great Britain1763–1783'));
 assert.ok(registry.entries.find((r:any)=>r.id==='ai-colony-16').editorialNote.includes('1610'));
 assert.ok(!rows.find(r=>r.id==='ai-colony-39')!.claims[0].text.includes('1660'));
 assert.ok(!rows.find(r=>r.id==='ai-colony-44')!.claims.some(c=>c.text.includes('precipitated')));
 const early=dataset.records.find(r=>r.id==='r8v-roanoke-1585')!;
 assert.deepEqual([early.time.start,early.time.end],[1585,1586]);
});
