import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dataset } from "../src/published-data";
import { importWorkbook } from "../src/xlsx-import";
import { workbookReferenceId } from '../scripts/workbook-reference';
test("complete published workbook retains dates, claims, sources and overlay geometry on import", async () => {
  const bytes = await readFile(
    "templates/americas-peoples-researched-import.xlsx",
  );
  const pack = await importWorkbook(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    dataset.records,
  );
  assert.equal(pack.proposals.length, dataset.records.length);
  for (const r of dataset.records) {
    const p = pack.proposals.find((p) => p.record.id === r.id)!;
    assert.ok(p, r.id);
    assert.equal(p.kind, "correction");
    assert.deepEqual(p.baseRecord, r);
    assert.equal(p.record.time.start, r.time.start);
    assert.equal(p.record.time.end, r.time.end);
    assert.equal(p.record.time.kind, r.time.kind);
    assert.equal(p.record.time.eventDate,r.time.eventDate);
    assert.deepEqual(p.record.overlay, r.overlay);
    assert.deepEqual(p.record.population, r.population);
    assert.deepEqual(p.record.linguistics, r.linguistics);
    assert.deepEqual(p.record.history, r.history);
    assert.deepEqual(
      p.record.claims.map((c) => [c.id, c.text, c.status, c.explanation]),
      r.claims.map((c) => [c.id, c.text, c.status, c.explanation]),
    );
    for (const s of r.sources) {
      const actual = p.record.sources.find((x) => x.id === workbookReferenceId(r.id,s.id))!;
      assert.ok(actual, `${r.id}: ${s.id}`);
      assert.equal(actual.title, s.title);
      assert.equal(actual.url, s.url);
      assert.equal(actual.access, s.access);
    }
    assert.equal(
      p.record.claims.flatMap((c) => c.support).length,
      r.claims.flatMap((c) => c.support).length,
    );
  }
});

test('long workbook references retain unique bounded identities', () => {
  assert.equal(workbookReferenceId('visit','source'),'visit--source');
  const prefix='visit-'+ 'a'.repeat(110);
  const a=workbookReferenceId(prefix+'1','long-source');
  const b=workbookReferenceId(prefix+'2','long-source');
  assert.match(a,/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/);
  assert.notEqual(a,b);
  assert.equal(a,workbookReferenceId(prefix+'1','long-source'));
});
