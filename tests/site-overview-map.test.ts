import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import type {EvidenceRecord} from '../src/model';
import type {SiteGuide} from '../src/site-guides';
import {siteGuides} from '../src/site-guides';
import {dataset} from '../src/published-data';

// The initial red run reports the missing feature as an assertion, not an import error.
const overview = existsSync(new URL('../src/site-overview-map.ts', import.meta.url))
  ? await import('../src/site-overview-map') : null;
const guide=(ids:string[], extra:Partial<SiteGuide>={}):SiteGuide=>({id:'example',title:'Example',href:'sites/example.html',region:'Example region',description:'Example place',recordIds:ids,kind:'site',report:'',...extra});
const record=(id:string,lon:number,lat:number,place=id):EvidenceRecord=>({
  id,revision:1,type:'occupation',title:id,culture:{id:'example',name:'Example',kind:'culture',color:'#123456'},
  location:{id:place,name:place,lon,lat,precision:'Public feature anchor, approximately 50 m.',provenance:'Published public map'},destination:null,routeKind:'schematic',
  time:{kind:'interval',start:900,end:1200,original:'900–1200',method:'Published chronology',interpretation:'Occupation'},claims:[],sources:[],
  review:{summary:'',limitations:'',discussion:'',provenance:'',reviewedAt:'2026-11-16',history:[],relatedIds:[]},
});
const merc=(lat:number)=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))*180/Math.PI;

test('site overview module provides the pure manifest and accessible renderer',()=>{
  assert.equal(typeof overview?.createSiteOverview,'function');
  assert.equal(typeof overview?.siteOverviewHTML,'function');
});

