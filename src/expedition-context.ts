import {isPlayableVoyage,MOVIE_END_DATE,sampleMapVoyage} from './shared-movie';
import {sampleVoyage,dateValue,type Voyage,type VoyagePhase} from './voyages';
import {esc} from './dom';

const phaseNames:Record<VoyagePhase,string>={sailing:'Sailing',river:'River travel',overland:'Overland',sledging:'Sledging','ice-drift':'Drifting with the ice',wintering:'Wintering',rescue:'Rescue journey'};
export function expeditionPhase(voyage:Voyage,frame:NonNullable<ReturnType<typeof sampleVoyage>>):string{
 const phase=voyage.stops[frame.leg].phase;
 if(phase&&!(phase==='wintering'&&frame.status==='traveling'))return phaseNames[phase];
 return frame.status==='stopped'?'At a documented stop':frame.mode==='land'?'Overland':frame.mode==='river'?'River travel':frame.mode==='air'?'Flying':'Sailing';
}
export interface ActiveExpedition {id:string;name:string;position:string;phase:string;coordinates:[number,number]|null;inView:boolean}
/** The clock, not camera scope or selected itinerary, determines contemporaries. */
export function activeExpeditions(voyages:readonly Voyage[],date:number,inView:(p:[number,number])=>boolean):ActiveExpedition[]{
 if(date>MOVIE_END_DATE)return [];
 return voyages.flatMap(v=>{
  if(!isPlayableVoyage(v)||date<dateValue(v.stops[0].arrival)||date>dateValue(v.stops.at(-1)!.departure))return [];
  const f=sampleMapVoyage(v,date);
  return [{id:v.id,name:v.name,position:f?.stopName??'Position not reconstructed between documented anchors',phase:f?expeditionPhase(v,f):'Expedition in progress',coordinates:f?.coordinates??null,inView:!!f&&inView(f.coordinates)}];
 });
}
export function expeditionsHTML(entries:readonly ActiveExpedition[]):string{
 return entries.map(e=>`<button class="expedition-row" data-follow-expedition="${esc(e.id)}"><strong>${esc(e.name)}</strong><span>${!e.coordinates?'Untraced interval':e.inView?'On this map':'Outside this view'} · ${esc(e.phase)}</span><small>${esc(e.position)}</small><span class="expedition-follow">${e.coordinates?'Locate':'Read itinerary'} at this date</span></button>`).join('');
}

export interface ExpeditionActivity {id:string;name:string;start:string;end:string;region:string;note:string;sourceIds:string[];relatedVoyageIds?:string[]}
function periodBound(value:string,end=false):number{
 if(/^\d{4}$/.test(value))return Number(value)+(end?1:0);
 if(/^\d{4}-\d{2}-\d{2}$/.test(value)){
  const start=dateValue(value);if(!Number.isFinite(start)||!end)return start;
  const next=new Date(value+'T00:00:00Z');next.setUTCDate(next.getUTCDate()+1);
  return dateValue(next.toISOString().slice(0,10));
 }
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(value))return NaN;
 const [y,m]=value.split('-').map(Number);
 return end?(m===12?y+1:dateValue(`${y}-${String(m+1).padStart(2,'0')}-01`)):dateValue(value+'-01');
}
/** A dated window establishes activity, never an inferred daily location. */
export function activityDuring(activities:readonly ExpeditionActivity[],date:number,precise:readonly ActiveExpedition[]=[]):ExpeditionActivity[]{
 if(date>MOVIE_END_DATE)return [];
 return activities.filter(a=>date>=periodBound(a.start)&&date<periodBound(a.end,true)&&!a.relatedVoyageIds?.some(id=>precise.some(e=>e.id===id&&e.coordinates!==null)));
}
export function activityWindows(activities:readonly ExpeditionActivity[]):{start:number;end:number}[]{
 return activities.flatMap(a=>{
  const start=periodBound(a.start),end=periodBound(a.end,true);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||start>MOVIE_END_DATE)return [];
  return [{start,end:Math.min(MOVIE_END_DATE,end)}];
 });
}
export function expeditionActivityHTML(entries:readonly ExpeditionActivity[],sources:readonly {id:string;title:string;url:string}[]):string{
 return entries.map(e=>`<details class="expedition-period"><summary>${esc(e.name)}<span>Recorded ${esc(e.start)}${e.end!==e.start?'–'+esc(e.end):''} · ${e.start.length>7||e.end.length>7?'day':e.start.length>4||e.end.length>4?'month':'year'} precision</span></summary><p>${esc(e.region)}. ${esc(e.note)}</p><p>Dates establish the period; the position on this particular day is not reconstructed.</p>${e.sourceIds.map(id=>{const s=sources.find(s=>s.id===id);return s&&/^https:\/\/[^\s]+$/.test(s.url)?`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)} ↗</a>`:'';}).join(' · ')}</details>`).join('');
}
