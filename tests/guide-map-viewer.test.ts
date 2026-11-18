import test from 'node:test';
import assert from 'node:assert/strict';
import * as overview from '../src/site-overview-map';
import {siteGuides} from '../src/site-guides';
import {dataset} from '../src/published-data';

test('a complete-area companion retains outlying local places beyond the close view',()=>{
 const create=(overview as any).createSiteAreaOverview;
 assert.equal(typeof create,'function');
 const g=siteGuides.find(g=>g.id==='machu-picchu')!;
 const area=create(g,dataset.records,siteGuides);
 assert.equal(area.omittedPoints,0);
 const local=overview.createSiteOverview(g,dataset.records,siteGuides)!;
 assert.ok(area.points.length>=local.points.length);
 assert.equal(area.id,'machu-picchu-area');
});

test('every terrain map has keyboard zoom, whole-area reset and a full-screen control',()=>{
 const g=siteGuides.find(g=>g.id==='chaco')!;
 const html=overview.siteOverviewHTML(overview.createSiteOverview(g,dataset.records,siteGuides)!);
 assert.match(html,/data-map-viewer/);
 assert.match(html,/aria-label="Zoom into map"/);
 assert.match(html,/data-map-action="reset"/);
 assert.match(html,/data-map-action="fullscreen"/);
 assert.match(html,/class="guide-map-viewport"[^>]*tabindex="0"/);
});

test('Machu Picchu includes the whole sanctuary and heartland before the citadel detail',()=>{
 const g=siteGuides.find(g=>g.id==='machu-picchu')!;
 const maps=overview.createGuideMaps(g,dataset.records,siteGuides);
 assert.deepEqual(maps.map(m=>m.id),['machu-picchu-heartland','machu-picchu-sanctuary','machu-picchu']);
 const [w,s,e,n]=maps[0].bounds;
 for(const [lon,lat] of [[-71.97,-13.52],[-72.55,-13.16],[-72.28,-13.26]])assert.ok(lon>=w&&lon<=e&&lat>=s&&lat<=n);
 assert.match(maps[1].scopeNote!,/whole sanctuary/);
 assert.ok(maps[0].points.length<=6,'the landscape overview labels major places, with architectural detail in the local map');
 assert.ok(maps[2].points.some(p=>p.name.includes('Temple')),'individual buildings remain in the close view');
});

test('the Fiji–Tonga–Samoa area includes localities on both sides of the dateline',()=>{
 const guide=siteGuides.find(g=>g.id==='fiji-tonga-samoa')!;
 const map=overview.createGuideMaps(guide,dataset.records,siteGuides)[0];
 assert.ok(map.bounds[2]>180);
 assert.ok(map.points.some(p=>p.lon>170));
 assert.ok(map.points.some(p=>p.lon< -170));
 for(const record of dataset.records.filter(r=>guide.recordIds.includes(r.id))){
  assert.ok(map.points.some(p=>p.recordIds.includes(record.id)),record.id+' appears on the whole-region map');
 }
});
