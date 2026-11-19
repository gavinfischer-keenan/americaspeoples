import {writeFileSync} from 'node:fs';
import {dataset} from '../src/published-data';
import trade from '../data/trade-network-expansion-records.json';
import type {StoryScene} from '../src/stories';

// Viewing dates inside source windows; these do not add historical estimates.
const groups:[string[],number,string,[number,number],number][]=[
 [['am-alca-jaguay'],-10000,'Highland stone reaches a coastal fishing community',[-73,-15],7],
 [['na-coso-san-miguel'],-4400,'The California islands connect with the interior',[-119,35],7],
 [['am-chivay-jiskairumoko'],-2300,'Lake Titicaca communities draw on distant toolstone',[-70,-16],7],
 [['am-pacific-shell-palanda'],-2400,'Pacific shell reaches the upper Amazon',[-79,-4],7],
 [['ae-kish'],-2300,'Carnelian connects South Asia and Mesopotamia',[62,27],3],
 [['am-long-island-plum-piece'],-1700,'Stone crosses the northeastern Caribbean',[-62.3,17.4],12],
 [['am-el-chayal-san-lorenzo','am-guadalupe-san-lorenzo'],-1500,'San Lorenzo receives toolstone from different directions',[-94,17],5],
 [['na-appalachian-soapstone-poverty-point'],-1400,'Stone bowls move through the eastern woodlands',[-87,34],4],
 [['ae-uluburun'],-1320,'A ship carries a cargo of copper',[31,35],6],
 [['am-ixtepeque-copan-rayo'],-1100,'An early Copán household obtains obsidian',[-89.5,14.7],9],
 [['pa-kutau-teouma','pa-vanua-teouma','pa-gaua-teouma'],-900,'Teouma participates in several island connections',[158,-11],2],
 [['pa-kutau-bukit'],-700,'New Britain obsidian reaches northern Borneo',[131,0],2],
 [['pa-western-torres-ormi'],-650,'Pottery moves through Torres Strait',[143,-10],9],
 [['pa-fengtian-anaro','pa-fengtian-savidug'],-450,'Taiwan jade in the northern Philippines',[121,23],7],
 [['ae-berenike'],1,'Pepper crosses the Indian Ocean',[58,18],2],
 [['ae-palmyra'],100,'Silk reaches a Palmyra tomb',[77,36],1.5],
 [['na-southern-shell-santa-rita'],400,'Coastal shell reaches the inland East Bay',[-120,35.7],6],
 [['na-casa-diablo-san-miguel'],650,'California islanders obtain eastern Sierra obsidian',[-119,35],6],
 [['na-altamaha-st-johns-pottery'],650,'Georgia vessels enter Florida ceremonial contexts',[-81.5,30],8],
 [['am-stmartin-golden-rock'],650,'Caribbean communities exchange stone for axes',[-63,17.7],12],
 [['pa-nepean-macdonald'],500,'Stone moves within southeastern Australia',[151,-33],9],
 [['ae-komani','ae-gao'],900,'Glass connects African and European workshops to eastern production',[20,25],1.5],
 [['ae-mantai'],1000,'Cloves reach a Sri Lankan port',[106,2],2],
 [['na-pacific-abalone-chaco','na-gulf-shell-chaco'],1000,'Chaco receives shell from Pacific and Gulf waters',[-112,31],4],
 [['am-xicalanco-royal-merchants'],1490,'Merchants bring tropical goods to imperial Mexico',[-96,18],6],
 [['am-rumiqolqa-saraguro-stone'],1510,'Inka stone moves north from the Cusco region',[-75,-8],4],
 [['am-cochabamba-paria-maize','am-paria-cusco-maize'],1515,'State maize moves through Andean storage and transport',[-70,-16],5],
 [['am-soconusco-cacao-tribute','am-tochtepec-rubber-tribute','am-tochpan-garments-tribute','am-cuauhnahuac-paper-tribute'],1519,'Tribute concentrates food and materials in Tenochtitlan',[-97,18],5],
];
const scenes:StoryScene[]=groups.map(([keys,year,title,center,zoom],index)=>{
 const records=keys.map(key=>{const record=trade.records.find(r=>r.id==='trade-deep-'+key);if(!record)throw Error(key);return record;});
 return {id:'trade-research-'+index,year,title,body:records.map(r=>r.review.summary).join(' '),note:[...new Set(records.map(r=>r.review.limitations))].join(' '),recordIds:records.map(r=>r.id),center,zoom,scope:'world'};
});
writeFileSync('data/trade-network-scenes.json',JSON.stringify({recordIds:trade.records.map(r=>r.id),scenes},null,2)+'\n');

const wrecks=dataset.records.filter(r=>r.history?.kind==='wreck');
const scene=(id:string,year:number,title:string,body:string,note:string,recordIds:string[],center:[number,number],zoom:number):StoryScene=>({id,year,title,body,note,recordIds,center,zoom,scope:'world'});
const ancient=wrecks.filter(r=>r.id.startsWith('wreck-ancient-')).map(r=>scene(r.id,r.time.end!,r.title,r.review.summary,r.review.limitations,[r.id],[r.location!.lon,r.location!.lat],9));
const regions:[string,string,number,[number,number],number][]=[
 ['hatteras','Cape Hatteras and the Outer Banks',1878,[-75.6,35.6],15],
 ['pacific-northwest','Columbia Bar and the Pacific Northwest',1906,[-124.5,47],9],
 ['sable-island','Sable Island and moving sands',1812,[-59.9,43.9],22],
 ['great-lakes','Great Lakes shipping and accumulated losses',1913,[-84.2,45.5],8],
 ['scilly','Scilly and the Western Approaches',1707,[-6.4,49.9],18],
 ['western-australia','Western Australia and the Abrolhos',1934,[114,-28],5],
];
const guides=JSON.parse(await (await import('node:fs/promises')).readFile('data/site-guides.json','utf8')).guides;
const regional=regions.map(([id,title,year,center,zoom])=>{const g=guides.find((g:any)=>g.id==='graveyard-'+id);return scene('wreck-region-'+id,year,title,g.description,'Open the regional guide for the setting and source-qualified losses. Earlier losses remain faintly visible; the inventory is incomplete. Positions may be approximate or refer to wreckage found later.',[...g.recordIds,...g.referenceRecordIds??[]],center,zoom);});
const topic={id:'shipwrecks',title:'Shipwrecks: ancient cargoes and maritime graveyards',subtitle:'Losses through 1934, accumulating across coasts and lakes',description:'Explore early excavated cargoes, named disasters and regional concentrations of historical losses.',recordIds:wrecks.map(r=>r.id),scenes:[...ancient,...regional].sort((a,b)=>a.year-b.year),method:'Publisher loss dates are distinct from discovery, survey and salvage dates. Undated losses are held outside the timeline. A bright loss fades over 25 years to a persistent subtle marker; this is a visual convention, not a claim that wreckage survives. Catalogue aliases share a marker. Coverage follows the linked public inventories and is not a worldwide census.',dateNote:'Only losses with a supported date or archaeological interval enter the movie. A year within an interval is not an exact sinking date. Modern relief and coastlines are reference geography.'};
writeFileSync('data/shipwreck-topic.json',JSON.stringify(topic,null,2)+'\n');
console.log(`${scenes.length} trade chapters; ${wrecks.length} shipwreck records in topic`);
