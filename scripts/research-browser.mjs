import {mapSetting,showMapEvidence} from './browser-fixture.mjs';
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
      r.time.end >= year &&
      (!(r.time.eventDate ?? r.history?.eventDate) ||
        (r.time.eventDate ?? r.history?.eventDate) <= `${year}-01-01`),
  ).length * 2;
// Co-located original/correction records now share a marker. Count selectable
// identities rather than requiring a duplicate SVG symbol for each source row.
const renderedOverlayCount = async kind => {
  const ids=dataset.records.filter(r=>r.overlay?.kind===kind).map(r=>r.id);
  return page.locator('[data-map-tip]').evaluateAll((features,ids)=>{
    const identities=new Set();
    for(const feature of features){
      const key=feature.dataset.mapTip;if(!key.startsWith('records:'))continue;
      for(const value of JSON.parse(key.slice(8)))if(ids.includes(JSON.parse(value)[0]))identities.add(value);
    }
    return identities.size;
  },ids);
};
try {
  // Verify a focused frontend fix before rebuilding the data release; the API and
  // workbook remain the real release artifacts. The normal gate still uses dist.
  if (process.env.RESEARCH_BROWSER_SOURCE === '1') {
    const { build } = await import('esbuild');
    const bundle = await build({ entryPoints: ['src/bootstrap.ts'], bundle: true, format: 'iife', platform: 'browser', target: ['chrome110'], outfile: 'app.js', loader: { '.geojson': 'json' }, write: false });
    for (const [extension, contentType] of [['js', 'text/javascript'], ['css', 'text/css']]) {
      const body = Buffer.from(bundle.outputFiles.find(file => file.path.endsWith('.' + extension)).contents);
      await fixture.context.route(`**/app.${extension}*`, route => route.fulfill({ contentType, body }));
    }
  }
  await mkdir("test-results", { recursive: true });
  await page.goto(url + "#map");
  await page.getByRole("link", { name: "Library", exact: true }).click();
  await page.locator('.library-card[href="#proposals"]').click();
  const importStarted = performance.now();
  await page.locator('#import-file').setInputFiles("templates/americas-peoples-researched-import.xlsx");
  // Scope large-batch checks to known controls. A document-wide role query walks
  // every card and its collapsed comparisons before finding this heading.
  await page.locator('#confirm-import').waitFor();
  assert.equal(await page.locator('.proposals-page > h2').textContent(), 'Review import');
  console.log(`Imported ${expectedRecords} records for review in ${Math.round(performance.now() - importStarted)} ms`);
  assert.equal(await page.locator('[data-incoming-index]').count(), expectedRecords);
  assert.equal(await page.locator('[data-incoming-index] pre:not(:empty)').count(), 0, 'Full record JSON must be deferred until its details opens');
  assert.equal(await page.locator('.comparison[data-comparison-pending]').count(), expectedRecords);
  assert.equal(await page.locator('.comparison pre').count(), 0, 'Collapsed batch comparisons must not eagerly render source text');
  console.log('Import preview DOM:', await page.evaluate(() => ({ elements: document.querySelectorAll('*').length, preCharacters: [...document.querySelectorAll('main pre')].reduce((sum, pre) => sum + pre.textContent.length, 0), heapBytes: performance.memory?.usedJSHeapSize })));
  const inspectedIndex = Math.floor(expectedRecords / 2);
  const incomingDetails = page.locator(`[data-incoming-index="${inspectedIndex}"]`);
  await incomingDetails.locator('summary').click();
  await page.waitForFunction(index => document.querySelector(`[data-incoming-index="${index}"]`)?.getAttribute('data-loaded') === 'true', inspectedIndex);
  const inspectedRecord = JSON.parse(await incomingDetails.locator('pre').textContent());
  assert.equal(await page.locator('[data-incoming-index] pre:not(:empty)').count(), 1, 'Opening one record must not render the other incoming JSON blocks');
  const comparison = page.locator(`[data-proposal-index="${inspectedIndex}"] .comparison`);
  const comparisonSummary = await comparison.locator('summary').textContent();
  await comparison.locator('summary').click();
  await page.waitForFunction(index => !document.querySelector(`[data-proposal-index="${index}"] .comparison`)?.hasAttribute('data-comparison-pending'), inspectedIndex);
  const inspectedComparison = await comparison.evaluate(details => [...details.querySelectorAll('h4')].map(heading => {
    const blocks = heading.nextElementSibling.querySelectorAll('pre');
    return { field: heading.textContent, original: blocks[0].textContent, proposed: blocks[1].textContent };
  }));
  const comparisonBody = await comparison.innerHTML();
  await comparison.locator('summary').click();
  await comparison.locator('summary').click();
  assert.equal(await comparison.innerHTML(), comparisonBody, 'Reopening a comparison must not duplicate its contents');
  assert.equal(await comparison.locator('summary').textContent(), comparisonSummary);
  assert.deepEqual(
    await page.locator(".proposal-card>.tag").allTextContents(),
    Array(expectedRecords).fill("new"),
  );
  await page.locator('#confirm-import').click();
  await page.locator('#import-file').waitFor();
  assert.equal(await page.locator('.proposals-page h2').textContent(), 'Your suggestions');
  const pack = await localPackage(page);
  assert.deepEqual(inspectedRecord, pack.proposals[inspectedIndex].record, 'Opened details retain the exact imported record and all sources');
  const inspectedProposal = pack.proposals[inspectedIndex];
  const printable = value => typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  const changed = [...new Set([...Object.keys(inspectedProposal.baseRecord), ...Object.keys(inspectedProposal.record)])]
    .filter(field => JSON.stringify(inspectedProposal.baseRecord[field]) !== JSON.stringify(inspectedProposal.record[field]));
  assert.deepEqual(inspectedComparison, changed.map(field => ({ field, original: printable(inspectedProposal.baseRecord[field]), proposed: printable(inspectedProposal.record[field]) })));
  assert.equal(await page.locator('.comparison[data-comparison-pending]').count(), expectedRecords, 'The saved batch also defers its comparison bodies');
  assert.equal(await page.locator('.comparison pre').count(), 0);
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
  await page.getByRole("link", { name: 'Americas', exact: true }).click();
  await mapSetting(page, () => page.locator("#story-select").selectOption("free"));
  await page.getByRole("button", { name: "Reset map view", exact: true }).click();
  await showMapEvidence(page);
  await page.locator("#toggle-layers").click();
  await previewSuggestions(page);
  assert.equal(await page.locator("#toggle-layers").getAttribute("aria-expanded"),"false");
  await page.locator("#time-settings-toggle").click();
  await page.getByLabel("Era", { exact: true }).selectOption("CE");
  const go = async (y) => {
    await page.getByLabel("Year number", { exact: true }).fill(String(y));
    await page.getByRole("button", { name: "Go to year", exact: true }).click();
  };
  await go(1864);
  assert.equal(
    await renderedOverlayCount("forced-removal"),
    overlayCount("forced-removal", 1864),
  );
  assert.equal(
    await renderedOverlayCount("violence"),
    overlayCount("violence", 1864),
  );
  await page.screenshot({
    path: "test-results/researched-map-1864.png",
    fullPage: true,
  });
  await go(1837);
  assert.equal(
    await renderedOverlayCount("epidemic"),
    overlayCount("epidemic", 1837),
  );
  assert.equal(
    await renderedOverlayCount("forced-removal"),
    overlayCount("forced-removal", 1837),
  );
  await go(1900);
  assert.ok(dataset.records.some(r=>r.time.start===1934&&r.title.includes("Indian Reorganization Act")), "The 1934 event remains in the archive");
  assert.doesNotMatch(
    await page.locator("#visible-records").innerText(),
    /Indian Reorganization Act/,
  );
  await page.getByRole("link", { name: "Library", exact: true }).click();
  await page.locator('.library-card[href="#evidence"]').click();
  for (const kind of ["forced-removal", "epidemic", "violence"]) {
    const count =
      dataset.records.filter((r) => r.overlay?.kind === kind).length * 2;
    await page.getByLabel("Record type filter").selectOption(kind);
    let displayed = 0;
    const seen = new Set();
    while (true) {
      const links = await page.locator("tbody tr[data-href]").evaluateAll(rows => rows.map(row => row.dataset.href));
      for (const link of links) {
        assert.ok(!seen.has(link), kind + " repeats a record between pages");
        seen.add(link);
      }
      displayed += links.length;
      const next = page.getByRole("button", {name: "Next page", exact: true});
      if (await next.isDisabled()) break;
      await next.click();
    }
    assert.equal(displayed, count);
  }
  await page.getByRole("link", { name: "Library", exact: true }).click();
  await page.locator('.library-card[href="#proposals"]').click();
  await page.locator('#import-file').setInputFiles("templates/americas-peoples-researched-import.xlsx");
  await page.locator('#confirm-import').waitFor();
  assert.equal(await page.locator('.proposals-page > h2').textContent(), 'Review import');
  assert.deepEqual(await page.locator('.proposal-card > .tag').allTextContents(), Array(expectedRecords).fill('duplicate'));
  await page.locator('#confirm-import').click();
  await page.locator('#import-file').waitFor();
  assert.equal(await page.locator('.proposals-page h2').textContent(), 'Your suggestions');
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
