import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://tripofisch.com/free-utilities/americaspeoples/');assert.ok((await page.locator('body').innerText()).includes('Version '+version));
 await page.getByRole('link',{name:'Launch Americas Peoples',exact:false}).click();await page.locator('#time-slider').waitFor();assert.match(page.url(),/americaspeoples\.11mosswood\.us/);
 assert.equal(await page.getByLabel('Playback speed').inputValue(),'smart');assert.equal(await page.getByLabel('Timeline scale').inputValue(),'log');
 await page.locator('#toggle-layers').click();await page.getByLabel('Year number',{exact:true}).fill('1877');await page.getByLabel('Era',{exact:true}).selectOption('CE');await page.getByRole('button',{name:'Go to year',exact:true}).click();await page.locator('.hazard-el-nino').first().waitFor({state:'visible',timeout:30000});
 await page.locator('.hazard-el-nino').click();await page.getByRole('heading',{name:'Original data fields'}).waitFor();assert.match(await page.locator('main').innerText(),/Gergis/);
 await page.goto('https://americaspeoples.11mosswood.us/docs/coverage-audit.html');assert.ok(await page.locator('tbody tr').count()>40);
 await page.screenshot({path:'test-results/live-coverage-round9.png',fullPage:false});
 await page.goto('https://americaspeoples.11mosswood.us/#review/r9v-sw-pot-decommission');await page.getByRole('heading',{name:/Pot Creek/}).first().waitFor();assert.match(await page.locator('main').innerText(),/no evidence of conflict/);
 await page.goto('https://americaspeoples.11mosswood.us/#about');await page.getByRole('link',{name:'Latest research source decisions',exact:true}).click();await page.getByRole('heading',{name:/Round nine/}).waitFor();assert.match(await page.locator('body').innerText(),/87 source-checked records/);
 assert.deepEqual(errors,[]);console.log(`PASS: live product page v${version} launches the app; Smart/log defaults; ENSO cited review; refreshed coverage; new Pot Creek review; discoverable round-nine report.`);
}finally{await browser.close();}
