import test from 'node:test';
import assert from 'node:assert/strict';
import {dataset} from '../src/published-data';
import {readerDateMeaning} from '../src/reader-evidence';
import {historyLabel,historyState} from '../src/history';
const get=(id:string)=>{const r=dataset.records.find(r=>r.id===id);assert.ok(r,id);return r;};
test('timber harvests remain dated evidence rather than settlement foundations',()=>{
 for(const id of ['g20-chaco-bc51-timber-967','g20-chaco-bc51-timber-1043','g20-mesa-far-view-buried-timbers','g20-mesa-pipe-shrine-late','g20-hove-castle-1277-beam']){
  const r=get(id);assert.equal(r.history?.kind,'attestation',id);
  assert.equal(historyState(r,r.time.end!+1),'past-place');
  assert.doesNotMatch(historyLabel(r,r.time.end!),/Established by|Possible establishment|foundation/i);
 }
 assert.equal(get('g20-salmon-great-kiva-roof1263').history?.kind,'settlement','documented construction is kept distinct from a timber-only sample');
});
test('architecture placed within a broad site period does not acquire a directly dated building event',()=>{
 const rows=dataset.records.filter(r=>r.id.startsWith('g20-mp-')||/^g20-hove-.*-architecture$/.test(r.id)||['g20-cah-mound51','g20-cah-mound60'].includes(r.id));
 assert.equal(rows.length,18);
 for(const r of rows){assert.match(readerDateMeaning(r),/broader period|broad period/i,r.id);assert.doesNotMatch(readerDateMeaning(r),/event or find is dated/i,r.id);assert.doesNotMatch(historyLabel(r,r.time.start!),/Possible establishment/,r.id);}
});
test('attributed artist lifetime is distinguished from painting dates',()=>{
 assert.match(readerDateMeaning(get('g20-chelly-antelope-dibe-yazhi')),/artist.*lived|life.*period/i);
 assert.match(readerDateMeaning(get('g20-cah-monks-start')),/event or find is dated/i,'modeled construction boundary stays a dated occurrence range');
});
