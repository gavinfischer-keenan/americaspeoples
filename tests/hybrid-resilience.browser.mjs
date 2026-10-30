import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createStaticServer} from '../scripts/static-server.mjs';

// Real Python/SQLite fixture. Interception changes only the selected failure/timing.
const server=createStaticServer(process.env.DIST_PATH||'dist');
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
let browser;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(predicate,message){
 const deadline=Date.now()+10000;
 while(Date.now()<deadline){if(await predicate())return;await delay(25);}
 throw new Error(message);
}
async function jump(page,number,era='BCE'){
 await page.getByLabel('Year number',{exact:true}).fill(String(number));
 await page.getByLabel('Era',{exact:true}).selectOption(era);
 await page.getByRole('button',{name:'Go to year',exact:true}).click();
}
async function scenario(name,run){
 const context=await browser.newContext({viewport:{width:1600,height:1000}});
 const page=await context.newPage(),errors=[];
 page.setDefaultTimeout(10000);
 page.on('pageerror',error=>errors.push(error.message));
 try{await run(page,context);assert.deepEqual(errors,[]);console.log(`PASS: ${name}`);}
 catch(error){await mkdir('test-results',{recursive:true});await page.screenshot({path:`test-results/hybrid-resilience-${name}.png`,fullPage:true});throw error;}
 finally{await context.close();}
}

try{
 browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});

 await scenario('partial-hazard-failure',async page=>{
  let failing=true,failures=0;
  await page.route('**/api/hazards/index?*',async route=>{
   if(failing&&new URL(route.request().url()).searchParams.get('offset')==='1000'){
    failures++;await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Injected middle-page failure'})});
   }else await route.continue();
  });
  await page.goto(origin+'/#map');await page.locator('#map-host svg').waitFor();
  await until(()=>failures>0,'The middle hazard page was not requested');
  await page.locator('#toggle-layers').click();
  await page.getByRole('button',{name:'Retry climate catalog',exact:true}).waitFor();
  assert.match(await page.locator('#hazard-status').innerText(),/could not load/i);
  assert.doesNotMatch(await page.locator('#hazard-status').innerText(),/No included|0 catalog/i);
  await page.evaluate(()=>{location.hash='#review/lanse-1021';});
  await page.getByRole('heading',{name:'Bibliography',exact:true}).waitFor();
  await page.evaluate(()=>{location.hash='#physical';});
  await page.getByRole('button',{name:'Retry climate catalog',exact:true}).waitFor();
  assert.match(await page.locator('main').innerText(),/could not load/i);
  assert.doesNotMatch(await page.locator('main').innerText(),/0 source-linked|0 matching entries|No included catalog/i);
  failing=false;
  await page.getByRole('button',{name:'Retry climate catalog',exact:true}).click();
  await page.getByLabel('Search natural hazards',{exact:true}).waitFor();
  await until(async()=>await page.locator('#hazard-results a').count()>0,'Retry never published the complete physical catalog');
 });

 await scenario('latest-ice-after-failures',async page=>{
  const held=new Map(),started=[];
  await page.route('**/api/ice/optimal/*',async route=>{
   const age=new URL(route.request().url()).pathname.split('/').at(-1);started.push(age);
   if(age==='22000'||age==='24000'){
    await new Promise(resolve=>held.set(age,resolve));
    await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Injected old snapshot failure'})});
   }else await route.continue();
  });
  await page.goto(origin+'/#map');await page.locator('#map-host svg').waitFor();
  await page.locator('#toggle-layers').click();
  await jump(page,20050);await until(()=>held.has('22000'),'22000 snapshot was not held');
  await jump(page,22050);await until(()=>held.has('24000'),'24000 snapshot was not held');
  await jump(page,10000);
  assert.equal(started.includes('12000'),false,'A queued latest snapshot exceeded the two-request bound');
  held.get('22000')();
  await until(()=>started.includes('12000'),'A failed obsolete load did not drain the latest snapshot request');
  await page.waitForFunction(()=>document.querySelector('#ice-status')?.textContent.includes('12,000'));
  await page.locator('.ice-context path').first().waitFor();
  const latest=await page.locator('#ice-status').innerText();
  held.get('24000')();
  await page.waitForResponse(response=>response.url().endsWith('/api/ice/optimal/24000')&&response.status()===503);
  await delay(100); // Let the obsolete rejection's microtasks reach subscribed UI listeners.
  assert.equal(await page.locator('#ice-status').innerText(),latest);
  assert.doesNotMatch(latest,/could not load|retrying/i);
  assert.ok(await page.locator('.ice-context path').count()>0);
 });

 await scenario('search-debounce-cancellation',async(page,context)=>{
  await context.addInitScript(()=>{
   window.__resilienceAborts=[];
   const original=window.fetch;
   window.fetch=function(input,options){
    const url=new URL(typeof input==='string'?input:input.url,location.href);
    if(url.pathname==='/api/search')options?.signal?.addEventListener('abort',()=>window.__resilienceAborts.push(url.searchParams.get('q')),{once:true});
    return original.call(this,input,options);
   };
  });
  const requests=[],responses=new Map();let releaseOld;
  await page.route('**/api/search?*',async route=>{
   const query=new URL(route.request().url()).searchParams.get('q');requests.push(query);
   const response=await route.fetch(),body=await response.json();
   assert.ok(Array.isArray(body.ids)&&body.ids.every(id=>typeof id==='string'),'Search must return IDs');
   assert.equal('records' in body,false,'Search returned full catalog records');
   responses.set(query,body);
   if(query==='Roanoke')await new Promise(resolve=>{releaseOld=resolve;});
   try{await route.fulfill({response});}catch(error){if(query!=='Roanoke')throw error;}
  });
  await page.goto(origin+'/#evidence');const search=page.getByLabel('Search evidence',{exact:true});await search.waitFor();
  for(const text of ['A','At','Ath','Atha','Athabaskan'])await search.fill(text);
  await until(()=>responses.has('Athabaskan'),'The debounced search did not run');
  await page.waitForFunction(()=>document.querySelectorAll('tbody tr[data-href]').length>0&&[...document.querySelectorAll('tbody tr[data-href]')].some(row=>row.textContent.includes('Yeniseian')));
  assert.deepEqual(requests,['Athabaskan'],'Intermediate keystrokes escaped the debounce');
  await search.fill('Roanoke');await until(()=>typeof releaseOld==='function','The delayed search never started');
  await search.fill('Ocm');await search.fill('Ocmulgee');
  await until(()=>responses.has('Ocmulgee'),'The newest search did not run');
  await page.waitForFunction(()=>window.__resilienceAborts.includes('Roanoke'));
  const expected=responses.get('Ocmulgee').ids;
  assert.ok(expected.length>0);
  const tableIds=()=>page.locator('tbody tr[data-href]').evaluateAll(rows=>rows.map(row=>decodeURIComponent(row.dataset.href.slice(8))).sort());
  await until(async()=>JSON.stringify(await tableIds())===JSON.stringify([...expected].sort()),'Table did not show the newest search result');
  releaseOld();await delay(100);
  assert.deepEqual(await tableIds(),[...expected].sort(),'A stale response replaced the newest results');
  assert.deepEqual(requests,['Athabaskan','Roanoke','Ocmulgee']);
 });
}finally{
 await browser?.close();await new Promise(resolve=>server.close(resolve));
}
