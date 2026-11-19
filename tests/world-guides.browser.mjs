import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {browserFixture} from '../scripts/browser-fixture.mjs';
import {checkVoyageRoute} from './world-voyage-route-check.mjs';
import {checkWritingCollection} from './writing-collection.browser-check.mjs';
const fixture=await browserFixture();
const {page}=fixture;
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const index=JSON.parse(await readFile('data/world-guide-index.json','utf8')).guides;
await mkdir('test-results',{recursive:true});
try{
 for(const atlas of ['africa','europe','asia-pacific']){
  await page.goto(fixture.url+'#atlas/'+atlas);
  await page.locator('.regional-guides').waitFor();
  assert.equal(await page.locator('.regional-guides .dive-card').count(),index.filter(g=>g.atlasIds.includes(atlas)).length);
  assert.equal(await page.locator('.timeline').isVisible(),false);
  assert.equal(await page.locator('.atlas-coming-soon').textContent(),'COMING SOON');
 }
 for(const id of ['world-lucy','world-human-family','world-hadrians-wall','world-stonehenge','world-orkney','world-tibet-dalai-lamas','world-angkor-wat','world-voyages-europe']){
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
  await page.goto(fixture.url+'#atlas/europe');await page.locator('.regional-guides').waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:`test-results/world-europe-${width}.png`,fullPage:true});
 }
 assert.deepEqual(errors,[]);console.log('PASS regional deep dives, full-area maps, dated finds, canonical voyage round trip and mobile layouts.');
}finally{await fixture.close();}
