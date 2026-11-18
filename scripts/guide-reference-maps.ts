import {readFile,copyFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {esc} from '../src/dom';
import {mapViewerStart} from '../src/guide-map-viewer';

export interface ReferenceMap {id:string;guideIds:string[];title:string;scope:string;chronologicalScope:string;alt:string;file:string;pixels:number[];sha256:string;sourceUrl:string;originalAssetUrl:string;credit:string;rights:string;rightsUrl?:string;processing:string}
interface MapLink {guideIds:string[];title:string;sourceUrl:string;scope:string;credit:string;locator?:string;rights:string}
export interface GuideReferenceMaps {assets:ReferenceMap[];linkedReferences:MapLink[]}
const safe=(url:string)=>{if(!/^https:\/\/[^\s]+$/.test(url))throw Error('Unsafe map source URL');return esc(url);};
export async function copyReferenceMaps(manifest:GuideReferenceMaps){
 await mkdir('sites/maps',{recursive:true});
 for(const m of manifest.assets){
  if(!/^[a-z0-9-]+\.webp$/.test(m.file)||!m.pixels.every(Number.isFinite))throw Error('Invalid reference map '+m.id);
  const bytes=await readFile('data/guide-maps/'+m.file);
  if(createHash('sha256').update(bytes).digest('hex')!==m.sha256)throw Error('Reference map hash mismatch '+m.id);
  await copyFile('data/guide-maps/'+m.file,'sites/maps/'+m.file);
 }
 await copyFile('data/guide-maps/manifest.json','sites/maps/manifest.json');
}
export function referenceMapsHTML(id:string,manifest:GuideReferenceMaps):string{
 const maps=manifest.assets.filter(m=>m.guideIds.includes(id));
 const links=manifest.linkedReferences.filter(m=>m.guideIds.includes(id));
 if(!maps.length&&!links.length)return '';
 return `<section id="area-reference-maps"><h2>Maps of the wider area</h2><p>Open a whole sheet, zoom into its details, or inspect the original. These maps retain their own dates, legends and geographic scope.</p>${maps.map((m,index)=>`${index?`<details><summary>${esc(m.title)} · ${m.pixels[0].toLocaleString()} × ${m.pixels[1].toLocaleString()}</summary>`:""}<figure class="source-map"><h3>${esc(m.title)}</h3><p>${esc(m.scope)}</p>${mapViewerStart(m.title)}<img src="maps/${esc(m.file)}" width="${m.pixels[0]}" height="${m.pixels[1]}" alt="${esc(m.alt)}" loading="lazy" decoding="async"></div></div><figcaption>${esc(m.chronologicalScope)} ${esc(m.processing)}<br>${esc(m.credit)} · ${esc(m.rights)}<br><span class="source-map-links"><a href="maps/${esc(m.file)}" target="_blank" rel="noopener">Open ${m.pixels[0].toLocaleString()} × ${m.pixels[1].toLocaleString()} map</a><a href="${safe(m.sourceUrl)}" target="_blank" rel="noopener">Original map and legend</a>${m.rightsUrl?`<a href="${safe(m.rightsUrl)}">Rights and provenance</a>`:''}</span></figcaption></figure>${index?"</details>":""}`).join('')}${links.length?`<details><summary>More official maps and reference sheets</summary><ul>${links.map(m=>`<li><a href="${safe(m.sourceUrl)}" target="_blank" rel="noopener">${esc(m.title)}</a>${m.locator?' · '+esc(m.locator):''}<p>${esc(m.scope)} ${esc(m.credit)}</p></li>`).join('')}</ul></details>`:''}</section>`;
}
