import {writeFileSync,readFileSync} from 'node:fs';
import {dataset} from '../src/published-data';
import {topicOnlyIds} from '../src/topic-dives';
import {historyState} from '../src/history';
import type {EvidenceRecord,MapRecord} from '../src/model';

const baseline=JSON.parse(readFileSync('data/trade-0-1200-baseline.json','utf8'));
const shared=dataset.records.filter(r=>!topicOnlyIds.has(r.id));
const windows=(r:EvidenceRecord)=>r.history?.windows??[r.time];
const intersects=(r:EvidenceRecord)=>windows(r).some(w=>w.start!==null&&w.end!==null&&w.start<=1200&&w.end>=0);
const tagged=(r:EvidenceRecord)=>r.overlay?.kind==='trade'||r.history?.kind==='exchange';
const trade=shared.filter(r=>tagged(r)&&r.history?.kind!=='migration'&&r.overlay?.geometry?.type==='LineString'&&intersects(r));
const samples=baseline.samples.map((sample:any)=>({year:sample.year,beforeIds:sample.ids,ids:trade.filter(r=>historyState(r as MapRecord,sample.year)==='active').map(r=>r.id)}));
const pointOrUnmapped=shared.filter(r=>tagged(r)&&r.history?.kind!=='migration'&&r.overlay?.geometry?.type!=='LineString'&&intersects(r));
// Some exchange finds belong to a wider settlement record. Index the named
// claim without reclassifying its neighbors or creating a second map marker.
const pointClaims=JSON.parse(readFileSync('data/trade-0-1200-point-claims.json','utf8')).claims.map((entry:{recordId:string;claimId:string;dateBasis:string})=>{
 const r=shared.find(r=>r.id===entry.recordId),claim=r?.claims.find(c=>c.id===entry.claimId);
 if(!r||!claim||!intersects(r)||r.overlay?.geometry?.type==='LineString'||entry.dateBasis!=='associated context')throw Error('Invalid point exchange claim: '+entry.recordId+'/'+entry.claimId);
 return {...entry,title:r.title,text:claim.text,explanation:claim.explanation,contextDate:r.time};
});
const pointIds=[...new Set([...pointOrUnmapped.map(r=>r.id),...pointClaims.map((c:any)=>c.recordId)])];
const result={version:dataset.version,period:[0,1200],baselineVersion:baseline.version,method:'Shared, explicitly classified exchange observations with line geometry and at least one supported activity window intersecting map years 0–1200. Founding migrations are excluded even where they use the same rendering layer. Multiple materials or dates may describe the same connection; counts are observations, not independent routes, traffic volume or evidence of continuous voyages. Samples use the same activity-window logic as the map. The point inventory also indexes explicitly reviewed exchange claims within settlement records; associated-context dates are identified separately from direct dates of traded objects.',mappedExchangeIds:trade.map(r=>r.id),pointOrUnmappedIds:pointIds,pointOrUnmappedClaims:pointClaims,samples};
writeFileSync('data/trade-coverage-audit.json',JSON.stringify(result,null,2)+'\n');
let text=`# Trade and exchange, 0–1200 CE

The shared map now contains **${trade.length} mapped exchange observations** intersecting this period, compared with **${baseline.mappedExchangeIds.length}** in v${baseline.version}. These counts exclude founding migrations. They count evidence records; multiple records can describe phases or goods on one connection.

${result.method}

| Map year | Before | Now |
|---|---:|---:|
`;
for(const sample of samples)text+=`| ${sample.year===0?'1 BCE (map year0)':sample.year+' CE'} | ${sample.beforeIds.length} | ${sample.ids.length} |\n`;
text+=`\nSource-to-find connections show where materials traveled. A schematic line does not establish a direct journey, a surveyed road or an annual trading schedule. Activity windows follow the dated assemblages or historical phases cited in each record. An endpoint means the last included evidence unless a source independently supports cessation. Later Inca imperial roads are not assigned to earlier centuries.\n\n[Watch the trade topic](../index.html#topic/trade) · [Return to the shared map](../index.html#movie) · [Regional coverage and new histories](three-regional-gaps.html)\n\n## Mapped exchange evidence\n\n`;
for(const r of trade)text+=`- [${r.title}](../index.html#review/${r.id}) — ${r.time.original}. ${r.history?.connection?.note??r.review.limitations}\n`;
text+='\n## Exchange evidence still shown as a point or not geographically mapped\n\n';
for(const r of pointOrUnmapped)text+=`- [${r.title}](../index.html#review/${r.id}) — check the source chronology and provenance before assigning endpoints.\n`;
for(const c of pointClaims)text+=`- [${c.title}: exchange find](../index.html#review/${c.recordId}) — ${c.text} ${c.explanation} **Associated context:** ${c.contextDate.original} This is part of the same village record, not an additional locality or a dated period of continuous trade.\n`;
writeFileSync('docs/trade-coverage-audit.md',text);
console.log(`${trade.length} mapped exchange observations; ${pointIds.length} point/unmapped observations in 0–1200`);
