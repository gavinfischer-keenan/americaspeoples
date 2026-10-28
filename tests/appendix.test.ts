import { test } from "node:test";
import assert from "node:assert/strict";
import dataset from "../data/evidence.json";
import research from "../data/research-proposals.json";
import { createAppendix, renderAppendix } from "../scripts/appendix";
import { esc } from "../src/dom";

test("readable appendix retains record and geographic provenance with uncertainty", () => {
  const appendix = createAppendix(dataset as any, research as any, "test");
  for (const entry of appendix.records) {
    const html = renderAppendix({ ...appendix, records: [entry] });
    const r = entry.record;
    for (const text of [
      r.review.provenance,
      r.review.reviewedAt,
      ...r.review.history,
    ]) {
      assert.ok(html.includes(esc(text)), `${r.id}: missing review provenance`);
    }
    for (const place of [r.location, r.destination]) {
      if (place) {
        assert.ok(
          html.includes(esc(place.precision)),
          `${r.id}: missing geographic precision`,
        );
        assert.ok(
          html.includes(esc(place.provenance)),
          `${r.id}: missing geographic provenance`,
        );
      }
    }
  }
});

test("the public appendix preserves all records and distinguishes default from optional data", () => {
  const appendix = createAppendix(dataset as any, research as any, "test");
  assert.equal(appendix.records.length, 59);
  assert.equal(
    appendix.records.filter((r) => r.collection === "bundled").length,
    8,
  );
  assert.equal(
    appendix.records.filter((r) => r.collection === "research-proposal").length,
    51,
  );
  const proposal = appendix.records.find(
    (r) => r.collection === "research-proposal",
  )!;
  assert.equal(proposal.defaultVisible, false);
  assert.equal(proposal.reviewPath, null);
  assert.deepEqual(proposal.record, research.proposals[0].record);
  assert.match(appendix.records[0].reviewPath!, /^\/#review\//);
});

test("appendix text is escaped and every record includes its claims and bibliography", () => {
  const appendix = createAppendix(dataset as any, research as any, "test");
  appendix.records[0].record.title = '<img src=x onerror="bad()">';
  const html = renderAppendix(appendix);
  assert.equal((html.match(/data-evidence-id=/g) ?? []).length, 59);
  assert.ok(!html.includes("<img src=x"));
  assert.ok(html.includes("&lt;img src=x"));
  assert.ok(html.includes("Optional research proposal"));
  assert.ok(html.includes("Indian Reorganization Act"));
  assert.equal(dataset.records[0].title.includes("<img"), false);
});
