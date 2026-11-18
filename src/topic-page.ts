import {sharedContextHTML,relatedDivesHTML} from './topic-context';
import {watchDetailedLand} from './atlas-assets';
import { MapView, type MapCamera } from './map';
import type { DisplayRecord } from './model';
import { recordsForView } from './atlas-view';
import { availableVoyageRecords } from './shared-movie';
import { TopicSession } from './topic-session';
import { topics, topicRecords, type TopicDive } from './topic-dives';
import { languageLineagesHTML } from './language-lineages';
import { storyDetailsHTML } from './story-details';
import { esc } from './dom';
import { formatYear, timeLabel, END_YEAR } from './time';
import { recordHref } from './review';
import { climateKinds } from './physical';
import { timelinePosition, timelineYear } from './timeline';
import { storyDurationMs } from './story-player';
import {siteGuides} from './site-guides';

interface SavedTopic {session:TopicSession;camera?:MapCamera}
const saved=new Map<string,SavedTopic>();
/** This controller never receives or changes the shared atlas clock or filters. */
export function mountTopicPage(host:HTMLElement,topic:TopicDive,all:readonly DisplayRecord[],land:any,returnHref="#movie",initialRecord?:DisplayRecord):()=>void{
 const records=topicRecords(topic,all);
 const guide=siteGuides.find(g=>g.topicId===topic.id);
 const evidenceStartYear=Math.min(...records.flatMap(r=>r.time.start===null?[]:[r.time.start]));
 const state=saved.get(topic.id)??{session:new TopicSession(topic,evidenceStartYear)};saved.set(topic.id,state);
 const session=state.session;
 let playing=false,last=0,frameId=0,disposed=false,rate=1,drawnYear=NaN,drawnScene=-1;
 let selected:DisplayRecord[]=[];
 host.innerHTML=`<div class="topic-toolbar"><div><span class="eyebrow">TOPIC DIVE · INDEPENDENT TIMELINE</span><h2>${esc(topic.title)}</h2></div><a href="#dives">All deep dives</a><label>Change movie<select id="topic-select">${topics.map(t=>`<option value="${t.id}" ${t.id===topic.id?'selected':''}>${esc(t.title)}</option>`).join('')}</select></label><a href="${esc(returnHref)}">↔ Shared atlas</a></div><div class="topic-layout"><aside class="topic-narrative" aria-label="Topic story"><p class="topic-intro">${esc(topic.subtitle)}</p>${session.maxYear>END_YEAR?`<p class="topic-scope-note">This topic continues through ${session.maxYear}. The shared atlas ends in ${END_YEAR}.</p>`:""}${guide?`<p><a class="topic-guide-link" href="${esc(guide.href)}">Read the illustrated guide ↗</a></p>`:""}<div id="topic-scene"></div><div id="topic-chapters" class="topic-chapters" aria-label="Topic chapters"></div>${topic.id==='languages'||topic.languageFamilyIds?languageLineagesHTML(topic.languageFamilyIds):''}<details class="topic-method"><summary>How to read this topic</summary><p>${esc(topic.method)}</p><p>Empty space means missing included evidence. A line connects evidence locations; it is not a surveyed route or proof of continuous movement. Earlier sites can remain as hollow markers, explicitly dated as earlier evidence.</p></details>${relatedDivesHTML(topic.id)}</aside><section class="topic-stage" aria-label="Topic map"><div id="topic-map"></div><div id="topic-date-label" class="topic-date-label" role="status"></div><details class="topic-local-list"><summary>Evidence in this view <span id="topic-count"></span></summary><div id="topic-records"></div></details></section><aside id="topic-detail" class="topic-detail" hidden aria-label="Selected topic evidence"></aside></div><footer class="topic-transport"><div class="topic-buttons"><button id="topic-restart" aria-label="Restart topic">↤</button><button id="topic-previous" aria-label="Previous topic chapter">‹</button><button id="topic-play" aria-label="Play topic">▶ Play</button><button id="topic-next" aria-label="Next topic chapter">›</button><strong id="topic-year"></strong></div><label class="topic-film-progress">Chapter movie<input id="topic-progress" type="range" min="0" max="1000" value="0" aria-label="Topic movie progress"></label><label>Pace<select id="topic-rate"><option value="0.6">Relaxed</option><option value="1" selected>Normal</option><option value="2">Fast</option></select></label><details class="topic-date-controls"><summary>Choose any date</summary><form id="topic-date-form"><input id="topic-year-input" type="number" step="1" min="1" aria-label="Topic year number" required><select id="topic-era" aria-label="Topic era"><option>CE</option><option>BCE</option></select><button>Go</button></form><label>Topic date<input id="topic-date" type="range" min="0" max="10000" aria-label="Topic timeline year"></label><p>Dates change only this topic. The shared atlas keeps your previous place and time.</p><p id="topic-date-error" role="alert"></p>${topic.id==='languages'?'<button id="topic-1799">View 1799</button>':''}</details></footer>`;
 const $=<T extends HTMLElement=HTMLElement>(q:string)=>host.querySelector<T>(q)!;
 const map=new MapView(land,items=>{pause();selected=items;renderDetails();map.setHighlighted(items.map(r=>r.id));},renderVisible);
 const unsubscribeLand=watchDetailedLand(value=>map.setDetailedLand(value));
 map.context.options={boundaries:false,rails:false,voyages:false,voyageId:'',voyageDate:null};
 $('#topic-map').append(map.element);
 function pause(){playing=false;$('#topic-play').textContent='▶ Play';$('#topic-play').setAttribute('aria-label','Play topic');map.setInteraction({mode:'movie',playing:false,onPause:pause});}
 function renderDetails(){
  const panel=$('#topic-detail');panel.hidden=!selected.length;
  panel.innerHTML=selected.length?`<button id="topic-close-detail" aria-label="Close topic details">×</button>${selected.map(r=>`<h3>${esc(r.title)}</h3><p>${esc(timeLabel(r.time))}</p><p>${esc(r.review.summary)}</p><p class="fine">${esc(r.review.limitations)}</p><a href="${recordHref(r)}">Full evidence &amp; sources ↗</a>${sharedContextHTML([r.id],all)}`).join('')}`:'';
  panel.querySelector('button')?.addEventListener('click',()=>{selected=[];renderDetails();map.setHighlighted([]);});
 }
 function renderVisible(){
  if(disposed)return;
  const visible=map.visibleRecords();$('#topic-count').textContent=`· ${visible.length}`;
  $('#topic-records').innerHTML=visible.map(r=>`<button data-topic-record="${esc(r.id)}"><strong>${esc(r.title)}</strong><small>${esc(timeLabel(r.time))}</small></button>`).join('')||'<p>No included evidence in this view at this date. Zoom out or choose another chapter.</p>';
 }
 function sceneCopy(){
  const s=topic.scenes[session.sceneIndex];
  $('#topic-scene').innerHTML=session.guided?`<div class="scene-copy"><span class="eyebrow">CHAPTER ${session.sceneIndex+1} / ${topic.scenes.length} · ${esc(formatYear(s.year))}</span><h2>${esc(s.title)}</h2><p>${esc(s.body)}</p><details class="scene-sources scene-notes"><summary>Dates and evidence notes</summary><p class="scene-note">${esc(s.note)}</p></details>${storyDetailsHTML(s,all)}${sharedContextHTML(s.recordIds,all)}<details class="scene-sources"><summary>Read the evidence · ${s.recordIds.length}</summary>${s.recordIds.map(id=>{const r=all.find(r=>r.id===id);return r?`<a href="${recordHref(r)}">${esc(r.title)} ↗</a>`:'';}).join('')}</details></div>`:`<div class="scene-copy"><span class="eyebrow">YOUR TOPIC DATE</span><h2>${esc(formatYear(Math.floor(session.year)))}</h2><p>${esc(topic.dateNote)}</p><button id="topic-resume-chapters">Return to chapter movie</button></div>`;
  $('#topic-resume-chapters')?.addEventListener('click',()=>seek(session.sceneIndex));
  $('#topic-chapters').innerHTML=topic.scenes.map((s,i)=>`<button data-topic-scene="${i}" aria-current="${session.guided&&i===session.sceneIndex?'step':'false'}" aria-label="Chapter ${i+1}: ${esc(s.title)}">${i+1}</button>`).join('');
  $('.topic-narrative').scrollTop=0;
 }
 function render(reframe=false){
  const year=Math.floor(session.year);
  if(drawnScene!==session.sceneIndex||reframe){
   const s=topic.scenes[session.sceneIndex];if(reframe||session.guided)map.focusRegion(s.center,s.zoom,s.scope);
   map.setHighlighted(session.guided?s.recordIds:[]);sceneCopy();drawnScene=session.sceneIndex;
  }
  if(year!==drawnYear||reframe){
   // Topic controls display a whole year; only expedition playback has a day-level clock.
   const eligible=availableVoyageRecords(records,[],year+1-1e-9);
   const view=recordsForView(eligible,'movie',year);
   const shown=[...view.dated,...view.history];
   selected=selected.filter(r=>shown.some(v=>v.id===r.id));renderDetails();
   map.update(shown,year,[],{ice:false,iceScenario:'optimal',currents:false,winds:false,hidden:new Set(climateKinds),uncertain:false});
   drawnYear=year;renderVisible();
  }
  $('#topic-year').textContent=formatYear(year);$('#topic-date-label').textContent=`${formatYear(year)} · ${topic.title} only`;
  if(!session.guided)$('#topic-scene h2').textContent=formatYear(year);
  $<HTMLInputElement>('#topic-date').value=String(Math.round(timelinePosition(year,session.minYear,session.maxYear,'log')*10000));
  $('#topic-date').setAttribute('aria-valuetext',formatYear(year));
  $<HTMLInputElement>('#topic-year-input').value=String(year<=0?1-year:year);$<HTMLSelectElement>('#topic-era').value=year<=0?'BCE':'CE';
  $<HTMLInputElement>('#topic-progress').value=String(Math.round(session.elapsed/storyDurationMs(topic)*1000));
  $('#topic-progress').setAttribute('aria-valuetext',`Chapter ${session.sceneIndex+1} of ${topic.scenes.length}`);
  $<HTMLInputElement>('#topic-progress').disabled=!session.guided;
  $<HTMLButtonElement>('#topic-previous').disabled=session.guided&&session.sceneIndex===0;
  $<HTMLButtonElement>('#topic-next').disabled=session.guided&&session.sceneIndex===topic.scenes.length-1;
 }
 function seek(index:number){pause();session.seekScene(index);render(true);}
 function date(year:number){pause();session.seekYear(year);sceneCopy();drawnYear=NaN;render();}
 $('#topic-select').addEventListener('change',e=>location.hash='#topic/'+(e.target as HTMLSelectElement).value);
 $('#topic-play').addEventListener('click',()=>{
  if(playing){pause();return;}if(session.completed)seek(0);
  playing=true;last=performance.now();$('#topic-play').textContent='Ⅱ Pause';$('#topic-play').setAttribute('aria-label','Pause topic');map.setInteraction({mode:'movie',playing:true,onPause:pause});
 });
 $('#topic-restart').addEventListener('click',()=>seek(0));$('#topic-previous').addEventListener('click',()=>seek(session.sceneIndex-1));$('#topic-next').addEventListener('click',()=>seek(session.sceneIndex+1));
 $('#topic-chapters').addEventListener('click',e=>{const b=(e.target as Element).closest<HTMLElement>('[data-topic-scene]');if(b)seek(Number(b.dataset.topicScene));});
 $('#topic-records').addEventListener('click',e=>{const b=(e.target as Element).closest<HTMLElement>('[data-topic-record]');if(!b)return;pause();selected=records.filter(r=>r.id===b.dataset.topicRecord);renderDetails();map.setHighlighted(selected.map(r=>r.id));});
 $('#topic-rate').addEventListener('change',()=>rate=Number($<HTMLSelectElement>('#topic-rate').value));
 $('#topic-date').addEventListener('input',()=>date(timelineYear(Number($<HTMLInputElement>('#topic-date').value)/10000,session.minYear,session.maxYear,'log')));
 $('#topic-date-form').addEventListener('focusin',pause);
 $('#topic-date-form').addEventListener('submit',e=>{e.preventDefault();const n=Number($<HTMLInputElement>('#topic-year-input').value);const y=$<HTMLSelectElement>('#topic-era').value==='BCE'?1-n:n;if(!Number.isInteger(n)||n<1||y<session.minYear||y>session.maxYear){$('#topic-date-error').textContent=`Choose a date between ${formatYear(session.minYear)} and ${formatYear(session.maxYear)}.`;return;}$('#topic-date-error').textContent='';date(y);});
 $('#topic-1799')?.addEventListener('click',()=>date(1799));
 $('#topic-progress').addEventListener('input',()=>{pause();session.elapsed=0;session.guided=true;session.advance(Number($<HTMLInputElement>('#topic-progress').value)/1000*storyDurationMs(topic));render(true);});
 const visibility=()=>{if(document.hidden)pause();};document.addEventListener('visibilitychange',visibility);
 const key=(e:KeyboardEvent)=>{if(e.code==='Space'&&!(e.target as Element).closest('input,select,textarea,button,a,summary')){e.preventDefault();$('#topic-play').click();}if(e.key==='Escape'){selected=[];renderDetails();map.clearHover();}};host.addEventListener('keydown',key);
 function tick(now:number){if(disposed)return;if(playing){session.advance(Math.min(250,Math.max(0,now-last))*rate);render();if(session.completed)pause();}last=now;frameId=requestAnimationFrame(tick);}
 render(true);pause();if(state.camera)map.restoreCamera(state.camera);
 if(initialRecord&&records.some(r=>r.id===initialRecord.id)&&initialRecord.time.start!==null){date(initialRecord.time.start);map.focus(initialRecord);selected=[initialRecord];renderDetails();map.setHighlighted([initialRecord.id]);}
 frameId=requestAnimationFrame(tick);
 return ()=>{state.camera=map.camera();disposed=true;unsubscribeLand();cancelAnimationFrame(frameId);document.removeEventListener('visibilitychange',visibility);host.removeEventListener('keydown',key);map.dispose();};
}
