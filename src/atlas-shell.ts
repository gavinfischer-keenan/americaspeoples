import { esc } from './dom';
import { HISTORY_LABELS } from './history';
import { OVERLAY_LABELS } from './overlays';
import { climateKinds,climateLabels } from './physical';
import { exploreCategories } from './explore';
import { stories } from './stories';

export function appShell(count:number,endYear:number):string{return `
<a class="skip-link" href="#main" data-skip-content>Skip to content</a>
<header class="topbar"><a class="brand" href="#world"><span class="brand-mark" aria-hidden="true">◈</span><span><h1>The Spread of Peoples</h1><small>ALASKA BLACKFISH</small></span></a>
<nav aria-label="Main navigation"><a href="#world">World</a><a href="#movie">Americas</a><a href="#atlas/pacific">Pacific</a><a href="#atlas/africa">Africa</a><a href="#atlas/europe">Europe</a><a href="#atlas/asia-pacific">Asia</a><a href="#explore">Explore</a><a href="#dives">Deep dives</a><a href="#physical">Climate</a><a href="#library">Library</a></nav>
<a class="header-about" href="#about" aria-label="About this atlas">About ↗</a></header>
<div class="shell"><main id="main" tabindex="-1"></main></div>
<footer class="timeline" aria-label="Playback and date">
 <div class="transport-row"><div class="year-display"><span class="eyebrow">MAP YEAR</span><strong id="current-year"></strong></div>
 <div class="playback"><button id="restart" title="Restart" aria-label="Restart">↤</button><button id="previous-scene" aria-label="Previous scene">‹</button><button id="play" class="play-button" aria-label="Play">▶ Play</button><button id="next-scene" aria-label="Next scene">›</button></div>
 <label class="americas-jump-wrap">Jump to<select id="americas-jump" aria-label="Jump to period"><option value="">Choose a period…</option><option value="-68751">Earliest evidence</option><option value="-12000">Ice Age &amp; crossings</option><option value="1">First century CE</option><option value="1000">1000 CE</option><option value="1492">1492 CE</option><option value="1832">1832 CE</option><option value="1900">1900 CE</option></select></label>
 <div id="story-position"><span id="story-progress-label"></span><input id="story-progress" type="range" min="0" max="1000" value="0" aria-label="Story progress"></div>
 <label class="story-speed">Pace<select id="story-speed" aria-label="Story pace"><option value="1">Relaxed</option><option value="1.5">Brisk</option><option value="0.75">More reading time</option></select></label>
 <button id="time-settings-toggle" aria-expanded="false" aria-controls="time-settings">Date &amp; speed</button></div>
 <div id="time-settings" hidden><div class="time-settings-row"><label id="compact-story-pace">Story pace<select id="story-speed-compact" aria-label="Reading pace for stories"><option value="1">Relaxed</option><option value="1.5">Brisk</option><option value="0.75">More reading time</option></select></label><label>Speed<select id="speed" aria-label="Playback speed"><option value="smart" selected>Smart · evidence density</option><option value="10">10 years / sec</option><option value="50">50 years / sec</option><option value="250">250 years / sec</option><option value="1000">1,000 years / sec</option></select></label><label>Scale<select id="time-scale" aria-label="Timeline scale"><option value="log" selected>Logarithmic</option><option value="linear">Linear</option></select></label>
 <form id="year-form" class="year-form"><label class="sr-only" for="year-number">Year number</label><input id="year-number" type="number" min="1" step="1" aria-label="Year number"><select id="era" aria-label="Era"><option>BCE</option><option>CE</option></select><button type="submit" aria-label="Go to year">Go</button></form>
 <label>Timeline window<select id="window" aria-label="Timeline window"><option value="all">Entire record</option><option value="1000">± 1,000 years</option><option value="100">± 100 years</option><option value="10">± 10 years</option></select></label></div><p class="fine">Story dates mark curated stops; linked records keep their full dating range.</p></div>
 <div id="time-error" role="alert"></div><div class="slider-wrap"><input type="range" id="time-slider" min="0" max="1000000" step="1" value="0" aria-label="Timeline year" aria-describedby="timeline-note"><div id="time-ticks" class="time-ticks" aria-hidden="true"></div><div class="range-labels"><span id="range-start"></span><span id="timeline-note">Logarithmic scale</span><span id="range-end">${endYear} CE</span></div></div>
</footer>
<footer id="explore-timeline" class="explore-timeline" hidden aria-label="Explore date range">
 <div class="explore-timeline-top">
  <div class="explore-range-readout"><span class="eyebrow">DATE WINDOW</span><strong id="explore-min-label"></strong><span class="explore-range-sep">–</span><strong id="explore-max-label"></strong><span id="explore-range-count" class="explore-range-count"></span></div>
  <div class="explore-presets" role="group" aria-label="Time window presets">
   <button type="button" data-explore-preset="all">All time</button>
   <button type="button" data-explore-preset="-7238050,-98050">~7.2 Ma – 100 ka</button>
   <button type="button" data-explore-preset="-98050,-9999">100 ka – 10,000 BCE</button>
   <button type="button" data-explore-preset="-9999,1">10,000 BCE – 1 CE</button>
   <button type="button" data-explore-preset="1,1900">1 CE – 1900 CE</button>
   <button type="button" id="explore-hide-wrecks-btn" class="explore-wrecks-btn" aria-pressed="false" title="Hide shipwreck records to highlight land sites, art, and migrations">Hide shipwrecks</button>
  </div>
 </div>
 <div class="dual-slider-wrap">
  <div class="dual-slider">
   <div class="dual-slider-track"></div>
   <div id="explore-range-fill" class="dual-slider-fill"></div>
   <input type="range" id="explore-range-min" min="0" max="10000" step="1" value="0" aria-label="Earliest date">
   <input type="range" id="explore-range-max" min="0" max="10000" step="1" value="10000" aria-label="Latest date">
  </div>
  <div id="explore-range-ticks" class="explore-range-ticks" aria-hidden="true"></div>
 </div>
</footer>
<div id="toast" role="status"></div><span id="proposal-count" hidden>${count}</span>`;}

