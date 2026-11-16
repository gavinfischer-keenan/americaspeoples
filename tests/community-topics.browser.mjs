import {chromium} from 'playwright';
import {communityTopics} from '../src/community-topic-dives.ts';
import {dataset} from '../src/published-data.ts';
import {historyState} from '../src/history.ts';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createStaticServer} from '../scripts/static-server.mjs';

const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const base=`http://127.0.0.1:${server.address().port}`;
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await mkdir('test-results',{recursive:true});
try{
 for(const id of ['haudenosaunee','amazonian-peoples','caribbean-enslavement']){
  await page.goto(base+'/#topics/'+id);
  await page.waitForURL('**/#topic/'+id,{timeout:6000});await page.locator('#topic-play').waitFor();
 }
 console.log('PASS promoted planned bookmarks open all three playable movies');
 await page.goto(base+'/#topics');
 assert.equal(await page.locator('.topic-index .library-card').count(),10);
 assert.equal(await page.locator('[data-future-topic]').count(),10);
 assert.match(await page.locator('.topic-index .library-card').last().innerText(),/^10/);
 assert.equal(await page.locator('[data-future-topic="haudenosaunee"]').count(),0);
 await page.goto(base+'/#topics/spanish-treasure');
 await page.locator('#future-spanish-treasure a[href="#topic/caribbean-enslavement"]').click();
 await page.locator('#topic-play').waitFor();
 console.log('PASS queue promotion and related-history links');

 for(const [id,count] of [['haudenosaunee',9],['amazonian-peoples',8],['caribbean-enslavement',14]]){
  await page.goto(base+'/#topic/'+id);await page.locator('#topic-play').waitFor();
  assert.equal(await page.locator('[data-topic-scene]').count(),count);
  const topic=communityTopics.find(t=>t.id===id);
  for(let i=0;i<count;i++){
   await page.locator(`[data-topic-scene="${i}"]`).click();
   assert.equal(await page.locator(`[data-topic-scene="${i}"]`).getAttribute('aria-current'),'step');
   const scene=topic.scenes[i];
   const current=dataset.records.filter(r=>scene.recordIds.includes(r.id)&&historyState(r,scene.year)==='active'&&(r.location||r.overlay?.geometry));
   assert.ok((await page.locator('#topic-records [data-topic-record]').evaluateAll(els=>els.map(el=>el.dataset.topicRecord))).some(id=>current.some(r=>r.id===id)),id+' chapter '+(i+1)+': current chapter evidence must be in the camera');
   assert.ok(await page.locator('#topic-records [data-topic-record]').count()>0,`${id} chapter ${i+1}: no mapped evidence in camera`);
   assert.ok((await page.locator('#topic-scene .scene-copy>p').first().innerText()).length>=180);
  }
  console.log(`PASS ${id}: ${count} chapters with visible evidence and explanatory text`);
 }
 // A date on a linked shared record must be its own supported date, then return intact.
 await page.goto(base+'/#topic/haudenosaunee');await page.locator('[data-topic-scene="8"]').click();
 await page.locator('.topic-context a[href="#context/community-canandaigua-1794"]').click();
 await page.locator('[data-action="locate"]').click();await page.locator('#map-host .world').waitFor();
 assert.equal(await page.locator('#year-number').inputValue(),'1794');
 assert.equal(await page.locator('#story-select').inputValue(),'free');
 assert.equal(await page.getByLabel('Follow an expedition',{exact:true}).inputValue(),'');
 await page.getByRole('link',{name:'Topic dives',exact:true}).click();
 await page.locator('a[href="#topic/haudenosaunee"]').click();await page.locator('#topic-play').waitFor();
 assert.equal(await page.locator('[data-topic-scene="8"]').getAttribute('aria-current'),'step');
 assert.match(await page.locator('#topic-year').innerText(),/1,932/);
 console.log('PASS linked shared evidence uses 1794 and preserves the independent 1932 chapter');

 for(const [w,h,label] of [[1440,960,'desktop'],[1024,768,'tablet-landscape'],[768,1024,'tablet-portrait']]){
  await page.setViewportSize({width:w,height:h});
  await page.goto(base+'/#topic/amazonian-peoples');await page.locator('[data-topic-scene="2"]').click();
  for(const id of ['r11v-cotoca-centre','r11v-landivar-centre'])assert.ok(await page.locator(`[data-topic-record="${id}"]`).count(),label+' '+id);
  await page.screenshot({path:`test-results/community-${label}.png`});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' horizontal overflow');
  await page.goto(base+'/#topic/caribbean-enslavement');await page.locator('[data-topic-scene="13"]').click();
  assert.match(await page.locator('#topic-year').innerText(),/1,886/);
 }
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/#topics');
 await page.locator('.topic-index .library-card').first().waitFor();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 console.log('PASS desktop/tablet chapters, named Amazon sites and simple phone index');
 assert.deepEqual(errors,[]);
}finally{await browser.close();await new Promise(r=>server.close(r));}
