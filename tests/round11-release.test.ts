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
 assert.equal(dataset.records.length,792+records.length);
 assert.equal(report.newSourceCheckedRecords,records.length);
 assert.equal(report.intakeFiles,16);assert.equal(report.uniqueFileHashes,16);
 assert.equal(report.pdfPagesIncludingRepeatReceipts,82);
 for(const topic of ['california','great-lakes','paraguay-uruguay','argentina-chile-deep'])assert.ok(report.intakeTopics.some((x:any)=>x.id===topic));
 const prior=read('data/round10-reviewed.json').records;
 for(const old of prior)assert.deepEqual(dataset.records.find(r=>r.id===old.id),old);
 const page=readFileSync('docs/round11-synthesis.html','utf8');
 assert.match(page,/coverage-audit.html/);assert.doesNotMatch(page,/C:\\|C:\/Users|\.codex\/attachments/);
 assert.equal(read('data/intake-queue-round11.json').status,'release-screened');
});
