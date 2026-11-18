import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { marked } from 'marked';
import {copyReferenceMaps,referenceMapsHTML,type GuideReferenceMaps} from './guide-reference-maps';
import {guideMapViewerCSS} from '../src/guide-map-viewer';
import {createSiteOverview,createGuideMaps,siteOverviewHTML} from '../src/site-overview-map';
import type {SiteGuide} from '../src/site-guides';
import {createHash} from 'node:crypto';
import { roadMapHTML, type RoadNetwork } from '../src/road-map';
import type { EvidenceRecord } from '../src/model';
import { guideNarrativeHTML, guideReadingHTML, copyGuideMedia, guideReadingCSS, type Enrichment, type GuideMedia } from './guide-enrichment';
import { buildSourceAttributions, attributionCSS } from './source-attribution-build';
import { guideConnectionsHTML, guideConnectionsCSS } from './guide-connections';
import { topics } from '../src/topic-dives';
import { villagePlansHTML, villagePlanCSS, type VillagePlan } from './village-plan-build';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
/** Safe rendering for independently authored Markdown. Raw third-party research
 * reports are not inputs to the public site-guide build. */
export function researchMarkdown(document: string): string {
  return marked.parse(document.replace(/</g, '&lt;'), { async: false, walkTokens(token) {
    if (token.type === 'link' || token.type === 'image') {
      // Older paper URLs and automatically linked author addresses occur in
      // verbatim source excerpts. Preserve these inert protocols, never scripts.
      if (!token.href.startsWith('#') && !/^(?:https?:\/\/|mailto:)[^\u0000-\u0020]+$/i.test(token.href)) throw new Error('Unsafe research link');
    }
  } }) as string;
}
type Paragraph = {text:string;sources:string[]};
type Content = {id:string;title:string;intro:string;sections:{heading:string;paragraphs:Paragraph[];rows:{name:string;dates:string;architecture:string;limits:string;sources:string[]}[]}[];sources:{url:string;title:string}[];roadNetwork?:RoadNetwork};
type Guide = SiteGuide;
type ResearchStatus = {id:string;title:string;url:string;publication:'private-source-links-only'|'original-source-review'};
export function researchStatusHTML(review:ResearchStatus):string {
  if(review.publication==='original-source-review'){
    const url=new URL(review.url);if(url.protocol!=='https:'||url.username||url.password)throw Error('Unsafe research source');
    return `<div class="eyebrow">RESEARCH SOURCE STATUS</div><h1>${esc(review.title)}</h1><p>This study was assembled from cited original publications and institutional records. Source-check notes are retained privately. Public guides contain independently authored summaries, dated evidence and links to the sources checked.</p><p><a href="${esc(review.url)}">Read the coverage review and source decisions</a></p>`;
  }
  if(review.publication!=='private-source-links-only') throw Error('Research requires private source status');
  const url=new URL(review.url);
  if(url.protocol!=='https:' || url.hostname!=='consensus.app' || url.username || url.password) throw Error('Unsafe research source');
  return `<div class="eyebrow">RESEARCH SOURCE STATUS</div><h1>${esc(review.title)}</h1><div class="notice"><p>The original third-party research response is retained privately and is not included in this public distribution. Its redistribution permission has not been established.</p><p><a href="${esc(review.url)}">Open the research source on Consensus ↗</a></p></div><p>The independently written place guides and their linked scholarly sources remain available. Source access may depend on the provider.</p>`;
}
const css = `:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f7fafb;color:#17243d;font:16px/1.65 system-ui,sans-serif}a{color:#08758d}header{padding:1rem 5%;background:white;border-bottom:1px solid #d5e0e5}header a{margin-right:1.5rem}main{max-width:1160px;margin:auto;padding:2rem 2rem 6rem}h1{font-size:clamp(2rem,5vw,3.3rem);line-height:1.15}h2{margin-top:2.8rem;scroll-margin-top:1rem}h3{line-height:1.3}.eyebrow{font-size:.8rem;text-transform:uppercase;letter-spacing:.12em}.lead{font-size:1.2rem;max-width:75ch}.notice{border-left:4px solid #087d95;background:#eaf4f6;padding:1rem 1.4rem}table{width:100%;border-collapse:collapse;font-size:.93rem}td,th{vertical-align:top;text-align:left;padding:.75rem;border:1px solid #c8d6dd}th{background:#e4eef2}.table-scroll{overflow:auto}.source-links a{margin-right:.6rem}details{padding:1rem;border:1px solid #c8d6dd;margin-top:1rem}summary{cursor:pointer;font-weight:bold}.site-card{background:white;border:1px solid #c8d6dd;padding:1.2rem;margin:1rem 0}.site-card p{max-width:85ch}.road-map>svg{width:100%;height:auto}.road-map text{font-family:system-ui,sans-serif}.local-nav{display:flex;flex-wrap:wrap;gap:1rem}footer{padding:2rem;border-top:1px solid #c8d6dd}code{overflow-wrap:anywhere}.site-overview{margin:1.5rem 0 2rem}.site-overview h2{margin-top:1rem}.site-overview figcaption{font-size:.82rem;margin:.6rem 0}.site-overview-key{font-size:.9rem}.site-overview-key>li{margin:.6rem 0;padding:.4rem}.site-overview-key details{padding:.4rem .6rem;margin:.2rem 0}.site-overview svg a:focus-visible{outline:3px solid #b66c00}.site-overview svg a:hover rect{fill:#fff3cc}@media(max-width:650px){main{padding:1rem 1rem 4rem}td,th{padding:.45rem}}`;
export function shell(title:string, body:string, up='../', pageCSS=''):string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} · Americas Peoples</title><style>${css}${body.includes('data-map-viewer')?guideMapViewerCSS:''}${guideReadingCSS}${attributionCSS}${guideConnectionsCSS}${pageCSS}@media(min-width:1550px){main{margin-left:220px;max-width:calc(100% - 260px)}.local-nav{position:fixed;left:18px;top:100px;width:180px;display:flex;flex-direction:column;font-size:.85rem;max-height:75vh;overflow:auto}}</style></head><body><header><a href="${up}#map">Americas Peoples · Map</a><a href="${up}#dives">Deep dives</a><a href="${up}sites/sources-attributions.html">Sources &amp; licenses</a><a href="https://tripofisch.com/privacy/">Privacy &amp; analytics</a></header><main>${body}</main><footer>TripoFisch · Americas Peoples · Places, people and their histories · Sources linked throughout.</footer>${body.includes('data-map-viewer')?`<script type="module" src="${up}sites/guide-map-viewer.js"></script>`:''}</body></html>`;
}
const links = (urls:string[]) => `<span class="source-links">${urls.map((u,i) => {if(!u.startsWith('https://')) throw Error('Unsafe page source');return `<a href="${esc(u)}">Source ${i+1} ↗</a>`;}).join(' ')}</span>`;
export async function buildSiteGuides():Promise<void> {
  const enrichment = JSON.parse(await readFile('data/guide-enrichment.json','utf8')) as Enrichment;
  const media = JSON.parse(await readFile('data/guide-media/manifest.json','utf8')) as GuideMedia;
  const {guides} = JSON.parse(await readFile('data/site-guides.json','utf8')) as {guides:Guide[]};
  const {pages} = JSON.parse(await readFile('data/site-guide-content.json','utf8')) as {pages:Content[]};
  const {reviews} = JSON.parse(await readFile('data/site-research-reviews.json','utf8')) as {reviews:ResearchStatus[]};
  const {records} = JSON.parse(await readFile('dist/dataset.json','utf8')) as {records:EvidenceRecord[]};
  const { plans } = JSON.parse(await readFile('data/village-plans.json', 'utf8')) as { plans: VillagePlan[] };
  const guideIds = new Set(guides.map(guide => guide.id));
  if (!Array.isArray(plans) || plans.some(plan => !plan || !guideIds.has(plan.guideId))) {
    throw new Error('Village plans require registered guides');
  }
  for (const image of media.images) {
    if (image.role === 'site-plan' && !plans.some(plan => plan.mediaId === image.id)) {
      throw new Error('Missing village plan for guide image: ' + image.id);
    }
  }
  const villageSections = new Map(guides.map(guide => [guide.id, villagePlansHTML(guide.id, plans, media, records)]));
  await copyGuideMedia(media);
  const referenceMaps=JSON.parse(await readFile('data/guide-maps/manifest.json','utf8')) as GuideReferenceMaps;
  await copyReferenceMaps(referenceMaps);
  const terrain=JSON.parse(await readFile('data/guide-terrain/sources.json','utf8')) as {maps:{id:string;bounds:number[];file:string;contourIntervalMeters:number;sha256:string;pixels:number[];sampleSpacingMeters?:number}[]};
  const reports = new Map(reviews.map(r => [r.id,r]));
  await mkdir('sites/reports',{recursive:true});
  for(const review of reviews) {
    await writeFile(`sites/reports/${review.id}.html`,shell(review.title,researchStatusHTML(review),'../../'));
    if(review.publication==='original-source-review'){
      await writeFile(`sites/reports/${review.id}.md`,`# ${review.title}\n\nThis study uses original publications and institutional records. Source-check notes are retained privately; public guides present independently authored summaries and source links.\n\n[Coverage review and source decisions](${review.url})\n`);
      continue;
    }
    await writeFile(`sites/reports/${review.id}.md`,`# ${review.title}\n\nThe original third-party research response is retained privately and is not included in this public distribution. Redistribution permission has not been established.\n\n[Open the research source on Consensus](${review.url})\n\nIndependently written place guides and their scholarly source links remain available in the atlas.\n`);
  }
  for(const guide of guides) {
    const content = pages.find(p => p.id===guide.id);
    if(!content || !content.sections.length) throw Error('Missing populated site guide '+guide.id);
    const review = reports.get(guide.report);if(!review) throw Error('Missing research source status '+guide.report);
    const includedIds=new Set([...guide.recordIds,...guide.referenceRecordIds??[]]);
    const rows = records.filter(r => includedIds.has(r.id));
    const overview=guide.kind==='culture'?null:createSiteOverview(guide,records,guides);
    let overviewHTML='';
    for(const map of guide.kind==='culture'?[]:createGuideMaps(guide,records,guides)){
      const asset=terrain.maps.find(m=>m.id===map.id);
      if(!asset || asset.bounds.some((n,i)=>Math.abs(n-map.bounds[i])>1e-8))throw Error('Unregistered terrain '+map.id);
      const bytes=await readFile('data/guide-terrain/'+asset.file);
      if(createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw Error('Terrain hash mismatch '+map.id);
      overviewHTML+=siteOverviewHTML(map).replace('</figcaption>',` Contours: ${asset.contourIntervalMeters} metres. <a href="../guide-terrain/${esc(asset.file)}" target="_blank" rel="noopener">Open ${asset.pixels[0].toLocaleString()} × ${asset.pixels[1].toLocaleString()} relief image</a> · <a href="../guide-terrain/sources.json">Map sources and resolution</a> · <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md">Terrain credits</a>.</figcaption>`);
      overviewHTML+=`<p class="map-quality">${esc(map.scopeNote??'The map covers the named places in this study; wider exchange connections remain in the shared atlas.')} Elevation-tile sampling${asset.sampleSpacingMeters?' is about '+asset.sampleSpacingMeters+' metres at the map centre':''}; source surveys vary in resolution. Image pixels and contour spacing do not imply surveyed accuracy or building detail.</p>`;
    }
    const related = guideConnectionsHTML(guide.id,guides,topics);
    const parent=guides.find(g=>g.id===guide.parentGuideId);
    const children=guides.filter(g=>g.parentGuideId===guide.id);
    const regionalNav=`${parent?`<p>Part of <a href="${esc(parent.id)}.html">${esc(parent.title)}</a>${parent.storyId?` · <a href="../#story/${esc(parent.storyId)}">Watch the regional movie ↗</a>`:''}</p>`:''}${children.length?`<section class="notice"><h2>Look closer at the places</h2><p>Explore each local history within this connected region.</p><ul>${children.map(g=>`<li><a href="${esc(g.id)}.html">${esc(g.title)}</a>${g.storyId?` · <a href="../#story/${esc(g.storyId)}">Contextual movie ↗</a>`:''}</li>`).join('')}</ul></section>`:''}`;
    const villagePlans = villageSections.get(guide.id) ?? '';
    const narrative = guideNarrativeHTML(guide.id,enrichment,media);
    const furtherReading = guideReadingHTML(guide.id,content.sources,enrichment);
    const sections=content?.sections.map((s,i) => `<section id="section-${i}"><h2>${esc(s.heading)}</h2>${s.paragraphs.map(p => `<p>${esc(p.text)} ${links(p.sources)}</p>`).join('')}${s.rows.length?`<div class="table-scroll"><table><thead><tr><th>Site / structure</th><th>Dates and methods</th><th>Organization / architecture</th><th>Limits and sources</th></tr></thead><tbody>${s.rows.map(r=>`<tr><th>${esc(r.name)}</th><td>${esc(r.dates)}</td><td>${esc(r.architecture)}</td><td>${esc(r.limits)}<p>${links(r.sources)}</p></td></tr>`).join('')}</tbody></table></div>`:''}</section>`).join('') ?? '';
    const evidence=rows.map(r=>`<article class="site-card"><h3>${esc(r.title)}</h3><p>${esc(r.review.summary)}</p><details><summary>Dates and evidence notes</summary><p><strong>Source dates:</strong> ${esc(r.time.original)}<br><strong>Dating method:</strong> ${esc(r.time.method)}</p><p>${esc(r.review.limitations)}</p></details><p><a href="../#review/${encodeURIComponent(r.id)}">Read the history &amp; sources ↗</a></p></article>`).join('');
    await writeFile(guide.href,shell(guide.title,`<div class="eyebrow">${esc(guide.region)} · ${guide.kind==='culture'?'CULTURE / CIVILIZATION':'PLACE / COMPLEX'}</div><h1>${esc(guide.title)}</h1><p class="lead">${esc(content?.intro ?? guide.description)}</p><p><a href="../#dives/${guide.topicId?'subjects':guide.kind==='culture'?'cultures':'places'}">Browse ${guide.topicId?'subject':guide.kind==='culture'?'culture':'place'} deep dives</a>${guide.topicId?` · <a href="../#topic/${esc(guide.topicId)}">Watch the independent movie</a>`:guide.storyId?` · <a href="../#story/${esc(guide.storyId)}">Watch the contextual movie</a>`:''}</p>${overviewHTML}${referenceMapsHTML(guide.id,referenceMaps)}${villagePlans}${regionalNav}${narrative}<nav class="local-nav" aria-label="Page sections">${narrative?'<a href="#historical-narrative">A closer reading</a>':''}${overview?`<a href="#site-overview-${esc(guide.id)}-heading">Labeled terrain map</a>`:''}${referenceMaps.assets.some(m=>m.guideIds.includes(guide.id))||referenceMaps.linkedReferences.some(m=>m.guideIds.includes(guide.id))?'<a href="#area-reference-maps">Wider-area survey maps</a>':''}${villagePlans?'<a href="#village-plans">Village plans</a>':''}<a href="#architecture">${guide.kind==='culture'?'Culture overview':'Sites &amp; architecture'}</a>${content.roadNetwork?'<a href="#roads">Road-network map</a>':''}${content.sections.map((section,i)=>`<a href="#section-${i}">${esc(section.heading)}</a>`).join('')}<a href="#evidence">Atlas evidence</a>${related?'<a href="#related-dives">Related dives</a>':''}<a href="#further-reading">Further reading</a><a href="#research">Research source</a><a href="#sources">Sources</a></nav>${content?.roadNetwork?`<div id="roads">${roadMapHTML(content.roadNetwork)}</div>`:''}<div id="architecture">${sections}</div><section id="evidence"><h2>Places, finds and events on the map</h2>${evidence||'<p>The linked scholarly sources provide background. Site-level findings are mapped only with qualified dates and locations; this page does not invent settlement dots.</p>'}</section>${related}${furtherReading}<section id="research"><h2>Research source</h2><p><a href="reports/${esc(review.id)}.html">Research source and access status ↗</a></p><p>${review.publication==='original-source-review'?'This guide uses original publications and institutional records; source-check notes remain private.':'The original third-party research response is retained privately. This public guide presents independently written, source-linked material; raw research responses are not redistributed.'}</p></section><section id="sources"><h2>Page sources</h2><ul>${content?.sources.map(s=>`<li><a href="${esc(s.url)}">${esc(s.title)} ↗</a></li>`).join('')??''}</ul><p>The editorial summaries above use linked scholarly and institutional sources. Research leads do not replace the atlas’s individually reviewed evidence records.</p></section>`, '../', villagePlans ? villagePlanCSS : ''));
  }
  await buildSourceAttributions(shell);
  await writeFile('sites/guide-reuse.html',shell('Guide writing and image reuse',researchMarkdown(await readFile('docs/guide-reuse.md','utf8'))));
  await writeFile('sites/index.html',shell('Place and culture guides',`<h1>Place and culture guides</h1><p><a href="../#dives">Browse all deep dives: Subjects, Places, Languages and Cultures</a></p>${['site','culture'].map(kind=>`<h2>${kind==='site'?'Places and complexes':'Cultures and civilizations'}</h2><ul>${guides.filter(g=>(g.kind??'site')===kind).map(g=>`<li><a href="${esc(g.id)}.html">${esc(g.title)}</a> — ${esc(g.region)}</li>`).join('')}</ul>`).join('')}`));
}
