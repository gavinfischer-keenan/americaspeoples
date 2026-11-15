import test from 'node:test';
import assert from 'node:assert/strict';
import { boundariesAt, validateBoundaries } from '../src/boundaries';
const shape={type:'Polygon' as const,coordinates:[[[-82,29],[-80,29],[-80,31],[-82,29]]]};
const base={name:'Florida Territory',kind:'territory' as const,geometry:shape,labelPoint:[-81,30] as [number,number],sourceIds:['source'],precision:'Generalized source polygon',note:'Administrative extent; not exclusive occupation',citation:'An act dated 1822'};
test('dated outlines replace predecessors using the disclosed year-end snapshot',()=>{
 const rows=[{...base,id:'territory',start:'1822-03-30',end:'1845-03-02'},{...base,id:'state',name:'Florida',kind:'state' as const,start:'1845-03-03',end:'2000-12-31'}];
 assert.deepEqual(boundariesAt(rows,1844).map(b=>b.id),['territory']);
 assert.deepEqual(boundariesAt(rows,1845).map(b=>b.id),['state']);
 assert.deepEqual(boundariesAt(rows,1821),[]);
 assert.deepEqual(validateBoundaries(rows,new Set(['source'])),[]);
 assert.ok(validateBoundaries([{...rows[0],end:'1800-01-01'}],new Set(['source'])).length);
 assert.ok(validateBoundaries(rows,new Set()).length);
});
