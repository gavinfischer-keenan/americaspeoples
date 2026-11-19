import assert from 'node:assert/strict';

export async function checkVoyageRoute(fixture){
 const page=await fixture.context.newPage();
 let releaseBoundary;
 const boundaryGate=new Promise(resolve=>{releaseBoundary=resolve;});
 await page.route('**/colonial-boundaries.json',async route=>{
  await boundaryGate;
  await route.continue();
 });
 try{
  await Promise.all([
   page.waitForRequest('**/colonial-boundaries.json'),
   page.goto(fixture.url+'#voyage/magellan-elcano-1519-1522',{waitUntil:'domcontentloaded'}),
  ]);
  await page.waitForFunction(()=>location.hash==='#movie'&&document.querySelector('#voyage-title')?.textContent?.includes('Magellan'),null,{timeout:12000});
  assert.match(await page.locator('#voyage-position').textContent(),/1519-09-20/);
  assert.ok(await page.locator('.selected-traveler[data-voyage="magellan-elcano-1519-1522"]').count());
  await page.locator('#play').click();
  await page.waitForFunction(()=>/Following journey/.test(document.querySelector('#voyage-position')?.textContent??'')&&!/1519-09-20/.test(document.querySelector('#voyage-position').textContent));
  await page.locator('#restart').click();
  assert.match(await page.locator('#voyage-position').textContent(),/1519-11-07/);
 }finally{
  releaseBoundary();
  await page.unrouteAll({behavior:'wait'});
  await page.close();
 }
}

