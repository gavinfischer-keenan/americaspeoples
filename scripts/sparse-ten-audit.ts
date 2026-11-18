import {readFileSync,writeFileSync} from 'node:fs';
import {dataset} from '../src/published-data';
import {topicOnlyIds} from '../src/topic-dives';
import type {EvidenceRecord} from '../src/model';

const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const before=read('data/sparse-ten-baseline.json');
const expansion=read('data/sparse-ten-expansion-records.json');
const decisions=read('data/sparse-ten-source-decisions.json');
const coverage=read('data/coverage-audit.json');
if(coverage.version!==dataset.version||coverage.recordCount!==dataset.records.length-topicOnlyIds.size)
 throw new Error('Regenerate the canonical geographic audit before the sparse-region comparison.');
const additions=expansion.records as EvidenceRecord[];
const unique=(ids:string[])=>[...new Set(ids)].sort();
const regions=before.regions.map((old:any)=>{
 const now=coverage.matrix.find((r:any)=>r.region===old.region);
 if(!now)throw new Error('Missing geographic audit row: '+old.region);
 const beforeLocalityIds=unique(old.evidence.map((e:any)=>dataset.records.find(r=>r.id===e.id)?.location?.id).filter(Boolean));
 const afterLocalityIds=unique(now.periods.flatMap((p:any)=>p.localityIds));
 const recordIds=unique(now.periods.flatMap((p:any)=>[...p.localRecordIds,...p.contextRecordIds]));
 return {region:old.region,bounds:old.bounds,beforeLocalityIds,afterLocalityIds,recordIds,
  addedRecordIds:expansion.regionAssignments[old.region],
  periods:now.periods.map((p:any)=>({...p,beforeLocalityCount:old.periods.find((b:any)=>b.start===p.start&&b.end===p.end)?.count??0}))};
});
const method='The same ten geographic bins are compared with v0.25.0. Modern state outlines clip the named US bins; they are audit boundaries, not ancient territories. Distinct locality IDs count once across multiple phases. Public island-scale references remain island-scale. Dates measure available evidence, not the number of people or continuously occupied towns. Blank periods are collection gaps unless a source establishes a departure.';
const report={version:dataset.version,baselineVersion:before.version,recordCount:dataset.records.length,sharedRecordCount:coverage.recordCount,newRecordCount:additions.length,method,regions};
writeFileSync('data/sparse-ten-coverage.json',JSON.stringify(report,null,2)+'\n');
let text=`# Ten sparse areas: communities, connections and changing places

${decisions.summary}

This update adds **${additions.length} shared map records**. Each can be found on the master map at its supported date, alongside events elsewhere. Archaeological samples, villages, trading posts and journeys keep their distinct meanings.

[Watch the shared world](../index.html#movie) · [Explore the map](../index.html#explore) · [Sources, attributions and licenses](../sites/sources-attributions.html) · [Full coverage matrix](coverage-audit.html)

## Where the map gained detail

${method}

| Area | Dated localities before | Dated localities now |
|---|---:|---:|
`;
for(const r of regions)text+=`| ${r.region} | ${r.beforeLocalityIds.length} | ${r.afterLocalityIds.length} |\n`;
text+='\n## People between the dates\n\n'+decisions.continuity+'\n\n';
for(const region of regions){
 text+=`## ${region.region}\n\n${decisions.regions[region.region]}\n\n`;
 for(const r of additions.filter(r=>region.addedRecordIds.includes(r.id))){
  text+=`### ${r.title}\n\n${r.review.summary}\n\n${r.review.discussion}\n\n**When:** ${r.time.original}\n\n**Where:** ${r.location?.name??'A schematic connection between the named endpoints'}. ${r.location?.precision??''}\n\n[Open the evidence and map](../index.html#review/${r.id}) · ${r.sources.map(s=>`[${s.authors}: ${s.title}](${s.url})`).join(' · ')}\n\n`;
 }
}
text+='## Places still needing more work\n\n';
for(const h of decisions.held)text+=`- **${h.title}:** ${h.reason} ${(h.sources??[]).map((url:string,i:number)=>`[Source ${i+1}](${url})`).join(' · ')}\n`;
text+='\n## Research and reuse\n\nOne Consensus Deep dossier helped locate research across the ten areas. The complete provider response is retained privately. Public text is independently written from the linked archaeological reports, community histories and historical documents. No new third-party photographs or copied passages were added in this campaign. Each source remains subject to its own rights; facts are not relicensed as exclusive atlas content.\n';
writeFileSync('docs/sparse-ten-histories.md',text);
console.log(JSON.stringify({newRecords:additions.length,total:dataset.records.length,regions:regions.map((r:any)=>[r.region,r.beforeLocalityIds.length,r.afterLocalityIds.length])}));
