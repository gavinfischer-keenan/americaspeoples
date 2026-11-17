import {sharedContextHTML} from './topic-context';
import { recordsForView, retainCurrentSelection, canSelect, type AtlasMode } from "./atlas-view";
import { effectiveClimateHidden } from "./physical-rules";
import {deepDiveIndexHTML} from './deep-dives';
import './deep-dives.css';
import "./styles.css";
import "./atlas-ui.css";
import './atlas-context.css';
import './topic-dives.css';
import {topics,topicOnlyIds} from './topic-dives';
import {mountTopicPage} from './topic-page';
import {storyDetailsHTML} from './story-details';
import {guideMovieNavigationHTML} from './guide-navigation';
import type {MapCamera} from './map';
import { atlasAssets, loadAtlasAssets } from './atlas-assets';
import { sampleVoyage, voyageDate, dateValue } from './voyages';
import { availableVoyageRecords, scopedVoyageDate, scopedVoyageProgress, advanceMovieClock, datedContextKey } from './shared-movie';
import { movieContextHTML } from './movie-context';
import {localChronologyHTML} from './local-chronology';
import { appShell, mapShell, libraryHTML } from "./atlas-shell";
import { stories } from "./stories";
import { sampleStory, sceneStartMs, storyDurationMs, storyElapsedAtYear } from "./story-player";
import { exploreRecords, exploreCategory, exploreCategories, regions, type ExploreCategory } from "./explore";
import { version as appVersion } from "../package.json";
import { dataset, fullRecord, completeDataset } from "./client-data";
import land from "../data/land.geojson";
import type {
  DisplayRecord,
  FullDisplayRecord,
  Proposal,
  SharePackage,
} from "./model";
import {
  formatYear,
  parseYear,
  earliestYear,
  timeLabel,
  END_YEAR,
} from "./time";
import { timelinePosition, timelineYear, type TimelineScale } from "./timeline";
import { MapView } from "./map";
import { MapPanels } from "./map-panels";
import { EvidenceTable, type EvidenceTableState } from "./evidence-table";
import { mountPhysicalPage } from "./physical-page";
import { aboutPageHTML } from "./about-page";
import {
  climateKinds,
  climateCategory,
  iceSnapshot,
  iceTarget,
  requestIce,
  eventsAt,
  hazardTimes,
  fullHazard,
  initializePhysical,
  onPhysicalChange,
  physicalState,
  physicalRevision,
  iceLoadState,
} from "./physical";
import { filterMapRecords } from "./map-filters";
import { esc, $, downloadJSON } from "./dom";
import { reviewHTML, recordHref, comparisonHTML } from "./review";
import { mountEditor, newProposal } from "./editor";
import {
  makePackage,
  parsePackage,
  inspectImport,
  mergeImport,
  MAX_PACKAGE_BYTES,
  validateCollection,
} from "./proposals";
import { RecordView } from "./record-view";
import { PlaybackIndex } from "./playback-index";
import { importWorkbook } from "./xlsx-import";
import { encodeLocalCollection, decodeLocalCollection } from "./local-storage";
import { contextHTML } from "./context";

const minYear = earliestYear(dataset.records);
let year = minYear,
  playing = false,
  speed: number | "smart" = "smart",
  lastTick = 0,
  dirty = false,
  holdUntil = 0;
let timelineScale: TimelineScale = "log";
let rangeStart = minYear,
  rangeEnd = END_YEAR;
const SLIDER_STEPS = 1000000;
let proposals: Proposal[] = [],
  pending: SharePackage | null = null,
  storageAvailable = true;
let proposalsRevision = 0;
const recordView = new RecordView(dataset.records);
let preview = false,
  legendSearch = "";
let selected: DisplayRecord[] = [];
let atlasMode: AtlasMode = "movie";
let panels: MapPanels | null = null;
let currentActive: DisplayRecord[] = [];
let currentVisible: DisplayRecord[] = [];
let storyId='free', storyElapsed=0, storySceneIndex=-1, storyRate=1;
let pendingStoryYear:number|null=null;
let movieClock=minYear;
let openingPlayback=!location.hash||['#map','#movie'].includes(location.hash);
let placeQuery='', placeCategory:ExploreCategory='all', explorePeriod:'all'|'current'='all';
let selectionCandidates:DisplayRecord[]=[];
let pendingLocation:DisplayRecord|null=null;
let keyboardNavigation=false;
const drawerTriggers=new Map<string,HTMLElement|SVGElement>();
document.addEventListener('keydown',()=>{keyboardNavigation=true;},true);
document.addEventListener('pointerdown',()=>{keyboardNavigation=false;},true);
function focusDrawer(id:string,opening:boolean){
  const drawer=document.getElementById(id);if(!drawer)return;
  if(opening&&keyboardNavigation){
    const trigger=document.activeElement;
    if((trigger instanceof HTMLElement||trigger instanceof SVGElement)&&!drawer.contains(trigger))drawerTriggers.set(id,trigger);
    drawer.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});
  }else if(!opening){
    const trigger=drawerTriggers.get(id);if(keyboardNavigation&&(drawer.contains(document.activeElement)||document.activeElement===document.body)&&trigger?.isConnected)trigger.focus({preventScroll:true});
    drawerTriggers.delete(id);
  }
}
const currentStory=()=>stories.find(s=>s.id===storyId)??stories[0];
const isGuidedStory=()=>mountedMap&&atlasMode==='movie'&&storyId!=='free';
const hiddenHistory = new Set<string>();
let showPastPlaces = true;
let showBoundaries=true,showRails=true,showVoyages=true,voyageId='',voyageClock=0;
const selectedVoyage=()=>atlasAssets.voyages.find(v=>v.id===voyageId);
let tableController: EvidenceTable | undefined;
const tableState: EvidenceTableState = {
  search: "",
  period: "all",
  type: "all",
  sort: "oldest",
};
const hiddenCultures = new Set<string>();
const hiddenLayers = new Set<string>();
let showModeled = true;
let showNaturalEvents = true;
const currentClimateHidden = () => effectiveClimateHidden(hiddenClimate, showNaturalEvents);
let showUndated = true,
  showIce = true,
  showCurrents = false,
  showWinds = false,
  showUncertainHazards = false;
let iceScenario = "optimal";
const hiddenClimate = new Set<string>();
const mapRows = () =>
  filterMapRecords(rows().filter(r=>!topicOnlyIds.has(r.id)), hiddenLayers, showModeled).filter(
    (r) => !hiddenClimate.has(climateCategory(r) ?? "") && (!r.history || !hiddenHistory.has(r.history.kind)),
  );
const storeKey = "americas-peoples-proposals-v1";
try {
  const saved = localStorage.getItem(storeKey);
  if (saved) proposals = parsePackage(decodeLocalCollection(saved)).proposals;
  localStorage.setItem("ap-storage-check", "1");
  localStorage.removeItem("ap-storage-check");
} catch {
  storageAvailable = false;
}
const cultures = () =>
  recordView.cultures(proposals, preview, proposalsRevision);
const rows = () =>
  recordView.get(proposals, preview, hiddenCultures, proposalsRevision);
