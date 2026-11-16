import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createStaticServer} from '../scripts/static-server.mjs';
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const base=`http://127.0.0.1:${server.address().port}`,failures=[];
function sameCamera(actual,expected){const numbers=s=>s.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g).map(Number);const a=numbers(actual),b=numbers(expected);assert.equal(a.length,b.length);a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<1e-6,`camera component ${i}: ${v} versus ${b[i]}`));}
async function check(label,fn){const p=await browser.newPage({viewport:{width:1440,height:960}});try{await fn(p);console.log('PASS',label);}catch(e){failures.push(label+': '+e.message);console.log('FAIL',label,e.message);}finally{await p.close();}}
async function viaLibrary(p){await p.getByRole('link',{name:'Library',exact:true}).click();await p.locator('.library-card[href="#topics"]').click();await p.locator('a[href="#topic/horses"]').click();await p.locator('#topic-play').waitFor();}
try{
 await check('Explore state survives topic entry through Library',async p=>{
  await p.goto(base+'/#explore');await p.locator('#place-search').fill('Taos');
  await p.getByRole('button',{name:'Zoom in',exact:true}).click();const camera=await p.locator('#map-host .world').getAttribute('transform');
  await viaLibrary(p);await p.locator('.topic-toolbar a').click();await p.locator('#map-host').waitFor();
  assert.equal(p.url().split('#')[1],'explore');assert.equal(await p.locator('#place-search').inputValue(),'Taos');sameCamera(await p.locator('#map-host .world').getAttribute('transform'),camera);
 });
 await check('Guided camera survives a reading-page detour',async p=>{
  await p.goto(base);await p.getByRole('button',{name:'Pause',exact:true}).click();await p.locator('#story-select').selectOption('peoples-of-the-north');await p.getByRole('button',{name:'Zoom in',exact:true}).click();const camera=await p.locator('#map-host .world').getAttribute('transform');
  await viaLibrary(p);await p.locator('.topic-toolbar a').click();await p.locator('#map-host').waitFor();assert.equal(await p.locator('#story-select').inputValue(),'peoples-of-the-north');sameCamera(await p.locator('#map-host .world').getAttribute('transform'),camera);
 });
 await check('Manual topic heading stays on the playing date',async p=>{
  await p.goto(base+'/#topic/horses');await p.locator('.topic-date-controls summary').click();await p.locator('#topic-year-input').fill('1600');await p.locator('#topic-date-form button').click();await p.locator('.topic-date-controls summary').click();
  await p.locator('#topic-play').click();await p.waitForFunction(()=>document.querySelector('#topic-year').textContent!=='1,600 CE');await p.locator('#topic-play').click();assert.equal(await p.locator('#topic-scene h2').innerText(),await p.locator('#topic-year').innerText());
 });
 await check('Topic panel colors do not darken header navigation',async p=>{
  await p.goto(base+'/#explore');const color=await p.locator('.header-about').evaluate(el=>getComputedStyle(el).color);await p.getByRole('link',{name:'Topic dives',exact:true}).click();await p.locator('a[href="#topic/horses"]').click();await p.locator('#topic-play').waitFor();assert.equal(await p.locator('.header-about').evaluate(el=>getComputedStyle(el).color),color);
 });
 assert.deepEqual(failures,[]);
}finally{await browser.close();await new Promise(r=>server.close(r));}
