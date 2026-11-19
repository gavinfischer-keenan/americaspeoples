import type {DisplayRecord} from './model';
import {topics,topicOnlyIds} from './topic-dives';
import {futureDives,topicConnections} from './deep-dive-backlog';
import {esc} from './dom';
import {recordInTimeline,timeLabel} from './time';
import {siteGuides} from './site-guides';
import {guidesLinkedToTopic} from './guide-connections';

export function sharedContextRecords(ids:readonly string[],all:readonly DisplayRecord[]):DisplayRecord[]{
 const byId=new Map(all.map(r=>[r.id,r])),found=new Map<string,DisplayRecord>();
 for(const id of ids){const r=byId.get(id);if(!r)continue;
  for(const candidate of [r.id,...r.review.relatedIds]){const c=byId.get(candidate);if(c&&!topicOnlyIds.has(c.id)&&recordInTimeline(c))found.set(c.id,c);}
 }
 return [...found.values()];
}
export function sharedContextHTML(ids:readonly string[],all:readonly DisplayRecord[]):string{
 const records=sharedContextRecords(ids,all);
 if(!records.length)return '';
 return `<section class="topic-context"><h3>In the shared history</h3><p>These places and encounters also belong to the whole atlas. Their dates can differ from this chapter’s.</p>${records.map(r=>`<a data-shared-context href="#context/${encodeURIComponent(r.id)}"><strong>${esc(r.title)}</strong><small>${esc(timeLabel(r.time))}</small><span>Evidence &amp; shared map ↗</span></a>`).join('')}</section>`;
}
export function relatedDivesHTML(id:string,links=[...(topicConnections[id]??[]),...guidesLinkedToTopic(id)]):string{
 if(!links.length)return '';
 const seen=new Set<string>();
 const rows=links.filter(([target])=>!seen.has(target)&&!!seen.add(target)).map(([target,reason])=>{
  const t=topics.find(t=>t.id===target),g=siteGuides.find(g=>g.id===target),f=futureDives.find(f=>f.id===target);
  if(!t&&!g&&!f)return '';
  const href=t?'#topic/'+encodeURIComponent(target):g?g.href:'#topics/'+encodeURIComponent(target);
  return `<p><a href="${esc(href)}">${esc((t??g??f)!.title)}${t||g?' ↗':' · planned'}</a><small>${esc(reason)}</small></p>`;
 }).join('');
 return rows?`<section class="related-dives"><h3>See also</h3>${rows}</section>`:'';
}
export function futureDivesHTML():string{
 if(!futureDives.length)return '';
 return `<section class="future-dives"><span class="eyebrow">REQUESTED · NOT YET PLAYABLE</span><h2>Next histories to investigate</h2><p>Research priorities, with connections to the stories already here. Coverage will grow case by case.</p>${futureDives.map(f=>`<article id="future-${f.id}" tabindex="-1" data-future-topic="${f.id}"><h3>${esc(f.title)}</h3><p>${esc(f.description)}</p>${relatedDivesHTML(f.id,f.links)}</article>`).join('')}</section>`;
}
