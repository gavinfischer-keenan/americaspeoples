// Focused rendering regression using synthetic fixtures, never published evidence.
// Bundles the current renderer in memory: no full dataset build is required.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const bundle = await build({
  stdin: { resolveDir: process.cwd(), sourcefile: 'wreck-density-fixture.ts', loader: 'ts', contents: `
    import {MapView} from './src/map';
    import {fixture} from './tests/fixtures';
    import './src/styles.css';
    import './src/atlas-ui.css';
    const make=(id:string,lon:number,kind:'wreck'|'settlement',year:number)=>({
      ...fixture(),id,title:id,type:'event' as const,
      location:{...fixture().location!,id,name:id,lon,lat:40},
      time:{...fixture().time,kind:'occurrence' as const,start:year,end:year},
      history:{kind,claimId:'occupation'},
    });
    const records=[make('old-wreck-a',-100.01,'wreck',1700),make('old-wreck-b',-100.02,'wreck',1720),
      make('settlement-a',-100.03,'settlement',1700),make('settlement-b',-100.04,'settlement',1720),
      make('recent-wreck',-100.05,'wreck',1800)];
    const map=new MapView({type:'FeatureCollection',features:[]},()=>{});
    document.querySelector('#fixture')!.append(map.element);
    map.setInteraction({mode:'movie',playing:false,onPause:()=>{}});
    map.update(records,1800);
    Object.assign(window,{wreckMap:map,wreckRecords:records});
  ` },
  bundle: true, format: 'iife', platform: 'browser', target: ['chrome110'], outfile: 'fixture.js', write: false,
});
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_PATH || existsSync(edge) ? { executablePath: process.env.BROWSER_PATH || edge } : {}) });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setContent('<main id="fixture" style="width:1000px;height:800px"></main>');
  await page.addStyleTag({ content: bundle.outputFiles.find(file => file.path.endsWith('.css')).text });
  await page.addScriptTag({ content: bundle.outputFiles.find(file => file.path.endsWith('.js')).text });
  await page.waitForSelector('.wreck-group');

  const clusters = await page.locator('.community-group').evaluateAll(nodes => nodes.map(node => ({ key: node.dataset.point, wreck: node.classList.contains('wreck-group'), members: JSON.parse(node.dataset.memberIds), glyphs: node.querySelectorAll('.community-glyph').length })));
  const wreck = clusters.find(cluster => cluster.wreck);
  const settlement = clusters.find(cluster => !cluster.wreck);
  assert.ok(wreck && settlement, 'Both density families must render in this small shared area');
  assert.equal(wreck.key, 'wreck:' + settlement.key, 'The same density cell needs distinct identities for wrecks and settlements');
  assert.deepEqual(new Set(wreck.members), new Set(['old-wreck-a', 'old-wreck-b']));
  assert.deepEqual(new Set(settlement.members), new Set(['settlement-a', 'settlement-b']));
  assert.ok(clusters.every(cluster => cluster.glyphs === 1));
  assert.equal(await page.locator('.site[data-point^="wreck:"]').count(), 0, 'A wreck cluster must never fall through into a generic site dot');
  for (const cluster of clusters) {
    assert.equal(await page.locator('[data-point]').evaluateAll((nodes, key) => nodes.filter(node => node.dataset.point === key).length, cluster.key), 1, 'Each density identity must have exactly one rendered marker');
  }

  const recent = page.locator('.history-marker[data-record-id="recent-wreck"]');
  assert.equal(await recent.count(), 1, 'A newly dated loss stays outside the older wreck cluster');
  assert.equal(Number(await recent.evaluate(node => node.style.opacity)), 1);
  await page.evaluate(() => { window.wreckMap.setHighlighted(['recent-wreck']); window.wreckMap.update(window.wreckRecords, 1875); });
  const faded = Number(await recent.evaluate(node => node.style.opacity));
  assert.ok(faded >= .2 && faded < .3, 'The same selected loss remains visible and fades as its source date recedes');

  // The cluster's catalog preview must retain its own members beside a settlement cluster.
  await page.locator('.wreck-group').dispatchEvent('pointerover', { clientX: 600, clientY: 400 });
  const tip = page.locator('[role="tooltip"]');
  assert.equal(await tip.count(), 1);
  assert.match(await tip.textContent(), /old-wreck-a/);
  assert.doesNotMatch(await tip.textContent(), /settlement-a|settlement-b/);
  assert.equal(await page.locator('.wreck-group').getAttribute('aria-describedby'), await tip.getAttribute('id'));
  assert.deepEqual(errors, []);
  console.log('PASS: one glyph per wreck cluster; distinct settlement density identity; recent-loss protection and fading; isolated cluster tooltip.');
} finally {
  await browser.close();
}