let playbackKey = "";
let playback: PlaybackIndex;
function playbackIndex() {
  const key = [
    proposalsRevision,
    preview,
    showModeled,
    showUncertainHazards,
    showNaturalEvents,
    physicalRevision,
    [...hiddenCultures].sort().join(","),
    [...hiddenLayers].sort().join(","),
    [...hiddenClimate].sort().join(","),
    [...hiddenHistory].sort().join(","),
  ].join("|");
  if (key !== playbackKey) {
    playbackKey = key;
    playback = new PlaybackIndex([
      ...mapRows().flatMap(r=>r.history?.windows?.map(w=>({...r,time:{...r.time,start:w.start,end:w.end,certainStart:undefined,certainEnd:undefined}}))??[r]),
      ...hazardTimes(currentClimateHidden(), showUncertainHazards),
    ]);
  }
  return playback;
}
const app = $("#app");
app.innerHTML = appShell(proposals.length, END_YEAR);
const main = $("#main");
const map = new MapView(
  land,
  (items) => {
    selectEvidence(items);
  },
  () => {renderVisible();renderBoundaryCatalog();},
);
let mountedMap = false;
main.addEventListener("click", event => {
  if (mountedMap && atlasMode === "movie" && playing && (event.target as Element).closest("#visible-records,#context-records,#selected-records,#hazard-status")) {
    event.preventDefault(); event.stopImmediatePropagation(); stop();
  }
}, true);
function announce(message: string) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  setTimeout(() => $("#toast").classList.remove("show"), 4500);
}
function saveLocal() {
  proposalsRevision++;
  try {
    const text = JSON.stringify(makePackage(proposals));
    parsePackage(text);
    localStorage.setItem(storeKey, encodeLocalCollection(text));
  } catch {
    storageAvailable = false;
    announce(
      "Browser storage unavailable or collection too large. Download selected suggestions to keep them.",
    );
  }
  $("#proposal-count").textContent = String(proposals.length);
}
function stop() {
  playing = false;
  $("#play").textContent = "▶ Play";
  $("#play").setAttribute("aria-label", "Play");
  if (mountedMap) {
    map.setInteraction({ mode: atlasMode, playing: false, onPause: stop });
    document.body.classList.remove("movie-playing");
    renderVisible();
    if(isGuidedStory())updateStoryProgress();
    if(voyageId)syncVoyage();
  }
}
function syncTransport(){
  const guided=isGuidedStory();
  document.body.classList.toggle('guided-story',guided);
  document.body.classList.toggle('local-date',atlasMode==='explore'&&explorePeriod==='current');
  $('#story-position').hidden=!guided;
  $('.story-speed').hidden=!guided&&!voyageId;
  $('#previous-scene').hidden=!guided;
  $('#next-scene').hidden=!guided;
  $('#time-settings-toggle').textContent=guided?'Date & pace':'Date & speed';
  $('#restart').setAttribute('aria-label',voyageId?'Restart expedition':guided?'Restart story':'Earliest evidence');
  document.body.classList.toggle('whole-movie',atlasMode==='movie'&&!guided&&!voyageId);
  const selector=document.querySelector<HTMLSelectElement>('#story-select');if(selector)selector.value=storyId;
  if(guided)updateStoryProgress();
}
function useFreeTimeline(){
  if(storyId==='free')return;
  storyId='free';storySceneIndex=-1;
  map.setHighlighted(selected.map(r=>r.id));
  if(mountedMap){renderStory();syncTransport();}
}
function showWholeMovie(){
  const sharedDate=voyageId?voyageClock:movieClock;
  openingPlayback=false;stop();voyageId='';storyId='free';storySceneIndex=-1;movieClock=sharedDate;
  hiddenCultures.clear();hiddenHistory.clear();hiddenLayers.clear();hiddenClimate.clear();showNaturalEvents=true;showModeled=true;showPastPlaces=true;showVoyages=true;showBoundaries=true;showRails=true;
  placeQuery='';placeCategory='all';selected=[];selectionCandidates=[];
  map.overview('americas');map.setHighlighted([]);mapPage();
}
function renderConcurrentContext(){
  const host=document.querySelector('#concurrent-context');if(!host||atlasMode!=='movie')return;
  const v=selectedVoyage(),frame=v&&sampleVoyage(v.stops,voyageClock);
  const local=map.localChronology(mapRows());
  const html=local.length?localChronologyHTML(local,year):movieContextHTML(currentVisible,year,frame?.coordinates);
  if(host.innerHTML!==html)host.innerHTML=html;
  if(storyId==='free')$('#cinema-caption').innerHTML=`<span class="eyebrow">${esc(formatYear(year))} · ALL HISTORIES</span><h3>${v?esc(v.name):'The world, together.'}</h3><p>Communities, journeys and events share this date. Zoom out to see other regions.</p>`;
}
function seekScene(index:number){
  stop();
  const story=currentStory();
  const i=Math.max(0,Math.min(story.scenes.length-1,index));
  storyElapsed=sceneStartMs(story,i);
  showStoryScene(i);
  updateStoryProgress();
}
function showStoryScene(index:number){
  storySceneIndex=index;
  const scene=currentStory().scenes[index];
  $('#story-panel').scrollTop=0;
  selected=[];selectionCandidates=[];closeDetails();
  setYear(scene.year,false);
  map.focusRegion(scene.center,scene.zoom,scene.scope);
  map.setHighlighted(scene.recordIds);
  renderStory();
}
function renderStory(){
  if(!mountedMap||atlasMode!=='movie')return;
  const description=$('#story-description'),host=$('#story-scene'),chapters=$('#story-chapters');
  if(storyId==='free'){
    description.textContent=voyageId?'Follow this journey in its contemporary world.':'Every history, one shared clock.';
    host.innerHTML='<div class="scene-copy whole-intro"><span class="eyebrow">AMERICAS · ALL HISTORIES</span><h2>The world, together.</h2><p>Watch places grow, people move, and connections change at the same time. Every story and journey shares this world.</p><div class="movie-starts"><button data-movie-year="'+minYear+'">Earliest evidence</button><button data-movie-year="1000">1000 CE</button><button data-movie-year="1492">1492</button><button data-movie-year="1832">1832</button></div></div>';
    chapters.innerHTML='';renderConcurrentContext();return;
  }
  const story=currentStory(),scene=story.scenes[Math.max(0,storySceneIndex)];
  description.textContent=story.subtitle;
  $('#cinema-caption').innerHTML=`<span class="eyebrow">${esc(formatYear(scene.year))} · ${esc(story.title)}</span><h3>${esc(scene.title)}</h3><p>${esc(scene.body)}</p><small>${esc(scene.note)}</small>`;
  host.innerHTML=`<div class="scene-copy"><div class="scene-kicker"><span class="eyebrow">SCENE ${String(Math.max(0,storySceneIndex)+1).padStart(2,'0')} / ${String(story.scenes.length).padStart(2,'0')}</span><span>${esc(formatYear(scene.year))}</span></div><h2>${esc(scene.title)}</h2><p class="scene-body">${esc(scene.body)}</p><details class="scene-sources scene-notes"><summary>Dates and evidence notes</summary><p class="scene-note">${esc(scene.note)}</p></details>${guideMovieNavigationHTML(story.id,scene.recordIds)}${storyDetailsHTML(scene,dataset.records)}<details class="scene-sources"><summary>Read the evidence · ${scene.recordIds.length}</summary>${scene.recordIds.map(id=>{const r=dataset.records.find(r=>r.id===id);return r?`<a href="${recordHref(r)}">${esc(r.title)} ↗</a>`:'';}).join('')}</details></div>`;
  chapters.innerHTML=story.scenes.map((s,i)=>`<button data-scene="${i}" aria-label="Scene ${i+1}: ${esc(s.title)}" aria-current="${i===storySceneIndex?'step':'false'}" title="${esc(s.title)}">${i+1}</button>`).join('');
}
function updateStoryProgress(){
  if(!isGuidedStory())return;
  const story=currentStory(),frame=sampleStory(story,storyElapsed);
  $<HTMLInputElement>('#story-progress').value=String(Math.round(frame.progress*1000));
  $('#story-progress').setAttribute('aria-valuetext',`Scene ${frame.sceneIndex+1} of ${story.scenes.length}`);
  $('#story-progress-label').textContent=frame.completed?'Journey complete · replay or choose another':`${frame.phase==='travel'?'Moving through time':playing?'Watching':'Ready to watch'} · ${frame.sceneIndex+1} of ${story.scenes.length}`;
  $<HTMLButtonElement>('#previous-scene').disabled=frame.sceneIndex===0;
  $<HTMLButtonElement>('#next-scene').disabled=frame.sceneIndex===story.scenes.length-1;
}
function selectEvidence(items:DisplayRecord[]){
  if(!canSelect(atlasMode,playing)){stop();return;}
  selectionCandidates=retainCurrentSelection(items,currentVisible,atlasMode);
  selected=selectionCandidates.slice(0,1);
  map.setHighlighted(selected.map(r=>r.id));
  if(selected.length)openDetails();
  renderSelectionChoices();renderVisible();
}
function renderSelectionChoices(){
  const host=document.querySelector('#selection-choices');if(!host)return;
  host.innerHTML=selectionCandidates.length>1?`<div class="overlap-choice"><p><strong>${selectionCandidates.length} records overlap here.</strong> Choose one to inspect:</p><div>${selectionCandidates.map((r,i)=>`<button data-pick-record="${i}" aria-pressed="${selected[0]?.id===r.id}">${esc(r.title)}</button>`).join('')}</div></div>`:'';
}
function closeDetails(){
  selected=[];selectionCandidates=[];
  if(!mountedMap)return;
  $('#detail-panel').hidden=true;
  focusDrawer('detail-panel',false);
  $('.atlas-layout').classList.add('detail-panel-hidden');
  $('#toggle-details').setAttribute('aria-expanded','false');
  $('#toggle-details').textContent='Details';
  map.setHighlighted(isGuidedStory()?currentStory().scenes[Math.max(0,storySceneIndex)].recordIds:[]);
  renderVisible();
}
function mountAtlasControls(){
  $('#concurrent-context').addEventListener('click',e=>{
    const button=(e.target as Element).closest<HTMLElement>('[data-local-year]');if(!button)return;
    const id=button.dataset.localRecord;
    const target=dataset.records.find(r=>r.id===id);
    if(target)setRecordYear(target);else setYear(Number(button.dataset.localYear));
    const record=currentVisible.find(r=>r.id===id);if(record){map.setHighlighted([record.id]);selectEvidence([record]);}
  });
  $<HTMLInputElement>('#place-search').value=placeQuery;
  $<HTMLSelectElement>('#explore-category').value=placeCategory;
  $<HTMLSelectElement>('#explore-period').value=explorePeriod;
  $('#place-search').addEventListener('input',e=>{placeQuery=(e.target as HTMLInputElement).value;renderVisible();});
  $('#explore-category').addEventListener('change',e=>{placeCategory=(e.target as HTMLSelectElement).value as ExploreCategory;renderMapData();});
  $('#explore-period').addEventListener('change',e=>{explorePeriod=(e.target as HTMLSelectElement).value as 'all'|'current';$('.timeline').hidden=atlasMode==='explore'&&explorePeriod==='all';syncTransport();renderMapData();});
  $('#explore-region').addEventListener('change',e=>{const r=regions.find(r=>r.id===(e.target as HTMLSelectElement).value);if(r){stop();placeQuery='';$<HTMLInputElement>('#place-search').value='';map.focusRegion(r.center,r.zoom,r.scope);renderVisible();}});
  $('#focus-mode').addEventListener('click',()=>{const focus=document.body.classList.toggle('focus-view');$('#focus-mode').setAttribute('aria-pressed',String(focus));$('#focus-mode').textContent=focus?'Exit focus':'Focus view';});
  $('#close-layers').addEventListener('click',()=>$('#toggle-layers').click());
  $('#focus-selection').addEventListener('click',()=>{if(selected.length)map.focusRecords(selected);});
  $('#show-selection-year').addEventListener('click',()=>{const r=selected[0];if(!r||r.time.start===null)return;setRecordYear(r);if(atlasMode==='explore'){explorePeriod='current';$<HTMLSelectElement>('#explore-period').value='current';$('.timeline').hidden=false;syncTransport();renderMapData();}map.focusRecords([r]);selectEvidence([r]);});
  $('#selection-choices').addEventListener('click',e=>{const button=(e.target as Element).closest<HTMLButtonElement>('[data-pick-record]');if(!button)return;const r=selectionCandidates[Number(button.dataset.pickRecord)];if(r){selected=[r];map.setHighlighted([r.id]);renderSelectionChoices();renderVisible();}});
  $('#story-select').addEventListener('change',e=>{openingPlayback=false;stop();voyageId='';storyId=(e.target as HTMLSelectElement).value;storyElapsed=0;storySceneIndex=-1;placeQuery='';placeCategory='all';if(storyId==='free')showWholeMovie();else showStoryScene(0);syncTransport();});
  $('#whole-movie').addEventListener('click',()=>showWholeMovie());
  $('#story-scene').addEventListener('click',e=>{const link=(e.target as Element).closest<HTMLAnchorElement>('[data-shared-study]');if(link&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey){pendingStoryYear=year;}const b=(e.target as Element).closest<HTMLButtonElement>('[data-movie-year]');if(b){setYear(Number(b.dataset.movieYear));renderStory();}});
  $('#story-chapters').addEventListener('click',e=>{const b=(e.target as Element).closest<HTMLButtonElement>('[data-scene]');if(b)seekScene(Number(b.dataset.scene));});
  renderStory();
}
function bounds(recenter = false) {
  const w = $<HTMLSelectElement>("#window").value;
  if (w === "all") {
    rangeStart = minYear;
    rangeEnd = END_YEAR;
  } else if (recenter) {
    rangeStart = Math.max(minYear, year - Number(w));
    rangeEnd = Math.min(END_YEAR, year + Number(w));
  }
  $("#range-start").textContent = formatYear(rangeStart);
  $("#range-end").textContent =
    formatYear(rangeEnd) +
    (rangeEnd === END_YEAR ? " · Indian Reorganization Act" : "");
  $("#timeline-note").textContent =
    timelineScale === "log"
      ? "Logarithmic scale · equal distances cover unequal years"
      : "Linear scale · equal distances cover equal years";
  const ticks = [-100000, -50000, -25000, -10000, -5000, -1000, 1, 1000];
  let last = -1;
  $("#time-ticks").innerHTML = ticks
    .filter((y) => y > rangeStart && y < rangeEnd)
    .map((y) => {
      const p = timelinePosition(y, rangeStart, rangeEnd, timelineScale);
      if (p < 0.06 || p > 0.94 || p - last < 0.11) return "";
      last = p;
      return `<span style="left:${p * 100}%">${formatYear(y)}</span>`;
    })
    .join("");
}
function setRecordYear(record: DisplayRecord) {
  if(record.time.start===null)return;
  const iso=record.time.eventDate??record.history?.eventDate;
  const exact=iso?dateValue(iso):NaN;
  setYear(Number.isFinite(exact)?Math.floor(exact):record.time.start);
  if(Number.isFinite(exact)){
    movieClock=exact;
    if(mountedMap)renderMapData();
  }
}
function setYear(next: number, manual = true) {
  if (manual) { openingPlayback=false;stop(); voyageId=''; if (mountedMap && atlasMode === "movie") useFreeTimeline(); }
  year = Math.round(Math.max(minYear, Math.min(END_YEAR, next)));
  if(manual||isGuidedStory())movieClock=year;
  const slider = $<HTMLInputElement>("#time-slider");
  if (year < rangeStart || year > rangeEnd) bounds(true);
  slider.value = String(
    Math.round(
      SLIDER_STEPS *
        timelinePosition(year, rangeStart, rangeEnd, timelineScale),
    ),
  );
  slider.setAttribute("aria-valuetext", formatYear(year));
  $("#current-year").textContent = formatYear(year);
  $<HTMLInputElement>("#year-number").value = String(
    year <= 0 ? 1 - year : year,
  );
  $<HTMLSelectElement>("#era").value = year <= 0 ? "BCE" : "CE";
  if (mountedMap) renderMapData();
  if (location.hash === "#evidence" && tableState.period === "current")
    renderTableBody();
}
function tick(now: number) {
  const voyage=selectedVoyage();
  if(playing&&voyage){
    const previous=voyageClock;
    voyageClock=scopedVoyageDate(voyage,scopedVoyageProgress(voyage,voyageClock)+Math.min(Math.max(now-lastTick,0),250)/90000*storyRate);
    if(Math.floor(voyageClock)!==year)setYear(Math.floor(voyageClock),false);
    else if(datedContextKey(dataset.records,atlasAssets.voyages,voyageClock)!==datedContextKey(dataset.records,atlasAssets.voyages,previous))renderMapData();
    syncVoyage();
    if(scopedVoyageProgress(voyage,voyageClock)>=1-1e-9)stop();
  } else if (playing && isGuidedStory()) {
    storyElapsed += Math.min(Math.max(now-lastTick,0),250) * storyRate;
    const frame=sampleStory(currentStory(),storyElapsed);
    if(frame.sceneIndex!==storySceneIndex) showStoryScene(frame.sceneIndex);
    if(frame.year!==year)setYear(frame.year,false);
    updateStoryProgress();
    if(frame.completed)stop();
  } else if (playing && now >= holdUntil) {
    const dt = Math.min((now - lastTick) / 1000, 0.25),pacing=playbackIndex(),previous=movieClock;
    const next=advanceMovieClock(movieClock,dt,speed==='smart'?pacing.yearsPerSecond(year):speed,pacing,showVoyages?atlasAssets.voyages:[],speed==='smart');
    movieClock=next.date;
    if(Math.floor(movieClock)!==year)setYear(Math.floor(movieClock),false);
    else if(datedContextKey(dataset.records,atlasAssets.voyages,movieClock)!==datedContextKey(dataset.records,atlasAssets.voyages,previous))renderMapData();
    map.context.options.voyageDate=movieClock;map.refreshVoyage();
    if(next.boundary)holdUntil=now+700;
    if (year >= END_YEAR) stop();
  }
  if(mountedMap&&atlasMode==='movie')syncMapDate();
  lastTick = now;
  requestAnimationFrame(tick);
}
$("#play").addEventListener("click", () => {
  if (!mountedMap || atlasMode === "explore") { location.hash = "#movie"; return; }
  if (playing) {
    stop();
    return;
  }
  const voyage=selectedVoyage();
  if(voyage&&scopedVoyageProgress(voyage,voyageClock)>=1-1e-9){voyageClock=scopedVoyageDate(voyage,0);setYear(Math.floor(voyageClock),false);syncVoyage();}
  if (isGuidedStory() && sampleStory(currentStory(),storyElapsed).completed) seekScene(0);
  else if (!voyage && !isGuidedStory() && year === END_YEAR) setYear(minYear);
  playing = true;
  selected = [];
  renderMapData();
  holdUntil = 0;
  lastTick = performance.now();
  $("#play").textContent = "Ⅱ Pause";
  $("#play").setAttribute("aria-label", "Pause");
  if(isGuidedStory())updateStoryProgress();
});
$("#restart").addEventListener("click", () => {const v=selectedVoyage();if(v){stop();voyageClock=scopedVoyageDate(v,0);setYear(Math.floor(voyageClock),false);syncVoyage();}else if(isGuidedStory())seekScene(0);else setYear(minYear);});
$('#previous-scene').addEventListener('click',()=>seekScene(storySceneIndex-1));
$('#next-scene').addEventListener('click',()=>seekScene(storySceneIndex+1));
for(const id of ['story-speed','story-speed-compact'])$('#'+id).addEventListener('change',e=>{storyRate=Number((e.target as HTMLSelectElement).value);for(const other of ['story-speed','story-speed-compact'])$<HTMLSelectElement>('#'+other).value=String(storyRate);});
$('#story-progress').addEventListener('input',e=>{
  const position=Number((e.target as HTMLInputElement).value)/1000;
  stop();storyElapsed=position*storyDurationMs(currentStory());
  const frame=sampleStory(currentStory(),storyElapsed);showStoryScene(frame.sceneIndex);setYear(frame.year,false);updateStoryProgress();
});
$('[data-skip-content]').addEventListener('click',e=>{e.preventDefault();main.focus();});
$('#time-settings-toggle').addEventListener('click',()=>{const panel=$('#time-settings');panel.hidden=!panel.hidden;$('#time-settings-toggle').setAttribute('aria-expanded',String(!panel.hidden));});
document.addEventListener('keydown',e=>{
  if(!mountedMap)return;
  if(e.key==='Escape'){
    if(!$('#layer-options').hidden)$('#toggle-layers').click();
    else if(!$('#detail-panel').hidden)closeDetails();
    else if(document.body.classList.contains('focus-view'))$('#focus-mode').click();
  }
  if(e.code==='Space'&&!((e.target as Element).closest('input,select,textarea,button,a,summary,[contenteditable]'))){e.preventDefault();$('#play').click();}
});
$("#speed").addEventListener("change", () => {
  const value = $<HTMLSelectElement>("#speed").value;
  speed = value === "smart" ? "smart" : Number(value);
});
$("#window").addEventListener("change", () => {
  bounds(true);
  setYear(year);
});
$("#time-slider").addEventListener("input", () =>
  setYear(
    timelineYear(
      Number($<HTMLInputElement>("#time-slider").value) / SLIDER_STEPS,
      rangeStart,
      rangeEnd,
      timelineScale,
    ),
  ),
);
$("#time-scale").addEventListener("change", () => {
  timelineScale = $<HTMLSelectElement>("#time-scale").value as TimelineScale;
  bounds();
  setYear(year);
});
$("#time-slider").addEventListener("keydown", (event) => {
  const e = event as KeyboardEvent;
  const step = e.shiftKey ? 10 : 1;
  let next: number;
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = year - step;
  else if (e.key === "ArrowRight" || e.key === "ArrowUp") next = year + step;
  else if (e.key === "Home") next = rangeStart;
  else if (e.key === "End") next = rangeEnd;
  else return;
  e.preventDefault();
  setYear(Math.max(rangeStart, Math.min(rangeEnd, next)));
});
// Keep animation frames from replacing a date while it is being edited.
$("#year-form").addEventListener("focusin", stop);
$("#year-form").addEventListener("submit", (e) => {
  e.preventDefault();
  try {
    const next = parseYear(
      $<HTMLInputElement>("#year-number").value,
      $<HTMLSelectElement>("#era").value,
    );
    if (next < minYear || next > END_YEAR)
      throw new Error(
        `Choose a year from ${formatYear(minYear)} through ${END_YEAR} CE.`,
      );
    $("#time-error").textContent = "";
    setYear(next);
  } catch (error) {
    $("#time-error").textContent = (error as Error).message;
  }
});
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stop();
});
function mapPage() {
  mountedMap = true;
  const languageModels = dataset.records.filter((r) => r.linguistics);
  const languageLinks = atlasMode === "explore" && languageModels.length
    ? `<section aria-labelledby="language-relationships-heading"><h4 id="language-relationships-heading">Language relationships</h4><p class="fine">All published language models, independent of the selected year. Models without dates remain outside the dated map.</p><ul>${languageModels.map((r) => `<li><a href="${esc(recordHref(r))}">${esc(r.title)}</a><br><small>${r.time.kind === "unplaced" ? "Chronology unresolved" : esc(timeLabel(r.time))}</small></li>`).join("")}</ul></section>`
    : "";
  main.innerHTML = mapShell({atlasMode,hiddenHistory,showPastPlaces,showUndated,showNaturalEvents,showIce,iceScenario,hiddenClimate,showUncertainHazards,showCurrents,showWinds,showModeled,hiddenLayers,preview,legendSearch,languageLinks});
  mountHistoricalContext();
  main.querySelectorAll<HTMLInputElement>('[data-history-layer]').forEach(input=>input.addEventListener('change',()=>{
    if(input.checked)hiddenHistory.delete(input.dataset.historyLayer!);else hiddenHistory.add(input.dataset.historyLayer!);
    renderMapData();
  }));
  $('#show-past-places').addEventListener('change',e=>{showPastPlaces=(e.target as HTMLInputElement).checked;renderMapData();});
  $("#show-undated").closest("section")!.hidden = atlasMode === "movie";
  $(".context-list").hidden = atlasMode === "movie";
  $("#show-currents").closest("section")!.hidden = atlasMode === "movie";
  if (atlasMode === "explore") {
    $("#show-ice").closest("section")!.hidden = true;
    $("#layer-options").insertAdjacentHTML("afterbegin", '<p class="fine">Explore combines research evidence across periods. Dated physical snapshots and event symbols belong to Movie; <a href="#physical">browse the full natural-event catalog</a>.</p>');
  }
  $("#map-host").append(map.element);
  panels = new MapPanels(main, (items) => { selectEvidence(items); if(items.length===1 && placeQuery.trim())map.focusRecords(items); });
  for (const [button, panel, noun] of [
    ["toggle-sites", "site-panel", "site list"],
    ["toggle-details", "detail-panel", "details"],
  ]) {
    $("#" + button).addEventListener("click", () => {
      const target = $("#" + panel);
      target.hidden = !target.hidden;
      $("#" + button).setAttribute("aria-expanded", String(!target.hidden));
      $("#" + button).textContent =
        `${target.hidden ? "Show" : "Hide"} ${noun}`;
      $(".atlas-layout").classList.toggle(panel + "-hidden", target.hidden);
      if(panel==='detail-panel')focusDrawer('detail-panel',!target.hidden);
    });
  }
  $("#toggle-layers").addEventListener("click", () => {
    const options = $("#layer-options");
    options.hidden = !options.hidden;
    $(".atlas-layout").classList.toggle("layers-open", !options.hidden);
    $("#toggle-layers").textContent = options.hidden
      ? "Show layers"
      : "Hide layers";
    $("#toggle-layers").setAttribute("aria-expanded", String(!options.hidden));
    focusDrawer('layer-options',!options.hidden);
  });
  for (const [id, change] of [
    ["show-undated", (v: boolean) => (showUndated = v)],
    ["show-ice", (v: boolean) => (showIce = v)],
    ["show-natural-events", (v: boolean) => (showNaturalEvents = v)],
    ["show-currents", (v: boolean) => (showCurrents = v)],
    ["show-winds", (v: boolean) => (showWinds = v)],
    ["uncertain-hazards", (v: boolean) => (showUncertainHazards = v)],
  ] as const)
    $("#" + id).addEventListener("change", (e) => {
      change((e.target as HTMLInputElement).checked);
      renderMapData();
    });
  $("#ice-scenario").addEventListener("change", (e) => {
    iceScenario = (e.target as HTMLSelectElement).value;
    renderMapData();
  });
  main.querySelectorAll<HTMLInputElement>("[data-climate]").forEach((el) =>
    el.addEventListener("change", () => {
      if (el.checked) hiddenClimate.delete(el.dataset.climate!);
      else hiddenClimate.add(el.dataset.climate!);
      renderMapData();
    }),
  );
  $("#show-modeled").addEventListener("change", (e) => {
    showModeled = (e.target as HTMLInputElement).checked;
    renderMapData();
  });
  main.querySelectorAll<HTMLInputElement>("[data-layer]").forEach((el) =>
    el.addEventListener("change", () => {
      if (el.checked) hiddenLayers.delete(el.dataset.layer!);
      else hiddenLayers.add(el.dataset.layer!);
      selected = [];
      renderMapData();
    }),
  );
  $("#legend-search").addEventListener("input", (e) => {
    legendSearch = (e.target as HTMLInputElement).value;
    renderLegend();
  });
  $("#show-all").addEventListener("click", () => {
    hiddenCultures.clear();
    renderLegend();
    renderMapData();
  });
  $("#preview").addEventListener("change", (e) => {
    preview = (e.target as HTMLInputElement).checked;
    renderLegend();
    renderMapData();
  });
  $("#clear-selection").addEventListener("click", () => {
    closeDetails();
  });
  mountAtlasControls();
  renderLegend();
  if(isGuidedStory()){const frame=sampleStory(currentStory(),storyElapsed);showStoryScene(frame.sceneIndex);setYear(pendingStoryYear??frame.year,false);pendingStoryYear=null;}
  else renderMapData();
  syncTransport();
}
function renderLegend() {
  const list = cultures().filter((c) =>
    c.name.toLowerCase().includes(legendSearch.toLowerCase()),
  );
  $("#legend").innerHTML = list
    .map(
      (c) =>
        `<label class="legend-row"><input type="checkbox" data-culture="${esc(c.id)}" ${hiddenCultures.has(c.id) ? "" : "checked"}><i style="background:${c.color}"></i><span>${esc(c.name)}</span></label>`,
    )
    .join("");
  $("#legend")
    .querySelectorAll<HTMLInputElement>("input")
    .forEach((el) =>
      el.addEventListener("change", () => {
        if (el.checked) hiddenCultures.delete(el.dataset.culture!);
        else hiddenCultures.add(el.dataset.culture!);
        renderMapData();
      }),
    );
}
function mountHistoricalContext(){
  $('#layer-options > .visible-heading').insertAdjacentHTML('afterend',`<section class="historical-options"><h3>Borders, journeys &amp; railways</h3><label class="check"><input id="show-boundaries" type="checkbox" ${showBoundaries?'checked':''}> Dotted historical boundaries</label><label class="check"><input id="show-rails" type="checkbox" ${showRails?'checked':''}> Accumulated railway construction</label><label class="check"><input id="show-voyages" type="checkbox" ${showVoyages?'checked':''}> Expeditions active this year</label><form id="context-year-form" class="context-year"><label for="context-year">Map year · CE</label><input id="context-year" type="number" min="1" max="1934" value="${Math.max(1,year)}"><button>Go</button></form><p class="fine">Borders are the dated administrative record at year end, not exclusive occupation or proof of control. Railway lines accumulate built or attested infrastructure; continued service is not implied.</p><label>Follow a dated journey<select id="voyage-select"><option value="">Choose an expedition…</option></select></label><p id="context-load-status" role="status"></p><details><summary>Boundaries in this view &amp; sources</summary><div id="context-catalog" class="context-catalog"></div></details><a href="docs/atlas-expansion.html" target="_blank">Dates, sources &amp; remaining gaps ↗</a></section>`);
  $('#story-scene').insertAdjacentHTML('beforebegin','<section id="voyage-controls" class="voyage-controls" aria-label="Dated expedition" hidden><strong id="voyage-title"></strong><p id="voyage-position"></p><input id="voyage-progress" type="range" min="0" max="10000" value="0" aria-label="Expedition date"><details><summary>Itinerary &amp; evidence</summary><p id="voyage-precision"></p><div id="voyage-evidence" class="context-catalog"></div></details><button id="close-voyage">Return to timeline</button></section>');
  for(const [id,change] of [['show-boundaries',(v:boolean)=>showBoundaries=v],['show-rails',(v:boolean)=>showRails=v],['show-voyages',(v:boolean)=>showVoyages=v]] as const)$('#'+id).addEventListener('change',e=>{change((e.target as HTMLInputElement).checked);renderMapData();});
  $('#context-year-form').addEventListener('submit',e=>{e.preventDefault();const value=Number($<HTMLInputElement>('#context-year').value);if(Number.isInteger(value)&&value>=1&&value<=END_YEAR)setYear(value);});
  for(const id of ['voyage-select','watch-voyage'])$('#'+id).addEventListener('change',e=>{
    const sharedDate=voyageId?voyageClock:movieClock;
    stop();useFreeTimeline();voyageId=(e.target as HTMLSelectElement).value;
    const v=selectedVoyage();if(!v){movieClock=sharedDate;renderMapData();renderStory();syncTransport();syncVoyage();return;}
    showVoyages=true;voyageClock=scopedVoyageDate(v,0);setYear(Math.floor(voyageClock),false);map.overview('americas');
    if(atlasMode!=='movie'){location.hash='#movie';return;}
    renderStory();syncTransport();syncVoyage();
  });
  $('#voyage-progress').addEventListener('input',e=>{const v=selectedVoyage();if(!v)return;const progress=Number((e.target as HTMLInputElement).value)/10000;stop();voyageClock=scopedVoyageDate(v,progress);setYear(Math.floor(voyageClock),false);syncVoyage();});
  $('#close-voyage').addEventListener('click',()=>showWholeMovie());
  renderHistoricalContext();
}
function renderHistoricalContext(){
  const status=document.querySelector('#context-load-status');if(!status)return;
  status.textContent=!atlasAssets.ready?'Loading dated geography…':atlasAssets.errors.length?`Could not load: ${atlasAssets.errors.join(', ')}. Missing layers do not mean historical absence.`:`${atlasAssets.boundaries.length.toLocaleString()} dated boundary versions · ${atlasAssets.voyages.length} itineraries.`;
  const selector=$<HTMLSelectElement>('#voyage-select');
  if(selector.options.length!==atlasAssets.voyages.length+1)selector.innerHTML='<option value="">Choose an expedition…</option>'+atlasAssets.voyages.map(v=>`<option value="${esc(v.id)}">${esc(v.name)}</option>`).join('');
  const watch=$<HTMLSelectElement>('#watch-voyage');watch.innerHTML=selector.innerHTML;watch.value=voyageId;
  $('#boundary-date-status').textContent=showBoundaries?`Dotted boundaries · ${formatYear(year)} year-end · gaps are missing coverage`:showRails?`Rail construction recorded through ${formatYear(year)}`:'';
  selector.value=voyageId;$<HTMLInputElement>('#show-voyages').checked=showVoyages;$<HTMLInputElement>('#context-year').value=String(Math.max(1,year));
  renderBoundaryCatalog();
  const v=selectedVoyage();$('#voyage-controls').hidden=!v;$('#story-scene').hidden=!!v;$('#story-chapters').hidden=!!v;
  if(v){
    $('#voyage-title').textContent=v.name;
    $('#voyage-precision').textContent=v.precision+' The moving symbol interpolates between dated stops; it is not a daily position log. Playback skips segments beyond the Americas–Pacific atlas. Scope crossings are interpolated, not documented daily positions. Hollow stops are later in the itinerary. Canoe and walking symbols distinguish river and land legs.';
    $('#voyage-evidence').innerHTML=`<p>${esc(v.summary)}</p>`+v.stops.map(s=>`<p><b>${esc(s.name)}</b> · ${esc(s.arrival)}–${esc(s.departure)}<br>${esc(s.note)}</p>`).join('')+v.sourceIds.map(id=>{const source=atlasAssets.voyageSources.find(s=>s.id===id);return source?`<p><a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)} ↗</a></p>`:'';}).join('');
    syncVoyage();
  }
}
function renderBoundaryCatalog(){
  const host=document.querySelector('#context-catalog');if(!host)return;
  host.innerHTML=map.visibleBoundaries().map(b=>`<p><strong>${esc(b.name)}</strong> · ${esc(b.start)}–${esc(b.end)}<br>${esc(b.note)}<br>${esc(b.precision)}${b.labelSource?`<br><a href="${esc(b.labelSource)}" target="_blank" rel="noopener">Historical name source ↗</a>`:''}<br>${b.sourceIds.map(id=>{const s=atlasAssets.boundarySources.find(s=>s.id===id);return s?`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)} ↗</a>`:esc(id);}).join(' · ')}</p>`).join('')||'<p>No included boundary outlines in this view and year, or the layer is hidden. Missing coverage does not establish historical absence.</p>';
}
function syncVoyage(){
  const v=selectedVoyage();if(!v||!mountedMap)return;
  const frame=sampleVoyage(v.stops,voyageClock);
  $('#voyage-position').textContent=`${voyageDate(voyageClock)} · ${frame?.status==='stopped'?'At':'Traveling: '} ${frame?.stopName??''} · ${playing?'Following journey':'Press Play to follow the journey'}.`;
  $<HTMLInputElement>('#voyage-progress').value=String(Math.round(scopedVoyageProgress(v,voyageClock)*10000));
  $('#voyage-progress').setAttribute('aria-valuetext',voyageDate(voyageClock));
  map.context.options.voyageDate=voyageClock;map.context.options.voyageId=voyageId;map.refreshVoyage();
}
function renderMapData() {
  map.context.options={boundaries:showBoundaries,rails:showRails,voyages:showVoyages,voyageId,voyageDate:voyageId?voyageClock:movieClock};
  requestIce(atlasMode === "movie" && showIce ? year : -1000000, iceScenario);
  let candidates=mapRows();
  if(atlasMode==='movie'||explorePeriod==='current')candidates=availableVoyageRecords(candidates,atlasAssets.voyages,voyageId?voyageClock:movieClock);
  if(atlasMode==='explore'&&placeCategory!=='all')candidates=candidates.filter(r=>exploreCategory(r)===placeCategory);
  const view = recordsForView(candidates, atlasMode==='explore'&&explorePeriod==='current'?'movie':atlasMode, year);
  const active = view.dated;
  currentActive = active;
  const historical=view.history.filter(r=>r.history?.kind==='wreck'||r.history?.kind==='settlement'||r.history?.kind==='visit'||showPastPlaces);
  currentVisible=[...active,...historical];
  selected = retainCurrentSelection(selected, currentVisible, atlasMode);
  document.body.classList.toggle("movie-playing", atlasMode === "movie" && playing);
  map.setInteraction({mode: atlasMode, playing, onPause: stop});
  map.update(
    currentVisible,
    year,
    showUndated ? view.context : [],
    {
      ice: atlasMode === "movie" && showIce,
      iceScenario,
      currents: atlasMode === "explore" && showCurrents,
      winds: atlasMode === "explore" && showWinds,
      hidden: atlasMode === "movie" ? currentClimateHidden() : new Set(climateKinds),
      uncertain: showUncertainHazards,
    },
  );
  const ice = showIce ? iceSnapshot(year, iceScenario) : null;
  $("#ice-status").textContent = ice
    ? `NADI-1 ${ice.scenario.toUpperCase()} snapshot: ${ice.ageCalBP.toLocaleString()} cal BP (${formatYear(1950 - ice.ageCalBP)}). Nearest source snapshot; no interpolated edge. Age difference ${Math.abs(1950 - year - ice.ageCalBP).toLocaleString()} years.`
    : showIce && iceTarget(year, iceScenario)
      ? iceLoadState() === "error"
        ? "Ice snapshot could not load; retrying automatically. Missing geometry is not ice absence."
        : "Loading the dated ice snapshot from the atlas server."
      : showIce
        ? "No NADI-1 snapshot for this year (coverage25,000–1,500cal BP). This does not mean ice absence."
        : "Ice boundaries hidden.";
  const hazards = atlasMode === "movie" ? eventsAt(year, currentClimateHidden(), showUncertainHazards) : [];
  $("#hazard-status").innerHTML =
    physicalState !== "ready"
      ? `<p role="status">${physicalState === "error" ? "Climate catalog could not load. Evidence records remain available." : "Climate catalog loading; event absence cannot yet be assessed."}</p>${physicalState === "error" ? "<button data-retry-physical>Retry climate catalog</button>" : ""}`
      : hazards.length
        ? `<p>${hazards.length} catalog / reconstructed events this year:</p>` +
          hazards
            .map(
              (e) =>
                `<p><a href="#physical/${e.id}">${esc(e.title)} · ${esc(e.status)}</a></p>`,
            )
            .join("")
        : '<p class="fine">No included catalog / ENSO events at this year. ENSO reconstruction covers1525–1934CE only; earlier ENSO evidence requires other sources.</p>';
  $("#active-count").textContent =
    `${active.filter((r) => (r.overlay ? r.overlay.geometry : r.location)).length} mapped records at this time`;
  renderHistoricalContext();
  renderConcurrentContext();
  renderVisible();
}
function renderHistorySummary(){
  const visible=map.visibleRecords();
  const summary=$('#history-summary');
  const count=(kind:string)=>visible.filter(r=>r.history?.kind===kind).length;
  const possibleFoundations=visible.filter(r=>r.history?.kind==='settlement'&&year<r.time.end!).length;
  summary.hidden=atlasMode==='explore'||(isGuidedStory()&&!count('settlement')&&!count('wreck')&&!visible.some(r=>r.history?.windows));
  summary.innerHTML=`<span><b>${count('settlement')-possibleFoundations}</b> foundation records${possibleFoundations?` + ${possibleFoundations} possible`:''}</span><span><b>${visible.filter(r=>r.history?.windows&&currentActive.includes(r)).length}</b> active connections</span><span><b>${count('wreck')}</b> recorded losses</span><small>In this view · not population totals</small>`;
}
function openDetails(){
  if(!mountedMap)return;
  const wasHidden=$('#detail-panel').hidden;
  $('#detail-panel').hidden=false;
  $('.atlas-layout').classList.remove('detail-panel-hidden');
  $('#toggle-details').setAttribute('aria-expanded','true');
  $('#toggle-details').textContent='Hide details';
  if(wasHidden)focusDrawer('detail-panel',true);
}
function renderVisible() {
  if (!mountedMap || !panels) return;
  renderConcurrentContext();
  renderHistorySummary();
  panels.update({
    visible: exploreRecords(currentVisible,map.visibleRecords(),{query:placeQuery,category:placeCategory}),
    context: exploreRecords(showUndated&&atlasMode==='explore'&&explorePeriod==='all'?recordsForView(mapRows(),'explore',year).context:[],map.visibleContextRecords(),{query:placeQuery,category:placeCategory}),
    selected: selected.slice(0,1),
    active: currentActive,
    year,
    exploring: atlasMode === "explore" && explorePeriod==='all',
    interactionLocked: atlasMode === "movie" && playing,
    searching:!!placeQuery.trim(),
    categoryLabel:exploreCategories[placeCategory],
    guided:false,
  });
  syncMapDate();
  const heading=document.querySelector('#visible-heading');if(heading)heading.textContent=placeQuery.trim()?'Search results':'In this view';
  const scope=document.querySelector('#explore-scope');if(scope)scope.textContent=placeQuery.trim()?'Searching all included map records. Select a result to locate it.':`${explorePeriod==='current'?'At '+formatYear(year):'All periods'} · The list follows the map. ${placeCategory==='conflict'?'Only explicit conflict, violence and forced-removal records are included. Gaps are not evidence of peace.':'Search looks across the atlas.'}`;
}
function syncMapDate(){
  const clock=voyageId?voyageClock:movieClock;
  const value=atlasMode==='movie'&&!isGuidedStory()&&clock>=1?`Shared date: ${voyageDate(clock)} · Zoom for local detail`:'One date, all regions · Drag to travel · Scroll to look closer';
  const el=document.querySelector('#map-instruction');if(el&&el.textContent!==value)el.textContent=value;
}
function physicalPage(id?: string) {
  mountPhysicalPage(main, id);
}
function tablePage() {
  tableController = new EvidenceTable(main, tableState, {
    rows,
    year: () => year,
    preview: () => preview,
    setPreview: (value) => {
      preview = value;
    },
    hiddenCultureCount: () => hiddenCultures.size,
  });
}
function renderTableBody() {
  tableController?.refresh();
}
function reviewPage(r: FullDisplayRecord, p?: Proposal, index?: number, shared=false) {
  main.innerHTML = reviewHTML(r, dataset, p);
  const originTopic=topics.find(t=>t.id===reviewTopic);
  const sourceTopic=shared?undefined:(topics.find(t=>t.id===reviewTopic&&t.recordIds.includes(r.id))??(topicOnlyIds.has(r.id)?topics.find(t=>t.recordIds.includes(r.id)):undefined));
  if(shared)$<HTMLButtonElement>('[data-action="locate"]',main).textContent='Show in shared atlas';
  if(sourceTopic)main.insertAdjacentHTML('beforeend',sharedContextHTML([r.id],dataset.records));
  if(sourceTopic||originTopic){
    const returnTopic=sourceTopic??originTopic!;
    const back=document.createElement('a');back.className='back-link topic-return';back.href='#topic/'+returnTopic.id;back.textContent='← Return to '+returnTopic.title;main.prepend(back);
    if(sourceTopic&&r.time.kind==='unplaced'){const locate=$<HTMLButtonElement>('[data-action="locate"]',main);locate.disabled=true;locate.textContent='Chronology unresolved — read the relationship evidence';}
  }
  main
    .querySelectorAll<HTMLElement>("[data-source],[data-claim]")
    .forEach((a) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const target=document.getElementById(
            a.dataset.source !== undefined
              ? "source-" + a.dataset.source
              : "claim-" + a.dataset.claim,
          );
        if(target){
          for(let node:HTMLElement|null=target;node;node=node.parentElement)if(node instanceof HTMLDetailsElement)node.open=true;
          target.scrollIntoView({ behavior: "instant", block: "center" });
        }
      }),
    );
  $('[data-action="correct"]', main).addEventListener("click", () => {
    if (index !== undefined) location.hash = `#edit/${index}`;
    else {
      editorPending = newProposal(r);
      location.hash = "#compose";
    }
  });
  $('[data-action="share"]', main).addEventListener("click", () => {
    const share = p ?? newProposal(r);
    if (!p)
      share.rationale =
        "Evidence row shared for discussion; no changes proposed.";
    exportProposals([share]);
  });
  $('[data-action="locate"]', main).addEventListener("click", () => {
    if(sourceTopic){pendingTopicLocation=r;location.hash='#topic/'+sourceTopic.id;return;}
    storyId='free';storySceneIndex=-1;placeQuery='';placeCategory='all';explorePeriod='all';
    if (r.time.kind === "unplaced") showUndated = true;
    if (r.time.start !== null) setRecordYear(r);
    if (p) preview = true;
    hiddenCultures.delete(r.culture.id);
    if (r.overlay) hiddenLayers.delete(r.overlay.kind);
    if (r.history) hiddenHistory.delete(r.history.kind);
    showModeled=true;
    pendingLocation=r;
    location.hash = r.time.kind === "unplaced" ? "#explore" : "#movie";
  });
}
let editorPending: Proposal | null = null;
function exportProposals(list: Proposal[]) {
  try {
    if (!list.length) {
      announce("Select at least one suggestion to share.");
      return;
    }
    const pack = makePackage(list);
    parsePackage(JSON.stringify(pack));
    downloadJSON("americas-peoples-suggestions.json", pack);
    announce(
      "File downloaded. Send it using your preferred email or file-sharing service.",
    );
  } catch (error) {
    announce((error as Error).message);
  }
}
function proposalsPage() {
  main.innerHTML = `<article class="proposals-page"><div class="page-heading"><div><div class="eyebrow">A LOCAL RESEARCH WORKSPACE</div><h2>Your suggestions</h2><p class="lead">Add evidence. Propose a correction. Share the supporting research.</p></div><a class="button primary" href="#new">+ Suggest new evidence</a></div><p id="storage-status" class="notice">${storageAvailable ? "Browser storage is available as a convenience. Download your suggestions for a portable backup." : "Browser storage is unavailable. Download your suggestions before closing this page."}</p><div class="actions"><button id="export-selected">Send to others</button><button id="select-all">Select all</button><label class="button file-button">Import suggestions<input type="file" id="import-file" aria-label="Import suggestions" accept=".json,.xlsx,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></label></div><p class="muted">Sharing downloads a file; nothing is uploaded or emailed. Imported suggestions remain unreviewed. Complete suggestions can be previewed on the map.</p><div class="actions"><a href="docs/bulk-import-guide.html">Bulk import guide</a><a href="templates/americas-peoples-import.xlsx" download>Download spreadsheet template</a><a href="templates/americas-peoples-researched-import.xlsx" download>Download researched batch</a></div><p class="muted">Bulk entry: use the XLSX template for records, claims, references and source mappings. Excel, LibreOffice, or a downloaded Google Sheets workbook can be used.</p><div id="import-error" role="alert"></div><div class="proposal-list">${proposals.length ? proposals.map((p, i) => `<section class="proposal-card" data-proposal-card><label class="check"><input type="checkbox" data-share="${i}" aria-label="Select proposal ${i + 1}"><span class="tag proposal-tag">${esc(p.state)} · ${esc(p.kind)} · v${p.version}</span></label><h3>${esc(p.record.title || "Untitled draft")}</h3><p>${esc(p.rationale || "No rationale yet.")}</p><div class="actions"><a href="#proposal/${i}">Detailed review</a><a href="#edit/${i}">Edit suggestion</a></div>${comparisonHTML(p)}</section>`).join("") : '<div class="empty large"><h3>A place for the next finding.</h3><p>Start a new evidence row or open a reviewed record and choose Suggest correction.</p></div>'}</div></article>`;
  $("#export-selected").addEventListener("click", () =>
    exportProposals(
      [...main.querySelectorAll<HTMLInputElement>("[data-share]:checked")].map(
        (el) => proposals[Number(el.dataset.share)],
      ),
    ),
  );
  $("#select-all").addEventListener("click", () =>
    main
      .querySelectorAll<HTMLInputElement>("[data-share]")
      .forEach((el) => (el.checked = true)),
  );
  $<HTMLInputElement>("#import-file").addEventListener("change", async (e) => {
    const control = e.target as HTMLInputElement;
    const file = control.files?.[0];
    if (!file) return;
    control.disabled = true;
    $("#import-error").textContent = "Reading and validating the file…";
    try {
      const full = await completeDataset();
      if (file.name.toLowerCase().endsWith(".xlsx")) {
        if (file.size > 5_000_000)
          throw new Error("Workbook exceeds the 5 MB file limit.");
        pending = await importWorkbook(await file.arrayBuffer(), full.records);
      } else if (file.name.toLowerCase().endsWith(".json")) {
        if (file.size > MAX_PACKAGE_BYTES)
          throw new Error(`Package exceeds the ${MAX_PACKAGE_BYTES / 1_000_000} MB limit.`);
        pending = parsePackage(await file.text());
      } else
        throw new Error(
          "Choose a .xlsx template workbook or a native .json proposal file.",
        );
      location.hash = "#import";
    } catch (error) {
      $("#import-error").textContent = (error as Error).message;
    } finally {
      control.disabled = false;
      control.value = "";
    }
  });
}
async function importPage() {
  if (!pending) {
    location.hash = "#proposals";
    return;
  }
  const requested = pending;
  const full = await completeDataset();
  if (location.hash !== "#import" || pending !== requested) return;
  const report = inspectImport(pending.proposals, proposals, full.records);
  main.innerHTML = `<article class="proposals-page"><a href="#proposals" class="back-link">← Your suggestions</a><h2>Review import</h2><p class="lead">${report.length} suggestions. Nothing has been added yet.</p><p>Duplicate copies are skipped. Conflicting copies are retained separately for your review. No bundled evidence will change.</p>${report.map((item) => `<section class="proposal-card"><span class="tag">${item.status}</span><h3>${esc(item.proposal.record.title || "Untitled draft")}</h3><p>${esc(item.reason)}</p><p>${esc(item.proposal.rationale)}</p>${comparisonHTML(item.proposal)}<details><summary>Full incoming record and sources</summary><pre>${esc(JSON.stringify(item.proposal.record, null, 2))}</pre></details></section>`).join("")}<div class="actions"><button id="confirm-import" class="primary">Add to local collection</button><a href="#proposals">Cancel</a></div></article>`;
  $("#confirm-import").addEventListener("click", () => {
    try {
      const next = mergeImport(pending!.proposals, proposals);
      proposals = next;
      pending = null;
      saveLocal();
      location.hash = "#proposals";
    } catch (error) {
      let message = main.querySelector<HTMLElement>("#import-confirm-error");
      if (!message) {
        message = document.createElement("p");
        message.id = "import-confirm-error";
        message.setAttribute("role", "alert");
        main.append(message);
      }
      message.textContent = (error as Error).message;
    }
  });
}
function aboutPage() {
  main.innerHTML = aboutPageHTML(dataset, appVersion);
}
onPhysicalChange(() => {
  if (mountedMap) renderMapData();
  else if (location.hash === "#physical") physicalPage();
});
main.addEventListener("click", (event) => {
  if ((event.target as Element).closest("[data-retry-physical]"))
    void initializePhysical();
});
let previousHash = location.hash || "#movie";
let reverting = false;
let routeGeneration = 0;
let disposeTopic:(()=>void)|undefined;
let topicOriginCamera:MapCamera|undefined;
let topicOriginRoute='#movie';
let lastAtlasCamera:MapCamera|undefined;
let lastAtlasRoute='#movie';
let reviewTopic:string|undefined;
let pendingTopicLocation:DisplayRecord|undefined;
async function route() {
  const generation = ++routeGeneration;
  const hash = location.hash || "#movie";
  if (reverting) {
    reverting = false;
    return;
  }
  if (
    dirty &&
    hash !== previousHash &&
    !confirm("Leave this unsaved suggestion? Use Save draft to keep it.")
  ) {
    reverting = true;
    location.hash = previousHash;
    return;
  }
  dirty = false;
  const evidenceRoute=hash.startsWith('#review/')||hash.startsWith('#context/');
  if(evidenceRoute&&previousHash.startsWith('#topic/'))reviewTopic=previousHash.slice(7);
  else if(!evidenceRoute&&!hash.startsWith('#topic/'))reviewTopic=undefined;
  // Reading pages may sit between the shared atlas and a topic. Keep the
  // last shared view before unmounting it, rather than capturing only direct entry.
  if(mountedMap){lastAtlasCamera=map.camera();lastAtlasRoute=atlasMode==='explore'?'#explore':'#movie';}
  const diveRoute=hash==='#dives'||hash.startsWith('#dives/')||hash==='#sites'||hash==='#topics'||hash.startsWith('#topics/')||hash.startsWith('#topic/');
  if(diveRoute&&!topicOriginCamera){topicOriginCamera=lastAtlasCamera;topicOriginRoute=lastAtlasRoute;}
  disposeTopic?.();disposeTopic=undefined;
  previousHash = hash;
  tableController?.dispose();
  tableController = undefined;
  requestIce(-1000000, iceScenario);
  mountedMap = false;
  map.clearHover();
  stop();
  const activeNav=diveRoute?'#dives':hash==='#explore'?'#explore':['#map','#movie'].includes(hash)||hash.startsWith('#story/')?'#movie':'#library';
  document
    .querySelectorAll("nav a")
    .forEach((a) =>
      a.classList.toggle("active", a.getAttribute("href") === activeNav),
    );
  document.body.classList.remove("movie-playing","focus-view");
  const mapRoute=["#map","#movie","#explore"].includes(hash);
  document.body.classList.toggle('topic-page',hash.startsWith('#topic/'));
  document.body.classList.toggle('atlas-page',mapRoute);
  document.body.classList.toggle('reading-page',!mapRoute);
  $(".timeline").hidden=!mapRoute;
  document.body.classList.remove('exploring');
  try {
    if (["#map", "#movie", "#explore"].includes(hash)) {
      const nextMode=hash === "#explore" ? "explore" : "movie";
      if(nextMode!==atlasMode){placeQuery='';placeCategory='all';}
      atlasMode = nextMode;
      document.body.classList.toggle("exploring", atlasMode === "explore");
      $(".timeline").hidden = atlasMode === "explore" && explorePeriod!=="current";
      mapPage();
      if(topicOriginCamera){map.restoreCamera(topicOriginCamera);topicOriginCamera=undefined;}
      if(pendingLocation){const record=pendingLocation;pendingLocation=null;map.focus(record);}
    }
    else if(hash==='#dives'||hash.startsWith('#dives/')){
      main.innerHTML=deepDiveIndexHTML(hash.slice(7),topicOriginRoute);
    }
    else if(hash.startsWith('#story/')){
      const requested=decodeURIComponent(hash.slice(7));
      if(!stories.some(s=>s.id===requested))throw new Error('Story not found.');
      openingPlayback=false;voyageId='';storyId=requested;storyElapsed=pendingStoryYear===null?0:storyElapsedAtYear(currentStory(),pendingStoryYear);storySceneIndex=-1;
      placeQuery='';placeCategory='all';topicOriginCamera=undefined;
      location.replace('#movie');return;
    }
    else if(hash==='#topics'||hash.startsWith('#topics/')){
      const requested=decodeURIComponent(hash.slice(8));
      if(topics.some(t=>t.id===requested)){location.replace('#topic/'+encodeURIComponent(requested));return;}
      main.innerHTML=deepDiveIndexHTML('subjects',topicOriginRoute);
      const item=[...main.querySelectorAll<HTMLElement>('[data-future-topic]')].find(el=>el.dataset.futureTopic===requested);
      if(item){item.classList.add('future-selected');requestAnimationFrame(()=>{item.focus();item.scrollIntoView({block:'start'});});}
    }
    else if(hash.startsWith('#topic/')){
      const topic=topics.find(t=>t.id===hash.slice(7));if(!topic)throw new Error('Topic not found.');
      disposeTopic=mountTopicPage(main,topic,dataset.records,land,topicOriginRoute,pendingTopicLocation);pendingTopicLocation=undefined;
    }
    else if (hash === "#library") main.innerHTML = libraryHTML(dataset.records.length);
    else if (hash === "#evidence") tablePage();
    else if (hash === "#context") main.innerHTML = contextHTML(rows());
    else if (hash === "#proposals") proposalsPage();
    else if (hash === "#about") aboutPage();
    else if (hash === "#sites") main.innerHTML = deepDiveIndexHTML('places',topicOriginRoute);
    else if (hash === "#physical" || hash.startsWith("#physical/")) {
      const id = hash.slice(10);
      if (id) {
        await fullHazard(id);
        if (generation !== routeGeneration) return;
      }
      physicalPage(id);
    } else if (hash === "#import") await importPage();
    else if (evidenceRoute) {
      main.innerHTML =
        '<article class="review-page"><p role="status">Loading the full source-linked record…</p></article>';
      const r = await fullRecord(decodeURIComponent(hash.slice(hash.startsWith('#context/')?9:8)));
      if (generation !== routeGeneration) return;
      reviewPage(r,undefined,undefined,hash.startsWith('#context/')&&!topicOnlyIds.has(r.id));
    } else if (hash.startsWith("#proposal/")) {
      const i = Number(hash.slice(10)),
        p = proposals[i];
      if (!p) throw new Error("Suggestion not found.");
      reviewPage({ ...p.record, proposalKey: String(i) }, p, i);
    } else if (
      hash === "#new" ||
      hash === "#compose" ||
      hash.startsWith("#edit/")
    ) {
      const index = hash.startsWith("#edit/")
        ? Number(hash.slice(6))
        : undefined;
      const p =
        index !== undefined
          ? proposals[index]
          : hash === "#compose"
            ? editorPending
            : newProposal();
      if (!p) throw new Error("Suggestion not found.");
      mountEditor(
        main,
        p,
        (saved) => {
          try {
            const next = proposals.slice();
            if (index !== undefined) {
              saved.version = p.version + 1;
              next[index] = saved;
            } else next.push(saved);
            validateCollection(next);
            proposals = next;
            dirty = false;
            saveLocal();
            location.hash = "#proposals";
          } catch (error) {
            announce((error as Error).message);
          }
        },
        (value) => (dirty = value),
      );
    } else throw new Error("Page not found.");
  } catch (error) {
    if (generation !== routeGeneration) return;
    main.innerHTML = `<article class="review-page"><h2>Unable to open this page</h2><p>${esc((error as Error).message)}</p><a href="#map">Return to map</a></article>`;
  }
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);
bounds(true);
setYear(year,false);
route();
void loadAtlasAssets(()=>{
  map.context.boundaries=atlasAssets.boundaries;map.context.rails=atlasAssets.rails;map.context.voyages=atlasAssets.voyages;
  if(mountedMap)renderMapData();
  if(openingPlayback&&atlasAssets.ready&&mountedMap&&atlasMode==='movie'&&storyId==='free'&&!voyageId){openingPlayback=false;map.overview('americas');if(!playing)$('#play').click();}
},value=>map.setDetailedLand(value));
requestAnimationFrame(tick);
