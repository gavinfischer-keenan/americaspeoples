import { test } from "node:test";
import assert from "node:assert/strict";
import { timelinePosition, timelineYear, smartYearsPerSecond } from "../src/timeline";
import { advancePlayback, END_YEAR } from "../src/time";
import { fixture } from "./fixtures";
const start = -130000, end = END_YEAR;
test("log and linear positions are monotone and reversible including BCE/CE", () => {
  for (const scale of ["log", "linear"] as const) {
    let previous = -1;
    for (const y of [start, -100000, -25000, -10000, -1000, -1, 0, 1, 1000, end]) {
      const p = timelinePosition(y, start, end, scale);
      assert.ok(p > previous); previous = p;
      assert.equal(timelineYear(p, start, end, scale), y);
    }
    assert.equal(timelinePosition(start, start, end, scale), 0);
    assert.equal(timelinePosition(end, start, end, scale), 1);
    assert.equal(timelineYear(-1, start, end, scale), start);
    assert.equal(timelineYear(2, start, end, scale), end);
  }
});
test("log slider gives recent millennia more room and remains reversible in local windows", () => {
  assert.ok(timelinePosition(-25000, start, end, "log") < timelinePosition(-25000, start, end, "linear"));
  assert.ok(1 - timelinePosition(0, start, end, "log") > .2);
  for (const [lo, hi] of [[-10,10],[-1000,1000],[1900,1934],[100,100]]) {
    for (let y=lo;y<=hi;y++) assert.equal(timelineYear(timelinePosition(y,lo,hi,"log"),lo,hi,"log"),y);
  }
});
test("smart playback accelerates sparse spans and slows around dense evidence", () => {
  const records = Array.from({length:40},(_,i)=>({...fixture(), id:'dense-'+i,time:{...fixture().time,start:900+i,end:1100+i}}));
  assert.ok(smartYearsPerSecond(records,-50000)>5000);
  assert.ok(smartYearsPerSecond(records,1000)<250);
  assert.ok(smartYearsPerSecond(records,300) < smartYearsPerSecond(records,-50000), 'approaching evidence slows smoothly');
  assert.ok(smartYearsPerSecond(records,1000)>=25);
});
test("unplaced records and certainty labels do not change smart pace", () => {
  const r={...fixture(),time:{...fixture().time,start:-50000,end:-20000}};
  const a=smartYearsPerSecond([r],-30000);
  assert.ok(a>1000,'one broad interval does not make a sparse era crawl');
  assert.equal(smartYearsPerSecond([{...r,claims:r.claims.map(c=>({...c,status:'disputed' as const}))}],-30000),a);
  assert.equal(smartYearsPerSecond([{...r,time:{...r.time,kind:'unplaced',start:null,end:null}}],1000),smartYearsPerSecond([],1000));
});
test("accelerated playback still stops at a one-year occurrence", () => {
  const r={...fixture(),time:{...fixture().time,kind:'occurrence' as const,start:-25000,end:-25000}};
  assert.deepEqual(advancePlayback([r],-26000,smartYearsPerSecond([r],-26000)),{year:-25000,boundary:true});
});
