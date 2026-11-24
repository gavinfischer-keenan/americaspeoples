import {consensusResearch} from './research-provenance';
import {worldRegions,type WorldSummary,type RegionSummary} from './world-model';

const esc=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const base='/spread-of-peoples/';
const app='https://americaspeoples.11mosswood.us';
const count=(value:number)=>value.toLocaleString('en-US');

// Retained from the v0.31.0 Americas introduction and displayed on the main entry page.
const pageStyles=`<style>header,main,footer{width:min(1440px,calc(100% - 40px));margin:auto}
@media(min-width:701px) and (max-width:1740px){
 body:has(.layer-nav)>header,body:has(.layer-nav)>main,body:has(.layer-nav)>footer{
  width:calc(100% - 178px);margin-left:154px;margin-right:24px
 }
}
@media(max-width:700px){
 header,main,footer{width:calc(100% - 28px)}
}
header{min-height:60px;padding-top:10px;padding-bottom:10px}
footer{margin-top:24px;padding:14px 0}
.back{margin-top:10px;font-size:12px}

.ap-top-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1.25fr);gap:16px;align-items:stretch;padding:10px 0 14px;border-bottom:1px solid #dce5e9}
.ap-left-col{display:flex;flex-direction:column;gap:10px}
.ap-hero{padding:0!important;margin:0}
.ap-hero .eyebrow{display:block;margin-bottom:3px}
.ap-hero .utility-hero-logo{width:108px;height:108px;margin:0 0 8px 14px;border-radius:6px;float:right}
.ap-hero h1{font-size:clamp(30px,3.8vw,44px);margin:2px 0 4px;letter-spacing:-1.4px;line-height:1.06}
.ap-hero-sub{font-size:16px;font-weight:700;color:#17243d;margin:0 0 6px}
.ap-hero p{font-size:14px;line-height:1.48;color:#3c4d5b;margin:0 0 8px}
.ap-stat-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:10px 0}
.ap-stat{background:#f3f8f9;border:1px solid #d5e2e6;border-radius:5px;padding:7px 9px}
.ap-stat strong{display:block;font-size:16px;line-height:1.15;color:#17243d}
.ap-stat span{display:block;font-size:10.5px;line-height:1.3;color:#526472;margin-top:2px}
.ap-cta-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}
.ap-cta-row .action-link{margin-top:0;padding:8px 13px;font-size:12.5px;gap:8px;border-radius:4px}
.ap-btn-secondary{display:inline-flex;align-items:center;gap:6px;border:1px solid #087186;color:#087186;background:#fff;padding:7px 11px;font-size:12.5px;font-weight:600;border-radius:4px;text-decoration:none}
.ap-btn-secondary:hover{background:#eef7f9}
.ap-cta-row .curiosity{font-size:11.5px;margin-left:2px}
.ap-hero-pillars{background:#f7fbfc;border:1px solid #d5e1e5;border-radius:6px;padding:11px 12px;flex:1;display:flex;flex-direction:column}
.ap-hero-pillars>h3{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#087186;margin:0 0 8px}
.ap-pillars-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;flex:1}
.ap-pillar-tile{background:#fff;border:1px solid #d9e5e9;border-radius:4px;padding:8px 9px;font-size:12px;line-height:1.42;color:#304250}
.ap-pillar-tile strong{display:block;color:#17243d;margin-bottom:3px;font-size:12.5px}

.provenance-box{background:#f4f9fa;border:1px solid #c9dce1;border-top:4px solid #087186;border-radius:6px;padding:13px 15px;display:flex;flex-direction:column;gap:10px}
.provenance-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap}
.provenance-box h2{font-size:19px;letter-spacing:-.4px;margin:0;color:#17243d}
.provenance-consensus{background:#fff;border:1px solid #d4e3e7;border-left:4px solid #087d95;border-radius:4px;padding:10px 12px}
.provenance-consensus h3{font-size:13.5px;margin:0 0 6px;color:#087186;display:flex;align-items:center;justify-content:space-between;gap:8px}
.provenance-consensus h3 a{color:#087186;text-decoration:underline;text-underline-offset:3px}
.provenance-consensus p{font-size:12.8px;line-height:1.5;color:#273846;margin:0 0 6px}
.provenance-thanks{font-size:11px!important;line-height:1.42!important;color:#526472!important;margin:7px 0 0!important;padding-top:6px;border-top:1px solid #e4edf0}
.provenance-others h3{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#475c69;margin:0 0 7px}
.sources-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.source-tile{background:#fff;border:1px solid #d7e3e7;border-radius:4px;padding:8px 9px;font-size:11.8px;line-height:1.4;color:#304250}
.source-tile strong{display:block;color:#17243d;margin-bottom:2px;font-size:12px}
.source-tile a{color:#087186;font-weight:600;text-decoration:underline;text-underline-offset:3px}

.ap-band{padding:14px 0;border-bottom:1px solid #dce5e9}
.ap-band h2{font-size:20px;letter-spacing:-.4px;margin:0 0 6px;color:#17243d}
.ap-band-lead{font-size:14px;line-height:1.5;color:#374957;margin:0 0 10px;max-width:110ch}
.ap-band p{font-size:13.5px;line-height:1.48;color:#374957;margin:0 0 8px}
.ap-band a:not(.action-link):not(.ap-btn-secondary):not(.world-region-card){color:#087186;text-decoration:underline;text-underline-offset:3px}
#world-site{padding:16px 18px;border:1px solid #c9dce1;border-radius:8px;background:#f1f5f5;margin-top:8px}
#world-site a.world-region-card{text-decoration:none;color:inherit}
#world-site .fallback-regions{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin-top:10px}
#world-site .fallback-region{padding:14px 16px;background:#fff;border:1px solid #cadadd;border-radius:8px;display:flex;flex-direction:column;gap:6px}
#world-site .fallback-region h3{margin:0;font-size:16px;color:#17243d}
#world-site .fallback-region p{margin:0;font-size:12.5px;line-height:1.45;color:#3c4d5b}
#world-site .fallback-region .ap-btn-secondary{align-self:flex-start;margin-top:auto;font-size:12px;padding:6px 10px}

.ap-card-grid-4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:8px 0 2px}
.ap-card{background:#fff;border:1px solid #d5e1e5;border-radius:5px;padding:11px 12px}
.ap-card.tint{background:#f7fbfc}
.ap-card h3{font-size:14px;margin:0 0 5px;color:#17243d;line-height:1.28}
.ap-card p,.ap-card li{font-size:12.4px;line-height:1.42;color:#3d505e;margin:0 0 5px}
.ap-card ul{margin:3px 0 0;padding-left:15px}
.ap-card li:last-child,.ap-card p:last-child{margin-bottom:0}
.ap-pill-tag{display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#087186;background:#e6f3f5;padding:2px 6px;border-radius:3px;margin-bottom:5px}
.ap-badge-warn{display:inline-block;font-size:10.5px;font-weight:700;background:#fff4d8;border:1px solid #d9b45a;color:#5c4200;padding:1px 5px;border-radius:3px}

.ap-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:8px}
.ap-shot{margin:0;border:1px solid #cfdce0;border-radius:6px;background:#f8fbfc;overflow:hidden;display:flex;flex-direction:column}
.ap-shot-link{display:block;border-bottom:1px solid #dce5e9;background:#10222b}
.ap-shot img{display:block;width:100%;height:auto}
.ap-shot figcaption{padding:9px 11px;font-size:12.2px;line-height:1.42;color:#334654;display:flex;flex-direction:column;flex:1}
.ap-shot figcaption strong{display:block;font-size:13px;color:#17243d;margin-bottom:3px}
.ap-shot-meta{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:auto;padding-top:6px;font-size:11.5px}

.ap-feature-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;padding:14px 0 6px}
.ap-feature-card{background:#fff;border:1px solid #dce5e9;border-radius:6px;padding:12px 13px;display:flex;flex-direction:column}
.ap-feature-card.tint{background:#f7fbfc}
.ap-feature-card h2{font-size:16.5px;letter-spacing:-.25px;margin:0 0 6px;color:#17243d}
.ap-feature-card h3{font-size:15.5px;margin:0 0 6px;color:#17243d}
.ap-feature-card p{font-size:12.6px;line-height:1.46;color:#3c4d5b;margin:0 0 7px}
.ap-feature-card ul{margin:4px 0 7px;padding-left:16px;font-size:12.3px;line-height:1.42;color:#3c4d5b}
.ap-feature-card li{margin-bottom:4px}
.ap-feature-card .ap-card-links{margin-top:auto;padding-top:5px;font-size:12px}
.ap-feature-card a:not(.action-link):not(.ap-btn-secondary){color:#087186;text-decoration:underline;text-underline-offset:3px}

.ap-span-2{grid-column:span 2}
.source-code-section{border-top:1px solid #cde0e5;margin:0;background:#f3f8f9;border:1px solid #cde0e5;border-radius:6px;padding:12px 14px}
.source-code-section h2{font-size:17px;margin:0 0 6px}
.source-code-section p{font-size:12.6px;line-height:1.46;color:#3c4d5b;margin:0 0 7px}
.ap-download-box{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(210px,1fr);gap:12px;align-items:center;margin:6px 0}
.ap-download-box ul{margin:4px 0 0;padding-left:16px;font-size:12.2px;line-height:1.42;color:#304250}
.ap-download-actions{display:flex;flex-direction:column;gap:7px;align-items:flex-start}
.ap-download-actions .action-link{margin-top:0;padding:8px 12px;font-size:12.5px;border-radius:4px;text-decoration:none;color:#fff}
.ap-download-actions .ap-btn-secondary{font-size:12px;padding:7px 10px;text-decoration:none}
.ap-privacy-line{font-size:11.5px!important;color:#526472!important;margin:6px 0 0!important;padding-top:6px;border-top:1px solid #d5e3e7}

@media(max-width:1100px){
 .ap-top-grid{grid-template-columns:1fr}
 .ap-card-grid-4,.ap-feature-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:900px){
 .sources-grid,.ap-pillars-grid,.ap-gallery{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:640px){
 .ap-card-grid-4,.ap-feature-grid,.ap-gallery,.ap-pillars-grid,.sources-grid,.ap-download-box{grid-template-columns:1fr}
 .ap-span-2{grid-column:auto}
 .ap-stat-strip{grid-template-columns:repeat(2,minmax(0,1fr))}
 #world-site{padding:12px}
}
@media(max-width:700px){
 .ap-hero .utility-hero-logo{float:none;display:block;width:96px;height:96px;margin:6px 0 8px}
 .page-section-nav{flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;white-space:nowrap;padding:6px 8px!important;gap:6px!important;bottom:8px!important}
 .page-section-nav a{flex:0 0 auto!important;white-space:nowrap!important;padding:6px 9px!important;font-size:11.5px!important}
}</style>`;

