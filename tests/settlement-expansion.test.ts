import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { EvidenceRecord } from "../src/model";
import { validateRecord } from "../src/validation";

const load = (name: string) => JSON.parse(readFileSync(new URL("../data/" + name, import.meta.url), "utf8")).records as EvidenceRecord[];
const settlements = load("settlement-expansion-records.json");
const missions = load("mission-expansion-records.json");
const all = [...settlements, ...missions];
const get = (id: string) => { const r = all.find(r => r.id === id); assert.ok(r, id); return r; };

test("every settlement and mission is a complete source-supported record", () => {
  assert.ok(settlements.length >= 60);
  assert.equal(new Set(all.map(r => r.id)).size, all.length);
  for (const r of all) assert.deepEqual(validateRecord(r), [], r.id);
});
test("all 21 Alta California institutions have distinct establishment records", () => {
  const foundations = missions.filter(r => r.history?.group === "Alta California mission foundation");
  assert.equal(foundations.length, 21);
  assert.deepEqual(foundations.map(r => r.time.start).sort((a,b) => a! - b!), [1769,1770,1771,1771,1772,1776,1776,1777,1782,1786,1787,1791,1791,1797,1797,1797,1797,1798,1804,1817,1823]);
  assert.equal(get("mission-san-francisco-solano").history?.foundingPower, "Mexico");
  const jose = get("mission-san-jose").location!;
  assert.ok(jose.lon < -121.8 && jose.lon > -122 && jose.lat > 37.5 && jose.lat < 37.6, "San Jose mission is in Fremont");
});
test("habitation begins before European attestation and ongoing histories stop at display horizon", () => {
  const taos = get("settlement-taos-habitation");
  assert.equal(taos.time.start, 1000);
  assert.equal(taos.time.certainStart, 1450);
  assert.equal(taos.history?.continuity, "ongoing");
  assert.equal(get("settlement-cholula-habitation").time.start, -499, "500 BCE uses astronomical years");
  assert.ok(get("settlement-tenochtitlan-habitation").time.start! < 1521);
  for (const r of all.filter(r => r.history?.continuity === "ongoing")) {
    assert.equal(r.time.end, 1934);
    assert.equal(r.history?.endEvidence, undefined);
  }
});
test("actual relocation dates remain distinct from orders, construction starts and renamed cities", () => {
  assert.equal(get("settlement-puerto-real").history?.endEvidence?.start, 1579);
  assert.equal(get("mission-la-purisima-relocation").time.start, 1813);
  assert.equal(get("mission-santa-clara-final-site").time.start, 1825);
  assert.equal(get("settlement-georgetown").time.start, 1782);
  assert.equal(get("settlement-londrina").time.start, 1929);
  assert.equal(get("settlement-montevideo").time.end, 1726);
});
test("archaeological sample limits do not become abandonment", () => {
  for (const id of ["settlement-en-bas-saline", "settlement-caguana", "settlement-upper-xingu", "settlement-maima"]) {
    assert.equal(get(id).history?.endEvidence, undefined, id);
    assert.equal(get(id).history?.continuity, undefined, id);
  }
  assert.equal(get("settlement-pecos-habitation").history?.endEvidence?.start, 1838);
});
test("coverage includes Caribbean, Native and Central/South American histories and public coordinate bounds", () => {
  assert.ok(settlements.filter(r => r.history?.group === "Central and South American settlement").length >= 25);
  assert.ok(settlements.filter(r => r.history?.group === "Caribbean colonial settlement").length >= 18);
  assert.ok(settlements.filter(r => r.history?.kind === "habitation").length >= 15);
  for (const r of all) {
    assert.ok(r.location!.lon >= -125 && r.location!.lon <= -30, r.id);
    assert.ok(r.location!.lat >= -57 && r.location!.lat <= 50, r.id);
    assert.match(r.location!.precision, /approximate|regional|rounded/i);
  }
});
