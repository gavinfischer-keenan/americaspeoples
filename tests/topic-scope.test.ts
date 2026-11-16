import test from 'node:test';
import assert from 'node:assert/strict';
import evidence from '../data/evidence.json';
import {validateRecord} from '../src/validation';
import type {EvidenceRecord} from '../src/model';

test('later Hawaii evidence is allowed only for reviewed IDs and only through 1959',()=>{
 const r=structuredClone(evidence.records[0]) as EvidenceRecord;
 r.id='topic-hawaii-admission-1959';r.type='occurrence';delete r.history;delete r.population;
 r.time={kind:'occurrence',start:1959,end:1959,approximate:false,original:'1959',method:'Documented date',interpretation:'Topic-specific event'};
 assert.deepEqual(validateRecord(r),[]);
 assert.ok(validateRecord({...r,id:'arbitrary-later-event'}).some(e=>/Dates/.test(e)));
 assert.ok(validateRecord({...r,time:{...r.time,start:1960,end:1960}}).some(e=>/Dates/.test(e)));
});
