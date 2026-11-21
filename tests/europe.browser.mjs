import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {browserFixture,mapSetting} from '../scripts/browser-fixture.mjs';

const fixture=await browserFixture();
const {page}=fixture;
const open=async hash=>{
 await page.goto(fixture.url+hash);
 await page.locator(hash==='#atlas/europe'?'#europe-map .world':'#map-host .world').waitFor();
};
const yearLabel=year=>(year<=0?1-year:year).toLocaleString('en-US')+(year<=0?' BCE':' CE');
async function seek(year){
 await page.locator('#europe-date').fill(String(year<=0?1-year:year));
 await page.locator('#europe-era-input').selectOption(year<=0?'BCE':'CE');
 await page.locator('#europe-date-form button').click();
 await page.waitForFunction(wanted=>document.querySelector('#europe-year')?.textContent===wanted,yearLabel(year));
}
const recordButton=id=>page.locator(`#europe-list [data-europe-record="${id}"]`);
const marker=id=>page.locator(`#europe-map [data-member-ids*='"${id}"']`).first();
async function layer(id,enabled){
 await mapSetting(page,async()=>{
  const group=page.locator('.europe-layers');
  if(!await group.evaluate(el=>el.open))await group.locator('summary').click();
  await group.locator(`[data-europe-layer="${id}"]`).setChecked(enabled);
 });
}
async function filter(query){
 await mapSetting(page,()=>page.locator('#europe-search').fill(query));
}
async function choose(entry){
 await filter(entry.title);
 await seek(entry.start);
 await recordButton(entry.id).click();
 assert.equal(await page.locator('#europe-details h2').textContent(),entry.title);
}
try{
 await open('#explore');
 assert.ok(!fixture.requests.some(r=>r.url.endsWith('/europe-catalogue.json')));
 await open('#atlas/europe');
 const res=await page.request.get(fixture.url+'europe-catalogue.json');
 assert.equal(res.status(),200);
 const {evidence,voyages}=await res.json();
 const byId=id=>{
  const entry=evidence.entries.find(e=>e.id===id);
  assert.ok(entry,id);
  return entry;
 };
 const earliest=evidence.entries.reduce((a,b)=>a.start<b.start?a:b);
 assert.equal(await page.locator('#europe-year').textContent(),yearLabel(earliest.start));
 await recordButton(earliest.id).click();
 assert.equal(await page.locator('#europe-details h2').textContent(),earliest.title);
 assert.ok((await page.locator('#europe-details .europe-method').allTextContents()).join(' ').includes(earliest.uncertainty));
 await page.locator('#europe-home').click();
 await seek(0);
 assert.equal(await page.locator('#europe-date').inputValue(),'1');
 assert.equal(await page.locator('#europe-era-input').inputValue(),'BCE');
 await seek(1);
 await page.locator('#europe-next').click();
 assert.notEqual(await page.locator('#europe-year').textContent(),yearLabel(1));
 await seek(1800);
 await page.locator('#europe-rate').selectOption('4');
 await page.locator('#europe-play').click();
 await page.waitForFunction(previous=>document.querySelector('#europe-year')?.textContent!==previous,yearLabel(1800));
 await page.locator('#europe-play').click();
 assert.match(await page.locator('#europe-play').textContent(),/play/i);
 await seek(1900);
 await page.locator('#europe-date').fill('1901');
 await page.locator('#europe-date-form button').click();
 assert.equal(await page.locator('#europe-year').textContent(),yearLabel(1900));
 assert.match(await page.locator('#europe-date-error').textContent(),/1900/);
 const sverdrup=voyages.find(v=>v.id==='sverdrup-fram-1898-1902');
 assert.ok(sverdrup);
 const journey=page.locator('#europe-voyages article').filter({has:page.getByText(sverdrup.name,{exact:true})});
 assert.equal(await journey.count(),1);
 const itinerary=await journey.locator('details p').allTextContents();
 assert.ok(itinerary.some(line=>line.includes('1898-06-26')));
 assert.ok(!itinerary.some(line=>/190[12]-\d\d-\d\d/.test(line)));
 assert.ok(await journey.locator('a[href^="https://"]').count());
 await layer('voyages',false);
 assert.equal(await journey.count(),0);
 await layer('voyages',true);
 await page.locator('#europe-home').click();
 const bounds=page.locator('#europe-boundary-list');
 await seek(100);
 assert.ok((await bounds.textContent()).length > 10 && await page.locator('#europe-map .political-boundaries path').count() >= 1,'Roman Empire political borders render at 100 CE');
 for(const regionId of ['france','italy','spain']){
  await mapSetting(page,()=>page.locator('#europe-region').selectOption(regionId));
  assert.ok(await page.locator('#europe-list [data-europe-record]').count() >= 4,regionId+' displays historical evidence at 100 CE');
 }
 await mapSetting(page,()=>page.locator('#europe-region').selectOption('all'));
 await page.locator('#europe-home').click();
 await seek(1863);
 assert.match(await bounds.textContent(),/Danish monarchy · kingdom and duchies/);
 await seek(1864);
 await mapSetting(page,()=>page.locator('#europe-region').selectOption('denmark'));
 assert.equal(await page.locator('#europe-year').textContent(),yearLabel(1864),'Selecting a region preserves the clock');
 await mapSetting(page,()=>page.locator('#europe-region').selectOption('all'));
 assert.equal(await page.locator('#europe-year').textContent(),yearLabel(1864));
 assert.match(await bounds.textContent(),/Danish kingdom after the Treaty of Vienna/);
 assert.doesNotMatch(await bounds.textContent(),/Danish monarchy · kingdom and duchies/);
 assert.ok(await page.locator('#europe-map .europe-authority-shared-crown').count());
 await layer('borders',false);
 assert.equal(await page.locator('#europe-map .political-boundaries path').count(),0);
 await layer('borders',true);

 for(const kind of ['rail','road','trade']){
  const entry=kind==='rail'?byId('nordic-fi-rail'):kind==='road'?byId('nordic-fi-coastal-road'):
   evidence.entries.find(e=>e.networkKind==='trade'&&['ireland','england','denmark','sweden','finland','norway'].includes(e.regionId));
  assert.ok(entry,'dated '+kind+' connection');
  await page.locator('#europe-home').click();
  await choose(entry);
  assert.ok(await page.locator(`#europe-map .network-${kind}`).count());
  if(kind==='rail'||kind==='road'){
   await layer('voyages',false);
   assert.ok(await page.locator(`#europe-map .network-${kind}`).count(),'Independent '+kind+' switch');
   await layer('voyages',true);
  }
  await layer(kind,false);
  assert.equal(await page.locator(`#europe-map .network-${kind}`).count(),0);
  assert.equal(await recordButton(entry.id).count(),0);
  assert.notEqual(await page.locator('#europe-details h2').allTextContents().then(v=>v[0]),entry.title);
  await layer(kind,true);
  if(kind!=='trade'){
   await seek(entry.end+1);
   assert.equal(await recordButton(entry.id).count(),0);
   assert.ok(await page.locator(`#europe-built-networks [data-europe-record="${entry.id}"]`).count());
   assert.ok(await page.locator(`#europe-map .historical-rails .network-${kind}`).count());
  }
 }
 for(const [id,layerId] of [['nordic-se-canton','trade'],['bi-flight-of-earls','voyages']]){
  const entry=byId(id);
  await page.locator('#europe-home').click();
  await choose(entry);
  const origin=page.locator('#europe-details [data-europe-route-focus="origin"]');
  const destination=page.locator('#europe-details [data-europe-route-focus="destination"]');
  assert.ok((await origin.innerText()).includes(entry.place));
  assert.ok((await destination.innerText()).includes(entry.destinationName));
  await destination.click();
  const pin=page.locator(`#europe-map [data-endpoint-record="${id}"][data-route-endpoint="destination"]`);
  assert.equal(await pin.locator('text').textContent(),entry.destinationName);
  // Keep the camera on the overseas end and clear the selected record. The
  // endpoint itself must open the linked evidence by mouse and keyboard.
  for(const input of ['pointer','keyboard']){
   await filter('no matched connection');
   await filter(entry.title);
   assert.equal(await page.locator('#europe-details h2').count(),0);
   if(input==='pointer')await pin.locator('circle').last().click();
   else await pin.press('Enter');
   assert.equal(await page.locator('#europe-details h2').textContent(),entry.title);
  }
  await layer(layerId,false);
  assert.equal(await pin.count(),0);
  await layer(layerId,true);
  await seek(entry.end+1);
  assert.equal(await pin.count(),0);
 }
 const town=byId('bi-dublin-census-1891');
 await page.locator('#europe-home').click();
 await choose(town);
 await layer('interpolate',true);
 await seek(1846);
 const sized=marker(town.id);
 assert.equal(await sized.locator('.population-unknown').count(),0);
 const modeled=Number(await sized.locator('.site-dot').getAttribute('r'));
 await layer('interpolate',false);
 assert.equal(await sized.locator('.population-unknown').count(),1);
 assert.ok(modeled>Number(await sized.locator('.site-dot').getAttribute('r')));
 await seek(1851);
 assert.equal(await sized.locator('.population-unknown').count(),0);
 await sized.focus();
 await page.locator('.map-hover-tooltip').waitFor();
 assert.equal(await page.locator('.map-hover-tooltip').count(),1);
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('.map-hover-tooltip').count(),0);

 const mapTransform=()=>page.locator('#europe-map .world').getAttribute('transform');
 const before=await mapTransform();
 await open('#explore');
 assert.equal(await page.locator('.map-hover-tooltip').count(),0);
 await open('#atlas/europe');
 assert.equal(await page.locator('#europe-year').textContent(),yearLabel(1851));
 assert.equal(await page.locator('#europe-search').inputValue(),town.title);
 const transformNumbers=s=>s.match(/-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/ig).map(Number);
 const a=transformNumbers(before),b=transformNumbers(await mapTransform());
 assert.equal(a.length,b.length);
 assert.ok(a.every((n,i)=>Math.abs(n-b[i])<0.05),'Europe camera restoration');
 await filter('');
 await page.locator('#europe-home').click();
 await seek(1864);
 const layers=page.locator('.europe-layers');
 if(await layers.evaluate(el=>el.open))await mapSetting(page,()=>layers.locator('summary').click());
 await mkdir('work',{recursive:true});
 await page.screenshot({path:'work/europe-desktop.png'});
 await page.setViewportSize({width:768,height:1024});
 await page.locator('#europe-home').click();
 const tabletTransport=await page.locator('.europe-timeline').boundingBox();
 assert.ok(tabletTransport.y+tabletTransport.height<=1025,'Tablet transport fits below the wrapped header');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Tablet has no horizontal overflow');
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});
  await page.locator('#europe-home').click();
  await filter('');
  await seek(1900);
  const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,map:document.querySelector('#europe-map').getBoundingClientRect().height,overflow:[...document.querySelectorAll('body *')].filter(el=>el instanceof HTMLElement).map(el=>({tag:el.tagName,id:el.id,classes:el.className,right:el.getBoundingClientRect().right})).filter(el=>el.right>innerWidth+1).slice(0,8)}));
  assert.ok(dimensions.scroll<=width,JSON.stringify(dimensions));
  assert.ok(dimensions.map>200,JSON.stringify(dimensions));
  assert.equal(await page.locator('#europe-play').isVisible(),true);
  assert.equal(await page.locator('#europe-slider').getAttribute('aria-valuetext'),yearLabel(1900));
  const footer=await page.locator('.europe-timeline').boundingBox();
  const reader=await page.locator('.europe-reader').boundingBox();
  assert.ok(footer.y+footer.height<=reader.y+1,'Phone controls must not obscure the evidence reader');
  if(width===390){
   await page.evaluate(()=>scrollTo(0,0));
   await page.screenshot({path:'work/europe-phone.png'});
  }
 }
 fixture.assertPrivacy();
 console.log('Europe browser checks passed for dates, playback, boundary changes, layer controls, population observations, camera restoration, keyboard tooltip and phone layouts.');
}finally{await fixture.close();}
