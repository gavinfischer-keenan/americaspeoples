import test from "node:test";
import assert from "node:assert/strict";
import { geoEquirectangular } from "d3-geo";
import raw from "../data/voyages.json";
import { AtlasContext } from "../src/atlas-context";
import { dateValue, sampleVoyage, type Voyage } from "../src/voyages";
import {
  inAtlas,
  scopedVoyageWindows,
  scopedVoyageDate,
  scopedVoyageProgress,
  availableVoyageRecords,
  advanceMovieClock,
} from "../src/shared-movie";
import { PlaybackIndex } from "../src/playback-index";
import { dataset } from "../src/published-data";
import { validateRecord } from "../src/validation";
const voyages = raw.voyages as Voyage[];
const beagle = voyages.find((v) => v.id === "beagle-1831-1836")!;
test("every itinerary omits off-scope time but retains Pacific and American travel", () => {
  assert.equal(inAtlas([-4, 50]), false);
  assert.equal(inAtlas([57, -20]), false);
  for (const p of [
    [-70, -53],
    [151, -34],
    [-155, 20],
    [179, -20],
    [-179, -20],
  ])
    assert.equal(inAtlas(p), true);
  for (const v of voyages) {
    const windows = scopedVoyageWindows(v);
    assert.ok(windows.length);
    for (let i = 0; i <= 100; i++) {
      const date = scopedVoyageDate(v, i / 100),
        frame = sampleVoyage(v.stops, date)!;
      assert.ok(inAtlas(frame.coordinates), v.id + " stays within the atlas");
      assert.ok(Math.abs(scopedVoyageProgress(v, date) - i / 100) < 1e-6);
    }
  }
  assert.ok(scopedVoyageDate(beagle, 0) > dateValue("1832-02-08"));
  assert.ok(scopedVoyageDate(beagle, 1) < dateValue("1836-04-29"));
});
test("shared date hides future visits without removing surrounding people", () => {
  const records = [
    { id: "settlement-taos-habitation" },
    { id: "settlement-salvador" },
    ...beagle.recordIds.map((id) => ({ id })),
  ];
  const visible = availableVoyageRecords(
    records,
    voyages,
    dateValue("1832-02-27"),
  );
  assert.ok(visible.some((r) => r.id === "settlement-taos-habitation"));
  assert.ok(visible.some((r) => r.id === "settlement-salvador"));
  assert.ok(!visible.some((r) => r.id === "visit-beagle-1831-1836-3"));
  assert.ok(
    availableVoyageRecords(records, voyages, dateValue("1832-02-28")).some(
      (r) => r.id === "visit-beagle-1831-1836-3",
    ),
  );
});
test("exactly dated losses do not appear before their day within the shared year", () => {
  const wreck = { id: "dated-loss", history: { eventDate: "1492-12-25" } };
  assert.equal(
    availableVoyageRecords([wreck], voyages, dateValue("1492-10-12")).length,
    0,
  );
  assert.equal(
    availableVoyageRecords([wreck], voyages, dateValue("1492-12-25")).length,
    1,
  );
});
test("known conflict dates retain their day and reject invented calendars", () => {
  const males = dataset.records.find((r) => r.id === "context-males-revolt")!;
  assert.equal(
    availableVoyageRecords([males], voyages, dateValue("1835-01-01")).length,
    0,
  );
  assert.equal(
    availableVoyageRecords([males], voyages, dateValue("1835-01-24")).length,
    1,
  );
  assert.ok(
    validateRecord({
      ...males,
      time: { ...males.time, eventDate: "1835-02-30" },
    }).some((e) => e.includes("Calendar event date")),
  );
});
test("all contemporaneous ships move even when a different ship is selected", () => {
  const context = new AtlasContext();
  context.voyages = [
    beagle,
    { ...beagle, id: "contemporary-voyage", name: "Other voyage" },
  ];
  context.options = {
    boundaries: false,
    rails: false,
    voyages: true,
    voyageId: beagle.id,
    voyageDate: dateValue("1835-09-16"),
  };
  const html = context.draw(geoEquirectangular(), 1835, 1);
  assert.equal((html.match(/class="voyage-traveler/g) || []).length, 2);
  assert.ok(html.includes('data-voyage="contemporary-voyage"'));
  context.options.voyageDate = dateValue("1831-12-27");
  assert.equal(
    (
      context
        .draw(geoEquirectangular(), 1831, 1)
        .match(/class="voyage-traveler/g) || []
    ).length,
    0,
  );
});
test("smart clock stops at evidence boundaries and slows for in-scope journeys", () => {
  const index = new PlaybackIndex([
    {
      time: {
        kind: "occurrence",
        start: 1492,
        end: 1492,
        original: "1492",
        method: "Historical record",
        interpretation: "Occurrence",
      },
    },
  ]);
  assert.equal(
    advanceMovieClock(1491, 1, 100, index, voyages, false).date,
    1492,
  );
  const start = dateValue("1492-10-12");
  const next = advanceMovieClock(start, 0.25, 100, index, voyages, true);
  assert.ok(next.date > start && next.date < start + 0.1);
});
