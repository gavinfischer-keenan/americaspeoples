import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dataset} from '../src/published-data';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));

test('round11 keeps original chronology limits and debate distinct from dated settlements',()=>{
 const get=(id:string)=>dataset.records.find(r=>r.id===id)!;
 const cave=get('r11v-torqua-cave');
 assert.deepEqual([cave.time.start,cave.time.end],[-4215,-3795]);
 assert.equal(cave.overlay,undefined);
 assert.match(cave.review.limitations,/continuous residence/i);
 const dispute=get('r11v-california-polynesian-contact-debate');
 assert.equal(dispute.time.kind,'unplaced');
 assert.equal(dispute.claims[0].status,'disputed');
 assert.ok(dispute.sources.some(s=>s.authors.includes('Anderson')));
 assert.ok(dispute.overlay);
 const language=get('r11v-iroquoian-appearance-debate');
 assert.equal(language.time.kind,'unplaced');
 assert.equal(language.linguistics,undefined,'an interpretive debate cannot paint ancient language territory');
 assert.equal(cave.population,undefined,'dated samples cannot size resident population');
});

test('round11 preserves preceding release evidence and accounts for all archived topics',()=>{
 const report=read('data/round11-synthesis.json');
 const records=dataset.records.filter(r=>r.id.startsWith('r11v-'));
 assert.equal(report.publishedRecordCount,792+records.length);assert.ok(dataset.records.length>=report.publishedRecordCount);
 assert.equal(report.newSourceCheckedRecords,records.length);
 assert.equal(report.intakeFiles,16);assert.equal(report.uniqueFileHashes,16);
 assert.equal(report.pdfPagesIncludingRepeatReceipts,82);
 for(const topic of ['california','great-lakes','paraguay-uruguay','argentina-chile-deep'])assert.ok(report.intakeTopics.some((x:any)=>x.id===topic));
 const prior=read('data/round10-reviewed.json').records;
 for(const old of prior){
  const current=dataset.records.find(r=>r.id===old.id)!;
  const update=read('data/round12-reviewed.json').proposedUpdates.find((u:any)=>u.targetId===old.id);
  const later=read('data/canada-aleutians-corrections.json').updates.find((u:any)=>u.targetId===old.id);
  const local=read('data/shield-aleutian-local-corrections.json').updates.find((u:any)=>u.targetId===old.id);
  if(update){assert.deepEqual(update.beforeRecord,old);assert.ok(current.revision>=update.record.revision);}
  else if(later){assert.deepEqual(later.beforeRecord,old);if(local)assert.deepEqual(local.beforeRecord,later.record);assert.deepEqual(current,local?.record??later.record);assert.ok(current.revision>old.revision);assert.ok(later.reason);}
  else if(current.review.history.some(h=>h.startsWith('2026-11-16: Reader-facing description updated:'))){
   assert.ok(current.revision>old.revision,'reader edits retain their revision history');
   // This later editorial pass changes wording, never the archived chronology,
   // geometry, claims, citations, cultural attribution or other scientific fields.
   assert.deepEqual({...current,revision:old.revision,review:{...current.review,summary:old.review.summary,reviewedAt:old.review.reviewedAt,history:old.review.history}},old);
  }else assert.deepEqual(current,old);
 }
 const page=readFileSync('docs/round11-synthesis.html','utf8');
 assert.match(page,/coverage-audit.html/);assert.doesNotMatch(page,/C:\\|C:\/Users|\.codex\/attachments/);
 assert.equal(read('data/intake-queue-round11.json').status,'release-screened');
});
