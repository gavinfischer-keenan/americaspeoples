import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatYear,
  parseYear,
  temporalState,
  earliestYear,
  activeRecords,
  advancePlayback,
} from "../src/time";
import { validateRecord, validateDataset } from "../src/validation";
import { fixture } from "./fixtures";
test("historical display has no year zero and parsing is reversible at BCE boundary", () => {
  assert.equal(formatYear(0), "1 BCE");
  assert.equal(formatYear(-1), "2 BCE");
  assert.equal(formatYear(1), "1 CE");
  assert.equal(parseYear("1", "BCE"), 0);
  assert.equal(parseYear("21051", "BCE"), -21050);
  assert.throws(() => parseYear("0", "CE"));
});
test("inclusive occupation bounds do not bridge gaps or depend on query direction", () => {
  const a = fixture(),
    b = {
      ...fixture(),
      id: "second",
      time: { ...fixture().time, start: 300, end: 400 },
    };
  assert.deepEqual(
    [99, 100, 200, 201, 299, 300, 400, 401].map(
      (y) => activeRecords([a, b], y).length,
    ),
    [0, 1, 1, 0, 0, 1, 1, 0],
  );
  assert.deepEqual(activeRecords([a, b], 150), activeRecords([a, b], 150));
  assert.equal(activeRecords([a, b], 250).length, 0);
});
test("occurrence dating is possible throughout the range, not continuous occupation", () => {
  const t = { ...fixture().time, kind: "occurrence" as const };
  assert.equal(temporalState(t, 150), "possible");
  assert.equal(temporalState(t, 99), "absent");
  assert.equal(temporalState({ ...t, start: 150, end: 150 }, 150), "certain");
});
test("unknown dates remain unplaced and uncertain occupation edges stay distinct", () => {
  assert.equal(
    temporalState(
      { ...fixture().time, kind: "unplaced", start: null, end: null },
      1803,
    ),
    "absent",
  );
  const t = { ...fixture().time, certainStart: 120, certainEnd: 180 };
  assert.equal(temporalState(t, 110), "possible");
  assert.equal(temporalState(t, 150), "certain");
  assert.equal(
    earliestYear([
      { ...fixture(), time: { ...fixture().time, start: -21050, end: -19050 } },
    ]),
    -21050,
  );
});
test("a rounded reference year is never represented as an exact annual occurrence", () => {
  const t = {
    ...fixture().time,
    kind: "occurrence" as const,
    start: -12550,
    end: -12550,
    approximate: true,
  };
  assert.equal(temporalState(t, -12550), "possible");
});
test("validation rejects missing evidence, missing discussion, unsourced claims and bad ranges", () => {
  assert.deepEqual(validateRecord(fixture()), []);
  const a = fixture();
  a.review.summary = "";
  assert.ok(validateRecord(a).length);
  const b = fixture();
  b.claims[0].support[0].sourceId = "missing";
  assert.ok(validateRecord(b).length);
  const c = fixture();
  c.time.end = 99;
  assert.ok(validateRecord(c).length);
  const d = fixture();
  d.claims[0].status = "disputed";
  d.review.discussion = "";
  assert.ok(validateRecord(d).length);
  const e = fixture();
  e.location!.lat = 100;
  assert.ok(validateRecord(e).length);
});
test("unsafe links and duplicate IDs are rejected; draft validation permits incomplete prose", () => {
  const a = fixture();
  a.sources[0].url = "javascript:alert(1)";
  assert.ok(validateRecord(a).length);
  const d = fixture();
  d.title = "";
  d.sources = [];
  d.claims = [];
  d.review.summary = "";
  assert.deepEqual(validateRecord(d, false), []);
  assert.ok(
    validateDataset({
      schemaVersion: 1,
      version: "test",
      reviewedAt: "2026-10-28",
      coverage: "Test",
      license: "Test",
      records: [fixture(), fixture()],
    }).length,
  );
});
test("unsupported route geometry cannot be labeled as a supported path", () => {
  const r = fixture();
  r.type = "movement";
  r.destination = { ...r.location!, id: "destination", lon: -80 };
  (r as any).routeKind = "supported";
  assert.ok(validateRecord(r).some((e) => e.includes("schematic")));
});
test("playback lands on evidence boundaries so high speeds do not skip one-year events", () => {
  const r = fixture();
  r.time = { ...r.time, kind: "occurrence", start: 1021, end: 1021 };
  assert.deepEqual(advancePlayback([r], 1020, 20), {
    year: 1021,
    boundary: true,
  });
  assert.deepEqual(advancePlayback([r], 1021, 20), {
    year: 1041,
    boundary: false,
  });
  assert.deepEqual(advancePlayback([r], 1800, 20), {
    year: 1803,
    boundary: false,
  });
});
