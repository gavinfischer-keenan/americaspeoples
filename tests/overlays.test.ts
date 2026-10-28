import { test } from "node:test";
import assert from "node:assert/strict";
import data from "../data/evidence.json";
import { validateRecord } from "../src/validation";
import { makePackage, parsePackage } from "../src/proposals";
import { newProposal } from "../src/editor";
import { activeRecords } from "../src/time";
import { tablesToPackage } from "../src/bulk-import";
const record = () =>
  ({
    ...structuredClone(data.records[4]),
    overlay: {
      kind: "trade",
      basis: "schematic",
      geometry: {
        type: "LineString",
        coordinates: [
          [-105, 35],
          [-100, 30],
        ],
      },
      precision: "Regional endpoints, not actual path",
      provenance: "Published source establishes the endpoints.",
    },
  }) as any;
test("overlay geometry rejects invalid coordinates and unsupported polygons", () => {
  const r = record();
  assert.deepEqual(validateRecord(r), []);
  r.overlay.geometry.coordinates[0][0] = 190;
  assert.match(validateRecord(r).join(" "), /geometry/);
  r.overlay.geometry = { type: "Polygon", coordinates: [] };
  assert.match(validateRecord(r).join(" "), /geometry/);
});
test("overlays preserve provenance and require version2 sharing", () => {
  const p = newProposal(record());
  p.rationale = "Research addition";
  const pack = makePackage([p]);
  assert.equal(pack.schemaVersion, 2);
  assert.deepEqual(
    parsePackage(JSON.stringify(pack)).proposals[0].record.overlay,
    p.record.overlay,
  );
  assert.throws(
    () => parsePackage(JSON.stringify({ ...pack, schemaVersion: 1 })),
    /version 2/i,
  );
});
test("overlay time bounds are inclusive and independent of scrubbing direction", () => {
  const r = record();
  r.time = { ...r.time, kind: "interval", start: 100, end: 110 };
  assert.deepEqual(
    [99, 100, 110, 111, 110, 99].map((y) => activeRecords([r], y).length),
    [0, 1, 1, 0, 1, 0],
  );
});
test("overlay-only workbook creates an explicitly typed proposal, never a migration", () => {
  const r = record();
  const t: any = {
    Evidence: [],
    Overlays: [
      {
        record_id: "trade-example",
        operation: "new",
        record_type: "event",
        time_model: "occurrence",
        start_year: 100,
        start_era: "CE",
        end_year: 110,
        end_era: "CE",
        title: "Test exchange connection",
        culture_id: "unknown",
        proposal_state: "draft",
        overlay_type: "trade",
        geometry_basis: "schematic",
        geometry_geojson: JSON.stringify(r.overlay.geometry),
        geometry_precision: r.overlay.precision,
        geometry_source: r.overlay.provenance,
      },
    ],
    Claims: [],
    References: [],
    ClaimSources: [],
  };
  const p = tablesToPackage(t, []).proposals[0];
  assert.equal(p.record.overlay?.kind, "trade");
  assert.equal(p.record.type, "event");
});

import { comparisonHTML, reviewHTML } from "../src/review";
test("removing an overlay is visible in the correction comparison", () => {
  const p = newProposal(record());
  delete p.record.overlay;
  assert.match(comparisonHTML(p), /1 changed fields/);
  assert.match(comparisonHTML(p), /overlay/);
});
test("malformed line coordinates return diagnostics without throwing", () => {
  const r = record();
  r.overlay.geometry = { type: "LineString" };
  assert.doesNotThrow(() => validateRecord(r));
  assert.match(validateRecord(r).join(" "), /geometry/);
});

test("epidemic, violence and forced removal retain distinct kinds when shared", () => {
  for (const kind of ["epidemic", "violence", "forced-removal"]) {
    const r = record();
    r.overlay.kind = kind;
    r.time = { ...r.time, kind: "occurrence", start: 1864, end: 1864 };
    assert.deepEqual(validateRecord(r), [], kind);
    const p = newProposal(r);
    p.rationale = "Synthetic fixture";
    assert.equal(
      parsePackage(JSON.stringify(makePackage([p]))).proposals[0].record.overlay
        ?.kind,
      kind,
    );
  }
});

test("overlay kinds reject arrays instead of coercing them into layer names", () => {
  const r = record();
  r.overlay.kind = ["forced-removal"];
  assert.match(validateRecord(r).join(" "), /Overlay type/);
});

test("a forced-removal point or unmapped record never claims an arrow or two endpoints", () => {
  const r = record();
  r.overlay.kind = "forced-removal";
  for (const geometry of [{ type: "Point", coordinates: [-85, 35] }, null]) {
    r.overlay.geometry = geometry;
    r.overlay.basis = geometry ? "documented" : "unmapped";
    assert.doesNotMatch(reviewHTML(r, data as any), /The arrow indicates/);
  }
});
