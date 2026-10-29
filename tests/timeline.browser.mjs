import { build } from 'esbuild';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const out=path.resolve('test-results/timeline-app'); await mkdir(out,{recursive:true});
await build({entryPoints:['src/bootstrap.ts'],bundle:true,format:'iife',platform:'browser',target:'chrome110',outfile:path.join(out,'app.js'),loader:{'.geojson':'json'}});
await writeFile(path.join(out,'index.html'),await readFile('index.html','utf8'));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto(pathToFileURL(path.join(out,'index.html')).href);
 assert.equal(await page.getByLabel('Playback speed').inputValue(),'smart');
 assert.equal(await page.getByLabel('Timeline scale').inputValue(),'log');
 const jump=async(y,era)=>{await page.getByLabel('Year number',{exact:true}).fill(String(y));await page.getByLabel('Era',{exact:true}).selectOption(era);await page.getByRole('button',{name:'Go to year',exact:true}).click();};
 await jump(25000,'BCE');const logValue=Number(await page.locator('#time-slider').inputValue());
 await page.getByLabel('Timeline scale').selectOption('linear');
 assert.equal(await page.locator('#current-year').innerText(),'25,000 BCE');
 assert.ok(Number(await page.locator('#time-slider').inputValue())>logValue);
 await page.getByLabel('Timeline scale').selectOption('log');
 assert.ok((await page.locator('#timeline-note').innerText()).includes('unequal'));
 await jump(1,'BCE');await page.locator('#time-slider').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#current-year').innerText(),'1 CE');
 await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#current-year').innerText(),'1 BCE');
 await jump(1000,'CE');await page.getByLabel('Timeline window').selectOption('10');await page.locator('#time-slider').focus();await page.keyboard.press('Home');assert.equal(await page.locator('#current-year').innerText(),'990 CE');await page.keyboard.press('End');assert.equal(await page.locator('#current-year').innerText(),'1,010 CE');
 await page.getByLabel('Timeline window').selectOption('all');
 // Pointer travel uses the transformed year mapping and stops animation.
 const slider=await page.locator('#time-slider').boundingBox();await page.mouse.click(slider.x+slider.width*.65,slider.y+slider.height/2);
 const pointerYear=await page.locator('#current-year').innerText();assert.notEqual(pointerYear,'1,010 CE');
 await page.getByRole('button',{name:'Play',exact:true}).click();await page.waitForTimeout(1100);await page.getByRole('button',{name:'Pause',exact:true}).click();assert.notEqual(await page.locator('#current-year').innerText(),pointerYear);
 for(const width of [1440,1100,768,390]) {
   await page.setViewportSize({width,height:1000});
   const rects=await page.locator('.timeline').evaluate(el=>{const box=el.getBoundingClientRect();return [...el.querySelectorAll('select,input,button,#time-ticks,.range-labels')].filter(x=>x.getBoundingClientRect().width>0).map(x=>{const b=x.getBoundingClientRect();return {name:x.id||x.textContent,x:b.x,y:b.y,right:b.right,bottom:b.bottom,container:box.toJSON()};});});
   for(const r of rects)assert.ok(r.x>=-1&&r.right<=width+1&&r.y>=r.container.y-1&&r.bottom<=r.container.bottom+1,`timeline controls fit at${width}: ${JSON.stringify(r)}`);
   await page.screenshot({path:`test-results/timeline-${width}.png`,fullPage:false});
 }
 assert.deepEqual(errors,[]);console.log('PASS: Smart/log defaults, scale change retains year, BCE/CE keyboard, local windows, pointer drag, playback, responsive timeline.');
} finally {await browser.close();}
