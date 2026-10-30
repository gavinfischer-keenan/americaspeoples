import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import {
  browserFixture,
  localPackage,
  previewSuggestions,
} from "./browser-fixture.mjs";
const fixture = await browserFixture();
const { browser, page, dataset, url } = fixture;
const expectedRecords = dataset.records.length;
const expectedOverlays = dataset.records.filter((r) => r.overlay).length;
const overlayCount = (kind, year) =>
  dataset.records.filter(
    (r) =>
      r.overlay?.kind === kind &&
      r.overlay.geometry &&
      r.time.start <= year &&
      r.time.end >= year,
  ).length * 2;
try {
  await mkdir("test-results", { recursive: true });
  await page.goto(url + "#map");
  await page.getByRole("link", { name: /^Suggestions/ }).click();
  await page
    .getByLabel("Import suggestions")
    .setInputFiles("templates/americas-peoples-researched-import.xlsx");
  await page
    .getByRole("heading", { name: "Review import", exact: true })
    .waitFor();
  assert.deepEqual(
    await page.locator(".proposal-card>.tag").allTextContents(),
    Array(expectedRecords).fill("new"),
  );
  await page
    .getByRole("button", { name: "Add to local collection", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Your suggestions", exact: true })
    .waitFor();
  const pack = await localPackage(page);
  assert.equal(pack.proposals.length, expectedRecords);
  assert.ok(pack.proposals.every((proposal) => proposal.kind === "correction"));
  assert.equal(
    pack.proposals.filter((p) => p.record.overlay).length,
    expectedOverlays,
  );
  assert.equal(
    await page.locator("[data-proposal-card]").count(),
    expectedRecords,
  );
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
    if ((i + 1) % 100 === 0)
      console.log(
        `Checked ${i + 1}/${pack.proposals.length} imported review pages`,
      );
  }
  await page.getByRole("link", { name: "Movie", exact: true }).click();
  await previewSuggestions(page);
  await page.getByLabel("Era", { exact: true }).selectOption("CE");
  const go = async (y) => {
    await page.getByLabel("Year number", { exact: true }).fill(String(y));
    await page.getByRole("button", { name: "Go to year", exact: true }).click();
  };
  await go(1864);
  assert.equal(
    await page.locator(".overlay-forced-removal").count(),
    overlayCount("forced-removal", 1864),
  );
  assert.equal(
    await page.locator(".overlay-violence").count(),
    overlayCount("violence", 1864),
  );
  await page.screenshot({
    path: "test-results/researched-map-1864.png",
    fullPage: true,
  });
  await go(1837);
  assert.equal(
    await page.locator(".overlay-epidemic").count(),
    overlayCount("epidemic", 1837),
  );
  assert.equal(
    await page.locator(".overlay-forced-removal").count(),
    overlayCount("forced-removal", 1837),
  );
  await go(1934);
  assert.match(
    await page.locator("#visible-records").innerText(),
    /Indian Reorganization Act/,
  );
  await page
    .getByRole("link", { name: "Events / Evidence", exact: true })
    .click();
  for (const kind of ["forced-removal", "epidemic", "violence"]) {
    const count =
      dataset.records.filter((r) => r.overlay?.kind === kind).length * 2;
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
  assert.equal(
    await page.locator("[data-proposal-card]").count(),
    expectedRecords,
  );
  fixture.assertPrivacy();
  console.log(
    "PASS: actual researched workbook imports the full current snapshot, renders every claim and bibliography, and reimports without duplicates. " +
      (await browser.version()),
  );
} finally {
  await fixture.close();
}
