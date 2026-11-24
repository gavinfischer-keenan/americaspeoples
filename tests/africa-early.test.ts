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
 assert.ok(africaHolocene.length>=200,'Continental Holocene-to-1900 coverage added across all shards');
 const tenKTo1K=africaHolocene.filter(e=>e.end>=-9999&&e.start<=1000);
 assert.ok(tenKTo1K.length>=130,'Dense 10,000 BCE to 1000 CE Africa coverage added across all macro-regions');
 const oneKTo1900=africaHolocene.filter(e=>e.end>=1000&&e.end<=1900);
 assert.ok(oneKTo1900.length>=100,'Dense 1000 CE to 1900 CE Africa coverage from South Africa north to the Maghreb');
 for(const e of africaHolocene){
  assert.ok(e.start<=e.end && e.end<=1900,e.id+' 1900 CE cap');
  assert.ok(e.sourceIds.length>0 && e.dateBasis && e.limits,e.id+' provenance');
  assert.ok(e.taxonIds.includes('homo-sapiens'),e.id+' Holocene Homo sapiens taxon');
 }
 for(const needle of [
  'Takarkori','Gobero','Tassili','Garama','Kerma','Meroë','Jenné-jeno','Gajiganna','Great Zimbabwe','Aksum','Matara','Kilwa','Kongo','Madagascar','Mecca','Medina',
  'Molokwane','uMgungundlovu','Table Bay','Danamombe','Nyanga','Ingombe Ilede','Ilha de Moçambique','Vohemar','Le Morne','Fort Jesus','Zanzibar','Thimlich Ohinga','Munsa','Harar Jugol','Tiya',
  'Katanga Copperbelt','Kuba Kingdom','Middle Cuanza','Foumban','Sungbo’s Eredo','Banda Hills','Savi & Ouidah','Koutammakou','Timbuktu','Tomb of Askia','Sorotomo','Loropéni','Birni Gazargamo','Sukur',
  'Chinguetti','Agadez','Ghadamès','Touat','Soba East','Sennar','Qasr Ibrim','Darfur','Suakin','Marrakesh','Rabat','Ait-Ben-Haddou','Tlemcen','Tunis'
 ]){
  assert.ok(africaHolocene.some(e=>e.title.includes(needle)),`Missing key Africa/Mediterranean/Red Sea site: ${needle}`);
 }
 const europeMed=data.evidence.filter(e=>e.id.startsWith('med-')&&inWorldScope(e,'europe'));
 const africaMed=data.evidence.filter(e=>e.id.startsWith('med-')&&inWorldScope(e,'africa'));
 assert.ok(europeMed.length>=25,'Mediterranean trade feeds European sites and harbors');
 assert.ok(africaMed.length>=12,'Mediterranean trade feeds North African & Levantine/Near Eastern sites');
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