const redirectStyle=`:root{color-scheme:light;background:#E3E8EB;color:#10171A;font:16px/1.55 system-ui,sans-serif}body{margin:0;padding:36px 20px}main{max-width:680px;margin:auto;background:#F2F6F8;border:1px solid #B4BEC4;border-top:4px solid #3B783D;border-radius:8px;padding:24px}h1{margin:6px 0 10px;font-size:28px;color:#10171A}.eyebrow{font-size:11px;font-weight:750;letter-spacing:.14em;text-transform:uppercase;color:#3B783D}.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.primary{display:inline-flex;align-items:center;padding:10px 16px;border-radius:6px;background:#569E56;color:#10171A;font-weight:700;text-decoration:none}.secondary{display:inline-flex;align-items:center;padding:9px 14px;border-radius:6px;border:1px solid #3B783D;color:#244D26;font-weight:600;text-decoration:none}`;

function fallbackRegionCard(r:RegionSummary){
 const route=worldRegions.find(region=>region.id===r.id)!.href;
 const full=`${app}/${route}`;
 return `<article class="fallback-region"><h3><a href="${full}">${esc(r.title)}</a></h3><p><strong>${count(r.references)}</strong> unique references · <strong>${count(r.records)}</strong> events &amp; records · ${count(r.guides)} guides</p><p>${esc(r.earliestLabel)}</p><p>${esc(r.coverage)}</p><a class="ap-btn-secondary" href="${full}">Open regional movie →</a></article>`;
}

function renderRegionRedirect(r:RegionSummary,summary:WorldSummary):string{
 const route=worldRegions.find(region=>region.id===r.id)!.href;
 const full=`${app}/${route}`;
 const canonical=`https://tripofisch.com${base}${r.id}/`;
 const title=`${r.title} · The Spread of Peoples`;
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(r.title)}: sourced map evidence and regional research coverage."><meta name="theme-color" content="#f1f5f5"><meta http-equiv="refresh" content="0;url=${esc(full)}"><title>${esc(title)} | Alaska Blackfish</title><link rel="icon" href="https://tripofisch.com/assets/alaska-blackfish-logo.jpg"><link rel="canonical" href="${canonical}"><style>${redirectStyle}</style><script>window.location.replace(${JSON.stringify(full)});</script></head><body><main><span class="eyebrow">The Spread of Peoples</span><h1>${esc(r.title)}</h1><p>${esc(r.coverage)}</p><p>${esc(r.earliestLabel)}. ${count(r.references)} unique references · ${count(r.records)} events &amp; records · ${count(r.guides)} guides.</p><p>${esc(summary.method)}</p><div class="actions"><a class="primary" href="${esc(full)}">Open ${esc(r.title)} map →</a><a class="secondary" href="${base}">← Back to World globe</a></div></main></body></html>\n`;
}

