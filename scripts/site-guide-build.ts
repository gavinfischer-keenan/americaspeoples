import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { marked } from 'marked';
import {copyReferenceMaps,referenceMapsHTML,type GuideReferenceMaps} from './guide-reference-maps';
import {guideMapViewerCSS} from '../src/guide-map-viewer';
import {createSiteOverview,createGuideMaps,siteOverviewHTML} from '../src/site-overview-map';
import type {SiteGuide} from '../src/site-guides';
import {createHash} from 'node:crypto';
import { roadMapHTML, type RoadNetwork } from '../src/road-map';
import type { EvidenceRecord } from '../src/model';
import { guideNarrativeHTML, guideReadingHTML, copyGuideMedia, guideReadingCSS, safeSourceURL, type Enrichment, type GuideMedia } from './guide-enrichment';
import { buildSourceAttributions, attributionCSS } from './source-attribution-build';
import { guideConnectionsHTML, guideConnectionsCSS } from './guide-connections';
import { topics } from '../src/topic-dives';
import { villagePlansHTML, villagePlanCSS, type VillagePlan } from './village-plan-build';
import {buildWorldGuides} from './world-guide-build';

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
type Content = {id:string;title:string;intro:string;sections:{heading:string;columns?:[string,string,string,string];paragraphs:Paragraph[];rows:{name:string;dates:string;architecture:string;limits:string;sources:string[]}[]}[];sources:{url:string;title:string}[];roadNetwork?:RoadNetwork};
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
  return `<div class="eyebrow">RESEARCH SOURCE STATUS</div><h1>${esc(review.title)}</h1><div class="notice"><p>We use Consensus to discover literature. Its full Deep Research reviews are retained privately; we do not reproduce them here.</p><p><a href="${esc(review.url)}">Explore this research on Consensus ↗</a></p></div><p>Visit Consensus to explore its reviews and the literature yourself; access may require your own account. The atlas’s own deep dives are separately authored and checked against linked primary sources.</p>`;
}
const css = `:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#E3E8EB;color:#10171A;font:16px/1.65 system-ui,sans-serif}a{color:#244D26}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #A63108;outline-offset:2px}
header.topbar{min-height:46px;padding:6px 18px;background:#10171A;border-bottom:1px solid #525D64;color:#F2F6F8;display:flex;align-items:center;gap:12px 16px;flex-wrap:wrap}
header.topbar .brand{display:flex;align-items:center;gap:9px;color:#F2F6F8;text-decoration:none;flex-shrink:0}
header.topbar .brand-mark{color:#72B273;font-size:16px;line-height:1}
header.topbar .brand strong{display:block;font-size:14px;font-weight:700;color:#F2F6F8;line-height:1.15;white-space:nowrap}
header.topbar .brand small{display:block;font-size:9px;letter-spacing:.14em;color:#B4BEC4;line-height:1.1}
header.topbar nav[aria-label="Main navigation"]{display:flex;flex-wrap:wrap;gap:4px;align-items:center}
header.topbar nav[aria-label="Main navigation"] a{padding:5px 10px;border-radius:5px;font-size:13px;font-weight:600;color:#F2F6F8;text-decoration:none;white-space:nowrap;line-height:1.2}
header.topbar nav[aria-label="Main navigation"] a:hover{background:#DCEBDD;color:#10171A}
header.topbar nav[aria-label="Main navigation"] a.active{background:#569E56;color:#10171A;font-weight:700}
header.topbar .header-about{margin-left:auto;color:#97C798;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap}
header.topbar .header-about:hover{color:#F2F6F8;text-decoration:underline}
main{max-width:1160px;margin:auto;padding:1.75rem 2rem 5rem}h1{font-size:clamp(2rem,4.5vw,3.1rem);line-height:1.15;color:#10171A;font-family:Georgia,serif;margin:.35rem 0 .85rem}h2{margin-top:2.4rem;scroll-margin-top:1rem;color:#10171A;font-family:Georgia,serif}h3{line-height:1.3;color:#10171A}.eyebrow{font-size:.78rem;text-transform:uppercase;letter-spacing:.12em;color:#3B783D;font-weight:700}.lead{font-size:1.15rem;max-width:75ch;color:#10171A}.notice{border-left:4px solid #3B783D;background:#DCEBDD;color:#10171A;padding:1rem 1.4rem;border-radius:0 6px 6px 0}table{width:100%;border-collapse:collapse;font-size:.93rem;background:#F2F6F8}td,th{vertical-align:top;text-align:left;padding:.75rem;border:1px solid #8E99A0}th{background:#CFD6DA;color:#10171A}.table-scroll{overflow:auto}.source-links a{margin-right:.6rem}details{padding:1rem;border:1px solid #8E99A0;background:#F2F6F8;margin-top:1rem;border-radius:6px}summary{cursor:pointer;font-weight:bold;color:#10171A}.site-card{background:#F2F6F8;border:1px solid #B4BEC4;border-radius:8px;padding:1.2rem;margin:1rem 0}.site-card p{max-width:85ch;color:#10171A}.road-map>svg{width:100%;height:auto}.road-map text{font-family:system-ui,sans-serif}.local-nav{display:flex;flex-wrap:wrap;gap:6px 10px;margin:1.1rem 0 1.4rem;padding:10px 12px;background:#F2F6F8;border:1px solid #B4BEC4;border-radius:8px}.local-nav a{font-size:.85rem;font-weight:600;padding:4px 9px;border-radius:5px;text-decoration:none;background:#E3E8EB;color:#10171A}.local-nav a:hover{background:#DCEBDD;color:#244D26}.atlas-crosslinks{margin:1.75rem 0;padding:1rem 1.25rem;background:#DCEBDD;border:1px solid #72B273;border-radius:8px}.atlas-crosslinks h2{margin-top:0}.atlas-crosslinks p{margin:.5rem 0 0;font-weight:600}.guide-crumb{font-size:.88rem;color:#525D64;margin:0 0 .85rem}.guide-crumb a{font-weight:600;text-decoration:none}.guide-crumb a:hover{text-decoration:underline}footer{padding:1.5rem 5%;border-top:1px solid #8E99A0;background:#CFD6DA;color:#10171A;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px 20px;font-size:.9rem}footer nav{display:flex;flex-wrap:wrap;gap:8px 16px}footer a{color:#244D26;font-weight:600}code{overflow-wrap:anywhere}.site-overview{margin:1.5rem 0 2rem}.site-overview h2{margin-top:1rem}.site-overview figcaption{font-size:.82rem;margin:.6rem 0;color:#525D64}.site-overview-key{font-size:.9rem}.site-overview-key>li{margin:.6rem 0;padding:.4rem}.site-overview-key details{padding:.4rem .6rem;margin:.2rem 0}.site-overview svg a:focus-visible{outline:3px solid #A63108}.site-overview svg a:hover rect{fill:#DCEBDD}@media(max-width:700px){header.topbar{padding:8px 10px;gap:6px}header.topbar nav[aria-label="Main navigation"] a{font-size:11.5px;padding:4px 7px}header.topbar .header-about{display:none}main{padding:1.1rem 1rem 4rem}td,th{padding:.45rem}}`;
export function shell(title:string, body:string, up='../', pageCSS='', activeNav='#dives'):string {
  const navItems:[string,string][]=[['#world','World'],['#movie','Americas'],['#atlas/pacific','Pacific'],['#atlas/africa','Africa'],['#atlas/europe','Europe'],['#atlas/asia-pacific','Asia'],['#explore','Explore'],['#dives','Deep dives'],['#physical','Climate'],['#library','Library']];
  const navHTML=navItems.map(([href,label])=>`<a href="${up}${href}"${href===activeNav?' class="active"':''}>${label}</a>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} · The Spread of Peoples</title><style>${css}${body.includes('data-map-viewer')?guideMapViewerCSS:''}${guideReadingCSS}${attributionCSS}${guideConnectionsCSS}${pageCSS}</style></head><body><header class="topbar"><a class="brand" href="${up}#world"><span class="brand-mark" aria-hidden="true">◈</span><span><strong>The Spread of Peoples</strong><small>ALASKA BLACKFISH</small></span></a><nav aria-label="Main navigation">${navHTML}</nav><a class="header-about" href="${up}#about" aria-label="About this atlas">About ↗</a></header><main>${body}</main><footer><span>TripoFisch · The Spread of Peoples</span><nav aria-label="Atlas footer"><a href="${up}sites/sources-attributions.html">Sources &amp; licenses</a><a href="${up}#library">Library</a><a href="${up}#about">Methodology</a><a href="https://tripofisch.com/privacy/">Privacy &amp; analytics</a></nav></footer>${body.includes('data-map-viewer')?`<script type="module" src="${up}sites/guide-map-viewer.js"></script>`:''}</body></html>`;
}
const links = (urls:string[]) => `<span class="source-links">${urls.map((u,i) => `<a href="${safeSourceURL(u)}">Source ${i+1} ↗</a>`).join(' ')}</span>`;
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
    await writeFile(`sites/reports/${review.id}.md`,`# ${review.title}\n\nWe use Consensus to discover literature. Its full Deep Research reviews are retained privately; we do not reproduce them here.\n\n[Explore this research on Consensus](${review.url})\n\nVisit Consensus to explore its reviews and the literature yourself; access may require your own account. The atlas’s own deep dives are separately authored and checked against linked primary sources.\n`);
  }
  for(const guide of guides) {
    const content = pages.find(p => p.id===guide.id);
    if(!content || !content.sections.length) throw Error('Missing populated site guide '+guide.id);
    const review = reports.get(guide.report);if(!review) throw Error('Missing research source status '+guide.report);
    const includedIds=new Set([...guide.recordIds,...guide.referenceRecordIds??[]]);
    const rows = records.filter(r => includedIds.has(r.id));
    const overview=guide.kind!=='site'?null:createSiteOverview(guide,records,guides);
    let overviewHTML='';
    for(const map of guide.kind==='culture'?[]:createGuideMaps(guide,records,guides)){
      const asset=terrain.maps.find(m=>m.id===map.id);
      if(!asset || asset.bounds.some((n,i)=>Math.abs(n-map.bounds[i])>1e-8))throw Error('Unregistered terrain '+map.id);
      const bytes=await readFile('data/guide-terrain/'+asset.file);
      if(createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw Error('Terrain hash mismatch '+map.id);
      overviewHTML+=siteOverviewHTML(map).replace('</figcaption>',` Contours: ${asset.contourIntervalMeters} metres. <a href="../guide-terrain/${esc(asset.file)}" target="_blank" rel="noopener">Open ${asset.pixels[0].toLocaleString()} × ${asset.pixels[1].toLocaleString()} relief image</a> · <a href="../guide-terrain/sources.json">Map sources and resolution</a> · <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md">Terrain credits</a>.</figcaption>`);
      overviewHTML+=`<p class="map-quality">${esc(map.scopeNote??'Mapped study area; wider exchange connections remain in the shared atlas.')}${asset.sampleSpacingMeters?' Terrain sampling ~'+asset.sampleSpacingMeters+' m at centre.':''}</p>`;
    }
    const related = guideConnectionsHTML(guide.id,guides,topics)+(['maya-centers','maya-culture','monte-alban','inca-civilization'].includes(guide.id)?'<section><h2>Read original Indigenous American texts</h2><p><a href="world-everyday-writing.html?region=americas#everyday-texts">Explore original writing beside English translations</a>: vessel labels, deliveries, property and irrigation, with pre-contact and colonial witnesses dated separately.</p></section>':'');
    const parent=guides.find(g=>g.id===guide.parentGuideId);
    const children=guides.filter(g=>g.parentGuideId===guide.id);
    const regionalNav=`${parent?`<p>Part of <a href="${esc(parent.id)}.html">${esc(parent.title)}</a>${parent.storyId?` · <a href="../#story/${esc(parent.storyId)}">Watch the regional movie ↗</a>`:''}</p>`:''}${children.length?`<section class="notice"><h2>Look closer at the places</h2><p>Explore each local history within this connected region.</p><ul>${children.map(g=>`<li><a href="${esc(g.id)}.html">${esc(g.title)}</a>${g.storyId?` · <a href="../#story/${esc(g.storyId)}">Contextual movie ↗</a>`:''}</li>`).join('')}</ul></section>`:''}`;
    const villagePlans = villageSections.get(guide.id) ?? '';
    const narrative = guideNarrativeHTML(guide.id,enrichment,media);
    const furtherReading = guideReadingHTML(guide.id,content.sources,enrichment);
    const sections=content?.sections.map((s,i) => `<section id="section-${i}"><h2>${esc(s.heading)}</h2>${s.paragraphs.map(p => `<p>${esc(p.text)} ${links(p.sources)}</p>`).join('')}${s.rows.length?`<div class="table-scroll"><table><thead><tr>${(s.columns??(guide.kind==='route'?['Place / passage','Dates / season','History / conditions','Sources and interpretation']:['Site / structure','Dates and methods','Organization / architecture','Limits and sources'])).map(label=>`<th>${esc(label)}</th>`).join('')}</tr></thead><tbody>${s.rows.map(r=>`<tr><th>${esc(r.name)}</th><td>${esc(r.dates)}</td><td>${esc(r.architecture)}</td><td>${esc(r.limits)}<p>${links(r.sources)}</p></td></tr>`).join('')}</tbody></table></div>`:''}</section>`).join('') ?? '';
    const evidence=rows.map(r=>`<article class="site-card"><h3>${esc(r.title)}</h3><p>${esc(r.review.summary)}</p><details><summary>Dates and evidence notes</summary><p><strong>Source dates:</strong> ${esc(r.time.original)}<br><strong>Dating method:</strong> ${esc(r.time.method)}</p><p>${esc(r.review.limitations)}</p></details><p><a href="../#review/${encodeURIComponent(r.id)}">Read the history &amp; sources ↗</a></p></article>`).join('');
    const datedRows=rows.filter(r=>r.time.kind!=='unplaced'&&r.time.start!==null);
    const minY=datedRows.length?Math.max(-7238050,Math.min(...datedRows.map(r=>r.time.start!))):null;
    const maxY=datedRows.length?Math.min(1900,Math.max(...datedRows.map(r=>r.time.end??r.time.start!))):null;
    const exploreHref=minY!==null&&maxY!==null?`../#explore?from=${minY}&to=${maxY}&wrecks=${guide.kind==='route'?1:0}`:`../#explore?q=${encodeURIComponent(guide.title.split(':')[0])}&wrecks=${guide.kind==='route'?1:0}`;
    const isPacific=/pacific|polynesia|micronesia|melanesia|australia|hawai|rapa nui|new guinea|yap|marianas|tonga|samoa|fiji|aotearoa|tahiti|kuk|nan madol|palau|solomon|vanuatu/i.test(guide.region);
    const regionalHref=isPacific?'../#atlas/pacific':'../#movie';
    const crossLinks=`<section class="atlas-crosslinks" aria-label="Explore in interactive views"><h2>Explore in the interactive atlas</h2><p><a href="${exploreHref}">Open this era on global Explore ↗</a> · <a href="${regionalHref}">Open ${isPacific?'Pacific':'Americas'} atlas ↗</a> · <a href="../#physical">Climate, sea level &amp; ice-sheet context ↗</a></p></section>`;
    await writeFile(guide.href,shell(guide.title,`<div class="eyebrow">${esc(guide.region)} · ${guide.kind==='culture'?'CULTURE / CIVILIZATION':guide.kind==='route'?'SEA ROUTES / MARITIME HISTORY':'PLACE / COMPLEX'}</div><h1>${esc(guide.title)}</h1><p class="lead">${esc(content?.intro ?? guide.description)}</p><p><a href="../#dives/${guide.topicId||guide.kind==='route'?'subjects':guide.kind==='culture'?'cultures':'places'}">Browse ${guide.topicId||guide.kind==='route'?'subject':guide.kind==='culture'?'culture':'place'} deep dives</a>${guide.topicId?` · <a href="../#topic/${esc(guide.topicId)}">Watch the independent movie</a>`:guide.storyId?` · <a href="../#story/${esc(guide.storyId)}">Watch the contextual movie</a>`:''}</p>${overviewHTML}${referenceMapsHTML(guide.id,referenceMaps)}${villagePlans}${regionalNav}${narrative}<nav class="local-nav" aria-label="Page sections">${narrative?'<a href="#historical-narrative">A closer reading</a>':''}${overview?`<a href="#site-overview-${esc(guide.id)}-heading">Labeled terrain map</a>`:''}${referenceMaps.assets.some(m=>m.guideIds.includes(guide.id))||referenceMaps.linkedReferences.some(m=>m.guideIds.includes(guide.id))?'<a href="#area-reference-maps">Wider-area survey maps</a>':''}${villagePlans?'<a href="#village-plans">Village plans</a>':''}<a href="#architecture">${guide.kind==='culture'?'Culture overview':guide.kind==='route'?'Routes &amp; conditions':'Sites &amp; architecture'}</a>${content.roadNetwork?'<a href="#roads">Road-network map</a>':''}${content.sections.map((section,i)=>`<a href="#section-${i}">${esc(section.heading)}</a>`).join('')}<a href="#evidence">Atlas evidence</a>${related?'<a href="#related-dives">Related dives</a>':''}<a href="#further-reading">Further reading</a><a href="#research">Research source</a><a href="#sources">Sources</a></nav>${content?.roadNetwork?`<div id="roads">${roadMapHTML(content.roadNetwork)}</div>`:''}<div id="architecture">${sections}</div><section id="evidence"><h2>Places, finds and events on the map</h2>${evidence||'<p>The linked scholarly sources provide background. Site-level findings are mapped only with qualified dates and locations; this page does not invent settlement dots.</p>'}</section>${crossLinks}${related}${furtherReading}<section id="research"><h2>Research source</h2><p><a href="reports/${esc(review.id)}.html">Research source and access status ↗</a></p><p>${review.publication==='original-source-review'?'This guide uses original publications and institutional records; source-check notes remain private.':'Consensus helped us discover literature for this separately authored deep dive. Its full Deep Research reviews are retained privately and are not reproduced here. Follow the source-status link to explore the research on Consensus; access may require your own account.'}</p></section><section id="sources"><h2>Page sources</h2><ul>${content?.sources.map(s=>`<li><a href="${esc(s.url)}">${esc(s.title)} ↗</a></li>`).join('')??''}</ul><p>The editorial summaries above use linked scholarly and institutional sources. Research leads do not replace the atlas’s individually reviewed evidence records.</p></section>`, '../', villagePlans ? villagePlanCSS : ''));
  }
  await buildSourceAttributions((title,body)=>shell(title,body,undefined,undefined,'#library'));
  const world=await buildWorldGuides(shell);
  await writeFile('sites/guide-reuse.html',shell('Guide writing and image reuse',researchMarkdown(await readFile('docs/guide-reuse.md','utf8')),undefined,undefined,'#library'));
  await writeFile('sites/index.html',shell('Place and culture guides',`<h1>Place and culture guides</h1><p><a href="../#dives">Browse all deep dives: Subjects, Places, Languages and Cultures</a></p><h2>Across the human atlases</h2><ul>${world.map(g=>`<li><a href="${g.id}.html">${esc(g.title)}</a></li>`).join('')}</ul>${['site','route','culture'].map(kind=>`<h2>${kind==='site'?'Places and complexes':kind==='route'?'Sea routes and maritime histories':'Cultures and civilizations'}</h2><ul>${guides.filter(g=>(g.kind??'site')===kind).map(g=>`<li><a href="${esc(g.id)}.html">${esc(g.title)}</a> — ${esc(g.region)}</li>`).join('')}</ul>`).join('')}`));
}
