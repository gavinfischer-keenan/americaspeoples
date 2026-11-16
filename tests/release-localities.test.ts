import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dataset} from '../src/published-data';
import coverage from '../data/coverage-audit.json';

const row=(id:string)=>{const record=dataset.records.find(r=>r.id===id);assert.ok(record,id);return record;};
test('repeated observations at one named locality retain one place identity',()=>{
 const groups=[
  ['au-cloggs-installation-early','au-cloggs-installation-later'],
  ['au-karnatukul-onset','au-karnatukul-lgm'],
  ['sovereignty-iolani-palace','sovereignty-hawaii-1887','sovereignty-hawaii-accession','sovereignty-hawaii-overthrow','sovereignty-hawaii-imprisonment','sovereignty-hawaii-petitions','sovereignty-hawaii-annexation','sovereignty-hawaii-territory'],
  ['sovereignty-florida-signing','sovereignty-alaska-signing','sovereignty-alaska-payment','context-fur-convention-1911'],
  ['sovereignty-gadsden-signing','sovereignty-gadsden-revised'],
  ['context-fur-ross-1812','context-fur-ross-sale-1841'],
  ['context-whaling-dartmouth-1767','context-whaling-morgan-1841','context-whaling-morgan-1921'],
  ['sovereignty-wybalenna','sovereignty-oyster-cove'],
  ['sovereignty-parihaka-community','sovereignty-parihaka-prisoners','sovereignty-parihaka-invasion'],
 ];
 for(const ids of groups){assert.equal(new Set(ids.map(id=>row(id).location?.id)).size,1,ids.join(', '));}
 assert.notEqual(row('gap-popo-village').location?.id,row('gap-mirimua-relocation').location?.id,'nearby relocated villages remain distinct');
 assert.notEqual(row('sovereignty-iolani-palace').location?.id,row('context-mission-honolulu-1820').location?.id,'palace and broader port locality are not conflated by rounded coordinates');
});

test('actual Australian gap ranking counts the two Cloggs phases once',()=>{
 const region=coverage.matrix.find(r=>r.region==='Australia')!;
 const cell=region.periods.find(c=>c.start===-9998)!;
 const expected=new Set(cell.localRecordIds.map(id=>id.startsWith('au-cloggs-installation-')?'Cloggs':row(id).location!.id));
 assert.equal(cell.localityCount,expected.size,'separate installations do not erase a sparse regional gap');
 assert.ok(coverage.gapCells.some(g=>g.region==='Australia'&&g.start===cell.start&&g.localityCount===cell.localityCount));
});

test('generated gap guide names the supported Alabama cultural periods',()=>{
 const guide=readFileSync('docs/world-coverage-audit.md','utf8');
 assert.match(guide,/Early Classic and Late Postclassic Alabama phases/);
 assert.doesNotMatch(guide,/Early and Late Postclassic Alabama phases/);
});
