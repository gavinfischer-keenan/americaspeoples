import fsSnapshot from "node:fs";
const snapshot=JSON.parse(fsSnapshot.readFileSync("dist/evidence-appendix.json","utf8"));
const expectedRecords=snapshot.records.length;
const expectedOverlays=snapshot.records.filter(x=>x.record.overlay).length;
import { chromium } from "playwright";
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
  const errors = [],
    network = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (/^https?:/.test(r.url())) network.push(r.url());
  });
  await page.goto(
    pathToFileURL(path.resolve(process.env.APP_PATH || "dist/index.html")).href,
  );
  await page.getByRole("link", { name: /^Suggestions/ }).click();
  await page
    .getByLabel("Import suggestions")
    .setInputFiles("templates/americas-peoples-researched-import.xlsx");
  await page
    .getByRole("heading", { name: "Review import", exact: true })
    .waitFor();
  assert.deepEqual(
    await page.locator(".proposal-card>.tag").allTextContents(),
    Array(expectedRecords).fill("correction"),
  );
  await page
    .getByRole("button", { name: "Add to local collection", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Your suggestions", exact: true })
    .waitFor();
  const pack = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("americas-peoples-proposals-v1")),
  );
  assert.equal(pack.proposals.length, expectedRecords);
  assert.equal(pack.proposals.filter((p) => p.record.overlay).length, expectedOverlays);
  assert.equal(await page.locator("[data-proposal-card]").count(), expectedRecords);
  for (let i = 0; i < pack.proposals.length; i++) {
    const r = pack.proposals[i].record;
    await page.evaluate((i) => (location.hash = "#proposal/" + i), i);
    await page.waitForFunction(
      (id) =>
        document
          .querySelector(".review-page .eyebrow")
          ?.textContent.includes(id),
      r.id,
    );
    assert.equal(
      await page.locator(".bibliography>li").count(),
      r.sources.length,
    );
    assert.equal(await page.locator(".claim").count(), r.claims.length);
  }
  await page.getByRole("link", { name: "Map", exact: true }).click();
  await page.getByLabel("Preview complete suggestions").check();
  await page.getByLabel("Era", { exact: true }).selectOption("CE");
  const go = async (y) => {
    await page.getByLabel("Year number", { exact: true }).fill(String(y));
    await page.getByRole("button", { name: "Go to year", exact: true }).click();
  };
  await go(1864);
  assert.equal(await page.locator(".overlay-forced-removal").count(), 1);
  assert.equal(await page.locator(".overlay-violence").count(), 1);
  await page.screenshot({
    path: "test-results/researched-map-1864.png",
    fullPage: true,
  });
  await go(1837);
  assert.equal(await page.locator(".overlay-epidemic").count(), 1);
  assert.equal(await page.locator(".overlay-forced-removal").count(), 1);
  await go(1934);
  assert.match(
    await page.locator("#visible-records").innerText(),
    /Indian Reorganization Act/,
  );
  await page
    .getByRole("link", { name: "Events / Evidence", exact: true })
    .click();
  for (const [kind, count] of [
    ["forced-removal", 6],
    ["epidemic", 5],
    ["violence", 6],
  ]) {
    await page.getByLabel("Record type filter").selectOption(kind);
    assert.equal(await page.locator("tbody tr[data-href]").count(), count);
  }
  await page.getByRole("link", { name: /^Suggestions/ }).click();
  await page
    .getByLabel("Import suggestions")
    .setInputFiles("templates/americas-peoples-researched-import.xlsx");
  await page
    .getByRole("heading", { name: "Review import", exact: true })
    .waitFor();
  assert.match(await page.locator("main").innerText(), /duplicate/);
  await page
    .getByRole("button", { name: "Add to local collection", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Your suggestions", exact: true })
    .waitFor();
  assert.equal(await page.locator("[data-proposal-card]").count(), expectedRecords);
  assert.deepEqual(errors, []);
  assert.deepEqual(network, []);
  console.log(
    "PASS: actual researched workbook imports expectedRecords proposals, renders every claim and bibliography, and reimports without duplicates. " +
      (await browser.version()),
  );
} finally {
  await browser.close();
}