export interface MapShellOptions {
 atlasMode:'movie'|'explore';atlasRegion:'americas'|'pacific';storyList:typeof stories;hiddenHistory:ReadonlySet<string>;showPastPlaces:boolean;
 showUndated:boolean;showNaturalEvents:boolean;showIce:boolean;iceScenario:string;hiddenClimate:ReadonlySet<string>;
 showUncertainHazards:boolean;showCurrents:boolean;showWinds:boolean;showModeled:boolean;hiddenLayers:ReadonlySet<string>;
 preview:boolean;legendSearch:string;languageLinks:string;
}
export function mapShell(o:MapShellOptions):string{
 const check=(value:boolean)=>value?'checked':'';
 const isExplore=o.atlasMode==='explore';
 const isPacific=!isExplore&&o.atlasRegion==='pacific';
 const eyebrow=isExplore?'GLOBAL EXPLORE · ALL REGIONS':isPacific?'AUSTRALIA &amp; PACIFIC':'AMERICAS';
 const heading=isExplore?'Explore the world across time':isPacific?'Places, voyaging and connections':'Places, migrations and connections';
 const originsHref=isExplore?'#origins':isPacific?'#origins/pacific':'#origins/americas';
 const regionAll=isPacific?'Australia &amp; Pacific · all histories':'Americas · all histories';
 const overviewLabel=isPacific?'↔ Pacific overview · all histories':'↔ Americas overview · all histories';
 return `<header class="europe-heading americas-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${heading}</h1></div><nav class="subhead-links" aria-label="Related views"><a href="${originsHref}">The branching human family</a><a href="sites/world-human-family.html">Family guide ↗</a></nav></header><div id="atlas-map-navigation"></div><div id="atlas-map-settings-controls" class="atlas-tools"><button id="toggle-sites" aria-controls="site-panel" aria-expanded="true" data-map-menu-choice>Hide places list</button><button id="focus-mode" aria-pressed="false" data-map-menu-choice>Focus view</button></div>
 <div class="map-layout atlas-layout detail-panel-hidden ${o.atlasMode==='movie'?'site-panel-hidden':''}">
 <aside id="story-panel" class="story-panel" ${o.atlasMode==='explore'?'hidden':''} aria-label="Guided story"><details id="story-picker-section" class="story-section" open><summary>Watch a story</summary><div class="story-intro"><label class="sr-only" for="story-select">Choose a story</label><select id="story-select" aria-label="Choose a story"><option value="free">${regionAll}</option>${o.storyList.map(s=>`<option value="${esc(s.id)}">${esc(s.title)}</option>`).join('')}</select><p id="story-description"></p><button id="whole-movie" class="whole-movie-button">${overviewLabel}</button><label class="journey-picker">Or follow an expedition<select id="watch-voyage" aria-label="Follow an expedition"><option value="">Choose a dated journey…</option></select></label></div></details><details id="story-chapter-section" class="story-section"><summary>Story and current chapter</summary><div id="story-scene"></div><div id="story-chapters" aria-label="Story scenes"></div></details><section id="concurrent-context" class="concurrent-context" aria-label="Contemporary world"></section><div class="story-footnote"><a href="#library">Explore sources &amp; methods ↗</a></div></aside>
 <aside id="site-panel" class="site-panel" ${o.atlasMode==='movie'?'hidden':''} aria-label="Places and local events"><div class="explore-intro"><span class="eyebrow">EXPLORE PLACES &amp; EVIDENCE</span><h2>Global history, up close.</h2><label class="sr-only" for="place-search">Search places and evidence</label><input id="place-search" type="search" placeholder="Find a place, people, or event…" aria-label="Search places and evidence"><div class="explore-filters"><label>Show<select id="explore-category" aria-label="Explore category">${Object.entries(exploreCategories).map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select></label><label>Timeline mode<select id="explore-period" aria-label="Explore period"><option value="all">Full range (sliders)</option><option value="current">At single map year</option></select></label></div><label class="check explore-wrecks-check"><input id="explore-hide-wrecks" type="checkbox"> Hide shipwrecks</label><p id="explore-scope" class="panel-hint">The list follows the map. Drag the date sliders below to watch sites appear chronologically.</p></div><div class="visible-heading"><h3 id="visible-heading">In this view</h3><span id="visible-count"></span></div><div id="visible-records"></div><section class="context-list"><h3>Dates not yet established <span id="context-count"></span></h3><p class="fine">Shown when viewing all time without a narrowed slider window.</p><div id="context-records"></div></section></aside>
 <section class="map-stage" aria-label="Map and active evidence"><div class="americas-map-status"><div class="map-topline"><span id="active-count"></span><span id="map-instruction">Drag to pan · Scroll to zoom</span></div><p id="boundary-date-status" class="context-date-status"></p></div><div id="map-host"></div><section id="cinema-caption" aria-label="Current scene"></section><div id="history-summary" class="history-summary" aria-label="History at this year"></div><details class="map-key-disclosure"><summary>Read the map</summary><div class="history-map-key"><span>◆ Foundation / arrival record</span><span>→ Migration · ↔ Exchange</span><span>⚓ Recorded loss</span><span>◌ Earlier evidence</span><span>Numbers count records sharing a map point; open the marker to choose one.</span><span>Red rim: disputed interpretation. Gold rim: under discussion.</span><span>Glows show broad regional context. Dotted outlines show historical boundaries.</span></div></details></section>
 <aside id="detail-panel" hidden class="detail-panel" aria-label="Selected evidence details"><div class="visible-heading"><h3>Look closer</h3><button id="clear-selection" aria-label="Close details">×</button></div><div id="selection-choices"></div><div id="selected-records"></div><div id="selection-actions"><button id="focus-selection">◎ Zoom to this place</button><button id="show-selection-year">Jump timeline to this date</button></div></aside>
 <aside class="layers-panel" aria-label="Map layers"><div id="layer-options" hidden><div class="visible-heading"><h3>What’s on the map</h3><button id="close-layers" aria-label="Close layers">×</button></div><section><h3>People &amp; connections</h3>${Object.entries(HISTORY_LABELS).map(([key,label])=>`<label class="check"><input type="checkbox" data-history-layer="${key}" ${check(!o.hiddenHistory.has(key))}> ${label}</label>`).join('')}<label class="check"><input id="show-past-places" type="checkbox" ${check(o.showPastPlaces)}> Earlier places</label><a href="docs/history-update.html" target="_blank">How time and continuity work ↗</a></section>
 <section><h3>Chronology context</h3><label class="check"><input id="show-undated" type="checkbox" ${check(o.showUndated)}> Show undated records (in all-time view)</label></section>
 <section><h3>Climate &amp; natural hazards</h3><label class="check"><input id="show-natural-events" type="checkbox" ${check(o.showNaturalEvents)}> Natural events · eruptions, earthquakes &amp; tsunamis</label><label class="check"><input id="show-ice" type="checkbox" ${check(o.showIce)}> Ice sheets (Pleistocene &amp; deglacial)</label><label>Ice boundary scenario<select id="ice-scenario" aria-label="Ice boundary scenario">${['optimal','min','max'].map(x=>`<option value="${x}" ${o.iceScenario===x?'selected':''}>${x.toUpperCase()}</option>`).join('')}</select></label><p id="ice-status" class="fine"></p>${climateKinds.map(k=>`<label class="check"><input data-climate="${k}" type="checkbox" ${check(!o.hiddenClimate.has(k))}> ${climateLabels[k]}</label>`).join('')}<label class="check"><input id="uncertain-hazards" type="checkbox" ${check(o.showUncertainHazards)}> Include uncertain reports</label><div id="hazard-status"></div><a href="#physical">Climate, ice &amp; hazards dashboard ↗</a></section>
 <section><h3>Ocean &amp; sailing</h3><label class="check"><input id="show-currents" type="checkbox" ${check(o.showCurrents)}> Usual surface currents</label><label class="check"><input id="show-winds" type="checkbox" ${check(o.showWinds)}> Usual trade winds</label></section>
 <details class="layer-disclosure"><summary>Research layers &amp; evidence models</summary><label class="check"><input id="show-modeled" type="checkbox" ${check(o.showModeled)}> Show modeled evidence</label><div class="overlay-controls">${Object.entries(OVERLAY_LABELS).map(([key,label])=>`<label class="check"><input type="checkbox" data-layer="${key}" ${check(!o.hiddenLayers.has(key))}> ${esc(label)} overlays</label>`).join('')}${o.languageLinks}</div></details>
 <details class="culture-disclosure"><summary>Cultures, people &amp; suggestions</summary><div class="legend-head"><h3>Cultures &amp; peoples</h3><button id="show-all" class="text-button">Show all</button></div><input id="legend-search" type="search" placeholder="Find a culture or people…" aria-label="Search cultures" value="${esc(o.legendSearch)}"><div id="legend"></div><label class="check"><input id="preview" type="checkbox" ${check(o.preview)}> Preview complete suggestions</label></details></div></aside></div>`;
}

