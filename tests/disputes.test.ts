import { test } from "node:test";
import assert from "node:assert/strict";
import { disputeLevel, disputeLabel } from "../src/disputes";
import { fixture } from "./fixtures";
test("dispute intensity follows explicit claim status, never reference counts", () => {
  const r = fixture();
  assert.equal(disputeLevel(r), "none");
  r.claims[0].status = "under discussion";
  assert.equal(disputeLevel(r), "discussion");
  r.claims[0].support.push(...r.claims[0].support);
  assert.equal(disputeLevel(r), "discussion");
  r.claims[0].status = "disputed";
  assert.equal(disputeLevel(r), "disputed");
  assert.match(disputeLabel(r), /Explicitly disputed/);
});
