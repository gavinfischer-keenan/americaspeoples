import test from "node:test";
import assert from "node:assert/strict";
import { tooltipForRecords, tooltipPosition } from "../src/map-tooltip";
import { fixture } from "./fixtures";

test("map hover uses catalog review summaries and distinguishes all-time dates from current-year evidence", () => {
  const row = fixture();
  row.title = "<literal>";
  row.review.summary = "Catalog summary retained.";
  const explore = tooltipForRecords([row], "explore", 1900)!;
  assert.equal(explore.title, "<literal>");
  assert.match(explore.summary, /Catalog summary retained/);
  assert.match(explore.dates, /100 CE/);
  assert.match(explore.dates, /all.time/i);
  const unknown = fixture();
  unknown.time = { ...unknown.time, kind: "unplaced", start: null, end: null };
  assert.match(
    tooltipForRecords([unknown], "explore", 1900)!.dates,
    /unresolved/i,
  );
  assert.equal(tooltipForRecords([], "movie", 150), null);
});

test("tooltip clamps to small viewports even beside the bottom-right corner", () => {
  assert.deepEqual(
    tooltipPosition(
      { x: 315, y: 555 },
      { width: 300, height: 200 },
      { width: 320, height: 560 },
    ),
    { left: 8, top: 347 },
  );
  const pos = tooltipPosition(
    { x: -20, y: -20 },
    { width: 100, height: 80 },
    { width: 320, height: 560 },
  );
  assert.ok(pos.left >= 8 && pos.top >= 8);
});
