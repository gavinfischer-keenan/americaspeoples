import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {createStaticServer} from '../scripts/static-server.mjs';

const {stories}=JSON.parse(await readFile('data/three-regional-gaps-stories.json','utf8'));
const records=JSON.parse(await readFile('dist/dataset.json','utf8')).records;
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
const base=`http://127.0.0.1:${server.address().port}`;
try{
 await mkdir('test-results',{recursive:true});
 for(const story of stories){
  assert.equal((await page.goto(base+'/sites/'+story.id+'.html')).status(),200);
  await page.locator('.site-overview').first().waitFor();
  assert.ok((await page.locator('#architecture').innerText()).split(/\s+/).length>500);
  assert.ok(await page.locator('#related-dives a').count()>0);
  await page.getByRole('link',{name:'Watch the contextual movie',exact:true}).click();
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
 for(const [id,dates] of [['lca-el-cano-tomb-7',[[850,true],[910,false],[940,true]]],['sv-matantas-late-lapita',[[-620,true],[-470,false],[-420,true]]]]){
  await page.goto(base+'/#review/'+id);await page.locator('[data-action="locate"]').click();
  await page.locator('#selected-records h4').filter({hasText:records.find(r=>r.id===id).title}).waitFor();
  for(const [year,expected] of dates){
   if(!await page.locator('#year-number').isVisible())await page.locator('#time-settings-toggle').click();
   await page.locator('#year-number').fill(String(year<=0?1-year:year));
   await page.locator('#era').selectOption(year<=0?'BCE':'CE');
   await page.getByRole('button',{name:'Go to year',exact:true}).click();
   await page.waitForFunction(({id,expected})=>{
    const marks=[...document.querySelectorAll('#map-host [data-member-ids]')].filter(el=>JSON.parse(el.dataset.memberIds).includes(id));
    return marks.length>0&&marks.some(el=>JSON.parse(el.dataset.activeMemberIds??'[]').includes(id))===expected;
   },{id,expected});
  }
 }
 for(const width of [1440,1024]){
  await page.setViewportSize({width,height:960});
  for(const story of stories){
   await page.goto(base+'/sites/'+story.id+'.html');
   const panel=page.locator('.site-overview').first();await panel.scrollIntoViewIfNeeded();
   await panel.locator('image').evaluateAll(async images=>{await Promise.all(images.map(i=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=i.getAttribute('href');})));});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.ok(await panel.locator('svg a').count()>0);
   await panel.screenshot({path:`test-results/${story.id}-terrain-${width}.png`});
  }
 }
 for(const path of ['docs/three-regional-gaps.html','docs/coverage-audit.html','docs/world-coverage-audit.html'])assert.equal((await page.request.get(base+'/'+path)).status(),200);
 assert.deepEqual(errors,[]);
 console.log(`PASS: three regional guides; ${stories.reduce((n,s)=>n+s.scenes.length,0)} active shared-world chapters; terrain, related links and desktop/tablet layouts.`);
}catch(e){await page.screenshot({path:'test-results/three-regional-gaps-failure.png'}).catch(()=>{});throw e;}
finally{await browser.close();await new Promise(r=>server.close(r));}
