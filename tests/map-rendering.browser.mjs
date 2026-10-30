// Isolated source bundle: does not rebuild or alter the shared release/dist.
import { build } from "esbuild";
import { chromium } from "playwright";
import http from "node:http";
import assert from "node:assert/strict";

const bundle = await build({
  stdin: {
    contents: `
  import {MapView} from './src/map';
  import {fixture} from './tests/fixtures';
  window.calls=0;
  const map=new MapView({type:'FeatureCollection',features:[]},()=>{},()=>window.calls++);
  document.body.append(map.element);window.map=map;
  const record=fixture();map.update([record],150);window.record=record;
`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  format: "iife",
  platform: "browser",
});
const server = http.createServer((req, res) => {
  if (req.url === "/app.js") {
    res.setHeader("content-type", "text/javascript");
    res.end(bundle.outputFiles[0].text);
  } else {
    res.setHeader("content-type", "text/html");
    res.end(
      '<style>.map-canvas{width:1000px;height:800px}svg{width:100%;height:100%}</style><script src="/app.js" defer></script>',
    );
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_PATH ||
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:" + server.address().port);
  await page.waitForSelector("[data-point]");
  await page.waitForTimeout(100);
  const result = await page.evaluate(async () => {
    calls = 0;
    const svg = document.querySelector("svg");
    for (let i = 0; i < 30; i++)
      svg.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: i % 2 ? "ArrowRight" : "ArrowLeft",
          bubbles: true,
        }),
      );
    const synchronous = calls;
    await new Promise(requestAnimationFrame);
    return {
      synchronous,
      afterFrame: calls,
      visible: map.visibleRecords().length,
    };
  });
  assert.deepEqual(result, { synchronous: 0, afterFrame: 1, visible: 1 });
  // A scope switch inside focus should render only the final geometry.
  const renders = await page.evaluate(async () => {
    let count = 0;
    const observer = new MutationObserver((ms) => (count += ms.length));
    observer.observe(document.querySelector(".features"), { childList: true });
    record.location.lon = 80;
    map.update([record], 150);
    await Promise.resolve();
    count = 0;
    map.focus(record);
    await Promise.resolve();
    observer.disconnect();
    return count;
  });
  assert.equal(renders, 1);
  assert.deepEqual(errors, []);
  console.log(
    "Map source browser checks passed: coalesced viewport notifications and one focus draw.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
