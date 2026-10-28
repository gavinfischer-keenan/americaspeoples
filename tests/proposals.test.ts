import { test } from "node:test";
import assert from "node:assert/strict";
import {
  makePackage,
  parsePackage,
  inspectImport,
  mergeImport,
} from "../src/proposals";
import { fixture, proposal } from "./fixtures";
test("share round trip preserves record, original, references and narrative", () => {
  const p = proposal();
  assert.deepEqual(parsePackage(JSON.stringify(makePackage([p]))).proposals, [
    p,
  ]);
});
test("repeated imports are idempotent while competing versions remain available", () => {
  const p = proposal(),
    q = {
      ...proposal(),
      version: 2,
      record: { ...fixture(), title: "Another revision" },
    };
  assert.equal(mergeImport([p], [p]).length, 1);
  assert.equal(mergeImport([q], [p]).length, 2);
  assert.equal(inspectImport([p], [p], [fixture()])[0].status, "duplicate");
});
test("stale corrections report conflicts without overwriting records", () => {
  const p = proposal();
  const original = fixture();
  const newer = { ...original, revision: 2 };
  assert.equal(inspectImport([p], [], [newer])[0].status, "conflict");
  assert.equal(inspectImport([p], [], [])[0].status, "conflict");
  assert.equal(original.title, "Synthetic test episode");
});
test("an identical proposal ID and version with altered content is retained as conflict", () => {
  const p = proposal(),
    changed = { ...proposal(), rationale: "Conflicting copy" };
  assert.equal(
    inspectImport([changed], [p], [fixture()])[0].status,
    "conflict",
  );
  assert.equal(mergeImport([changed], [p]).length, 2);
  assert.equal(mergeImport([changed], mergeImport([changed], [p])).length, 2);
});
test("imports reject oversized, unsupported, malformed, prototype and executable URL payloads", () => {
  assert.throws(() => parsePackage(" ".repeat(2_100_000)));
  assert.throws(() => parsePackage("{"));
  assert.throws(() =>
    parsePackage(JSON.stringify({ ...makePackage([]), schemaVersion: 999 })),
  );
  assert.throws(() => parsePackage('{"__proto__":{}}'));
  const p = proposal();
  p.record.sources[0].url = "data:text/html,hello";
  assert.throws(() => parsePackage(JSON.stringify(makePackage([p]))));
});
test("drafts can be exported without becoming reviewed or ready", () => {
  const p = proposal();
  p.state = "draft";
  p.record.sources = [];
  p.record.claims = [];
  p.record.title = "";
  assert.equal(
    parsePackage(JSON.stringify(makePackage([p]))).proposals[0].state,
    "draft",
  );
});
test("new cultures conflict with prior incoming and existing proposal metadata", () => {
  const a = proposal();
  a.kind = "new";
  a.baseRecord = null;
  a.baseRevision = null;
  a.targetId = null;
  a.record.id = "new-a";
  a.record.culture = {
    id: "novel",
    name: "Novel",
    kind: "culture",
    color: "#ff0000",
  };
  const b = structuredClone(a);
  b.id = "proposal-b";
  b.record.id = "new-b";
  b.record.culture.color = "#0000ff";
  assert.equal(inspectImport([a, b], [], [fixture()])[1].status, "conflict");
  assert.equal(inspectImport([b], [a], [fixture()])[0].status, "conflict");
});
