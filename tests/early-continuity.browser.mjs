import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {createStaticServer} from '../scripts/static-server.mjs';
import {earlyContinuityStories as archiveEntries} from '../src/early-continuity-stories.ts';
const earlyContinuityStories=archiveEntries.map(entry=>({...entry,scenes:entry.scenes.filter(scene=>scene.year<=1900)}));
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
const origin=`http://127.0.0.1:${server.address().port}`;
const records=JSON.parse(await readFile('dist/dataset.json','utf8')).records;
const incoming=JSON.parse(await readFile('data/early-continuity-expansion-records.json','utf8')).records;
const point=id=>page.locator(`#map-host [data-member-ids*='${JSON.stringify(id)}']`);
try{
 await mkdir('test-results',{recursive:true});
 for(const story of earlyContinuityStories){
  const response=await page.goto(origin+'/sites/'+story.id+'.html');assert.equal(response.status(),200);
  await page.locator('a[href="../#dives/places"]').waitFor();
  await page.locator(`a[href="../#story/${story.id}"]`).click();
  await page.locator('#story-select').waitFor({state:'attached'});assert.equal(await page.locator('#story-select').inputValue(),story.id);
  for(const [i,scene] of story.scenes.entries()){
   if(i)await page.getByRole('button',{name:'Next scene',exact:true}).click();
   await page.getByRole('heading',{name:scene.title,exact:true}).waitFor();
   const active=scene.recordIds.filter(id=>{const r=records.find(r=>r.id===id);return r.time.start<=scene.year&&r.time.end>=scene.year;});
   assert.ok(active.length,scene.id);
   const current=records.find(r=>r.id===active[0]);
   // A place can keep the same coordinates while its scene records are repainted.
   // Check current content and screen geometry in one browser frame.
   await page.waitForFunction(({key,title})=>{
    const marker=document.querySelector(`[data-point="${key}"]`),map=document.querySelector('#map-host');
    if(!marker?.textContent.includes(title)||!map)return false;
    const b=marker.getBoundingClientRect(),m=map.getBoundingClientRect();
    return b.width>0&&b.right>m.left&&b.left<m.right&&b.bottom>m.top&&b.top<m.bottom;
   },{key:`${current.location.lon},${current.location.lat}`,title:current.title});
  }
  await page.screenshot({path:`test-results/early-${story.id}.png`});
  await page.getByRole('button',{name:'Reset map view',exact:true}).click();
  assert.ok(await point('settlement-taos-habitation').count(),story.id+' retains surrounding history at the later date');
  assert.equal(await page.locator('#story-select').inputValue(),story.id);
 }
 for(const r of incoming){assert.deepEqual(records.find(x=>x.id===r.id),r,r.id+' exported exactly');}
 for(const id of ['early-gigante-esperanza','early-uripiv-postlapita','early-nimowa-later']){
  const r=records.find(x=>x.id===id);assert.ok(r,id);
  await page.goto(origin+'/#review/'+id);await page.locator('[data-action="locate"]').click();
  await page.locator('#selected-records h4').waitFor();assert.equal(await page.locator('#story-select').inputValue(),'free');
  assert.ok((await page.locator('#selected-records').innerText()).includes(r.title));
 }
 await page.setViewportSize({width:1024,height:768});await page.goto(origin+'/#story/upano');
 await page.locator('#story-select').waitFor({state:'attached'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'test-results/early-tablet.png'});
 const doc=await page.goto(origin+'/docs/early-continuity.html');assert.equal(doc.status(),200);
 assert.match(await page.locator('body').innerText(),/70\/100/);
 assert.deepEqual(errors,[]);console.log('PASS all in-range contextual scenes, shared world after zoom-out, guides and categorised return links, 37 exported records, early/Pacific locate and tablet layout.');
}catch(error){await page.screenshot({path:'test-results/early-failure.png',timeout:5000}).catch(()=>{});throw error;}
finally{await browser.close();await new Promise(r=>server.close(r));}
