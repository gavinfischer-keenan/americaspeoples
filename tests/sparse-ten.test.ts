import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {dataset} from '../src/published-data';
import {topicOnlyIds} from '../src/topic-dives';
import {validateRecord} from '../src/validation';
import type {EvidenceRecord} from '../src/model';
import {historyLabel,historyState} from '../src/history';

const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const path='data/sparse-ten-expansion-records.json';
test('all ten sparse areas gain source-backed local evidence on the shared map',()=>{
 assert.ok(existsSync(path),'the ten-region evidence collection is published');
 const {records,regionAssignments}=read(path) as {records:EvidenceRecord[],regionAssignments:Record<string,string[]>};
 assert.equal(Object.keys(regionAssignments).length,10);
 assert.equal(new Set(records.map(r=>r.id)).size,records.length);
 for(const [region,ids] of Object.entries(regionAssignments)){
  const local=records.filter(r=>ids.includes(r.id)&&r.location&&!r.overlay&&r.type!=='movement');
  assert.ok(local.length>0,region+' has accepted dated local evidence');
  assert.ok(local.every(r=>r.time.start!==null&&r.time.end!==null),region);
 }
 for(const r of records){
  assert.deepEqual(validateRecord(r),[],r.id);
  assert.deepEqual(dataset.records.find(x=>x.id===r.id),r);
  assert.ok(!topicOnlyIds.has(r.id));
  assert.ok(r.sources.every(s=>r.claims.some(c=>c.support.some(x=>x.sourceId===s.id))),r.id+' links every citation');
  assert.ok(r.overlay?.geometry?.type==='LineString'||(r.location?.precision&&r.location?.provenance),r.id+' has public geographic precision or a schematic connection');
  assert.ok(r.review.summary.length>60&&r.review.discussion.length>60,r.id+' explains actual history');
 }
});

test('new local histories distinguish sample gaps, village continuity and documented departure',()=>{
 const get=(id:string)=>dataset.records.find(r=>r.id===id)!;
 const orona=get('st-ki-orona-hull2');
 assert.equal(historyState(orona,1300),'active');
 assert.equal(historyState(orona,1330),'past-place');
 assert.equal(historyState(orona,1360),'active');
 assert.equal(orona.history?.endEvidence,undefined);
 const camp=get('st-ki-kiritimati-early-estate');
 assert.equal(historyState(camp,1904),'active');
 assert.equal(historyState(camp,1908),'past-place');
 assert.equal(camp.history?.endEvidence?.start,1905);
 assert.equal(historyState(get('st-ki-london-copra-estate'),1908),'outside');
 assert.equal(historyState(get('st-ki-london-copra-estate'),1913),'active');
 for(const id of ['st-ki-koinawa-village','st-ki-butaritari-town','st-la-charenton-community'])
  assert.equal(historyState(get(id),1934),'active',id);
 const route=get('st-ki-sydney-butaritari-alexa');
 assert.equal(historyState(route,1911),'outside');
 assert.equal(historyState(route,1912),'active');
 assert.equal(historyState(route,1930),'outside');
 assert.equal(route.overlay?.direction,'both');
 assert.equal(get('st-ki-tataga-matau-manra').history?.connection?.cessation,'unknown');
 assert.match(get('st-ki-tataga-matau-manra').history?.connection?.note??'',/find-context/);
});

test('shared identities and geographic assignments survive the source merge',()=>{
 const {records,regionAssignments}=read(path) as {records:EvidenceRecord[],regionAssignments:Record<string,string[]>};
 assert.ok(!records.some(r=>r.id==='st-us-boa-ogoi-bear-river'));
 const hellGap=records.find(r=>r.id==='st-us-hell-gap-dated-locality-1')!;
 assert.deepEqual(hellGap.location,dataset.records.find(r=>r.id==='r10v-wyoming-hellgap')!.location);
 assert.ok(regionAssignments['Wyoming — eastern plains'].includes('st-us-fort-phil-kearny-bozeman'));
 assert.ok(!regionAssignments['Montana — central / eastern plains'].includes('st-us-fort-phil-kearny-bozeman'));
 const early=records.find(r=>r.id==='st-la-marsh-enslaved-community')!;
 const later=records.find(r=>r.id==='st-la-marsh-after-emancipation')!;
 assert.deepEqual(early.location,later.location);
 assert.equal(early.history?.endEvidence,undefined,'emancipation is not an abandonment event');
 assert.equal(later.time.start,early.time.end);
});

