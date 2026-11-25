import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dataset } from "../src/published-data";
import { importWorkbook } from "../src/xlsx-import";
import { workbookReferenceId } from '../scripts/workbook-reference';

test("shipped XLSX template imports cleanly as a valid correction against the published dataset", async () => {
  const bytes = await readFile("templates/americas-peoples-import.xlsx");
  const pack = await importWorkbook(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    dataset.records,
  );
  assert.ok(pack.proposals.length >= 1, "expected sample proposal in template");
  for (const p of pack.proposals) {
    assert.equal(p.kind, "correction");
    assert.ok(p.baseRecord, `${p.record.id} base record should match`);
    assert.ok(p.record.sources.length >= 1, `${p.record.id} must include sources`);
    assert.ok(p.record.claims.length >= 1, `${p.record.id} must include claims`);
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
