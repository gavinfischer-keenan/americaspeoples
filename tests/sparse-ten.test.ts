import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {dataset} from '../src/published-data';
import {topicOnlyIds} from '../src/topic-dives';
import {validateRecord} from '../src/validation';
import type {EvidenceRecord} from '../src/model';
import {historyState} from '../src/history';

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

