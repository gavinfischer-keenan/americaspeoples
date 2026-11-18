import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {createStaticServer} from '../scripts/static-server.mjs';
import {shieldAleutianLocalStories} from '../src/shield-aleutian-local-stories.ts';

assert.ok(shieldAleutianLocalStories.length>=4,'The Shield and local Aleutian stories must be populated');
const plans=JSON.parse(await readFile('data/village-plans.json','utf8')).plans;
assert.ok(plans.some(p=>p.mediaId)&&plans.some(p=>p.diagram),'A historical chart and original explanatory diagram must be populated');
const records=JSON.parse(await readFile('dist/dataset.json','utf8')).records;
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
const base=`http://127.0.0.1:${server.address().port}`;
try{
 await mkdir('test-results',{recursive:true});
 for(const story of shieldAleutianLocalStories){
  assert.equal((await page.goto(base+'/sites/'+story.id+'.html')).status(),200);
  await page.locator('.site-overview').waitFor();
  assert.ok((await page.locator('#architecture').innerText()).split(/\s+/).length>500,story.id+' needs substantive history');
  await page.locator(`a[href="../#story/${story.id}"]`).first().click();
  for(const [i,scene] of story.scenes.entries()){
   if(i)await page.getByRole('button',{name:'Next scene',exact:true}).click();
   await page.getByRole('heading',{name:scene.title,exact:true}).waitFor();
   const active=scene.recordIds.filter(id=>{const r=records.find(r=>r.id===id);return r?.location&&r.time.start!==null&&r.time.end!==null&&r.time.start<=scene.year&&r.time.end>=scene.year;});
   assert.ok(active.length,story.id+'/'+scene.id);
   await page.waitForFunction(ids=>[...document.querySelectorAll('#map-host [data-map-tip]')].some(el=>{
    const key=el.getAttribute('data-map-tip');return key?.startsWith('records:')&&JSON.parse(key.slice(8)).some(value=>ids.includes(JSON.parse(value)[0]));
   }),active);
  }
 }
 for(const width of [1440,1024]){
  await page.setViewportSize({width,height:960});
  for(const plan of plans){
   await page.goto(base+'/sites/'+plan.guideId+'.html');
   const panel=page.locator(`[data-village-plan="${plan.id}"]`);await panel.scrollIntoViewIfNeeded();
   assert.equal(await panel.count(),1);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const text=await panel.innerText();
   if(plan.diagram){
    assert.match(text,/not to scale or geographically positioned/i);
    assert.ok(await panel.locator('svg a').count()>0);
   }else{
    await panel.locator('img').evaluateAll(async images=>{await Promise.all(images.map(i=>i.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
    assert.match(text,/Public domain|public-domain/);
    assert.match(text,/not subject to the atlas/);
   }
   const recordId=plan.landmarks.flatMap(l=>l.recordIds)[0];
   assert.ok(records.some(r=>r.id===recordId));
   const link=panel.locator(`a[href="../#review/${recordId}"]`).first();
   await link.waitFor();
   await panel.screenshot({path:`test-results/${plan.id}-${width}.png`});
   await link.click();
   await page.getByRole('heading',{name:records.find(r=>r.id===recordId).title,exact:true}).waitFor();
  }
 }
 assert.deepEqual(errors,[]);
 console.log(`PASS: ${shieldAleutianLocalStories.length} connected local guides, ${shieldAleutianLocalStories.reduce((n,s)=>n+s.scenes.length,0)} shared-world scenes, ${plans.length} village plans, evidence links and tablet layouts.`);
}catch(e){await page.screenshot({path:'test-results/shield-aleutian-local-failure.png'}).catch(()=>{});throw e;}
finally{await browser.close();await new Promise(r=>server.close(r));}
