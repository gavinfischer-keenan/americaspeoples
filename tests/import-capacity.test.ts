import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePackage, makePackage, MAX_PROPOSALS, MAX_PACKAGE_BYTES } from "../src/proposals";
import { proposal } from "./fixtures";
const batch = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const p = proposal();
    p.id = "batch-" + i;
    p.kind = "new";
    p.targetId = null;
    p.baseRevision = null;
    p.baseRecord = null;
    p.record.id = "evidence-" + i;
    return p;
  });
test("larger evidence snapshots can import without removing byte and count protections", () => {
  assert.equal(
    parsePackage(JSON.stringify(makePackage(batch(1001)))).proposals.length,
    1001,
  );
  assert.throws(
    () => parsePackage(JSON.stringify(makePackage(batch(MAX_PROPOSALS+1)))),
    new RegExp(String(MAX_PROPOSALS)),
  );
});

test("byte limit remains enforced for large valid JSON", () => {
  assert.throws(
    () => parsePackage(JSON.stringify({ payload: "x".repeat(MAX_PACKAGE_BYTES+1) })),
    /96 MB/,
  );
});