test('a tall northern region can use a square terrain map without widening across most of the world',()=>{
  assert.ok(overview);
  const map=overview.createSiteOverview(guide(['south','north','west'],{level:'region',mapAspectRatio:1} as Partial<SiteGuide>),[record('south',-75,44),record('north',-70,82),record('west',-140,67)],[])!;
  assert.ok(map.bounds[2]-map.bounds[0]<150);
  assert.match(overview.siteOverviewHTML(map),/viewBox="0 0 1200 1200"/);
});
test('phases and coordinate aliases share a feature while all review links remain available',()=>{
  assert.ok(overview);
  const records=[record('early',-108,37,'House'),record('late',-108,37,'House'),record('alias',-108.00000001,37,'House alias')];
  const before=JSON.stringify(records);
  const map=overview.createSiteOverview(guide(['early','late'],{referenceRecordIds:['alias']}),records,[])!;
  assert.equal(map.points.length,1);
  assert.deepEqual(new Set(map.points[0].recordIds),new Set(['early','late','alias']));
  assert.equal(map.points[0].lon,-108);
  assert.equal(map.omittedPoints,0);
  assert.equal(JSON.stringify(records),before);
});
test('related guides are a fallback only when direct and reference evidence has no mapped place',()=>{
  assert.ok(overview);
  const rows=[record('local',-108,37),record('remote',-90,38)];
  const related=guide(['remote'],{id:'related'});
  const direct=guide(['local'],{relatedGuideIds:['related']});
  assert.deepEqual(overview.createSiteOverview(direct,rows,[related])!.points.map(p=>p.id),['local']);
  const empty=guide(['missing'],{relatedGuideIds:['related']});
  assert.deepEqual(overview.createSiteOverview(empty,rows,[related])!.points.map(p=>p.id),['remote']);
  assert.equal(overview.createSiteOverview(guide(['missing']),rows,[]),null);
});
test('a local study excludes distant exchange and unrelated context while a regional study keeps its geography',()=>{
  assert.ok(overview);
  const rows=[record('house',-108,37),record('kiva',-108.001,37.001),record('distant',-90,38),record('trade',-100,20)];
  rows[3].type='movement';rows[3].destination=record('end',-108,37).location;
  const local=overview.createSiteOverview(guide(rows.map(r=>r.id)),rows,[])!;
  assert.deepEqual(new Set(local.points.map(p=>p.id)),new Set(['house','kiva']));
  assert.equal(local.omittedPoints,2);
  const regional=overview.createSiteOverview(guide(rows.map(r=>r.id),{level:'region'}),rows,[])!;
  assert.ok(regional.points.some(p=>p.id==='distant'));
  assert.ok(regional.points.some(p=>p.id==='trade'));
});
test('bounds are padded 2:1 in Mercator with a useful minimum ground width',()=>{
  assert.ok(overview);
  for(const rows of [[record('one',12,70)],[record('a',-108,36),record('b',-108.001,37)]]){
    const map=overview.createSiteOverview(guide(rows.map(r=>r.id)),rows,[])!;
    const [w,s,e,n]=map.bounds;
    assert.ok(Math.abs((e-w)/(merc(n)-merc(s))-2)<1e-8);
    const groundWidth=(e-w)*Math.PI/180*6371008.8*Math.cos((s+n)/2*Math.PI/180);
    assert.ok(groundWidth>=499);
    for(const point of map.points){assert.ok(point.lon>w&&point.lon<e);assert.ok(point.lat>s&&point.lat<n);}
  }
});
test('Pacific seam bounds stay local and canonical point coordinates are unchanged',()=>{
  assert.ok(overview);
  const rows=[record('east',179.8,-17),record('west',-179.7,-17.1)];
  const map=overview.createSiteOverview(guide(rows.map(r=>r.id),{level:'region'}),rows,[])!;
  assert.ok(map.bounds[2]-map.bounds[0]<2);
  assert.equal(map.points.find(p=>p.id==='west')!.lon,-179.7);
  for(const point of map.points){let lon=point.lon;while(lon<map.bounds[0])lon+=360;assert.ok(lon<=map.bounds[2]);}
});
test('ordinary western longitude rounding never turns a compact site into a world-spanning map',()=>{
  assert.ok(overview);
  for(const id of ['chaco','mesa-verde','machu-picchu','castle-rock','sand-canyon','wari']){
    const g=siteGuides.find(g=>g.id===id)!;
    const map=overview.createSiteOverview(g,dataset.records,siteGuides)!;
    // Wari is explicitly a culture guide spanning Pikillacta and Cerro Baúl.
    assert.ok(map.bounds[2]-map.bounds[0]<(g.kind==='culture'?15:5),`${id}: ${map.bounds}`);
    assert.ok(map.bounds[0]<0&&map.bounds[2]<0,`${id} should retain western bounds`);
  }
});
test('every expanded study keeps all its public architectural feature points',()=>{
  assert.ok(overview);
  for(const id of ['chaco','mesa-verde','hovenweep','canyons-of-the-ancients','machu-picchu','cahokia']){
    const g=siteGuides.find(g=>g.id===id)!;
    const ids=new Set([...g.recordIds,...g.referenceRecordIds??[]]);
    const features=dataset.records.filter(r=>ids.has(r.id)&&r.location&&['settlement','habitation'].includes(r.history?.kind??''));
    const map=overview.createSiteOverview(g,dataset.records,siteGuides)!;
    for(const r of features) assert.ok(map.points.some(p=>p.recordIds.includes(r.id)),`${id} omitted ${r.id}`);
  }
});
test('all published mapped guides have finite bounds enclosing every canonical point',()=>{
  assert.ok(overview);
  for(const g of siteGuides){
    const map=overview.createSiteOverview(g,dataset.records,siteGuides);
    if(!map)continue;
    const [w,s,e,n]=map.bounds;
    assert.ok(map.bounds.every(Number.isFinite),g.id);
    assert.ok(w<e&&s<n&&s>-90&&n<90,g.id);
    assert.ok(Math.abs((e-w)/(merc(n)-merc(s))-(map.pixels?.[0]??1200)/(map.pixels?.[1]??600))<1e-7,g.id);
    for(const p of map.points){let lon=p.lon;while(lon<w)lon+=360;while(lon>e&&lon-360>=w)lon-=360;assert.ok(lon>=w&&lon<=e&&p.lat>=s&&p.lat<=n,`${g.id}: ${p.name}`);}
  }
});
test('renderer registers terrain, exposes linked labels and explains chronological and spatial scope',()=>{
  assert.ok(overview);
  const map=overview.createSiteOverview(guide(['one'],{title:'House <script>alert(1)</script>'}),[record('one',-108,37,'House & kiva')],[])!;
  const html=overview.siteOverviewHTML(map);
  assert.match(html,/viewBox="0 0 1200 600"/);
  assert.match(html,/href="\.\.\/guide-terrain\/example\.webp"/);
  assert.match(html,/preserveAspectRatio="none"/);
  assert.match(html,/href="\.\.\/#review\/one"/);
  assert.match(html,/tabindex="0"/);
  assert.match(html,/Features span different periods; select a label for history and dates/);
  assert.match(html,/Modern terrain/);
  assert.match(html,/Markers locate places, not building outlines/);
  assert.match(html,/North/);
  assert.match(html,/Approximate scale/);
  assert.match(html,/House &amp; kiva/);
  assert.ok(!html.includes('<script>'));
  assert.match(html,/<details><summary>Location notes and evidence<\/summary><p>Public feature anchor/);
});
test('dense maps use a numbered linked key and place visible labels without overlapping boxes',()=>{
  assert.ok(overview);
  const rows=Array.from({length:45},(_,i)=>record(`r${i}`,-108+(i%9)*0.00002,37+Math.floor(i/9)*0.00002,`House ${i}`));
  const map=overview.createSiteOverview(guide(rows.map(r=>r.id)),rows,[])!;
  const html=overview.siteOverviewHTML(map);
  assert.match(html,/site-overview-key/);
  for(const r of rows)assert.ok(html.includes(`href="../#review/${r.id}"`));
  const boxes=[...html.matchAll(/data-label-box="([\d.,-]+)"/g)].map(m=>m[1].split(',').map(Number));
  assert.equal(boxes.length,map.points.length);
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
    const [x,y,w,h]=boxes[i], [xx,yy,ww,hh]=boxes[j];
    assert.ok(x+w<=xx||xx+ww<=x||y+h<=yy||yy+hh<=y,`Labels ${i}, ${j} overlap`);
  }
});
test('a saturated label layout still gives every remaining feature a visible numbered marker',()=>{
  assert.ok(overview);
  const map={id:'dense',title:'Dense',bounds:[-108.005,36.9975,-107.995,37.0025] as [number,number,number,number],omittedPoints:0,
    points:Array.from({length:500},(_,i)=>({id:`p${i}`,name:`House ${i}`,lon:-108+(i%25)*0.000001,lat:37+Math.floor(i/25)*0.000001,precision:'Public point',recordIds:[`r${i}`]}))};
  const html=overview.siteOverviewHTML(map);
  const labels=[...html.matchAll(/data-label-box=/g)].length;
  const fallback=[...html.matchAll(/class="site-overview-point-number"/g)].length;
  assert.ok(fallback>0,'The test must saturate the label layout');
  assert.equal(labels+fallback,map.points.length);
});