export function libraryHTML(count:number):string{return `<article class="library-page"><div class="eyebrow">REFERENCE &amp; DATA LIBRARY</div><h2>Sources, data &amp; tools behind the atlas.</h2><p class="lead"><span id="library-record-count">${count.toLocaleString()}</span> sourced records across all global and regional atlases, bibliography tables, climate proxy data, and contributor tools. For illustrated place &amp; people studies, browse <a href="#dives">Deep dives ↗</a>.</p><div class="library-grid">${[
 ['#evidence','01','Evidence index','Search and filter the full table of places, dates, claims, and citations.'],
 ['#physical','02','Climate &amp; environment','Interactive graphs of temperature, sea level, CO₂, continuous ice sheets (7 Ma–1900 CE), proxy science, and 8,896 natural hazards.'],
 ['sites/sources-attributions.html','03','Sources, attributions &amp; licenses','Every primary citation, image credit, dataset license, and third-party notice across the atlas.'],
 ['#context','04','Movement &amp; context','Environmental drivers, migration models, and comparative studies across regions.'],
 ['sites/world-human-family.html','05','The branching human family','Complete guide to early hominins (~7.2 Ma onward), fossils, ancient DNA, and global dispersals.'],
 ['#dives','06','Deep dives','Illustrated regional studies, playable topic movies, languages, and cultures.'],
 ['#dives/origin-stories','07','Origin Stories','Indigenous, religious, and sacred emergence traditions from around the world.'],
 ['#proposals','08','Contribute evidence','Draft a source-linked correction, import a spreadsheet batch, or export proposals.'],
 ['#about','09','About &amp; methodology','Dating conventions, source-checking workflow, self-hosting guide, and open-access terms.'],
 ].map(([href,n,title,body])=>`<a class="library-card" href="${href}"><span>${n} ↗</span><h3>${title}</h3><p>${body}</p></a>`).join('')}</div>${location.protocol==='file:'?'':`<p class="fine"><a href="https://tripofisch.com/privacy/">Privacy &amp; analytics ↗</a></p>`}</article>`;}
