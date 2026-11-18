import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createStaticServer} from '../scripts/static-server.mjs';
const extra=JSON.parse(await readFile('data/eastern-brazil-scenes.json','utf8'));
const records=JSON.parse(await readFile('dist/dataset.json','utf8')).records;
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
const base=`http://127.0.0.1:${server.address().port}`;
const mapHas=(id,root='#map-host')=>page.evaluate(({id,root})=>[...document.querySelectorAll(root+' [data-map-tip]')].some(el=>{const key=el.getAttribute('data-map-tip');return key?.startsWith('records:')&&JSON.parse(key.slice(8)).some(v=>JSON.parse(v)[0]===id);}),{id,root});
try{
 await page.goto(base+'/#topic/trade');await page.locator('#topic-map .world').waitFor();
 for(const scene of extra.tradeScenes){
  await page.getByRole('button',{name:new RegExp('Chapter \\d+: '+scene.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))}).click();
  await page.waitForFunction(ids=>[...document.querySelectorAll('#topic-map [data-map-tip]')].some(el=>{const key=el.getAttribute('data-map-tip');return key?.startsWith('records:')&&JSON.parse(key.slice(8)).some(v=>ids.includes(JSON.parse(v)[0]));}),scene.recordIds);
 }
 await page.goto(base+'/#movie');await page.locator('#map-host .world').waitFor();
 const pause=page.getByRole('button',{name:'Pause',exact:true});if(await pause.isVisible())await pause.click();
 for(const [id,dates] of [['eb-ne-formoso',[[550,true],[650,false],[900,true]]],['eb-se-primavera',[[1200,true],[1350,false],[1450,true]]]]){
  await page.goto(base+'/#review/'+id);await page.locator('[data-action="locate"]').click();
  await page.locator('#selected-records h4').filter({hasText:records.find(r=>r.id===id).title}).waitFor();
  for(const [year,expected] of dates){
   if(!await page.locator('#year-number').isVisible())await page.locator('#time-settings-toggle').click();
   await page.locator('#year-number').fill(String(year));await page.locator('#era').selectOption('CE');
   await page.getByRole('button',{name:'Go to year',exact:true}).click();
   await page.waitForFunction(({id,expected})=>[...document.querySelectorAll('#map-host [data-active-member-ids]')].some(el=>JSON.parse(el.dataset.activeMemberIds).includes(id))===expected,{id,expected});
   assert.equal(await mapHas(id),true,'earlier evidence remains inspectable during a gap');
  }
 }
 await page.goto(base+'/#review/eb-ne-canaa-graphite-movement');await page.locator('[data-action="locate"]').click();
 await page.locator('#map-host [data-history-route="eb-ne-canaa-graphite-movement"]').waitFor();
 for(const width of [1440,1024]){
  await page.setViewportSize({width,height:960});await page.goto(base+'/sites/atlantic-brazil.html');
  const photo=page.locator('img[src="guide-media/morro-grande-urn.jpg"]');await photo.scrollIntoViewIfNeeded();
  await photo.evaluate(img=>img.decode());
  await page.locator('img[src^="guide-media/"]').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
  assert.match(await photo.locator('..').locator('..').innerText(),/CC BY-NC-SA 4\.0/);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:`test-results/eastern-brazil-reading-${width}.png`});
 }
 for(const path of ['docs/eastern-brazil.html','eastern-brazil-coverage.json','sites/reports/eastern-brazil.html'])assert.equal((await page.request.get(base+'/'+path)).status(),200);
 assert.deepEqual(errors,[]);console.log('PASS: eastern Brazilian exchange chapters, shared-map dates and gaps, credited pottery image and tablet reading.');
}catch(e){await page.screenshot({path:'test-results/eastern-brazil-failure.png'}).catch(()=>{});throw e;}
finally{await browser.close();await new Promise(r=>server.close(r));}
