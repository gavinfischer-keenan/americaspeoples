import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {esc} from '../src/dom.ts';
const batches=[
['875ff3ce-8017-4ba1-bf4a-4ff9edc43a48','01-reviews','Initial reviews bibliography'],
['79816088-11dc-4053-bae1-1a2640cec65d','02-global-maritime','Global maritime dispersal synthesis'],
['b69fb22d-473c-4259-a85e-5e368e909b33','03-pacific-maritime','Pacific Rim maritime adaptations'],
['0998282c-f4a6-4dce-b807-e1d4d159059d','04-central-synthesis','Central America through the 1100s'],
['de5df2df-7764-4c79-a230-fcaf6a062a67','05-central-papers','Central America literature table'],
['28ee62a1-4712-4942-b31d-93de7783d832','06-southeast-synthesis','Southeast timeline'],
['4575e186-b6ca-4eb5-8ad8-95c1ba589c26','07-southeast-papers','Southeast literature table'],
['ba870044-6600-4c5b-908e-837cefda6464','08-southeast-interior-coast','Interior and coastal Southeast'],
['567cf305-51a4-4dbe-af7b-8f7e7acba3a2','09-southeast-settlement','Settlement distribution study'],
['638d6185-ea9a-42d7-a914-cffc17a013bb','10-sealevel-synthesis','Sea-level change and movement context'],
['1243a00a-9ad2-49ea-9b55-c3a4144e3d95','11-sealevel-papers','Sea-level literature table'],
['36a88f98-0538-4955-b380-a7e3498f5d4d','12-alaska-pacific','Alaska and Pacific Northwest'],
['590d3755-7c32-4d24-9667-7b8f59f7ebdb','13-northwest-continuity','Coastal routes and northwest continuity'],
['e9ff4c5f-f4db-47c1-b50d-fceae622623e','14-southwest-synthesis','California, Nevada and Arizona timeline'],
['e54b1e7e-1045-4c62-a6cb-638c2f2f3fcf','15-southwest-papers','California, Nevada and Arizona papers'],
['c3972ab1-0210-4b8d-8469-2f2f27120176','16-southwest-sequences','California, Arizona and Nevada chronological sequences'],
['85df1925-2435-4477-a780-86e8edfabab0','17-california-continuity','Mixed evidence for California continuity'],
['c22a54cc-ecc7-443c-aea8-6e8de28a44e9','18-caribbean','Caribbean seafaring and population histories'],
['c37394ae-1bf9-413f-9b7c-3a53ec385f1b','19-empires','Aztec and Inca urban trajectories'],
['afd33638-6bfb-4a23-b40e-1e531fc83103','20-inca-settlements','Inca nucleated settlements'],
['50c68d6a-1c71-48eb-8c92-f797ccf466fb','21-fourcorners','Four Corners occupation and migration'],
['bfcb60b2-bc10-44f4-a38f-9d7cc0f0d7b7','22-greatlakes','Great Lakes settlement and environment'],
['22325765-e709-4392-81fc-fb1586db18f7','23-greatlakes-sequence','Great Lakes chronological sequence'],
['2e4d7424-b94d-4c8b-bd56-3a2e577449a0','24-patagonia','Patagonia initial sites and environment'],
['db87bf4a-ff5b-44b3-866d-3391e3fe4e92','25-monte-verde-debate','Monte Verde chronology and competing interpretations'],
['5a879cb8-f330-4884-b793-8fc337310072','26-louisiana','Louisiana settlements and earthworks'],
['3fbac5a5-bcb8-4116-a370-1a78c2ef62b5','27-louisiana-bayous','Coastal bayou settlements and landform context'],
['bd5e7df9-cbbf-4a1b-8129-ad063bf3f917','28-cuba','Cuban archaeological sites and chronology'],
['163f105e-384d-4466-a818-604cfcbdd064','29-cuba-early','Cuban early occupation and dietary context'],
['6abeb741-dd03-4af9-9f4d-87205d30b3f9','30-abc-islands','Aruba Bonaire and Curacao archaeology'],
['4887e447-dbb2-46c9-b35b-5f0e0a34e696','31-abc-early','ABC early occupation and comparative chronology'],
['65b5830d-18f9-401a-ae8b-646bb3d92268','32-jamaica','Jamaican occupation chronology'],
['16b3ee29-12bb-47f0-bc4c-5a3736cf9051','33-hawaii','Hawaiian settlement and Pacific connections'],
['cc52cffa-8251-44ea-86a0-d2d1e04af30d','34-polynesian-voyaging','Origins of Polynesian voyaging'],
['7c1d53c2-7c7b-401e-8436-275ae0e0f3aa','35-society-islands','Society Islands hub and competing origins models'],
['5dabb2af-450e-4965-85d9-dd844fce05ae','36-polynesian-lines','Linguistic archaeological and genomic dispersal evidence'],
['cfc97cec-6337-4392-b9cd-8d7f77d0bc3c','37-fiji','Fijian highland origins and mixed ancestry']
];
fs.mkdirSync('docs/intake',{recursive:true});
const manifest=[];
for(const [id,name,title] of batches){
 const input=`C:/Users/gavin/.codex/attachments/${id}/Pasted text.txt`;
 const bytes=fs.readFileSync(input),filename=`2026-10-28-${name}.txt`;
 fs.writeFileSync('docs/intake/'+filename,bytes);
 manifest.push({title,filename,received:'2026-10-28',sha256:createHash('sha256').update(bytes).digest('hex'),scope:'Author-supplied Consensus export. Secondary synthesis and research intake, not peer-reviewed primary research or proof of every automated summary.'});
}
fs.writeFileSync('docs/intake/manifest.json',JSON.stringify({batches:manifest},null,2));
fs.writeFileSync('docs/intake/index.html',`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Research intake provenance</title><style>body{font:16px/1.6 system-ui,sans-serif;max-width:1000px;margin:40px auto;padding:0 24px;color:#17243d}li{margin:14px 0}a{color:#087d95}</style><main><a href="../../index.html#context">Back to the atlas context</a><h1>Research intake provenance</h1><p>These are the complete text exports supplied by the app author on October 28, 2026. They preserve the starting explanations, bibliography and proposed mechanisms behind the evidence updates. They are secondary syntheses and contain automated summaries, contradictions, unrelated search results and bibliographic errors. They are not relabeled as primary scientific research.</p><p>The atlas records cite the underlying papers and state whether an abstract or full text was checked. Original findings, model assumptions, dating units, disagreements and access limits take precedence over a supplied summary. Search-result percentages and journal rankings are not used as scientific confidence or dispute scores.</p><p><a href="../../literature-intake.json">Read the reconciliation register</a> · <a href="manifest.json">File manifest and SHA-256 checksums</a></p><ol>${manifest.map(x=>`<li><a href="${x.filename}">${esc(x.title)}</a> — original supplied text</li>`).join('')}</ol><h2>Additional supplied material</h2><p>Ardelean’s 2014 paper and Castro e Silva et al.’s 2022 paper were supplied as PDFs. Publisher links are in their record bibliographies. Fiedel’s supplied RIS is a reference list, not article full text. Subscription PDFs are not republished here.</p></main></html>`);
console.log('Archived',manifest.length,'complete supplied exports');
