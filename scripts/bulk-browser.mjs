import { readFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { browserFixture } from "./browser-fixture.mjs";
const fixture = await browserFixture();
const { browser, page, url } = fixture;
try {
  await page.goto(url + "#proposals");
  await page
    .getByRole("link", { name: "Bulk import guide", exact: true })
    .waitFor();
  await page
    .getByRole("link", { name: "Download spreadsheet template", exact: true })
    .waitFor();
  await page
    .getByLabel("Import suggestions")
    .setInputFiles("templates/americas-peoples-import.xlsx");
  await page
    .getByRole("heading", { name: "Review import", exact: true })
    .waitFor();
  assert.match(await page.locator("main").innerText(), /L’Anse aux Meadows/);
  await page
    .getByRole("button", { name: "Add to local collection", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Your suggestions", exact: true })
    .waitFor();
  assert.equal(await page.locator("[data-proposal-card]").count(), 1);
  await page
    .getByRole("link", { name: "Detailed review", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Bibliography", exact: true })
    .waitFor();
  assert.equal(await page.locator(".bibliography li").count(), 2);
  assert.match(await page.locator(".bibliography").innerText(), /Kuitems/);
  await page
    .getByRole("button", { name: "Edit suggestion", exact: true })
    .click();
  assert.match(
    await page.getByLabel("Sources JSON").inputValue(),
    /journal-article/,
  );
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page
    .getByRole("heading", { name: "Your suggestions", exact: true })
    .waitFor();
  await page.getByLabel("Select proposal 1").check();
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Send to others", exact: true })
    .click();
  const download = await downloading;
  await mkdir("test-results", { recursive: true });
  await download.saveAs("test-results/xlsx-converted.json");
  const pack = JSON.parse(
    await readFile("test-results/xlsx-converted.json", "utf8"),
  );
  assert.equal(
    pack.proposals[0].record.sources[0].referenceType,
    "journal-article",
  );
  await page
    .getByLabel("Import suggestions")
    .setInputFiles("templates/americas-peoples-import.xlsx");
  await page
    .getByRole("heading", { name: "Review import", exact: true })
    .waitFor(); // Editing increments proposal version; original workbook may be retained separately.
  await page
    .getByRole("button", { name: "Add to local collection", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Your suggestions", exact: true })
    .waitFor();
  const before = await page.locator("[data-proposal-card]").count();
  await page
    .getByLabel("Import suggestions")
    .setInputFiles("templates/americas-peoples-import.xlsx");
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
  assert.equal(await page.locator("[data-proposal-card]").count(), before);
  await page
    .getByRole("link", { name: "Bulk import guide", exact: true })
    .click();
  await page
    .getByRole("heading", {
      name: "Americas Peoples bulk import guide",
      exact: true,
    })
    .waitFor();
  fixture.assertPrivacy();
  console.log(
    "PASS: HTTP/API XLSX import, structured bibliography, editing/sharing, duplicate detection, packaged guide/template links. Browser " +
      (await browser.version()),
  );
} finally {
  await fixture.close();
}
