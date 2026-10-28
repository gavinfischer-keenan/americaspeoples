import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
const executablePath =
  process.env.BROWSER_PATH ||
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({
  offline: true,
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: true,
});
const page = await context.newPage();
const errors = [],
  network = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (/^https?:/.test(r.url())) network.push(r.url());
});
const url = pathToFileURL(
  path.resolve(process.env.APP_PATH || "dist/index.html"),
).href;
await mkdir("test-results", { recursive: true });
try {
  await page.goto(url);
  await page
    .getByRole("heading", { name: "Americas Peoples", exact: true })
    .waitFor();
  await page.getByLabel("Year number", { exact: true }).fill("1803");
  await page.getByLabel("Era", { exact: true }).selectOption("CE");
  await page.getByRole("button", { name: "Go to year", exact: true }).click();
  assert.match(await page.locator("#current-year").innerText(), /1,803 CE/);
  await page
    .getByRole("link", { name: "Events / Evidence", exact: true })
    .click();
  await page.getByLabel("Table period").selectOption("all");
  const rows = page.locator("tbody tr");
  assert.ok((await rows.count()) >= 4);
  await rows.first().getByRole("link", { name: "Detailed review" }).click();
  await page
    .getByRole("heading", { name: "Evidence and interpretation" })
    .waitFor();
  await page.getByRole("heading", { name: "Bibliography" }).waitFor();
  const originalTitle = (await page.locator("main h2").first().innerText())
    .replace(/\*$/, "")
    .trim();
  await page
    .getByRole("button", { name: "Suggest correction", exact: true })
    .click();
  await page
    .getByLabel("Record title", { exact: true })
    .fill("A local proposed correction");
  await page
    .getByLabel("Reason for this suggestion")
    .fill("Browser test only; not research.");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page
    .getByRole("heading", { name: "Your suggestions", exact: true })
    .waitFor();
  await page.getByLabel("Select proposal 1").check();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Send to others", exact: true })
    .click();
  const download = await downloadPromise;
  await download.saveAs("test-results/proposals.json");
  const pack = JSON.parse(
    await readFile("test-results/proposals.json", "utf8"),
  );
  assert.equal(pack.proposals[0].record.title, "A local proposed correction");
  assert.equal(pack.proposals[0].state, "draft");
  await page
    .getByLabel("Import suggestions")
    .setInputFiles("test-results/proposals.json");
  await page
    .getByRole("heading", { name: "Review import", exact: true })
    .waitFor();
  assert.match(await page.locator("main").innerText(), /duplicate/i);
  await page
    .getByRole("button", { name: "Add to local collection", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Your suggestions", exact: true })
    .waitFor();
  assert.equal(await page.locator("[data-proposal-card]").count(), 1);
  await page
    .getByRole("link", { name: "Events / Evidence", exact: true })
    .click();
  assert.ok((await page.locator("tbody").innerText()).includes(originalTitle));
  assert.ok(
    !(await page.locator("tbody").innerText()).includes(
      "A local proposed correction",
    ),
  );
  await page.getByRole("link", { name: "Map", exact: true }).click();
  await page
    .getByRole("button", { name: "Earliest evidence", exact: true })
    .click();
  const initial = await page.locator("#current-year").innerText();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.waitForTimeout(350);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  assert.notEqual(await page.locator("#current-year").innerText(), initial);
  await page.screenshot({ path: "test-results/map.png", fullPage: true });
  assert.deepEqual(network, []);
  assert.deepEqual(errors, []);
  // A separate browser context denies all storage. Imports still render as text and downloads still work.
  const denied = await browser.newContext({
    offline: true,
    viewport: { width: 1280, height: 900 },
  });
  await denied.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Denied");
      },
    });
  });
  const hostile = await denied.newPage();
  await hostile.goto(url + "#proposals");
  const copy = structuredClone(pack);
  copy.proposals[0].id = "hostile-copy";
  copy.proposals[0].record.title = '<img src=x onerror="window.pwned=true">';
  await writeFile("test-results/hostile.json", JSON.stringify(copy));
  await hostile
    .getByLabel("Import suggestions")
    .setInputFiles("test-results/hostile.json");
  await hostile
    .getByRole("button", { name: "Add to local collection", exact: true })
    .click();
  assert.equal(await hostile.evaluate(() => window.pwned), undefined);
  assert.equal(await hostile.locator("main img").count(), 0);
  assert.match(
    await hostile.locator("#storage-status").innerText(),
    /unavailable/i,
  );
  await denied.close();
  console.log(
    "PASS: offline file:// timeline, table/review, correction, export/import, duplicate detection, storage-denied and hostile-text browser checks.",
  );
  console.log("Browser: " + (await browser.version()));
} finally {
  await browser.close();
}
