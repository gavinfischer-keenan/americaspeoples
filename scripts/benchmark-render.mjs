import {chromium} from 'playwright';
import {createStaticServer} from './static-server.mjs';
import {writeFile} from 'node:fs/promises';
const server=createStaticServer('dist');await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.locator('#time-slider').waitFor();
 await page.getByLabel('Year number',{exact:true}).fill('1000');await page.getByLabel('Era',{exact:true}).selectOption('CE');await page.getByRole('button',{name:'Go to year',exact:true}).click();
 const first=page.locator('[data-visible-index]').first();await first.focus();await first.press('Enter');
 const focusRetained=await page.evaluate(()=>document.activeElement?.hasAttribute('data-visible-index'));
 await page.evaluate(()=>{window.auditMutations=0;new MutationObserver(list=>{window.auditMutations+=list.filter(x=>x.type==='childList').length;}).observe(document.querySelector('#site-panel'),{subtree:true,childList:true});});
 const client=await page.context().newCDPSession(page);await client.send('Performance.enable');
 const metric=async()=>Object.fromEntries((await client.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
 const before=await metric();
 const box=await page.locator('#map-host svg').boundingBox();
 await page.mouse.move(box.x+box.width*.5,box.y+box.height*.55);await page.mouse.down();
 await page.mouse.move(box.x+box.width*.55,box.y+box.height*.58,{steps:120});await page.mouse.up();
 const after=await metric();
 const report={measuredAt:new Date().toISOString(),focusRetained,panSteps:120,listMutations:await page.evaluate(()=>window.auditMutations),scriptMs:(after.ScriptDuration-before.ScriptDuration)*1000,layoutMs:(after.LayoutDuration-before.LayoutDuration)*1000,recalcStyleMs:(after.RecalcStyleDuration-before.RecalcStyleDuration)*1000,heapMiB:after.JSHeapUsedSize/1048576};
 await writeFile(process.env.BENCHMARK_OUT||'test-results/render-benchmark.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
