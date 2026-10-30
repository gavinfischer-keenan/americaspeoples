import { build } from "esbuild";
import { chromium } from "playwright";
import http from "node:http";
import assert from "node:assert/strict";

// Exercise the source controller without writing dist or loading the atlas API.
const bundle = await build({
  stdin: {
    contents: `
import {MapPanels} from './src/map-panels';
import {fixture} from './tests/fixtures';
document.body.innerHTML='<style>button{display:block}</style><div id="root"><span id="visible-count"></span><span id="active-count"></span><aside style="height:100px;overflow:auto"><div id="visible-records"></div><div id="context-records"></div></aside><span id="context-count"></span><div id="selected-records"></div></div>';
const records=Array.from({length:20},(_,i)=>({...fixture(),id:'record-'+i,title:'Record '+i}));
const proposal={...records[0],proposalKey:'0'};
window.state={visible:[...records,proposal],context:[records[1]],active:records,selected:[],year:150};
window.panels=new MapPanels(document.querySelector('#root'),rows=>{state.selected=rows;panels.update(state)});
panels.update(state);window.ready=true;
`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  format: "iife",
  platform: "browser",
});
const server = http.createServer((req, res) => {
  res.setHeader(
    "content-type",
    req.url === "/app.js" ? "text/javascript" : "text/html",
  );
  res.end(
    req.url === "/app.js"
      ? bundle.outputFiles[0].text
      : '<script src="/app.js" defer></script>',
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
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:" + server.address().port);
  await page.waitForFunction(() => window.ready);
  await page.locator('[data-visible-index="0"]').focus();
  await page.keyboard.press("Enter");
  assert.equal(
    await page.evaluate(() => document.activeElement.dataset.visibleIndex),
    "0",
  );
  assert.equal(
    await page.locator('[data-visible-index="0"]').getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page
      .locator('[data-visible-index="20"]')
      .getAttribute("aria-pressed"),
    "false",
  );
  const stable = await page.evaluate(() => {
    const button = document.activeElement,
      detail = document.querySelector(".selected-detail"),
      scroll = document.querySelector("aside");
    scroll.scrollTop = 80;
    const observer = new MutationObserver(() => {});
    observer.observe(document.querySelector("#root"), {
      childList: true,
      attributes: true,
      subtree: true,
    });
    panels.update({
      ...state,
      visible: [...state.visible],
      active: [...state.active],
    });
    return {
      button: button === document.activeElement,
      detail: detail === document.querySelector(".selected-detail"),
      scroll: scroll.scrollTop,
      mutations: observer.takeRecords().length,
    };
  });
  assert.deepEqual(stable, {
    button: true,
    detail: true,
    scroll: 80,
    mutations: 0,
  });
  const reordered = await page.evaluate(() => {
    const button = document.activeElement;
    state.visible = [
      state.visible[1],
      state.visible[0],
      ...state.visible.slice(2),
    ];
    panels.update(state);
    return {
      same: button === document.activeElement,
      index: button.dataset.visibleIndex,
    };
  });
  assert.deepEqual(reordered, { same: true, index: "1" });
  await page.locator('[data-context-index="0"]').focus();
  await page.keyboard.press("Enter");
  assert.equal(
    await page.evaluate(() => document.activeElement.dataset.contextIndex),
    "0",
  );
  assert.equal(
    await page.locator(".selected-detail h4").innerText(),
    "Record 1",
  );
  await page.evaluate(() => {
    state.year = 300;
    state.active = [];
    panels.update(state);
  });
  assert.match(
    await page.locator(".selection-status").innerText(),
    /Not active evidence/,
  );
  assert.equal(await page.locator("#visible-count").innerText(), "21");
  assert.equal(await page.locator("#context-count").innerText(), "1");
  console.log(
    "Map panels source browser checks passed: keyboard focus, keyed identity, scroll, delegated selection and status updates.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