test('Asia-Pacific and Europe cover earliest hominins through 10,000 BCE with consensus and institutional citations',async()=>{
 const {data}=await loadWorldShards();
 const asiaPre10k=data.evidence.filter(e=>inWorldScope(e,'asia-pacific')&&e.start<=-10000&&e.end<=-10000);
 assert.ok(asiaPre10k.length>=50,'Asia pre-10,000 BCE coverage includes Siberia, Central, South, East and SE Asia');
 for(const needle of ['Teshik-Tash','Denisova','Mal’ta','Attirampakkam','Isampur','Hathnora','Bhimbetka','Jwalapuram','Kitulgala','Shangchen','Yunxian','Zhoukoudian','Hualongdong','Nwya Devu','Xianrendong','Jeongok-ri','Sangiran','Kalinga','Niah Great Cave','Leang Karampuang','Laili']){
  assert.ok(asiaPre10k.some(e=>e.title.includes(needle)),`Missing Asia Pleistocene site: ${needle}`);
 }
 const africaPre10k=data.evidence.filter(e=>inWorldScope(e,'africa')&&e.start<=-10000&&e.end<=-10000);
 assert.ok(africaPre10k.length>=180,'Africa & Middle East pre-10,000 BCE coverage includes Africa, Levant, Arabia and Iran');
 for(const needle of ['ʿUbeidiya','Gesher Benot Yaʿaqov','Qesem','Tabun','Ohalo II','Shubayqa','Khall Amayshan','Jebel Faya','Qaleh Kurd','Shanidar']){
  assert.ok(africaPre10k.some(e=>e.title.includes(needle)),`Missing Middle East Pleistocene site in Africa & Middle East: ${needle}`);
 }
 const pacificPre10k=data.evidence.filter(e=>inWorldScope(e,'pacific')&&e.start<=-10000&&e.end<=-10000);
 assert.ok(pacificPre10k.length>=10,'Australia & Pacific pre-10,000 BCE world coverage includes Sahul/Australia/PNG');
 for(const needle of ['Kosipe','Nawarla Gabarnmang','Warratyi','Lake Mungo','Buang Merabak','Kutikina']){
  assert.ok(pacificPre10k.some(e=>e.title.includes(needle)),`Missing Sahul Pleistocene site in Australia & Pacific: ${needle}`);
 }
 const asiaUrls=new Set(data.sources.filter(s=>asiaPre10k.some(e=>e.sourceIds.includes(s.id))).map(s=>s.url));
 for(const host of ['doi.org','whc.unesco.org','humanorigins.si.edu']){
  assert.ok([...asiaUrls].some(u=>u.includes(host)),`Asia pre-10k includes ${host}`);
 }
 const eurPre10k=data.evidence.filter(e=>inWorldScope(e,'europe')&&e.start<=-10000&&e.end<=-10000);
 assert.ok(eurPre10k.length>=40,'Europe pre-10,000 BCE coverage spans Lower, Middle and Upper Paleolithic');
 for(const needle of ['Barranco León','Sima del Elefante','Pirro Nord','Happisburgh','Caune de l’Arago','Boxgrove','Gruta da Aroeira','Schöningen','Apidima','Bruniquel','Krapina','Gorham’s','La Ferrassie','El Sidrón','Vindija','Spy','Grotte Mandrin','Ranis','Fumane','Kostenki','Swabian Jura','Chauvet','Dolní Věstonice','Willendorf','Sunghir','Arene Candide','Altamira','Côa Valley','Lascaux','Mezhyrich','Gönnersdorf','Villabruna','Bichon']){
  assert.ok(eurPre10k.some(e=>e.title.includes(needle)),`Missing Europe Pleistocene site: ${needle}`);
 }
 const eurUrls=new Set(data.sources.filter(s=>eurPre10k.some(e=>e.sourceIds.includes(s.id))).map(s=>s.url));
 for(const host of ['doi.org','whc.unesco.org','humanorigins.si.edu','archeologie.culture.gouv.fr']){
  assert.ok([...eurUrls].some(u=>u.includes(host)),`Europe pre-10k includes ${host}`);
 }
});

