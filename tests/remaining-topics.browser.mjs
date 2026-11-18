import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createStaticServer} from '../scripts/static-server.mjs';
import {remainingTopics} from '../src/remaining-topic-dives.ts';
import {dataset} from '../src/published-data.ts';
import {historyState} from '../src/history.ts';
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
const base='http://127.0.0.1:'+server.address().port;page.on('pageerror',e=>errors.push(e.message));
await mkdir('test-results',{recursive:true});
try{
 for(const t of remainingTopics){
  await page.goto(base+'/#topics/'+t.id);await page.waitForURL('**/#topic/'+t.id);await page.locator('#topic-play').waitFor();
  for(let i=0;i<t.scenes.length;i++){
   await page.locator('[data-topic-scene="'+i+'"]').click();
   const s=t.scenes[i],visible=await page.locator('#topic-records [data-topic-record]').evaluateAll(xs=>xs.map(x=>x.dataset.topicRecord));
   assert.ok(dataset.records.some(r=>s.recordIds.includes(r.id)&&visible.includes(r.id)&&historyState(r,s.year)==='active'),s.id+' current evidence in camera');
  }
  console.log('PASS '+t.id+': '+t.scenes.length+' chapters and visible current evidence');
 }
 await page.goto(base+'/#topics');assert.equal(await page.locator('.dive-card a[href^="#topic/"]').count(),20);
 assert.equal(await page.locator('[data-future-topic]').count(),0);
 for(const file of ['remaining-topic-dives','world-coverage-audit','australasia-archaeology']){
  const response=await page.goto(base+'/docs/'+file+'.html');assert.equal(response.status(),200);assert.ok((await page.locator('h1').innerText()).length>8);
 }
 for(const [w,h,label] of [[1440,960,'desktop'],[1024,768,'tablet-landscape'],[768,1024,'tablet-portrait']]){
  await page.setViewportSize({width:w,height:h});await page.goto(base+'/#topic/spanish-treasure');await page.locator('[data-topic-scene="4"]').click();
  assert.ok(await page.locator('#topic-play').isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  await page.screenshot({path:'test-results/remaining-'+label+'.png',fullPage:true});
 }
 assert.deepEqual(errors,[]);console.log('PASS available subject cards, packaged guides, desktop/tablet layouts and no browser errors');
}finally{await browser.close();await new Promise(r=>server.close(r));}

