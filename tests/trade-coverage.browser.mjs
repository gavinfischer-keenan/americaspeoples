import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createStaticServer} from '../scripts/static-server.mjs';

const expansion=JSON.parse(await readFile('data/trade-0-1200-scenes.json','utf8'));
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
const base=`http://127.0.0.1:${server.address().port}`;
try{
 await page.goto(base+'/#topic/trade');await page.locator('#topic-map .world').waitFor();
 for(const scene of expansion.scenes){
  await page.getByRole('button',{name:new RegExp('Chapter \\d+: '+scene.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))}).click();
  await page.waitForFunction(ids=>[...document.querySelectorAll('#topic-map [data-history-route]')].some(el=>ids.includes(el.getAttribute('data-history-route'))),scene.recordIds);
 }
 await page.screenshot({path:'test-results/trade-expanded-desktop.png'});
 // Follow representative exchange reviews back to the shared map, independent of topic filtering.
 for(const id of ['trade-pacific-yap-fais','trade-pacific-peats-macdonald','trade-pacific-banks-tikopia-obsidian']){
  await page.goto(base+'/#movie');await page.locator('#map-host .world').waitFor();
  const pause=page.getByRole('button',{name:'Pause',exact:true});if(await pause.isVisible())await pause.click();
  await page.goto(base+'/#review/'+id);
  await page.locator('[data-action="locate"]').click();
  await page.locator(`#map-host [data-history-route="${id}"]`).waitFor();
 }
 assert.equal((await page.request.get(base+'/docs/trade-coverage-audit.html')).status(),200);
 assert.deepEqual(errors,[]);
 console.log(`PASS: ${expansion.scenes.length} new trade chapters render active routes; representative exchange evidence is visible on the shared map.`);
}catch(e){await page.screenshot({path:'test-results/trade-expansion-failure.png'}).catch(()=>{});throw e;}
finally{await browser.close();await new Promise(r=>server.close(r));}
