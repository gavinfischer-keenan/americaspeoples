import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dataset} from '../src/published-data';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
test('round10 reconciles receipts and publishes only explicitly reviewed findings',()=>{
 const report=read('data/round10-synthesis.json');
 const rows=dataset.records.filter(r=>r.id.startsWith('r10v-'));
 assert.equal(rows.length,54);assert.equal(report.newSourceCheckedRecords,54);
 assert.equal(report.intakeFiles,37);assert.equal(report.uniqueFileHashes,31);
 assert.equal(report.paperLeadIndex.length,40);assert.equal(report.held.length,52);
 assert.equal(new Set(report.recordIds).size,54);
 for(const r of rows){
  assert.ok(report.recordIds.includes(r.id));
  assert.ok(r.sources.length&&r.claims.every(c=>c.support.length));
  assert.equal(r.population,undefined,'artifact/sample counts must not size residents');
 }
 assert.equal(read('data/intake-queue-round10.json').status,'release-screened');
});
test('source-specific phase windows and unresolved one-sided dating remain distinct',()=>{
 const get=(id:string)=>dataset.records.find(r=>r.id===id)!;
 assert.deepEqual([get('r10v-nevada-lsc-white-hearth').time.start,get('r10v-nevada-lsc-white-hearth').time.end],[-10424,-9877]);
 assert.deepEqual([get('r10v-nevada-lsc-lower-shell-hearth').time.start,get('r10v-nevada-lsc-lower-shell-hearth').time.end],[-8254,-7845]);
 for(const id of ['r10v-idaho-wewukiyepuh','r10v-gulf-canoe-canal','r10v-amaknak-bridge-architecture'])assert.equal(get(id).time.kind,'unplaced',id);
 assert.equal(get('r10v-hooumi-layeriv').time.start,1129);
 assert.equal(get('r10v-hooumi-layeriv').time.end,1212);
 assert.match(get('r10v-hooumi-layeriv').review.limitations,/deposit|arrival/i);
 assert.equal(get('r10v-tchefuncte-site').location?.lon,-90);
 assert.match(get('r10v-nevada-silverzone').review.limitations,/inferred|comparable/i);
 const page=readFileSync('docs/round10-synthesis.html','utf8');
 assert.match(page,/coverage-audit.html/);
 assert.doesNotMatch(page,/C:\\|C:\/Users|\.codex\/attachments/);
});
