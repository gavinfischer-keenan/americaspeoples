import { build } from "esbuild";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

const out = path.resolve("test-results/map-panels-app");
await mkdir(out, { recursive: true });
await build({ entryPoints: ["src/bootstrap.ts"], bundle: true, format: "iife", platform: "browser", target: "chrome110", outfile: path.join(out, "app.js"), loader: { ".geojson": "json" } });
await writeFile(path.join(out, "index.html"), await readFile("index.html", "utf8"));
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
try {
  await page.goto(pathToFileURL(path.join(out, "index.html")).href);
  await page.getByLabel("Year number", { exact: true }).fill("1000");
  await page.getByLabel("Era", { exact: true }).selectOption("CE");
  await page.getByRole("button", { name: "Go to year", exact: true }).click();
  const choices = page.locator("[data-visible-index]");
  const initial = await choices.count();
  assert.ok(initial > 1);
  const title = await choices.first().locator("strong").innerText();
  await choices.first().click();
  assert.ok((await page.locator("#selected-records").innerText()).includes(title.replace(/\s*\*$/, "")));
  assert.equal(await choices.count(), initial, "selection preserves complete visible list");
  const left = await page.locator("#site-panel").boundingBox();
  const center = await page.locator(".map-stage").boundingBox();
  const right = await page.locator("#detail-panel").boundingBox();
  const layers = await page.locator(".layers-panel").boundingBox();
  assert.ok(left.x + left.width <= center.x + 1 && center.x + center.width <= right.x + 1 && right.x + right.width <= layers.x + 1);
  await page.screenshot({ path: "test-results/map-panels-desktop.png", fullPage: true });
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  const zoomed = await choices.count();
  const zoomedIds = await choices.allTextContents();
  assert.ok(zoomed < initial, "offscreen records leave the list on zoom");
  await page.locator(".map-canvas svg").focus();
  for (let i = 0; i < 16; i++) await page.keyboard.press("ArrowLeft");
  const pannedIds = await choices.allTextContents();
  assert.notDeepEqual(pannedIds, zoomedIds, "panning updates which records are visible");
  await page.getByRole("button", { name: "Reset map view", exact: true }).click();
  assert.equal(await choices.count(), initial, "zooming out restores visible records");
  assert.notDeepEqual(await choices.allTextContents(), pannedIds);
  await page.getByRole("button", { name: "Show layers", exact: true }).click();
  await page.getByLabel("Show modeled evidence", { exact: true }).uncheck();
  assert.ok(!(await page.locator("#visible-records").innerText()).includes("Modeled"));
  await page.getByRole("button", { name: "Hide layers", exact: true }).click();
  await page.getByRole("button", { name: "Hide site list", exact: true }).click();
  assert.equal(await page.locator("#site-panel").isVisible(), false);
  await page.getByRole("button", { name: "Show site list", exact: true }).click();
  // Every combination must keep the map and far-right layers in their own tracks.
  for (const width of [1440, 1100]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const sitesVisible of [true, false]) for (const detailsVisible of [true, false]) for (const layersOpen of [false, true]) {
      for (const [id, expanded] of [["toggle-sites", sitesVisible], ["toggle-details", detailsVisible], ["toggle-layers", layersOpen]]) {
        const button = page.locator("#" + id);
        if ((await button.getAttribute("aria-expanded")) !== String(expanded)) await button.click();
      }
      const mapBox = await page.locator(".map-stage").boundingBox();
      const layerBox = await page.locator(".layers-panel").boundingBox();
      assert.ok(mapBox.width >= 180 && mapBox.height >= 300, `usable map at ${width}: sites=${sitesVisible}, details=${detailsVisible}, layers=${layersOpen}`);
      assert.ok(layerBox.width >= (layersOpen ? 200 : 60), "layers keep their reserved width");
      const boxes = [];
      if (sitesVisible) boxes.push(await page.locator("#site-panel").boundingBox());
      boxes.push(mapBox);
      if (detailsVisible) boxes.push(await page.locator("#detail-panel").boundingBox());
      boxes.push(layerBox);
      for (let i = 1; i < boxes.length; i++) {
        assert.ok(boxes[i - 1].x + boxes[i - 1].width <= boxes[i].x + 1, "visible panels remain ordered without overlap");
        assert.ok(Math.abs(boxes[i - 1].y - boxes[i].y) <= 1, "panels remain in the same grid row");
      }
      assert.ok(layerBox.x + layerBox.width <= width + 1, "layers remain inside the viewport");
    }
  }
  for (const id of ["toggle-sites", "toggle-details"]) {
    if ((await page.locator("#" + id).getAttribute("aria-expanded")) === "false") await page.locator("#" + id).click();
  }
  if ((await page.locator("#toggle-layers").getAttribute("aria-expanded")) === "true") await page.locator("#toggle-layers").click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Show layers", exact: true }).click();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.locator(".map-stage").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/map-panels-mobile.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log(`PASS: map panels, selection, viewport zoom/pan/reset, modeled filter, panel toggles, mobile overflow (${initial} initial / ${zoomed} zoomed records).`);
} finally { await browser.close(); }
