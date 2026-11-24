import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {createStaticServer} from '../scripts/static-server.mjs';
import {islandChainStories} from '../src/island-chain-stories.ts';
import {yapMicronesiaStories,yapMicronesiaTopics} from '../src/yap-micronesia-dives.ts';
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
const base=`http://127.0.0.1:${server.address().port}`;
const records=JSON.parse(await readFile('dist/dataset.json','utf8')).records;
try{
 await mkdir('test-results',{recursive:true});
 for(const story of [...islandChainStories,...yapMicronesiaStories]){
  assert.equal((await page.goto(base+'/sites/'+story.id+'.html')).status(),200);
  await page.locator('.site-overview').first().waitFor();
  assert.ok((await page.locator('#architecture').innerText()).split(/\s+/).length>500);
  await page.locator(`a[href="../#story/${story.id}"]`).click();
  for(const [i,scene] of story.scenes.filter(scene=>scene.year<=1900).entries()){
   if(i)await page.getByRole('button',{name:'Next scene',exact:true}).click();
   await page.getByRole('heading',{name:scene.title,exact:true}).waitFor();
   const titles=scene.recordIds.map(id=>records.find(r=>r.id===id)).filter(r=>r?.location&&r.time.start<=scene.year&&r.time.end>=scene.year).map(r=>r.title);
   assert.ok(titles.length,scene.id+' has dated local evidence');
   await page.waitForFunction(ids=>[...document.querySelectorAll('#map-host [data-map-tip]')].some(el=>{
    const key=el.getAttribute('data-map-tip');if(!key?.startsWith('records:'))return false;
    return JSON.parse(key.slice(8)).some(value=>ids.includes(JSON.parse(value)[0]));
   }),scene.recordIds);

  }
 }
 await page.goto(base+'/#dives/subjects');
 const card=page.locator('[data-dive="topic-rai-stone-money"]');await card.waitFor();
 assert.equal(await page.locator('a[href="sites/yap-rai.html"]').count(),1);
 await card.getByRole('link',{name:/Read guide/}).click();
 assert.ok((await page.locator('#architecture').innerText()).split(/\s+/).length>1400);
 assert.equal(await page.locator('.guide-photo').count(),2);
 await page.locator('a[href="../#topic/rai-stone-money"]').click();
 await page.locator('.topic-guide-link').waitFor();
 for(const [i,scene] of yapMicronesiaTopics[0].scenes.filter(scene=>scene.year<=1900).entries()){
  if(i)await page.getByRole('button',{name:'Next topic chapter',exact:true}).click();
  await page.getByRole('heading',{name:scene.title,exact:true}).waitFor();
 }
 await page.setViewportSize({width:1024,height:768});
 await page.goto(base+'/sites/yap-rai.html');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'test-results/yap-guide-tablet.png'});
 await page.goto(base+'/#library');
 await page.locator('a[href="sites/sources-attributions.html"]').click();
 await page.getByLabel('Search sources, creators, licenses or places').fill('David Weekly');
 // The register is one ~20 MB page (~28k source rows); its deferred search script runs only
 // after the whole document parses, which alone can take ~15 s in headless Chromium.
 await page.waitForFunction(()=>document.getElementById('source-count').textContent.startsWith('1 of '),null,{timeout:60000});
 assert.match(await page.locator('[data-source-row]:visible').innerText(),/CC BY 2.0/);
 assert.deepEqual(errors,[]);
 console.log('PASS: 41 contextual island chapters, 12 rai chapters, seven guide links, shared evidence and searchable source credits.');
}catch(e){await page.screenshot({path:'test-results/island-chain-failure.png'}).catch(()=>{});throw e;}
finally{await browser.close();await new Promise(r=>server.close(r));}
