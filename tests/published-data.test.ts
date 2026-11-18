import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import starter from "../data/evidence.json";
import history from "../data/history-records.json";
import research from "../data/research-proposals.json";
import { dataset } from "../src/published-data";
import { activeRecords } from "../src/time";
const expansion = readdirSync("data").filter(name=>name.endsWith("-expansion-records.json")||["shield-aleutian-local-records.json","coming-soon-b-topic-evidence-records.json","coming-soon-a-topic-evidence-records.json","topic-evidence-records.json","pacific-topic-evidence-records.json","pacific-topic-context-records.json","community-topic-evidence-records.json","community-topic-context-records.json","sovereignty-topic-context-records.json","sovereignty-topic-evidence-records.json","remaining-topic-context-records.json","remaining-topic-evidence-records.json"].includes(name)).flatMap(name=>JSON.parse(readFileSync("data/"+name,"utf8")).records);
test("all author research ships by default without changing its claims or citations", () => {
  assert.equal(
    dataset.records.length,
    starter.records.length + research.proposals.length + history.records.length + expansion.length,
  );
  for (const row of [
    ...starter.records,
    ...expansion,
    ...history.records,
    ...research.proposals.map((p) => p.record),
  ])
    assert.deepEqual(
      dataset.records.find((r) => r.id === row.id),
      row,
    );
  assert.equal(
    new Set(dataset.records.map((r) => r.id)).size,
    starter.records.length + research.proposals.length + history.records.length + expansion.length,
  );
});
test("published research overlays are available at 1864 without a visitor preview switch", () => {
  const records = activeRecords(dataset.records, 1864);
  assert.ok(records.some((r) => r.overlay?.kind === "forced-removal"));
  assert.ok(records.some((r) => r.overlay?.kind === "violence"));
});
