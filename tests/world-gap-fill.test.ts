import test from 'node:test';
import assert from 'node:assert/strict';
import {dataset} from '../src/published-data';
import {topicOnlyIds} from '../src/topic-dives';
import {historyLabel,historyState} from '../src/history';
const row=(id:string)=>{const r=dataset.records.find(r=>r.id===id);assert.ok(r,id);return r;};
test('gap additions supply dated local evidence across neglected regions without topic-only membership',()=>{
 for(const id of ['gap-palmrose-early','gap-palmrose-rebuilding','gap-palmrose-late','gap-galheta-site','gap-popo-village','gap-mirimua-relocation','gap-quaqtaq-dorset','gap-quaqtaq-thule','gap-sermermiut-dorset','gap-alabama-early','gap-alabama-late','gap-kaxil-village','gap-iquique-1907','gap-quadra-clam-gardens']){
  const r=row(id);assert.ok(!topicOnlyIds.has(id));assert.ok(r.location||r.overlay?.geometry);assert.ok(r.time.start!==null&&r.time.end!<=1934);assert.ok(r.sources.length);
 }
 assert.equal(row('gap-palmrose-early').location!.id,row('gap-palmrose-late').location!.id,'phases share one locality');
 assert.deepEqual([row('gap-quaqtaq-dorset').time.start,row('gap-quaqtaq-dorset').time.end],[750,1000]);
 assert.equal(row('gap-iquique-1907').time.eventDate,'1907-12-21');
});
test('source windows, inferred relocation and unresolved specimen dates stay separate',()=>{
 assert.equal(historyState(row('gap-galheta-site'),1600),'past-place');
 assert.match(historyLabel(row('gap-galheta-site'),1600),/does not establish abandonment|does not establish continuous/);
 assert.equal(row('r11v-galheta-continuity').time.kind,'unplaced','a broad site date cannot date the separate genomic specimen');
 assert.equal(row('gap-popo-village').history?.endEvidence?.meaning,'relocated');
 assert.match(row('gap-quaqtaq-thule').review.limitations,/violence|extermination/i);
 assert.ok(row('gap-quadra-clam-gardens').time.start!>-3000,'11,500-year human-clam history is not the date of garden walls');
});

