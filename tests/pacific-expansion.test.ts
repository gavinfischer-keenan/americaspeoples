import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { EvidenceRecord } from "../src/model";
import { validateRecord, validateDataset } from "../src/validation";
import { historyLabel, historyState } from "../src/history";

const load = (name: string): EvidenceRecord[] => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), "utf8")).records;
const pacific = load("pacific-expansion-records.json");
const violence = load("violence-expansion-records.json");
const records = [...pacific, ...violence];
const get = (id: string) => {
  const record = records.find(r => r.id === id);
  assert.ok(record, `Missing reviewed evidence: ${id}`);
  return record;
};

test("Pacific and violence additions are complete, source-linked and internally consistent", () => {
  assert.ok(pacific.length >= 30);
  assert.ok(violence.length >= 25);
  for (const record of records) assert.deepEqual(validateRecord(record), [], record.id);
  assert.deepEqual(validateDataset({schemaVersion: 1, version: "test", reviewedAt: "2026-11-15", coverage: "Pacific and violence additions", license: "Project license", records}), []);
  for (const r of records) {
    assert.match(r.location!.precision, /\d+ km/);
    assert.match(r.location!.provenance, /approximation|Rounded public UNESCO/);
    assert.ok(r.sources.every(s => /^https:\/\//.test(s.url)));
    assert.ok(r.time.end === null || r.time.end <= 1934);
  }
});

test("calibrated ages and historical BCE retain correct baseline and uncertainty", () => {
  assert.equal(get("px-mussau-lapita-onset").time.start, 1950 - 3535);
  assert.equal(get("px-marianas-onset").time.end, 1950 - 3085);
  assert.equal(get("px-taiwan-north-philippines").time.start, 1 - 2200);
  assert.equal(get("px-jiigurru-pottery").time.end, 1950 - 1815);
  assert.deepEqual([get("px-norfolk-mount-bates").time.start, get("px-norfolk-mount-bates").time.end], [1290, 1430]);
  assert.match(get("px-toaga-onset").time.original, /68%/);
  assert.match(get("px-bourewa-model").time.original, /95.4%/);
});

test("local departure differs from the end of excavated evidence", () => {
  const emily = get("px-norfolk-emily-bay");
  assert.equal(emily.history?.endEvidence, undefined);
  assert.equal(historyState(emily, 1600), "past-place");
  assert.match(historyLabel(emily, 1600), /does not establish abandonment/);
  const enderby = get("px-enderby-sandy-bay");
  assert.equal(enderby.history?.endEvidence?.certainty, "inferred");
  assert.match(historyLabel(enderby, 1380), /Possible local abandonment/);
  assert.match(historyLabel(enderby, 1700), /Inferred local abandonment/);
  assert.equal(get("px-palau-rock-island-villages").history?.endEvidence?.meaning, "relocated");
  assert.ok(!pacific.some(r => /rapa nui|rapanui/i.test(r.title) && r.history?.endEvidence));
});

test("ongoing landscape is clipped at 1934 without inventing abandonment", () => {
  const ongoing = pacific.filter(r => r.history?.continuity === "ongoing");
  assert.deepEqual(ongoing.map(r => r.id), ["px-budj-bim-living-landscape"]);
  assert.equal(ongoing[0].time.end, 1934);
  assert.equal(ongoing[0].history?.endEvidence, undefined);
  assert.match(ongoing[0].review.limitations, /not continuous use of every structure/);
});

test("material provenance does not invent a return voyage or continued connection", () => {
  for (const id of ["px-fergusson-caution-bay", "px-raoul-norfolk-obsidian"]) {
    const r = get(id);
    assert.equal(r.overlay?.direction, "forward");
    assert.equal(r.overlay?.geometry?.type, "LineString");
    assert.equal(historyState(r, r.time.end! + 1), "outside");
    assert.match(r.review.limitations, /return/);
  }
  assert.equal(get("px-fergusson-caution-bay").history?.connection?.cessation, "inferred");
  assert.equal(get("px-raoul-norfolk-obsidian").history?.connection?.cessation, "unknown");
  const both = pacific.filter(r => r.overlay?.direction === "both");
  assert.deepEqual(both.map(r => r.id), ["px-macassan-arnhem"]);
  assert.equal(both[0].history?.connection?.cessation, "documented");
});

test("violence contexts preserve unknown actors, healed injuries and unplaced chronology", () => {
  for (const r of violence) {
    assert.equal(r.type, "event");
    assert.equal(r.overlay?.geometry?.type, "Point");
    assert.ok(["violence", "conflict"].includes(r.overlay!.kind));
    assert.equal(r.overlay?.direction, undefined);
  }
  assert.match(get("vx-kaakutja").review.limitations, /Attackers are unknown/);
  assert.match(get("vx-nebira").review.limitations, /aggregate cemetery sample, not a massacre/);
  assert.match(get("vx-taumako").review.limitations, /healed injuries cannot be equated with homicide/);
  const tonga = get("vx-tonga-trauma");
  assert.equal(tonga.time.kind, "unplaced");
  assert.equal(tonga.time.start, null);
  assert.equal(tonga.time.end, null);
  assert.match(tonga.claims[0].text, /sporting activities/);
  assert.match(get("vx-huanchaquito").review.limitations, /particular organs are not proven/);
});
