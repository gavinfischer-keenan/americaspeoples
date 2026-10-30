import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createStaticServer } from '../scripts/static-server.mjs';
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=process.env.ATLAS_ORIGIN || `http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto(origin+'/#review/hovenweep-square-tower');
 await page.getByRole('link',{name:/Explore Hovenweep/}).click();
 await page.waitForLoadState('domcontentloaded');
 await page.locator('tbody tr').nth(6).waitFor();
 assert.match(await page.locator('h1').innerText(),/Hovenweep/);
 assert.ok(await page.locator('tbody tr').count()>=7);
 const catalog=JSON.parse(await readFile('data/site-guides.json','utf8'));
 for(const g of catalog.guides) {
   await page.goto(origin+'/'+g.href);assert.ok(await page.locator('h1').innerText());
   const link=page.getByRole('link',{name:/Read the complete/});
   const response=await page.request.get(await link.getAttribute('href').then(p=>new URL(p,page.url()).href));assert.equal(response.status(),200);
 }
 for(const id of ['chaco-culture','inca-civilization']) {
   await page.goto(origin+`/sites/${id}.html`);
   assert.equal(await page.locator('.road-map > svg').count(),1);
   assert.match(await page.locator('main').innerText(),/schematic/i);
   assert.match(await page.locator('main').innerText(),/language/i);
   assert.match(await page.locator('main').innerText(),/ritual|religion/i);
   await page.locator('.road-map > svg').screenshot({path:`test-results/${id}-guide.png`});
 }
 await page.goto(origin+'/sites/reports/four-corners.html');
 assert.ok(await page.locator('a[href^="https://consensus.app/papers/"]').count()>60);
 await page.setViewportSize({width:390,height:844});await page.goto(origin+'/sites/hovenweep.html');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.setViewportSize({width:1500,height:1000});await page.goto(origin+'/#map');
 await page.locator('#time-slider').waitFor();await page.locator('#toggle-layers').click();
 await page.getByLabel('Year number',{exact:true}).fill('1877');await page.getByLabel('Era',{exact:true}).selectOption('CE');await page.getByRole('button',{name:'Go to year',exact:true}).click();
 await page.locator('.hazard-el-nino').first().waitFor();
 await page.locator('[data-climate="tsunami"]').uncheck();
 await page.locator('#show-natural-events').uncheck();
 assert.equal(await page.locator('.hazard-volcano,.hazard-earthquake,.hazard-tsunami').count(),0);
 assert.ok(await page.locator('.hazard-el-nino').count());
 await page.locator('#show-natural-events').check();assert.ok(!await page.locator('[data-climate="tsunami"]').isChecked());
 assert.ok(await page.locator('.hazard-volcano,.hazard-earthquake').count());
 await page.goto(origin+'/#physical');await page.getByLabel('Natural hazard kind').selectOption('earthquake');
 assert.match(await page.locator('#hazard-results-count').innerText(),/1,580/);
 await page.locator('#hazard-results a').first().click();await page.getByRole('heading',{name:'Original data fields'}).waitFor();
 assert.match(await page.locator('main').innerText(),/NOAA|NCEI/);
 assert.deepEqual(errors,[]);
 console.log('PASS: 12 populated guides and reports; both culture road maps; sources; mobile width; natural-event master preserves ENSO and individual choices; earthquake catalog/source review.');
} finally {await browser.close();server.close();}