test('McKean records the departure of its guano camp workers in 1870',()=>{
 const camp=dataset.records.find(r=>r.id==='st-ki-mckean-guano')!;
 assert.equal(historyState(camp,1869),'active');
 assert.equal(historyState(camp,1871),'past-place');
 assert.deepEqual([camp.history?.endEvidence?.start,camp.history?.endEvidence?.end],[1870,1870]);
 assert.match(historyLabel(camp,1871),/Documented local abandonment.*1,?870.*guano camp/);
});

test('Wind River arrival distinguishes treaty context from March 1878 evidence',()=>{
 const arrival=dataset.records.find(r=>r.id==='st-us-wind-river-northern-arapaho-arrive')!;
 const citations=arrival.claims.find(c=>c.id==='locality')!.support;
 assert.equal(citations.find(s=>s.sourceId==='st-us-src-wind-river-1')?.stance,'context');
 assert.equal(citations.find(s=>s.sourceId==='st-us-src-wind-river-2')?.stance,'supports');
 const treaty=dataset.records.find(r=>r.id==='st-us-wind-river-reservation-agency')!;
 assert.ok(treaty.claims.some(c=>c.support.some(s=>s.sourceId==='st-us-src-wind-river-1'&&s.stance==='supports')));
});

test('Owl Cave citations identify the publications by title and author',()=>{
 const cave=dataset.records.find(r=>r.id==='st-us-wasden-owl-cave')!;
 const paper=cave.sources.find(s=>s.id==='st-us-src-wasden-owl-cave-2')!;
 const comparison=cave.sources.find(s=>s.id==='st-us-src-wasden-owl-cave-3')!;
 assert.equal(paper.title,'Owl Cave Revisited: Examining the Evidence for a Folsom-Bison Association');
 assert.match(paper.authors,/L\. Suzann Henrikson.*Daron Duke/);
 assert.equal(comparison.title,'Bayesian Revision of the Folsom Age Range Using IntCal20');
 assert.match(comparison.authors,/Briggs Buchanan.*Todd A\. Surovell/);
});

test('sparse audit preserves the baseline when an earlier evidence record is retired',()=>{
 const root=mkdtempSync(join(tmpdir(),'sparse-baseline-'));
 try {
  mkdirSync(join(root,'data')); mkdirSync(join(root,'docs'));
  for(const name of ['sparse-ten-expansion-records','sparse-ten-source-decisions','coverage-audit']){
   const path=`data/${name}.json`;
   writeFileSync(join(root,path),readFileSync(path));
  }
  const path='data/sparse-ten-baseline.json';
  const baseline=read(path);
  const montana=baseline.regions.find((r:any)=>r.region==='Montana — central / eastern plains');
  montana.evidence[0].id='retired-record-id';
  writeFileSync(join(root,path),JSON.stringify(baseline));
  const run=()=>spawnSync(process.execPath,['--import',pathToFileURL(resolve('node_modules/tsx/dist/loader.mjs')).href,resolve('scripts/sparse-ten-audit.ts')],{cwd:root,encoding:'utf8'});
  const audit=run();
  assert.equal(audit.status,0,audit.stderr);
  const result=read(join(root,'data/sparse-ten-coverage.json'));
  assert.deepEqual(result.regions.find((r:any)=>r.region===montana.region).beforeLocalityIds,['anzick']);
  montana.places++;
  writeFileSync(join(root,path),JSON.stringify(baseline));
  const mismatch=run();
  assert.notEqual(mismatch.status,0);
  assert.match(mismatch.stderr,/Baseline place count.*Montana/);
 } finally {rmSync(root,{recursive:true,force:true});}
});

test('sparse coverage compares the same geographic bins and never inflates localities with phases',()=>{
 assert.ok(existsSync('data/sparse-ten-coverage.json'),'published comparison exists');
 const report=read('data/sparse-ten-coverage.json');
 assert.equal(report.version,dataset.version);
 assert.equal(report.baselineVersion,'0.25.0');
 assert.equal(report.regions.length,10);
 for(const r of report.regions){
  assert.ok(r.afterLocalityIds.length>r.beforeLocalityIds.length,r.region);
  assert.equal(new Set(r.afterLocalityIds).size,r.afterLocalityIds.length);
  assert.ok(r.periods.length===12);
 }
 const idaho=report.regions.find((r:any)=>r.region==='Idaho — southern / central');
 assert.equal(idaho.beforeLocalityIds.length,0);
 assert.ok(!idaho.recordIds.includes('visit-lewis-clark-pacific-1804-1806-3'));
});

