import { test } from "node:test";
import assert from "node:assert/strict";
import starter from "../data/evidence.json";
import research from "../data/research-proposals.json";
import { dataset } from "../src/published-data";
import { activeRecords } from "../src/time";
test("all author research ships by default without changing its claims or citations", () => {
  assert.equal(
    dataset.records.length,
    starter.records.length + research.proposals.length,
  );
  for (const row of [
    ...starter.records,
    ...research.proposals.map((p) => p.record),
  ])
    assert.deepEqual(
      dataset.records.find((r) => r.id === row.id),
      row,
    );
  assert.equal(
    new Set(dataset.records.map((r) => r.id)).size,
    starter.records.length + research.proposals.length,
  );
});
test("published research overlays are available at 1864 without a visitor preview switch", () => {
  const records = activeRecords(dataset.records, 1864);
  assert.ok(records.some((r) => r.overlay?.kind === "forced-removal"));
  assert.ok(records.some((r) => r.overlay?.kind === "violence"));
});
