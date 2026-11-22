import assert from "node:assert/strict";
import { browserFixture, mapSetting } from "../scripts/browser-fixture.mjs";

const fixture = await browserFixture({ viewport: { width: 1440, height: 900 } });
const { page, url, errors } = fixture;

try {
  // 1. #explore global range, dual-slider timeline, no movie controls, no region menu
  await page.goto(url + "#explore");
  await page.locator("body.exploring #map-host .world").waitFor();
  await page.locator("#explore-timeline").waitFor({ state: "visible" });
  assert.equal(await page.locator(".timeline").isVisible(), false, "Explore hides movie timeline");
  assert.equal(await page.locator("#explore-region").count(), 0, "Explore has no region selector");
  assert.equal(
    await page.locator('.map-navigation button:has-text("Region:")').count(),
    0,
    "No redundant Region dropdown in map toolbar",
  );
  assert.match(await page.locator("#explore-min-label").textContent(), /7\.24 million years ago/);
  assert.match(await page.locator("#explore-max-label").textContent(), /1900 CE/);

  // Wait for lazy-loaded world + Europe catalogues in Explore
  await page.waitForFunction(
    () =>
      Number(
        (document.querySelector("#explore-range-count")?.textContent || "").replace(
          /[^\d]/g,
          "",
        ),
      ) > 4500,
    { timeout: 15000 },
  );

  // 2. Narrow date window via preset & slider reveals early hominins chronologically
  await page.locator('[data-explore-preset="-7238050,-98050"]').click();
  await page.waitForFunction(
    () => Number(document.querySelector("#context-count")?.textContent || "999") === 0,
  );
  const earlyText = await page.locator("#visible-records").innerText();
  assert.match(earlyText, /Graecopithecus/);
  assert.match(earlyText, /Toros-Menalla/);
  assert.doesNotMatch(earlyText, /Te Bakoa/);

  // Slide Latest date handle to the right (all the way to 1900 CE) -> sites appear chronologically
  await page.locator("#explore-range-max").fill("10000");
  await page.locator("#explore-range-max").dispatchEvent("input");
  await page.waitForFunction(
    () => Number(document.querySelector("#visible-count")?.textContent || "0") > 4000,
  );

  // 3. Te Bakoa & Ebon placed on timeline with dates (Explore & Pacific review)
  await mapSetting(page, () =>
    page.getByLabel("Search places and evidence", { exact: true }).fill("Te Bakoa"),
  );
  await page.locator("#visible-records button", { hasText: "Te Bakoa" }).first().click();
  await page.locator("#selected-records h4").waitFor();
  assert.doesNotMatch(await page.locator("#selected-records").innerText(), /Not placed on timeline/);

  await page.goto(url + "#review/r6-te-bakoa");
  await page.locator(".review-page h2").waitFor();
  const teBakoaText = await page.locator("main").innerText();
  assert.doesNotMatch(teBakoaText, /Not placed on timeline/);
  assert.match(teBakoaText, /2000 BP|150 BCE/);

  await page.goto(url + "#review/r6-ebon-foraging");
  await page.locator(".review-page h2").waitFor();
  const ebonText = await page.locator("main").innerText();
  assert.doesNotMatch(ebonText, /Not placed on timeline/);
  assert.match(ebonText, /2000 years|50 BCE/);

  // 4. Unified header on static sites/world-human-family.html & no overflow at desktop + mobile
  await page.goto(url + "sites/world-human-family.html");
  await page.locator("header.topbar nav").waitFor();
  const topNavCount = await page.locator("header.topbar nav a").count();
  assert.ok(topNavCount >= 10, `Expected unified 10-item topbar on static guide, got ${topNavCount}`);
  assert.match(await page.locator("header.topbar").innerText(), /Climate/);
  assert.match(await page.locator("header.topbar").innerText(), /Explore/);

  await page.setViewportSize({ width: 390, height: 844 });
  const guideOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  assert.ok(guideOverflow, "world-human-family.html must have zero horizontal overflow on mobile");

  // 5. Deep Dives Foundations spotlight & Africa region filter
  await page.goto(url + "#dives");
  await page.locator(".dive-foundations").waitFor();
  assert.match(await page.locator(".dive-foundations").innerText(), /The branching human family/);
  await page.locator('[data-dive-region="africa"]').click();
  await page.locator("#dive-search-results").waitFor({ state: "visible" });
  assert.match(
    await page.locator("#dive-search-results").innerText(),
    /The branching human family/,
  );
  const divesOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  assert.ok(divesOverflow, "#dives must have zero horizontal overflow on 390x844 mobile");

  assert.deepEqual(errors, []);
  console.log("PASS global Explore dual-slider, chronological reveal, Te Bakoa/Ebon dates, unified static guide header, and Deep Dives Africa discovery.");
} finally {
  await fixture.close();
}
