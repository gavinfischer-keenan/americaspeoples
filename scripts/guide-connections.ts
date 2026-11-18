import {guideConnections,type GuideConnections} from '../src/guide-connections';
import {htmlEscape as esc} from './guide-enrichment';

type GuideTarget={id:string;title:string;href:string;description:string;relatedGuideIds?:string[]};
type TopicTarget={id:string;title:string};
export function guideConnectionsHTML(id:string,guides:GuideTarget[],topics:TopicTarget[],connections:GuideConnections=guideConnections):string {
  const owner=guides.find(g=>g.id===id);
  const links=[...(connections[id]??[])];
  for(const target of owner?.relatedGuideIds??[]) {
    if(!links.some(link=>link.kind==='guide'&&link.id===target)) {
      const guide=guides.find(g=>g.id===target);
      if(!guide)throw Error('Unknown connected guide '+target);
      links.push({kind:'guide',id:target,reason:guide.description});
    }
  }
  const seen=new Set<string>();
  const cards=links.filter(link=>!seen.has(link.kind+':'+link.id)&&!!seen.add(link.kind+':'+link.id)).map(link=>{
    if(!/^[a-z0-9-]+$/.test(link.id)||!link.reason.trim())throw Error('Invalid guide connection');
    const target=link.kind==='guide'?guides.find(g=>g.id===link.id):link.kind==='topic'?topics.find(t=>t.id===link.id):undefined;
    if(!target)throw Error('Unknown connected '+link.kind+' '+link.id);
    const href=link.kind==='guide'?link.id+'.html':'../#topic/'+link.id;
    return `<a class="connected-dive" href="${esc(href)}"><span class="eyebrow">${link.kind==='guide'?'Read a related guide':'Watch a topic movie'}</span><h3>${esc(target.title)} ↗</h3><p>${esc(link.reason)}</p></a>`;
  }).join('');
  return cards?`<section id="related-dives" class="guide-connections"><h2>Follow the connections</h2><div class="connected-dive-grid">${cards}</div></section>`:'';
}
export const guideConnectionsCSS='.guide-connections{padding:1.5rem 0}.connected-dive-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:1rem}.connected-dive{display:block;padding:1.25rem;background:#eef4ee;border:1px solid #bfd0c5;border-radius:.5rem;text-decoration:none;color:#143943}.connected-dive h3{margin:.45rem 0}.connected-dive p{margin:.5rem 0 0;font-size:.95rem;line-height:1.65}.connected-dive:hover{background:#dfede3;border-color:#397d77}.connected-dive:focus-visible{outline:3px solid #216f74;outline-offset:3px}';
