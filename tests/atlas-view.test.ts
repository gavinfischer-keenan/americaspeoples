import test from 'node:test';
import assert from 'node:assert/strict';
import { recordsForView, retainCurrentSelection, canSelect } from '../src/atlas-view';
import { dataset } from '../src/published-data';

test('Movie has only current dated evidence and cannot retain unrelated selection', () => {
  const view=recordsForView(dataset.records,'movie',1200);
  assert.equal(view.context.length,0);
  assert.ok(view.dated.length>0);
  for(const r of view.dated) assert.ok(r.time.start!==null && r.time.end!==null && r.time.start<=1200 && r.time.end>=1200);
  assert.deepEqual(retainCurrentSelection(dataset.records,view.dated,'movie'),view.dated);
});
test('Explore ignores movie year while retaining unresolved chronology separately', () => {
  const a=recordsForView(dataset.records,'explore',1200),b=recordsForView(dataset.records,'explore',-20000);
  assert.deepEqual(a,b);
  assert.ok(a.context.length>0);
  assert.equal(a.dated.length+a.context.length,dataset.records.length);
  assert.ok(canSelect('explore',true));
  assert.ok(!canSelect('movie',true));
  assert.ok(canSelect('movie',false));
});
test('Movie cannot retain an inactive proposal merely because its base ID is current', () => {
  const base={id:'same-site'},suggestion={id:'same-site',proposalKey:'0'};
  assert.deepEqual(retainCurrentSelection([base,suggestion],[base],'movie'),[base]);
  assert.deepEqual(retainCurrentSelection([base,suggestion],[suggestion],'movie'),[suggestion]);
});
