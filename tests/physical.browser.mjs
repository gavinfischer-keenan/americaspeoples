import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createStaticServer} from '../scripts/static-server.mjs';
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const origin=`http://127.0.0.1:${server.address().port}`;
try{
 await page.goto(origin);await page.locator('#time-slider').waitFor();
 const jump=async(y,era='CE')=>{await page.getByLabel('Year number',{exact:true}).fill(String(y));await page.getByLabel('Era',{exact:true}).selectOption(era);await page.getByRole('button',{name:'Go to year',exact:true}).click();};
 await page.locator('#toggle-layers').click();
 await jump(18050,'BCE');await page.locator('.ice-context path').first().waitFor();assert.ok(await page.locator('.ice-context path').count());assert.match(await page.locator('#ice-status').innerText(),/20,000/);
 await page.getByLabel('Ice boundary scenario').selectOption('max');await page.waitForFunction(()=>document.querySelector('#ice-status').textContent.includes('MAX'));assert.match(await page.locator('#ice-status').innerText(),/MAX/);
 await page.locator('#show-currents').check();await page.locator('#show-winds').check();assert.ok(await page.locator('.flow-warm').count()>5);assert.equal(await page.locator('.flow-wind').count(),10);
 assert.ok(Number(await page.locator('#context-count').innerText())>20);
 const before=await page.locator('#context-count').innerText();await page.locator('[data-context-index]').first().click();assert.match(await page.locator('#selected-records').innerText(),/Chronology unresolved/);assert.doesNotMatch(await page.locator('#selected-records').innerText(),/Documented time/);
 await page.locator('#show-undated').uncheck();assert.equal(await page.locator('.undated-context').count(),0);assert.equal(await page.locator('#context-count').innerText(),'0');await page.locator('#show-undated').check();assert.equal(await page.locator('#context-count').innerText(),before);
 await page.screenshot({path:'test-results/physical-ice-ocean.png',fullPage:true});
 await jump(1877);assert.ok(await page.locator('.hazard-el-nino').count());assert.equal(await page.locator('.ice-context').count(),0);
 await page.locator('[data-climate="el-nino"]').uncheck();assert.equal(await page.locator('.hazard-el-nino').count(),0);await page.locator('[data-climate="el-nino"]').check();
 await page.locator('.hazard-el-nino').click();await page.getByRole('heading',{name:'Original data fields'}).waitFor();assert.match(await page.locator('main').innerText(),/Gergis/);
 await page.goto(origin+'/#physical');await page.getByLabel('Natural hazard kind').selectOption('volcano');await page.getByLabel('Search natural hazards').fill('Krakatau');assert.ok(await page.locator('#hazard-results a').count()>0);
 await page.goto(origin+'/docs/coverage-audit.html');assert.match(await page.locator('h1').innerText(),/thin/);assert.ok(await page.locator('tbody tr').count()>40);
 await page.goto(origin+'/#map');await page.setViewportSize({width:390,height:844});await page.locator('#toggle-layers').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'test-results/physical-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS: ice snapshots/scenarios, ocean arrows, unresolved contexts, ENSO toggle and source review, hazard search, coverage report and mobile width.');
}catch(e){await page.screenshot({path:'test-results/physical-failure.png',fullPage:true});console.log(await page.evaluate(()=>[...document.querySelectorAll('*')].filter(x=>x.getBoundingClientRect().right>innerWidth+1).slice(-12).map(x=>[x.tagName,x.id,x.className,x.getBoundingClientRect().right])));throw e;}finally{await browser.close();server.close();}
