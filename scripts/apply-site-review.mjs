import fs from 'node:fs';
const a=JSON.parse(fs.readFileSync('data/evidence.json','utf8')),file='data/research-proposals.json',p=JSON.parse(fs.readFileSync(file,'utf8')),audit=JSON.parse(fs.readFileSync('data/intake-site-locations-review.json','utf8'));
const all=[...a.records,...p.proposals.map(p=>p.record)];
for(const u of audit.updates){
 const r=all.find(r=>r.id===u.recordId);if(!r)throw Error(u.recordId);
 if(u.action==='replace-location-and-add-qualified-population'&&!r.population){
  r.location=u.location;r.sources.push(...u.sources);r.claims.push(...u.claims);
  r.population=u.populationEstimates.map((x,i)=>({...x,end:i===0?1099:x.end,scope:x.scope+' Phase boundaries are a display convention; the shared 1100 boundary is assigned to the Stirling phase. Estimates are approximate graph readings, not annual censuses.'}));
  r.review.discussion+=' Museum-reproduced Lohmann/Stirling estimates are model-based and approximate; the original 1997 chapter remains access-restricted. No interpolation between phases.';
  r.revision++;r.review.history.push('2026-10-28: UNESCO coordinate and qualified sourced population phases added.');
 }
 if(u.locationAssessment&&!r.review.limitations.includes(u.locationAssessment)){r.review.limitations+=' '+u.locationAssessment;r.revision++;}
 if(u.relatedIds)for(const id of u.relatedIds)if(!r.review.relatedIds.includes(id))r.review.relatedIds.push(id);
 if(u.recommendedPopulationClaim&&!r.claims.some(c=>c.id==='resident-population-model')){
  const c=u.recommendedPopulationClaim,s=audit.sourceRegister.find(s=>s.id===c.sourceId);if(!s)throw Error(c.sourceId);
  const {decision,...source}=s;r.sources.push({...source,referenceType:'journal-article'});
  r.claims.push({id:'resident-population-model',text:c.text,status:c.status,explanation:c.limitations,support:[{sourceId:s.id,locator:c.locator,stance:'supports',note:'Published resident reconstruction, not an independently calculated headcount or dated growth curve.'}]});
  r.revision++;
 }
}
const cahokia=all.find(r=>r.id==='cahokia-urban')?.location;
for(const r of all)if(r.location?.id==='cahokia'&&JSON.stringify(r.location)!==JSON.stringify(cahokia)){r.location=structuredClone(cahokia);r.revision++;r.review.history.push('2026-10-28: shared public Cahokia complex locator refined; no individual structure location asserted.');}
fs.writeFileSync('data/evidence.json',JSON.stringify(a,null,2)+'\n');fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');
