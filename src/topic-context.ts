import type {DisplayRecord} from './model';
import {topics,topicOnlyIds} from './topic-dives';
import {futureDives,topicConnections} from './deep-dive-backlog';
import {esc} from './dom';
import {timeLabel} from './time';

export function sharedContextRecords(ids:readonly string[],all:readonly DisplayRecord[]):DisplayRecord[]{
 const byId=new Map(all.map(r=>[r.id,r])),found=new Map<string,DisplayRecord>();
 for(const id of ids){const r=byId.get(id);if(!r)continue;
  for(const candidate of [r.id,...r.review.relatedIds]){const c=byId.get(candidate);if(c&&!topicOnlyIds.has(c.id))found.set(c.id,c);}
 }
 return [...found.values()];
}
export function sharedContextHTML(ids:readonly string[],all:readonly DisplayRecord[]):string{
 const records=sharedContextRecords(ids,all);
 if(!records.length)return '';
 return `<section class="topic-context"><h3>In the shared history</h3><p>These places and encounters also belong to the whole atlas. Their dates can differ from this chapter’s.</p>${records.map(r=>`<a data-shared-context href="#context/${encodeURIComponent(r.id)}"><strong>${esc(r.title)}</strong><small>${esc(timeLabel(r.time))}</small><span>Evidence &amp; shared map ↗</span></a>`).join('')}</section>`;
}
export function relatedDivesHTML(id:string,links=topicConnections[id]??[]):string{
 if(!links.length)return '';
 return `<section class="related-dives"><h3>See also</h3>${links.map(([target,reason])=>{const t=topics.find(t=>t.id===target),f=futureDives.find(f=>f.id===target);if(!t&&!f)return '';return `<p><a href="${t?'#topic/':'#topics/'}${encodeURIComponent(target)}">${esc((t??f)!.title)}${t?' ↗':' · planned'}</a><small>${esc(reason)}</small></p>`;}).join('')}</section>`;
}
export function futureDivesHTML():string{
 return `<section class="future-dives"><span class="eyebrow">REQUESTED · NOT YET PLAYABLE</span><h2>Next histories to investigate</h2><p>Research priorities, with connections to the stories already here. Coverage will grow case by case.</p>${futureDives.map(f=>`<article id="future-${f.id}" tabindex="-1" data-future-topic="${f.id}"><h3>${esc(f.title)}</h3><p>${esc(f.description)}</p>${relatedDivesHTML(f.id,f.links)}</article>`).join('')}</section>`;
}
