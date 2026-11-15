import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { EvidenceRecord } from "../src/model";
import { validateRecord, validateDataset } from "../src/validation";
import { historyState } from "../src/history";
const records: EvidenceRecord[] = JSON.parse(readFileSync(new URL("../data/atlantic-expansion-records.json", import.meta.url), "utf8")).records;
const get = (id: string) => { const r = records.find(r => r.id === id); assert.ok(r, id); return r; };

test("Atlantic additions validate with their referenced existing Acadian event", () => {
  assert.ok(records.length >= 15);
  const existing: EvidenceRecord[] = JSON.parse(readFileSync(new URL("../data/research-proposals.json", import.meta.url), "utf8")).proposals.map((p:any)=>p.record);
  const linked = existing.filter(r => r.id === "acadian-deportation-boston1755");
  assert.equal(linked.length, 1);
  for (const r of records) assert.deepEqual(validateRecord(r), [], r.id);
  assert.deepEqual(validateDataset({schemaVersion: 1,version: "test",reviewedAt: "2026-11-15",coverage: "Atlantic additions",license: "Project license",records: [...records, ...linked]}), []);
  for (const r of records) {
    assert.ok(r.time.end! <= 1934);
    assert.equal(r.overlay?.geometry?.type, "LineString");
    if (r.overlay?.geometry?.type === "LineString") assert.equal(r.overlay.geometry.coordinates.length, 2);
    assert.match(r.location!.precision, /100 km/);
    assert.match(r.destination!.precision, /100 km/);
  }
});

test("enslaved transport is forced removal, never voluntary migration or generic trade", () => {
  const enslaved = records.filter(r => r.culture.id === "atlantic-enslaved-people");
  assert.equal(enslaved.length, 7);
  for (const r of enslaved) {
    assert.equal(r.type, "event");
    assert.equal(r.overlay?.kind, "forced-removal");
    assert.equal(r.overlay?.direction, "forward");
    assert.equal(r.history, undefined);
    assert.ok(r.claims.some(c => /enslave|forcibly/i.test(c.text)));
  }
  assert.match(get("ax-luanda-virginia-1619").review.limitations, /not a direct voyage/);
  assert.match(get("ax-henrietta-biafra-jamaica").review.limitations, /before the later wreck/);
});

test("Acadian coerced assignments remain distinct from refugee-directed resettlement", () => {
  for (const id of ["ax-acadian-st-gabriel", "ax-acadian-vidalia"]) {
    assert.equal(get(id).overlay?.kind, "forced-removal");
    assert.equal(get(id).history, undefined);
  }
  for (const id of ["ax-acadian-halifax-louisiana", "ax-acadian-attakapas", "ax-acadian-france-louisiana", "ax-acadian-lafourche"]) {
    assert.equal(get(id).history?.kind, "migration");
    assert.ok(get(id).review.relatedIds.includes("acadian-deportation-boston1755"));
    assert.match(get(id).review.discussion, /original expulsion was voluntary/);
  }
  assert.match(get("ax-acadian-lafourche").claims[1].text, /Indigenous communities/);
});

test("named commercial operations stop displaying beyond supported evidence", () => {
  const packets=get("ax-black-ball-packets");
  assert.equal(packets.history?.connection?.cessation, "documented");
  assert.equal(packets.overlay?.direction, "both");
  assert.equal(historyState(packets, 1879), "outside");
  const mail=get("ax-pacific-mail-china");
  assert.equal(mail.history?.connection?.cessation, "unknown");
  assert.equal(historyState(mail, 1916), "outside");
  const fujian=get("ax-fujian-manila-1570s");
  assert.equal(fujian.history?.connection?.cessation, "unknown");
  assert.match(fujian.history!.connection!.note, /not evidence trade ceased/);
  assert.equal(fujian.overlay?.direction, "forward");
});
