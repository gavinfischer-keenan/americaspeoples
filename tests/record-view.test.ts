import { test } from "node:test";
import assert from "node:assert/strict";
import { RecordView } from "../src/record-view";
import { fixture, proposal } from "./fixtures";

test("preview derivation reuses validated rows until explicit revision or filters change", () => {
  const base = fixture(),
    p = proposal();
  p.kind = "new";
  p.targetId = null;
  p.baseRevision = null;
  p.baseRecord = null;
  p.record.id = "new-preview";
  const view = new RecordView([base]);
  const first = view.get([p], true, new Set(), 0);
  assert.equal(first.length, 2);
  assert.equal(first[1].proposalKey, "0");
  assert.equal(view.get([p], true, new Set(), 0), first);
  assert.equal(view.get([p], false, new Set(), 0).length, 1);
  const changed = {
    ...p,
    record: { ...p.record, title: "A changed suggestion" },
  };
  assert.equal(
    view.get([changed], true, new Set(), 1)[1].title,
    "A changed suggestion",
  );
  assert.equal(
    view.get([changed], true, new Set([base.culture.id]), 1).length,
    0,
  );
});
test("preview cannot replace published IDs or override their culture metadata", () => {
  const base = fixture(),
    p = proposal();
  p.kind = "new";
  p.targetId = null;
  p.baseRevision = null;
  p.baseRecord = null;
  const view = new RecordView([base]);
  assert.equal(view.get([p], true, new Set(), 0).length, 1);
  p.record.id = "new-preview";
  p.record.culture = { ...base.culture, color: "#ffffff" };
  const rows = view.get([p], true, new Set(), 1);
  assert.equal(rows[1].culture.color, base.culture.color);
  assert.equal(base.culture.color, fixture().culture.color);
});
