import { test } from "node:test";
import assert from "node:assert/strict";
import { dataset } from "../src/published-data";
import { validateDataset } from "../src/validation";
test("literature batch preserves dates, access limits and genomic/settlement distinction", () => {
  assert.deepEqual(validateDataset(dataset), []);
  assert.ok(dataset.records.length >= 139);
  const find = (id: string) => dataset.records.find((r) => r.id === id)!;
  assert.equal(find("north-america-gi1-expansion").time.start, 2000 - 14700);
  assert.equal(find("south-america-sutter-entry").time.start, 1 - 13000);
  assert.equal(
    find("caribbean-colonization-synthesis").time.start,
    1950 - 7000,
  );
  assert.equal(find("south-america-cold-adaptation2025").time.kind, "unplaced");
  for (const r of dataset.records.filter(
    (r) => r.overlay?.kind === "population-history",
  )) {
    assert.equal(r.type, "event");
    assert.equal(r.location, null);
    assert.equal(r.destination, null);
  }
  assert.ok(
    find("genomic-continuity-interpretation").claims[0].text.includes(
      "except later-arriving Arctic",
    ),
  );
  assert.match(
    find("north-america-faunal-extinction-hypothesis").review.limitations,
    /not direct evidence/,
  );
  assert.match(
    find("central-andes-sutter-dispersal").sources[0].access,
    /Abstract only/,
  );
});
