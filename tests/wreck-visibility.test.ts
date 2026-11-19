import test from 'node:test';
import assert from 'node:assert/strict';
import {historyOpacity,historyState} from '../src/history';
import {fixture} from './fixtures';
test('wreck losses brighten at their date then fade continuously into persistent history',()=>{
 const r={...fixture(),type:'event' as const,time:{...fixture().time,kind:'occurrence' as const,start:1715,end:1715},history:{kind:'wreck' as const,claimId:'occupation'}};
 assert.equal(historyState(r,1714),'outside');assert.equal(historyOpacity(r,1715),1);
 assert.ok(historyOpacity(r,1720)!<historyOpacity(r,1716)!);
 assert.ok(historyOpacity(r,1800)!<.3);assert.ok(historyOpacity(r,1934)!>=.2);
 assert.ok(historyOpacity(r,1716)!>.9,'avoid a single-year step from bright to dim');
 assert.equal(r.time.end,1715,'display fading must not alter the historical date');
});
