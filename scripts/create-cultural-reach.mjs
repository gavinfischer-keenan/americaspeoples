import fs from 'node:fs';
const file='data/research-proposals.json',pkg=JSON.parse(fs.readFileSync(file,'utf8'));
// Editorial envelopes locate source-described regional contexts, never surveyed borders.
for(const [baseID,id,title,center,radius] of [
 ['fc-chaco-community-scale','reach-chaco-communities','Chaco-era community connections — illustrative reach',[-108.5,36.5],220],
 ['fc-international-borderlands-agency','reach-borderlands-interaction','Southern borderlands — interacting cultural relationships',[-108.5,30.8],200],
 ['empire-ica-inventory','reach-ica-inca-context','Río Ica — Inca-period cultural context',[-75.7,-14.2],75],
]){
 if(pkg.proposals.some(p=>p.record.id===id))continue;
 const base=pkg.proposals.find(p=>p.record.id===baseID);if(!base)throw Error(baseID);
 const r=structuredClone(base.record);r.id=id;r.title=title;r.revision=1;
 r.overlay={kind:'cultural-reach',basis:'schematic',geometry:{type:'Point',coordinates:center},radiusKm:radius,precision:'Very approximate editorial circle around the named study region; radius is a cartographic choice, not an archaeological measurement or uncertainty interval.',provenance:'The cited study supports the regional cultural relationships and time scope. This softly feathered circle only locates that discussion; it does not reconstruct exclusive territories, actual historical boundary lines or uniform cultural identity.'};
 r.review.summary+=' The feathered envelope is a schematic visual guide to the named regional context.';
 r.review.limitations+=' Circle center/radius are illustrative editorial geography, not a measured cultural boundary. Overlap is permitted; cultural relationships need not be exclusive or spatially uniform.';
 r.review.relatedIds=[baseID];r.review.history.push('2026-10-28: separate optional cultural-context envelope added.');
 pkg.proposals.push({...structuredClone(base),id:'author-'+id,record:r});
}
fs.writeFileSync(file,JSON.stringify(pkg,null,2)+'\n');
