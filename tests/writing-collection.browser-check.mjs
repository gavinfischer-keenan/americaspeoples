import assert from 'node:assert/strict';
export async function checkWritingCollection(fixture){
 const {page}=fixture;
 await page.goto(fixture.url+'sites/world-everyday-writing.html?region=americas#everyday-texts');
 await page.locator('#writing-result-count').waitFor();
 assert.equal(await page.locator('.writing-example').count(),87);
 await page.waitForFunction(()=>document.querySelector('#writing-region').value==='americas');
 assert.equal(await page.locator('.writing-example:visible').count(),13);
 await page.locator('#writing-reset').click();
 assert.equal(await page.locator('.writing-example:visible').count(),87);
 await page.locator('#writing-language').selectOption({label:'Latin'});
 assert.equal(await page.locator('.writing-example:visible').count(),6);
 await page.locator('#writing-search').fill('nonexistent-witness-test');
 assert.equal(await page.locator('.writing-example:visible').count(),0);
 assert.ok(await page.locator('#writing-empty').isVisible());
 await page.locator('#writing-reset').click();
 const media=await page.locator('.writing-pair img').evaluateAll(async images=>Promise.all(images.map(img=>new Promise(resolve=>{const witness=new Image();witness.onload=()=>resolve({src:img.getAttribute('src'),ok:witness.naturalWidth>0});witness.onerror=()=>resolve({src:img.getAttribute('src'),ok:false});witness.src=img.src;}))));
 assert.equal(media.length,18);assert.ok(media.every(m=>m.ok),JSON.stringify(media.filter(m=>!m.ok)));
 const fonts=await page.evaluate(async()=>{await document.fonts.load('24px AtlasCuneiform','𒀀');await document.fonts.load('24px AtlasCoptic','ⲁ');return document.fonts.check('24px AtlasCuneiform','𒀀')&&document.fonts.check('24px AtlasCoptic','ⲁ');});
 assert.equal(fonts,true);
 assert.equal(await page.locator('.original-text:not([lang])').count(),0);
 assert.equal(await page.locator('nav[aria-label="Atlas homes"] a[href="../#map"]').count(),1);
 for(const id of ['maya-centers','maya-culture','monte-alban','inca-civilization'])assert.equal(await page.locator(`nav[aria-label="Americas reading context"] a[href="${id}.html"]`).count(),1);
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:900});
  await page.goto(fixture.url+'sites/world-everyday-writing.html?region=americas#everyday-texts');
  await page.locator('#everyday-texts').scrollIntoViewIfNeeded();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:`test-results/world-writing-${width}.png`});
 }
}
