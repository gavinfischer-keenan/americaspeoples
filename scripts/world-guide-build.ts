import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {geoMercator,geoPath,type GeoPermissibleObjects} from 'd3-geo';
import {worldMapLayout,type WorldGuide} from '../src/world-guide-model';
import {mapViewerStart} from '../src/guide-map-viewer';
import {esc} from '../src/dom';
import {readWorldGuides} from './world-guide-data';
import {worldVoyagesHTML,type AtlasVoyageLink} from './world-voyage-links';
import type {Voyage} from '../src/voyages';
import {copyWritingAssets,writingCollectionHTML,writingCollectionCSS} from './writing-collection';
import {copyWorldGuideMedia,worldGuideMediaHTML,worldGuideMediaCSS} from './world-guide-media';

type Terrain={id:string;bounds:number[];file:string;sha256:string;pixels:number[];sampleSpacingMeters:number;contourIntervalMeters:number};
const atlasNames={americas:'Americas & Pacific',africa:'Africa & Middle East',europe:'Europe & Mediterranean','asia-pacific':'Asia'};
const sourceLinks=(urls:string[],g:WorldGuide)=>`<span class="world-citations">${urls.map(u=>`<a href="${esc(u)}">[${g.sources.findIndex(s=>s.url===u)+1}]</a>`).join(' ')}</span>`;

