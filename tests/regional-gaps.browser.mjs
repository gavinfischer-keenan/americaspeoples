import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile, mkdir} from 'node:fs/promises';
import {createStaticServer} from '../scripts/static-server.mjs';

const server=createStaticServer('dist');
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}}), errors=[];
page.on('pageerror',error=>errors.push(error.message));
const origin=`http://127.0.0.1:${server.address().port}`;
const records=JSON.parse(await readFile('dist/dataset.json','utf8')).records;
try {
  await mkdir('test-results',{recursive:true});
  for(const id of ['regional-san-bernabe-1712','regional-nauta-1830','regional-kurtonitj-1840s']) {
    const record=records.find(row=>row.id===id);
    assert.ok(record);
    await page.goto(origin+'/#review/'+id);
    await page.locator('[data-action="locate"]').click();
    await page.locator('#selected-records h4').waitFor();
    assert.equal(await page.locator('#story-select').inputValue(),'free');
    assert.equal(await page.locator('#year-number').inputValue(),String(record.time.start));
    assert.ok((await page.locator('#selected-records').innerText()).includes(record.title));
    const marker=record.history?.kind==='settlement'
      ? page.locator(`[data-record-id="${id}"]`)
      : page.locator(`[data-point="${record.location.lon},${record.location.lat}"]`);
    const box=await marker.boundingBox(), map=await page.locator('#map-host').boundingBox();
    assert.ok(box&&box.x+box.width>map.x&&box.x<map.x+map.width&&box.y+box.height>map.y&&box.y<map.y+map.height,id+' visible on shared map');
    await page.screenshot({path:`test-results/${id}.png`});
  }
  const response=await page.goto(origin+'/docs/regional-gap-evidence.html');
  assert.equal(response.status(),200);
  assert.match(await page.locator('body').innerText(),/58\/100/);
  assert.equal(await page.locator('a[href*="#review/regional-"]').count(),43);
  const review=await page.goto(origin+'/#review/regional-coranderrk-1924');
  assert.equal(review.status(),200);
  await page.locator('[data-action="locate"]').waitFor();
  assert.match(await page.locator('.review-history').innerText(),/closed Coranderrk.*1924; elderly residents remained/i);
  await page.locator('.review-technical > summary').click();
  assert.match(await page.locator('body').innerText(),/Administrative closure is not abandonment/);
  assert.deepEqual(errors,[]);
  console.log('PASS regional evidence: Central/South American and Australian places visible in shared movie; dated closure caveat and packaged guide.');
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
