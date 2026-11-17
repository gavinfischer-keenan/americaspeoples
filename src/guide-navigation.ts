import {siteGuides} from './site-guides';
import {esc} from './dom';

/** Editorial hierarchy links studies; it does not filter shared historical evidence. */
export function guideMovieNavigationHTML(storyId:string,recordIds:readonly string[]):string{
 const guide=siteGuides.find(g=>g.storyId===storyId);if(!guide)return '';
 const parent=siteGuides.find(g=>g.id===guide.parentGuideId);
 const children=siteGuides.filter(g=>g.parentGuideId===guide.id);
 if(!parent&&!children.length)return '';
 const relevant=children.filter(g=>[...g.recordIds,...g.referenceRecordIds??[]].some(id=>recordIds.includes(id)));
 const ordered=[...relevant,...children.filter(g=>!relevant.includes(g))];
 return `<nav class="region-story-links" aria-label="Regional and local studies">${parent?`<p>Part of <a ${parent.storyId?`data-shared-study="${esc(parent.storyId)}"`:""} href="${parent.storyId?'#story/'+esc(parent.storyId):esc(parent.href)}">${esc(parent.title)} ↗</a></p>`:''}${ordered.length?`<details open><summary>Look closer at the places</summary>${ordered.map(g=>`<a ${g.storyId?`data-shared-study="${esc(g.storyId)}"`:""} href="${g.storyId?'#story/'+esc(g.storyId):esc(g.href)}">${esc(g.title)} ↗</a>`).join('')}</details>`:''}<a href="${esc(guide.href)}">Read this guide and its sources ↗</a><p>These movies share the world timeline. Zoom out to see contemporary histories elsewhere.</p></nav>`;
}
