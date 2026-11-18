import test from 'node:test';
import assert from 'node:assert/strict';
import {deepDives, diveCategories, deepDiveIndexHTML} from '../src/deep-dives';
import {topics} from '../src/topic-dives';
import {stories} from '../src/stories';
import {siteGuides} from '../src/site-guides';

test('every existing movie and guide has one home in the categorized directory',()=>{
 const links=deepDives.flatMap(d=>d.links.map(l=>l.href));
 for(const href of [...topics.map(t=>'#topic/'+t.id),...stories.map(s=>'#story/'+s.id),...siteGuides.map(g=>g.href)])
  assert.equal(links.filter(l=>l===href).length,1,href);
 assert.equal(new Set(deepDives.map(d=>d.id)).size,deepDives.length);
 for(const d of deepDives)assert.ok(diveCategories.some(c=>c.id===d.category));
});
test('language and culture movies leave the subject list; places combine existing formats',()=>{
 const home=(href:string)=>deepDives.find(d=>d.links.some(l=>l.href===href))!;
 assert.equal(home('#topic/languages').category,'languages');
 assert.equal(home('#topic/haudenosaunee').category,'cultures');
 assert.equal(home('#topic/amazonian-peoples').category,'cultures');
 assert.equal(home('#story/peoples-of-the-north').category,'cultures');
 assert.equal(home('sites/chaco.html'),home('#story/chaco-connections'));
 assert.equal(home('sites/machu-picchu.html').category,'places');
 assert.equal(home('sites/inca-civilization.html').category,'cultures');
});
test('each list has truthful availability and no invented playback links',()=>{
 for(const c of diveCategories){
  const planned=deepDives.filter(d=>d.category===c.id&&!d.links.length);

  const html=deepDiveIndexHTML(c.id);
  if(!planned.length)assert.doesNotMatch(html,/class="dive-queue"|0 coming soon/);
  for(const d of planned){
   assert.ok(html.includes(`data-dive="${d.id}"`));
   const card=html.split(`data-dive="${d.id}"`)[1].split('</article>')[0];
   assert.match(card,/Coming soon/);assert.doesNotMatch(card,/<a |Play|Watch movie/);
  }
 }
 const html=deepDiveIndexHTML('unknown');
 assert.match(html,/Choose your way in/);assert.doesNotMatch(html,/undefined/);
});

test('the rai movie and its illustrated guide share one subject card',()=>{
 const card=deepDives.find(d=>d.links.some(l=>l.href==='#topic/rai-stone-money'));
 assert.ok(card);
 assert.equal(card.category,'subjects');
 assert.ok(card.links.some(l=>l.href==='sites/yap-rai.html'&&l.label==='Read guide'));
 assert.equal(deepDives.filter(d=>d.links.some(l=>l.href==='sites/yap-rai.html')).length,1);
});
