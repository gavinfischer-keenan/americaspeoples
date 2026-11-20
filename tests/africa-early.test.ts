import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {mergeWorldShards} from '../scripts/world-build';
import {readWorldGuides} from '../scripts/world-guide-data';
import {AFRICA_EARLY_END,africaEarlyData,inWorldScope} from '../src/world-model';

async function loadWorldShards(){
 const dir=new URL('../data/world/',import.meta.url);
 const files=(await readdir(dir)).filter(f=>f.endsWith('.json'));
 const shards=await Promise.all(files.map(async f=>({name:f,data:JSON.parse(await readFile(new URL(f,dir),'utf8'))})));
 return {shards,data:mergeWorldShards(shards.map(s=>s.data))};
}

test('Africa inventory remains cited, pre-cutoff and distinct from invented populations',async()=>{
 const {shards,data}=await loadWorldShards();
 const additions=shards.filter(s=>s.name.startsWith('africa-')).flatMap(s=>s.data.evidence);
 assert.ok(additions.length>=100,'A continental inventory, not a handful of examples');
 for(const e of additions){
  assert.deepEqual(e.regionIds,['africa'],e.id);
  assert.ok(e.start<=e.end && e.end<=AFRICA_EARLY_END,e.id+' calendar cutoff');
  assert.ok(e.sourceIds.length>0 && e.dateBasis && e.limits,e.id+' provenance');
  assert.ok(!e.population?.length,e.id+' no unsupported census');
 }
 const selected=africaEarlyData(data);
 assert.ok(selected.evidence.length>=additions.length);
 assert.ok(selected.evidence.every(e=>e.regionIds.includes('africa')&&e.start<=AFRICA_EARLY_END));
 assert.ok(selected.evidence.some(e=>e.title.includes('Taung')));
 assert.ok(selected.evidence.some(e=>e.title.includes('Kalambo')));
 assert.ok(selected.evidence.some(e=>e.title.includes('Aïn Boucherit')));
 assert.ok(selected.evidence.some(e=>e.title.includes('Lomekwi')));
});

test('Holocene Africa fills 15,000 BCE through 1900 CE across all regions and nine deep dives',async()=>{
 const {data}=await loadWorldShards();
 const africaHolocene=data.evidence.filter(e=>inWorldScope(e,'africa')&&e.end>AFRICA_EARLY_END);
 assert.ok(africaHolocene.length>=150,'Continental Holocene-to-1900 coverage added across all shards');
 const tenKTo1K=africaHolocene.filter(e=>e.end>=-9999&&e.start<=1000);
 assert.ok(tenKTo1K.length>=130,'Dense 10,000 BCE to 1000 CE Africa coverage added across all macro-regions');
 for(const e of africaHolocene){
  assert.ok(e.start<=e.end && e.end<=1900,e.id+' 1900 CE cap');
  assert.ok(e.sourceIds.length>0 && e.dateBasis && e.limits,e.id+' provenance');
  assert.ok(e.taxonIds.includes('homo-sapiens'),e.id+' Holocene Homo sapiens taxon');
 }
 for(const needle of ['Takarkori','Gobero','Tassili','Garama','Kerma','Meroë','Jenné-jeno','Gajiganna','Great Zimbabwe','Aksum','Matara','Kilwa','Kongo','Madagascar','Mecca','Medina','Haua Fteah','Carthage','Dufuna','Upemba','Harlaa','Lothagam','Chibuene','Uluburun','Alexandria']){
  assert.ok(africaHolocene.some(e=>e.title.includes(needle)),`Missing key Africa/Mediterranean/Red Sea site: ${needle}`);
 }
 const europeMed=data.evidence.filter(e=>e.id.startsWith('med-')&&inWorldScope(e,'europe'));
 const asiaMed=data.evidence.filter(e=>e.id.startsWith('med-')&&inWorldScope(e,'asia-pacific'));
 assert.ok(europeMed.length>=25,'Mediterranean trade feeds European sites and harbors');
 assert.ok(asiaMed.length>=12,'Mediterranean trade feeds Levant/Anatolia/Near Eastern sites');
 assert.ok(africaHolocene.some(e=>e.start>=-15000&&e.start<=-9999),'Terminal Pleistocene/Early Holocene anchors present');
 assert.ok(africaHolocene.some(e=>e.start>=500&&e.end<=1500),'Medieval African cities and kingdoms covered');
 assert.ok(africaHolocene.some(e=>e.end>=1700&&e.end<=1900),'Early modern through 1900 covered');
 const sourceUrls=new Set(data.sources.filter(s=>africaHolocene.some(e=>e.sourceIds.includes(s.id))).map(s=>s.url));
 for(const host of ['doi.org','whc.unesco.org','metmuseum.org','zamaniproject.org','intchron.org','pleiades.stoa.org']){
  assert.ok([...sourceUrls].some(u=>u.includes(host)),`Expected trusted source variety including ${host}`);
 }
 const guides=await readWorldGuides();
 for(const [id,cat] of [['world-jenne-jeno','places'],['world-great-zimbabwe','places'],['world-aksum','places'],['world-kilwa-kisiwani','places'],['world-kerma-meroe','places'],['world-mecca','places'],['world-muslim-faith','subjects'],['world-christian-traditions','subjects'],['world-mediterranean-trade','subjects']] as const){
  const g=guides.find(x=>x.id===id);
  assert.ok(g,`Missing Africa/faith/Med guide ${id}`);
  assert.equal(g.category,cat);
  assert.ok(g.atlasIds.includes('africa'));
 }
 const medGuide=guides.find(x=>x.id==='world-mediterranean-trade')!;
 assert.ok(medGuide.atlasIds.includes('europe')&&medGuide.atlasIds.includes('asia-pacific'),'Mediterranean trade guide appears in Africa, Europe, and Asia-Pacific atlases');
 const muslimGuide=guides.find(x=>x.id==='world-muslim-faith')!;
 const muslimText=muslimGuide.sections.map(s=>s.heading+' '+s.paragraphs.map(p=>p.text).join(' ')+' '+(s.rows||[]).map(r=>r.cells.join(' ')).join(' ')).join(' ');
 for(const branch of ['Sunni','Shīʿī','Ibāḍī','Mālikī','Shāfiʿī','Ḥanafī','Ḥanbalī','Sufi']) assert.ok(muslimText.includes(branch),`Muslim faith guide covers ${branch}`);
 const chrGuide=guides.find(x=>x.id==='world-christian-traditions')!;
 const chrText=chrGuide.sections.map(s=>s.heading+' '+s.paragraphs.map(p=>p.text).join(' ')+' '+(s.rows||[]).map(r=>r.cells.join(' ')).join(' ')).join(' ');
 for(const branch of ['Church of the East','Oriental Orthodox','Eastern Orthodox','Roman Catholic','Protestant','Coptic','Tewahedo']) assert.ok(chrText.includes(branch),`Christian traditions guide covers ${branch}`);
});
