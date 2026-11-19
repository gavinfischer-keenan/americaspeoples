import assert from 'node:assert/strict';
import {readFile, mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {createStaticServer} from '../scripts/static-server.mjs';

const {voyages}=JSON.parse(await readFile('data/voyages.json','utf8'));
const server=createStaticServer('dist');
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=process.env.BASE_URL?.replace(/\/$/,'')||`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
page.on('pageerror',error=>errors.push(error.message));
const choose=async v=>{
  await page.getByLabel('Follow an expedition',{exact:true}).selectOption(v.id);
  assert.match(await page.locator('#voyage-position').innerText(),new RegExp('^'+v.stops[0].arrival));
};
const progress=async value=>page.locator('#voyage-progress').evaluate((el,value)=>{
  el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));
},value);
try{
  await mkdir('test-results',{recursive:true});
  await page.goto(base+'/#movie');
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  for(const fragment of ['galiano','narvaez','mcclure','sverdrup','maud','gauss','charcot','filchner','ellsworth-wyatt-earp-1933-1934','ellsworth-wyatt-earp-1934','clerke','gore']){
    const v=voyages.find(v=>v.id.includes(fragment));assert.ok(v,fragment);
    if(v.stops[0].arrival>'1900-12-31'){
      assert.equal(await page.locator(`#watch-voyage option[value="${v.id}"]`).count(),0,fragment+' is archived outside map years');
      continue;
    }
    await choose(v);await progress(10000);
    assert.match(await page.locator('#voyage-position').innerText(),new RegExp('^'+(v.stops.at(-1).departure>'1900-12-31'?'1900-12-31':v.stops.at(-1).departure)));
    assert.ok(await page.locator('#voyage-evidence a').count()>0,fragment+' citations');
  }
  const gore=voyages.find(v=>v.id==='gore-king-homeward-1779-1780');
  const before=await page.locator('#voyage-position').innerText();
  await page.locator(`[data-follow-expedition="${gore.id}"]`).click();
  assert.equal((await page.locator('#voyage-position').innerText()).slice(0,10),before.slice(0,10),'locating an offscreen return preserves the shared day');
  await page.screenshot({path:'test-results/voyage-gaps-gore-return.png'});

  const columbus=voyages.find(v=>v.id==='columbus-fourth-1502-1504');
  await choose(columbus);await progress(6000);
  assert.match(await page.locator('#voyage-position').innerText(),/position not reconstructed/);
  assert.match(await page.locator('#expeditions-now').innerText(),/stranded on Jamaica/,'the long untraced stranding remains visible on the shared clock');
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:'test-results/voyage-gaps-jamaica-mobile.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS new American and polar journeys, cited evidence, endpoint dates, offscreen locate and Jamaica stranding context.');
}finally{
  await browser.close();await new Promise(resolve=>server.close(resolve));
}
