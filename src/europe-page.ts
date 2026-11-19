import {MapView, type MapCamera} from './map';
import {watchDetailedLand} from './atlas-assets';
import {validateEuropeData,normalizeEurope,europeSelection,europeDates,europeCategories,europePopulationView,type EuropeData} from './europe-data';
import {END_YEAR,formatYear,parseYear} from './time';
import {timelinePosition,timelineYear} from './timeline';
import {esc} from './dom';
import {historyState} from './history';
import {worldGuides} from './world-guides';
import {climateKinds} from './physical';
import type {EvidenceRecord,DisplayRecord} from './model';
import type {PoliticalBoundary,BoundarySource} from './boundaries';
import {boundariesAt} from './boundaries';
import {dateValue,voyageDate,type Voyage} from './voyages';
import {displayedVoyageStops,sampleMapVoyage,MOVIE_END_DATE} from './shared-movie';
import './europe-page.css';

interface EuropePayload {evidence:EuropeData;boundaries:PoliticalBoundary[];boundarySources:BoundarySource[];voyages:Voyage[];voyageSources:{id:string;title:string;url:string}[]}
let loading:Promise<EuropePayload>|undefined;
export function loadEurope():Promise<EuropePayload>{
 return loading??=(async()=>{
  const response=await fetch('europe-catalogue.json');if(!response.ok)throw Error('Europe evidence could not be loaded. Reload to try again.');
  const payload=await response.json() as EuropePayload;validateEuropeData(payload.evidence);
  if(!Array.isArray(payload.boundaries)||!Array.isArray(payload.boundarySources))throw Error('Europe boundary catalogue is incomplete.');
  return payload;
 })().catch(error=>{loading=undefined;throw error;});
}
interface SavedEurope {year:number;clock:number;region:string;category:string;query:string;past:boolean;warfare:boolean;interpolate:boolean;borders:boolean;trade:boolean;road:boolean;rail:boolean;voyages:boolean;camera?:MapCamera;selected:string}
let saved:SavedEurope|undefined;
const checked=(v:boolean)=>v?' checked':'';