export function worldGuideHTML(g:WorldGuide,guides:WorldGuide[],land:GeoPermissibleObjects,terrain?:Terrain,voyagesHTML='',rivers?:GeoPermissibleObjects,writingHTML='',mediaHTML=''):string{
 const layout=worldMapLayout(g),[w,,e,n]=layout.bounds;
 const north=Math.log(Math.tan(Math.PI/4+n*Math.PI/360));
 const scale=1200/((e-w)*Math.PI/180);
 const projection=geoMercator().rotate([-(w+e)/2,0]).scale(scale).translate([600,north*scale]).clipExtent([[0,0],[1200,layout.height]]);
 const path=geoPath(projection);
 const pins=g.map.points.map(p=>layout.project(p.coordinates));
 const labels:[number,number][]=[];
 for(const [i,[x,y]] of pins.entries()){
  const available=(lx:number,ly:number)=>
   labels.every(([a,b])=>Math.hypot(a-lx,b-ly)>=29)&&
   pins.every(([a,b],j)=>j===i||Math.hypot(a-lx,b-ly)>=17);
  let position:[number,number]|undefined;
  for(let step=0;step<500&&!position;step++){
   const radius=step?24+8*Math.sqrt(step):0,angle=step*2.4;
   const lx=Math.max(16,Math.min(1184,x+radius*Math.cos(angle)));
   const ly=Math.max(40,Math.min(layout.height-32,y+radius*Math.sin(angle)));
   if(available(lx,ly))position=[lx,ly];
  }
  // A crowded cluster can exhaust the local search. Check the rest of the map.
  for(let ly=40;!position&&ly<=layout.height-32;ly+=15){
   for(let lx=16;lx<=1184;lx+=15)if(available(lx,ly)){position=[lx,ly];break;}
  }
  if(!position)throw Error(g.id+': no space for the locality label '+g.map.points[i].id);
  labels.push(position);
 }
 const leaders=pins.map(([x,y],i)=>`<path d="M${x},${y}L${labels[i][0]},${labels[i][1]}" stroke="#173f4c" stroke-width="1.4"/>`).join('');
 const points=leaders+g.map.points.map((p,i)=>{
  const [x,y]=pins[i],[lx,ly]=labels[i];
  return `<a href="#find-${esc(p.id)}" aria-label="${i+1}. ${esc(p.label)}: ${esc(p.date)}"><circle cx="${x}" cy="${y}" r="3" fill="#173f4c"/><circle cx="${lx}" cy="${ly}" r="13" fill="#183f4c" stroke="#ffe0a0" stroke-width="2"/><text x="${lx}" y="${ly+4}" text-anchor="middle" fill="white" font-size="12" font-family="system-ui">${i+1}</text></a>`;
 }).join('');
 const grid=[0,.25,.5,.75,1].map(t=>{const x=1200*t,lon=w+(e-w)*t;return `<path d="M${x},0V${layout.height}" stroke="#31565f" opacity=".2"/><text x="${Math.min(1140,x+8)}" y="${layout.height-10}" font-size="14" fill="#173c49">${(lon>180?lon-360:lon).toFixed(2)}°</text>`;}).join('');
 const map=`<section id="area-map"><h2>The whole area in view</h2><p>${esc(g.map.scope)}</p><figure class="world-map">${mapViewerStart(g.title)}<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 ${layout.height}" role="img" aria-label="Numbered locality map of ${esc(g.title)}. Full names and dates follow below."><rect width="1200" height="${layout.height}" fill="#d8e7e9"/>${terrain?`<image href="../guide-terrain/${esc(terrain.file)}" width="1200" height="${layout.height}" preserveAspectRatio="none"/>`:''}<path d="${path(land)??''}" fill="${terrain?'none':'#d1ddc1'}" stroke="#50757b" stroke-width="1"/>${rivers?`<path d="${path(rivers)??''}" fill="none" stroke="#367b98" stroke-width="1.5"/>`:''}${grid}<text x="20" y="30" fill="#173c49" font-size="18">N ↑</text>${points}</svg></div></div><figcaption>Modern terrain and coastlines; not a reconstruction of an ancient landscape. Blue lines are generalized modern rivers, not surveyed ancient channels. Small dots locate the evidence; numbered labels use leader lines where crowded. These points do not mark territorial extent. ${terrain?`<a href="../guide-terrain/${esc(terrain.file)}">Open full-resolution relief (${terrain.pixels.join(' × ')} pixels)</a>. Elevation sample spacing around ${terrain.sampleSpacingMeters} m at the centre; contours ${terrain.contourIntervalMeters} m. Source survey resolution varies. <a href="../guide-terrain/sources.json">Terrain provenance</a> · <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md">Tilezen terrain credits</a>.`:''} <a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth: public domain coastlines</a>.</figcaption></figure><ol class="world-findings">${g.map.points.map(p=>`<li id="find-${esc(p.id)}"><h3>${esc(p.label)}</h3><p class="find-date">${esc(p.date)}</p><p>${esc(p.description)} ${sourceLinks(p.sources,g)}</p><p class="map-quality">Map reference: ${p.coordinates[1]}°, ${p.coordinates[0]}°. Approximate unless the source establishes a surveyed position.</p></li>`).join('')}</ol></section>`;
 const sections=g.sections.map((section,i)=>`<section id="reading-${i}"><h2>${esc(section.heading)}</h2>${section.paragraphs.map(p=>`<p>${esc(p.text)} ${sourceLinks(p.sources,g)}</p>`).join('')}${section.rows?.length?`<div class="table-scroll"><table><thead><tr>${section.columns!.map(c=>`<th scope="col">${esc(c)}</th>`).join('')}<th scope="col">Sources</th></tr></thead><tbody>${section.rows.map(r=>`<tr>${r.cells.map((c,i)=>i?`<td>${esc(c)}</td>`:`<th scope="row">${esc(c)}</th>`).join('')}<td>${sourceLinks(r.sources,g)}</td></tr>`).join('')}</tbody></table></div>`:''}</section>`).join('');
 const references=g.referenceMaps?.length?`<section id="reference-maps"><h2>Archaeological plans and wider reference maps</h2><p>Open the source maps for their original detail, legends and dates. Their coverage and reproduction terms belong to the issuing institution.</p>${g.referenceMaps.map(m=>`<article class="site-card"><h3><a href="${esc(m.url)}">${esc(m.title)} ↗</a></h3><p>${esc(m.description)}</p></article>`).join('')}</section>`:'';
 const studyId=({'world-genghis-khan':'genghis-khan','world-marco-polo':'marco-polo','world-silk-roads':'silk-roads','world-hannibal':'hannibal','world-ibn-fadlan':'ibn-fadlan','world-chinese-explorers':'chinese-explorers','world-ancient-shipwrecks':'ancient-shipwrecks','world-roman-empire':'roman-empire'} as Record<string,string>)[g.id];
 const related=g.relatedGuideIds?.map(id=>guides.find(item=>item.id===id)!).filter(Boolean)??[];
 return `<div class="eyebrow">THE HUMAN ATLASES · DEEP DIVE</div><h1>${esc(g.title)}</h1><p class="lead">${esc(g.intro)}</p><p>${esc(g.scope)}</p><nav class="world-atlas-links" aria-label="Atlas homes">${g.id==='world-everyday-writing'?'<a href="../#map">← Americas</a> · ':''}${g.atlasIds.map(a=>`<a href="../${a==='americas'?'#movie':'#atlas/'+a}">← ${esc(atlasNames[a])}</a>`).join(' · ')}</nav>${studyId?`<p><a class="world-study-play" href="../#study/${studyId}">Play the dated map: ${esc(g.title)} →</a></p>`:g.id==='world-human-family'?'<p><a class="world-study-play" href="../#origins">Play the human-family map →</a></p>':''}<nav class="local-nav" aria-label="Page sections">${writingHTML?'<a href="#everyday-texts">Originals and translations</a>':''}<a href="#area-map">Map and dated finds</a>${g.sections.map((s,i)=>`<a href="#reading-${i}">${esc(s.heading)}</a>`).join('')}${references?'<a href="#reference-maps">Reference maps</a>':''}${voyagesHTML?'<a href="#connected-voyages">Connected voyages</a>':''}<a href="#sources">Sources</a></nav>${mediaHTML}${map}${sections}${references}${voyagesHTML}${writingHTML}${related.length?`<section><h2>Continue exploring</h2><ul>${related.map(r=>`<li><a href="${r.id}.html">${esc(r.title)}</a> — ${esc(r.description)}</li>`).join('')}</ul></section>`:''}<section id="sources"><h2>Sources for this guide</h2><ol>${g.sources.map((s,i)=>`<li id="source-${i+1}"><a href="${esc(s.url)}">${esc(s.title)}</a></li>`).join('')}</ol><p>Independently authored summaries. Geological ages, historical dates and modern discovery dates are kept distinct. Selected dated observations from linked studies also appear in the regional and world maps. Reading-map pins and narrative passages are not automatically separate events.</p></section>`;
}

