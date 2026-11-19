import test from 'node:test';
import assert from 'node:assert/strict';
import { comparisonHTML } from '../src/review';
import { fixture, proposal } from './fixtures';

test('batch comparisons preserve change counts while deferring their full source text', () => {
  const p = proposal();
  p.baseRecord = fixture();
  p.baseRevision = 1;
  p.record = structuredClone(p.baseRecord);
  p.record.review.summary = 'Changed summary <with literal markup>.';
  const full = comparisonHTML(p);
  const deferred = comparisonHTML(p, true);
  assert.match(full, /1 changed fields/);
  assert.equal(deferred.match(/<summary>.*?<\/summary>/)?.[0], full.match(/<summary>.*?<\/summary>/)?.[0]);
  assert.match(deferred, /data-comparison-pending/);
  assert.doesNotMatch(deferred, /<pre>|Changed summary/);
  assert.match(full, /Changed summary &lt;with literal markup&gt;/);
});

test('normal individual review comparisons retain the unchanged-record explanation', () => {
  const p = proposal();
  p.baseRecord = structuredClone(p.record);
  p.baseRevision = 1;
  assert.match(comparisonHTML(p), /No record fields changed/);
  assert.match(comparisonHTML(p, true), /0 changed fields/);
  assert.doesNotMatch(comparisonHTML(p, true), /No record fields changed/);
  assert.equal(comparisonHTML({ ...p, baseRecord: null }, true), '');
});
