import {dataset} from '../src/published-data';
import {topicOnlyIds} from '../src/topic-dives';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const baseline=JSON.parse(readFileSync('data/three-regional-gaps-baseline.json','utf8'));
const shared=dataset.records.filter(r=>!topicOnlyIds.has(r.id));
const eastern=JSON.parse(readFileSync('data/coverage-audit.json','utf8')).matrix.find((r:any)=>r.region==='Eastern Brazil');
const easternAdded=existsSync('data/eastern-brazil-expansion-records.json')?JSON.parse(readFileSync('data/eastern-brazil-expansion-records.json','utf8')).records:[];
const intersects=(r:any,a:number,b:number)=>(r.history?.windows?.length?r.history.windows:[r.time]).some((w:any)=>w.start!==null&&w.end!==null&&w.start<=b&&w.end>=a);
const matrix=baseline.matrix.map((row:any)=>{
 const [w,s,e,n]=row.bounds;
 const rows=shared.filter(r=>{const p=r.location?[r.location.lon,r.location.lat]:r.overlay?.geometry?.type==='Point'?r.overlay.geometry.coordinates:null;return p&&p[0]>=w&&p[0]<=e&&p[1]>=s&&p[1]<=n});
 return {region:row.region,bounds:row.bounds,undatedIds:rows.filter(r=>r.time.start===null).map(r=>r.id),periods:row.periods.map((period:any)=>({start:period.start,end:period.end,recordIds:rows.filter(r=>intersects(r,period.start,period.end)).map(r=>r.id)}))};
});
const method='Shared dated locality/point observations in overlapping rectangular regions; connections with named origin points count at that origin, while route-only and focused topic records are excluded. Intersecting source windows count, not historical-memory display. Counts are evidence records, not towns, populations, continuous occupancy or research effort. Empty cells are not classified as human absence. Undated records remain separate.';
writeFileSync('data/world-coverage-audit.json',JSON.stringify({version:dataset.version,recordCount:dataset.records.length,sharedRecordCount:shared.length,method,matrix},null,2)+'\n');
const collection='data/three-regional-gaps-expansion-records.json';
const additions=existsSync(collection)?JSON.parse(readFileSync(collection,'utf8')).records:[];
let guide=`# Where the map has gaps

The current map contains **${shared.length.toLocaleString('en-US')} shared observations** and ${dataset.records.length-shared.length} focused topic observations. The audit does **not** find that blank regions were empty of people. It shows where this collection needs more dated local history.

The preceding v0.24.0 campaign added **${additions.length} shared map records** about lower Central America, Brazil's Atlantic coast and the Solomon Islands–Vanuatu region, including three linked route views of local finds. See [the histories and source decisions](three-regional-gaps.html).

The latest eastern Brazil pass adds **${easternAdded.length} shared map records**, extending the Atlantic Brazil history with villages, burials and exchange evidence from 501–1500 CE. [Read its source decisions and v0.24.0 before/after comparison](eastern-brazil.html).

## The preceding three-region campaign

- **Costa Rica and Panama, especially 1000 BCE–1500 CE:** the baseline had Monagrillo and a single dated Cerro Juan Díaz observation, followed by colonial foundations. Settlements, monumental centers and exchange were largely missing.
- **Atlantic coastal Brazil before 1500:** the eastern-coast row had one locality in 3000–1000 BCE, then none in the next four bins. Galheta IV adds a southern example but cannot represent the whole coast.
- **Solomon Islands and Vanuatu after Lapita:** the broad regional row had no dated localities in 1–500 CE and only one in each of the next two bins. Founding sites and migration models needed local histories alongside them.

These are editorial priorities among many serious gaps. Rectangles overlap and sometimes include neighboring islands; individual places still need geographic checks. Counts measure collected evidence, not population or survey completeness.

**Eastern Brazil now:** the detailed row contains ${eastern.periods.find((p:any)=>p.start===501).localityCount} distinct dated localities in 501–1000 CE and ${eastern.periods.find((p:any)=>p.start===1001).localityCount} in 1001–1500 CE, compared with zero in both bins before the latest pass. Earlier Sernambetiba deposits remain dated before 501 CE. Southern coastal sites still do not substitute for evidence in the eastern rectangle.


## What the numbers measure

${method}

The immutable baseline is **v${baseline.version}: ${baseline.recordCount.toLocaleString('en-US')} total and ${baseline.sharedRecordCount.toLocaleString('en-US')} shared records**, before the v0.24.0 regional campaign. Changed cells show before → now. Period labels are astronomical map-year bounds: year 0 is 1 BCE, and −1 is 2 BCE. The [detailed coverage matrix](coverage-audit.html) uses the same canonical master-map collection, with 65 finer/overlapping regions, distinct locality counts and source links. It now includes collections regardless of filename.

| Region | −50000…−10001 | −10000…−3001 | −3000…−1 | 0…999 | 1000…1491 | 1492…1699 | 1700…1799 | 1800…1934 | Undated now |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
`;
for(const row of matrix){const b=baseline.matrix.find((x:any)=>x.region===row.region);guide+='| '+row.region+' | '+row.periods.map((p:any,i:number)=>{const old=b.periods[i].recordIds.length,now=p.recordIds.length;return old===now?String(now):old+' → '+now}).join(' | ')+' | '+row.undatedIds.length+' |\n';}
guide+=`
## Gaps that remain

- **Patagonia and Tierra del Fuego, roughly 6000 BCE–1500 CE:** early arrivals and recent encounters still overshadow the intervening local histories.
- **Pacific Northwest, especially 10000–1000 BCE:** verify and date existing leads for villages, camps and engineered landscapes before ordering duplicate research.
- **Northern Mexico and Baja before 1500:** large stretches have few local communities between early finds and colonial settlements.
- **Lesser Antilles and Venezuela before 1500:** settlements, repeated journeys and local changes remain thin.
- **Australia's later Holocene and New Guinea after early settlement:** more local sequences are needed alongside regional evidence.
- **Alaska and Arctic Canada after early arrivals:** local communities need histories beyond a single cultural-replacement story.

Early empty bins in remote islands are screened separately from post-settlement gaps. A later date at a site does not fill all the years since an earlier one. No region is classified as unoccupied solely from this audit.

## Existing histories in the comparison

The baseline includes the inland Shield and Aleutian village expansions, Four Corners regional and local guides, Early Classic and Late Postclassic Alabama phases, and earlier Pacific and South American campaigns. Independent topic movies retain their own evidence; ordinary place movies share the master clock. Full Consensus reports remain private; the atlas cites original sources and uses independently written historical prose.

## New observations and sources

| Evidence | Primary source |
|---|---|
`;
for(const r of [...additions,...easternAdded]){const so=r.sources[0];guide+='| ['+r.title+'](../index.html#review/'+r.id+') | ['+so.authors+' — '+so.title+']('+so.url+') |\n';}
writeFileSync('docs/world-coverage-audit.md',guide);
console.log(dataset.records.length+' total; '+shared.length+' shared; '+matrix.length+' region rows');
