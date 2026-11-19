import test from "node:test";
import assert from "node:assert/strict";
import { tooltipForRecords, tooltipForPlaces, tooltipPosition } from "../src/map-tooltip";
import { fixture } from "./fixtures";

test('group previews name distinct places and their activity, with older evidence dated honestly',()=>{
 const camp=fixture();camp.title='Fishing Bridge camps';camp.review.summary='Hearths and campfires beside Yellowstone Lake.';camp.location!.name='Fishing Bridge';
 const quarry=fixture();quarry.id='quarry';quarry.title='Obsidian quarry';quarry.location={...quarry.location!,lon:-101,name:'Obsidian Cliff'};quarry.review.summary='People quarried volcanic glass for stone tools.';
 const phase={...camp,id:'earlier-camp',time:{...camp.time,start:-500,end:-400}};
 const tip=tooltipForPlaces([phase,camp,quarry],'movie',250,'Fishing Bridge')!;
 assert.equal(tip.title,'Around Fishing Bridge');
 assert.equal(tip.items?.length,2,'different phases must not crowd out a second place');
 assert.match(tip.items![0].summary,/Hearths/);
 assert.match(tip.items![1].title,/Obsidian/);
 assert.match(tip.items![0].dates,/Earlier.*100.*200/);
 assert.doesNotMatch(JSON.stringify(tip),/\d+ records|evidence window|document quality/);
 assert.match(tooltipForPlaces([camp,quarry],'movie',150)!.items![0].dates,/100 CE/);
 assert.doesNotMatch(tooltipForPlaces([camp,quarry],'movie',150)!.items![0].dates,/Earlier/);
});

test("map hover uses catalog review summaries and distinguishes all-time dates from current-year evidence", () => {
  const row = fixture();
  row.title = "<literal>";
  row.review.summary = "Catalog summary retained.";
  const explore = tooltipForRecords([row], "explore", 1900)!;
  assert.equal(explore.title, "<literal>");
  assert.match(explore.summary, /Catalog summary retained/);
  assert.match(explore.dates, /100 CE/);
  assert.match(explore.dates, /all.time/i);
  const unknown = fixture();
  unknown.time = { ...unknown.time, kind: "unplaced", start: null, end: null };
  assert.match(
    tooltipForRecords([unknown], "explore", 1900)!.dates,
    /unresolved/i,
  );
  assert.equal(tooltipForRecords([], "movie", 150), null);
});

test("tooltip clamps to small viewports even beside the bottom-right corner", () => {
  assert.deepEqual(
    tooltipPosition(
      { x: 315, y: 555 },
      { width: 300, height: 200 },
      { width: 320, height: 560 },
    ),
    { left: 8, top: 347 },
  );
  const pos = tooltipPosition(
    { x: -20, y: -20 },
    { width: 100, height: 80 },
    { width: 320, height: 560 },
  );
  assert.ok(pos.left >= 8 && pos.top >= 8);
});

test('hover preview leaves the inspected island or feature clear',()=>{
 const feature={left:700,top:320,right:830,bottom:440};
 const size={width:340,height:190};
 const p=tooltipPosition({x:790,y:380},size,{width:1440,height:960},feature);
 const overlaps=p.left<feature.right&&p.left+size.width>feature.left&&p.top<feature.bottom&&p.top+size.height>feature.top;
 assert.equal(overlaps,false,'the popup cannot cover its target');
});
