import fsSnapshot from "node:fs";
const snapshot=JSON.parse(fsSnapshot.readFileSync("dist/evidence-appendix.json","utf8"));
const expectedRecords=snapshot.records.length;
const expectedOverlays=snapshot.records.filter(x=>x.record.overlay).length;
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createStaticServer } from "./static-server.mjs";

const server = createStaticServer(process.env.DIST_PATH || "dist");
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_PATH ||
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
});
try {
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  const requests = [],
    errors = [],
    violations = [];
  await context.addInitScript(() =>
    document.addEventListener("securitypolicyviolation", (e) =>
      console.error("CSP: " + e.violatedDirective),
    ),
  );
  page.on("request", (r) =>
    requests.push({ url: r.url(), method: r.method(), type: r.resourceType() }),
  );
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.text().startsWith("CSP:")) violations.push(m.text());
  });
  // A deployment or reload must preserve an existing collection at the same origin.
  const sourcePack = JSON.parse(
    await readFile("data/research-proposals.json", "utf8"),
  );
  const saved = { ...sourcePack, proposals: [sourcePack.proposals[0]] };
  await page.goto(origin);
  await page.evaluate(
    (p) =>
      localStorage.setItem("americas-peoples-proposals-v1", JSON.stringify(p)),
    saved,
  );
  await page.goto(origin + "/#review/lanse-1021");
  await page
    .getByRole("heading", { name: "Bibliography", exact: true })
    .waitFor();
  assert.match(
    await page.locator(".offline-badge").innerText(),
    /Local processing/,
  );
  await page.reload();
  await page
    .getByRole("heading", { name: "Bibliography", exact: true })
    .waitFor();
  assert.deepEqual(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("americas-peoples-proposals-v1")),
    ),
    saved,
  );
  await page.getByRole("link", { name: /^Suggestions/ }).click();
  await page
    .getByLabel("Import suggestions")
    .setInputFiles("templates/americas-peoples-researched-import.xlsx");
  await page
    .getByRole("heading", { name: "Review import", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Add to local collection", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Your suggestions", exact: true })
    .waitFor();
  assert.equal(await page.locator("[data-proposal-card]").count(), expectedRecords + saved.proposals.length);
  const savedAfter = await page.evaluate(() =>
    localStorage.getItem("americas-peoples-proposals-v1"),
  );
  await page.reload();
  await page
    .getByRole("heading", { name: "Your suggestions", exact: true })
    .waitFor();
  assert.equal(await page.locator("[data-proposal-card]").count(), expectedRecords + saved.proposals.length);
  assert.equal(
    await page.evaluate(() =>
      localStorage.getItem("americas-peoples-proposals-v1"),
    ),
    savedAfter,
  );
  await page.getByRole("button", { name: "Select all", exact: true }).click();
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Send to others", exact: true })
    .click();
  const download = await downloadEvent;
  await mkdir("test-results", { recursive: true });
  await download.saveAs("test-results/hosted-proposals.json");
  assert.equal(
    JSON.parse(await readFile("test-results/hosted-proposals.json", "utf8"))
      .proposals.length,
    expectedRecords + saved.proposals.length,
  );
  await page.getByRole("link", { name: "Map", exact: true }).click();
  // Check the published map independently of the preserved local draft.
  await page.getByLabel("Preview complete suggestions").uncheck();
  await page.getByLabel("Year number", { exact: true }).fill("1864");
  await page.getByLabel("Era", { exact: true }).selectOption("CE");
  await page.getByRole("button", { name: "Go to year", exact: true }).click();
  assert.equal(await page.locator(".overlay-forced-removal").count(), 1);
  assert.equal(await page.locator(".overlay-violence").count(), 1);
  await page.goto(origin + "/evidence-appendix.html");
  assert.equal(await page.locator("details[data-evidence-id]").count(), expectedRecords);
  const appendix = await (
    await fetch(origin + "/evidence-appendix.json")
  ).json();
  assert.equal(appendix.records.filter((r) => r.defaultVisible).length, expectedRecords);
  for (const url of [
    "/app.js",
    "/app.css",
    "/templates/americas-peoples-researched-import.xlsx",
    "/docs/bulk-import-guide.html",
    "/research-proposals.json",
  ]) {
    const response = await fetch(origin + url);
    assert.equal(response.status, 200, url);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  }
  assert.equal((await fetch(origin + "/not-a-real-route")).status, 404);
  assert.equal(
    (await fetch(origin, { method: "POST", body: "synthetic" })).status,
    405,
  );
  assert.ok(
    requests.every((r) => r.url.startsWith(origin + "/") && r.method === "GET"),
  );
  assert.ok(
    requests.every(
      (r) => !["fetch", "xhr", "websocket", "eventsource"].includes(r.type),
    ),
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(violations, []);
  const unsupported = await browser.newContext();
  await unsupported.addInitScript(() => {
    window.structuredClone = undefined;
  });
  const oldPage = await unsupported.newPage();
  await oldPage.goto(origin);
  await oldPage.getByRole("alert").waitFor({ timeout: 3000 });
  assert.match(
    await oldPage.getByRole("alert").innerText(),
    /missing features/,
  );
  await unsupported.close();
  const nojs = await browser.newContext({ javaScriptEnabled: false });
  const nojsPage = await nojs.newPage();
  await nojsPage.goto(origin);
  assert.match(
    await nojsPage.locator("noscript").innerText(),
    /JavaScript enabled/,
  );
  await nojs.close();
  const report = {
    checkedAt: new Date().toISOString(),
    browser: await browser.version(),
    origin: "local HTTP root, not production",
    recordsImported: expectedRecords,
    appendixRecords: expectedRecords,
    requests,
    errors,
    violations,
    persistencePreserved: true,
  };
  await writeFile(
    "test-results/hosted-verification.json",
    JSON.stringify(report, null, 2),
  );
  console.log(
    "PASS: hosted root, hash deep links, complete snapshot import/export, persistence, appendix, CSP, unsupported-browser message and no data uploads. Browser " +
      report.browser,
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
