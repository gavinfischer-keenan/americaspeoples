import test from "node:test";
import assert from "node:assert/strict";
import { fixture } from "./fixtures";
import { recordsForView } from "../src/atlas-view";
import { validateRecord } from "../src/validation";

test("wrecks accumulate after their event without changing the source date or appearing before it", () => {
  const r = {
    ...fixture(),
    type: "event" as const,
    time: {
      ...fixture().time,
      kind: "occurrence" as const,
      start: 1715,
      end: 1715,
    },
    history: {
      kind: "wreck" as const,
      claimId: "occupation",
      eventDate: "1715-07-31",
    },
  };
  assert.equal(recordsForView([r], "movie", 1714).dated.length, 0);
  assert.equal(recordsForView([r], "movie", 1715).dated.length, 1);
  assert.deepEqual((recordsForView([r], "movie", 1730) as any).history, [r]);
  assert.deepEqual((recordsForView([r], "movie", 1714) as any).history, []);
  assert.equal(r.time.end, 1715);
});
test("ending an occupation interval retains a historical place, not an active population", () => {
  const r = fixture();
  const view = recordsForView([r], "movie", 201) as any;
  assert.deepEqual(view.dated, []);
  assert.deepEqual(view.history, [r]);
  assert.deepEqual((recordsForView([r], "movie", 99) as any).history, []);
});
test("routes respect separate activity windows and do not bridge hiatuses", () => {
  const r = {
    ...fixture(),
    type: "event" as const,
    history: {
      kind: "exchange" as const,
      claimId: "occupation",
      windows: [
        {
          start: 100,
          end: 120,
          certainty: "documented" as const,
          note: "First phase",
        },
        {
          start: 180,
          end: 200,
          certainty: "approximate" as const,
          note: "Second phase",
        },
      ],
    },
  };
  assert.equal(recordsForView([r], "movie", 120).dated.length, 1);
  assert.equal(recordsForView([r], "movie", 121).dated.length, 0);
  assert.equal(recordsForView([r], "movie", 180).dated.length, 1);
  assert.deepEqual((recordsForView([r], "movie", 201) as any).history, []);
});
test("a founding remains visible as a founding, without extending its historical event", () => {
  const r = {
    ...fixture(),
    type: "event" as const,
    time: {
      ...fixture().time,
      kind: "occurrence" as const,
      start: 1565,
      end: 1565,
    },
    history: {
      kind: "settlement" as const,
      claimId: "occupation",
      foundingPower: "Spain",
    },
  };
  assert.deepEqual((recordsForView([r], "movie", 1700) as any).history, [r]);
  assert.equal(r.time.end, 1565);
});
test("invalid activity windows and missing supporting claims cannot enter a publication", () => {
  const r = {
    ...fixture(),
    history: {
      kind: "exchange",
      claimId: "missing",
      windows: [{ start: 200, end: 100, certainty: "invented", note: "" }],
    },
  };
  assert.ok(validateRecord(r).some((e) => /history|activity/i.test(e)));
});
import { historyLabel, historyDates } from "../src/history";
import { dataset } from "../src/published-data";

test("a later abandonment is not shown at the foundation date", () => {
  const r = {
    ...fixture(),
    type: "event" as const,
    time: {
      ...fixture().time,
      kind: "occurrence" as const,
      start: 1519,
      end: 1519,
    },
    history: {
      kind: "settlement" as const,
      claimId: "occupation",
      endMeaning: "relocated" as const,
      endYear: 1671,
    },
  };
  assert.doesNotMatch(historyLabel(r, 1600), /Documented relocation/);
  assert.match(historyLabel(r, 1700), /Documented relocation/);
  assert.ok(historyDates([r]).includes(1671));
});
test("published historical layers preserve date gaps, losses and documented regional continuity", () => {
  const rows = dataset.records;
  assert.equal(rows.filter((r) => r.id.startsWith("history-") && r.history?.kind === "wreck").length, 8);
  assert.equal(rows.filter((r) => r.id.startsWith("history-") && r.history?.kind === "settlement").length, 25);
  const route = rows.find((r) => r.id === "history-samoa-tonga-exchange")!;
  assert.ok(route);
  assert.equal(recordsForView([route], "movie", 1400).dated.length, 0);
  assert.equal(recordsForView([route], "movie", 1600).dated.length, 1);
  assert.ok(
    rows.some(
      (r) =>
        r.id === "history-tonga-regional-occupation" &&
        r.type === "occupation" &&
        r.time.end === 1934,
    ),
  );
});
import { historyOpacity } from "../src/history";
test("uncertain founding windows do not assert an already established place at their early bound", () => {
  const r = dataset.records.find((r) => r.id === "history-hawaii-continuity")!;
  assert.match(historyLabel(r, 1100), /Possible establishment/);
  assert.ok(historyOpacity(r, 1100)! < 1);
  assert.match(historyLabel(r, 1300), /Established by/);
});
test("history kinds enforce renderable geometry and compatible time behavior", () => {
  const base = fixture();
  const window = {
    start: 100,
    end: 200,
    certainty: "documented",
    note: "Sourced interval",
  };
  assert.ok(
    validateRecord({
      ...base,
      history: { kind: "exchange", claimId: "occupation", windows: [window] },
    }).some((e) => /route|Route/.test(e)),
  );
  assert.ok(
    validateRecord({
      ...base,
      type: "event",
      time: { ...base.time, kind: "occurrence", start: 100, end: 100 },
      history: {
        kind: "wreck",
        claimId: "occupation",
        windows: [{ ...window, end: 100 }],
      },
    }).some((e) => /windows/.test(e)),
  );
  assert.ok(
    validateRecord({
      ...base,
      history: {
        kind: "settlement",
        claimId: "occupation",
        endYear: 300,
        endMeaning: "abandoned",
      },
    }).some((e) => /Settlement/.test(e)),
  );
});

test("history routes reject unsupported directions instead of drawing false forward arrows", () => {
  const route = structuredClone(
    dataset.records.find((r) => r.history?.kind === "exchange")!,
  );
  route.overlay!.direction = "reverse";
  assert.ok(validateRecord(route).some((e) => e.includes("directions")));
});
