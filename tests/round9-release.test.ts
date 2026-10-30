import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dataset} from '../src/published-data';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));

test('round9 accounts for all received topics and only links published records',()=>{
 const report=read('data/round9-synthesis.json');
 assert.equal(report.intakeFiles,35);
 assert.equal(report.topicDecisions.length,17);
 assert.equal(new Set(report.topicDecisions.map((x:any)=>x.topic)).size,17);
 assert.ok(report.newSourceCheckedRecords>=80);
 assert.equal(report.recordIds.length,report.newSourceCheckedRecords);
 for(const id of report.recordIds)assert.ok(dataset.records.some(r=>r.id===id),id);
 assert.ok(report.groups.some((x:any)=>x.held.length));
});

test('regional census counts and architectural counts never become city populations',()=>{
 const rows=dataset.records.filter(r=>r.id.startsWith('r9v-census-'));
 assert.equal(rows.length,14);
 assert.ok(rows.every(r=>r.overlay?.kind==='population-history'&&!r.population));
 const series=read('data/colonial-population-series.json');
 assert.equal(series.series.length,13);
 assert.deepEqual(series.series.find((x:any)=>x.region==='Virginia').samples,[{year:1700,estimate:58560},{year:1750,estimate:231033},{year:1780,estimate:538004}]);
 const sanco=dataset.records.find(r=>r.id==='r9v-inca-sanco-1572-count')!;
 assert.equal(sanco.population,undefined);
 assert.ok(sanco.review.limitations.toLowerCase().includes('hamlet'));
});

test('source-specific chronology, conflict alternatives and relative dates remain explicit',()=>{
 const rows=dataset.records.filter(r=>r.id.startsWith('r9v-'));
 assert.ok(rows.every(r=>r.sources.length&&r.claims.every(c=>c.support.length)));
 assert.ok(rows.every(r=>r.review.limitations.length>30));
 const decommission=dataset.records.find(r=>r.id==='r9v-sw-pot-decommission')!;
 assert.match(decommission.claims[0].text,/no evidence of conflict/);
 const trants=dataset.records.find(r=>r.id==='r9v-cc-trants-carnelian-production')!;
 assert.equal(trants.time.kind,'unplaced');
 const alternative=dataset.records.find(r=>r.id==='r9v-inca-machupicchu-bayesian-alternative')!;
 assert.ok(alternative.time.certainStart!==undefined||alternative.review.limitations.length>50);
 assert.match(readFileSync('docs/round9-synthesis.html','utf8'),/coverage-audit.html/);
 assert.doesNotMatch(readFileSync('docs/round9-synthesis.html','utf8'),/C:\\|C:\/Users|\.codex\/attachments/);
});
