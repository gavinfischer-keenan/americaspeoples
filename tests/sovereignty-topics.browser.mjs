import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createStaticServer} from '../scripts/static-server.mjs';
import {sovereigntyTopics as archiveEntries} from '../src/sovereignty-topic-dives.ts';
import {dataset} from '../src/published-data.ts';
import {historyState} from '../src/history.ts';
const sovereigntyTopics=archiveEntries.map(entry=>({...entry,scenes:entry.scenes.filter(scene=>scene.year<=(entry.id==='hawaii-statehood'?1959:1900))}));
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
const base=`http://127.0.0.1:${server.address().port}`;page.on('pageerror',e=>errors.push(e.message));
await mkdir('test-results',{recursive:true});
try{
 for(const t of sovereigntyTopics){
  await page.goto(base+'/#topics/'+t.id);await page.waitForURL('**/#topic/'+t.id);await page.locator('#topic-play').waitFor();
  for(let i=0;i<t.scenes.length;i++){
   await page.locator(`[data-topic-scene="${i}"]`).click();
   const s=t.scenes[i],visible=await page.locator('#topic-records [data-topic-record]').evaluateAll(xs=>xs.map(x=>x.dataset.topicRecord));
   assert.ok(dataset.records.some(r=>s.recordIds.includes(r.id)&&visible.includes(r.id)&&historyState(r,s.year)==='active'),s.id+' current evidence in camera');
  }
  console.log(`PASS ${t.id}: ${t.scenes.length} chapters, camera and current evidence`);
 }
 await page.goto(base+'/#topic/hawaii-statehood');await page.locator('#topic-play').waitFor();
 assert.match(await page.locator('.topic-scope-note').innerText(),/1959.*1900/);
 await page.locator('.topic-date-controls summary').click();
 await page.locator('#topic-year-input').fill('1959');await page.locator('#topic-era').selectOption('CE');await page.locator('#topic-date-form button').click();
 assert.match(await page.locator('#topic-year').innerText(),/1,959/);
 assert.equal(await page.locator('#topic-date').inputValue(),'10000');
 await page.locator('#topic-year-input').fill('1960');await page.locator('#topic-date-form button').click();
 assert.match(await page.locator('#topic-date-error').innerText(),/1,959/);
 await page.goto(base+'/#review/topic-hawaii-admission-1959');await page.locator('[data-action="locate"]').click();
 await page.waitForURL('**/#topic/hawaii-statehood');assert.match(await page.locator('#topic-year').innerText(),/1,959/);
 await page.goto(base+'/#context/sovereignty-hawaii-annexation');await page.locator('[data-action="locate"]').click();
 await page.locator('#map-host .world').waitFor();assert.equal(await page.locator('#year-number').inputValue(),'1898');
 assert.equal(await page.locator('#story-select').inputValue(),'free');
 await page.goto(base+'/#topic/territorial-purchases');await page.locator('.topic-date-controls summary').click();
 await page.locator('#topic-year-input').fill('1959');await page.locator('#topic-date-form button').click();
 assert.match(await page.locator('#topic-date-error').innerText(),/1,900/);
 console.log('PASS Hawaii manual date, slider, review action and shared-context clock isolation');
 for(const [width,height,label] of [[1440,960,'desktop'],[1024,768,'tablet-landscape'],[768,1024,'tablet-portrait']]){
  await page.setViewportSize({width,height});await page.goto(base+'/#topic/forced-relocations');await page.locator('[data-topic-scene="10"]').click();
  assert.ok(await page.locator('#topic-play').isVisible());
  assert.ok(await page.locator('#topic-map svg').count());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  await page.screenshot({path:`test-results/sovereignty-${label}.png`,fullPage:true});
 }
 assert.deepEqual(errors,[]);console.log('PASS desktop/tablet layouts and no browser exceptions');
}finally{await browser.close();await new Promise(r=>server.close(r));}
