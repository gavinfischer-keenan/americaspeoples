import test from 'node:test';
import assert from 'node:assert/strict';
import {validateWorldGuides, worldMapLayout} from '../src/world-guide-model';
import {worldGuideHTML} from '../scripts/world-guide-build';
import {readWorldGuides} from '../scripts/world-guide-data';
import {validateAtlasVoyageLinks,worldVoyagesHTML} from '../scripts/world-voyage-links';
import {readFileSync} from 'node:fs';

const source='https://example.org/research';
const guide={id:'world-example',atlasIds:['africa'],category:'places',title:'Example',description:'A guide',intro:'An introduction',scope:'Guide only',map:{bounds:[30,10,32,12],scope:'Modern terrain',points:[{id:'find',label:'A find',coordinates:[31,11],date:'3.2 million years ago',description:'Approximate locality',sources:[source]}]},sections:[{heading:'Evidence',paragraphs:[{text:'A finding',sources:[source]}]}],sources:[{url:source,title:'Research'}]};

test('guide-only ages and maps do not need Americas timeline records',()=>{
 const [g]=validateWorldGuides([guide]);
 const map=worldMapLayout(g);
 assert.ok(map.height>=600&&map.height<=1200);
 assert.ok(map.project([31,11]).every(Number.isFinite));
 assert.equal(g.map.points[0].date,'3.2 million years ago');
});
test('guide validation rejects uncited claims, unsafe links, invalid geography and duplicate identities',()=>{
 for(const mutate of [
  (g:any)=>g.map.points[0].coordinates=[50,11],
  (g:any)=>g.map.points[0].sources=[],
  (g:any)=>g.sections[0].paragraphs[0].sources=['javascript:alert(1)'],
  (g:any)=>g.sections[0].paragraphs[0].sources=['https://unregistered.test/'],
  (g:any)=>g.atlasIds=['unknown'],
  (g:any)=>g.map.bounds=[30,12,32,10],
  (g:any)=>g.id='../escape',
 ]){const g=structuredClone(guide);mutate(g);assert.throws(()=>validateWorldGuides([g]));}
 assert.throws(()=>validateWorldGuides([guide,guide]));
});
test('static guides expose dated findings and citations, with one tooltip mechanism',()=>{
 const [g]=validateWorldGuides([guide]);
 const html=worldGuideHTML(g, [g], {type:'FeatureCollection',features:[]});
 assert.match(html,/3.2 million years ago/);
 assert.match(html,/href="#find-find"/);
 assert.match(html,/data-map-viewer/);
 assert.match(html,/Modern terrain/);
 assert.doesNotMatch(html,/<title>| title=|data-record|#story\//);
 const copy=structuredClone(g);copy.title='<img onerror=alert(1)>';
 assert.match(worldGuideHTML(copy,[copy],{type:'FeatureCollection',features:[]}),/&lt;img/);
});

test('Pacific guide maps cross the date line without moving find coordinates',()=>{
 const g=structuredClone(guide);g.map.bounds=[58,-49,245,72];g.map.points[0].coordinates=[-149.4,-17.6];
 const [valid]=validateWorldGuides([g]);const m=worldMapLayout(valid);const [x,y]=m.project([-149.4,-17.6]);
 assert.ok(x>0&&x<1200&&y>0&&y<m.height);
});
test('all published guide connections resolve and early activity comprises ten selected localities',async()=>{
 const guides=await readWorldGuides();
 for(const id of ['world-lucy','world-human-family','world-lascaux','world-terracotta-army','world-angkor-wat','world-taj-mahal','world-congo-river','world-roman-empire','world-hadrians-wall','world-stonehenge'])assert.ok(guides.some(g=>g.id===id),id);
 const early=guides.find(g=>g.id==='world-earliest-activity')!;
 assert.equal(early.relatedGuideIds?.filter(id=>!['world-human-family','world-lucy'].includes(id)).length,10);
 for(const g of guides){const m=worldMapLayout(g);assert.ok(m.height>=599&&m.height<=1201,g.id);}
});
test('regional voyage connections retain canonical dates and reject reordered or stale anchors',()=>{
 const catalog=JSON.parse(readFileSync('data/voyages.json','utf8'));
 const {links}=JSON.parse(readFileSync('data/atlas-voyage-links.json','utf8'));
 validateAtlasVoyageLinks(links,catalog.voyages);
 const changed=structuredClone(links);changed[0].stops[0].arrival='1900-01-01';
 assert.throws(()=>validateAtlasVoyageLinks(changed,catalog.voyages),/Stale/);
 const ids=links.filter((l:{atlasId:string})=>l.atlasId==='europe').map((l:{voyageId:string})=>l.voyageId);
 const html=worldVoyagesHTML('europe',links,catalog.voyages,catalog.sources,ids);
 assert.match(html,/#voyage\/magellan-elcano-1519-1522/);
 assert.match(html,/Sanlúcar/);assert.match(html,/1519-09-20/);
});
test('a language guide has a valid place in the regional directory',()=>{
 assert.equal(validateWorldGuides([{...guide,category:'languages'}])[0].category,'languages');
});
test('unwrapped extents exclude points whose longitude is too far west',()=>{
 const g=structuredClone(guide);
 g.map.bounds=[270,0,300,30];g.map.points[0].coordinates=[-150,15];
 assert.throws(()=>validateWorldGuides([g]),/extent/);
 g.map.points[0].coordinates=[-75,15];
 const [valid]=validateWorldGuides([g]);
 assert.ok(Math.abs(worldMapLayout(valid).project([-75,15])[0]-600)<0.01);
});
test('number labels leave neighbouring mapped localities visible',()=>{
 const [g]=validateWorldGuides([guide]);
 g.map.points.push({...g.map.points[0],id:'nearby',coordinates:[31.011,11]});
 const html=worldGuideHTML(g,[g],{type:'FeatureCollection',features:[]});
 const centers=(radius:number)=>[...html.matchAll(new RegExp('<circle cx="([^"]+)" cy="([^"]+)" r="'+radius+'"','g'))].map(m=>[Number(m[1]),Number(m[2])]);
 const pins=centers(3),labels=centers(13);
 assert.equal(pins.length,2);assert.equal(labels.length,2);
 for(const [i,label] of labels.entries()){
  const otherPin=pins[1-i];
  assert.ok(Math.hypot(label[0]-otherPin[0],label[1]-otherPin[1])>=17,'Number marker obscures the other locality');
 }
});
test('voyage directory membership exactly matches reverse links, and anchors stay in order',()=>{
 const {links}=JSON.parse(readFileSync('data/atlas-voyage-links.json','utf8'));
 const catalog=JSON.parse(readFileSync('data/voyages.json','utf8'));
 const africa=links.filter((l:{atlasId:string})=>l.atlasId==='africa').map((l:{voyageId:string})=>l.voyageId);
 const bad=structuredClone(links);bad[0].stops.reverse();
 assert.throws(()=>validateAtlasVoyageLinks(bad,catalog.voyages),/stop/i);
 for(const ids of [africa.slice(1),[...africa,'invented'],[...africa,africa[0]]]){
  assert.throws(()=>worldVoyagesHTML('africa',links,catalog.voyages,catalog.sources,ids),/membership/i);
 }
});
