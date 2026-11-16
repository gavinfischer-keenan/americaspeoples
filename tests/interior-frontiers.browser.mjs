import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile, mkdir} from 'node:fs/promises';
import {createStaticServer} from '../scripts/static-server.mjs';

const server=createStaticServer('dist');
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}}), errors=[];
page.setDefaultTimeout(10000);
page.on('pageerror',error=>errors.push(error.message));
const origin=`http://127.0.0.1:${server.address().port}`;
const records=JSON.parse(await readFile('dist/dataset.json','utf8')).records;
async function locate(id){
 await page.goto(origin+'/#review/'+id);
 await page.locator('[data-action="locate"]').click();
 await page.locator('#selected-records h4').waitFor();
 assert.equal(await page.locator('#story-select').inputValue(),'free');
}
async function year(value){
 if(!await page.locator('#year-number').isVisible())await page.locator('#time-settings-toggle').click();
 await page.locator('#year-number').fill(String(value));
 await page.locator('#year-number').press('Enter');
}
try{
 await mkdir('test-results',{recursive:true});
 for(const id of ['interior-barcelos-labor','interior-san-fernando-1750','interior-galibi-1925']){
  const r=records.find(row=>row.id===id);assert.ok(r);
  await locate(id);
  assert.equal(await page.locator('#year-number').inputValue(),String(r.time.start));
  assert.ok((await page.locator('#selected-records').innerText()).includes(r.title));
  const marker=r.history?.kind==='settlement'?page.locator(`[data-record-id="${id}"]`):page.locator(`[data-point="${r.location.lon},${r.location.lat}"]`);
  const box=await marker.boundingBox(), map=await page.locator('#map-host').boundingBox();
  assert.ok(box&&box.x+box.width>map.x&&box.x<map.x+map.width&&box.y+box.height>map.y&&box.y<map.y+map.height,id+' visible');
  await page.screenshot({path:`test-results/${id}.png`});
 }
 await locate('interior-barcelos-borba-1758');
 const route=page.locator('[data-history-route="interior-barcelos-borba-1758"]');
 await route.waitFor();
 assert.match(await route.textContent(),/1758|1,758/);
 await page.screenshot({path:'test-results/interior-dated-trade.png'});
 await year(1759);
 await route.waitFor({state:'detached'});
 await year(1758);
 await route.waitFor();
 await locate('interior-cuyuni-1758');
 const battle=page.locator('#map-host [data-overlay]').filter({hasText:'Cuyuni — Spanish forces burn'});
 await battle.waitFor();
 await year(1759);
 await battle.waitFor({state:'detached'});
 await page.setViewportSize({width:1024,height:768});
 await locate('interior-san-fernando-1750');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'tablet stays within viewport');
 await page.screenshot({path:'test-results/interior-tablet.png'});
 const response=await page.goto(origin+'/docs/interior-frontiers.html');
 assert.equal(response.status(),200);
 assert.match(await page.locator('body').innerText(),/66\/100/);
 assert.equal(await page.locator('a[href*="#review/interior-"]').count(),35);
 assert.deepEqual(errors,[]);
 console.log('PASS interior evidence: points in shared movie, dated trade and conflict windows, tablet and packaged guide.');
}catch(error){
 await page.screenshot({path:'test-results/interior-failure.png',timeout:5000}).catch(()=>{});
 throw error;
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
