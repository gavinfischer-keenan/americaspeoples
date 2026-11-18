import {readFileSync,writeFileSync} from 'node:fs';
import {dataset} from '../src/published-data';
import {topicOnlyIds} from '../src/topic-dives';
import type {EvidenceRecord} from '../src/model';

const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const before=read('data/eastern-brazil-baseline.json');
const additions=read('data/eastern-brazil-expansion-records.json').records as EvidenceRecord[];
const decisions=read('data/eastern-brazil-source-decisions.json');
const shared=dataset.records.filter(r=>!topicOnlyIds.has(r.id));
const [west,east,south,north]=before.region.bounds;
const inside=(r:EvidenceRecord)=>!!r.location&&r.location.lon>=west&&r.location.lon<=east&&r.location.lat>=south&&r.location.lat<=north;
const overlap=(r:EvidenceRecord,a:number,b:number)=>(r.history?.windows?.length?r.history.windows:[r.time]).some(w=>w.start!==null&&w.end!==null&&w.start<=b&&w.end>=a);
const local=(r:EvidenceRecord)=>!r.overlay&&!!r.location&&['occupation','occurrence','event'].includes(r.type);
const localityIds=(records:EvidenceRecord[])=>[...new Set(records.filter(local).map(r=>r.location!.id))].sort();
const geo=shared.filter(inside);
const periods=before.region.periods.filter((p:any)=>p.start>=501&&p.end<=1500).map((p:any)=>{
 const current=geo.filter(r=>overlap(r,p.start,p.end));
 return {period:p.period,start:p.start,end:p.end,beforeLocalityIds:p.localityIds,localityIds:localityIds(current),localRecordIds:current.filter(local).map(r=>r.id),contextRecordIds:current.filter(r=>!local(r)).map(r=>r.id)};
});
const samples=[600,800,1000,1200,1400,1500].map(year=>({year,recordIds:geo.filter(r=>overlap(r,year,year)).map(r=>r.id),localityIds:localityIds(geo.filter(r=>overlap(r,year,year)))}));
const method='Named localities within longitude 48°W–34°W and latitude 25°S–1°S. Separate observations at one place count once as a locality. Explicit supported date windows override their outer envelope. A sample-year match means the evidence could date to that year, not a census of occupied towns. Blank cells describe this atlas, not human absence.';
const result={version:dataset.version,baselineVersion:before.version,bounds:before.region.bounds,method,recordCount:dataset.records.length,sharedRecordCount:shared.length,newRecordIds:additions.map(r=>r.id),newLocalityIds:localityIds(additions.filter(inside)),periods,samples};
writeFileSync('data/eastern-brazil-coverage.json',JSON.stringify(result,null,2)+'\n');
let text=`# Eastern Brazil: villages, exchange and conflict evidence, 501–1500 CE

${decisions.summary}

This release adds **${additions.length} shared map records** at **${result.newLocalityIds.length} distinct named localities** within the study rectangle. The master map now has ${shared.length.toLocaleString('en-US')} shared observations and ${dataset.records.length-shared.length} focused topic records.

[Read the illustrated regional history](../sites/atlantic-brazil.html) · [Watch its contextual movie](../index.html#story/atlantic-brazil) · [Open the master map](../index.html#movie) · [Browse sources and licenses](../sites/sources-attributions.html)

## What changed on the map

${method}

The immutable baseline is v${before.version}, with ${before.sharedRecordCount.toLocaleString('en-US')} shared records. Earlier and later source ranges retain their real endpoints; dates are not cut off at 501 or 1500 merely to fit this campaign.

| Period | Named localities before | Named localities now | Local evidence records now |
|---|---:|---:|---:|
`;
for(const p of periods)text+=`| ${p.period} | ${p.beforeLocalityIds.length} | ${p.localityIds.length} | ${p.localRecordIds.length} |\n`;
text+='\n## Settlements and activity\n\n';
for(const r of additions){text+=`### ${r.title}\n\n${r.review.summary}\n\n${r.review.discussion}\n\n**When:** ${r.time.original}\n\n**Where:** ${r.location?.name??'See the mapped connection'}. ${r.location?.precision??''}\n\n[Map and full evidence](../index.html#review/${r.id}) · ${r.sources.map(s=>`[${s.authors}: ${s.title}](${s.url})`).join(' · ')}\n\n`;}
text+='## Evidence still needing work\n\n';
for(const item of decisions.held)text+=`- **${item.title}:** ${item.reason} ${item.sources.map((url:string,i:number)=>`[Source ${i+1}](${url})`).join(' · ')}\n`;
text+=`\n## Research and reuse\n\nOne Consensus Deep dossier supported discovery. Its complete response remains private; the public history is independently written from the original sources linked above. Original atlas writing follows the project’s noncommercial share-alike terms, while each third-party illustration retains its displayed license. The [full geographic coverage matrix](coverage-audit.html) and [exchange audit](trade-coverage-audit.html) use the shared master dataset.\n`;
writeFileSync('docs/eastern-brazil.md',text);
console.log(JSON.stringify({newRecords:additions.length,newLocalities:result.newLocalityIds.length,total:dataset.records.length,shared:shared.length,periods:periods.map((p:any)=>[p.period,p.beforeLocalityIds.length,p.localityIds.length])}));
