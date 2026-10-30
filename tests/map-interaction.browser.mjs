// Isolated source fixture: never rebuilds or writes the release/dist.
import { build } from "esbuild";
import { chromium } from "playwright";
import http from "node:http";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const bundle = await build({
  stdin: {
    resolveDir: process.cwd(),
    contents: `
import {MapView} from './src/map';
import {fixture} from './tests/fixtures';
import {setPhysicalData} from './src/physical';
window.selected=[];window.pauses=0;
const record=fixture();record.title='A <literal> place';record.review.summary='A useful review summary, not a popup.';
const companion={...record,id:'companion',title:'Grouped companion',review:{...record.review,summary:'Companion summary'}};
const overlay={...record,id:'overlay',title:'Overlay example',overlay:{kind:'trade',basis:'schematic',geometry:{type:'LineString',coordinates:[[-120,20],[-80,10]]}}};
const context={...record,id:'context',title:'Unresolved date',location:{...record.location,lon:-140},time:{...record.time,kind:'unplaced',start:null,end:null}};
const hazard={id:'test-hazard',kind:'earthquake',title:'Catalog earthquake',start:150,end:150,coordinates:[-80,40],sourceId:'noaa-earthquake',status:'Published catalog entry',detail:{},limitations:'No settlement impact inferred.',url:'https://example.org/event'};
setPhysicalData({events:[hazard]},{snapshots:[]});
window.map=new MapView({type:'FeatureCollection',features:[]},rows=>window.selected.push(rows.map(r=>r.id)));
document.body.append(map.element);window.record=record;window.companion=companion;window.overlay=overlay;window.context=context;
window.configure=(mode,playing)=>map.setInteraction({mode,playing,onPause:()=>window.pauses++});
window.reset=()=>{window.selected=[];window.pauses=0;map.update([record,companion,overlay],150,[context]);};
reset();window.ready=true;
`,
  },
  bundle: true,
  write: false,
  format: "iife",
  platform: "browser",
});
const css = await readFile("src/styles.css", "utf8");
const server = http.createServer((req, res) => {
  res.setHeader(
    "content-type",
    req.url === "/app.js" ? "text/javascript" : "text/html",
  );
  res.end(
    req.url === "/app.js"
      ? bundle.outputFiles[0].text
      : `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}\nbody{margin:0}.map-canvas{width:100%;height:800px}.map-canvas>svg{width:100%;height:100%}</style><script src="/app.js" defer></script>`,
  );
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_PATH ||
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 900 },
  });
  const errors = [];
  const requests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => requests.push(r.url()));
  await page.goto("http://127.0.0.1:" + server.address().port);
  await page.waitForFunction(() => window.ready);
  // New API is exercised before any future imports/helpers can mask a missing implementation.
  await page.evaluate(() => configure("movie", true));
  for (const selector of [
    "[data-point]",
    "[data-overlay]",
    "[data-context]",
    ".hazard-marker",
    ".land",
  ]) {
    const result = await page.evaluate((selector) => {
      reset();
      configure("movie", true);
      const el = document.querySelector(selector);
      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
      });
      el.dispatchEvent(event);
      return {
        pauses,
        selected,
        prevented: event.defaultPrevented,
        hash: location.hash,
      };
    }, selector);
    assert.deepEqual(
      result,
      { pauses: 1, selected: [], prevented: true, hash: "" },
      selector,
    );
  }
  await page.evaluate(() => {
    reset();
    configure("movie", true);
    document
      .querySelector("[data-point]")
      .dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    document
      .querySelector("[data-point]")
      .dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
  });
  assert.deepEqual(await page.evaluate(() => ({ pauses, selected })), {
    pauses: 1,
    selected: [["test-site-episode", "companion"]],
  });
  // Map navigation controls do not masquerade as evidence clicks.
  const auxiliary = await page.evaluate(() => {
    reset();
    configure("movie", true);
    const event = new MouseEvent("auxclick", {
      bubbles: true,
      cancelable: true,
      button: 1,
    });
    document.querySelector(".hazard-marker").dispatchEvent(event);
    return { pauses, prevented: event.defaultPrevented };
  });
  assert.deepEqual(auxiliary, { pauses: 1, prevented: true });
  await page.evaluate(() => {
    reset();
    configure("movie", true);
    document.querySelector('[data-zoom="in"]').click();
  });
  assert.equal(await page.evaluate(() => pauses), 0);
  assert.equal(await page.evaluate(() => selected.length), 0);
  await page.evaluate(() => {
    reset();
    configure("movie", true);
    document.querySelector(".hazard-marker").focus();
  });
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => location.hash), "");
  assert.equal(await page.evaluate(() => pauses), 1);
  // All-time Explore geometry must remain visible at a year outside its interval.
  await page.evaluate(() => {
    reset();
    configure("explore", false);
    map.update([record, overlay], 1900, [context]);
  });
  for (const selector of ["[data-point]", "[data-overlay]"])
    assert.equal(
      await page
        .locator(selector)
        .first()
        .evaluate((el) => Number(el.style.opacity)),
      1,
    );
  assert.match(
    await page.locator("[data-point] title").first().textContent(),
    /Explore size is a reference/,
  );
  assert.equal(await page.locator(".population-unknown").count(), 0);
  assert.equal(await page.locator("[data-context]").count(), 1);
  // Explore uncertainty follows source dating metadata, never the hidden Movie year.
  for (const dating of [
    {approximate:true},
    {kind:'occurrence'},
    {certainStart:120,certainEnd:180},
  ]) {
    const states=await page.evaluate(dating=>{
      configure('explore',false);
      const point={...record,time:{...record.time,...dating}};
      const area={...overlay,time:{...overlay.time,...dating}};
      return [150,1900].map(year=>{
        map.update([point,area],year,[]);
        const pointElement=document.querySelector('[data-point]');
        const overlayElement=document.querySelector('[data-overlay]');
        return {
          pointUncertain:pointElement.classList.contains('possible'),
          overlayUncertain:overlayElement.classList.contains('overlay-uncertain'),
          pointOpacity:pointElement.style.opacity,
          overlayOpacity:overlayElement.style.opacity,
        };
      });
    },dating);
    const expected={pointUncertain:true,overlayUncertain:true,pointOpacity:'1',overlayOpacity:'1'};
    assert.deepEqual(states,[expected,expected]);
  }
  await page.evaluate(() => {
    configure("movie", false);
    map.update([record, overlay], 1900, []);
  });
  for (const selector of ["[data-point]", "[data-overlay]"])
    assert.equal(
      await page
        .locator(selector)
        .first()
        .evaluate((el) => Number(el.style.opacity)),
      0,
    );
  // Catalog-only hover: title/summary/date are shown as literal text with no route/hash/selection change.
  await page.evaluate(() => {
    reset();
    configure("movie", true);
  });
  const requestCount = requests.length;
  for (const [selector, title] of [
    ["[data-point]", "A <literal> place"],
    ["[data-overlay]", "Overlay example"],
    ["[data-context]", "Unresolved date"],
    [".hazard-marker", "Catalog earthquake"],
  ]) {
    await page
      .locator(selector)
      .first()
      .dispatchEvent("pointerover", { clientX: 970, clientY: 850 });
    const tip = page.getByRole("tooltip");
    await tip.waitFor({ state: "visible" });
    assert.ok((await tip.textContent()).includes(title));
    if (selector === "[data-point]") {
      assert.match(await tip.textContent(), /useful review summary/);
      assert.match(await tip.textContent(), /100 CE/);
      assert.equal(await tip.locator("literal").count(), 0);
    }
    assert.equal(await page.evaluate(() => selected.length), 0);
  }
  assert.equal(requests.length, requestCount);
  assert.equal(await page.evaluate(() => location.hash), "");
  // A correction preview shares its published record ID but has its own identity.
  await page.evaluate(() => {
    const preview = {
      ...record,
      proposalKey: 'correction-0',
      title: 'Correction preview location',
      location: {...record.location, lon:-120, lat:25},
      review: {...record.review, summary:'Preview-specific catalog summary.'},
      time: {...record.time, start:300, end:400},
    };
    configure('explore', false);
    map.update([record, preview], 150, []);
  });
  for (const [point, summary, date, excluded] of [
    ['-100,40', 'useful review summary', '100 CE', 'Preview-specific'],
    ['-120,25', 'Preview-specific catalog summary', '300 CE', 'useful review summary'],
  ]) {
    await page.locator(`[data-point="${point}"]`).dispatchEvent('pointerover', {clientX:600,clientY:400});
    const text = await page.getByRole('tooltip').textContent();
    assert.ok(text.includes(summary));
    assert.ok(text.includes(date));
    assert.ok(!text.includes(excluded));
  }
  await page.evaluate(() => map.clearHover());
  assert.equal(await page.getByRole('tooltip').count(), 0);
  await page.evaluate(() =>
    map.update([], 150, [], {
      ice: false,
      iceScenario: "optimal",
      currents: false,
      winds: false,
      hidden: new Set(["earthquake"]),
      uncertain: true,
    }),
  );
  assert.equal(await page.getByRole("tooltip").count(), 0);
  await page.setViewportSize({ width: 320, height: 560 });
  await page.evaluate(() => {
    reset();
    configure("explore", false);
    document.querySelector("[data-point]").dispatchEvent(
      new PointerEvent("pointerover", {
        bubbles: true,
        clientX: 315,
        clientY: 550,
      }),
    );
  });
  const bounds = await page.getByRole("tooltip").boundingBox();
  assert.ok(
    bounds.x >= 0 &&
      bounds.y >= 0 &&
      bounds.x + bounds.width <= 320 &&
      bounds.y + bounds.height <= 560,
  );
  assert.deepEqual(errors, []);
  console.log(
    "Map interaction browser fixture passed: pause consumption, keyboard hazard guard, all-time Explore, catalog hover, stale clearing and mobile bounds.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
