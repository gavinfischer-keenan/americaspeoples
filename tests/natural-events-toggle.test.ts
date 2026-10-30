import test from 'node:test';
import assert from 'node:assert/strict';
import { effectiveClimateHidden } from '../src/physical-rules';

test('natural events master switch hides all disasters, preserving climate and preferences', () => {
  const individual = new Set(['tsunami', 'drought']);
  const hidden = effectiveClimateHidden(individual, false);
  for (const kind of ['volcano', 'earthquake', 'tsunami']) assert.ok(hidden.has(kind));
  assert.ok(hidden.has('drought'));
  assert.ok(!hidden.has('el-nino'));
  assert.deepEqual([...individual], ['tsunami', 'drought']);
  assert.deepEqual([...effectiveClimateHidden(individual, true)], [...individual]);
});
