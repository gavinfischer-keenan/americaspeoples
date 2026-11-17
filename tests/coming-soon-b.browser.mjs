import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {createStaticServer} from '../scripts/static-server.mjs';
import {stories} from '../src/stories.ts';
import {topics} from '../src/topic-dives.ts';
import {historyState} from '../src/history.ts';
const studyIds=['poverty-point','hopewell','san-agustin','tierradentro','casarabe','nan-madol','budj-bim','lapita','gunditjmara'];
const independentIds=['austronesian-languages','australian-wool','australian-mining'];
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
const base=`http://127.0.0.1:${server.address().port}`;
const records=JSON.parse(await readFile('dist/dataset.json','utf8')).records;
let chapters=0;
try{
 await mkdir('test-results',{recursive:true});
 for(const id of studyIds){
  const story=stories.find(s=>s.id===id);assert.ok(story,id);
  assert.equal((await page.goto(base+'/sites/'+id+'.html')).status(),200);
  await page.locator(`a[href="../#story/${id}"]`).click();
  for(const [i,scene] of story.scenes.entries()){
   if(i)await page.getByRole('button',{name:'Next scene',exact:true}).click();
   await page.getByRole('heading',{name:scene.title,exact:true}).waitFor();
   const current=scene.recordIds.map(id=>records.find(r=>r.id===id)).find(r=>r?.location&&historyState(r,scene.year)==='active');
   assert.ok(current,scene.title);
   await page.waitForFunction(({title})=>{
    const marker=[...document.querySelectorAll('#map-host [data-point],#map-host [data-overlay]')].find(el=>el.querySelector('title')?.textContent.includes(title)),map=document.querySelector('#map-host');
    if(!marker?.textContent.includes(title)||!map)return false;
    const b=marker.getBoundingClientRect(),m=map.getBoundingClientRect();
    return b.width>0&&b.right>m.left&&b.left<m.right&&b.bottom>m.top&&b.top<m.bottom;
   },{title:current.title});
   chapters++;
  }
  console.log(`PASS contextual ${id}: ${story.scenes.length} current chapters`);
  assert.ok(await page.locator('#concurrent-context').isVisible());
  await page.getByRole('button',{name:'Reset map view',exact:true}).click();
  assert.equal(await page.locator('#story-select').inputValue(),id);
 }
 for(const id of independentIds){
  const topic=topics.find(t=>t.id===id);assert.ok(topic,id);
  await page.goto(base+'/#topic/'+id);await page.locator('#topic-next').waitFor();
  assert.equal(await page.locator('.language-family').count(),id==='austronesian-languages'?1:0);
  for(const [i,scene] of topic.scenes.entries()){
   if(i)await page.locator('#topic-next').click();
   await page.getByRole('heading',{name:scene.title,exact:true}).waitFor();
   assert.ok((await page.locator('#topic-scene').innerText()).includes(scene.body));
   const current=scene.recordIds.map(id=>records.find(r=>r.id===id)).find(r=>r?.location&&historyState(r,scene.year)==='active');
   assert.ok(current,scene.title+' current mapped evidence');
   await page.waitForFunction(({title})=>{
    // A dated connection is rendered as an overlay, not as a settlement dot.
    const marker=[...document.querySelectorAll('#topic-map [data-point],#topic-map [data-overlay]')].find(el=>el.querySelector('title')?.textContent.includes(title)),map=document.querySelector('#topic-map');
    if(!marker?.textContent.includes(title)||!map)return false;
    const b=marker.getBoundingClientRect(),m=map.getBoundingClientRect();
    return b.width>0&&b.right>m.left&&b.left<m.right&&b.bottom>m.top&&b.top<m.bottom;
   },{title:current.title});
   chapters++;
  }
  console.log(`PASS independent ${id}: ${topic.scenes.length} current chapters`);
  await page.locator('.topic-toolbar a').filter({hasText:'Shared atlas'}).click();
  await page.locator('#story-select').waitFor();
 }
 for(const category of ['subjects','places','languages','cultures']){
  await page.goto(base+'/#dives/'+category);await page.locator('.dive-card').first().waitFor();
  assert.equal(await page.locator('.dive-planned,.dive-queue').count(),0);
 }
 await page.setViewportSize({width:1024,height:768});
 for(const route of ['#dives/places','#story/budj-bim','#topic/australian-wool']){
  await page.goto(base+'/'+route);await page.locator(route.includes('story')?'#story-select':route.includes('topic')?'#topic-next':'.dive-card').first().waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route+' tablet');
 }
 await page.screenshot({path:'test-results/coming-soon-b-tablet.png'});
 for(const r of JSON.parse(await readFile('data/coming-soon-b-expansion-records.json','utf8')).records)assert.deepEqual(records.find(x=>x.id===r.id),r,r.id+' package');
 assert.equal((await page.goto(base+'/docs/coming-soon-campaign.html')).status(),200);
 assert.match(await page.locator('body').innerText(),/74\/100/);
 assert.deepEqual(errors,[]);console.log(`PASS 12 dedicated studies, ${chapters} chapters, original guides, shared-context controls, filtered language families, exports and tablet layouts.`);
}catch(error){await page.screenshot({path:'test-results/coming-soon-b-failure.png',timeout:5000}).catch(()=>{});throw error;}
finally{await browser.close();await new Promise(r=>server.close(r));}
