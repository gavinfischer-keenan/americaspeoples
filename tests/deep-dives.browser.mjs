import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createStaticServer} from '../scripts/static-server.mjs';
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const base=`http://127.0.0.1:${server.address().port}`;
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await mkdir('test-results',{recursive:true});
try{
 await page.goto(base+'/#explore');await page.locator('#place-search').fill('Taos');
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();
 const camera=await page.locator('#map-host .world').getAttribute('transform');
 await page.getByRole('link',{name:'Deep dives',exact:true}).click();
 await page.locator('.dive-category').first().waitFor();assert.equal(await page.locator('.dive-category').count(),4);
 for(const c of ['subjects','places','languages','cultures']){
  await page.locator(`.dive-tabs a[href="#dives/${c}"]`).click();
  await page.locator(`.dive-tabs a[href="#dives/${c}"][aria-current="page"]`).waitFor();assert.ok(await page.locator('.dive-card:not(.dive-planned) a').count());
  assert.ok(await page.locator('.dive-planned').count());
  assert.equal(await page.locator('.dive-planned a,.dive-planned button').count(),0);
  assert.equal(await page.locator(`.dive-tabs a[href="#dives/${c}"]`).getAttribute('aria-current'),'page');
 }
 await page.locator('a[href="#topic/haudenosaunee"]').click();await page.locator('#topic-next').click();
 await page.locator('.topic-toolbar a').filter({hasText:'Shared atlas'}).click();
 assert.equal(await page.locator('#place-search').inputValue(),'Taos');
 assert.equal(await page.locator('#map-host .world').getAttribute('transform'),camera);
 await page.getByRole('link',{name:'Deep dives',exact:true}).click();
 await page.locator('.dive-category[href="#dives/places"]').click();
 await page.locator('[data-dive="place-chaco"] a[href="#story/chaco-connections"]').click();
 await page.locator('#story-select').waitFor();assert.equal(await page.locator('#story-select').inputValue(),'chaco-connections');
 assert.ok(await page.locator('#concurrent-context').isVisible());
 await page.goBack();await page.locator('[data-dive="place-chaco"]').waitFor();
 await page.locator('[data-dive="place-hovenweep"] a').click();await page.locator('h1').waitFor();
 assert.match(await page.locator('h1').innerText(),/Hovenweep/);
 await page.goto(base+'/#topics/languages');await page.locator('#topic-play').waitFor();
 assert.match(await page.locator('.topic-toolbar h2').innerText(),/Languages/);
 await page.goto(base+'/#sites');await page.locator('[data-dive="place-machu-picchu"]').waitFor();
 await page.goto(base+'/#dives/unknown');await page.locator('.dive-category').first().waitFor();assert.equal(await page.locator('.dive-category').count(),4);
 for(const [width,height] of [[1440,960],[1024,768],[768,1024],[390,844]]){
  await page.setViewportSize({width,height});await page.goto(base+'/#dives');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:`test-results/deep-dives-${width}.png`,fullPage:true});
  await page.locator('.dive-category[href="#dives/places"]').click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 assert.deepEqual(errors,[]);console.log('PASS categorized existing content, planned states, legacy links, contextual story launch, Back and shared camera restoration.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
