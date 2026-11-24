import {mapSetting} from './browser-fixture.mjs';
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import {
  browserFixture,
  localPackage,
  previewSuggestions,
  layerOptions as showLayers,
} from "./browser-fixture.mjs";
const fixture = await browserFixture();
const { browser, page, url } = fixture;
const dateOptions = async () => {
  if (await page.locator("#layer-options").isVisible()) await page.locator("#close-layers").click();
  if (!(await page.locator("#time-settings").isVisible())) await page.locator("#time-settings-toggle").click();
};
const freeTimeline = async () => {
  await mapSetting(page, () => page.locator("#story-select").selectOption("free"));
  await page.getByRole("button", { name: "Reset map view", exact: true }).click();
  await dateOptions();
};
const layerOptions = async () => {
  if (await page.locator("#time-settings").isVisible()) await page.locator("#time-settings-toggle").click();
  await showLayers(page);
  if (!(await page.locator(".layer-disclosure").evaluate(el => el.open)))
    await page.locator(".layer-disclosure > summary").click();
};
const synthetic = () =>
  page.locator('[data-member-ids*="test-trade-overlay"],[data-member-ids*="historical-overlay-"]');
try {
  await page.goto(url + "#map");
  const d = JSON.parse(await readFile("data/evidence.json", "utf8"));
  const r = structuredClone(d.records[4]);
  r.id = "test-trade-overlay";
  r.type = "event";
  r.title = "Synthetic exchange overlay";
  r.time = { ...r.time, kind: "interval", start: 100, end: 110 };
  r.overlay = {
    kind: "trade",
    basis: "schematic",
    geometry: {
      type: "LineString",
      coordinates: [
        [-105, 35],
        [-100, 30],
      ],
    },
    precision: "Regional endpoints only",
    provenance: "Synthetic browser test, not archaeological evidence.",
  };
  const p = {
    id: "overlay-test",
    version: 1,
    kind: "new",
    targetId: null,
    baseRevision: null,
    baseRecord: null,
    record: r,
    rationale: "Synthetic test fixture",
    state: "ready",
    createdAt: "2026-10-28T00:00:00Z",
    updatedAt: "2026-10-28T00:00:00Z",
  };
  await page.getByRole("link", { name: "Library", exact: true }).click();
  await page.locator('.library-card[href="#proposals"]').click();
  await page.getByLabel("Import suggestions").setInputFiles({
    name: "overlay.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "americas-peoples-proposals",
        schemaVersion: 2,
        exportedAt: "2026-10-28T00:00:00Z",
        proposals: [
          p,
          ...["epidemic", "violence", "forced-removal"].map((kind, i) => {
            const q = structuredClone(p);
            q.id = "historical-overlay-" + i;
            q.record.id = q.id;
            q.record.title = "Synthetic " + kind;
            q.record.time = {
              ...q.record.time,
              kind: "occurrence",
              start: 1864,
              end: 1864,
            };
            q.record.overlay.kind = kind;
            if (kind !== "forced-removal")
              q.record.overlay.geometry = {
                type: "Point",
                coordinates: [-110 + i * 12, 40],
              };
            return q;
          }),
        ],
      }),
    ),
  });
  await page
    .getByRole("heading", { name: "Review import", exact: true })
    .waitFor({ timeout: 4000 });
  await page
    .getByRole("button", { name: "Add to local collection", exact: true })
    .click();
  await page.getByRole("link", { name: 'Americas', exact: true }).click();
  await freeTimeline();
  await page.getByLabel("Year number", { exact: true }).fill("100");
  await page.getByLabel("Era", { exact: true }).selectOption("CE");
  await page.getByRole("button", { name: "Go to year" }).click();
  assert.equal(await synthetic().count(), 0);
  await page.locator("#time-settings-toggle").click();
  await showLayers(page);
  await previewSuggestions(page);
  await layerOptions();
  assert.equal(await synthetic().count(), 1);
  assert.equal(await page.locator("path.movement.proposal-path").count(), 0);
  await mapSetting(page, () => page.getByLabel("Trade overlays", { exact: true }).uncheck());
  assert.equal(await synthetic().count(), 0);
  await mapSetting(page, () => page.getByLabel("Trade overlays", { exact: true }).check());
  await dateOptions();
  for (const [y, n] of [
    [111, 0],
    [110, 1],
    [99, 0],
    [100, 1],
  ]) {
    await page.getByLabel("Year number", { exact: true }).fill(String(y));
    await page.getByRole("button", { name: "Go to year" }).click();
    assert.equal(await synthetic().count(), n);
  }
  await page.locator("#time-settings-toggle").click();
  const routePoint=await synthetic().locator('path.overlay-line-hit').evaluate(path=>{
    const point=path.getPointAtLength(path.getTotalLength()/2),screen=new DOMPoint(point.x,point.y).matrixTransform(path.getScreenCTM());
    return {x:screen.x,y:screen.y};
  });
  await page.mouse.click(routePoint.x,routePoint.y);
  // Place-first picking may expose a nearby town before a route in an overview.
  // The overlap chooser must still make the intended overlay selectable.
  if(!(await page.locator('#selected-records').innerText()).includes('Synthetic exchange overlay'))
    await page.locator('#selection-choices').getByRole('button',{name:'Synthetic exchange overlay',exact:true}).click();
  await page
    .locator("#selected-records")
    .getByRole("link", { name: /Full review/ })
    .click();
  await page.locator('.review-technical > summary').click();
  await page
    .getByRole("heading", { name: "Overlay geometry", exact: true })
    .waitFor();
  assert.match(await page.locator("main").innerText(), /schematic/);
  await page.getByRole("link", { name: 'Americas', exact: true }).click();
  await freeTimeline();
  await layerOptions();
  await mapSetting(page, () => page.getByLabel("Trade overlays", { exact: true }).uncheck());
  await page.evaluate(() => (location.hash = "#proposal/0"));
  await page
    .getByRole("button", { name: "Show on map at this time", exact: true })
    .click();
  await synthetic().waitFor();
  assert.equal(await synthetic().count(), 1);
  await page
    .locator("#selected-records")
    .getByRole("link", { name: /Full review/ })
    .click();
  await page
    .getByRole("button", { name: "Edit suggestion", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save complete suggestion", exact: true })
    .click();
  const stored = await localPackage(page);
  assert.deepEqual(stored.proposals[0].record.overlay, r.overlay);
  assert.equal(stored.schemaVersion, 2);
  await page.getByRole("link", { name: 'Americas', exact: true }).click();
  await freeTimeline();
  await layerOptions();
  const go = async (y) => {
    await dateOptions();
    await page.getByLabel("Year number", { exact: true }).fill(String(y));
    await page.getByRole("button", { name: "Go to year" }).click();
  };
  for (const [y, n] of [
    [1863, 0],
    [1864, 3],
    [1865, 0],
    [1864, 3],
  ]) {
    await go(y);
    assert.equal(await synthetic().count(), n);
  }
  assert.equal(
    await page
      .locator(".overlay-forced-removal")
      .filter({ hasText: "Synthetic forced-removal" })
      .locator('path.route-line[marker-end]')
      .count(),
    0, 'An unspecified direction must not gain an arrow from coordinate order.'
  );
  await layerOptions();
  for (const label of [
    "Epidemic overlays",
    "Massacre / violence overlays",
    "Forced removal overlays",
  ]) {
    await mapSetting(page, () => page.getByLabel(label, { exact: true }).uncheck());
    assert.equal(await synthetic().count(), 2);
    await mapSetting(page, () => page.getByLabel(label, { exact: true }).check());
    assert.equal(await synthetic().count(), 3);
  }
  assert.equal(
    await page.locator("#time-slider").getAttribute("max"),
    "1000000",
  );
  assert.ok(
    (await page.locator("#range-end").innerText()).includes("1,900 CE"),
  );
  await go(1901);
  assert.match(await page.locator("#time-error").innerText(), /1900/);
  await go(1899);
  await page.getByLabel("Playback speed").selectOption("1000");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector("#current-year")?.textContent === "1,900 CE",
  );
  await page.getByRole("button", { name: "Play", exact: true }).waitFor();
  assert.match(await page.locator('#map-instruction').innerText(),/1900-12-31/);
  assert.equal(
    await page.getByRole("button", { name: "Play", exact: true }).count(),
    1,
  );
  assert.match(
    await page.locator("#range-end").innerText(),
    /1,900 CE.*End of this atlas/,
  );
  fixture.assertPrivacy();
  console.log(
    "PASS: overlays import through HTTP/API, remain opt-in, filter by layer/time, open reviews and survive editing. " +
      (await browser.version()),
  );
} finally {
  await fixture.close();
}