/** Its own clock, selection and lifecycle; never writes Americas state. */
export function mountEurope(host:HTMLElement,payload:EuropePayload,land:unknown,returnHref='#movie'):()=>void {
 const data=payload.evidence,all=normalizeEurope(data),entries=new Map(data.entries.map(e=>[e.id,e]));
 const first=Math.min(...data.entries.map(e=>e.start));
 const state=saved??{year:first,clock:first,region:'all',category:'all',query:'',past:true,warfare:true,interpolate:true,borders:true,trade:true,road:true,rail:true,voyages:true,selected:''};saved=state;
 let disposed=false,playing=false,frame=0,last=0,elapsed=0,rate=1,filtered:EvidenceRecord[]=[],dates:number[]=[],drawing=false,segmentStart=state.clock,segmentTarget:number|undefined,lastPaint=0;
 host.innerHTML=`<section class="europe-atlas" aria-label="Europe history movie">
  <header class="europe-heading"><div><p class="eyebrow">EUROPE · THE NORTHERN BEGINNING</p><h1>Places, kingdoms and connections</h1></div><a href="${returnHref==='#explore'?'#explore':'#movie'}">↔ Americas</a><a href="#dives/places">Deep dives</a></header>
  <div class="europe-layout"><aside class="europe-reader" aria-label="Europe evidence and layers">
   <p class="europe-scope">From the earliest evidence to 1900. Start with the northern countries; follow their connections outward. Selected evidence, with gaps still to fill.</p>
   <div class="europe-filters"><label>Region<select id="europe-region"><option value="all">All northern regions</option>${data.regions.map(r=>`<option value="${esc(r.id)}">${esc(r.title)}</option>`).join('')}</select></label>
   <label>Show<select id="europe-category"><option value="all">All kinds of evidence</option>${Object.entries(europeCategories).map(([id,title])=>`<option value="${id}">${title}</option>`).join('')}</select></label>
   <label>Find a place or connection<input id="europe-search" type="search" placeholder="Bergen, copper, railway…" value="${esc(state.query)}"></label></div>
   <details class="europe-layers"><summary>Map layers &amp; how to read them</summary>
   ${(['past','borders','trade','road','rail','interpolate','warfare','voyages'] as const).map(id=>`<label><input type="checkbox" data-europe-layer="${id}"${checked(state[id])}> ${{past:'Earlier places',borders:'Dated political territories',trade:'Trade connections',road:'Roads',rail:'Railways',interpolate:'Interpolate comparable town populations',warfare:'Raids, battles & warfare',voyages:'Voyages & migrations'}[id]}</label>`).join('')}
   <p>Territories follow their cited dates. Dotted or dashed outlines mark approximate extent or claims; shared crowns do not imply uniform control.</p><p><span class="network-key trade"></span> Trade · <span class="network-key road"></span> Road · <span class="network-key rail"></span> Rail. Connections are schematic unless the source specifies a mapped trace. Opening dates alone do not prove continuous service.</p><p>Town dots use a logarithmic size scale for dated resident estimates where available. Hatched dots mean population unknown. Comparable census series may interpolate between observations when enabled. Interpolation is labeled; counts are never extrapolated.</p><p>Subdued earlier places are historical context, not evidence of continuing occupation. Regional filters use modern geographic names.</p></details>
   <details open><summary>Connected expeditions</summary><div id="europe-voyages"></div></details><section id="europe-details" aria-label="Selected place"></section>
   <details class="europe-now" open><summary>What is here at this time</summary><p id="europe-date-note"></p><div id="europe-list"></div></details>
   <details><summary>Roads and rails recorded by this date</summary><div id="europe-built-networks"></div></details><details class="europe-territories"><summary>Territories at this date &amp; sources</summary><div id="europe-boundary-list"></div></details>
   <details><summary>Regional guides</summary><div id="europe-guide-list"></div></details>
  </aside><div class="europe-map-wrap"><div id="europe-map"></div><div class="europe-map-status"><strong id="europe-map-date"></strong><span>Modern relief and coastlines · historical layers are dated separately</span></div><button id="europe-home" class="europe-home">Northern view</button></div></div>
  <footer class="europe-timeline"><div class="europe-transport"><button id="europe-play">Play history</button><button id="europe-previous" aria-label="Previous dated change">◀</button><button id="europe-next" aria-label="Next dated change">▶</button><label>Pace<select id="europe-rate"><option value="1">Steady</option><option value="2">2×</option><option value="4">4×</option></select></label><label>Jump to<select id="europe-era"><option value="">Choose a period…</option>${[[first,'Earliest evidence'],[-11999,'After the last ice age'],[-3999,'Farming & monuments'],[1,'First century CE'],[793,'Viking age'],[1200,'Medieval networks'],[1500,'Early modern'],[1750,'Industry & empire'],[1850,'Railway age'],[1900,'1900']].filter(([y])=>Number(y)>=first).map(([y,t])=>`<option value="${y}">${t}</option>`).join('')}</select></label></div>
  <label class="europe-slider-label">Map year <output id="europe-year"></output><input id="europe-slider" type="range" min="0" max="1000000" step="1" aria-label="Europe map year"></label>
  <form id="europe-date-form"><label>Year<input id="europe-date" inputmode="numeric" aria-label="Europe year"></label><select id="europe-era-input" aria-label="Europe year era"><option>CE</option><option>BCE</option></select><button>Go</button><span id="europe-date-error" role="status"></span></form>
  <p class="europe-playback-note">Playback visits supported date changes. Deep-time spacing is compressed; uncertain ranges are not continuous occupation.</p></footer></section>`;
 const el=<T extends HTMLElement=HTMLElement>(selector:string)=>host.querySelector<T>(selector)!;
 const map=new MapView(land as any,(rows:DisplayRecord[])=>{pause();const r=rows[0];if(r){state.selected=r.id;renderDetails();map.setHighlighted(rows.map(r=>r.id));}},()=>{if(!disposed&&!drawing)renderList();});
 el('#europe-map').append(map.element);map.populationScale='log';map.namedRouteEndpoints=true;
 map.element.querySelector('svg')?.setAttribute('aria-label','Northern Europe history map. Use the evidence list for keyboard access.');
 map.context.boundaries=payload.boundaries;
 map.context.voyages=(payload.voyages??[]).map(v=>({...v,scope:'global'}));
 map.context.options={boundaries:state.borders,rails:false,voyages:state.voyages,voyageId:'',voyageDate:null};
 const stopLand=watchDetailedLand(detail=>map.setDetailedLand(detail));
 if(state.camera)map.restoreCamera(state.camera);else map.focusRegion([-8,56],4,'world');
 el<HTMLSelectElement>('#europe-region').value=state.region;el<HTMLSelectElement>('#europe-category').value=state.category;
 function pause(){playing=false;elapsed=0;segmentTarget=undefined;el('#europe-play').textContent='Play history';map.setInteraction({mode:'movie',playing:false,onPause:pause});}
 function refilter(){
  filtered=all.filter(r=>{const e=entries.get(r.id)!;return (state.region==='all'||e.regionId===state.region)&&(state.category==='all'||e.category===state.category)&&(!state.query||`${e.title} ${e.place} ${e.summary} ${e.detail}`.toLocaleLowerCase().includes(state.query.toLocaleLowerCase()))&&(!e.networkKind||state[e.networkKind])&&(state.warfare||e.category!=='conflict')&&(state.voyages||e.category!=='voyage'||!!e.networkKind);});
  dates=europeDates(filtered.map(r=>entries.get(r.id)!));
  if(state.voyages&&state.region==='all')dates=[...new Set([...dates,...map.context.voyages.flatMap(v=>displayedVoyageStops(v).flatMap(s=>[dateValue(s.arrival),Math.min(MOVIE_END_DATE,dateValue(s.departure))]))])].filter(y=>y>=first&&y<=MOVIE_END_DATE).sort((a,b)=>a-b);
  if(!filtered.some(r=>r.id===state.selected))state.selected='';
  map.setHighlighted(state.selected?[state.selected]:[]);
 }
 function builtNetworks(){return filtered.filter(r=>{const e=entries.get(r.id)!;return (e.networkKind==='road'||e.networkKind==='rail')&&e.start<=state.year;});}
 function currentEntries(){return filtered.filter(r=>historyState(r,state.year)==='active');}
 function renderDetails(){
  const e=entries.get(state.selected);
  if(!e){el('#europe-details').innerHTML='<p class="europe-hint">Select a place or connection to read what happened, its dates, and the evidence.</p>';return;}
  const selected=all.find(r=>r.id===e.id)!;
  const current=historyState(selected,state.year)==='active';
  const endpoints=selected.location&&selected.destination
    ? '<p class="europe-route-places">'+(['origin','destination'] as const).map(role=>{
       const place=role==='origin'?selected.location!:selected.destination!;
       const label=(role==='origin'?'Origin · ':'Destination · ')+esc(place.name);
       return current?`<button type="button" data-europe-route-focus="${role}">${label}</button>`:`<span>${label}</span>`;
      }).join(' ')+'</p>'
    : '';
  el('#europe-details').innerHTML=`<article class="europe-selected"><p class="eyebrow">${esc(e.place)} · ${current?'AT THIS SOURCE DATE':state.year<e.start?'LATER EVIDENCE':'EARLIER EVIDENCE'}</p><h2>${esc(e.title)}</h2>${endpoints}<p><strong>${esc(e.dateLabel)}</strong> · ${esc(e.dateMeaning)}</p><p>${esc(e.summary)}</p><p>${esc(e.detail)}</p>${e.warfare?`<p><strong>${esc(e.warfare.kind)}</strong> · ${e.warfare.participants.map(esc).join(' / ')}</p><p>${esc(e.warfare.outcome)}</p>`:''}${e.networkKind?`<p class="europe-method">${esc(e.networkKind.toUpperCase())} · Schematic connection; the line does not establish an exact traveled path.</p>`:''}${e.population?.length?`<table><caption>Dated resident observations</caption><thead><tr><th>Date</th><th>Residents</th></tr></thead><tbody>${e.population.map(p=>`<tr><td>${formatYear(p.year)}</td><td>${p.min.toLocaleString()}${p.max!==p.min?'–'+p.max.toLocaleString():''}<small>${esc(p.basis)} · ${esc(p.note)}</small></td></tr>`).join('')}</tbody></table><p class="fine">${e.populationInterpolation&&state.interpolate?'Dot size between these observations is explicitly interpolated for '+esc(e.populationInterpolation.scope)+'.':'Dots use these source dates only; intervening counts are unknown.'}</p>`:''}<p class="europe-method">${esc(e.uncertainty)}</p>${e.guideId?`<p><a href="sites/${esc(e.guideId)}.html">Read the illustrated deep dive ↗</a></p>`:''}<details><summary>Sources</summary>${[...new Set([...e.sourceIds,...(e.population??[]).flatMap(p=>p.sourceIds)])].map(id=>{const s=data.sources.find(s=>s.id===id)!;return `<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a><br><small>${esc(s.authors)}${s.year?' · '+s.year:''}</small></p>`;}).join('')}</details></article>`;
 }
 function renderList(){
  const visible=new Set(map.visibleRecords().map(r=>r.id));
  const current=currentEntries().filter(r=>visible.has(r.id));
  el('#europe-date-note').textContent=current.length?`${formatYear(state.year)} · ${current.length} places and connections with dated evidence in view.`:`${formatYear(state.year)} · No included evidence at this date in this view. This is a coverage gap, not proof that nobody was here.`;
  el('#europe-list').innerHTML=current.slice(0,60).map(r=>`<button data-europe-record="${esc(r.id)}"><strong>${esc(r.title)}</strong><span>${esc(entries.get(r.id)!.summary)}</span></button>`).join('');
  if(current.length>60)el('#europe-list').insertAdjacentHTML('beforeend','<p>Zoom or filter to narrow the remaining places.</p>');
  const voyages=state.voyages?map.context.voyages.filter(v=>state.clock>=dateValue(v.stops[0].arrival)&&state.clock<=Math.min(MOVIE_END_DATE,dateValue(v.stops.at(-1)!.departure))):[];
  el('#europe-voyages').innerHTML=voyages.map(v=>{const position=sampleMapVoyage(v,state.clock);return `<article><strong>${esc(v.name)}</strong><p>${esc(position?.stopName??'Position not reconstructed between documented anchors')}</p><p>${esc(v.summary)}</p><details><summary>Itinerary and sources</summary>${displayedVoyageStops(v).map(s=>`<p>${esc(s.name)} · ${esc(s.arrival)}–${esc(s.departure)}<br>${esc(s.note)}</p>`).join('')}${v.sourceIds.map(id=>{const source=payload.voyageSources.find(s=>s.id===id);return source?`<p><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a></p>`:'';}).join('')}</details></article>`;}).join('')||'<p class="fine">No included expedition active at this moment. The collection connects northern ports, the Atlantic and polar journeys.</p>';
  el('#europe-built-networks').innerHTML=builtNetworks().map(r=>`<p><button data-europe-record="${esc(r.id)}">${esc(r.title)}</button><br><small>Built or attested by ${formatYear(r.time.start!)}; subsequent service is not established by the opening date.</small></p>`).join('')||'<p>No included construction evidence by this date under these filters.</p>';
  const territory=state.borders?boundariesAt(payload.boundaries,state.year):[];
  el('#europe-boundary-list').innerHTML=territory.map(b=>`<article><h3>${esc(b.name)}</h3><p>${esc(b.start)}–${esc(b.end)}</p><p>${esc(b.note)}</p><p>${esc(b.precision)}</p>${b.sourceIds.map(id=>{const s=payload.boundarySources.find(s=>s.id===id);return s?`<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a><br><small>${esc(s.license)}</small></p>`:'';}).join('')}</article>`).join('')||'<p>No included territory outlines for this date, or the layer is off. Earlier political geography is incomplete.</p>';
 }
 function render(){
  if(disposed)return;drawing=true;
  map.context.rails=builtNetworks().filter(r=>r.time.end!<state.year).map(r=>({id:'europe-built-'+r.id,name:r.title,start:r.time.start!,geometry:r.overlay!.geometry,sourceId:r.sources[0].id,precision:r.overlay!.precision,note:'Recorded infrastructure; continued service and survival are not established.',networkKind:entries.get(r.id)!.networkKind as 'road'|'rail'}));map.context.options.rails=state.road||state.rail;
  map.context.options.boundaries=state.borders;map.context.options.voyages=state.voyages;map.context.options.voyageDate=state.clock;
  map.update(europeSelection(filtered,state.year,state.past).map(r=>europePopulationView(r,entries.get(r.id)!,state.year,state.interpolate)),state.year,[],{ice:false,iceScenario:'optimal',currents:false,winds:false,hidden:new Set(climateKinds),uncertain:false});
  el('#europe-year').textContent=formatYear(state.year);el('#europe-map-date').textContent=state.clock>0&&state.clock!==state.year?voyageDate(state.clock):formatYear(state.year);
  el<HTMLInputElement>('#europe-slider').value=String(Math.round(timelinePosition(state.year,first,END_YEAR,'log')*1_000_000));el('#europe-slider').setAttribute('aria-valuetext',formatYear(state.year));
  el<HTMLInputElement>('#europe-date').value=String(state.year<=0?1-state.year:state.year);el<HTMLSelectElement>('#europe-era-input').value=state.year<=0?'BCE':'CE';
  map.setHighlighted(state.selected?[state.selected]:[]);renderDetails();renderList();drawing=false;
 }
 function seek(year:number,select=true){state.clock=Math.max(first,Math.min(MOVIE_END_DATE,year));state.year=Math.floor(state.clock);if(select){const e=filtered.find(r=>r.time.start===state.year)??currentEntries()[0];state.selected=e?.id??'';}render();}
 function step(direction:number){pause();const target=direction>0?dates.find(y=>y>state.clock):[...dates].reverse().find(y=>y<state.clock);if(target!==undefined)seek(target);}
 el('#europe-play').addEventListener('click',()=>{if(playing){pause();return;}if(state.clock>=(dates.at(-1)??END_YEAR))seek(dates[0]??first);playing=true;elapsed=0;segmentStart=state.clock;segmentTarget=undefined;el('#europe-play').textContent='Pause';map.setInteraction({mode:'movie',playing:true,onPause:pause});});
 el('#europe-previous').addEventListener('click',()=>step(-1));el('#europe-next').addEventListener('click',()=>step(1));
 el('#europe-rate').addEventListener('change',e=>{rate=Number((e.target as HTMLSelectElement).value);});
 el('#europe-era').addEventListener('change',e=>{const value=(e.target as HTMLSelectElement).value;if(value){pause();seek(Number(value));}});
 el('#europe-slider').addEventListener('input',e=>{pause();seek(timelineYear(Number((e.target as HTMLInputElement).value)/1_000_000,first,END_YEAR,'log'));});
 el('#europe-date-form').addEventListener('submit',e=>{e.preventDefault();try{const y=parseYear(el<HTMLInputElement>('#europe-date').value,el<HTMLSelectElement>('#europe-era-input').value);if(y<first||y>END_YEAR)throw Error(`Choose a year from ${formatYear(first)} through 1900 CE.`);el('#europe-date-error').textContent='';pause();seek(y);}catch(error){el('#europe-date-error').textContent=(error as Error).message;}});
 el('#europe-region').addEventListener('change',e=>{pause();state.region=(e.target as HTMLSelectElement).value;refilter();if(state.region==='all')map.focusRegion([-8,56],4,'world');else{const points=filtered.filter(r=>!r.overlay);if(points.length)map.focusRecords(points);}render();});
 el('#europe-category').addEventListener('change',e=>{pause();state.category=(e.target as HTMLSelectElement).value;refilter();render();});
 el('#europe-search').addEventListener('input',e=>{pause();state.query=(e.target as HTMLInputElement).value;refilter();render();});
 host.querySelectorAll<HTMLInputElement>('[data-europe-layer]').forEach(input=>input.addEventListener('change',()=>{state[input.dataset.europeLayer as 'past'|'borders'|'trade'|'road'|'rail'|'interpolate'|'warfare'|'voyages']=input.checked;refilter();render();}));
 el('#europe-home').addEventListener('click',()=>{map.focusRegion([-8,56],4,'world');renderList();});
 el('#europe-details').addEventListener('click',e=>{
  const button=(e.target as Element).closest<HTMLButtonElement>('[data-europe-route-focus]');
  if(!button)return;
  const record=filtered.find(r=>r.id===state.selected);
  const point=button.dataset.europeRouteFocus==='origin'?record?.location:record?.destination;
  if(point){pause();map.focusRegion([point.lon,point.lat],12,'world');}
 });
 el('.europe-atlas').addEventListener('click',function onClick(e){const button=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-europe-record]');if(button){const r=all.find(r=>r.id===button.dataset.europeRecord);if(r){pause();state.selected=r.id;map.focus(r);renderDetails();}}});
 el('#europe-guide-list').innerHTML=worldGuides.filter(g=>g.atlasIds.includes('europe')).map(g=>`<p><a href="${esc(g.href)}">${esc(g.title)} ↗</a></p>`).join('');
 function tick(now:number){
  if(disposed)return;
  const dt=Math.min(500,now-last);last=now;
  if(playing){
   if(segmentTarget===undefined){segmentStart=state.clock;segmentTarget=dates.find(y=>y>state.clock);if(segmentTarget===undefined)pause();}
   if(segmentTarget!==undefined){
    elapsed+=dt*rate;
    if(elapsed>=3500){seek(segmentTarget);elapsed=0;segmentTarget=undefined;if(state.clock>=(dates.at(-1)??END_YEAR))pause();}
    else if(elapsed>1500&&now-lastPaint>100){
     const ratio=(elapsed-1500)/2000;
     const nextClock=segmentStart+(segmentTarget-segmentStart)*ratio;
     if(Math.floor(nextClock)!==state.year)seek(nextClock,false);
     else{state.clock=nextClock;map.context.options.voyageDate=state.clock;map.refreshVoyage();}
     lastPaint=now;
    }
   }
  }
  frame=requestAnimationFrame(tick);
 }
 const visibility=()=>{if(document.hidden)pause();};document.addEventListener('visibilitychange',visibility);
 refilter();map.setInteraction({mode:'movie',playing:false,onPause:pause});render();frame=requestAnimationFrame(tick);
 return ()=>{state.camera=map.camera();disposed=true;playing=false;cancelAnimationFrame(frame);stopLand();document.removeEventListener('visibilitychange',visibility);map.clearHover();map.dispose();};
}