export const worldGuideCSS=`.world-study-play{display:inline-block;padding:12px 18px;border:2px solid #244D26;background:#569E56;color:#10171A!important;border-radius:6px;font-weight:700;text-decoration:none}.world-study-play:hover{background:#72B273}.world-map{margin:1.5rem 0}.world-map figcaption{font-size:.85rem;margin-top:.6rem;color:#525D64}.world-findings{padding-left:2rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,310px),1fr));gap:1rem 2.5rem}.world-findings li{padding:.8rem 1rem;background:#F2F6F8;border:1px solid #B4BEC4;border-bottom:3px solid #3B783D;scroll-margin-top:1rem}.world-findings h3{margin:.3rem 0;color:#10171A}.world-findings p{margin:.5rem 0}.find-date{font-weight:700;color:#A63108}.world-citations{white-space:nowrap;font-size:.85rem}.world-citations a{margin-right:.4rem}.world-atlas-links{padding:.8rem 0}.voyage-stops{font-size:.9rem}.world-map svg a:focus-visible circle{stroke:#A63108;stroke-width:5}`;

export async function buildWorldGuides(shell:(title:string,body:string,up?:string,css?:string)=>string){
 const guides=await readWorldGuides();
 const writing=await copyWritingAssets();
 const media=await copyWorldGuideMedia();
 const land=JSON.parse(await readFile('data/land-detailed.geojson','utf8'));
 const rivers=JSON.parse(await readFile('data/world-guide-rivers.geojson','utf8'));
 const connections=JSON.parse(await readFile('data/atlas-voyage-links.json','utf8')) as {links:AtlasVoyageLink[]};
 const voyages=JSON.parse(await readFile('data/voyages.json','utf8')) as {voyages:Voyage[];sources:{id:string;title:string;url:string}[]};
 const terrain=JSON.parse(await readFile('data/guide-terrain/sources.json','utf8')) as {maps:Terrain[]};
 await mkdir('sites',{recursive:true});
 for(const guide of guides){
  const map=terrain.maps.find(m=>m.id===guide.id),layout=worldMapLayout(guide);
  if(!map||map.bounds.some((v,i)=>Math.abs(v-layout.bounds[i])>1e-8))throw Error('Missing or stale world terrain '+guide.id);
  const bytes=await readFile('data/guide-terrain/'+map.file);
  if(createHash('sha256').update(bytes).digest('hex')!==map.sha256)throw Error('World terrain hash mismatch '+guide.id);
  const connectionsHTML=guide.voyageIds&&guide.atlasIds[0]!=='americas'?worldVoyagesHTML(guide.atlasIds[0],connections.links,voyages.voyages,voyages.sources,guide.voyageIds):'';
  const allTexts=guide.id==='world-everyday-writing';
  const pairs=allTexts?writing:writing.filter(e=>e.guideIds?.includes(guide.id));
  const writingHTML=writingCollectionHTML(pairs,allTexts)+(pairs.length&&!allTexts?'<p><a href="world-everyday-writing.html#everyday-texts">Explore all original texts and translations →</a></p>':'');
  await writeFile(`sites/${guide.id}.html`,shell(guide.title,worldGuideHTML(guide,guides,land,map,connectionsHTML,rivers,writingHTML,worldGuideMediaHTML(guide.id,media)),'../',worldGuideCSS+worldGuideMediaCSS+(pairs.length?writingCollectionCSS:'')));
 }
 return guides;
}
