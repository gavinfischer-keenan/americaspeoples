import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {createStaticServer} from '../scripts/static-server.mjs';
import {canadaAleutianStories} from '../src/canada-aleutian-stories.ts';
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
const base=`http://127.0.0.1:${server.address().port}`;
const records=JSON.parse(await readFile('dist/dataset.json','utf8')).records;
try{
 await mkdir('test-results',{recursive:true});
 for(const story of canadaAleutianStories){
  assert.equal((await page.goto(base+'/sites/'+story.id+'.html')).status(),200);
  await page.locator('.site-overview').waitFor();
  if(['canada','canada-arctic','aleutian-islands'].includes(story.id))await page.locator('.site-overview').screenshot({path:`test-results/${story.id}-terrain-guide.png`});
  assert.ok((await page.locator('#architecture').innerText()).split(/\s+/).length>500,story.id);
  assert.ok(await page.locator('#related-dives a').count()>=3,story.id+' related cards');
  await page.locator(`a[href="../#story/${story.id}"]`).click();
  for(const [i,scene] of story.scenes.entries()){
   if(i)await page.getByRole('button',{name:'Next scene',exact:true}).click();
   await page.getByRole('heading',{name:scene.title,exact:true}).waitFor();
   const active=scene.recordIds.filter(id=>{const r=records.find(r=>r.id===id);return r?.location&&r.time.start<=scene.year&&r.time.end>=scene.year;});
   assert.ok(active.length,story.id+'/'+scene.id+' has dated local evidence');
   await page.waitForFunction(ids=>[...document.querySelectorAll('#map-host [data-map-tip]')].some(el=>{
    const key=el.getAttribute('data-map-tip');if(!key?.startsWith('records:'))return false;
    return JSON.parse(key.slice(8)).some(value=>ids.includes(JSON.parse(value)[0]));
   }),active);
  }
 }
 for(const width of [1440,1024]){
  await page.setViewportSize({width,height:900});
  for(const id of ['canada','canada-pacific','aleutian-islands','cahokia','maya-centers']){
   await page.goto(base+'/sites/'+id+'.html');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' layout');
   const images=page.locator('.guide-photo img');
   for(let i=0;i<await images.count();i++){await images.nth(i).scrollIntoViewIfNeeded();await images.nth(i).evaluate(img=>new Promise((resolve,reject)=>{if(img.complete)return img.naturalWidth?resolve():reject(Error('image failed'));img.onload=resolve;img.onerror=()=>reject(Error('image failed'));}));}
   if(await images.count())assert.match(await page.locator('.photo-credit').first().innerText(),/not subject to the atlas/);
   if(width===1024)await page.screenshot({path:`test-results/${id}-reading-tablet.png`});
  }
 }
 await page.goto(base+'/sites/canada.html');
 await page.locator('#related-dives a[href="canada-pacific.html"]').click();
 assert.match(await page.locator('h1').innerText(),/Pacific Canada/);
 await page.goto(base+'/sites/aleutian-islands.html');
 await page.locator('#related-dives a[href="../#topic/boats"]').click();
 await page.locator('a[href="sites/aleutian-islands.html"]').first().waitFor();
 assert.deepEqual(errors,[]);
 console.log(`PASS: ${canadaAleutianStories.length} regional guides and ${canadaAleutianStories.reduce((n,s)=>n+s.scenes.length,0)} contextual scenes, master-map evidence, tablet images/credits and reciprocal links.`);
}catch(e){await page.screenshot({path:'test-results/canada-aleutians-failure.png'}).catch(()=>{});throw e;}
finally{await browser.close();await new Promise(r=>server.close(r));}
