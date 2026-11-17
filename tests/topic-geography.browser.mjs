import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createStaticServer} from '../scripts/static-server.mjs';

const server=createStaticServer('dist');
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1024,height:768}});
const base=`http://127.0.0.1:${server.address().port}`;
let releaseLand;
const landGate=new Promise(resolve=>releaseLand=resolve);
try{
 await page.route('**/land-detailed.geojson',async route=>{await landGate;await route.continue();});
 await page.goto(base+'/#topic/sweet-potatoes',{waitUntil:'domcontentloaded'});
 const land=page.locator('#topic-map .land');await land.waitFor();
 const coarseLength=(await land.getAttribute('d')).length;
 const response=page.waitForResponse('**/land-detailed.geojson');releaseLand();await response;
 await page.waitForFunction(length=>(document.querySelector('#topic-map .land')?.getAttribute('d')?.length??0)>length*5,coarseLength,{timeout:5000});
 assert.equal(await land.getAttribute('d'),await page.locator('#topic-map .terrain-land-mask').getAttribute('d'),'relief uses the same detailed coastline');
 const detailedLength=(await land.getAttribute('d')).length;
 await page.goto(base+'/#topics');await page.locator('a[href="#topic/sweet-potatoes"]').click();
 assert.equal((await land.getAttribute('d')).length,detailedLength,'a later topic mount receives already-loaded coastlines');
 await page.locator('#topic-next').click();
 await page.screenshot({path:'test-results/topic-island-tablet.png'});
 console.log('Topic maps receive detailed islands both during loading and on later navigation.');
}finally{releaseLand();await browser.close();await new Promise(resolve=>server.close(resolve));}
