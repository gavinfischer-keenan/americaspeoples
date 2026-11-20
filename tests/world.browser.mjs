import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {browserFixture} from '../scripts/browser-fixture.mjs';

// Test the built release, deriving records and totals from that same artifact.
const root=process.env.DIST_PATH||'dist';
const [data,summary,guideIndex]=await Promise.all([
 path.join(root,'world-catalogue.json'),path.join(root,'world-summary.json'),'data/world-guide-index.json',
].map(async file=>JSON.parse(await readFile(file,'utf8'))));
const studies=['genghis-khan','marco-polo','silk-roads','hannibal','ibn-fadlan','chinese-explorers','ancient-shipwrecks'].map(id=>{
 const study=data.studies.find(s=>s.id===id);assert.ok(study,'Packaged study '+id);return study;
});
const fixture=await browserFixture({reducedMotion:'reduce'});
const {page}=fixture;
const regionRoutes={americas:'#movie',africa:'#atlas/africa',europe:'#atlas/europe','asia-pacific':'#atlas/asia-pacific'};
const yearLabel=year=>{
 if(1950-year>=1_000_000)return '~'+((1950-year)/1_000_000).toLocaleString('en-US',{maximumFractionDigits:2})+' million years ago';
 if(year<=-10000)return '~'+((1950-year)/1000).toLocaleString('en-US',{maximumFractionDigits:1})+' thousand years BP';
 return (year<=0?1-year:year).toLocaleString('en-US')+(year<=0?' BCE':' CE');
};
const playerData=study=>study?{
 evidence:data.evidence.filter(e=>study.evidenceIds.includes(e.id)),
 waves:data.waves.filter(w=>study.waveIds.includes(w.id)),
 territories:(data.territories||[]).filter(t=>study.territoryIds.includes(t.id)),
}:data;
const changes=(d,first,last)=>[...new Set([first,last,
 ...[...d.evidence,...d.waves,...(d.territories||[])].flatMap(e=>[e.start,e.end,e.end+1]),
 ...d.evidence.flatMap(e=>(e.population||[]).flatMap(p=>[p.year,p.year+1])),
])].filter(y=>y>=first&&y<=last).sort((a,b)=>a-b);
const firstWorld=Math.min(...[...data.evidence,...data.waves].map(e=>e.start));
const settings=()=>page.getByRole('button',{name:'Map settings',exact:true});
const facts=()=>page.getByRole('button',{name:'Facts',exact:true});
async function openSettings(){
 if(await settings().getAttribute('aria-expanded')!=='true')await settings().click();
 assert.equal(await settings().getAttribute('aria-expanded'),'true');
}
async function showFacts(open=true){
 if(await facts().getAttribute('aria-expanded')!==String(open))await facts().click();
 assert.equal(await page.locator('.family-reader').isVisible(),open);
}
async function openPlayer(hash){
 await page.goto(fixture.url+hash);
 await page.locator('#family-map .family-land').waitFor();
 assert.equal(await page.locator('.atlas-coming-soon').count(),0,hash+' is playable');
}
async function endpoint(first,last,end=false){
 await page.locator('#family-slider').focus();
 await page.locator('#family-slider').press(end?'End':'Home');
 await page.waitForFunction(wanted=>document.querySelector('#family-year')?.textContent===wanted,yearLabel(end?last:first));
}
// Only user-facing timeline controls are used; no application state is injected.
async function seekChange(target,d,first,last){
 const dates=changes(d,first,last);assert.ok(dates.includes(target),'Evidence boundary '+target);
 await endpoint(first,last);
 for(const year of dates.filter(y=>y>first&&y<=target)){
  await page.getByRole('button',{name:'Next evidence change',exact:true}).click();
  await page.waitForFunction(wanted=>document.querySelector('#family-year')?.textContent===wanted,yearLabel(year));
 }
 assert.equal(await page.locator('#family-slider').getAttribute('aria-valuetext'),yearLabel(target));
}
async function inspectRecord(record){
 await showFacts();
 await page.locator('#family-evidence-list [data-world-item="'+record.id+'"]').click();
 assert.equal(await page.locator('#family-detail h2').textContent(),record.title);
 assert.equal(await page.locator('#family-detail .family-limits').textContent(),record.limits);
 const links=await page.locator('#family-detail .family-sources a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
 const expected=record.sourceIds.map(id=>data.sources.find(s=>s.id===id).url);
 assert.ok(links.length>0,record.id+' exposes sources');
 assert.ok(links.every(url=>expected.includes(url)),record.id+' sources belong to selected record');
 assert.ok((await page.locator('#family-detail .family-sources small').allTextContents()).every(text=>text.trim().length>0),'Access limits remain visible');
}
async function activeConnections(d,year){
 const expected=d.waves.filter(w=>w.start<=year&&year<=w.end).map(w=>w.id).sort();
 const actual=await page.locator('#family-map .family-wave').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-world-item')).sort());
 assert.deepEqual(actual,expected,'Only dated connections are active at '+year);
 for(const id of expected)assert.equal(await page.locator('#family-wave-list [data-world-item="'+id+'"]').count(),1);
}
async function checkBoundary(d,first,last){
 const wave=[...d.waves].sort((a,b)=>a.start-b.start).find(w=>w.start>first&&w.end<last);
 assert.ok(wave,'A connection has inspectable before/after boundaries');
 const dates=changes(d,first,last),before=dates.filter(y=>y<wave.start).at(-1);
 for(const year of [before,wave.start,wave.end,wave.end+1]){
  await seekChange(year,d,first,last);await activeConnections(d,year);
  assert.equal(await page.locator('#family-map .family-wave[data-world-item="'+wave.id+'"]').count(),year>=wave.start&&year<=wave.end?1:0);
 }
}
async function noHorizontalOverflow(label){
 const size=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
 assert.ok(size.document<=size.viewport+1,label+': '+JSON.stringify(size));
}
try{
 await page.goto(fixture.url);
 await page.locator('#world-globe .world-land').waitFor();
 await page.waitForLoadState('networkidle');
 assert.match(await page.locator('.world-intro h1').innerText(),/spread\s+of peoples/i);
 assert.deepEqual(await page.locator('.world-stats strong').allTextContents(),[summary.records,summary.references,summary.guides].map(n=>n.toLocaleString('en-US')));
 assert.equal(await page.locator('.world-atlas .world-region-card').count(),summary.regions.length);
 assert.ok(!fixture.requests.some(r=>new URL(r.url).pathname.startsWith('/api/')),'Bare root must not start the Americas API');
 assert.ok(!fixture.requests.some(r=>/\/(world|europe)-catalogue\.json$/.test(new URL(r.url).pathname)),'Hub loads summary rather than either full catalogue');
 assert.equal(await page.locator('.world-foundation-callout').count(),0,'World root must not promote whole-world movie callout');
 assert.equal(await page.locator('.world-studies').count(),0,'World root must not promote study cards');
 assert.ok((await page.locator('#world-globe .world-region-divider').count())>=1,'World globe renders region dividing lines');
 for(const region of summary.regions){
  const card=page.locator('.world-region-card[data-region="'+region.id+'"]');
  assert.equal(await card.getAttribute('href'),regionRoutes[region.id]);
  const cardText=await card.textContent();
  assert.ok(cardText.includes(region.earliestLabel));
  assert.ok(cardText.includes(region.references.toLocaleString('en-US')),region.id+' card shows reference count');
  assert.ok(cardText.includes(region.records.toLocaleString('en-US')),region.id+' card shows event/record count');
 }
 const sphere=await page.locator('#world-globe .world-ocean').getAttribute('d');
 await page.getByRole('button',{name:'Show all regions',exact:true}).click();
 assert.equal(await page.locator('#world-projection').getAttribute('aria-pressed'),'true');
 assert.notEqual(await page.locator('#world-globe .world-ocean').getAttribute('d'),sphere);
 assert.equal(await page.locator('#world-globe .world-map-region').count(),summary.regions.length);
 for(const region of summary.regions){
  const badgeText=await page.locator('#world-globe .world-map-region[data-region="'+region.id+'"]').textContent();
  assert.ok(badgeText.includes('refs')&&badgeText.includes('events'),region.id+' globe label shows stats');
 }
 assert.equal(await page.getByRole('button',{name:'Rotate west',exact:true}).isDisabled(),true);
 assert.equal(await page.getByRole('button',{name:'Rotate east',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'Show globe',exact:true}).click();
 assert.equal(await page.locator('#world-projection').getAttribute('aria-pressed'),'false');
 assert.equal(await page.getByRole('button',{name:'Rotate east',exact:true}).isEnabled(),true);

 assert.equal(await page.locator('.world-dives-note a[href="#dives"]').count(),1,'World page links to Deep Dives directory');
 await openPlayer('#origins');
 await page.locator('#family-map .family-land').waitFor();
 assert.equal(await page.locator('.family-heading h1').textContent(),'The branching human family');
 assert.equal(await page.locator('#family-year').textContent(),yearLabel(firstWorld));
 assert.match(await page.locator('#family-year').textContent(),/million years ago/);
 const earliest=[...data.evidence].sort((a,b)=>a.start-b.start)[0];
 await inspectRecord(earliest);
 await showFacts(false);assert.equal(await page.locator('#family-map').isVisible(),true);await showFacts();

 assert.equal(await settings().getAttribute('aria-expanded'),'false');
 assert.equal(await page.locator('#family-taxon').isVisible(),false);
 await openSettings();
 const referencedTaxa=data.taxa.filter(t=>[...data.evidence,...data.waves].some(item=>item.taxonIds.includes(t.id)));
 assert.equal(await page.locator('#family-taxon option').count(),referencedTaxa.length+1);
 const taxon=data.taxa.find(t=>t.id!=='homo-sapiens'&&data.evidence.some(e=>e.taxonIds.includes(t.id)));
 assert.ok(taxon);
 await page.getByRole('combobox',{name:'Lineage',exact:true}).selectOption(taxon.id);
 assert.equal(await settings().getAttribute('aria-expanded'),'false','Choosing a lineage closes settings');
 await endpoint(firstWorld,1900,true);
 const expectedTaxon=data.evidence.filter(e=>e.taxonIds.includes(taxon.id)&&e.start<=1900).map(e=>e.id).sort();
 assert.deepEqual(await page.locator('#family-map .family-point').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-world-item')).sort()),expectedTaxon);
 await openSettings();await page.getByRole('combobox',{name:'Lineage',exact:true}).selectOption('all');
 await openSettings();await page.getByRole('combobox',{name:'Jump to a chapter',exact:true}).selectOption(String(firstWorld));
 assert.equal(await page.locator('#family-year').textContent(),yearLabel(firstWorld));
 await openSettings();await page.keyboard.press('Escape');
 assert.equal(await settings().getAttribute('aria-expanded'),'false');
 assert.equal(await settings().evaluate(el=>el===document.activeElement),true,'Escape restores settings focus');
 await checkBoundary(data,firstWorld,1900);

 for(const region of ['africa','asia-pacific']){
  await openPlayer(regionRoutes[region]);
  const regionName=region==='africa'?'Africa':'Asia & Pacific';
  const toggle=page.getByRole('button',{name:'Region: '+regionName,exact:true});
  await toggle.click();
  for(const [id,href] of Object.entries(regionRoutes)){
   const label={americas:'Americas',africa:'Africa',europe:'Europe','asia-pacific':'Asia & Pacific'}[id];
   assert.equal(await page.locator('.map-navigation').getByRole('link',{name:label,exact:true}).getAttribute('href'),href);
  }
  await page.keyboard.press('Escape');
 }

 const earlyEnd=-14999;
 const earlyEvidence=data.evidence.filter(e=>e.regionIds.includes('africa')&&e.start<=earlyEnd);
 const earlyWaves=data.waves.filter(w=>w.regionIds.includes('africa')&&w.start<=earlyEnd);
 const earlyFirst=Math.min(...[...earlyEvidence,...earlyWaves].map(item=>item.start));
 await openPlayer('#atlas/africa/early');
 assert.equal(await page.locator('.family-heading h1').textContent(),'Africa: earliest evidence to 15,000 BCE');
 await endpoint(earlyFirst,earlyEnd,true);
 assert.equal(await page.locator('.family-time-ends span').last().textContent(),'15,000 BCE');
 assert.deepEqual(await page.locator('#family-map .family-point').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-world-item')).sort()),earlyEvidence.map(e=>e.id).sort());
 await endpoint(earlyFirst,earlyEnd);
 await showFacts();await page.locator('#family-search').fill('Kalambo');
 const kalambo=earlyEvidence.filter(e=>(e.title+' '+e.summary).toLowerCase().includes('kalambo')).sort((a,b)=>a.start-b.start);
 assert.ok(kalambo.length,'Early Africa includes Kalambo evidence');
 assert.deepEqual(await page.locator('#family-evidence-list [data-world-item]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-world-item')).sort()),kalambo.map(e=>e.id).sort(),'Search finds evidence beyond the current year');
 const future=kalambo[0];assert.ok(future.start>earlyFirst);
 assert.equal(await page.locator('#family-map .family-point[data-world-item="'+future.id+'"]').count(),0,'A future search result is not yet a dated map point');
 assert.match(await page.locator('#family-evidence-list [data-world-item="'+future.id+'"] span').textContent(),/jump to evidence/);
 await inspectRecord(future);
 assert.equal(await page.locator('#family-year').textContent(),yearLabel(future.start),'Choosing a future result moves the clock to its evidence date');
 await page.locator('.family-heading a[href="#world"]').click();await page.locator('#world-globe .world-land').waitFor();
 await page.goBack();await page.locator('#family-map .family-land').waitFor();
 assert.equal(new URL(page.url()).hash,'#atlas/africa/early');
 assert.equal(await page.locator('#family-search').inputValue(),'Kalambo','Search survives a route round trip');
 assert.equal(await page.locator('#family-year').textContent(),yearLabel(future.start));
 assert.equal(await page.locator('#family-detail h2').textContent(),future.title);

 for(const study of studies){
  await openPlayer('#study/'+study.id);
  const d=playerData(study),firstRecord=[...d.evidence].sort((a,b)=>a.start-b.start)[0];
  assert.equal(await page.locator('.family-heading h1').textContent(),study.title);
  const guide=page.getByRole('link',{name:'Read the full deep dive',exact:true});
  assert.equal(await guide.getAttribute('href'),'sites/'+study.guideId+'.html');
  assert.equal(await page.locator('#family-taxon').count(),0,'Study does not expose irrelevant lineage filtering');
  await seekChange(Math.max(firstRecord.start,study.start),d,study.start,study.end);
  await inspectRecord(firstRecord);
  await checkBoundary(d,study.start,study.end);
  await endpoint(study.start,study.end,true);
  assert.equal(await page.locator('#family-map .family-point').count(),d.evidence.filter(e=>e.start<=study.end).length);
  const previous=await page.locator('#family-year').textContent();
  await page.getByRole('button',{name:'Previous evidence change',exact:true}).click();
  assert.notEqual(await page.locator('#family-year').textContent(),previous);
  await page.getByRole('button',{name:'Next evidence change',exact:true}).click();
  assert.equal(await page.locator('#family-year').textContent(),previous);
  await page.locator('#family-play').click();
  await page.waitForFunction(()=>document.querySelector('#family-play')?.textContent==='Pause');
  await page.waitForFunction(wanted=>document.querySelector('#family-year')?.textContent!==wanted,yearLabel(study.start));
  await page.locator('#family-play').click();
  assert.equal(await page.locator('#family-play').textContent(),'Play');
  await guide.click();await page.locator('h1').waitFor();
  const entry=guideIndex.guides.find(g=>g.id===study.guideId);assert.ok(entry);
  assert.equal(await page.locator('h1').textContent(),entry.title);
  assert.ok(await page.locator('.world-findings li').count(),study.id+' guide retains mapped findings');
 }

 assert.ok(!fixture.requests.some(r=>new URL(r.url).pathname.startsWith('/api/')),'World studies remain independent of the Americas API');
 await page.goto(fixture.url+'#world');await page.locator('#world-globe').waitFor();
 await page.locator('.world-region-card[data-region="americas"]').click();
 await page.locator('#map-host .world').waitFor();
 assert.equal(new URL(page.url()).hash,'#movie');
 assert.equal(await page.locator('.family-page').count(),0);
 assert.equal(await page.locator('#story-select').count(),1,'Legacy Americas movie remains available');
 const pause=page.getByRole('button',{name:'Pause',exact:true});if(await pause.isVisible())await pause.click();
 assert.ok(fixture.requests.some(r=>new URL(r.url).pathname==='/api/manifest'),'Americas API starts on explicit navigation');

 await page.goto(fixture.url+'#world');await page.locator('#world-globe').waitFor();
 await page.locator('.world-dives-note a[href="#dives"]').click();
 await page.locator('.dive-category[href="#dives/subjects"]').click();
 await page.locator('.dive-grid').first().waitFor();
 assert.equal(await page.locator('.dive-grid a[href="#origins"]').count(),1,'Human-family movie is filed inside Deep Dives');
 for(const study of studies)assert.equal(await page.locator('.dive-grid a[href="#study/'+study.id+'"]').count(),1,study.id+' is filed inside Deep Dives');
 await page.locator('.dive-grid a[href="#origins"]').first().click();
 await page.locator('#family-map .family-land').waitFor();
 assert.equal(await page.locator('.family-heading h1').textContent(),'The branching human family');

 await page.goto(fixture.url+'#atlas/africa');
 await page.locator('#family-map .family-land').waitFor();
 await page.locator('#family-play').click();
 await page.waitForFunction(()=>document.querySelector('.family-page')?.classList.contains('is-playing'));
 assert.equal(await page.locator('#family-happening-now').isVisible(),true,'Live happening-now panel visible during playback');
 assert.equal(await page.locator('#family-map-banner').isVisible(),true,'Live map banner visible during playback');
 await page.locator('#family-play').click();

 await page.setViewportSize({width:390,height:844});
 for(const hash of ['#world','#origins','#atlas/africa/early',...studies.map(s=>'#study/'+s.id)]){
  await page.goto(fixture.url+hash);
  await page.locator(hash==='#world'?'#world-globe .world-land':'#family-map .family-land').waitFor();
  await noHorizontalOverflow(hash+' at 390px');
  const navBoxes=await page.locator('.world-top nav a').evaluateAll(els=>els.map(el=>({text:el.textContent,rect:el.getBoundingClientRect()})));
  for(const item of navBoxes){
   assert.ok(item.rect.left>=0&&item.rect.right<=391,'Nav link fits 390px width: '+item.text);
  }
  if(hash!=='#world'){
   await openSettings();await noHorizontalOverflow(hash+' settings');await page.keyboard.press('Escape');
   await showFacts(false);await noHorizontalOverflow(hash+' map');await showFacts();
   assert.equal(await page.locator('#family-play').isVisible(),true);
  }
 }
 fixture.assertPrivacy();
 console.log('PASS world summary-only root, globe projection, region menus, lineage/source inspection, dated connection boundaries, early Africa endpoint and retained future-evidence search, four playable studies and guides, Americas round trip, and 390px layouts.');
}finally{await fixture.close();}
