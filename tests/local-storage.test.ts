import {test} from 'node:test';
import assert from 'node:assert/strict';
import {encodeLocalCollection,decodeLocalCollection} from '../src/local-storage';
import {MAX_PACKAGE_BYTES} from '../src/proposals';

test('local collections retain Unicode and legacy JSON while compressing large snapshots',()=>{
 const text=JSON.stringify({proposals:Array.from({length:700},()=>({text:'Indigenous history · Hawaiʻi · São Vicente '.repeat(150)}))});
 const stored=encodeLocalCollection(text);
 assert.ok(stored.length<text.length/5);
 assert.equal(decodeLocalCollection(stored),text);
 assert.equal(decodeLocalCollection('{"legacy":true}'),'{"legacy":true}');
});
test('local collection decoding remains bounded and malformed data fails safely',()=>{
 assert.throws(()=>encodeLocalCollection('x'.repeat(MAX_PACKAGE_BYTES+1)));
 assert.throws(()=>decodeLocalCollection('ap-gzip-v1:not base64!'));
 const bomb='ap-gzip-v1:'+Buffer.from((requireGzip())('x'.repeat(MAX_PACKAGE_BYTES+1))).toString('base64');
 assert.throws(()=>decodeLocalCollection(bomb));
});
import {gzipSync,strToU8} from 'fflate';
function requireGzip(){return (s:string)=>gzipSync(strToU8(s));}
