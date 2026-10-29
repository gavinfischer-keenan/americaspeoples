import { test } from "node:test";
import assert from "node:assert/strict";
import { fixture } from "./fixtures";
import { boundsInViewport, filterMapRecords, isModeledRecord } from "../src/map-filters";

test("modeled filter uses explicit model metadata and keeps disputed dated sites", () => {
  const dated = fixture();
  dated.claims[0].status = "disputed";
  assert.equal(isModeledRecord(dated), false);
  const model = fixture();
  model.time.method = "Bayesian age model of radiocarbon determinations";
  assert.equal(isModeledRecord(model), true);
  const schematic = fixture();
  schematic.overlay = { kind: "trade", basis: "schematic", geometry: {type: "Point", coordinates: [-100, 40]}, precision: "approximate", provenance: "source" };
  assert.equal(isModeledRecord(schematic), true);
  assert.deepEqual(filterMapRecords([dated, model, schematic], new Set(), false), [dated]);
  assert.deepEqual(filterMapRecords([dated, model, schematic], new Set(["trade"]), true), [dated, model]);
  schematic.overlay.basis = "documented";
  assert.equal(isModeledRecord(schematic), false);
});

test("viewport excludes offscreen points and accepts crossing extents after pan and zoom", () => {
  const p: [[number, number], [number, number]] = [[800, 300], [800, 300]];
  assert.equal(boundsInViewport(p, 1, 0, 0), true);
  assert.equal(boundsInViewport(p, 2, 0, 0), false);
  assert.equal(boundsInViewport(p, 2, -1000, 0), true);
  assert.equal(boundsInViewport(p, 2, -2000, 0), false);
  assert.equal(boundsInViewport([[-20, 400], [1020, 400]], 1, 0, 0), true);
  assert.equal(boundsInViewport([[Infinity, Infinity], [-Infinity, -Infinity]], 1, 0, 0), false);
});
