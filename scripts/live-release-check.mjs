import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://tripofisch.com/free-utilities/americaspeoples/');assert.match(await page.locator('body').innerText(),/Version 0\.4\.1/);
 await page.getByRole('link',{name:'Launch Americas Peoples',exact:false}).click();await page.locator('#time-slider').waitFor();assert.match(page.url(),/americaspeoples\.11mosswood\.us/);
 assert.equal(await page.getByLabel('Playback speed').inputValue(),'smart');assert.equal(await page.getByLabel('Timeline scale').inputValue(),'log');
 await page.locator('#toggle-layers').click();await page.getByLabel('Year number',{exact:true}).fill('1877');await page.getByLabel('Era',{exact:true}).selectOption('CE');await page.getByRole('button',{name:'Go to year',exact:true}).click();await page.locator('.hazard-el-nino').first().waitFor({state:'visible',timeout:30000});
 await page.locator('.hazard-el-nino').click();await page.getByRole('heading',{name:'Original data fields'}).waitFor();assert.match(await page.locator('main').innerText(),/Gergis/);
 await page.goto('https://americaspeoples.11mosswood.us/docs/coverage-audit.html');assert.ok(await page.locator('tbody tr').count()>40);
 assert.deepEqual(errors,[]);console.log('PASS: live product page v0.4.1 launches the app; Smart/log defaults; ENSO layer and cited review; public coverage audit.');
}finally{await browser.close();}
