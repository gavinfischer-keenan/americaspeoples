import fs from 'node:fs';
const pkg=JSON.parse(fs.readFileSync('data/research-proposals.json','utf8'));
const starter=JSON.parse(fs.readFileSync('data/evidence.json','utf8'));
const ledger=JSON.parse(fs.readFileSync('data/literature-intake-2026-10-28.json','utf8'));
ledger.batches??=[];
const all=()=>[...starter.records,...pkg.proposals.map(p=>p.record)];
const requested=new Set(process.argv.slice(2));
for(const batch of ['central','southeast','sealevel','alaska','southwest','caribbean','empires','fourcorners','hovenweep','site-locations','greatlakes','patagonia-north','patagonia-south','louisiana','cuba','abcislands','jamaica','hawaii','polynesian-origins','atlantic-canada','amazon-isolation','lapita-followup','northeast-dump2','midwest-dump2','atlantic-models-dump2','climate-dump3','languages-dump3','corridor-dump3']){
 if(requested.size&&!requested.has(batch))continue;
 const path=batch==='hovenweep'?'data/intake-hovenweep-sites.json':batch==='site-locations'?'data/intake-site-locations-review.json':`data/intake-${batch}-reviewed.json`;if(!fs.existsSync(path))continue;
 const d=JSON.parse(fs.readFileSync(path,'utf8'));
 for(const r of d.records){
  if(all().some(x=>x.id===r.id))continue;
  r.review.provenance+=['atlantic-canada','amazon-isolation','lapita-followup','northeast-dump2','midwest-dump2','atlantic-models-dump2','climate-dump3','languages-dump3','corridor-dump3'].includes(batch)?' Author-supplied PDF/RIS originals preserved in the local round3 intake archive. Reviewed citations and limitations are public; original synthesis PDFs are not republished.':' Full author-supplied synthesis archive: docs/intake/index.html. Original synthesis is secondary provenance, not a substitute for the cited primary study.';
  if(['central-landbridge-cultigens','central-landbridge-chiefdoms'].includes(r.id)){
   r.time={...r.time,kind:'unplaced',start:null,end:null};r.time.interpretation='Reported BP wording is retained. Calendar calibration and epoch are not confirmed from the accessed abstract; no automatic conversion to calendar BCE is plotted.';
  }
  if(r.id==='central-aguadafenix-construction'){
   r.claims[0].text='Lidar survey and excavation at Aguada Fénix identified a large artificial plateau dated to 1000–800 BCE.';
   r.claims.push({...structuredClone(r.claims[0]),id:'communal-labor',text:'The authors propose communal labor as important in early Maya development.',status:'under discussion',explanation:'Social organization is an archaeological interpretation rather than a directly measured construction date.'});
  }
  pkg.proposals.push({id:'author-'+r.id,version:1,kind:'new',targetId:null,baseRevision:null,baseRecord:null,record:r,rationale:'Author-supplied literature intake with primary source/access checks.',state:'ready',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
 }
 for(const u of d.updates??[]){
  if(!u.recordId||!u.source)continue;
  const r=all().find(x=>x.id===u.recordId);if(!r)throw Error('Missing update target '+u.recordId);
  let c=r.claims.find(x=>x.id===u.claimId);
  if(!c&&u.newClaim){c=structuredClone(u.newClaim);r.claims.push(c);}
  if(!c)throw Error('Missing claim target '+u.recordId+' '+u.claimId);
  if(c.support.some(x=>x.sourceId===u.source.id&&x.note.includes(u.note)))continue;
  if(!r.sources.some(x=>x.id===u.source.id))r.sources.push(u.source);
  const mapping=c.support.find(x=>x.sourceId===u.source.id&&x.stance===u.stance&&x.locator===u.locator);
  if(mapping)mapping.note+=' '+u.note;
  else c.support.push({sourceId:u.source.id,stance:u.stance,locator:u.locator,note:u.note});
  r.revision++;r.review.history.push('2026-10-28: supplementary source and interpretation context added.');
 }
 if(!ledger.batches.some(x=>x.name===batch))ledger.batches.push({name:batch,recordIds:d.records.map(x=>x.id),sourceRegister:d.sourceRegister,unresolved:d.unresolved,corrections:d.corrections});
}
const link=(id,ids)=>{const r=all().find(x=>x.id===id);if(!r)return;for(const x of ids)if(all().some(y=>y.id===x)&&x!==id&&!r.review.relatedIds.includes(x))r.review.relatedIds.push(x);};
link('pacific-corridor-hypothesis',['kelp-highway-ecological-mechanism','coastal-route-multiple-models2018','northwest-preserved-shorelines2018','coastal-migration-davis-window','northwest-coastal-viability-dixon2026','submerged-coastal-record']);
link('south-america-early-dispersal-model',['south-america-sutter-entry','south-america-cold-adaptation2025','south-america-kelp-habitat-model2026']);
link('caribbean-colonization-synthesis',['context-sealevel-boriken-coastal-habitats']);
link('tupi-guarani-parana',['tupi-guarani-onset','tupi-guarani-atlantic','tupi-late-holocene-forest','amazon-dark-earths']);
link('tupi-guarani-atlantic',['tupi-guarani-onset','tupi-guarani-parana','tupi-late-holocene-forest']);
link('se-shellring-relative-sequence',['se-stcatherines-ring-model','se-musgrove-ring-model','se-mcqueen-ring-model','se-georgia-instability4300bp','se-georgia-ring-dispersal']);
link('se-holocene-settlement-synthesis',['se-gulf-persistent-coastal-use','se-bolen-water-aggregation','se-bolen-lithic-networks','se-shellring-relative-sequence']);
link('central-belize-southern-ancestry',['central-belize-early-lineage','central-landbridge-cultigens']);
link('central-mexico-drought-continuity',['south-america-cold-adaptation2025']);
// Date of first arrival is a strongly contested claim: retain support AND the critique.
const conflict=all().find(r=>r.id==='preclovis-review-context');
const critique=conflict.sources.find(s=>s.id==='potter2021-online'),gruhn=conflict.sources.find(s=>s.id==='gruhn2023');
const disputed=all().find(r=>r.id==='north-america-prelgm-model');
if(!disputed&&critique&&gruhn){
 const base=structuredClone(all().find(r=>r.id==='north-america-faunal-extinction-hypothesis'));
 base.id='north-america-prelgm-model';base.title='Pre-LGM human presence — explicitly disputed inference';base.overlay.kind='regional-evidence';base.sources=[base.sources[0],critique,gruhn];
 base.claims=[{id:'prelgm',text:'Humans were present in North America before or during the Last Glacial Maximum.',status:'disputed',explanation:'Becerra-Valdivia and Higham infer early presence; Potter and colleagues challenge the evidence and favor dispersal after16000calBP, while Gruhn argues for earlier slow adaptation. These positions are not a settled consensus.',support:[{sourceId:base.sources[0].id,stance:'supports',locator:'Abstract',note:'Bayesian synthesis of42sites argues for presence before/during/afterLGM.'},{sourceId:critique.id,stance:'challenges',locator:'Abstract',note:'Critique treats pre-Paleoindian evidence as equivocal and favors after16000calBP.'},{sourceId:gruhn.id,stance:'context',locator:'Abstract',note:'Anthropological argument for preLGMentry, not independently dated occupation at a specified site.'}]}];
 base.time={kind:'unplaced',start:null,end:null,original:'Before, during and immediately after LGM; broad contested inference',method:'Chronological model versus evidence critique',interpretation:'No closed occupation interval assigned to a continent-wide disputed statement.'};base.review.summary=base.claims[0].text;base.review.limitations='This is a disputed continental model, not a dated excavated settlement or continuous occupation boundary.';base.review.discussion=base.claims[0].explanation;base.review.relatedIds=['preclovis-review-context','north-america-gi1-expansion'];
 pkg.proposals.push({id:'author-'+base.id,version:1,kind:'new',targetId:null,baseRevision:null,baseRecord:null,record:base,rationale:'Preserve explicitly opposed first-arrival interpretations.',state:'ready',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
}
link('preclovis-review-context',['north-america-prelgm-model','coastal-route-multiple-models2018']);
fs.writeFileSync('data/research-proposals.json',JSON.stringify(pkg,null,2)+'\n');fs.writeFileSync('data/evidence.json',JSON.stringify(starter,null,2)+'\n');fs.writeFileSync('data/literature-intake-2026-10-28.json',JSON.stringify(ledger,null,2)+'\n');console.log('Combined records',all().length);
