import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createStaticServer} from '../scripts/static-server.mjs';
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const base=`http://127.0.0.1:${server.address().port}`;
const world=()=>page.locator('#map-host .world').getAttribute('transform');
try{
 await page.goto(base);await page.getByRole('button',{name:'Pause',exact:true}).click();
 await page.getByLabel('Follow an expedition',{exact:true}).selectOption('beagle-1831-1836');
 const year=await page.locator('#year-number').inputValue(),voyage=await page.locator('#voyage-position').innerText();
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.waitForTimeout(120);
 const camera=await world();
 await page.getByRole('link',{name:'Deep dives',exact:true}).click();await page.locator('.dive-tabs a[href="#dives/languages"]').click();
 await page.locator('a[href="#topic/languages"]').click();await page.locator('#topic-map .world').waitFor();
 assert.equal(await page.locator('.timeline').isVisible(),false);
 assert.equal(await page.locator('#topic-map [data-voyage]').count(),0);
 assert.equal(await page.locator('#topic-map [data-boundary]').count(),0);
 assert.equal(await page.locator('#topic-map [data-record-id="settlement-taos-habitation"]').count(),0);
 await page.locator('.topic-date-controls summary').click();await page.locator('#topic-1799').click();
 assert.match(await page.locator('#topic-year').innerText(),/1,799/);
 await page.locator('.topic-date-controls summary').click();
 await page.getByRole('button',{name:/Chapter \d+: A multilingual world in 1799/}).click();
 await page.locator('.language-family').first().locator('summary').click();
 assert.match(await page.locator('.language-lineages').innerText(),/descended from spoken Latin/);
 await page.screenshot({path:'test-results/topic-languages-desktop.png'});
 await page.locator('#topic-scene .scene-sources:not(.scene-notes) summary').click();
 await page.locator('#topic-scene .scene-sources a[href="#review/topic-language-molina"]').click();
 await page.locator('.topic-return').waitFor();
 await page.locator('.review-technical > summary').click();
 assert.match(await page.locator('.history-review').innerText(),/does not establish continuous/);
 await page.locator('[data-action="locate"]').click();
 assert.match(await page.locator('#topic-year').innerText(),/1,571/);
 assert.match(await page.locator('#topic-detail').innerText(),/Molina|Nahuatl/);
 await page.locator('#topic-close-detail').click();
 await page.locator('.topic-toolbar a').filter({hasText:'Shared atlas'}).click();await page.locator('#map-host .world').waitFor();
 assert.equal(await page.locator('#year-number').inputValue(),year,'topic time does not change global year');
 assert.equal(await page.locator('#voyage-select').inputValue(),'beagle-1831-1836');
 assert.equal(await page.locator('#voyage-position').innerText(),voyage,'fractional expedition date retained');
 assert.equal(await world(),camera,'global camera restored');
 await page.getByRole('link',{name:'Explore',exact:true}).click();
 await page.locator('#place-search').fill('Taos');
 const exploreCamera=await world();
 await page.getByRole('link',{name:'Deep dives',exact:true}).click();await page.locator('.dive-tabs a[href="#dives/subjects"]').click();await page.locator('a[href="#topic/horses"]').click();
 await page.locator('#topic-play').click();await page.waitForTimeout(500);await page.locator('#topic-play').click();
 await page.locator('#topic-next').click();assert.match(await page.locator('#topic-year').innerText(),/1,519/);
 await page.locator('.topic-toolbar a').filter({hasText:'Shared atlas'}).click();
 assert.equal(page.url().split('#')[1],'explore');assert.equal(await page.locator('#place-search').inputValue(),'Taos');
 assert.equal(await world(),exploreCamera);
 for(const id of ['sweet-potatoes','boats','dogs','horses','maize','trade','languages']){
  await page.goto(base+'/#topic/'+id);await page.locator('#topic-map .world').waitFor();
  const buttons=page.locator('[data-topic-scene]');
  for(let i=0;i<await buttons.count();i++){await buttons.nth(i).click();assert.ok(Number((await page.locator('#topic-count').innerText()).replace(/\D/g,''))>0,`${id} chapter ${i} has visible evidence`);}
 }
 for(const size of [{width:1024,height:768},{width:768,height:1024}]){
  await page.setViewportSize(size);await page.goto(base+'/#topic/sweet-potatoes');await page.locator('#topic-play').waitFor();await page.locator('#topic-restart').click();
  const box=await page.locator('#topic-map').boundingBox();assert.ok(box.width>300&&box.height>300,'tablet map retains usable space');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'tablet has no horizontal overflow');
  const play=await page.locator('#topic-play').boundingBox();assert.ok(play.y+play.height<=size.height,'tablet transport remains on screen');
  await page.locator('#topic-next').click();assert.match(await page.locator('#topic-year').innerText(),/1,300/);
  await page.screenshot({path:`test-results/topic-sweet-tablet-${size.width}.png`,fullPage:true});
 }
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/#topic/trade');await page.locator('#topic-map .world').waitFor();
 await page.locator('#topic-restart').click();
 assert.ok(await page.locator('#topic-play').isVisible());
 await page.screenshot({path:'test-results/topic-trade-mobile.png',fullPage:true});
 const overflow=await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(el=>[el.tagName,el.className,el.getBoundingClientRect().width]));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile page does not overflow horizontally: '+JSON.stringify(overflow));
 await page.locator('#topic-next').click();assert.match(await page.locator('#topic-year').innerText(),/1,401 BCE/);
 assert.deepEqual(errors,[]);console.log('Topic clocks, context isolation, review returns, all chapters, mobile and global state restoration passed.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
