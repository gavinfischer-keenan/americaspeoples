import test from 'node:test';
import assert from 'node:assert/strict';
import { exploreRecords, exploreCategory } from '../src/explore';
import type { DisplayRecord } from '../src/model';
const row=(id:string,title:string,extra:Partial<DisplayRecord>={}):DisplayRecord=>({id,title,culture:{id:'x',name:'People',kind:'people',color:'#fff'},location:{name:'Moʻorea',lon:-149.8,lat:-17.5},time:{start:1000,end:1200,kind:'interval'},review:{summary:'Settlement evidence'},...extra} as DisplayRecord);
test('search reaches offscreen places and treats accents/punctuation consistently',()=>{
 const r=row('a','Moʻorea coastal occupation');
 assert.deepEqual(exploreRecords([r],[],{query:'moorea',category:'all'}),[r]);
 assert.deepEqual(exploreRecords([r],[],{query:'missing',category:'all'}),[]);
});
test('without search only viewport records appear, ordered by source date',()=>{
 const a=row('a','Later'),b=row('b','Earlier',{time:{start:900,end:950,kind:'interval'} as any});
 assert.deepEqual(exploreRecords([a,b],[a,b],{query:'',category:'all'}),[b,a]);
 assert.deepEqual(exploreRecords([a,b],[a],{query:'',category:'all'}),[a]);
});
test('conflict is explicit metadata and includes violence/removal without guessing from titles',()=>{
 const a=row('a','No evidence of conflict'),b=row('b','Documented violence',{overlay:{kind:'violence'} as any});
 assert.equal(exploreCategory(a),'places'); assert.equal(exploreCategory(b),'conflict');
 assert.deepEqual(exploreRecords([a,b],[a,b],{query:'',category:'conflict'}),[b]);
});
