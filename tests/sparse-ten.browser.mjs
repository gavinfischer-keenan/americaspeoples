import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {createStaticServer} from '../scripts/static-server.mjs';
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
const base=`http://127.0.0.1:${server.address().port}`;
const records=JSON.parse(await readFile('data/sparse-ten-expansion-records.json','utf8')).records;
const samples=['st-us-wasden-owl-cave','st-us-bergstrom-bison-kills','st-us-baker-village-fremont','st-us-corn-creek-springs','st-us-powars-ii-hematite-quarry','st-us-high-rise-village','st-la-morgan-summit','st-ki-buota-taro-pits','st-ki-orona-hull2','st-ki-manulu-lagoon-complex'];
const represented=async id=>page.waitForFunction(id=>[...document.querySelectorAll('#map-host [data-member-ids]')].some(el=>JSON.parse(el.dataset.memberIds).includes(id)),id);
async function year(y){
 if(!await page.locator('#year-number').isVisible())await page.locator('#time-settings-toggle').click();
 await page.locator('#year-number').fill(String(y));await page.locator('#era').selectOption('CE');
 await page.getByRole('button',{name:'Go to year',exact:true}).click();
}
async function locate(id){await page.goto(base+'/#review/'+id);await page.locator('[data-action="locate"]').click();await represented(id);}
try{
 await mkdir('test-results',{recursive:true});
 await page.goto(base+'/#movie');await page.locator('#map-host .world').waitFor();
 const pause=page.getByRole('button',{name:'Pause',exact:true});if(await pause.isVisible())await pause.click();
 for(const id of samples){await locate(id);assert.ok(await page.locator('#selected-records').innerText().then(t=>t.includes(records.find(r=>r.id===id).title)),id);}
 await locate('st-ki-orona-hull2');await year(1330);await represented('st-ki-orona-hull2');
 assert.equal(await page.evaluate(()=>[...document.querySelectorAll('#map-host [data-active-member-ids]')].some(el=>JSON.parse(el.dataset.activeMemberIds).includes('st-ki-orona-hull2'))),false);
 await locate('st-ki-kiritimati-early-estate');await year(1900);await represented('st-ki-kiritimati-early-estate');
 assert.ok(records.find(r=>r.id==='st-ki-kiritimati-early-estate').history.endEvidence.start>1900);
 await locate('st-ki-mckean-guano');await year(1871);await represented('st-ki-mckean-guano');
 assert.equal(await page.locator('#map-host [data-local-ending="abandoned"]').count()>0,true);
 await page.screenshot({path:'test-results/sparse-ten-mckean-ending.png'});
 await page.goto(base+'/#review/st-ki-sydney-butaritari-alexa');await page.locator('[data-action="locate"]').waitFor();
 assert.ok(await page.locator('[data-action="locate"]').isDisabled(),'The 1912–1929 Alexa route remains archival');
 await locate('st-ki-honolulu-napia-copra');await page.locator('[data-history-route="st-ki-honolulu-napia-copra"]').waitFor();
 await year(1898);assert.equal(await page.locator('[data-history-route="st-ki-honolulu-napia-copra"]').count(),0);
 for(const width of [1440,1024]){
  await page.setViewportSize({width,height:960});await page.goto(base+'/sites/micronesian-island-networks.html');
  await page.getByRole('heading',{name:'Gardens, workshops and trading towns across Kiribati'}).scrollIntoViewIfNeeded();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:`test-results/sparse-ten-micronesia-${width}.png`});
 }
 for(const path of ['docs/sparse-ten-histories.html','sparse-ten-coverage.json'])assert.equal((await page.request.get(base+'/'+path)).status(),200);
 assert.deepEqual(errors,[]);console.log('PASS: ten regional master-map locations, prior evidence in gaps, documented McKean departure, supported 1897 route, archival Alexa chronology, and tablet guide.');
}catch(e){await page.screenshot({path:'test-results/sparse-ten-failure.png'}).catch(()=>{});throw e;}
finally{await browser.close();await new Promise(r=>server.close(r));}
