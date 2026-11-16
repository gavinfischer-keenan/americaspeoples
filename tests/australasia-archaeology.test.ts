import test from 'node:test';
import assert from 'node:assert/strict';
import {dataset} from '../src/published-data';
import {topics,topicOnlyIds} from '../src/topic-dives';
import {historyState} from '../src/history';
const row=(id:string)=>{const r=dataset.records.find(r=>r.id===id);assert.ok(r,'Missing '+id);return r;};
test('Australasian sites retain measured phases, calendar conversions and shared membership',()=>{
 for(const [id,start,end] of [['au-riwi-onset',-44450,-42650],['au-karnatukul-onset',-48060,-43240],['au-karnatukul-lgm',-23420,-15980],['au-gabarnmang-onset',-44140,-42320],['au-cloggs-installation-early',-11000,-9470],['au-cloggs-installation-later',-10470,-8770],['nz-purakaunui-stores',1430,1460],['nz-otahau-palisade',1764,1772]] as const){
  const r=row(id);assert.deepEqual([r.time.start,r.time.end],[start,end]);assert.ok(!topicOnlyIds.has(id));assert.ok(r.location?.precision&&r.location.provenance);assert.ok(r.sources[0].url&&r.claims[0].support[0].locator);assert.notEqual(historyState(r,end+100),'active');
 }
 assert.match(row('au-karnatukul-onset').location!.precision,/general|regional/i);
 assert.match(row('au-cloggs-installation-early').review.limitations,/residen|village/i);
 assert.ok(row('nz-purakaunui-stores').location!.lat> -46);
});
test('new built landscape joins the sweet potato movie without turning a crop into a town lifespan',()=>{
 const t=topics.find(t=>t.id==='sweet-potatoes')!;
 assert.ok(t.recordIds.includes('nz-purakaunui-stores'));
 assert.ok(t.scenes.some(s=>s.year===1445&&s.recordIds.includes('nz-purakaunui-stores')));
 assert.match(row('nz-purakaunui-stores').review.limitations,/cultivation/);
});
