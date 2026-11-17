import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { marked } from 'marked';
import { roadMapHTML, type RoadNetwork } from '../src/road-map';
import type { EvidenceRecord } from '../src/model';

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
type Guide = {id:string;title:string;href:string;region:string;description:string;recordIds:string[];kind?:string;report:string;relatedGuideIds?:string[];storyId?:string};
type ResearchStatus = {id:string;title:string;url:string;publication:'private-source-links-only'};
export function researchStatusHTML(review:ResearchStatus):string {
  if(review.publication!=='private-source-links-only') throw Error('Research requires private source status');
  const url=new URL(review.url);
  if(url.protocol!=='https:' || url.hostname!=='consensus.app' || url.username || url.password) throw Error('Unsafe research source');
  return `<div class="eyebrow">RESEARCH SOURCE STATUS</div><h1>${esc(review.title)}</h1><div class="notice"><p>The original third-party research response is retained privately and is not included in this public distribution. Its redistribution permission has not been established.</p><p><a href="${esc(review.url)}">Open the research source on Consensus ↗</a></p></div><p>The independently written place guides and their linked scholarly sources remain available. Source access may depend on the provider.</p>`;
}
const css = `:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f7fafb;color:#17243d;font:16px/1.65 system-ui,sans-serif}a{color:#08758d}header{padding:1rem 5%;background:white;border-bottom:1px solid #d5e0e5}header a{margin-right:1.5rem}main{max-width:1160px;margin:auto;padding:2rem 2rem 6rem}h1{font-size:clamp(2rem,5vw,3.3rem);line-height:1.15}h2{margin-top:2.8rem;scroll-margin-top:1rem}h3{line-height:1.3}.eyebrow{font-size:.8rem;text-transform:uppercase;letter-spacing:.12em}.lead{font-size:1.2rem;max-width:75ch}.notice{border-left:4px solid #087d95;background:#eaf4f6;padding:1rem 1.4rem}table{width:100%;border-collapse:collapse;font-size:.93rem}td,th{vertical-align:top;text-align:left;padding:.75rem;border:1px solid #c8d6dd}th{background:#e4eef2}.table-scroll{overflow:auto}.source-links a{margin-right:.6rem}details{padding:1rem;border:1px solid #c8d6dd;margin-top:1rem}summary{cursor:pointer;font-weight:bold}.site-card{background:white;border:1px solid #c8d6dd;padding:1.2rem;margin:1rem 0}.site-card p{max-width:85ch}.road-map>svg{width:100%;height:auto}.road-map text{font-family:system-ui,sans-serif}.local-nav{display:flex;flex-wrap:wrap;gap:1rem}footer{padding:2rem;border-top:1px solid #c8d6dd}code{overflow-wrap:anywhere}@media(max-width:650px){main{padding:1rem 1rem 4rem}td,th{padding:.45rem}}`;
function shell(title:string, body:string, up='../'):string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} · Americas Peoples</title><style>${css}@media(min-width:1550px){main{margin-left:220px;max-width:calc(100% - 260px)}.local-nav{position:fixed;left:18px;top:100px;width:180px;display:flex;flex-direction:column;font-size:.85rem;max-height:75vh;overflow:auto}}</style></head><body><header><a href="${up}#map">Americas Peoples · Map</a><a href="${up}#dives">Deep dives</a><a href="https://tripofisch.com/privacy/">Privacy &amp; analytics</a></header><main>${body}</main><footer>TripoFisch · Americas Peoples · Source-linked research, with uncertainty retained.</footer></body></html>`;
}
const links = (urls:string[]) => `<span class="source-links">${urls.map((u,i) => {if(!u.startsWith('https://')) throw Error('Unsafe page source');return `<a href="${esc(u)}">Source ${i+1} ↗</a>`;}).join(' ')}</span>`;
export async function buildSiteGuides():Promise<void> {
  const {guides} = JSON.parse(await readFile('data/site-guides.json','utf8')) as {guides:Guide[]};
  const {pages} = JSON.parse(await readFile('data/site-guide-content.json','utf8')) as {pages:Content[]};
  const {reviews} = JSON.parse(await readFile('data/site-research-reviews.json','utf8')) as {reviews:ResearchStatus[]};
  const {records} = JSON.parse(await readFile('dist/dataset.json','utf8')) as {records:EvidenceRecord[]};
  const reports = new Map(reviews.map(r => [r.id,r]));
  await mkdir('sites/reports',{recursive:true});
  for(const review of reviews) {
    await writeFile(`sites/reports/${review.id}.html`,shell(review.title,researchStatusHTML(review),'../../'));
    await writeFile(`sites/reports/${review.id}.md`,`# ${review.title}\n\nThe original third-party research response is retained privately and is not included in this public distribution. Redistribution permission has not been established.\n\n[Open the research source on Consensus](${review.url})\n\nIndependently written place guides and their scholarly source links remain available in the atlas.\n`);
  }
  for(const guide of guides) {
    const content = pages.find(p => p.id===guide.id);
    if(!content || !content.sections.length) throw Error('Missing populated site guide '+guide.id);
    const review = reports.get(guide.report);if(!review) throw Error('Missing research source status '+guide.report);
    const rows = records.filter(r => guide.recordIds.includes(r.id));
    const related = guide.relatedGuideIds?.map(id => {const g=guides.find(x=>x.id===id);if(!g)throw Error('Missing related guide '+id);return `<a href="${esc(g.id)}.html">${esc(g.title)} ↗</a>`;}).join(' · ') ?? '';
    const sections=content?.sections.map((s,i) => `<section id="section-${i}"><h2>${esc(s.heading)}</h2>${s.paragraphs.map(p => `<p>${esc(p.text)} ${links(p.sources)}</p>`).join('')}${s.rows.length?`<div class="table-scroll"><table><thead><tr><th>Site / structure</th><th>Dates and methods</th><th>Organization / architecture</th><th>Limits and sources</th></tr></thead><tbody>${s.rows.map(r=>`<tr><th>${esc(r.name)}</th><td>${esc(r.dates)}</td><td>${esc(r.architecture)}</td><td>${esc(r.limits)}<p>${links(r.sources)}</p></td></tr>`).join('')}</tbody></table></div>`:''}</section>`).join('') ?? '';
    const evidence=rows.map(r=>`<article class="site-card"><h3>${esc(r.title)}</h3><p>${esc(r.review.summary)}</p><p><strong>Source date guidance:</strong> ${esc(r.time.original)}<br><strong>Dating method:</strong> ${esc(r.time.method)}</p><p>${esc(r.review.limitations)}</p><p><a href="../#review/${encodeURIComponent(r.id)}">Full evidence review &amp; original fields ↗</a></p></article>`).join('');
    await writeFile(guide.href,shell(guide.title,`<div class="eyebrow">${esc(guide.region)} · ${guide.kind==='culture'?'CULTURE / CIVILIZATION':'PLACE / COMPLEX'}</div><h1>${esc(guide.title)}</h1><p class="lead">${esc(content?.intro ?? guide.description)}</p><p><a href="../#dives/${guide.kind==='culture'?'cultures':'places'}">Browse ${guide.kind==='culture'?'culture':'place'} deep dives</a>${guide.storyId?` · <a href="../#story/${esc(guide.storyId)}">Watch the contextual movie</a>`:''}</p><p>${related}</p><nav class="local-nav" aria-label="Page sections"><a href="#architecture">${guide.kind==='culture'?'Culture overview':'Sites &amp; architecture'}</a>${content.roadNetwork?'<a href="#roads">Road-network map</a>':''}${content.sections.map((section,i)=>`<a href="#section-${i}">${esc(section.heading)}</a>`).join('')}<a href="#evidence">Atlas evidence</a><a href="#research">Research source</a><a href="#sources">Sources</a></nav><div class="notice">Settlement occupation, building construction and dates of individual samples are separate kinds of evidence. An end date is not proof of the disappearance of a people. Public place anchors do not reconstruct ancient boundaries.</div>${content?.roadNetwork?`<div id="roads">${roadMapHTML(content.roadNetwork)}</div>`:''}<div id="architecture">${sections}</div><section id="evidence"><h2>Individually reviewed atlas evidence</h2>${evidence||'<p>The linked scholarly sources provide background. Site-level findings are mapped only with qualified dates and locations; this page does not invent settlement dots.</p>'}</section><section id="research"><h2>Research source</h2><p><a href="reports/${esc(review.id)}.html">Research source and access status ↗</a></p><p>The original third-party research response is retained privately. This public guide presents independently written, source-linked material; raw research responses are not redistributed.</p></section><section id="sources"><h2>Page sources</h2><ul>${content?.sources.map(s=>`<li><a href="${esc(s.url)}">${esc(s.title)} ↗</a></li>`).join('')??''}</ul><p>The editorial summaries above use linked scholarly and institutional sources. Research leads do not replace the atlas’s individually reviewed evidence records.</p></section>`));
  }
  await writeFile('sites/index.html',shell('Place and culture guides',`<h1>Place and culture guides</h1><p><a href="../#dives">Browse all deep dives: Subjects, Places, Languages and Cultures</a></p>${['site','culture'].map(kind=>`<h2>${kind==='site'?'Places and complexes':'Cultures and civilizations'}</h2><ul>${guides.filter(g=>(g.kind??'site')===kind).map(g=>`<li><a href="${esc(g.id)}.html">${esc(g.title)}</a> — ${esc(g.region)}</li>`).join('')}</ul>`).join('')}`));
}
