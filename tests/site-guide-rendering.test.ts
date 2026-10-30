import test from 'node:test';
import assert from 'node:assert/strict';
import { researchMarkdown } from '../scripts/site-guide-build';
import { siteGuides } from '../src/site-guides';
import { dataset } from '../src/published-data';

test('research renderer preserves linked citation labels and blocks executable content', () => {
  const html = researchMarkdown('# Report\n\nClaim [[1.2]](https://example.org/paper).\n\n<script>alert(1)</script>');
  assert.match(html, /href="https:\/\/example.org\/paper"[^>]*>\[1\.2\]<\/a>/);
  assert.ok(!html.includes('<script>'));
  assert.throws(() => researchMarkdown('[bad](javascript:alert%281%29)'), /Unsafe research link/);
  assert.match(researchMarkdown('[Historical source](http://example.org/paper)\n\nContact author@example.org'), /http:\/\/example.org\/paper/);
});
test('every explicit linked record exists in the published atlas', () => {
  const ids = new Set(dataset.records.map(r => r.id));
  for (const guide of siteGuides) for (const id of guide.recordIds) assert.ok(ids.has(id), id);
});
