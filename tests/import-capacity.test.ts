import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePackage, makePackage } from "../src/proposals";
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
    () => parsePackage(JSON.stringify(makePackage(batch(5001)))),
    /5000/,
  );
});

test("byte limit remains enforced for large valid JSON", () => {
  assert.throws(
    () => parsePackage(JSON.stringify({ payload: "x".repeat(32_000_001) })),
    /32 MB/,
  );
});
