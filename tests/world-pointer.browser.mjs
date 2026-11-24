import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {geoNaturalEarth1,geoOrthographic} from 'd3-geo';
import {chromium} from 'playwright';

// Exercise current source without writing build artifacts or relying on a server.
const bundle=await build({entryPoints:['src/world-page.ts'],bundle:true,write:false,outdir:'test-results/world-pointer',format:'iife',globalName:'WorldPointer',loader:{'.geojson':'json'}});
const land=JSON.parse(await readFile('data/land.geojson','utf8'));
const regions=[['americas','Americas'],['pacific','Australia & Pacific'],['africa','Africa'],['europe','Europe'],['asia-pacific','Asia']];
const summary={
 version:'pointer-test',records:1,references:1,guides:0,
 regions:regions.map(([id,title])=>({id,title,records:1,references:1,guides:0,earliest:-100,earliestLabel:'Test evidence',coverage:'Pointer regression fixture'})),
 method:'Interaction fixture',foundation:{evidence:1,waves:0,taxa:1},
};
const data={
 schemaVersion:1,
 sources:[{id:'source',title:'Test source',url:'https://example.org/evidence',access:'Fixture'}],
 taxa:[{id:'homo-sapiens',name:'Homo sapiens',meaning:'Test lineage',status:'living-lineage',note:'Fixture',sourceIds:['source']}],
 evidence:[{id:'point',title:'Pointer evidence',taxonIds:['homo-sapiens'],regionIds:['africa'],kind:'archaeology',start:-100,end:100,dateLabel:'Test dating window',dateBasis:'Fixture',coordinates:[20,4],summary:'Evidence selected by a pointer.',limits:'Interaction fixture only.',sourceIds:['source']}],
 waves:[],
};
const edge='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const executablePath=process.env.BROWSER_PATH||(existsSync(edge)?edge:undefined);
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.setContent('<body class="world-surface"><main id="pointer-test"></main></body>');
 await page.addStyleTag({content:bundle.outputFiles.find(file=>file.path.endsWith('.css')).text});
 await page.addScriptTag({content:bundle.outputFiles.find(file=>file.path.endsWith('.js')).text});
 await page.evaluate(({summary,land})=>{
  window.disposePointer=WorldPointer.mountWorldHub(document.querySelector('#pointer-test'),summary,land,{regionHref:id=>'#pointer-'+id});
 },{summary,land});
 // Country coordinates locate actual land, away from the overlaid region links.
 const projection=geoOrthographic().rotate([-18,-12]).translate([500,300]).scale(268);
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:900});
  for(const [name,coordinates,region] of [
   ['Madrid',[-3.7,40.4],'europe'],
   ['Rome',[12.5,41.9],'europe'],
   ['Cairo',[31.2,30],'africa'],
  ]){
   const point=await page.evaluate(([x,y])=>{
    const svg=document.querySelector('#world-globe');svg.scrollIntoView();
    const point=new DOMPoint(x,y).matrixTransform(svg.getScreenCTM());
    return {x:point.x,y:point.y,land:document.elementFromPoint(point.x,point.y)?.classList.contains('world-land')};
   },projection(coordinates));
   assert.equal(point.land,true,`${name} at ${width}px targets land rather than a region link`);
   await page.evaluate(()=>location.hash='#pointer-pending');
   await page.mouse.click(point.x,point.y);
   assert.equal(await page.evaluate(()=>location.hash),'#pointer-'+region,`${name} land click at ${width}px opens ${region}`);
  }
 }
 await page.setViewportSize({width:1440,height:900});
 await page.getByRole('button',{name:'Show all regions',exact:true}).click();
 assert.equal(await page.locator('#world-projection').getAttribute('aria-pressed'),'true');
 const flat=geoNaturalEarth1().translate([500,300]).scale(172);
 for(const [name,coordinates,region,requireLand] of [
  ['Sydney',[151.2,-33.9],'pacific',true],
  ['Honolulu',[-157.8,21.3],'pacific',false],
  ['Beijing',[116.4,39.9],'asia-pacific',true],
 ]){
  const point=await page.evaluate(([x,y])=>{
   const svg=document.querySelector('#world-globe');svg.scrollIntoView();
   const p=new DOMPoint(x,y).matrixTransform(svg.getScreenCTM());
   const hit=document.elementFromPoint(p.x,p.y);
   return {x:p.x,y:p.y,land:Boolean(hit?.classList.contains('world-land')),blocked:Boolean(hit?.closest('.world-map-region'))};
  },flat(coordinates));
  assert.equal(point.blocked,false,`${name} flat click point is not covered by a region badge`);
  if(requireLand)assert.equal(point.land,true,`${name} flat click targets land`);
  await page.evaluate(()=>location.hash='#pointer-pending');
  await page.mouse.click(point.x,point.y);
  assert.equal(await page.evaluate(()=>location.hash),'#pointer-'+region,`Flat map click near ${name} opens ${region}`);
 }
 await page.getByRole('button',{name:'Show globe',exact:true}).click();
 await page.evaluate(({data,land})=>{
  window.disposePointer();
  window.disposePointer=WorldPointer.mountWorldPlayer(document.querySelector('#pointer-test'),data,land,'africa');
 },{data,land});
 await page.getByRole('button',{name:'Facts',exact:true}).click();
 const map=page.locator('#family-map'),marker=page.locator('#family-map [data-world-item="point"]');
 const markerPosition=()=>marker.evaluate(element=>{
  const p=new DOMPoint(0,0).matrixTransform(element.getScreenCTM());return {x:p.x,y:p.y};
 });
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:900});
  await page.locator('#family-reset').click();await map.scrollIntoViewIfNeeded();
  const before=await markerPosition();
  // Start on clear ocean; a 25px physical drag must move the map 25px even
  // when the SVG's min/max height produces margins around its viewBox.
  const start=await map.evaluate(svg=>{
   const p=new DOMPoint(900,550).matrixTransform(svg.getScreenCTM());return {x:p.x,y:p.y};
  });
  await page.mouse.move(start.x,start.y);await page.mouse.down();
  await page.mouse.move(start.x+25,start.y-20,{steps:4});await page.mouse.up();
  const after=await markerPosition();
  assert.ok(Math.abs(after.x-before.x-25)<1,`Horizontal drag follows the pointer at ${width}px`);
  assert.ok(Math.abs(after.y-before.y+20)<1,`Vertical drag follows the pointer at ${width}px`);
  // The unselected panel shows the overview heading (renamed in a059bc9).
  assert.equal(await page.locator('#family-detail h2').textContent(),'1 dated finds & landmarks','Dragging does not select evidence');
  assert.equal(await page.locator('#family-detail').evaluate(element=>element.classList.contains('has-selection')),false,'Dragging leaves no selection');
  await page.locator('#family-reset').click();await map.scrollIntoViewIfNeeded();
  const point=await markerPosition(),transform=await map.locator('g[transform]').first().getAttribute('transform');
  await page.mouse.move(point.x,point.y);await page.mouse.down();
  await page.mouse.move(point.x+1,point.y);await page.mouse.up();
  assert.equal(await page.locator('#family-detail h2').textContent(),'Pointer evidence',`A 1px pointer jitter still selects evidence at ${width}px`);
  assert.equal(await map.locator('g[transform]').first().getAttribute('transform'),transform,'Small pointer jitter does not pan the map');
  assert.equal(await page.getByRole('button',{name:'Facts',exact:true}).getAttribute('aria-expanded'),'true','Selecting evidence opens facts');
  // Clear selection through the real lineage controls before the next width.
  await page.getByRole('button',{name:'Map settings',exact:true}).click();
  await page.locator('#family-taxon').selectOption('homo-sapiens');
  await page.getByRole('button',{name:'Map settings',exact:true}).click();
  await page.locator('#family-taxon').selectOption('all');
  await page.getByRole('button',{name:'Facts',exact:true}).click();
 }
 await page.evaluate(()=>window.disposePointer());
 assert.deepEqual(errors,[],'Pointer interactions cause no runtime errors');
 console.log('PASS world land routing, letterboxed player drags and small-jitter evidence selection at 1440/390/320px.');
}finally{await browser.close();}
