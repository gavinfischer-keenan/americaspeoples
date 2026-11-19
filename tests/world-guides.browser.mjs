import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {browserFixture} from '../scripts/browser-fixture.mjs';
import {checkVoyageRoute} from './world-voyage-route-check.mjs';
import {checkWritingCollection} from './writing-collection.browser-check.mjs';
const fixture=await browserFixture();
const {page}=fixture;
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const index=JSON.parse(await readFile('data/world-guide-index.json','utf8')).guides;
const world=JSON.parse(await readFile((process.env.DIST_PATH||'dist')+'/world-catalogue.json','utf8'));
const mediaManifest=JSON.parse(await readFile('data/world-guide-media.json','utf8')).assets;
await mkdir('test-results',{recursive:true});
try{
 for(const atlas of ['africa','europe','asia-pacific']){
  await page.goto(fixture.url+'#atlas/'+atlas);
  if(atlas==='europe'){
   await page.locator('#europe-map .world').waitFor();
   const hrefs=await page.locator('#europe-guide-list a').evaluateAll(links=>links.map(a=>a.getAttribute('href')));
   for(const guide of index.filter(g=>g.atlasIds.includes(atlas)))assert.ok(hrefs.includes('sites/'+guide.id+'.html'),guide.id);
   assert.equal(await page.locator('.atlas-coming-soon').count(),0);
   continue;
  }
  await page.locator('#family-map .family-land').waitFor();
  assert.equal(await page.locator('.atlas-coming-soon').count(),0);
  assert.equal(await page.locator('#family-play').isVisible(),true);
  const evidence=world.evidence.filter(e=>e.regionIds.includes(atlas));
  assert.ok((await page.locator('.family-map-top').textContent()).includes(evidence.length+' evidence anchors'));
  for(const study of (world.studies||[]).filter(s=>s.regionIds.includes(atlas)))assert.equal(await page.locator('.family-study-links a[href="#study/'+study.id+'"]').count(),1);
  assert.equal(await page.locator('.timeline').isVisible(),false);
 }
 for(const id of ['world-lucy','world-human-family','world-hadrians-wall','world-stonehenge','world-orkney','world-tibet-dalai-lamas','world-angkor-wat','world-voyages-europe','world-picts','world-otzi','world-cold-preserved-people','world-andean-summit-children',...(world.studies||[]).map(s=>s.guideId)]){
  await page.goto(fixture.url+'sites/'+id+'.html');
  await page.locator('h1').waitFor();
  assert.ok(await page.locator('.world-findings li').count(),id);
  assert.equal(await page.locator('.world-map svg title').count(),0,'No competing native hover tooltip');
  assert.ok(await page.locator('.world-map image').count());
  assert.equal(await page.locator('a[href="../guide-terrain/'+id+'.webp"]').count(),1);
  const width=await page.locator('.guide-map-viewport svg').evaluate(el=>el.getBoundingClientRect().width);
  await page.getByRole('button',{name:'Zoom into map',exact:true}).click();
  assert.ok(await page.locator('.guide-map-viewport svg').evaluate(el=>el.getBoundingClientRect().width)>width);
  await page.getByRole('button',{name:'Whole map',exact:true}).click();
  await page.locator('.world-map svg a circle[r="13"]').first().click();
  assert.match(new URL(page.url()).hash,/^#find-/);
 }
 await page.goto(fixture.url+'sites/world-voyages-europe.html');
 await page.locator('#voyage-magellan-elcano-1519-1522 summary').click();
 await page.locator('a[href="../#voyage/magellan-elcano-1519-1522"]').click();
 await page.waitForFunction(()=>location.hash==='#movie'&&document.querySelector('#voyage-title')?.textContent?.includes('Magellan'));
 assert.equal(await page.locator('#watch-voyage').inputValue(),'magellan-elcano-1519-1522');
 assert.match(await page.locator('#voyage-position').textContent(),/1519-09-20/);
 assert.ok(await page.locator('.voyage-regional-guides a').count());
 await checkVoyageRoute(fixture);
 await checkWritingCollection(fixture);
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});
  await page.goto(fixture.url+'sites/world-hadrians-wall.html');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:`test-results/world-wall-${width}.png`,fullPage:true});
  await page.goto(fixture.url+'#atlas/europe');await page.locator('#europe-map .world').waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:`test-results/world-europe-${width}.png`,fullPage:true});
 }
 for(const id of ['world-otzi','world-cold-preserved-people','world-andean-summit-children']){
  await page.goto(fixture.url+'sites/'+id+'.html');
  const media=page.locator('#guide-media');await media.scrollIntoViewIfNeeded();
  assert.equal(await media.locator('img').count(),2);
  for(const img of await media.locator('img').all()){
   await img.scrollIntoViewIfNeeded();
   await img.evaluate(image=>image.decode());
   const imagePath=await img.getAttribute('src');
   const source=mediaManifest.find(asset=>'media/'+asset.file===imagePath);assert.ok(source);
   assert.deepEqual(await img.evaluate(image=>[image.naturalWidth,image.naturalHeight]),[source.width,source.height]);
   assert.ok((await img.getAttribute('alt'))?.length>20);
  }
  assert.equal(await media.getByRole('link',{name:'Image source',exact:true}).count(),2);
  assert.equal(await media.getByRole('link',{name:'Full-size image',exact:true}).count(),2);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await media.screenshot({path:`test-results/${id}-media-phone.png`});
 }
 assert.deepEqual(errors,[]);console.log('PASS regional deep dives, full-area maps, dated finds, canonical voyage round trip, licensed media and mobile layouts.');
}finally{await fixture.close();}
