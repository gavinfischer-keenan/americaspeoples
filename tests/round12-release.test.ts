import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dataset} from '../src/published-data';
const reviewed=JSON.parse(readFileSync('data/round12-reviewed.json','utf8'));
const get=(id:string)=>dataset.records.find(r=>r.id===id)!;

test('round12 keeps original calibrated contexts separate from modeled duration and population',()=>{
 assert.deepEqual([get('r12v-amaknak-s2-floor').time.start,get('r12v-amaknak-s2-floor').time.end],[-1769,-1519]);
 assert.deepEqual([get('r12v-amaknak-s7-main-room').time.start,get('r12v-amaknak-s7-main-room').time.end],[-1279,-819]);
 const model=get('r12v-coxcatlan-el-riego');
 assert.match(model.time.original,/median/i);
 assert.match(JSON.stringify(model.review),/boundar|credible|duration/i);
 const mining=get('r12v-sagitario-p06');
 assert.match(mining.time.original,/10013|11720/);
 assert.ok(mining.overlay,'cave activity has only regional public display context');
 for(const r of reviewed.records)assert.equal(r.population,undefined,'sample and building counts are not resident estimates');
});

test('named-site classification corrections preserve archaeological claims and dates',()=>{
 for(const id of ['curacao-c1426-basal','curacao-c1426-f001','aruba-canashito-burial']){
  const u=reviewed.proposedUpdates.find((u:any)=>u.targetId===id);
  assert.deepEqual(u.record.time,u.beforeRecord.time);
  for(const old of u.beforeRecord.claims){const current=u.record.claims.find((c:any)=>c.id===old.id);assert.deepEqual({...current,support:old.support},old);for(const link of current.support.filter((s:any)=>!old.support.some((o:any)=>JSON.stringify(o)===JSON.stringify(s))))assert.equal(link.stance,'context');}
  assert.ok(u.record.location);assert.equal(u.record.overlay,undefined);
  assert.match(u.record.location.precision,/approximate|landscape|coarse/i);
 }
 const u=reviewed.proposedUpdates.find((u:any)=>u.targetId==='r5-cuncaicha-early');
 for(const old of u.beforeRecord.claims)assert.ok(u.record.claims.some((c:any)=>JSON.stringify(c)===JSON.stringify(old)),'older study evidence must survive a chronology revision');
 assert.equal(get('curacao-c1426-basal').location!.id,get('curacao-c1426-f001').location!.id,'separate samples do not become separate settlements');
});

test('round12 accounts for independent sequential research and explicit versioned updates',()=>{
 const report=JSON.parse(readFileSync('data/round12-synthesis.json','utf8'));
 const rows=dataset.records.filter(r=>r.id.startsWith('r12v-'));
 assert.equal(reviewed.deepQueries,10);assert.equal(rows.length,68);
 assert.equal(report.publishedRecordCount,962);assert.equal(report.approvedUpdates.length,7);
 assert.equal(new Set(reviewed.records.map((r:any)=>r.id)).size,68);
 assert.equal(new Set(reviewed.proposedUpdates.map((u:any)=>u.targetId)).size,7);
 for(const u of reviewed.proposedUpdates)assert.equal(u.record.revision,u.beforeRecord.revision+1);
 assert.doesNotMatch(readFileSync('docs/round12-synthesis.html','utf8'),/C:\\|C:\/Users|\.codex\/attachments/);
});
