import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {chromium} from 'playwright';

const bundle=await build({stdin:{resolveDir:process.cwd(),contents:`
  import {MapView} from './src/map';
  import {dataset} from './src/published-data';
  import {historyState} from './src/history';
  import {placeKey} from './src/map-place-groups';
  import voyages from './data/voyages.json';
  import land from './data/land.geojson';
  window.map=new MapView(land,rows=>window.selection=rows.map(r=>r.id));
  document.body.append(map.element);map.context.voyages=voyages.voyages;
  window.mode=playing=>map.setInteraction({mode:'movie',playing,onPause:()=>mode(false)});
  window.setDate=year=>{
    window.year=year;
    map.update(dataset.records.filter(r=>historyState(r,year)!=='outside'),year);map.refreshContext();
  };
  window.records=dataset.records;
  window.inspect=()=>{
    const root=map.element,box=root.getBoundingClientRect();
    const ids=[...root.querySelectorAll('[data-member-ids]')].flatMap(el=>JSON.parse(el.dataset.memberIds));
    const missing=map.visibleRecords().filter(r=>placeKey(r)&&!ids.includes(r.id)).map(r=>r.id);
    const marks=[...root.querySelectorAll('.site,.history-marker,.community-group,.overlay-feature[transform]')].map(el=>el.getScreenCTM()).filter(m=>m.e>=box.left&&m.e<=box.right&&m.f>=box.top&&m.f<=box.bottom);
    const crowded=marks.filter(a=>marks.some(b=>a!==b&&Math.hypot(a.e-b.e,a.f-b.f)<24)).length;
    const groups=[...root.querySelectorAll('[data-density-group]')].map(el=>[el.dataset.point,el.getAttribute('transform'),JSON.parse(el.dataset.memberIds).sort()]);
    const selectedMarks=[...root.querySelectorAll('[aria-pressed="true"]')].map(el=>[el.getAttribute('transform'),JSON.parse(el.dataset.memberIds).sort()]);
    return {groups,selectedMarks,marks:marks.length,crowded,missing,ids:[...new Set(ids)].sort(),year,camera:map.camera(),selection:window.selection??[]};
  };
  mode(false);setDate(1492);
`},bundle:true,write:false,loader:{'.geojson':'json'},format:'iife'});
const css=(await Promise.all(['styles','atlas-ui','atlas-context'].map(n=>readFile('src/'+n+'.css','utf8')))).join('\n');
const html=`<meta charset="utf-8"><style>${css}body{margin:0}.map-canvas{width:100vw;height:100vh}</style><script defer src="/atlas.js"></script>`;
const server=http.createServer((req,res)=>{const script=req.url==='/atlas.js';res.setHeader('Content-Type',script?'text/javascript':'text/html');res.end(script?bundle.outputFiles[0].text:html);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{
  const out='work/density-review/redesign';
  await mkdir(out,{recursive:true});
  const page=await browser.newPage({viewport:{width:1250,height:761},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.waitForFunction(()=>typeof window.inspect==='function');
  const metrics=[];
  const views=[...[1200,1492,1832,1863].map(year=>['overview',year]),['four-corners',1150,[-108.5,36.5],10],['chaco',1100,[-107.96,36.06],120],['cahokia',1200,[-90.06,38.65],70],['central-mexico',1492,[-99,19.4],15],['eastern-brazil',1350,[-43,-18],12],['hawaii',1492,[-156,20.6],28],['kiribati',1500,[173,1.5],24],['inland-north',1492,[-114,44],18]];
  for(const [name,year,center,zoom] of views){
    await page.evaluate(({year,center,zoom})=>{if(center)map.focusRegion(center,zoom);setDate(year);mode(false);},{year,center,zoom});
    const paused=await page.evaluate(()=>inspect());
    assert.deepEqual(paused.missing,[],name+' missing eligible points');
    await page.evaluate(()=>mode(true));
    const playing=await page.evaluate(()=>inspect());
    assert.deepEqual(playing,paused,name+' must preserve membership, selection, camera and date');
    assert.equal(await page.locator('.community-count:visible').count(),0);
    assert.ok(await page.locator('.change-caption:visible').count()<=2);
    await page.screenshot({path:out+'/'+name+'-'+year+'.png'});
    await page.evaluate(()=>mode(false));
    if(name==='overview'&&year===1492){assert.ok(paused.ids.includes('settlement-taos-habitation'));assert.ok(paused.ids.includes('visit-columbus-first-1492-1493-3'));await page.screenshot({path:out+'/overview-1492-paused.png'});}
    metrics.push({name,year,marks:paused.marks,crowded:paused.crowded,represented:paused.ids.length});
  }
  await page.evaluate(()=>{map.focusRegion([-91,34],1);setDate(1492);});
  const single=page.locator('.site:not([data-density-group])[tabindex="0"]').first();
  await single.press('Enter');
  const inspected=await page.evaluate(()=>inspect());
  assert.ok(inspected.selection.length&&inspected.selectedMarks.length&&inspected.groups.length);
  await page.evaluate(()=>mode(true));assert.deepEqual(await page.evaluate(()=>inspect()),inspected);
  await page.evaluate(()=>mode(false));assert.deepEqual(await page.evaluate(()=>inspect()),inspected);
  const group=page.locator('[data-density-group][tabindex="0"]').first();
  const members=JSON.parse(await group.getAttribute('data-member-ids'));
  await group.press('Enter');
  assert.deepEqual(await page.evaluate(()=>window.selection),members);
  for(const [id,gap] of [['eb-ne-formoso',650],['eb-se-primavera',1350]]){
    await page.evaluate(year=>setDate(year),gap);
    await page.evaluate(()=>map.focusRegion([-48,-15],1));
    assert.ok((await page.evaluate(()=>inspect().ids)).includes(id));
    assert.ok(!await page.evaluate(id=>[...document.querySelectorAll('[data-active-member-ids]')].some(el=>JSON.parse(el.dataset.activeMemberIds).includes(id)),id));
  }
  const ending=await page.evaluate(()=>{
    const reference=records.find(row=>row.id==='settlement-taos-habitation');
    const companion={...reference,id:'nearby',location:{...reference.location,lon:reference.location.lon+.002}};
    const ended={...reference,id:'ended',history:{...reference.history,continuity:undefined,endYear:1500,endMeaning:'relocated'}};
    map.focusRegion([reference.location.lon,reference.location.lat],2);
    map.setHighlighted([]);map.update([ended,companion],1499);
    const before=map.element.querySelector('[data-density-group]').dataset.localEnding;
    map.update([ended,companion],1500);
    const group=map.element.querySelector('[data-density-group]');
    return {before:before??null,after:group.dataset.localEnding,members:JSON.parse(group.dataset.memberIds).sort(),symbol:!!group.querySelector('.local-ending-symbol')};
  });
  assert.deepEqual(ending,{before:null,after:'relocated',members:['ended','nearby'],symbol:true});
  const corridor=await page.evaluate(()=>{
    const reference=records.find(row=>row.history?.kind==='exchange');
    const route={...reference,id:'crossing',overlay:{...reference.overlay,direction:undefined,geometry:{type:'LineString',coordinates:[[-108,35],[-93,35]]}}};
    map.focusRegion([-100,35],35);map.update([route],1500);
    const path=map.element.querySelector('[data-history-route="crossing"] .route-line');
    return {crosses:!!path?.getAttribute('d'),start:path?.hasAttribute('marker-start'),end:path?.hasAttribute('marker-end')};
  });
  assert.deepEqual(corridor,{crosses:true,start:false,end:false});
  await page.emulateMedia({reducedMotion:'no-preference'});
  async function flow(direction,playing){
    return page.evaluate(({direction,playing})=>{
      const reference=records.find(row=>row.history?.kind==='exchange');
      const route={...reference,id:'flow',overlay:{...reference.overlay,direction}};
      map.focusRecords([route]);map.update([route],route.history.windows[0].start);mode(playing);
      const style=getComputedStyle(document.querySelector('[data-history-route="flow"] .route-flow'));
      return {shown:style.display!=='none'&&Number(style.opacity)>0,running:style.animationName!=='none'&&style.animationPlayState==='running'};
    },{direction,playing});
  }
  assert.deepEqual(await flow('forward',true),{shown:true,running:true});
  assert.equal((await flow('forward',false)).running,false);
  assert.equal((await flow(undefined,true)).shown,false);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal((await flow('forward',true)).shown,false);
  for(const [kind,caption] of [['conflict','Conflict'],['wreck','Shipwreck'],['settlement','Foundation']]){
    await page.evaluate(kind=>{
      const reference=records.find(r=>r.location&&r.type==='occupation');
      const point={...reference,id:'change',type:'event',history:undefined,
        time:{...reference.time,kind:'occurrence',start:1640,end:1643}};
      if(kind==='conflict')point.overlay={kind,basis:'documented',geometry:{type:'Point',coordinates:[point.location.lon,point.location.lat]}};
      else point.history={kind,claimId:'event'};
      map.focusRecords([point]);map.update([point],1641);mode(true);
    },kind);
    const glyph=page.locator(kind==='conflict'?'.overlay-conflict.dated-change > path':kind==='wreck'?'.dated-change .wreck-symbol':'.dated-change .settlement-symbol').first();
    assert.equal(await glyph.evaluate(el=>getComputedStyle(el).stroke),'rgb(255, 242, 162)');
    const label=page.locator('.dated-change .change-caption:visible');
    assert.match(await label.textContent(),new RegExp(caption+'.*1,?640.*1,?643'));
  }
  await page.setViewportSize({width:850,height:650});
  await page.evaluate(()=>{map.focusRegion([-95,32],1);setDate(1832);mode(true);});
  assert.equal(await page.locator('.route-flow').evaluateAll(lines=>lines.some(el=>getComputedStyle(el).animationName!=='none'&&getComputedStyle(el).display!=='none')),false);
  await page.screenshot({path:out+'/tablet-1832.png'});
  assert.deepEqual(errors,[]);
  await writeFile(out+'/metrics.json',JSON.stringify(metrics,null,2));
  console.table(metrics);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
