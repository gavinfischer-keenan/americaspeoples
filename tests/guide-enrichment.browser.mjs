import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile, copyFile, cp } from 'node:fs/promises';
import { createStaticServer } from '../scripts/static-server.mjs';
import { shell } from '../scripts/site-guide-build.ts';
import { guideNarrativeHTML, guideReadingHTML } from '../scripts/guide-enrichment.ts';
import { loadAttributionInputs, collectSourceAttributions, sourceAttributionHTML, sourceAttributionScript } from '../scripts/source-attribution-build.ts';

// Isolated fixture: the production shell and renderers, without rebuilding the release.
const root='work/guide-reading-browser';
await mkdir(root+'/guide-media',{recursive:true});
const input=await loadAttributionInputs();
for(const image of input.media.images)await copyFile('data/guide-media/'+image.file,root+'/guide-media/'+image.file);
for(const id of ['chaco','mesa-verde','machu-picchu','nan-madol','yap-rai','palau']){
 const content=input.pages.find(p=>p.id===id);
 await writeFile(root+'/'+id+'.html',shell(id,`<h1>${id}</h1>${guideNarrativeHTML(id,input.enrichment,input.media)}${guideReadingHTML(id,content?.sources??[{url:'https://en.wikipedia.org/wiki/Rai_stones',title:'Wikipedia — Rai stones'}],input.enrichment)}`));
}
const entries=collectSourceAttributions(input);
await writeFile(root+'/sources-attributions.js',sourceAttributionScript);
await writeFile(root+'/sources-attributions.html',shell('Sources, attributions & licenses',sourceAttributionHTML(entries,await readFile('THIRD_PARTY.md','utf8'),await readFile('LICENSE.md','utf8'))));
if(process.argv.includes('--generated')){
 await cp('sites',root+'/sites',{recursive:true});
 await cp('data/guide-terrain',root+'/guide-terrain',{recursive:true});
}
const server=createStaticServer(root);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];
page.on('pageerror',error=>errors.push(error.message));
try{
 for(const id of ['chaco','mesa-verde','machu-picchu','nan-madol','yap-rai','palau']){
  await page.goto(origin+'/'+id+'.html');
  await page.locator('.guide-photo').first().scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>[...document.querySelectorAll('.guide-photo img')].every(img=>img.complete&&img.naturalWidth>0));
  assert.equal(await page.locator('.photo-credit a').count()>1,true);
  assert.equal(await page.locator('#further-reading a[href*="wikipedia.org"]').count()>0,true);
  assert.match(await page.locator('.photo-credit').first().innerText(),/not subject to the atlas/);
 }
 await page.goto(origin+'/yap-rai.html');
 assert.equal(await page.locator('.guide-photo').count(),2);
 assert.match(await page.locator('.guide-photo').first().innerText(),/modern view/i);
 await page.locator('#historical-narrative').screenshot({path:'work/guide-reading-browser/yap-rai-preview.png'});
 await page.goto(origin+'/sources-attributions.html');
 assert.equal(await page.locator('[data-source-row]').count(),entries.length);
 await page.getByLabel('Search sources, creators, licenses or places').fill('David Weekly');
 assert.equal(await page.locator('[data-source-row]:visible').count(),1);
 assert.match(await page.locator('#source-count').innerText(),/^1 of /);
 assert.match(await page.locator('[data-source-row]:visible').innerText(),/CC BY 2.0/);
 await page.locator('#source-register').screenshot({path:'work/guide-reading-browser/source-register-preview.png'});
 await page.setViewportSize({width:390,height:844});
 for(const id of ['chaco','yap-rai','sources-attributions']){
  await page.goto(origin+'/'+id+'.html');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' overflows mobile viewport');
 }
 if(process.argv.includes('--generated')){
  for(const width of [1280,390]){
   await page.setViewportSize({width,height:1000});
   for(const id of ['chaco','mesa-verde','machu-picchu','nan-madol']){
    await page.goto(origin+'/sites/'+id+'.html');
    assert.equal(await page.locator('#historical-narrative .reading-prose > p:not(.narrative-citations)').count(),2);
    assert.equal(await page.locator('#further-reading a[href*="wikipedia.org"]').count(),1);
    await page.locator('.guide-photo').first().scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>[...document.querySelectorAll('.guide-photo img')].every(img=>img.complete&&img.naturalWidth>0));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    if(width===1280&&id==='chaco')await page.locator('#historical-narrative').screenshot({path:root+'/generated-chaco-preview.png'});
   }
  }
  await page.getByRole('link',{name:'Sources & licenses',exact:true}).click();
  await page.getByLabel('Search sources, creators, licenses or places').fill('Elisabeth Krämer-Bannow');
  await page.waitForFunction(()=>document.getElementById('source-count').textContent.startsWith('1 of '));
  assert.equal(await page.locator('[data-source-row]:visible').count(),1);
  await page.getByRole('link',{name:'Guide writing and image reuse policy',exact:true}).click();
  assert.match(await page.locator('h1').innerText(),/Guide writing, sources and image reuse/);
 }
 assert.deepEqual(errors,[]);
 console.log(`PASS: six production-renderer guide fixtures, all images/credits, new-guide fallback, ${entries.length} searchable sources, mobile widths and no browser exceptions.${process.argv.includes('--generated')?' Four complete generated guides also passed at desktop/mobile widths; source and reuse navigation passed.':''}`);
}finally{await browser.close();server.close();}
