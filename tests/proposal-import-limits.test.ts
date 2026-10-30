import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectImport,mergeImport,makePackage,parsePackage} from '../src/proposals';
import {fixture,proposal} from './fixtures';

const unique=(n:number)=>({...proposal(),id:`limit-${n}`});

test('merge rejects an oversized combined collection without changing either input',()=>{
 const existing=Array.from({length:1000},(_,i)=>unique(i));
 const incoming=[unique(1000)];
 assert.equal(parsePackage(JSON.stringify(makePackage(existing))).proposals.length,1000);
 const before=JSON.stringify(existing);
 assert.throws(()=>mergeImport(incoming,existing),/1000/);
 assert.equal(JSON.stringify(existing),before);
 assert.equal(incoming.length,1);
 assert.equal(mergeImport([existing[0]],existing).length,1000);
});

test('merge checks combined byte limits and validates new content before returning',()=>{
 const batch=(offset:number)=>Array.from({length:41},(_,i)=>({...unique(i+offset),rationale:'x'.repeat(100000)}));
 const existing=batch(0),incoming=batch(100);
 parsePackage(JSON.stringify(makePackage(existing)));
 parsePackage(JSON.stringify(makePackage(incoming)));
 assert.throws(()=>mergeImport(incoming,existing),/8 MB/);
 const invalid=unique(200);invalid.record.sources[0].url='javascript:alert(1)';
 assert.throws(()=>mergeImport([invalid],[]));
});

test('indexed inspection retains duplicate, ID conflict, correction and culture precedence',()=>{
 const a=proposal();a.id='bulk-original';
 const timestampCopy={...structuredClone(a),createdAt:'2026-10-30T00:00:00Z',updatedAt:'2026-10-30T00:00:00Z'};
 assert.equal(inspectImport([timestampCopy],[a],[])[0].status,'duplicate');
 assert.deepEqual(mergeImport([timestampCopy],[a]),[a]);
 const ordinary={...a,id:'ordinary'};
 assert.equal(inspectImport([{...ordinary,updatedAt:timestampCopy.updatedAt}],[ordinary],[fixture()])[0].status,'conflict');
 assert.equal(inspectImport([a,a],[],[fixture()])[1].status,'duplicate');
 const changed={...structuredClone(a),rationale:'Different',baseRevision:9};
 assert.match(inspectImport([changed],[a],[])[0].reason,/Same proposal ID/);
 const culture=structuredClone(fixture());culture.culture.color='#123456';
 const newRow={...unique(10),kind:'new' as const,targetId:null,baseRevision:null,baseRecord:null,record:{...fixture(),id:'fresh'}};
 assert.match(inspectImport([newRow],[],[culture])[0].reason,/Culture metadata/);
});

test('inspection canonicalizes full proposal content only linearly',()=>{
 let reads=0;
 const rows=Array.from({length:100},(_,i)=>{
  const p=unique(i);
  Object.defineProperty(p,'rationale',{enumerable:true,get(){reads++;return 'Instrumented proposal rationale';}});
  return p;
 });
 const report=inspectImport(rows,rows,[fixture()]);
 assert.ok(report.every(r=>r.status==='duplicate'));
 assert.ok(reads<=rows.length*4,`Read proposal content ${reads} times for ${rows.length} rows`);
});
