import fs from 'node:fs';
const file='data/research-proposals.json',p=JSON.parse(fs.readFileSync(file,'utf8'));
const starter=JSON.parse(fs.readFileSync('data/evidence.json','utf8'));
const r=p.proposals.find(p=>p.record.id==='genomic-founder-east-asian-divergence').record;
r.time={...r.time,kind:'unplaced',start:null,end:null,interpretation:'Ancestral East Asian divergence is comparative population-history context, not a dated American occupation. Estimates remain in the original-date field and claim.'};
// An unspecified BP axis must not silently become calibrated calendar BCE.
for(const id of ['se-georgia-instability4300bp','context-sealevel-boriken-coastal-habitats']){
 const r=p.proposals.find(p=>p.record.id===id)?.record;if(!r)continue;
 r.time={...r.time,kind:'unplaced',start:null,end:null,interpretation:'Original dates retained. The accessed source summary does not establish an unambiguous calendar axis for this display interval; no invented normalization is plotted.'};
}
for(const r of [...starter.records,...p.proposals.map(p=>p.record)]){
 const used=new Set(r.claims.flatMap(c=>c.support.map(x=>x.sourceId)));
 const geographic=r.sources.filter(s=>!used.has(s.id));
 if(!geographic.length)continue;
 r.claims.push({id:'geographic-context',text:'The associated regional setting is '+(r.location?.name??'described in the location metadata')+'.',status:'well-supported',explanation:'Official geographic context only. This does not independently establish archaeological dates, mission chronology, exact excavation positions or disputed interpretations.',support:geographic.map(s=>({sourceId:s.id,stance:'context',locator:'Official place information; see the separately sourced location provenance for more specific archaeological context.',note:'Identifies the named regional setting. Not evidence for the associated archaeological age or historical event.'}))});
 r.revision++;r.review.history.push('2026-10-28: linked existing official geographic references explicitly as location context, without changing archaeological dating.');
}
fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');
fs.writeFileSync('data/evidence.json',JSON.stringify(starter,null,2)+'\n');
let s=fs.readFileSync('scripts/archive-intake.mjs','utf8');
if(!s.includes('18-caribbean'))s=s.replace("['85df1925-2435-4477-a780-86e8edfabab0','17-california-continuity','Mixed evidence for California continuity']", "['85df1925-2435-4477-a780-86e8edfabab0','17-california-continuity','Mixed evidence for California continuity'],\n['c22a54cc-ecc7-443c-aea8-6e8de28a44e9','18-caribbean','Caribbean seafaring and population histories'],\n['c37394ae-1bf9-413f-9b7c-3a53ec385f1b','19-empires','Aztec and Inca urban trajectories']");
fs.writeFileSync('scripts/archive-intake.mjs',s);
