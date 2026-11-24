import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createStaticServer} from '../scripts/static-server.mjs';
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const base=`http://127.0.0.1:${server.address().port}`,failures=[];
async function check(label,fn){const p=await browser.newPage({viewport:{width:1024,height:768}});try{await fn(p);console.log('PASS',label);}catch(e){failures.push(label+': '+e.message);console.log('FAIL',label,e.message);}finally{await p.close();}}
try{
 await check('Boats accepts an evidence date earlier than its opening chapter',async p=>{
  await p.goto(base+'/#topic/boats');await p.locator('.topic-date-controls summary').click();
  await p.locator('#topic-year-input').fill('68000');await p.locator('#topic-era').selectOption('BCE');await p.locator('#topic-date-form button').click();
  assert.equal(await p.locator('#topic-date-error').innerText(),'');assert.match(await p.locator('#topic-year').innerText(),/68,000 BCE/);
 });
 for(const [topic,record,year] of [['boats','px-madjedbebe-onset','68,751 BCE'],['dogs','topic-dog-alaska','8,461 BCE']]){
  await check(`${topic} review opens the source date without clamping`,async p=>{
   await p.goto(base+'/#topic/'+topic);await p.locator('#topic-scene .scene-sources:not(.scene-notes) summary').click();
   await p.locator(`#topic-scene .scene-sources a[href="#review/${record}"]`).click();await p.locator('[data-action="locate"]').click();
   assert.equal(await p.locator('#topic-year').innerText(),year);
  });
 }
 await check('Hawaiian dog chapter opens its human context in shared history',async p=>{
  await p.goto(base+'/#topic/dogs');await p.locator('[data-topic-scene]').last().click();
  const context=p.locator('.topic-context a[href="#context/context-hawaii-provisioning-1779"]');
  assert.equal(await context.count(),1);await context.click();await p.locator('[data-action="locate"]').click();
  // Hawaiʻi belongs to the Pacific regional movie.
  await p.locator('#map-host .world').waitFor();assert.equal(p.url().split('#')[1],'atlas/pacific');assert.equal(await p.locator('#year-number').inputValue(),'1779');
 });
 assert.deepEqual(failures,[]);
}finally{await browser.close();await new Promise(r=>server.close(r));}