test('Europe and Asia-Pacific extend systematically to 1900 CE with zero sparse gaps and 21 flagship Deep Dives',async()=>{
 const {data}=await loadWorldShards();
 const eurHolocene=data.evidence.filter(e=>e.id.startsWith('euho-')&&inWorldScope(e,'europe'));
 const eurAnatoliaAsho=data.evidence.filter(e=>e.id.startsWith('asho-')&&inWorldScope(e,'europe'));
 const asiaHolocene=data.evidence.filter(e=>e.id.startsWith('asho-')&&inWorldScope(e,'asia-pacific'));
 const africaMiddleEastAsho=data.evidence.filter(e=>e.id.startsWith('asho-')&&inWorldScope(e,'africa'));
 const pacificAsho=data.evidence.filter(e=>e.id.startsWith('asho-')&&inWorldScope(e,'pacific'));
 assert.equal(eurHolocene.length,37,'Holocene Europe covers 37 regional sites from Mesolithic Star Carr to 1900 CE');
 assert.equal(asiaHolocene.length,32,'Holocene Asia covers 32 Asian regional sites to 1900 CE');
 assert.ok(eurHolocene.some(e=>e.end===1900),'Europe extends cleanly to 1900 CE');
 assert.ok(asiaHolocene.some(e=>e.end===1900),'Asia extends cleanly to 1900 CE');
 for(const needle of ['Star Carr','Lepenski Vir','Linearbandkeramik','Malta','Carnac','Pile Dwellings','Trypillia','Brú na Bóinne','Knossos','Mycenae','Nebra','Heuneburg','Athens','Ostia','Ravenna','Córdoba','Novgorod','Amsterdam','Ironbridge']){
  assert.ok(eurHolocene.some(e=>e.title.includes(needle)),`Missing Holocene Europe site: ${needle}`);
 }
 for(const needle of ['Çatalhöyük','Hattusha']){
  assert.ok(eurAnatoliaAsho.some(e=>e.title.includes(needle)),`Missing Anatolian site in Europe & Mediterranean: ${needle}`);
 }
 for(const needle of ['Mehrgarh','Mohenjo-daro','Dholavira','Taxila','Ajanta','Chola','Hampi','Fatehpur Sikri','Shangshan','Liangzhu','Yinxu','Jingdezhen','Forbidden City','Sannai Maruyama','Kofun','Botai','Samarkand','Óc Eo','Srivijaya','Borobudur','Bagan']){
  assert.ok(asiaHolocene.some(e=>e.title.includes(needle)),`Missing Holocene Asia site: ${needle}`);
 }
 for(const needle of ['Göbekli Tepe','Uruk','Babylon','Pasargadae','Petra','Palmyra']){
  assert.ok(africaMiddleEastAsho.some(e=>e.title.includes(needle)),`Missing Middle East Holocene site in Africa & Middle East: ${needle}`);
 }
 for(const needle of ['Kuk Swamp','Teouma','Nan Madol']){
  assert.ok(pacificAsho.some(e=>e.title.includes(needle)),`Missing Pacific/PNG Holocene site in Australia & Pacific: ${needle}`);
 }

 const africaAll=data.evidence.filter(e=>inWorldScope(e,'africa'));
 assert.ok(africaAll.length>=752,'Africa & Middle East reaches at least 752 evidence records including Central Africa, early modern and thin-spot expansions');
 assert.ok(africaAll.filter(e=>e.end>-15000).length>=320,'Africa post-15,000 BCE coverage reaches at least 320 records');
 for(const needle of ['Wadi Kubbaniya','Afalou','Al-Khiday','Tadrart Acacus','Memphis','Thebes','Abu Simbel','Timgad','Kondoa','Twyfelfontein','Gazargamu','El Fasher','Qurta','Dabous Giraffes','Camel Site','Chongoni','Game Pass','Ain Mallaha','Ain Ghazal','Ebla','Mari','Dhar Oualata','Taruga','Qalʿat al-Bahrain','Ishango','Matupi','Ngovo','Oboui','Tchissanga','Nkang','Corisco','Lokabulo','Dungo']){
  assert.ok(africaAll.some(e=>e.title.includes(needle)),`Missing Africa/Middle East site: ${needle}`);
 }
 for(const hab of data.evidence.filter(e=>e.id.startsWith('amea-hab-'))){
  assert.ok(hab.end<=-100,`Early habitation ${hab.id} ends at or before 100 BCE (${hab.end})`);
 }

 const wins=[
  [-15000,-12001],[-12000,-10001],[-10000,-8501],[-8500,-7001],[-7000,-6001],[-6000,-5001],
  [-5000,-4001],[-4000,-3301],[-3300,-2601],[-2600,-2001],[-2000,-1601],[-1600,-1201],
  [-1200,-801],[-800,-501],[-500,-201],[-200,0],[1,250],[251,500],[501,700],[701,900],
  [901,1100],[1101,1300],[1301,1520],[1521,1650],[1651,1780],[1781,1900]
 ];
 for(const [region,minAllowed] of [['africa',7],['europe',4],['asia-pacific',3]] as const){
  const regEv=data.evidence.filter(e=>inWorldScope(e,region));
  for(const [a,b] of wins){
   const c=regEv.filter(e=>e.start<=b&&e.end>=a).length;
   assert.ok(c>=minAllowed,`Region ${region} window ${a}..${b} count ${c} >= ${minAllowed}`);
  }
 }

 const guides=await readWorldGuides();
 const newGuideIds=[
  'world-pyramids-memphis-thebes','world-timbuktu-gao-mali','world-lalibela-harar-ethiopia',
  'world-carthage-leptis-north-africa','world-gobekli-catalhoyuk-anatolia','world-uruk-babylon-nineveh',
  'world-mohenjo-daro-harappa-indus','world-persepolis-pasargadae-iran','world-petra-palmyra-levant',
  'world-knossos-mycenae-athens','world-pompeii-rome-ostia','world-borobudur-bagan-se-asia',
  'world-arabia-incense-oases-empires','world-india-empires-cities-networks'
 ];
 for(const id of newGuideIds){
  const g=guides.find(x=>x.id===id);
  assert.ok(g,`Missing UNESCO flagship Deep Dive ${id}`);
  assert.equal(g.category,'places');
  assert.ok(g.sources.some(s=>s.url.includes('doi.org')),`Guide ${id} includes peer-reviewed DOI sources`);
  assert.ok(g.sources.some(s=>s.url.includes('whc.unesco.org')),`Guide ${id} includes official UNESCO WHC dossier`);
 }
 const originGuides=guides.filter(x=>x.category==='origin-stories');
 assert.equal(originGuides.length,7,'Master Origin Stories section contains 7 regional & global guides');
 for(const id of ['world-origin-stories-australia','world-origin-stories-compendium','world-origin-stories-americas','world-origin-stories-south-america','world-origin-stories-africa','world-origin-stories-near-east-europe','world-origin-stories-asia-pacific']){
  assert.ok(originGuides.some(x=>x.id===id),`Missing origin-stories guide: ${id}`);
 }
 for(const id of ['world-ibn-fadlan','world-chinese-explorers','world-ancient-shipwrecks','world-superlative-shipwrecks','world-endurance-and-vasa','world-shipwreck-graveyards','world-history-of-blue-and-dyes','world-chinese-ceramics','world-chinese-gunpowder-explosives']){
  assert.ok(guides.some(x=>x.id===id&&x.category==='subjects'),`Missing subject guide: ${id}`);
 }
 const sentinelGuide=guides.find(x=>x.id==='world-north-sentinel-island'&&x.category==='cultures');
 assert.ok(sentinelGuide,'Missing world-north-sentinel-island Deep Dive');
 assert.ok(sentinelGuide.sources.some(s=>s.url.includes('doi.org')),'North Sentinel guide includes peer-reviewed DOIs');
 const medGuide=guides.find(x=>x.id==='world-mediterranean-trade')!;
 assert.ok(medGuide.relatedGuideIds?.includes('world-ancient-shipwrecks'),'Mediterranean trade links ancient shipwrecks guide');
 assert.ok(medGuide.sections.some(s=>s.heading.includes('Shipwrecks of Antiquity')),'Mediterranean trade expands Shipwrecks of Antiquity');
 const romGuide=guides.find(x=>x.id==='world-roman-empire')!;
 assert.ok(romGuide.sections.some(s=>s.heading.includes('Roman Censuses'))&&romGuide.sections.some(s=>s.heading.includes('Imperial Road Network')),'Roman Empire guide covers censuses and road network');
 const shipStudy=data.studies?.find(s=>s.id==='ancient-shipwrecks');
 assert.ok(shipStudy&&shipStudy.evidenceIds.length>=50,'Playable ancient-shipwrecks study includes >= 50 dated shipwrecks including Vasa & graveyards');
 assert.ok(data.evidence.some(e=>e.id==='wreck-vasa-1628'&&e.guideId==='world-endurance-and-vasa'),'Raised Vasa 1628 anchored in world-catalogue');
 const romStudy=data.studies?.find(s=>s.id==='roman-empire');
 assert.ok(romStudy&&romStudy.evidenceIds.length>=35&&romStudy.waveIds.length>=12&&romStudy.territoryIds.length>=5,'Playable roman-empire study covers 753 BCE-1453 CE with roads, walls & territories');
 assert.ok(data.evidence.some(e=>e.id==='rom-augustus-res-gestae-census'&&e.population?.length===4),'Roman citizen census milestones attached to study');
 assert.ok(data.evidence.some(e=>e.id==='ind-north-sentinel-andaman'&&e.guideId==='world-north-sentinel-island'),'North Sentinel evidence anchor linked to Deep Dive');
 const pre30k=data.evidence.filter(e=>e.start<=-29999);
 assert.ok(pre30k.length>=290,`Global pre-30,000 BCE coverage reaches ${pre30k.length} >= 290 sites`);
 for(const needle of ['Korolevo','Penghu 1','Nesher Ramla','Swartkrans','Boodie Cave','Carpenter','Figueira Brava','Tolbor-16','Wolo Sege']){
  assert.ok(pre30k.some(e=>e.title.includes(needle)),`Missing key pre-30,000 BCE site: ${needle}`);
 }
 assert.equal(guides.length,110,'All 110 world guides validate cleanly');
 for(const g of guides){
  assert.ok(g.sections.length>=3,`Guide ${g.id} has at least 3 sections`);
  assert.ok(g.relatedGuideIds&&g.relatedGuideIds.length>=1,`Guide ${g.id} includes Continue exploring cross-links`);
 }
 const ausStudy=data.studies?.find(s=>s.id==='australopithecus');
 assert.ok(ausStudy&&ausStudy.evidenceIds.length>=39,'Australopithecus study maps >= 39 fossil horizons');
 const pre1maStudy=data.studies?.find(s=>s.id==='pre-1ma-world');
 assert.ok(pre1maStudy&&pre1maStudy.evidenceIds.length>=164,'Pre-1 Ma study maps >= 164 global localities');
 const neaStudy=data.studies?.find(s=>s.id==='neanderthals');
 assert.ok(neaStudy&&neaStudy.evidenceIds.length>=121,'Neanderthal study maps >= 121 Eurasian localities');
 for(const gid of ['world-australopithecus-fossils','world-pre-1ma-world','world-neanderthal-fossils']){
  const g=guides.find(x=>x.id===gid);
  assert.ok(g,`Missing fossil deep dive ${gid}`);
  assert.ok(g.sources.some(s=>s.url.includes('doi.org')),`Fossil guide ${gid} cites peer-reviewed DOIs`);
 }
 const paleo=JSON.parse(await readFile('data/paleoclimate-series.json','utf8'));
 assert.equal(paleo.maxYear,1900,'Paleoclimate series capped cleanly at 1900 CE');
 for(const key of ['miller2020','lr04','epicaTemp','sprattSeaLevel','bereiterCo2','epicaCh4','ngripD18o','temp12k','pages2k']){
  assert.ok(Array.isArray(paleo[key])&&paleo[key].length>=100,`Paleoclimate ${key} populated`);
  assert.ok(paleo[key].every((pt:{year:number})=>pt.year<=1900),`Paleoclimate ${key} stays <= 1900 CE`);
 }
 const globalIce=JSON.parse(await readFile('data/global-ice-sheets.json','utf8'));
 assert.ok(Array.isArray(globalIce.slices)&&globalIce.slices.length>=30,'Continuous Quaternary to 1900 CE ice-sheet archive populated');
});
