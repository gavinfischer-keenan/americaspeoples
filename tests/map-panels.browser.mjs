import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createStaticServer} from '../scripts/static-server.mjs';

await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
const server=createStaticServer(process.env.DIST_PATH||'dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
page.on('pageerror',error=>errors.push(error.message));
const settings=()=>page.getByRole('button',{name:'Map settings',exact:true});
const facts=()=>page.getByRole('button',{name:'Facts',exact:true});
async function openSettings(){if(await settings().getAttribute('aria-expanded')==='false')await settings().click();}
try{
 await page.goto(base+'/#movie');
 await openSettings();await page.locator('#story-select').selectOption('free');
 assert.equal(await settings().getAttribute('aria-expanded'),'false');
 await page.getByRole('button',{name:'Reset map view',exact:true}).click();
 await page.locator('#time-settings-toggle').click();
 await page.getByLabel('Year number',{exact:true}).fill('1000');await page.getByLabel('Era',{exact:true}).selectOption('CE');await page.getByRole('button',{name:'Go to year',exact:true}).click();await page.locator('#time-settings-toggle').click();
 const choices=page.locator('[data-visible-index]');await choices.first().waitFor();const initial=await choices.count();assert.ok(initial>1);
 const title=(await choices.first().locator('strong').innerText()).replace(/\s*\*$/,'');
 await choices.first().click();await page.waitForFunction(t=>document.querySelector('#selected-records').textContent.includes(t),title);
 assert.equal(await choices.count(),initial,'selecting keeps the complete visible list');
 const rail=await page.locator('#atlas-facts').boundingBox(),map=await page.locator('.map-stage').boundingBox(),details=await page.locator('#detail-panel').boundingBox(),list=await page.locator('#site-panel').boundingBox();
 assert.ok(rail.x+rail.width<=map.x+1,'facts uses side space without covering the map');
 assert.ok(details.y+details.height<=list.y+1,'selected facts precede visible evidence');
 assert.equal(await page.locator('#place-search').isVisible(),false,'filters are absent from facts');
 await page.screenshot({path:'test-results/map-panels-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Close details',exact:true}).click();
 assert.equal(await facts().getAttribute('aria-expanded'),'true','clearing selected details leaves evidence available');
 for(let i=0;i<3;i++)await page.getByRole('button',{name:'Zoom in',exact:true}).click();
 await page.waitForFunction(n=>document.querySelectorAll('[data-visible-index]').length<n,initial);
 const zoomedIds=await choices.allTextContents();await page.locator('.map-canvas > svg').focus();for(let i=0;i<16;i++)await page.keyboard.press('ArrowLeft');
 await page.waitForFunction(before=>JSON.stringify([...document.querySelectorAll('[data-visible-index]')].map(n=>n.textContent))!==JSON.stringify(before),zoomedIds);
 await page.getByRole('button',{name:'Reset map view',exact:true}).click();await page.waitForFunction(n=>document.querySelectorAll('[data-visible-index]').length===n,initial);
 await openSettings();await page.locator('.layer-disclosure summary').click();await page.getByLabel('Show modeled evidence',{exact:true}).uncheck();
 assert.equal(await settings().getAttribute('aria-expanded'),'false','layer selection retracts settings');
 assert.ok(!(await page.locator('#visible-records').innerText()).includes('Modeled'));
 for(const width of [1440,1100,768,390]){
  await page.setViewportSize({width,height:1000});await facts().click();assert.equal(await page.locator('#atlas-facts').isVisible(),false);await facts().click();
  await openSettings();const settingsBox=await page.locator('.map-navigation-settings').boundingBox(),mapBox=await page.locator('.map-stage').boundingBox();assert.ok(settingsBox.y+settingsBox.height<=mapBox.y+1,'settings stays above map in normal flow');
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'toggle-layers');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow at '+width);
 }
 await page.screenshot({path:'test-results/map-panels-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:'Region: Americas',exact:true}).click();await page.getByRole('navigation',{name:'Choose a region',exact:true}).getByRole('link',{name:'Pacific',exact:true}).click();
 await page.getByRole('button',{name:'Region: Pacific',exact:true}).waitFor();
 await page.getByRole('button',{name:'Region: Pacific',exact:true}).click();await page.getByRole('navigation',{name:'Choose a region',exact:true}).getByRole('link',{name:'Europe',exact:true}).click();
 await page.locator('#europe-map').waitFor();assert.equal(await settings().getAttribute('aria-expanded'),'false');assert.equal(await page.locator('.europe-filters').isVisible(),false);
 await openSettings();await page.locator('#europe-category').selectOption('habitation');assert.equal(await settings().getAttribute('aria-expanded'),'false');
 await facts().click();assert.equal(await page.locator('.europe-reader').isVisible(),false);await facts().click();
 await page.locator('#europe-era').selectOption('1850');
 await page.screenshot({path:'test-results/europe-shared-navigation.png',fullPage:true});
 await page.getByRole('button',{name:'Region: Europe',exact:true}).click();await page.getByRole('navigation',{name:'Choose a region',exact:true}).getByRole('link',{name:'Americas',exact:true}).click();await page.locator('#map-host').waitFor();
 assert.equal((await page.locator('#current-year').innerText()).replaceAll(',',''),'1000 CE','regional navigation preserves the Americas date');
 assert.deepEqual(errors,[]);console.log('PASS: Americas and Europe shared navigation, side facts, selection, zoom/pan, filters, responsive flow and preserved date.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
