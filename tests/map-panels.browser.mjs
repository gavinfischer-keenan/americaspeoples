import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import {createStaticServer} from '../scripts/static-server.mjs';

await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const server=createStaticServer(process.env.DIST_PATH || "dist");await new Promise(r=>server.listen(0,'127.0.0.1',r));
page.on("pageerror", error => errors.push(error.message));
try {
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.locator("#story-select").selectOption("free");
  await page.getByRole("button", { name: "Reset map view", exact: true }).click();
  await page.locator("#toggle-sites").click();
  await page.locator("#time-settings-toggle").click();
  await page.getByLabel("Year number", { exact: true }).fill("1000");
  await page.getByLabel("Era", { exact: true }).selectOption("CE");
  await page.getByRole("button", { name: "Go to year", exact: true }).click();
  await page.locator("#time-settings-toggle").click();
  const choices = page.locator("[data-visible-index]");
  const initial = await choices.count();
  assert.ok(initial > 1);
  const title = await choices.first().locator("strong").innerText();
  await choices.first().click();
  assert.ok((await page.locator("#selected-records").innerText()).includes(title.replace(/\s*\*$/, "")));
  assert.equal(await choices.count(), initial, "selection preserves complete visible list");
  const left = await page.locator("#site-panel").boundingBox();
  const center = await page.locator(".map-stage").boundingBox();
  const inspector = await page.locator("#detail-panel").boundingBox();
  assert.ok(left.x + left.width <= center.x + 1, "the places rail leaves a distinct map stage");
  assert.ok(inspector.x >= center.x && inspector.x + inspector.width <= center.x + center.width + 1, "the floating inspector stays within the map");
  assert.ok(inspector.height > 200 && inspector.y >= center.y, "the inspector has a bounded, readable viewport");
  await page.screenshot({ path: "test-results/map-panels-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Close details", exact: true }).click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  const zoomed = await choices.count();
  const zoomedIds = await choices.allTextContents();
  assert.ok(zoomed < initial, "offscreen records leave the list on zoom");
  await page.locator(".map-canvas > svg").focus();
  for (let i = 0; i < 16; i++) await page.keyboard.press("ArrowLeft");
  // The viewport list follows the coalesced redraw, not the keydown itself.
  await page.waitForFunction(before=>JSON.stringify([...document.querySelectorAll('[data-visible-index]')].map(n=>n.textContent))!==JSON.stringify(before),zoomedIds);
  const pannedIds = await choices.allTextContents();
  assert.notDeepEqual(pannedIds, zoomedIds, "panning updates which records are visible");
  await page.getByRole("button", { name: "Reset map view", exact: true }).click();
  // Viewport notifications are intentionally coalesced to the next animation frame.
  await page.waitForFunction(expected=>document.querySelectorAll('[data-visible-index]').length===expected,initial);
  assert.equal(await choices.count(), initial, "zooming out restores visible records");
  assert.notDeepEqual(await choices.allTextContents(), pannedIds);
  await page.locator("#toggle-layers").click();
  await page.locator(".layer-disclosure summary").click();
  await page.getByLabel("Show modeled evidence", { exact: true }).uncheck();
  assert.ok(!(await page.locator("#visible-records").innerText()).includes("Modeled"));
  await page.getByRole("button", { name: "Hide layers", exact: true }).click();
  await page.getByRole("button", { name: "Hide site list", exact: true }).click();
  assert.equal(await page.locator("#site-panel").isVisible(), false);
  await page.getByRole("button", { name: "Show site list", exact: true }).click();
  // Drawers now float over the map: their bounds and close controls must remain usable.
  for (const width of [1440, 1100]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const sitesVisible of [true, false]) for (const detailsVisible of [true, false]) for (const layersOpen of [false, true]) {
      for (const [id, expanded] of [["toggle-sites", sitesVisible], ["toggle-details", detailsVisible], ["toggle-layers", layersOpen]]) {
        const button = page.locator("#" + id);
        if ((await button.getAttribute("aria-expanded")) !== String(expanded)) await button.click();
      }
      const mapBox = await page.locator(".map-stage").boundingBox();
      assert.ok(mapBox.width >= 400 && mapBox.height >= 300, `usable map at ${width}: sites=${sitesVisible}, details=${detailsVisible}, layers=${layersOpen}`);
      for (const [selector, visible] of [["#site-panel", sitesVisible], ["#detail-panel", detailsVisible], [".layers-panel", layersOpen]]) {
        assert.equal(await page.locator(selector).isVisible(), visible, `${selector} visibility matches its control`);
        if (!visible) continue;
        const box = await page.locator(selector).boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= width + 1 && box.y >= 0 && box.y + box.height <= 1001, `${selector} remains within the viewport at ${width}: ${JSON.stringify(box)}`);
      }
      if (layersOpen) {
        await page.getByRole("button", { name: "Close layers", exact: true }).click();
        assert.equal(await page.locator("#layer-options").isVisible(), false);
      }
      if (detailsVisible) {
        await page.getByRole("button", { name: "Close details", exact: true }).click();
        assert.equal(await page.locator("#detail-panel").isVisible(), false);
      }
    }
  }
  for (const id of ["toggle-sites", "toggle-details"]) {
    if ((await page.locator("#" + id).getAttribute("aria-expanded")) === "false") await page.locator("#" + id).click();
  }
  if ((await page.locator("#toggle-layers").getAttribute("aria-expanded")) === "true") await page.locator("#toggle-layers").click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#toggle-layers").click();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.locator(".map-stage").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/map-panels-mobile.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log(`PASS: map panels, selection, viewport zoom/pan/reset, modeled filter, panel toggles, mobile overflow (${initial} initial / ${zoomed} zoomed records).`);
} finally { await browser.close();await new Promise(r=>server.close(r)); }
