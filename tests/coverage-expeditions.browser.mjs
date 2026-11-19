import {mapSetting} from '../scripts/browser-fixture.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {createStaticServer} from '../scripts/static-server.mjs';
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const base=process.env.BASE_URL?.replace(/\/$/,'')||`http://127.0.0.1:${server.address().port}`;
try{
 const {voyages}=JSON.parse(await readFile('data/voyages.json','utf8'));
 await page.goto(base+'/#movie');await page.getByRole('button',{name:'Pause',exact:true}).click();
 const sledgeParty=voyages.find(v=>v.id==='nansen-johansen-1895-1896'),fram=voyages.find(v=>v.id==='nansen-fram-arctic-1893-1896');
 assert.ok(voyages.some(v=>v.id.includes('caird')&&v.stops[0].arrival.startsWith('1916')));
 assert.equal(await page.locator('#watch-voyage option[value*=caird]').count(),0);
 await mapSetting(page, () => page.getByLabel('Follow an expedition',{exact:true}).selectOption(sledgeParty.id));
 await page.locator('#voyage-progress').evaluate(el=>{el.value='5000';el.dispatchEvent(new Event('input',{bubbles:true}));});
 const date=(await page.locator('#voyage-position').innerText()).slice(0,10);
 await page.locator(`[data-follow-expedition="${fram.id}"]`).waitFor();
 assert.match(await page.locator('#expeditions-now').innerText(),/Nansen|Johansen/);
 await page.locator(`[data-follow-expedition="${fram.id}"]`).click();
 assert.equal((await page.locator('#voyage-position').innerText()).slice(0,10),date,'locating a contemporary party preserves the exact shared date');
 assert.equal(await page.getByLabel('Follow an expedition',{exact:true}).inputValue(),fram.id);
 await page.screenshot({path:'test-results/expeditions-fram-desktop.png'});
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.screenshot({path:'test-results/expeditions-fram-mobile.png'});
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:960});
  const panel=await page.locator('#expeditions-now').boundingBox(),controls=await page.locator('.map-controls').boundingBox();
  assert.ok(panel.x+panel.width<=controls.x||panel.y>=controls.y+controls.height,'contemporary expeditions leave map controls clear at '+width+': '+JSON.stringify({panel,controls}));
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  await page.getByRole('button',{name:'Reset map view',exact:true}).click();
  await page.locator('#toggle-layers').click();
  await page.getByText('Boundaries in this view & sources',{exact:true}).click();
  await page.getByRole('button',{name:'Close layers',exact:true}).click();
 }
 await page.setViewportSize({width:1440,height:960});
 await page.waitForFunction(()=>{
  const svg=document.querySelector('#map-host svg'),box=svg.getBoundingClientRect();
  return svg.viewBox.baseVal.width===Math.round(box.width)&&svg.viewBox.baseVal.height===Math.round(box.height);
 });
 await page.mouse.move(0,0);
 const hoverPoint=await page.locator('#map-host [data-point][data-map-tip]').evaluateAll(nodes=>{
  for(const node of nodes){
   const box=node.getBoundingClientRect(),x=box.x+box.width/2,y=box.y+box.height/2;
   if(box.width&&box.height&&document.elementFromPoint(x,y)?.closest('[data-map-tip]')===node)return {x,y};
  }
  return null;
 });
 assert.ok(hoverPoint,'a visible, unobstructed map point is available for real hover');
 await page.mouse.move(hoverPoint.x,hoverPoint.y);
 await page.getByRole('tooltip').waitFor();
 assert.equal(await page.getByRole('tooltip').count(),1,'one catalog popup on hover');
 assert.equal(await page.locator('#map-host [data-map-tip] title,#map-host [data-map-tip][title]').count(),0,'no second native hover tooltip');
 await page.locator('#toggle-layers').focus();
 assert.equal(await page.getByRole('tooltip').count(),0,'moving focus to Layers clears hover');
 for(const id of ['chaco','machu-picchu','fiji-tonga-samoa']){
  await page.setViewportSize({width:1440,height:960});await page.goto(base+`/sites/${id}.html`);
  const viewer=page.locator('[data-map-viewer]').first(),graphic=viewer.locator('svg,img').first();
  const original=(await graphic.boundingBox()).width;
  await viewer.getByRole('button',{name:'Zoom into map',exact:true}).click();
  assert.ok((await graphic.boundingBox()).width>original*1.4);
  await viewer.getByRole('button',{name:'Whole map',exact:true}).click();
  assert.ok(Math.abs((await graphic.boundingBox()).width-original)<2);
  await viewer.getByRole('button',{name:'Full screen',exact:true}).click();
  await page.waitForFunction(()=>!!document.fullscreenElement);
  await viewer.getByRole('button',{name:'Full screen',exact:true}).click();
  await page.waitForFunction(()=>!document.fullscreenElement);
  const href=await viewer.locator('svg image').getAttribute('href');
  const dimensions=await page.evaluate(async url=>{const img=new Image();img.src=url;await img.decode();return [img.naturalWidth,img.naturalHeight];},new URL(href,page.url()).href);
  assert.ok(dimensions[0]>=3600,id+' native image width');
  await viewer.screenshot({path:`test-results/whole-area-${id}.png`});
  if(id==='chaco'){
   assert.ok(await page.locator('.source-map').count()>=6,'published road survey sheets are available');
   await page.locator('.source-map img').first().scrollIntoViewIfNeeded();
   await page.locator('.source-map img').first().evaluate(img=>img.decode());
   await page.locator('.source-map [data-map-viewer]').first().screenshot({path:'test-results/chaco-ancient-road-sheet.png'});
   const folded=page.locator('#area-reference-maps details').filter({has:page.locator('[data-map-viewer]')}).first();
   await folded.locator('summary').click();
   await folded.locator('img').evaluate(img=>img.decode());
   assert.ok((await folded.locator('img').boundingBox()).width>100,'a disclosed source map is fitted after opening');
  }
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+' mobile page fits');
 }
 const {regions}=JSON.parse(await readFile('data/coverage-15-baseline.json','utf8'));
 for(const region of regions){const response=await page.request.get(base+'/sites/'+region.id+'.html');assert.equal(response.status(),200);assert.match(await response.text(),/data-map-viewer/);}
 assert.deepEqual(errors,[]);
 console.log('PASS simultaneous polar parties, retained date, offscreen locate, mobile layout, native map zoom/fullscreen and all 15 guide pages.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
