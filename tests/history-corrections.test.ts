import {dataset} from '../src/published-data';
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { EvidenceRecord, SharePackage } from "../src/model";
import { validateDataset, validateRecord } from "../src/validation";
import { historyLabel, historyState } from "../src/history";

const history: EvidenceRecord[] = JSON.parse(readFileSync(new URL("../data/history-records.json", import.meta.url), "utf8")).records;
const proposals: SharePackage = JSON.parse(readFileSync(new URL("../data/research-proposals.json", import.meta.url), "utf8"));
const get = (id: string): EvidenceRecord => {
  const r = [...history, ...proposals.proposals.map(p => p.record)].find(r => r.id === id);
  assert.ok(r, `Missing reviewed record ${id}`);
  return r;
};
const ids = ["history-mangareva-pitcairn-henderson", "history-rapa-nui-regional-occupation", "history-rapa-nui-historical-continuity", "barbados-heywoods-early-shell", "barbados-heywoods-shell-adze"];

test("corrected records retain valid source links and related-record references", () => {
  const records = ids.map(get);
  for (const r of records) assert.deepEqual(validateRecord(r), [], r.id);
  assert.deepEqual(validateDataset({schemaVersion: 1, version: "test", reviewedAt: "2026-11-15", coverage: "Focused historical corrections", license: "Project license", records:dataset.records}), []);
});

test("Pitcairn material reaches Henderson without inventing a return voyage", () => {
  const r = get("history-mangareva-pitcairn-henderson");
  assert.equal(r.overlay?.direction, "forward");
  assert.deepEqual(r.overlay?.geometry, {type: "LineString", coordinates: [[-130.1, -25.07], [-128.3, -24.37]]});
  assert.match(r.overlay!.provenance, /material origin to recovery island/);
  assert.match(r.review.limitations, /does not identify carriers, return voyages/);
  assert.equal(r.history?.connection?.cessation, "inferred");
  assert.deepEqual([r.time.start, r.time.end], [1050, 1450]);
  assert.match(r.time.method, /not a dated first transfer/);
  assert.equal(historyState(r, 1451), "outside");
});

test("Rapa Nui preserves the model interval and adds independent historical continuity", () => {
  const modeled = get("history-rapa-nui-regional-occupation");
  const later = get("history-rapa-nui-historical-continuity");
  assert.deepEqual([modeled.time.start, modeled.time.end], [1250, 1860]);
  assert.equal(modeled.history?.kind, "habitation");
  assert.equal(modeled.history?.continuity, undefined);
  assert.match(modeled.sources[0].url, /s41586-024-07881-4/);
  assert.deepEqual([later.time.start, later.time.end], [1860, 1934]);
  assert.equal(later.history?.continuity, "ongoing");
  assert.ok(later.sources.some(s => s.url.includes("memoriachilena.gob.cl")));
  assert.ok(later.sources.some(s => s.url.includes("articles.unesco.org")));
  assert.ok(modeled.review.relatedIds.includes(later.id));
  assert.ok(later.review.relatedIds.includes(modeled.id));
  assert.match(later.time.interpretation, /Neither bound marks settlement or abandonment/);
  for (const r of [modeled, later]) {
    assert.equal(r.history?.endEvidence, undefined);
    assert.equal(r.history?.endYear, undefined);
  }
  assert.equal(historyState(later, 1934), "active");
  assert.match(historyLabel(later, 1934), /continuing habitation/);
  assert.match(historyLabel(modeled, 1934), /does not establish abandonment/);
});

test("Heywoods uses the published Barbados island anchor with explicit regional uncertainty", () => {
  for (const id of ["barbados-heywoods-early-shell", "barbados-heywoods-shell-adze"]) {
    const r = get(id);
    assert.equal(r.location, null);
    assert.equal(r.overlay?.kind, "regional-evidence");
    assert.equal(r.overlay?.basis, "schematic");
    assert.deepEqual(r.overlay?.geometry, {type: "Point", coordinates: [-59.53, 13.17]});
    assert.match(r.overlay!.precision, /30 km/);
    assert.match(r.overlay!.provenance, /13 degrees 10 minutes N, 59 degrees 32 minutes W/);
    assert.match(r.review.limitations, /does not locate Trench 39/);
    assert.ok(r.sources.some(s => s.url.includes("cdn.who.int") && s.year === 2009));
    assert.ok(r.sources.some(s => s.url.includes("cambridge.org") && s.doi === "10.1017/S0033822200039072"));
  }
});

test("Heywoods retains distinct sample intervals and exposes the publication discrepancy", () => {
  const early = get("barbados-heywoods-early-shell");
  const adze = get("barbados-heywoods-shell-adze");
  assert.deepEqual([early.time.start, early.time.end], [1 - 3280, 1 - 2940]);
  assert.deepEqual([adze.time.start, adze.time.end], [1 - 2530, 1 - 2200]);
  assert.equal(early.time.kind, "occurrence");
  assert.equal(adze.time.kind, "occurrence");
  assert.match(adze.claims[0].explanation, /Table 1 and Results report 2530-2220/);
  assert.match(adze.claims[0].explanation, /broader published abstract envelope/);
  assert.match(early.review.limitations, /not automatically an occupation onset/);
  assert.match(adze.review.limitations, /does not establish a thousand-year continuous camp/);
});
