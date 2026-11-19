import assert from 'node:assert/strict';
import {mapSetting,openMapSettings} from '../scripts/browser-fixture.mjs';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {createStaticServer} from '../scripts/static-server.mjs';
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}});page.setDefaultTimeout(15000);
const base=`http://127.0.0.1:${server.address().port}`, errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(base+'/#movie');await page.getByRole('button',{name:'Pause',exact:true}).click();
 await page.locator('[data-movie-year="1000"]').click();
 const original=(await page.locator('#concurrent-context').boundingBox()).y;
 assert.equal(await page.locator('#story-picker-section').isVisible(),false,'story choices start inside closed map settings');
 await mapSetting(page,()=>page.locator('#story-picker-section > summary').click());
 await page.locator('#story-chapter-section > summary').click();
 const collapsed=(await page.locator('#concurrent-context').boundingBox()).y;
 assert.ok(collapsed<original,'collapsing the chapter frees room for contemporary place names');
 await page.getByRole('button',{name:'Play',exact:true}).click();await page.waitForTimeout(450);await page.getByRole('button',{name:'Pause',exact:true}).click();
 for(const id of ['story-picker-section','story-chapter-section'])assert.equal(await page.locator('#'+id).getAttribute('open'),null,'playback preserves the collapsed section');
 await page.screenshot({path:'test-results/sidebar-collapsed-desktop.png'});
 await page.setViewportSize({width:1024,height:768});
 assert.ok((await page.locator('#concurrent-context').boundingBox()).y<768,'tablet has room for simultaneous events');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.screenshot({path:'test-results/sidebar-collapsed-tablet.png'});
 await openMapSettings(page);await page.locator('#story-picker-section > summary').focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('#story-picker-section').getAttribute('open'),'');
 assert.equal(await page.locator('#story-chapter-section').getAttribute('open'),null,'sections open independently');
 await page.keyboard.press('Escape');
 await page.goto(base+'/#story/four-corners');await page.locator('[data-scene="5"]').click();
 assert.equal(await page.locator('#year-number').inputValue(),'1265');
 await page.locator('.region-story-links a[href^="#story/chaco-connections"]').click();await page.waitForFunction(()=>document.querySelector('#story-select')?.value==='chaco-connections');
 assert.equal(await page.locator('#year-number').inputValue(),'1265','local study retains the shared year');
 await page.locator('.region-story-links a[href^="#story/four-corners"]').click();await page.waitForFunction(()=>document.querySelector('#story-select')?.value==='four-corners');
 assert.equal(await page.locator('#year-number').inputValue(),'1265','parent study retains the shared year');
 await page.goto(base+'/#story/chaco-connections');await page.locator('#story-progress').press('End');
 assert.equal(await page.locator('#year-number').inputValue(),'1250');
 await page.locator('.region-story-links a[href^="#story/four-corners"]').click();await page.waitForFunction(()=>document.querySelector('#story-select')?.value==='four-corners');
 assert.equal(await page.locator('#year-number').inputValue(),'1250','a year between regional chapters is retained');
 await page.getByRole('button',{name:'Play',exact:true}).click();await page.waitForTimeout(180);await page.getByRole('button',{name:'Pause',exact:true}).click();
 assert.ok(Number(await page.locator('#year-number').inputValue())>=1250,'playback continues from the retained year');
 // Every place page must ship its registered relief and linked feature labels.
 const {guides}=JSON.parse(await readFile('data/site-guides.json','utf8'));
 const terrain=JSON.parse(await readFile('data/guide-terrain/sources.json','utf8'));
 // Sea-route guides use source sheets, exercised by maritime-guides.browser.mjs.
 const placeGuides=guides.filter(g=>g.kind==='site');
 for(const guide of placeGuides){
  await page.goto(base+'/'+guide.href);
  const figure=page.locator('.site-overview').first();await figure.waitFor();
  const href=await figure.locator('image').getAttribute('href');
  const response=await page.request.get(new URL(href,page.url()).href);assert.equal(response.status(),200,guide.id+' terrain loads');
  assert.ok((await response.body()).length>1000,guide.id+' terrain is not empty');
  assert.ok(await figure.locator('.site-overview-label').count(),guide.id+' has named features');
  assert.ok(terrain.maps.some(m=>m.id===guide.id));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),guide.id+' fits tablet');
 }
 for(const id of ['chaco','machu-picchu','cahokia']){
  await page.goto(base+'/sites/'+id+'.html');
  await page.locator('.site-overview').first().screenshot({path:'test-results/guide-map-'+id+'.png'});
 }
 await page.locator('.site-overview svg a').first().click();await page.locator('.review-page').waitFor();
 assert.match(page.url(),/#review\//,'a map feature opens its dated evidence');
 assert.deepEqual(errors,[]);
 console.log(`PASS independent sidebar collapse, playback persistence, keyboard, tablet and all ${placeGuides.length} labeled place terrain maps.`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
