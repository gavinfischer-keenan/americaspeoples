import test from 'node:test';
import assert from 'node:assert/strict';
import * as guides from '../src/site-guides';

test('site guides resolve explicit record IDs without title guessing', () => {
  assert.equal(guides.guideForRecord('unrelated-id'), undefined);
  const rows = guides.siteGuides;
  assert.ok(rows.length > 0);
  for (const row of rows) {
    assert.match(row.href, /^sites\/[a-z0-9-]+\.html$/);
    if(row.kind !== 'culture') assert.ok(row.recordIds.length > 0);
    for (const id of row.recordIds) assert.equal(guides.guideForRecord(id)?.id, row.id);
  }
  assert.equal(new Set(rows.flatMap(r => r.recordIds)).size, rows.flatMap(r => r.recordIds).length);
});
