import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { unzipSync, zipSync, strFromU8, strToU8 } from "fflate";
import { importWorkbook } from "../src/xlsx-import";
import data from "../data/evidence.json";
import type { Dataset } from "../src/model";
const records = (data as Dataset).records;
const template = async () =>
  new Uint8Array(await readFile("templates/americas-peoples-import.xlsx"));
const buffer = (bytes: Uint8Array) => bytes.slice().buffer as ArrayBuffer;
test("the delivered XLSX template imports its real sample, references and explicit location claim", async () => {
  const pack = await importWorkbook(buffer(await template()), records);
  assert.equal(pack.proposals.length, 1);
  const p = pack.proposals[0];
  assert.equal(p.kind, "correction");
  assert.equal(p.record.id, "lanse-1021");
  assert.equal(p.record.time.start, 1021);
  assert.equal(p.record.sources.length, 2);
  assert.equal(p.record.claims.length, 2);
  assert.equal(p.record.claims[1].support[0].sourceId, "unesco-lanse-location");
  assert.equal(p.state, "draft");
});
test("formula cells are rejected instead of being evaluated or imported as cached results", async () => {
  const parts = unzipSync(await template());
  const sheet = "xl/worksheets/sheet2.xml";
  const xml = strFromU8(parts[sheet]);
  assert.match(xml, /<(?:x:)?c\b[^>]*r="A2"/);
  parts[sheet] = strToU8(
    xml.replace(
      /<(?:x:)?c\b[^>]*r="A2"[^>]*>[\s\S]*?<\/(?:x:)?c>/,
      '<x:c r="A2"><x:f>1+1</x:f><x:v>2</x:v></x:c>',
    ),
  );
  await assert.rejects(
    () => importWorkbook(buffer(zipSync(parts)), records),
    /formulas are not supported/,
  );
});
test("macro files, expanded bombs and unexpected worksheets cannot enter the app", async () => {
  const parts = unzipSync(await template());
  parts["xl/vbaProject.bin"] = new Uint8Array([1]);
  await assert.rejects(
    () => importWorkbook(buffer(zipSync(parts)), records),
    /Macro/,
  );
  delete parts["xl/vbaProject.bin"];
  parts["huge.xml"] = new Uint8Array(20_000_001);
  await assert.rejects(
    () => importWorkbook(buffer(zipSync(parts)), records),
    /expanded/,
  );
  delete parts["huge.xml"];
  parts["xl/workbook.xml"] = strToU8(
    strFromU8(parts["xl/workbook.xml"]).replace(
      'name="References"',
      'name="ReferenceTypo"',
    ),
  );
  await assert.rejects(
    () => importWorkbook(buffer(zipSync(parts)), records),
    /Unexpected worksheet/,
  );
  await assert.rejects(
    () => importWorkbook(new ArrayBuffer(5_000_001), records),
    /5 MB/,
  );
});
test("a forged ZIP size never reaches the second parser as an original compressed stream", async () => {
  const parts = unzipSync(await template());
  parts["huge.xml"] = new Uint8Array(21_000_000);
  const bytes = zipSync(parts),
    view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let patched = false;
  for (let i = 0; i < bytes.length - 46; i++)
    if (view.getUint32(i, true) === 0x02014b50) {
      const length = view.getUint16(i + 28, true),
        name = strFromU8(bytes.subarray(i + 46, i + 46 + length));
      if (name === "huge.xml") {
        view.setUint32(i + 24, 1, true);
        patched = true;
        break;
      }
    }
  assert.ok(patched);
  // The second parser receives a new, stored ZIP containing only the bounded buffers.
  const result = await importWorkbook(buffer(bytes), records);
  assert.equal(result.proposals.length, 1);
});
