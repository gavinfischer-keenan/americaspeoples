import test from 'node:test';
import assert from 'node:assert/strict';
import { historyLabel, historyState, validateHistory } from '../src/history';
import { dataset } from '../src/published-data';
import { mapProjection } from '../src/map-projection';

const occupation=()=>structuredClone(dataset.records.find(r=>r.id==='history-rapa-nui-regional-occupation')!);
test('ongoing habitation is distinguished from an abandonment at the display horizon',()=>{
 const r=occupation();r.time.end=1934;
 r.history={kind:'habitation',claimId:r.claims[0].id,continuity:'ongoing'} as any;
 assert.equal(historyState(r,1934),'active');
 assert.match(historyLabel(r,1934),/continues|ongoing/i);
 assert.doesNotMatch(historyLabel(r,1934),/abandon/i);
 assert.deepEqual(validateHistory(r),[]);
});
test('local abandonment is a sourced interval, with an inferred end kept explicit',()=>{
 const r=occupation();r.time.start=1000;r.time.end=1600;
 r.history={kind:'habitation',claimId:r.claims[0].id,endEvidence:{start:1500,end:1600,meaning:'abandoned',certainty:'inferred',claimId:r.claims[0].id,note:'Last occupation and a later uninhabited observation bound the estimate.'}} as any;
 assert.doesNotMatch(historyLabel(r,1499),/abandon/i);
 assert.match(historyLabel(r,1550),/possible|estimated/i);
 assert.match(historyLabel(r,1650),/inferred.*abandon|estimated.*abandon/i);
 assert.match(historyLabel(r,1650),/1,500.*1,600/);
 assert.doesNotMatch(historyLabel(r,1650),/Documented local abandonment/);
 (r.history as any).endEvidence.claimId='missing';assert.ok(validateHistory(r).length);
});
test('history validation rejects unsupported end metadata rather than silently ignoring it',()=>{
 const r=occupation();r.history={kind:'habitation',claimId:r.claims[0].id,endEvidence:{start:1600,end:1500,meaning:'abandoned',certainty:'inferred',claimId:r.claims[0].id,note:'Invalid reversed dates.'}} as any;
 assert.ok(validateHistory(r).some(s=>/end|ending/i.test(s)));
});
test('Pacific frame retains mainland Southeast Asia, Australia and Aotearoa at wide and mobile sizes',()=>{
 for(const [w,h] of [[1000,400],[360,250],[1440,650]]){
  const p=mapProjection('pacific',w,h);
  for(const point of [[100,15],[113,-22],[147,-44],[168,-47],[-70,42]]){
   const xy=p(point as [number,number])!;assert.ok(xy[0]>=0&&xy[0]<=w&&xy[1]>=0&&xy[1]<=h,`${point} outside ${w}x${h}: ${xy}`);
  }
 }
});
