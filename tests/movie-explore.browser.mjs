import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createStaticServer} from '../scripts/static-server.mjs';
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=process.env.ATLAS_ORIGIN||`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const records=JSON.parse(await readFile('dist/dataset.json','utf8')).records,byId=new Map(records.map(r=>[r.id,r]));
const ids=()=>page.locator('#visible-records button').evaluateAll(nodes=>nodes.map(n=>JSON.parse(n.dataset.mapRecordKey)[0]));
const jump=async(y)=>{await page.getByLabel('Year number',{exact:true}).fill(String(y));await page.getByLabel('Era',{exact:true}).selectOption('CE');await page.getByRole('button',{name:'Go to year',exact:true}).click();};
try {
 await page.goto(origin);await page.locator('#time-slider').waitFor();assert.equal(await page.getByRole('link',{name:'Movie',exact:true}).count(),1);
 await jump(1200);assert.equal(await page.locator('.undated-context').count(),0);assert.ok(await page.locator('.context-list').isHidden());
 const movie=await ids();assert.ok(movie.length>0);
 for(const id of movie){const t=byId.get(id).time;assert.ok(t.start!==null&&t.start<=1200&&t.end>=1200,id);}
 const stale=movie.find(id=>byId.get(id).time.end<1500);assert.ok(stale);
 await page.locator('#visible-records button').nth(movie.indexOf(stale)).click();assert.equal(await page.locator('#selected-records article').count(),1);
 await jump(1877);assert.equal(await page.locator('#selected-records article').count(),0);
 await jump(1200);await page.getByRole('button',{name:'Play',exact:true}).click();assert.ok(await page.locator('body').evaluate(n=>n.classList.contains('movie-playing')));
 await page.locator('#visible-records button').first().click({force:true});assert.equal(await page.getByRole('button',{name:'Play',exact:true}).count(),1);assert.equal(await page.locator('#selected-records article').count(),0);
 await page.locator('#visible-records button').first().click();assert.equal(await page.locator('#selected-records article').count(),1);
 await page.getByRole('button',{name:'Play',exact:true}).click();assert.equal(await page.locator('#selected-records article').count(),0);
 await page.locator('[data-point]').first().dispatchEvent('pointerover',{clientX:700,clientY:330});await page.getByRole('tooltip').waitFor();assert.ok((await page.getByRole('tooltip').innerText()).length>80);
 await page.locator('#map-host svg').first().click({position:{x:60,y:80},force:true});assert.equal(await page.getByRole('button',{name:'Play',exact:true}).count(),1);assert.equal(await page.locator('#selected-records article').count(),0);
 await page.getByRole('link',{name:'Explore',exact:true}).click();await page.locator('.timeline').waitFor({state:'hidden'});assert.ok(await page.locator('.timeline').isHidden());
 await page.locator('[data-context]').first().waitFor();const exploration=await ids();assert.ok(exploration.some(id=>{const t=byId.get(id).time;return t.end<1200||t.start>1200;}));
 await page.locator('#context-records button').first().click();assert.match(await page.locator('#selected-records').innerText(),/Chronology unresolved/);
 const before=await page.locator('#visible-count').innerText();await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.waitForFunction(previous=>document.querySelector('#visible-count').textContent!==previous,before);
 await page.getByRole('link',{name:'Movie',exact:true}).click();await page.locator('.timeline').waitFor({state:'visible'});assert.ok(await page.locator('.timeline').isVisible());assert.equal(await page.locator('.undated-context').count(),0);assert.ok(await page.locator('.context-list').isHidden());
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log('PASS: Movie temporal isolation, stale selection, first-click pause, subsequent selection, hover, all-period Explore/context details, viewport list and mobile layout.');
} finally {await browser.close();server.close();}
