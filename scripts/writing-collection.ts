import {readdir,readFile,copyFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {esc} from '../src/dom';
export interface WritingExample {
 id:string;title:string;language:string;script:string;date:string;place:string;coordinates:[number,number]|null;genre:string;objectId:string;atlasIds:string[];guideIds?:string[];
 original:{kind:'image'|'text';text?:string;file?:string;imageUrl?:string;sourceUrl:string;license:string;licenseUrl:string;creator:string;note:string;width?:number;height?:number;sha256?:string};
 translation:{text:string;translator:string;sourceUrl:string;kind:'excerpt'|'complete';rightsNote:string;license?:string;licenseUrl?:string};
 context:string;sources:{url:string;title:string}[];
}
const nonempty=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0;
export function originalLanguageTag(language:string):string{
 if(language.includes('Akkadian'))return 'akk';
 if(language==='Sumerian')return 'sux';
 if(language==='Coptic')return 'cop';
 if(language.includes('Greek'))return 'grc';
 if(language.includes('Egyptian'))return 'egy';
 if(language.includes('Chinese'))return 'lzh';
 if(language==='Latin')return 'la';
 if(language.includes('Nahuatl'))return 'nci';
 if(language.includes('Quechua'))return 'qu';
 if(language.includes('Zapotec'))return 'zap';
 if(language.includes('Maya'))return 'myn';
 return 'und';
}
const https=(v:unknown)=>{try{if(typeof v!=='string'||/[\u0000-\u0020]/.test(v))return false;const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
export function validateWritingExamples(input:unknown):WritingExample[]{
 if(!Array.isArray(input))throw Error('Expected writing examples');const ids=new Set<string>();
 for(const e of input as WritingExample[]){
  const fail=(s:string):never=>{throw Error(`${e?.id}: ${s}`);};
  if(!e||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(e.id)||ids.has(e.id))fail('invalid or duplicate identity');ids.add(e.id);
  if(![e.title,e.language,e.script,e.date,e.place,e.genre,e.objectId,e.context].every(nonempty))fail('missing context');
  if(e.coordinates!==null&&(!Array.isArray(e.coordinates)||e.coordinates.length!==2||!e.coordinates.every(Number.isFinite)||Math.abs(e.coordinates[0])>180||Math.abs(e.coordinates[1])>90))fail('invalid location');
  if(!Array.isArray(e.atlasIds)||!e.atlasIds.length||e.atlasIds.some(a=>!['americas','europe','africa','asia-pacific'].includes(a)))fail('invalid atlas references');
  if(!Array.isArray(e.sources)||!e.sources.length||e.sources.some(s=>!https(s.url)||!nonempty(s.title)))fail('invalid sources');
  const sources=new Set(e.sources.map(s=>s.url)),o=e.original,t=e.translation;
  if(!o||!https(o.sourceUrl)||!sources.has(o.sourceUrl)||!https(o.licenseUrl)||![o.license,o.creator,o.note].every(nonempty))fail('original lacks source or rights');
  if(o.kind==='text'){if(!nonempty(o.text))fail('missing original-language text');}
  else if(o.kind==='image'){
   if(!o.file||!/^[a-z0-9-]+\.(jpg|jpeg|png|webp)$/.test(o.file)||!https(o.imageUrl)||!o.sha256||!/^[0-9a-f]{64}$/.test(o.sha256)||![o.width,o.height].every(n=>typeof n==='number'&&Number.isSafeInteger(n)&&n>0))fail('image is not a verified local asset');
  }else fail('invalid original type');
  if(!t||![t.text,t.translator,t.rightsNote].every(nonempty)||!['excerpt','complete'].includes(t.kind)||!https(t.sourceUrl)||!sources.has(t.sourceUrl)||t.licenseUrl!==undefined&&!https(t.licenseUrl))fail('translation lacks source or credit');
 }
 return input as WritingExample[];
}
export async function readWritingExamples():Promise<WritingExample[]>{
 const files=await readdir('data/writing-examples');const rows=[];
 for(const file of files.filter(f=>f.endsWith('.json')).sort()){
  const data=JSON.parse(await readFile('data/writing-examples/'+file,'utf8'));
  if(data.schemaVersion!==1)throw Error('Unknown writing collection schema');rows.push(...data.examples);
 }
 return validateWritingExamples(rows);
}
export function writingCollectionHTML(examples:WritingExample[],filters=true):string{
 if(!examples.length)return '';
 const languages=[...new Set(examples.map(e=>e.language))].sort(),genres=[...new Set(examples.map(e=>e.genre))].sort();
 return `<section id="everyday-texts" class="writing-collection"><h2>Originals and translations · ordinary lives in writing</h2><p>Payments, animals, deliveries, disputes, household instructions and the occasional celebration. Originals appear as artifact photographs or credited original-language transcriptions; a transcription uses modern type, not an imitation of an ancient hand. Each English excerpt is labeled and linked to its edition.</p>${filters?`<nav aria-label="Americas reading context"><p>Continue into the Americas: <a href="maya-centers.html">Maya places</a> · <a href="maya-culture.html">Maya histories</a> · <a href="monte-alban.html">Monte Albán and the Oaxaca valleys</a> · <a href="inca-civilization.html">Inka histories</a>. Colonial texts retain their own dates and circumstances.</p></nav><div class="writing-filters"><label>Find a word or object<input type="search" id="writing-search" placeholder="Try donkey, bread, debt, neighbor…"></label><label>Language<select id="writing-language"><option value="">All languages</option>${languages.map(l=>`<option>${esc(l)}</option>`).join('')}</select></label><label>Kind of text<select id="writing-genre"><option value="">All kinds</option>${genres.map(g=>`<option>${esc(g)}</option>`).join('')}</select></label><label>Region<select id="writing-region"><option value="">Across the atlases</option><option value="americas">Americas</option><option value="africa">Africa</option><option value="europe">Europe &amp; Mediterranean</option><option value="asia-pacific">Asia &amp; Pacific</option></select></label><button type="button" id="writing-reset">Show everything</button></div><p id="writing-result-count" role="status">${examples.length} texts to explore</p>`:''}<div class="writing-examples">${examples.map(e=>{
 const o=e.original,t=e.translation;
 return `<article id="text-${esc(e.id)}" class="writing-example" data-writing-language="${esc(e.language)}" data-writing-genre="${esc(e.genre)}" data-writing-region="${esc(e.atlasIds.join(' '))}"><div class="eyebrow">${esc(e.language)} · ${esc(e.genre)}</div><h3>${esc(e.title)}</h3><p class="writing-identity">${esc(e.date)} · ${esc(e.place)}<br>${esc(e.objectId)}</p><p>${esc(e.context)}</p><div class="writing-pair"><section><h4>${o.kind==='image'?'The surviving object':'Original-language text'}</h4>${o.kind==='image'?`<a href="writing-media/${esc(o.file!)}"><img src="writing-media/${esc(o.file!)}" width="${o.width}" height="${o.height}" loading="lazy" decoding="async" alt="${esc(e.objectId)}: original ${esc(e.script)} writing; see the witness note below"></a><p><a href="writing-media/${esc(o.file!)}">Open the full-size original image ↗</a></p>`:`<div class="original-text" lang="${originalLanguageTag(e.language)}" dir="auto">${esc(o.text!)}</div>`}<p class="witness-note">${esc(o.note)}</p><p class="writing-credit">${esc(o.creator)} · <a href="${esc(o.sourceUrl)}">Original source</a> · <a href="${esc(o.licenseUrl)}">${esc(o.license)}</a></p></section><section><h4>English translation · ${t.kind}</h4><blockquote>${esc(t.text)}</blockquote><p class="writing-credit">${esc(t.translator)} · <a href="${esc(t.sourceUrl)}">Read the published translation</a></p><p class="writing-credit">${esc(t.rightsNote)}${t.licenseUrl?` <a href="${esc(t.licenseUrl)}">${esc(t.license??'Translation license')}</a>`:''}</p></section></div><details><summary>Object, sources and reading notes</summary><ul>${e.sources.map(s=>`<li><a href="${esc(s.url)}">${esc(s.title)}</a></li>`).join('')}</ul><p>${e.coordinates?`Approximate geographical reference: ${e.coordinates[1]}°, ${e.coordinates[0]}°. Read the place description for findspot or collection context.`:'No location is plotted where the provenance is insufficient.'} A translated excerpt is only part of the witness; consult the edition for uncertain signs, missing passages and alternative readings.</p></details></article>`;
 }).join('')}</div>${filters?'<p id="writing-empty" hidden>No matching texts. Try a different word or show everything.</p><script src="writing-collection.js" defer></script>':''}</section>`;
}
export async function copyWritingAssets(){
 await mkdir('sites/writing-media',{recursive:true});
 const examples=await readWritingExamples();
 for(const e of examples)if(e.original.kind==='image'){
  const o=e.original,bytes=await readFile('data/writing-media/'+o.file);
  if(createHash('sha256').update(bytes).digest('hex')!==o.sha256)throw Error('Writing image checksum mismatch '+e.id);
  await copyFile('data/writing-media/'+o.file,'sites/writing-media/'+o.file);
 }
 for(const file of ['NotoSansCuneiform-Regular.ttf','NotoSansCuneiform-OFL.txt','NotoSansCoptic-Regular.ttf','NotoSansCoptic-OFL.txt'])await copyFile('data/writing-media/'+file,'sites/writing-media/'+file);
 await copyFile('scripts/writing-collection-browser.js','sites/writing-collection.js');return examples;
}
export const writingCollectionCSS=`@font-face{font-family:AtlasCuneiform;src:url('writing-media/NotoSansCuneiform-Regular.ttf')}@font-face{font-family:AtlasCoptic;src:url('writing-media/NotoSansCoptic-Regular.ttf')}.writing-filters{display:flex;gap:1rem;flex-wrap:wrap;padding:1rem;background:#e8f0ed;border:1px solid #a9c0b9;border-radius:8px}.writing-filters label{min-width:0;display:flex;flex:1 1 170px;flex-direction:column;font-size:.85rem;font-weight:bold}.writing-filters input,.writing-filters select,.writing-filters button{font:inherit;padding:.65rem;border:1px solid #8da7ac;max-width:100%;min-height:44px}.writing-filters button{align-self:end;cursor:pointer}.writing-example{padding:1.5rem 0;border-top:2px solid #c2d3d4;scroll-margin-top:1rem}.writing-example>h3{font-size:1.6rem}.writing-identity{color:#6b521f}.writing-pair{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem}.writing-pair section{min-width:0}.writing-pair img{width:100%;height:auto;max-height:480px;object-fit:contain;background:#eee8dc}.original-text{font-family:AtlasCuneiform,AtlasCoptic,'Segoe UI Historic',serif;white-space:pre-wrap;overflow-wrap:anywhere;font-size:1.35rem;line-height:1.9;padding:1rem;background:#f2eee3;max-height:500px;overflow:auto}.writing-pair blockquote{margin:0;padding:1rem 1.2rem;background:#eaf3f2;border-left:4px solid #217387;white-space:pre-wrap}.writing-credit,.witness-note{font-size:.85rem;overflow-wrap:anywhere}.writing-example[hidden]{display:none}@media(max-width:700px){.writing-pair{grid-template-columns:1fr}.writing-example>h3{font-size:1.3rem}}`;
