import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_PATH ||
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
});
try {
  const context = await browser.newContext({
    offline: true,
    acceptDownloads: true,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    pathToFileURL(path.resolve(process.env.APP_PATH || "dist/index.html")).href,
  );
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
  await page.getByRole("link", { name: /^Suggestions/ }).click();
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
  await page.getByRole("link", { name: "Map", exact: true }).click();
  await page.getByLabel("Year number", { exact: true }).fill("100");
  await page.getByLabel("Era", { exact: true }).selectOption("CE");
  await page.getByRole("button", { name: "Go to year" }).click();
  assert.equal(await page.locator("[data-overlay]").count(), 0);
  await page.getByLabel("Preview complete suggestions").check();
  assert.equal(await page.locator("[data-overlay]").count(), 1);
  assert.equal(await page.locator("path.movement").count(), 0);
  await page.getByLabel("Trade overlays", { exact: true }).uncheck();
  assert.equal(await page.locator("[data-overlay]").count(), 0);
  await page.getByLabel("Trade overlays", { exact: true }).check();
  for (const [y, n] of [
    [111, 0],
    [110, 1],
    [99, 0],
    [100, 1],
  ]) {
    await page.getByLabel("Year number", { exact: true }).fill(String(y));
    await page.getByRole("button", { name: "Go to year" }).click();
    assert.equal(await page.locator("[data-overlay]").count(), n);
  }
  await page.locator("[data-overlay]").click();
  await page
    .locator("#visible-records a")
    .filter({ hasText: "Synthetic exchange overlay" })
    .click();
  await page
    .getByRole("heading", { name: "Overlay geometry", exact: true })
    .waitFor();
  assert.match(await page.locator("main").innerText(), /schematic/);
  await page.getByRole("link", { name: "Map", exact: true }).click();
  await page.getByLabel("Trade overlays", { exact: true }).uncheck();
  await page.evaluate(() => (location.hash = "#proposal/0"));
  await page
    .getByRole("button", { name: "Show on map at this time", exact: true })
    .click();
  await page.locator("[data-overlay]").waitFor();
  assert.equal(await page.locator("[data-overlay]").count(), 1);
  await page
    .locator("#visible-records a")
    .filter({ hasText: "Synthetic exchange overlay" })
    .click();
  await page
    .getByRole("button", { name: "Edit suggestion", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save complete suggestion", exact: true })
    .click();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("americas-peoples-proposals-v1")),
  );
  assert.deepEqual(stored.proposals[0].record.overlay, r.overlay);
  assert.equal(stored.schemaVersion, 2);
  await page.getByRole("link", { name: "Map", exact: true }).click();
  const go = async (y) => {
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
    assert.equal(await page.locator("[data-overlay]").count(), n);
  }
  assert.equal(
    await page
      .locator('.overlay-forced-removal path[marker-end="url(#arrow)"]')
      .count(),
    1,
  );
  for (const label of [
    "Epidemic overlays",
    "Massacre / violence overlays",
    "Forced removal overlays",
  ]) {
    await page.getByLabel(label, { exact: true }).uncheck();
    assert.equal(await page.locator("[data-overlay]").count(), 2);
    await page.getByLabel(label, { exact: true }).check();
    assert.equal(await page.locator("[data-overlay]").count(), 3);
  }
  assert.equal(await page.locator("#time-slider").getAttribute("max"), "1000000");
  assert.ok((await page.locator("#range-end").innerText()).includes("1,934 CE"));
  await go(1935);
  assert.match(await page.locator("#time-error").innerText(), /1934/);
  await go(1933);
  await page.getByLabel("Playback speed").selectOption("1000");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector("#current-year")?.textContent === "1,934 CE",
  );
  assert.equal(
    await page.getByRole("button", { name: "Play", exact: true }).count(),
    1,
  );
  assert.match(
    await page.locator("#range-end").innerText(),
    /Indian Reorganization Act/,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: overlays import offline, remain opt-in, filter by layer/time, open reviews and survive editing. " +
      (await browser.version()),
  );
} finally {
  await browser.close();
}