function renderLandingPage(summary:WorldSummary):string{
 const jsonLd=JSON.stringify({
  '@context':'https://schema.org',
  '@graph':[
   {
    '@type':'WebApplication',
    name:'The Spread of Peoples — Americas Peoples (Alaska Blackfish)',
    alternateName:['Alaska Blackfish','Americas Peoples Human Atlas','The Spread of Peoples'],
    url:`${app}/#world`,
    sameAs:[`https://tripofisch.com${base}`,'https://tripofisch.com/free-utilities/americaspeoples/','https://github.com/gavinfischer-keenan/americaspeoples'],
    applicationCategory:'EducationalApplication',
    operatingSystem:'Web browser; self-host bundle for Windows, macOS, Linux (Python + SQLite)',
    isAccessibleForFree:true,
    license:['https://polyformproject.org/licenses/noncommercial/1.0.0','https://creativecommons.org/licenses/by-nc-sa/4.0/'],
    description:'An open-access interactive archaeological, genomic, linguistic, and historical atlas across five regional maps — Americas, Australia & Pacific, Africa & Middle East, Europe & Mediterranean, and Asia — with global deep dives. Ordinary maps end in 1900 CE; Hawaiʻi statehood continues through 1959.',
    author:{'@type':'Organization',name:'TripoFisch',url:'https://tripofisch.com/'},
    codeRepository:'https://github.com/gavinfischer-keenan/americaspeoples',
   },
   {
    '@type':'Dataset',
    name:'The Spread of Peoples Source-Linked Evidence Dataset',
    description:`${count(summary.records)} canonical source-linked records across ${count(summary.regions.length)} regional atlases and ${count(summary.references)} unique references. Ordinary maps display through 1900 CE.`,
    url:`${app}/sites/sources-attributions.html`,
    sameAs:'https://github.com/gavinfischer-keenan/americaspeoples',
    isAccessibleForFree:true,
    license:'https://creativecommons.org/licenses/by-nc-sa/4.0/',
   }
  ]
 });

 const fallback=`<p>Spin the world globe or pick a regional atlas below to open it full window.</p><div class="fallback-regions">${summary.regions.map(fallbackRegionCard).join('')}</div><p style="margin-top:10px;font-size:13px"><a href="${app}/#dives">Browse all deep dives (including the human-family foundation &amp; Eurasian study guides) →</a> · <a href="${app}/#dives/origin-stories">Origin Stories · Where did we come from? →</a></p>`;

 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="The Spread of Peoples (Alaska Blackfish) is a literature-grounded, interactive historical atlas of the Americas, Australia &amp; Pacific, Africa, Europe, and Asia. Enter on the globe and open a regional movie or deep dive. Ordinary maps end in 1900 CE."><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"><meta name="theme-color" content="#17243d"><meta property="og:type" content="website"><meta property="og:title" content="The Spread of Peoples — Alaska Blackfish | TripoFisch"><meta property="og:description" content="Enter on the world globe and open any regional atlas: Americas, Australia &amp; Pacific, Africa, Europe, or Asia. ${count(summary.records)} canonical evidence records across ${count(summary.references)} unique references."><meta property="og:url" content="https://tripofisch.com${base}"><meta property="og:image" content="https://tripofisch.com/assets/americaspeoples-zoomed-out-overview.png"><title>The Spread of Peoples · Alaska Blackfish | TripoFisch</title><link rel="icon" href="https://tripofisch.com/assets/alaska-blackfish-logo.jpg"><link rel="canonical" href="https://tripofisch.com${base}"><link rel="stylesheet" href="https://tripofisch.com/style.css?v=20261028-americas-privacy"><link rel="stylesheet" href="./world-site.css">${pageStyles}<script type="application/ld+json">${jsonLd}</script></head><body><a class="skip" href="#main">Skip to content</a><header><a class="wordmark" href="https://tripofisch.com/">TripoFisch<span class="dot">.</span></a><nav aria-label="Main navigation"><a href="https://electriceel.cc/">Electric Eel</a><a href="https://tuskfish.us/">Tusk Fish</a><a href="https://tripofisch.com/store/">Store</a><a href="https://tripofisch.com/free-utilities/">Utilities &amp; Games</a><a href="https://tripofisch.com/animals/">Animals</a><a href="https://tripofisch.com/news/">News</a><a href="https://tripofisch.com/about-us/">About us</a></nav></header><main id="main"><nav class="layer-nav page-section-nav" aria-label="On this page"><a href="#section-alaska-blackfish">Overview &amp; sources</a><a href="#section-world-entry">World globe &amp; regions</a><a href="#section-what-this-is">What this is</a><a href="#section-visual-tour">Screenshots &amp; tour</a><a href="#section-data-integrity-and-hard-history">Gaps, debate &amp; hard history</a><a href="#section-climate-hazards-and-gaps-in-the-record">Climate &amp; hazards</a><a href="#section-watch-and-explore">Watch, Explore &amp; Dives</a><a href="#section-connected-history">Connected history</a><a href="#section-free-education">Free education &amp; reuse</a><a href="#section-downloads-and-source-code">Downloads &amp; source code</a></nav><a class="back" href="https://tripofisch.com/">← TripoFisch</a>

<div class="ap-top-grid">
 <div class="ap-left-col">
  <section class="page-intro ap-hero">
   <span class="eyebrow">Free utility · Alaska Blackfish · Open-Access Historical Atlas</span>
   <img class="utility-hero-logo" src="https://tripofisch.com/assets/alaska-blackfish-logo.jpg" alt="Alaska Blackfish logo — a fish carrying a pack across an icy landscape" width="108" height="108">
   <h1 id="section-alaska-blackfish">The Spread of Peoples<span class="dot">.</span></h1>
   <p class="ap-hero-sub">Alaska Blackfish — Interactive Archaeological &amp; Historical Atlas</p>
   <p>An open-access atlas of archaeological, genomic, linguistic, environmental and archival evidence across the <strong>Americas</strong>, <strong>Australia &amp; Pacific</strong>, <strong>Africa</strong>, <strong>Europe</strong>, and <strong>Asia</strong>. Enter on the world globe below and pick a region to launch its movie and interactive map. Ordinary maps end in 1900 CE; the separate Hawaiʻi statehood story continues through 1959.</p>
   <div class="ap-stat-strip" aria-label="Atlas scale at a glance">
    <div class="ap-stat"><strong>${count(summary.records)}</strong><span>Canonical evidence records</span></div>
    <div class="ap-stat"><strong>${count(summary.references)}</strong><span>Unique references</span></div>
    <div class="ap-stat"><strong>${consensusResearch.deepRuns}+</strong><span>Consensus Deep runs</span></div>
    <div class="ap-stat"><strong>${count(summary.guides)}</strong><span>World guides &amp; dives</span></div>
   </div>
   <div class="ap-cta-row">
    <a class="action-link" href="${app}/#world">Launch World Globe ↗</a>
    <a class="ap-btn-secondary" href="${app}/#movie">Americas Movie ↗</a>
    <a class="ap-btn-secondary" href="${app}/#dives">Browse Deep Dives ↗</a>
    <a class="ap-btn-secondary" href="${app}/#dives/origin-stories">Origin Stories · Where did we come from? ↗</a>
    <a class="ap-btn-secondary" href="https://github.com/gavinfischer-keenan/americaspeoples">GitHub Source &amp; Releases ↗</a>
    <a class="curiosity" href="https://tripofisch.com/fish/alaska-blackfish/">About the fish →</a>
   </div>
  </section>

  <div class="ap-hero-pillars">
   <h3>Core Editorial Principles at a Glance</h3>
   <div class="ap-pillars-grid">
    <div class="ap-pillar-tile">
     <strong>100% Literature-Grounded</strong>
     Every marker and route cites primary archaeological, genomic, linguistic, or archival papers &mdash; keeping pre-Clovis, early African hominin, and regional chronologies intact.
    </div>
    <div class="ap-pillar-tile">
     <strong>Gaps &amp; Map Integrity</strong>
     Attestation gaps dim earlier places rather than erasing peoples; undated finds stay visible as <code>?</code> markers; <span class="ap-badge-warn">AI generated facts</span> rows are visibly segregated.
    </div>
    <div class="ap-pillar-tile">
     <strong>Conflict and coercion</strong> Shows monumental cities and exchange alongside selected conflict, epidemics, slavery, forced removals, labour abuses and broken treaties.
    </div>
   </div>
  </div>
 </div>

 <aside class="provenance-box" id="section-where-the-data-came-from" aria-labelledby="provenance-heading">
  <div class="provenance-head">
   <div>
    <span class="eyebrow">High-Level Provenance</span>
    <h2 id="provenance-heading">Where the data came from</h2>
   </div>
   <a class="ap-btn-secondary" href="${app}/sites/sources-attributions.html">Full Source Register ↗</a>
  </div>

  <div class="provenance-consensus">
   <h3><span>Primary Paper Discovery: Consensus</span><a href="https://consensus.app/" target="_blank" rel="noopener">consensus.app ↗</a></h3>
   <p>We use Consensus a lot &mdash; <strong>${consensusResearch.deepRuns}+</strong> Deep Research runs and <strong>${consensusResearch.citedPaperMatches}</strong> cited paper matches across archaeology, 14C/OSL dating, ancient DNA, linguistics, and archival history helped surface primary studies behind this atlas. We do not reproduce the full Consensus Deep Research reviews here. Visit Consensus to explore its reviews and follow the literature for yourself; access may require an account or subscription. The atlas&rsquo;s own deep dives are independently authored, mostly with AI assistance, and checked against cited primary sources. No &mdash; this is not paid for by them in any way.</p>
   <p class="provenance-thanks">Thank you to the Consensus team for building such a cool research engine. <em>The Spread of Peoples / Americas Peoples</em> is an independent TripoFisch project and is not affiliated with, authorized by, sponsored by, or endorsed by Consensus.</p>
  </div>

  <div class="provenance-others">
   <h3>Other major sources we drew heavily from</h3>
   <div class="sources-grid">
    <div class="source-tile">
     <strong>Peer-Reviewed Journals</strong>
     <em>Nature</em>, <em>Science</em>, <em>PNAS</em>, <em>PLOS ONE</em>, <em>Latin American Antiquity</em>, <em>American Antiquity</em>, <em>QSR</em>, Cambridge, SciELO, ANU Press, and PMC.
    </div>
    <div class="source-tile">
     <strong>NOAA / NCEI &amp; Smithsonian GVP</strong>
     2,580+ historical earthquake epicenters &amp; tsunami source events, Gergis &amp; Fowler ENSO series, and 668+ Holocene eruptions.
    </div>
    <div class="source-tile">
     <strong>Glacial Sheets &amp; Terrain Rasters</strong>
     Dalton et al. <em>NADI-1</em> deglacial isochrones, USGS 3DEP elevation rasters, Mapzen/Tilezen Terrain Tiles, and Natural Earth.
    </div>
    <div class="source-tile">
     <strong>Heritage &amp; Community Archives</strong>
     U.S. National Park Service (NPMap, Chaco Archive, ABPP), Mexico INAH &amp; SIC, Parks Canada, UNESCO, Crow Canyon, SPARC, Indigenous histories.
    </div>
    <div class="source-tile">
     <strong>Historical GIS, Rail &amp; Languages</strong>
     Stangl <em>HGIS de las Indias</em>, <em>CShapes 2.0</em>, Seshat <em>Cliopatria</em>, Newberry County Boundaries, Atack U.S. Railroads, and <em>Glottolog</em>.
    </div>
    <div class="source-tile">
     <strong>Locality Anchors &amp; Register</strong>
     <em>GeoNames</em> &amp; <em>OpenStreetMap</em> locality coordinates. <a href="${app}/sites/sources-attributions.html">Browse full entries &amp; licenses ↗</a>
    </div>
   </div>
  </div>
 </aside>
</div>

<section class="ap-band" id="section-world-entry">
 <span class="eyebrow">World Entry · Five Clickable Regions</span>
 <h2>Choose a region on the globe</h2>
 <p class="ap-band-lead">Spin the globe or select one of the five regional atlases below to open its full-window regional movie and map at <a href="${app}/#world">americaspeoples.11mosswood.us</a>. Dividing lines mark the regional views; counts show sourced references and mapped events or records in each region.</p>
 <div id="world-site" class="world-surface" data-summary-url="./world-summary.json" data-catalogue-url="./world-catalogue.json" data-base-root="${base}" data-app-origin="${app}">${fallback}</div>
</section>

<section class="ap-band" id="section-what-this-is-wrap">
 <span class="eyebrow">Reference Anchor · For Researchers, Search Engines &amp; AI Agents</span>
 <h2 id="section-what-this-is">What this is</h2>
 <p class="ap-band-lead"><strong>The Spread of Peoples (Alaska Blackfish)</strong> is a free, noncommercial, open-source-code historical and archaeological web atlas (<a href="${app}/#world">americaspeoples.11mosswood.us</a>) built to inspect human presence, movement, architecture, language, conflict, climate, and natural hazards on synchronized regional timelines &mdash; <strong>100% literature-grounded</strong>, preserving <strong>scholarly disagreements and gaps in the record</strong>, and <strong>never ducking the hard history</strong>.</p>

 <div class="ap-card-grid-4" aria-label="Core atlas methodology and structured scope">
  <article class="ap-card tint">
   <span class="ap-pill-tag">100% Literature-Based</span>
   <h3>Citations &amp; Scholarly Disagreements</h3>
   <p>Every marker, route, and phase links to DOIs or archival sources with explicit access notes.</p>
   <ul>
    <li><strong>Debates intact:</strong> Red and gold map rims flag contested chronologies &mdash; pre-Clovis vs. Clovis (White Sands, Bluefish Caves, Monte Verde, Pedra Furada), early African hominin records, aDNA admixture timing, and linguistic dispersals.</li>
   </ul>
  </article>

  <article class="ap-card tint">
   <span class="ap-pill-tag">Gaps &amp; Data Integrity</span>
   <h3>Missing Evidence &amp; Map Guardrails</h3>
   <ul>
    <li><strong>Attestation gaps &amp; <code>?</code> dates:</strong> Dim earlier places into context rather than pretending peoples vanished; keep undated finds visible.</li>
    <li><strong>Habitation and departure:</strong> Dated continuity and ending evidence have different meanings. Some dates only document activity at a particular place.</li>
    <li><strong>Population evidence:</strong> Cited town counts support sizing where available. Optional interpolation is labeled, and <span class="ap-badge-warn">AI generated facts</span> rows are segregated.</li>
   </ul>
  </article>

  <article class="ap-card tint">
   <span class="ap-pill-tag">Unvarnished Record</span>
   <h3>Conflict and coercion</h3>
   <ul>
    <li><strong>Pre-contact &amp; imperial conflicts:</strong> Warfare, fortifications, raiding, captives, and state coercion alongside monumental exchange.</li>
    <li><strong>Colonial &amp; state violence:</strong> Epidemics, Indigenous and transatlantic slavery, missionization, rubber/guano/pearling peonage, massacres (e.g., Bloody Island), broken treaties, and forced removals.</li>
    <li><strong>1900 display ceiling:</strong> Ordinary maps display through 1900 CE. The evidence still retains its original dates.</li>
   </ul>
  </article>

  <article class="ap-card tint">
   <span class="ap-pill-tag">Scope &amp; Modes</span>
   <h3>Regions, Clock &amp; Deep Dives</h3>
   <ul>
    <li><strong>Five regional views:</strong> <a href="${app}/#movie">Americas</a>, <a href="${app}/#atlas/pacific">Australia &amp; Pacific</a>, <a href="${app}/#atlas/africa">Africa</a>, <a href="${app}/#atlas/europe">Europe</a>, and <a href="${app}/#atlas/asia-pacific">Asia</a>, plus the <a href="${app}/#world">World globe</a> entry.</li>
    <li><strong>Cross-regional studies in Deep Dives:</strong> Broad studies such as <em>The Human Family</em>, <em>Silk Roads</em>, <em>Genghis Khan</em>, <em>Marco Polo</em>, and <em>Hannibal</em> live alongside <em>Chaco Canyon</em> inside <a href="${app}/#dives">Deep Dives</a>.</li>
    <li><strong>Modes:</strong> <strong>Watch</strong>, <strong>Explore</strong>, <strong>Deep Dives</strong>, <strong>Library</strong> + Python/SQLite bundle.</li>
   </ul>
  </article>
 </div>
</section>

<section class="ap-band" id="section-visual-tour-wrap">
 <h2 id="section-visual-tour">Inside the atlas: zoomed out, zoomed in &amp; deep dives</h2>
 <p class="ap-band-lead">Live screenshots from <a href="${app}/#world">americaspeoples.11mosswood.us</a> showing the zoomed-out hemisphere view, three zoomed-in regions with claim caveats, the Deep Dives directory, and a labeled site terrain guide.</p>

 <div class="ap-gallery">
  <figure class="ap-shot">
   <a class="ap-shot-link" href="${app}/#movie">
    <img src="https://tripofisch.com/assets/americaspeoples-zoomed-out-overview.png" alt="Americas Peoples Watch mode zoomed out across the Pacific and Americas at 1492 CE, showing clustered records, active connections, and the logarithmic timeline." width="1440" height="900" loading="lazy">
   </a>
   <figcaption>
    <strong>1. Zoomed out &mdash; hemisphere overview (1492 CE)</strong>
    One synchronized clock links Beringia, the Americas, Caribbean, Australia, and Pacific with cluster counts and active links.
    <div class="ap-shot-meta"><a href="${app}/#movie">Open Americas Watch mode ↗</a><span>Logarithmic timeline</span></div>
   </figcaption>
  </figure>

  <figure class="ap-shot">
   <a class="ap-shot-link" href="${app}/#explore">
    <img src="https://tripofisch.com/assets/americaspeoples-zoomed-in-chaco.png" alt="Explore mode zoomed into the Pueblo Southwest and Chaco Canyon, showing pre-Clovis entries on the left, map connections, unresolved question marks, and a Chaco Canyon record detail panel on the right." width="1440" height="900" loading="lazy">
   </a>
   <figcaption>
    <strong>2. Zoomed in &mdash; Southwest &amp; Chaco caveats</strong>
    Expands pre-Clovis records (Gault, White Sands), gray <code>?</code> undated finds, conflict icons, and early Chaco maize pollen caveats.
    <div class="ap-shot-meta"><a href="${app}/#explore">Explore Southwest ↗</a><span>Evidence &amp; uncertainty</span></div>
   </figcaption>
  </figure>

  <figure class="ap-shot">
   <a class="ap-shot-link" href="${app}/#explore">
    <img src="https://tripofisch.com/assets/americaspeoples-zoomed-in-andes.png" alt="Explore mode zoomed into the Andean heartland around Machu Picchu, showing dense settlement and road records with citations." width="1440" height="900" loading="lazy">
   </a>
   <figcaption>
    <strong>3. Zoomed in &mdash; Andean Heartland &amp; Machu Picchu</strong>
    Displays regional Andean occupations and road links alongside competing Bayesian chronological models in the inspector.
    <div class="ap-shot-meta"><a href="${app}/#explore">Explore the Andes ↗</a><span>Scholarly debate intact</span></div>
   </figcaption>
  </figure>

  <figure class="ap-shot">
   <a class="ap-shot-link" href="${app}/#explore">
    <img src="https://tripofisch.com/assets/americaspeoples-zoomed-in-pacific.png" alt="Explore mode zoomed into Micronesia and the Western Pacific around Nan Madol, showing island sites and exchange connections." width="1440" height="900" loading="lazy">
   </a>
   <figcaption>
    <strong>4. Zoomed in &mdash; Pacific &amp; Micronesia networks</strong>
    Palau, Yap, Pohnpei (Nan Madol), and Kiribati: oceanic exchange routes, coral-dated stonework, and departure vs. gap cues.
    <div class="ap-shot-meta"><a href="${app}/#explore">Explore Pacific ↗</a><span>Maritime &amp; island gaps</span></div>
   </figcaption>
  </figure>

  <figure class="ap-shot">
   <a class="ap-shot-link" href="${app}/#dives">
    <img src="https://tripofisch.com/assets/americaspeoples-deep-dives-list.png" alt="Americas Peoples Deep Dives catalog showing organized tabs and cards for Subjects, Places, Languages, and Cultures." width="1440" height="900" loading="lazy">
   </a>
   <figcaption>
    <strong>5. Lists of Deep Dives &mdash; four research catalogs</strong>
    Browse topic movies, cross-regional studies, and dedicated guides organized across Subjects, Places, Languages, and Cultures.
    <div class="ap-shot-meta"><a href="${app}/#dives">Browse Deep Dives ↗</a><span>4 directory tabs</span></div>
   </figcaption>
  </figure>

  <figure class="ap-shot">
   <a class="ap-shot-link" href="${app}/sites/chaco.html">
    <img src="https://tripofisch.com/assets/americaspeoples-chaco-terrain-guide.png" alt="Chaco Canyon Deep Dive guide page displaying a labeled USGS/Tilezen shaded-relief terrain map with numbered great houses and archaeological sites." width="1440" height="900" loading="lazy">
   </a>
   <figcaption>
    <strong>6. Inside a Place Deep Dive &mdash; Chaco terrain guide</strong>
    Zoomable USGS/Tilezen shaded-relief maps with 50 m contours, numbered site anchors, road links, and cited chapters.
    <div class="ap-shot-meta"><a href="${app}/sites/chaco.html">Open Chaco guide ↗</a><span>100+ terrain maps</span></div>
   </figcaption>
  </figure>
 </div>
</section>

<div class="ap-feature-grid">
 <section class="ap-feature-card">
  <h2 id="section-data-integrity-and-hard-history">Gaps, debate &amp; hard history</h2>
  <p>Built around epistemic honesty: what literature supports, where researchers disagree, and where archives have blind spots.</p>
  <ul>
   <li><strong>Markers never erase peoples:</strong> Dimming across an attestation gap preserves context rather than claiming extinction.</li>
   <li><strong>Culture, language &amp; DNA stay separate:</strong> Culture colors are supported identifications, not racial categories; aDNA never dictates spoken language.</li>
   <li><strong>AI registry segregated:</strong> Author-supplied colonial rows carry <strong>AI generated facts</strong> badges with conflicting counts excluded from sizing.</li>
  </ul>
  <p class="ap-card-links"><a href="${app}/docs/coverage-audit.html">Coverage audit ↗</a> · <a href="${app}/docs/colonial-ai-registry.html">AI colonial registry ↗</a></p>
 </section>

 <section class="ap-feature-card">
  <h2 id="section-climate-hazards-and-gaps-in-the-record">Climate &amp; physical hazards</h2>
  <p>Sourced North American deglacial ice-sheet snapshots (<em>NADI-1</em> optimal/min/max), Gergis &amp; Fowler ENSO reconstructions, Smithsonian Holocene eruptions, and NOAA/NCEI earthquake and tsunami catalogs.</p>
  <p>Modern schematic current and trade-wind arrows add oceanic context without reconstructing ancient coasts. A volcano or quake beside a site <strong>never</strong> asserts unproven causation. Undated finds stay inspectable as gray <code>?</code> markers.</p>
  <p class="ap-card-links"><a href="${app}/#physical">Hazard catalog ↗</a> · <a href="${app}/docs/map-marker-audit.html">Marker audit ↗</a></p>
 </section>

 <section class="ap-feature-card">
  <h2 id="section-watch-and-explore">Watch, Explore &amp; Deep Dives</h2>
  <p><strong>Watch</strong> plays dated evidence through 1900 on each regional map (plus the separate Hawaiʻi statehood story through 1959) with live synchronized headlines and map labels.</p>
  <p><strong>Explore</strong> jumps to any region, searches the full corpus, filters by places, connections, conflict, research overlays, or shipwrecks, and opens individual picks at crowded points.</p>
  <p class="ap-card-links"><a href="${app}/#movie">Watch Americas ↗</a> · <a href="${app}/#explore">Explore ↗</a> · <a href="${app}/#dives">Deep Dives ↗</a> · <a href="${app}/#library">Library ↗</a></p>
 </section>

 <section class="ap-feature-card">
  <h2 id="section-connected-history">Connected history &amp; terrain</h2>
  <p>Across the five regional maps (${count(summary.records)} canonical records and ${count(summary.references)} unique references), trace deep-time dispersal, dated boundaries, voyages, terrain guides, and paired originals &amp; translations.</p>
  <p>Global and cross-regional studies — including The Human Family foundation, Silk Roads, Genghis Khan, Marco Polo, and Hannibal — live inside Deep Dives alongside site guides like Chaco Canyon.</p>
  <p class="ap-card-links"><a href="${app}/#atlas/pacific">Australia &amp; Pacific ↗</a> · <a href="${app}/#atlas/africa">Africa &amp; Middle East ↗</a> · <a href="${app}/#atlas/europe">Europe ↗</a> · <a href="${app}/#atlas/asia-pacific">Asia ↗</a> · <a href="${app}/#dives">Deep Dives ↗</a></p>
 </section>

 <section class="ap-feature-card tint">
  <h2 id="section-free-education">Free education &amp; reuse</h2>
  <p>Americas Peoples / The Spread of Peoples is and will remain free with zero ads, paywalls, or accounts. Classroom sharing, translations, and scholarly corrections are encouraged.</p>
  <p>Original software uses <strong>PolyForm Noncommercial 1.0.0</strong>; original educational prose and copyrightable curated data use <strong>CC BY-NC-SA 4.0</strong>. Third-party datasets and photos retain their own terms.</p>
  <p class="ap-card-links"><a href="${app}/LICENSE.md">License scope ↗</a> · <a href="${app}/docs/reuse-and-contributing.html">Reuse guide ↗</a></p>
 </section>

 <section class="ap-feature-card tint">
  <h3>Research ethics &amp; AI authorship</h3>
  <p>Full Consensus responses remain private to respect platform terms; every public atlas record relies on original explanations independently authored (mostly by AI agents) and verified against linked primary sources.</p>
  <p>Citations never claim endorsement by cited scholars, Indigenous communities, or research platforms.</p>
  <p class="ap-card-links"><a href="${app}/CONTRIBUTING.md">Submit a correction ↗</a> · <a href="${app}/docs/reuse-and-contributing.html">Consensus policy ↗</a></p>
 </section>

 <section class="source-code-section ap-feature-card ap-span-2">
  <h2 id="section-downloads-and-source-code">Downloads and source code</h2>
  <div class="ap-download-box">
   <div>
    <p>The ${esc(summary.version)} self-host bundle, researched Excel workbook, blank import template, SHA-256 checksums and source code are available from the GitHub release.</p>
    <ul>
     <li><strong>Self-host bundle:</strong> Includes frontend, Python API server, SQLite database (<code>atlas.sqlite3</code>), license notices, and HTTP setup instructions.</li>
     <li><strong>Data &amp; schemas:</strong> Current researched spreadsheet, import template, and JSON datasets are in the latest GitHub Release.</li>
    </ul>
   </div>
   <div class="ap-download-actions">
    <a class="action-link" href="https://github.com/gavinfischer-keenan/americaspeoples">Source code on GitHub ↗</a>
    <a class="ap-btn-secondary" href="https://github.com/gavinfischer-keenan/americaspeoples/releases/latest">Latest GitHub Release (ZIP, XLSX &amp; SHA-256) ↗</a>
    <a href="${app}/docs/bulk-import-guide.html">Contribution format &amp; bulk import guide ↗</a>
   </div>
  </div>
  <p class="ap-privacy-line">Local research privacy: private spreadsheet imports, drafts, and edits stay in your browser&rsquo;s local storage and are never uploaded (export JSON to back up drafts); ordinary server requests fetch public atlas records and search queries, and TripoFisch pages use Cloudflare usage analytics &mdash; <a href="https://tripofisch.com/privacy/">read our privacy notice</a>.</p>
 </section>
</div>
</main><footer><a href="https://tripofisch.com/">TripoFisch</a><span>© 2026 TripoFisch</span><span class="privacy-disclosure">Cloudflare usage &amp; performance analytics · <a href="https://tripofisch.com/privacy/">Privacy</a></span></footer><script src="./world-site.js" defer></script></body></html>
`;
}

export function renderWorldWebsite(summary:WorldSummary):Map<string,string>{
 const output=new Map<string,string>();
 output.set('index.html',renderLandingPage(summary));
 for(const r of summary.regions){
  output.set(`${r.id}/index.html`,renderRegionRedirect(r,summary));
 }
 output.set('americas/about.html',legacyAmericasIntroduction);
 return output;
}

// Full v0.31.0 Americas introduction, retained with its gallery and existing Tripofisch asset URLs.
const legacyAmericasIntroduction="<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"description\" content=\"Americas Peoples (Alaska Blackfish) is a literature-grounded, interactive historical atlas of the Americas and Pacific. Explore a playable northern Europe map, contested chronologies and sourced deep dives. Ordinary maps end in 1900 CE.\"><meta name=\"keywords\" content=\"Americas Peoples, Alaska Blackfish, TripoFisch, archaeology atlas, peopling of the Americas, pre-Clovis, scholarly disagreements, gaps in the archaeological record, data integrity, Indigenous history, hard history, Consensus research, ancient DNA, Glottolog, Chaco Canyon, Machu Picchu, Cahokia, Micronesia, Polynesia, Beringia, paleoclimate, NADI-1\"><meta name=\"robots\" content=\"index,follow,max-image-preview:large,max-snippet:-1\"><meta name=\"theme-color\" content=\"#17243d\"><meta property=\"og:type\" content=\"website\"><meta property=\"og:title\" content=\"Alaska Blackfish — Americas Peoples | TripoFisch\"><meta property=\"og:description\" content=\"Americas Peoples (Alaska Blackfish) is a literature-grounded, interactive historical atlas of the Americas and Pacific. Explore a playable northern Europe map, contested chronologies and sourced deep dives. Ordinary maps end in 1900 CE.\"><meta property=\"og:url\" content=\"https://tripofisch.com/free-utilities/americaspeoples/\"><meta property=\"og:image\" content=\"https://tripofisch.com/assets/americaspeoples-zoomed-out-overview.png\"><meta name=\"twitter:card\" content=\"summary_large_image\"><meta name=\"twitter:title\" content=\"Alaska Blackfish — Americas Peoples | TripoFisch\"><meta name=\"twitter:description\" content=\"Americas Peoples (Alaska Blackfish) is a literature-grounded, interactive historical atlas of the Americas and Pacific. Explore a playable northern Europe map, contested chronologies and sourced deep dives. Ordinary maps end in 1900 CE.\"><meta name=\"twitter:image\" content=\"https://tripofisch.com/assets/americaspeoples-zoomed-out-overview.png\"><title>Americas &amp; Pacific overview | The Spread of Peoples</title><link rel=\"icon\" href=\"https://tripofisch.com/assets/alaska-blackfish-logo.jpg\"><link rel=\"canonical\" href=\"https://tripofisch.com/spread-of-peoples/americas/about.html\"><link rel=\"stylesheet\" href=\"https://tripofisch.com/style.css?v=20261028-americas-privacy\"><style>header,main,footer{width:min(1440px,calc(100% - 40px));margin:auto}\n@media(min-width:701px) and (max-width:1740px){\n body:has(.layer-nav)>header,body:has(.layer-nav)>main,body:has(.layer-nav)>footer{\n  width:calc(100% - 178px);margin-left:154px;margin-right:24px\n }\n}\n@media(max-width:700px){\n header,main,footer{width:calc(100% - 28px)}\n}\nheader{min-height:60px;padding-top:10px;padding-bottom:10px}\nfooter{margin-top:24px;padding:14px 0}\n.back{margin-top:10px;font-size:12px}\n\n.ap-top-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1.25fr);gap:16px;align-items:stretch;padding:10px 0 14px;border-bottom:1px solid #dce5e9}\n.ap-left-col{display:flex;flex-direction:column;gap:10px}\n.ap-hero{padding:0!important;margin:0}\n.ap-hero .eyebrow{display:block;margin-bottom:3px}\n.ap-hero .utility-hero-logo{width:108px;height:108px;margin:0 0 8px 14px;border-radius:6px}\n.ap-hero h1{font-size:clamp(30px,3.8vw,44px);margin:2px 0 4px;letter-spacing:-1.4px;line-height:1.06}\n.ap-hero-sub{font-size:16px;font-weight:700;color:#17243d;margin:0 0 6px}\n.ap-hero p{font-size:14px;line-height:1.48;color:#3c4d5b;margin:0 0 8px}\n.ap-stat-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:10px 0}\n.ap-stat{background:#f3f8f9;border:1px solid #d5e2e6;border-radius:5px;padding:7px 9px}\n.ap-stat strong{display:block;font-size:16px;line-height:1.15;color:#17243d}\n.ap-stat span{display:block;font-size:10.5px;line-height:1.3;color:#526472;margin-top:2px}\n.ap-cta-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}\n.ap-cta-row .action-link{margin-top:0;padding:8px 13px;font-size:12.5px;gap:8px;border-radius:4px}\n.ap-btn-secondary{display:inline-flex;align-items:center;gap:6px;border:1px solid #087186;color:#087186;background:#fff;padding:7px 11px;font-size:12.5px;font-weight:600;border-radius:4px}\n.ap-btn-secondary:hover{background:#eef7f9}\n.ap-cta-row .curiosity{font-size:11.5px;margin-left:2px}\n.ap-hero-pillars{background:#f7fbfc;border:1px solid #d5e1e5;border-radius:6px;padding:11px 12px;flex:1;display:flex;flex-direction:column}\n.ap-hero-pillars>h3{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#087186;margin:0 0 8px}\n.ap-pillars-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;flex:1}\n.ap-pillar-tile{background:#fff;border:1px solid #d9e5e9;border-radius:4px;padding:8px 9px;font-size:12px;line-height:1.42;color:#304250}\n.ap-pillar-tile strong{display:block;color:#17243d;margin-bottom:3px;font-size:12.5px}\n\n.provenance-box{background:#f4f9fa;border:1px solid #c9dce1;border-top:4px solid #087186;border-radius:6px;padding:13px 15px;display:flex;flex-direction:column;gap:10px}\n.provenance-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap}\n.provenance-box h2{font-size:19px;letter-spacing:-.4px;margin:0;color:#17243d}\n.provenance-consensus{background:#fff;border:1px solid #d4e3e7;border-left:4px solid #087d95;border-radius:4px;padding:10px 12px}\n.provenance-consensus h3{font-size:13.5px;margin:0 0 6px;color:#087186;display:flex;align-items:center;justify-content:space-between;gap:8px}\n.provenance-consensus h3 a{color:#087186;text-decoration:underline;text-underline-offset:3px}\n.provenance-consensus p{font-size:12.8px;line-height:1.5;color:#273846;margin:0 0 6px}\n.provenance-thanks{font-size:11px!important;line-height:1.42!important;color:#526472!important;margin:7px 0 0!important;padding-top:6px;border-top:1px solid #e4edf0}\n.provenance-others h3{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#475c69;margin:0 0 7px}\n.sources-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}\n.source-tile{background:#fff;border:1px solid #d7e3e7;border-radius:4px;padding:8px 9px;font-size:11.8px;line-height:1.4;color:#304250}\n.source-tile strong{display:block;color:#17243d;margin-bottom:2px;font-size:12px}\n.source-tile a{color:#087186;font-weight:600;text-decoration:underline;text-underline-offset:3px}\n\n.ap-band{padding:14px 0;border-bottom:1px solid #dce5e9}\n.ap-band h2{font-size:20px;letter-spacing:-.4px;margin:0 0 6px;color:#17243d}\n.ap-band-lead{font-size:14px;line-height:1.5;color:#374957;margin:0 0 10px;max-width:110ch}\n.ap-band p{font-size:13.5px;line-height:1.48;color:#374957;margin:0 0 8px}\n.ap-band a:not(.action-link):not(.ap-btn-secondary){color:#087186;text-decoration:underline;text-underline-offset:3px}\n\n.ap-card-grid-4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:8px 0 2px}\n.ap-card{background:#fff;border:1px solid #d5e1e5;border-radius:5px;padding:11px 12px}\n.ap-card.tint{background:#f7fbfc}\n.ap-card h3{font-size:14px;margin:0 0 5px;color:#17243d;line-height:1.28}\n.ap-card p,.ap-card li{font-size:12.4px;line-height:1.42;color:#3d505e;margin:0 0 5px}\n.ap-card ul{margin:3px 0 0;padding-left:15px}\n.ap-card li:last-child,.ap-card p:last-child{margin-bottom:0}\n.ap-pill-tag{display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#087186;background:#e6f3f5;padding:2px 6px;border-radius:3px;margin-bottom:5px}\n.ap-badge-warn{display:inline-block;font-size:10.5px;font-weight:700;background:#fff4d8;border:1px solid #d9b45a;color:#5c4200;padding:1px 5px;border-radius:3px}\n\n.ap-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:8px}\n.ap-shot{margin:0;border:1px solid #cfdce0;border-radius:6px;background:#f8fbfc;overflow:hidden;display:flex;flex-direction:column}\n.ap-shot-link{display:block;border-bottom:1px solid #dce5e9;background:#10222b}\n.ap-shot img{display:block;width:100%;height:auto}\n.ap-shot figcaption{padding:9px 11px;font-size:12.2px;line-height:1.42;color:#334654;display:flex;flex-direction:column;flex:1}\n.ap-shot figcaption strong{display:block;font-size:13px;color:#17243d;margin-bottom:3px}\n.ap-shot-meta{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:auto;padding-top:6px;font-size:11.5px}\n\n.ap-feature-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;padding:14px 0 6px}\n.ap-feature-card{background:#fff;border:1px solid #dce5e9;border-radius:6px;padding:12px 13px;display:flex;flex-direction:column}\n.ap-feature-card.tint{background:#f7fbfc}\n.ap-feature-card h2{font-size:16.5px;letter-spacing:-.25px;margin:0 0 6px;color:#17243d}\n.ap-feature-card p{font-size:12.6px;line-height:1.46;color:#3c4d5b;margin:0 0 7px}\n.ap-feature-card ul{margin:4px 0 7px;padding-left:16px;font-size:12.3px;line-height:1.42;color:#3c4d5b}\n.ap-feature-card li{margin-bottom:4px}\n.ap-feature-card .ap-card-links{margin-top:auto;padding-top:5px;font-size:12px}\n.ap-feature-card a:not(.action-link):not(.ap-btn-secondary){color:#087186;text-decoration:underline;text-underline-offset:3px}\n\n.ap-span-2{grid-column:span 2}\n.source-code-section{border-top:1px solid #cde0e5;margin:0;background:#f3f8f9;border:1px solid #cde0e5;border-radius:6px;padding:12px 14px}\n.source-code-section h2{font-size:17px;margin:0 0 6px}\n.source-code-section p{font-size:12.6px;line-height:1.46;color:#3c4d5b;margin:0 0 7px}\n.ap-download-box{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(210px,1fr);gap:12px;align-items:center;margin:6px 0}\n.ap-download-box ul{margin:4px 0 0;padding-left:16px;font-size:12.2px;line-height:1.42;color:#304250}\n.ap-download-actions{display:flex;flex-direction:column;gap:7px;align-items:flex-start}\n.ap-download-actions .action-link{margin-top:0;padding:8px 12px;font-size:12.5px;border-radius:4px;text-decoration:none;color:#fff}\n.ap-download-actions .ap-btn-secondary{font-size:12px;padding:7px 10px;text-decoration:none}\n.ap-privacy-line{font-size:11.5px!important;color:#526472!important;margin:6px 0 0!important;padding-top:6px;border-top:1px solid #d5e3e7}\n\n@media(max-width:1100px){\n .ap-top-grid{grid-template-columns:1fr}\n .ap-card-grid-4,.ap-feature-grid{grid-template-columns:repeat(2,minmax(0,1fr))}\n}\n@media(max-width:900px){\n .sources-grid,.ap-pillars-grid,.ap-gallery{grid-template-columns:repeat(2,minmax(0,1fr))}\n}\n@media(max-width:640px){\n .ap-card-grid-4,.ap-feature-grid,.ap-gallery,.ap-pillars-grid,.sources-grid,.ap-download-box{grid-template-columns:1fr}\n .ap-span-2{grid-column:auto}\n .ap-stat-strip{grid-template-columns:repeat(2,minmax(0,1fr))}\n}\n@media(max-width:700px){\n .ap-hero .utility-hero-logo{float:none;display:block;width:96px;height:96px;margin:6px 0 8px}\n .page-section-nav{flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;white-space:nowrap;padding:6px 8px!important;gap:6px!important;bottom:8px!important}\n .page-section-nav a{flex:0 0 auto!important;white-space:nowrap!important;padding:6px 9px!important;font-size:11.5px!important}\n}</style><script type=\"application/ld+json\">{\"@context\":\"https://schema.org\",\"@graph\":[{\"@type\":\"WebApplication\",\"name\":\"Americas Peoples (Alaska Blackfish)\",\"alternateName\":[\"Alaska Blackfish\",\"Americas Peoples Human Atlas\"],\"url\":\"https://americaspeoples.11mosswood.us/\",\"sameAs\":[\"https://tripofisch.com/free-utilities/americaspeoples/\",\"https://github.com/gavinfischer-keenan/americaspeoples\"],\"applicationCategory\":\"EducationalApplication\",\"operatingSystem\":\"Web browser; self-host bundle for Windows, macOS, Linux (Python + SQLite)\",\"isAccessibleForFree\":true,\"license\":[\"https://polyformproject.org/licenses/noncommercial/1.0.0\",\"https://creativecommons.org/licenses/by-nc-sa/4.0/\"],\"description\":\"Americas Peoples (Alaska Blackfish) is a literature-grounded, interactive historical atlas of the Americas and Pacific. Explore a playable northern Europe map, contested chronologies and sourced deep dives. Ordinary maps end in 1900 CE. The separate Hawaiʻi statehood story continues through 1959.\",\"author\":{\"@type\":\"Organization\",\"name\":\"TripoFisch\",\"url\":\"https://tripofisch.com/\"},\"codeRepository\":\"https://github.com/gavinfischer-keenan/americaspeoples\",\"keywords\":\"Americas archaeology, peopling of the Americas, Beringia, Clovis, pre-Clovis, White Sands, Bluefish Caves, Monte Verde, Chaco Canyon, Machu Picchu, Cahokia, Indigenous history, forced removals, archaeogenomics, Glottolog, NOAA earthquakes, volcanic eruptions, NADI-1 ice sheets, HGIS de las Indias, CShapes, Micronesia, Polynesia, Consensus Deep Research, scholarly disagreements, gaps in the archaeological record\",\"featureList\":[\"Ordinary map timelines through 1900 CE, with the separate Hawaiʻi statehood story through 1959\",\"Independent playable Europe map with selected northern evidence, boundaries, voyages and local census observations\",\"Watch mode with guided historical stories and dated expeditions\",\"Explore mode with region jump, spatial search, category filters, and overlapping-point picker\",\"Deep Dives directory across Subjects, Places, Languages, and Cultures\",\"Zoomable USGS 3DEP and Mapzen/Tilezen shaded-relief site terrain maps\",\"Explicit tracking of attestation gaps, unresolved chronologies, scholarly disputes, and hard history\",\"Self-hostable open-source web app, Python API, SQLite database, and Excel/JSON research workbooks\"]},{\"@type\":\"Dataset\",\"name\":\"Americas Peoples Source-Linked Archaeological and Historical Evidence Dataset\",\"description\":\"11,201 archived Americas source-linked records with dating and evidence qualifications. A separate Europe catalogue contains 396 sourced records. Ordinary maps display through 1900 CE.\",\"url\":\"https://americaspeoples.11mosswood.us/sites/sources-attributions.html\",\"sameAs\":\"https://github.com/gavinfischer-keenan/americaspeoples\",\"isAccessibleForFree\":true,\"license\":\"https://creativecommons.org/licenses/by-nc-sa/4.0/\",\"temporalCoverage\":\"-68751/1959\",\"spatialCoverage\":[\"North America\",\"Central America\",\"South America\",\"Caribbean\",\"Beringia\",\"Polynesia\",\"Micronesia\",\"Melanesia\",\"Island Southeast Asia\",\"Australia\"],\"creator\":{\"@type\":\"Organization\",\"name\":\"TripoFisch\",\"url\":\"https://tripofisch.com/\"}}]}</script></head><body><a class=\"skip\" href=\"#main\">Skip to content</a><header><a class=\"wordmark\" href=\"https://tripofisch.com/\">TripoFisch<span class=\"dot\">.</span></a><nav aria-label=\"Main navigation\"><a href=\"https://electriceel.cc/\">Electric Eel</a><a href=\"https://tuskfish.us/\">Tusk Fish</a><a href=\"https://tripofisch.com/store/\">Store</a><a href=\"https://tripofisch.com/free-utilities/\">Utilities &amp; Games</a><a href=\"https://tripofisch.com/animals/\">Animals</a><a href=\"https://tripofisch.com/news/\">News</a><a href=\"https://tripofisch.com/about-us/\">About us</a></nav></header><main id=\"main\"><aside style=\"padding:18px 22px;margin:20px 0;border:1px solid #4a8b91;border-radius:10px;background:#e8f5f3;color:#183b47\"><strong>The Spread of Peoples · Americas &amp; Pacific</strong><p>This regional introduction preserves the v0.31.0 overview and visual tour. Release-specific counts below describe that edition. <a href=\"/spread-of-peoples/\">World entrance and current coverage</a> · <a href=\"/spread-of-peoples/americas/\">Open the Americas map</a></p></aside><nav class=\"layer-nav page-section-nav\" aria-label=\"On this page\"><a href=\"#section-alaska-blackfish\">Overview &amp; sources</a><a href=\"#section-what-this-is\">What this is</a><a href=\"#section-visual-tour\">Screenshots &amp; tour</a><a href=\"#section-data-integrity-and-hard-history\">Gaps, debate &amp; hard history</a><a href=\"#section-climate-hazards-and-gaps-in-the-record\">Climate &amp; hazards</a><a href=\"#section-watch-and-explore\">Watch, Explore &amp; Dives</a><a href=\"#section-connected-history\">Connected history</a><a href=\"#section-free-education\">Free education &amp; reuse</a><a href=\"#section-downloads-and-source-code\">Downloads &amp; source code</a></nav><a class=\"back\" href=\"https://tripofisch.com/\">← TripoFisch</a>\n\n<div class=\"ap-top-grid\">\n <div class=\"ap-left-col\">\n  <section class=\"page-intro ap-hero\">\n   <span class=\"eyebrow\">Free utility · Americas Peoples · Open-Access Historical Atlas</span>\n   <img class=\"utility-hero-logo\" src=\"https://tripofisch.com/assets/alaska-blackfish-logo.jpg\" alt=\"Alaska Blackfish logo — a fish carrying a pack across an icy landscape\" width=\"108\" height=\"108\">\n   <h1 id=\"section-alaska-blackfish\">Alaska Blackfish<span class=\"dot\">.</span></h1>\n   <p class=\"ap-hero-sub\">Americas Peoples — Interactive Archaeological &amp; Historical Atlas</p>\n   <p>An open-access atlas of archaeological, genomic, linguistic, environmental and archival evidence from the Americas and Pacific. The playable Europe atlas starts with northern regions. Ordinary maps display through 1900 CE. The separate Hawaiʻi statehood story continues through 1959.</p>\n   <div class=\"ap-stat-strip\" aria-label=\"Atlas scale at a glance\">\n    <div class=\"ap-stat\"><strong>11,201</strong><span>Americas evidence records</span></div>\n    <div class=\"ap-stat\"><strong>396</strong><span>Europe evidence records</span></div>\n    <div class=\"ap-stat\"><strong>110+</strong><span>Consensus Deep runs</span></div>\n    <div class=\"ap-stat\"><strong>60</strong><span>World deep dives</span></div>\n   </div>\n   <div class=\"ap-cta-row\">\n    <a class=\"action-link\" href=\"https://americaspeoples.11mosswood.us/#movie\">Launch Americas Peoples ↗</a>\n    <a class=\"ap-btn-secondary\" href=\"https://americaspeoples.11mosswood.us/#dives\">Browse Deep Dives ↗</a>\n    <a class=\"ap-btn-secondary\" href=\"https://github.com/gavinfischer-keenan/americaspeoples\">GitHub Source &amp; Releases ↗</a>\n    <a class=\"curiosity\" href=\"https://tripofisch.com/fish/alaska-blackfish/\">About the fish →</a>\n   </div>\n  </section>\n\n  <div class=\"ap-hero-pillars\">\n   <h3>Core Editorial Principles at a Glance</h3>\n   <div class=\"ap-pillars-grid\">\n    <div class=\"ap-pillar-tile\">\n     <strong>100% Literature-Grounded</strong>\n     Every marker and route cites primary archaeological, genomic, linguistic, or archival papers &mdash; keeping pre-Clovis vs. Clovis chronologies and competing dates intact.\n    </div>\n    <div class=\"ap-pillar-tile\">\n     <strong>Gaps &amp; Map Integrity</strong>\n     Attestation gaps dim earlier places rather than erasing peoples; undated finds stay visible as <code>?</code> markers; <span class=\"ap-badge-warn\">AI generated facts</span> rows are visibly segregated.\n    </div>\n    <div class=\"ap-pillar-tile\">\n     <strong>Conflict and coercion</strong> Shows monumental cities and exchange alongside selected conflict, epidemics, slavery, forced removals, labour abuses and broken treaties.\n    </div>\n   </div>\n  </div>\n </div>\n\n <aside class=\"provenance-box\" id=\"section-where-the-data-came-from\" aria-labelledby=\"provenance-heading\">\n  <div class=\"provenance-head\">\n   <div>\n    <span class=\"eyebrow\">High-Level Provenance</span>\n    <h2 id=\"provenance-heading\">Where the data came from</h2>\n   </div>\n   <a class=\"ap-btn-secondary\" href=\"https://americaspeoples.11mosswood.us/sites/sources-attributions.html\">Full 8,320+ Source Register ↗</a>\n  </div>\n\n  <div class=\"provenance-consensus\">\n   <h3><span>Primary Paper Discovery: Consensus</span><a href=\"https://consensus.app/\" target=\"_blank\" rel=\"noopener\">consensus.app ↗</a></h3>\n   <p>We use Consensus a lot &mdash; Deep Research and paper lookups across archaeology, 14C/OSL dating, ancient DNA, linguistics, and archival history helped surface the primary studies behind this atlas. We do not reproduce the full Consensus Deep Research reviews here. Visit Consensus to explore its reviews and follow the literature for yourself; access may require an account or subscription. The atlas&rsquo;s own deep dives are independently authored, mostly with AI assistance, and checked against the cited primary sources. We tried the different paper retrieval and summary tools, and this is the best at getting you useful answers quickly. No &mdash; this is not paid for by them in any way.</p>\n   <p class=\"provenance-thanks\">Thank you to the Consensus team for building such a cool research engine. <em>Americas Peoples</em> is an independent TripoFisch project and is not affiliated with, authorized by, sponsored by, or endorsed by Consensus.</p>\n  </div>\n\n  <div class=\"provenance-others\">\n   <h3>Other major sources we drew heavily from</h3>\n   <div class=\"sources-grid\">\n    <div class=\"source-tile\">\n     <strong>Peer-Reviewed Journals (1,600+ DOIs)</strong>\n     <em>Nature</em>, <em>Science</em>, <em>PNAS</em>, <em>PLOS ONE</em>, <em>Latin American Antiquity</em>, <em>American Antiquity</em>, <em>QSR</em>, Cambridge, SciELO, ANU Press, and PMC.\n    </div>\n    <div class=\"source-tile\">\n     <strong>NOAA / NCEI &amp; Smithsonian GVP</strong>\n     2,580+ historical earthquake epicenters &amp; tsunami source events, Gergis &amp; Fowler ENSO series, and 668+ Holocene eruptions.\n    </div>\n    <div class=\"source-tile\">\n     <strong>Glacial Sheets &amp; Terrain Rasters</strong>\n     Dalton et al. <em>NADI-1</em> deglacial isochrones, USGS 3DEP elevation rasters, Mapzen/Tilezen Terrain Tiles, and Natural Earth.\n    </div>\n    <div class=\"source-tile\">\n     <strong>Heritage &amp; Community Archives</strong>\n     U.S. National Park Service (NPMap, Chaco Archive, ABPP), Mexico INAH &amp; SIC, Parks Canada, UNESCO, Crow Canyon, SPARC, Indigenous histories.\n    </div>\n    <div class=\"source-tile\">\n     <strong>Historical GIS, Rail &amp; Languages</strong>\n     Stangl <em>HGIS de las Indias</em>, <em>CShapes 2.0</em>, Seshat <em>Cliopatria</em>, Newberry County Boundaries, Atack U.S. Railroads, and <em>Glottolog</em>.\n    </div>\n    <div class=\"source-tile\">\n     <strong>Locality Anchors &amp; Register</strong>\n     <em>GeoNames</em> &amp; <em>OpenStreetMap</em> locality coordinates. <a href=\"https://americaspeoples.11mosswood.us/sites/sources-attributions.html\">Browse all 8,320+ entries &amp; licenses ↗</a>\n    </div>\n   </div>\n  </div>\n </aside>\n</div>\n\n<section class=\"ap-band\" id=\"section-what-this-is-wrap\">\n <span class=\"eyebrow\">Reference Anchor · For Researchers, Search Engines &amp; AI Agents</span>\n <h2 id=\"section-what-this-is\">What this is</h2>\n <p class=\"ap-band-lead\"><strong>Americas Peoples (Alaska Blackfish)</strong> is a free, noncommercial, open-source-code historical and archaeological web atlas (<a href=\"https://americaspeoples.11mosswood.us/#movie\">americaspeoples.11mosswood.us</a>) built to inspect human presence, movement, architecture, language, conflict, climate, and natural hazards on one synchronized timeline &mdash; <strong>100% literature-grounded</strong>, preserving <strong>scholarly disagreements and gaps in the record</strong>, and <strong>never ducking the hard history</strong>.</p>\n\n <div class=\"ap-card-grid-4\" aria-label=\"Core atlas methodology and structured scope\">\n  <article class=\"ap-card tint\">\n   <span class=\"ap-pill-tag\">100% Literature-Based</span>\n   <h3>Citations &amp; Scholarly Disagreements</h3>\n   <p>Every marker, route, and phase links to DOIs or archival sources with explicit access notes.</p>\n   <ul>\n    <li><strong>Debates intact:</strong> Red and gold map rims flag contested chronologies &mdash; pre-Clovis vs. Clovis (White Sands, Bluefish Caves, Monte Verde, Pedra Furada), coastal vs. interior routes, aDNA admixture timing, and linguistic dispersals.</li>\n   </ul>\n  </article>\n\n  <article class=\"ap-card tint\">\n   <span class=\"ap-pill-tag\">Gaps &amp; Data Integrity</span>\n   <h3>Missing Evidence &amp; Map Guardrails</h3>\n   <ul>\n    <li><strong>Attestation gaps &amp; <code>?</code> dates:</strong> Dim earlier places into context rather than pretending peoples vanished; keep undated finds visible.</li>\n    <li><strong>Habitation and departure:</strong> Dated continuity and ending evidence have different meanings. Some dates only document activity at a particular place.</li>\n    <li><strong>Population evidence:</strong> Cited town counts support sizing where available. Optional interpolation is labeled. Other symbols aid legibility, and <span class=\"ap-badge-warn\">AI generated facts</span> rows are segregated.</li>\n   </ul>\n  </article>\n\n  <article class=\"ap-card tint\">\n   <span class=\"ap-pill-tag\">Unvarnished Record</span>\n   <h3>Conflict and coercion</h3>\n   <ul>\n    <li><strong>Pre-contact &amp; imperial conflicts:</strong> Warfare, fortifications, raiding, captives, and state coercion prior to European arrival.</li>\n    <li><strong>Colonial &amp; state violence:</strong> Epidemics, Indigenous and transatlantic slavery, missionization, rubber/guano/pearling peonage, massacres (e.g., Bloody Island), broken treaties, and forced removals.</li>\n    <li><strong>1900 display ceiling:</strong> Ordinary maps display through 1900 CE. The evidence still retains its original dates.</li>\n   </ul>\n  </article>\n\n  <article class=\"ap-card tint\">\n   <span class=\"ap-pill-tag\">Scope &amp; Modes</span>\n   <h3>Geography, Clock &amp; Views</h3>\n   <ul>\n    <li><strong>Regions:</strong> The Americas and Pacific, plus playable northern Europe. Africa and Asia–Pacific previews open into deep dives.</li>\n    <li><strong>Timeline &amp; disciplines:</strong> Ordinary maps end in 1900 CE, with the separate Hawaiʻi statehood story through 1959. Includes radiocarbon, OSL, ancient DNA, language history and hazards.</li>\n    <li><strong>Modes:</strong> <strong>Watch</strong>, <strong>Explore</strong>, <strong>Deep Dives</strong>, <strong>Library</strong> + Python/SQLite bundle.</li>\n   </ul>\n  </article>\n </div>\n</section>\n\n<section class=\"ap-band\" id=\"section-visual-tour-wrap\">\n <h2 id=\"section-visual-tour\">Inside the atlas: zoomed out, zoomed in &amp; deep dives</h2>\n <p class=\"ap-band-lead\">Live screenshots from <a href=\"https://americaspeoples.11mosswood.us/#movie\">americaspeoples.11mosswood.us</a> showing the zoomed-out hemisphere view, three zoomed-in regions with claim caveats, the Deep Dives directory, and a labeled site terrain guide.</p>\n\n <div class=\"ap-gallery\">\n  <figure class=\"ap-shot\">\n   <a class=\"ap-shot-link\" href=\"https://americaspeoples.11mosswood.us/#movie\" target=\"_blank\" rel=\"noopener\">\n    <img src=\"https://tripofisch.com/assets/americaspeoples-zoomed-out-overview.png\" alt=\"Americas Peoples Watch mode zoomed out across the Pacific and Americas at 1492 CE, showing clustered records, active connections, and the logarithmic timeline.\" width=\"1440\" height=\"900\" loading=\"lazy\">\n   </a>\n   <figcaption>\n    <strong>1. Zoomed out &mdash; hemisphere overview (1492 CE)</strong>\n    One synchronized clock links Beringia, the Americas, Caribbean, Australia, and Pacific with cluster counts and active links.\n    <div class=\"ap-shot-meta\"><a href=\"https://americaspeoples.11mosswood.us/#movie\" target=\"_blank\" rel=\"noopener\">Open Watch mode ↗</a><span>Logarithmic timeline</span></div>\n   </figcaption>\n  </figure>\n\n  <figure class=\"ap-shot\">\n   <a class=\"ap-shot-link\" href=\"https://americaspeoples.11mosswood.us/#explore\" target=\"_blank\" rel=\"noopener\">\n    <img src=\"https://tripofisch.com/assets/americaspeoples-zoomed-in-chaco.png\" alt=\"Explore mode zoomed into the Pueblo Southwest and Chaco Canyon, showing pre-Clovis entries on the left, map connections, unresolved question marks, and a Chaco Canyon record detail panel on the right.\" width=\"1440\" height=\"900\" loading=\"lazy\">\n   </a>\n   <figcaption>\n    <strong>2. Zoomed in &mdash; Southwest &amp; Chaco caveats</strong>\n    Expands pre-Clovis records (Gault, White Sands), gray <code>?</code> undated finds, conflict icons, and early Chaco maize pollen caveats.\n    <div class=\"ap-shot-meta\"><a href=\"https://americaspeoples.11mosswood.us/#explore\" target=\"_blank\" rel=\"noopener\">Explore Southwest ↗</a><span>Evidence &amp; uncertainty</span></div>\n   </figcaption>\n  </figure>\n\n  <figure class=\"ap-shot\">\n   <a class=\"ap-shot-link\" href=\"https://americaspeoples.11mosswood.us/#explore\" target=\"_blank\" rel=\"noopener\">\n    <img src=\"https://tripofisch.com/assets/americaspeoples-zoomed-in-andes.png\" alt=\"Explore mode zoomed into the Andean heartland around Machu Picchu, showing dense settlement and road records with citations.\" width=\"1440\" height=\"900\" loading=\"lazy\">\n   </a>\n   <figcaption>\n    <strong>3. Zoomed in &mdash; Andean Heartland &amp; Machu Picchu</strong>\n    Displays regional Andean occupations and road links alongside competing Bayesian chronological models in the inspector.\n    <div class=\"ap-shot-meta\"><a href=\"https://americaspeoples.11mosswood.us/#explore\" target=\"_blank\" rel=\"noopener\">Explore the Andes ↗</a><span>Scholarly debate intact</span></div>\n   </figcaption>\n  </figure>\n\n  <figure class=\"ap-shot\">\n   <a class=\"ap-shot-link\" href=\"https://americaspeoples.11mosswood.us/#explore\" target=\"_blank\" rel=\"noopener\">\n    <img src=\"https://tripofisch.com/assets/americaspeoples-zoomed-in-pacific.png\" alt=\"Explore mode zoomed into Micronesia and the Western Pacific around Nan Madol, showing island sites and exchange connections.\" width=\"1440\" height=\"900\" loading=\"lazy\">\n   </a>\n   <figcaption>\n    <strong>4. Zoomed in &mdash; Pacific &amp; Micronesia networks</strong>\n    Palau, Yap, Pohnpei (Nan Madol), and Kiribati: oceanic exchange routes, coral-dated stonework, and departure vs. gap cues.\n    <div class=\"ap-shot-meta\"><a href=\"https://americaspeoples.11mosswood.us/#explore\" target=\"_blank\" rel=\"noopener\">Explore Pacific ↗</a><span>Maritime &amp; island gaps</span></div>\n   </figcaption>\n  </figure>\n\n  <figure class=\"ap-shot\">\n   <a class=\"ap-shot-link\" href=\"https://americaspeoples.11mosswood.us/#dives\" target=\"_blank\" rel=\"noopener\">\n    <img src=\"https://tripofisch.com/assets/americaspeoples-deep-dives-list.png\" alt=\"Americas Peoples Deep Dives catalog showing organized tabs and cards for Subjects, Places, Languages, and Cultures.\" width=\"1440\" height=\"900\" loading=\"lazy\">\n   </a>\n   <figcaption>\n    <strong>5. Lists of Deep Dives &mdash; four research catalogs</strong>\n    Browse topic movies, contextual stories, and dedicated guides organized across Subjects, Places, Languages, and Cultures.\n    <div class=\"ap-shot-meta\"><a href=\"https://americaspeoples.11mosswood.us/#dives\" target=\"_blank\" rel=\"noopener\">Browse Deep Dives ↗</a><span>4 directory tabs</span></div>\n   </figcaption>\n  </figure>\n\n  <figure class=\"ap-shot\">\n   <a class=\"ap-shot-link\" href=\"https://americaspeoples.11mosswood.us/sites/chaco.html\" target=\"_blank\" rel=\"noopener\">\n    <img src=\"https://tripofisch.com/assets/americaspeoples-chaco-terrain-guide.png\" alt=\"Chaco Canyon Deep Dive guide page displaying a labeled USGS/Tilezen shaded-relief terrain map with numbered great houses and archaeological sites.\" width=\"1440\" height=\"900\" loading=\"lazy\">\n   </a>\n   <figcaption>\n    <strong>6. Inside a Place Deep Dive &mdash; Chaco terrain guide</strong>\n    Zoomable USGS/Tilezen shaded-relief maps with 50 m contours, numbered site anchors, road links, and cited chapters.\n    <div class=\"ap-shot-meta\"><a href=\"https://americaspeoples.11mosswood.us/sites/chaco.html\" target=\"_blank\" rel=\"noopener\">Open Chaco guide ↗</a><span>100+ terrain maps</span></div>\n   </figcaption>\n  </figure>\n </div>\n</section>\n\n<div class=\"ap-feature-grid\">\n <section class=\"ap-feature-card\">\n  <h2 id=\"section-data-integrity-and-hard-history\">Gaps, debate &amp; hard history</h2>\n  <p>Built around epistemic honesty: what literature supports, where researchers disagree, and where archives have blind spots.</p>\n  <ul>\n   <li><strong>Markers never erase peoples:</strong> Dimming across an attestation gap preserves context rather than claiming extinction.</li>\n   <li><strong>Culture, language &amp; DNA stay separate:</strong> Culture colors are supported identifications, not racial categories; aDNA never dictates spoken language.</li>\n   <li><strong>AI registry segregated:</strong> Author-supplied colonial rows carry <strong>AI generated facts</strong> badges with conflicting counts excluded from sizing.</li>\n  </ul>\n  <p class=\"ap-card-links\"><a href=\"https://americaspeoples.11mosswood.us/docs/coverage-audit.html\">Coverage audit ↗</a> · <a href=\"https://americaspeoples.11mosswood.us/docs/colonial-ai-registry.html\">AI colonial registry ↗</a></p>\n </section>\n\n <section class=\"ap-feature-card\">\n  <h2 id=\"section-climate-hazards-and-gaps-in-the-record\">Climate &amp; physical hazards</h2>\n  <p>Sourced North American deglacial ice-sheet snapshots (<em>NADI-1</em> optimal/min/max), Gergis &amp; Fowler ENSO reconstructions, Smithsonian Holocene eruptions, and NOAA/NCEI earthquake and tsunami catalogs.</p>\n  <p>Modern schematic current and trade-wind arrows add oceanic context without reconstructing ancient coasts. A volcano or quake beside a site <strong>never</strong> asserts unproven causation. Undated finds stay inspectable as gray <code>?</code> markers.</p>\n  <p class=\"ap-card-links\"><a href=\"https://americaspeoples.11mosswood.us/#physical\">Hazard catalog ↗</a> · <a href=\"https://americaspeoples.11mosswood.us/docs/map-marker-audit.html\">Marker audit ↗</a></p>\n </section>\n\n <section class=\"ap-feature-card\">\n  <h2 id=\"section-watch-and-explore\">Watch, Explore &amp; Deep Dives</h2>\n  <p><strong>Watch</strong> plays dated evidence through 1900. Browse 84 contextual stories, 28 independent topics and a different clock for Hawaiʻi statehood through 1959.</p>\n  <p><strong>Explore</strong> jumps to any region, searches the full corpus, filters by places, connections, conflict, research overlays, or shipwrecks, and opens individual picks at crowded points.</p>\n  <p class=\"ap-card-links\"><a href=\"https://americaspeoples.11mosswood.us/#movie\">Watch ↗</a> · <a href=\"https://americaspeoples.11mosswood.us/#explore\">Explore ↗</a> · <a href=\"https://americaspeoples.11mosswood.us/#library\">Library ↗</a> · <a href=\"https://americaspeoples.11mosswood.us/docs/ui-redesign.html\">UI guide ↗</a></p>\n </section>\n\n <section class=\"ap-feature-card\">\n  <h2 id=\"section-connected-history\">Connected history &amp; terrain</h2>\n  <p>The Americas catalogue retains 11,201 records and 175 archived voyages. The playable Europe atlas starts with northern Europe and the North Atlantic, with 396 evidence records, 362 dated boundary versions and 25 connected canonical voyages.</p>\n  <p>60 world deep dives include 19 new studies, with selected Norse raids, Pictish history, Ötzi and other cold-preserved people. The release includes 187 terrain maps, 26 historical or reference maps and 87 paired originals and translations.</p>  <p><a href=\"https://americaspeoples.11mosswood.us/#atlas/europe\">Play the Europe atlas ↗</a> · <a href=\"https://americaspeoples.11mosswood.us/europe-coverage-audit.json\">Read the northern coverage audit ↗</a></p>\n  <p class=\"ap-card-links\"><a href=\"https://americaspeoples.11mosswood.us/#dives\">Deep Dives ↗</a> · <a href=\"https://americaspeoples.11mosswood.us/docs/sparse-ten-histories.html\">Sparse regions ↗</a> · <a href=\"https://americaspeoples.11mosswood.us/docs/voyage-coverage-review.html\">Voyages ↗</a></p>\n </section>\n\n <section class=\"ap-feature-card tint\">\n  <h2 id=\"section-free-education\">Free education &amp; reuse</h2>\n  <p>Americas Peoples is and will remain free with zero ads, paywalls, or accounts. Classroom sharing, translations, and scholarly corrections are encouraged.</p>\n  <p>Original software uses <strong>PolyForm Noncommercial 1.0.0</strong>; original educational prose and copyrightable curated data use <strong>CC BY-NC-SA 4.0</strong>. Third-party datasets and photos retain their own terms.</p>\n  <p class=\"ap-card-links\"><a href=\"https://americaspeoples.11mosswood.us/LICENSE.md\">License scope ↗</a> · <a href=\"https://americaspeoples.11mosswood.us/docs/reuse-and-contributing.html\">Reuse guide ↗</a></p>\n </section>\n\n <section class=\"ap-feature-card tint\">\n  <h3>Research ethics &amp; AI authorship</h3>\n  <p>Full Consensus responses remain private to respect platform terms; every public atlas record relies on original explanations independently authored (mostly by AI agents) and verified against linked primary sources.</p>\n  <p>Citations never claim endorsement by cited scholars, Indigenous communities, or research platforms.</p>\n  <p class=\"ap-card-links\"><a href=\"https://americaspeoples.11mosswood.us/CONTRIBUTING.md\">Submit a correction ↗</a> · <a href=\"https://americaspeoples.11mosswood.us/docs/reuse-and-contributing.html\">Consensus policy ↗</a></p>\n </section>\n\n <section class=\"source-code-section ap-feature-card ap-span-2\">\n  <h2 id=\"section-downloads-and-source-code\">Downloads and source code</h2>\n  <div class=\"ap-download-box\">\n   <div>\n    <p>The v0.31.0 self-host bundle, researched Excel workbook, blank import template, SHA-256 checksums and source code are available from the GitHub release.</p>\n    <ul>\n     <li><strong>Self-host bundle:</strong> Includes frontend, Python API server, SQLite database (<code>atlas.sqlite3</code>), license notices, and HTTP setup instructions.</li>\n     <li><strong>Data &amp; schemas:</strong> Current researched spreadsheet, import template, and JSON datasets are in the latest GitHub Release.</li>\n    </ul>\n   </div>\n   <div class=\"ap-download-actions\">\n    <a class=\"action-link\" href=\"https://github.com/gavinfischer-keenan/americaspeoples\">Source code on GitHub ↗</a>\n    <a class=\"ap-btn-secondary\" href=\"https://github.com/gavinfischer-keenan/americaspeoples/releases/latest\">Latest GitHub Release (ZIP, XLSX &amp; SHA-256) ↗</a>\n    <a href=\"https://americaspeoples.11mosswood.us/docs/bulk-import-guide.html\">Contribution format &amp; bulk import guide ↗</a>\n   </div>\n  </div>\n  <p class=\"ap-privacy-line\">Local research privacy: private spreadsheet imports, drafts, and edits stay in your browser&rsquo;s local storage and are never uploaded (export JSON to back up drafts); ordinary server requests fetch public atlas records and search queries, and TripoFisch pages use Cloudflare usage analytics &mdash; <a href=\"https://tripofisch.com/privacy/\">read our privacy notice</a>.</p>\n </section>\n</div>\n</main><footer><a href=\"https://tripofisch.com/\">TripoFisch</a><span>© 2026 TripoFisch</span><span class=\"privacy-disclosure\">Cloudflare usage &amp; performance analytics · <a href=\"https://tripofisch.com/privacy/\">Privacy</a></span></footer></body></html>\n";
