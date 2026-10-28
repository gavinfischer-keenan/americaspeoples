import { chromium } from "playwright";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_PATH ||
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
});
const context = await browser.newContext({
  offline: true,
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const url = pathToFileURL(
  path.resolve(process.env.APP_PATH || "dist/index.html"),
).href;
const failed = [];
const check = async (name, fn) => {
  try {
    await fn();
    console.log("PASS " + name);
  } catch (e) {
    failed.push(name);
    console.error("FAIL " + name + ": " + e.message);
  }
};
try {
  await page.goto(url + "#map");
  await check("the full map viewport fits above the timeline", async () => {
    const svg = await page.locator('.map-canvas svg').boundingBox();
    const stage = await page.locator('.map-stage').boundingBox();
    assert.ok(svg.height <= stage.height, `SVG ${svg.height} exceeds stage ${stage.height}`);
  });
  await check(
    "visible evidence panel is not covered by fixed timeline",
    async () => {
      const panel = await page.locator(".visible-panel").boundingBox(),
        footer = await page.locator(".timeline").boundingBox();
      assert.ok(
        panel.y + panel.height <= footer.y,
        `${panel.y + panel.height} exceeds ${footer.y}`,
      );
    },
  );
  await check("map markers still select after panning", async () => {
    const svg = page.locator(".map-canvas svg");
    const rect = await svg.boundingBox();
    await page.mouse.move(rect.x + 200, rect.y + 200);
    await page.mouse.down();
    await page.mouse.move(rect.x + 230, rect.y + 220);
    await page.mouse.up();
    await page.locator("[data-point]").first().click();
    assert.equal(
      await page.locator("#visible-heading").innerText(),
      "Selected location",
    );
  });
  await check("editing preserves approximate date classification", async () => {
    await page.goto(url + "#review/monte-verde-ii");
    await page
      .getByRole("button", { name: "Suggest correction", exact: true })
      .click();
    await page
      .getByLabel("Reason for this suggestion")
      .fill("Preserve chronology flag");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await page
      .getByRole("heading", { name: "Your suggestions", exact: true })
      .waitFor();
    const local = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("americas-peoples-proposals-v1")),
    );
    assert.equal(local.proposals[0].record.time.approximate, true);
  });
  await check(
    "all evidence pages render without losing references",
    async () => {
      const data = JSON.parse(await readFile("data/evidence.json", "utf8"));
      for (const record of data.records) {
        await page.goto(url + "#review/" + record.id);
        await page
          .getByRole("heading", { name: "Bibliography", exact: true })
          .waitFor();
        assert.equal(
          await page.locator(".bibliography li").count(),
          record.sources.length,
        );
        assert.ok(
          (await page.locator("main").innerText()).includes(
            record.time.original,
          ),
        );
      }
    },
  );
  await check(
    "a suggestion that cannot be exported stays in the editor",
    async () => {
      await page.goto(url + "#review/lanse-1021");
      await page
        .getByRole("button", { name: "Suggest correction", exact: true })
        .click();
      await page
        .getByLabel("Reason for this suggestion")
        .fill("x".repeat(100001));
      await page
        .getByRole("button", { name: "Save draft", exact: true })
        .click();
      assert.ok(await page.locator("#editor-errors").isVisible());
      assert.match(
        await page.locator("#editor-errors").innerText(),
        /rationale/i,
      );
      await page
        .getByLabel("Reason for this suggestion")
        .fill("A valid suggestion");
      await page
        .getByRole("button", { name: "Save draft", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Your suggestions", exact: true })
        .waitFor();
    },
  );
  await check(
    "new rows save as portable drafts and survive reloading",
    async () => {
      await page.goto(url + "#new");
      await page
        .getByLabel("Record title", { exact: true })
        .fill("Synthetic new draft");
      await page
        .getByRole("button", { name: "Save draft", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Your suggestions", exact: true })
        .waitFor();
      await page.reload();
      await page
        .getByRole("heading", { name: "Your suggestions", exact: true })
        .waitFor();
      assert.match(
        await page.locator("main").innerText(),
        /Synthetic new draft/,
      );
    },
  );
  await check(
    "movement arrows are time-bounded and overlapping proposed cultures keep consistent colors",
    async () => {
      const data = JSON.parse(await readFile("data/evidence.json", "utf8"));
      const record = structuredClone(data.records[0]);
      record.id = "synthetic-movement";
      record.title = "SYNTHETIC movement — browser test only";
      record.type = "movement";
      record.time = {
        kind: "interval",
        start: 100,
        end: 110,
        original: "Synthetic 100–110 CE",
        method: "Test fixture",
        interpretation: "Not real archaeological evidence",
      };
      record.destination = {
        ...record.location,
        id: "synthetic-destination",
        lon: -80,
      };
      record.culture = {
        id: "synthetic-culture",
        name: "Synthetic category",
        color: "#ff0000",
        kind: "culture",
      };
      const proposal = {
        id: "synthetic-proposal",
        version: 1,
        kind: "new",
        targetId: null,
        baseRevision: null,
        baseRecord: null,
        record,
        rationale: "Synthetic browser test only",
        state: "ready",
        createdAt: "2026-10-28T12:00:00Z",
        updatedAt: "2026-10-28T12:00:00Z",
      };
      const competing = structuredClone(proposal);
      competing.id = "synthetic-proposal-b";
      competing.record.id = "synthetic-movement-b";
      competing.record.culture.color = "#0000ff";
      const pack = {
        format: "americas-peoples-proposals",
        schemaVersion: 1,
        exportedAt: "2026-10-28T12:00:00Z",
        proposals: [proposal, competing],
      };
      await writeFile("test-results/movement.json", JSON.stringify(pack));
      await page.goto(url + "#proposals");
      await page
        .getByLabel("Import suggestions")
        .setInputFiles("test-results/movement.json");
      await page
        .getByRole("heading", { name: "Review import", exact: true })
        .waitFor();
      assert.match(await page.locator("main").innerText(), /conflict/);
      await page
        .getByRole("button", { name: "Add to local collection", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Your suggestions", exact: true })
        .waitFor();
      await page.getByRole("link", { name: "Map", exact: true }).click();
      await page.getByLabel("Preview complete suggestions").check();
      for (const [year, count] of [
        [100, 2],
        [110, 2],
        [111, 0],
        [99, 0],
        [100, 2],
      ]) {
        await page
          .getByLabel("Year number", { exact: true })
          .fill(String(year));
        await page.getByLabel("Era", { exact: true }).selectOption("CE");
        await page
          .getByRole("button", { name: "Go to year", exact: true })
          .click();
        assert.equal(await page.locator(".movement").count(), count);
      }
      assert.equal(await page.locator(".site-count").textContent(), "2");
      assert.match(
        await page.locator(".site-dot").getAttribute("style"),
        /#ff0000/,
      );
      assert.equal(await page.locator(".evidence-card").count(), 2);
    },
  );
  await check("mobile layout stays within viewport", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(url + "#map");
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
    await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  });
  if (failed.length) throw new Error(failed.join("; "));
} finally {
  await browser.close();
}
