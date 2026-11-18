import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {createStaticServer} from '../scripts/static-server.mjs';
import {stories} from '../src/stories.ts';
import {siteGuides} from '../src/site-guides.ts';
import {historyState} from '../src/history.ts';
const ids=['chaco','machu-picchu','cahokia','mesa-verde','hovenweep','canyons-of-the-ancients'];
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
const base=`http://127.0.0.1:${server.address().port}`;
const records=JSON.parse(await readFile('dist/dataset.json','utf8')).records;
let chapters=0;
try{
 await mkdir('test-results',{recursive:true});
 await page.goto(base+'/#story/machu-picchu');await page.locator('#story-select').waitFor();
 const sun=page.locator('[data-record-id="g20-mp-sun"]'),residence=page.locator('[data-record-id="g20-mp-royal-residence"]');
 await sun.waitFor();await residence.waitFor();
 await page.waitForFunction(()=>{const sun=document.querySelector('[data-record-id="g20-mp-sun"]'),residence=document.querySelector('[data-record-id="g20-mp-royal-residence"]');if(!sun||!residence)return false;const a=sun.getBoundingClientRect(),b=residence.getBoundingClientRect();return a.width>0&&b.width>0&&Math.hypot(a.x+a.width/2-b.x-b.width/2,a.y+a.height/2-b.y-b.height/2)>=12;});
 for(const id of ids){
  const guide=siteGuides.find(g=>g.id===id),story=stories.find(s=>s.id===guide.storyId);assert.ok(story,id);
  assert.equal((await page.goto(base+'/'+guide.href)).status(),200);
  await page.locator(`a[href="../#story/${story.id}"]`).click();
  for(const [i,scene] of story.scenes.entries()){
   if(i)await page.getByRole('button',{name:'Next scene',exact:true}).click();
   await page.getByRole('heading',{name:scene.title,exact:true}).waitFor();
   const titles=scene.recordIds.map(id=>records.find(r=>r.id===id)).filter(r=>r?.location&&historyState(r,scene.year)==='active').map(r=>r.id);
   assert.ok(titles.length,scene.id+' current evidence');
   await page.waitForFunction(titles=>{
    const map=document.querySelector('#map-host'),m=map?.getBoundingClientRect();if(!m)return false;
    return [...map.querySelectorAll('[data-point],[data-overlay],[data-record-id]')].some(el=>{
     const key=el.getAttribute('data-map-tip'),b=el.getBoundingClientRect();
     return key?.startsWith('records:')&&JSON.parse(key.slice(8)).some(value=>titles.includes(JSON.parse(value)[0]))&&b.width>0&&b.right>m.left&&b.left<m.right&&b.bottom>m.top&&b.top<m.bottom;
    });
   },titles);
   chapters++;
  }
  // An individual observation can be selected even where several phases share a point.
  const phase=page.locator('#concurrent-context [data-local-record^="g20-"]').first();
  await phase.waitFor();const recordId=await phase.getAttribute('data-local-record'),r=records.find(r=>r.id===recordId);
  assert.ok((await phase.locator('..').innerText()).includes(r.title),id+' phase title');
  await phase.click();await page.locator('#selected-records').waitFor();
  assert.equal(await page.locator('#year-number').inputValue(),String(r.time.start));
  assert.ok((await page.locator('#selected-records').innerText()).includes(r.title),id+' exact phase selection');
  await page.getByRole('button',{name:'Close details',exact:true}).click();
  const chosenYear=await page.locator('#year-number').inputValue();
  await page.getByRole('button',{name:'Reset map view',exact:true}).click();
  assert.equal(await page.locator('#year-number').inputValue(),chosenYear,id+' shared date on zoom-out');
  const outsideTitles=records.filter(r=>r.location&&historyState(r,Number(chosenYear))==='active'&&!guide.recordIds.includes(r.id)&&Math.hypot(r.location.lon-story.scenes.at(-1).center[0],r.location.lat-story.scenes.at(-1).center[1])>5).map(r=>r.title);
  await page.waitForFunction(titles=>[...document.querySelectorAll('#map-host title')].some(el=>titles.some(t=>el.textContent.includes(t))),outsideTitles);
  console.log(`PASS ${id}: ${story.scenes.length} current chapters, local phase selection and shared world`);
 }
 // New regional and nested local movies must show current evidence in every chapter too.
 const added=siteGuides.filter(g=>g.storyId&&!ids.includes(g.id)&&(g.id==='four-corners'||g.parentGuideId));
 for(const guide of added){
  const story=stories.find(s=>s.id===guide.storyId);assert.ok(story,guide.id);
  await page.goto(base+'/#story/'+story.id);
  for(const [i,scene] of story.scenes.entries()){
   if(i)await page.getByRole('button',{name:'Next scene',exact:true}).click();
   await page.getByRole('heading',{name:scene.title,exact:true}).waitFor();
   const titles=scene.recordIds.map(id=>records.find(r=>r.id===id)).filter(r=>r?.location&&historyState(r,scene.year)==='active').map(r=>r.id);
   assert.ok(titles.length,scene.id+' current evidence');
   await page.waitForFunction(titles=>{
    const map=document.querySelector('#map-host'),m=map.getBoundingClientRect();
    return [...map.querySelectorAll('[data-point],[data-overlay],[data-record-id]')].some(el=>{const b=el.getBoundingClientRect(),key=el.getAttribute('data-map-tip');return key?.startsWith('records:')&&JSON.parse(key.slice(8)).some(value=>titles.includes(JSON.parse(value)[0]))&&b.width>0&&b.left<m.right&&b.right>m.left&&b.top<m.bottom&&b.bottom>m.top});
   },titles);
   chapters++;
  }
  assert.ok(await page.locator('.region-story-links').isVisible(),guide.id+' family navigation');
  console.log(`PASS ${guide.id}: ${story.scenes.length} current contextual chapters`);
 }
 await page.goto(base+'/#dives/places');await page.locator('.dive-card').first().waitFor();
 await page.locator('[data-region="four-corners"]').waitFor();
 assert.equal(await page.locator('[data-region="four-corners"] [data-dive="place-chaco"]').count(),1);
 assert.equal(await page.locator('[data-region="chaco"] [data-dive="place-pueblo-bonito"]').count(),1);
 for(const id of ids){
  const card=page.locator(`[data-dive="place-${id}"]`);assert.equal(await card.count(),1);
  assert.ok(await card.getByRole('link',{name:/Contextual movie/}).isVisible());
  assert.doesNotMatch(await card.innerText(),/chronology planned/);
 }
 await page.setViewportSize({width:1024,height:768});
 for(const id of ['chaco','cahokia','machu-picchu']){
  const guide=siteGuides.find(g=>g.id===id);await page.goto(base+'/#story/'+guide.storyId);await page.locator('#story-select').waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+' tablet width');
  assert.ok((await page.locator('#map-host').boundingBox()).height>=300,id+' tablet map');
  await page.waitForFunction(()=>[...document.querySelectorAll('#map-host [data-record-id],#map-host [data-point]')].some(el=>{const b=el.getBoundingClientRect(),m=document.querySelector('#map-host').getBoundingClientRect();return b.width>0&&b.left<m.right&&b.right>m.left&&b.top<m.bottom&&b.bottom>m.top}));
 }
 await page.waitForTimeout(350); // Let the final local camera and terrain paint for visual inspection.
 await page.screenshot({path:'test-results/six-guides-tablet.png'});
 await page.goto(base+'/#dives/places');await page.locator('[data-region="four-corners"]').waitFor();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.screenshot({path:'test-results/four-corners-directory.png',fullPage:true});
 for(const r of JSON.parse(await readFile('data/six-guide-expansion-records.json','utf8')).records)assert.deepEqual(records.find(x=>x.id===r.id),r,r.id+' package');
 assert.equal((await page.goto(base+'/docs/six-guide-expansions.html')).status(),200);
 assert.match(await page.locator('body').innerText(),/75 additional calls/);
 assert.deepEqual(errors,[]);console.log(`PASS six expanded guides, ${chapters} contextual chapters, local timelines, shared map, exports and tablet.`);
}catch(error){await page.screenshot({path:'test-results/six-guides-failure.png',timeout:5000}).catch(()=>{});throw error;}
finally{await browser.close();await new Promise(r=>server.close(r));}
