import test from 'node:test';
import assert from 'node:assert/strict';
import {validateWritingExamples,writingCollectionHTML} from '../scripts/writing-collection';
const url='https://example.org/tablet';
const entry={id:'letter-one',title:'A delivery',language:'Latin',script:'Latin',date:'2nd century CE',place:'Britain',coordinates:null,genre:'Letter',objectId:'Example 1',atlasIds:['europe'],original:{kind:'text',text:'mitte',sourceUrl:url,license:'Public domain ancient text',licenseUrl:'https://creativecommons.org/publicdomain/mark/1.0/',creator:'Ancient writer; published scholarly transcription',note:'Transcription; abbreviated text.'},translation:{text:'send',translator:'Example editor',sourceUrl:url,kind:'excerpt',rightsNote:'Short quotation'},context:'A requested delivery.',sources:[{title:'Edition',url}]};
test('a writing example must pair a credited original with a sourced translation',()=>{
 assert.equal(validateWritingExamples([entry]).length,1);
 for(const mutate of [(e:any)=>e.original.text='',(e:any)=>e.translation.translator='',(e:any)=>e.translation.sourceUrl='https://unlisted.test/',(e:any)=>e.original.license='',(e:any)=>e.original.sourceUrl='javascript:alert(1)']){const e=structuredClone(entry);mutate(e);assert.throws(()=>validateWritingExamples([e]));}
 assert.throws(()=>validateWritingExamples([entry,entry]));
 for(const licenseUrl of ['http://example.org/license','javascript:alert(1)'])assert.throws(()=>validateWritingExamples([{...entry,translation:{...entry.translation,licenseUrl}}]));
});
test('unlocated texts remain unlocated and excerpts cannot masquerade as whole translations',()=>{
 const [e]=validateWritingExamples([entry]);assert.equal(e.coordinates,null);
 const html=writingCollectionHTML([e]);assert.match(html,/English translation · excerpt/);assert.match(html,/Original-language text/);assert.match(html,/Example editor/);assert.match(html,/data-writing-region="europe"/);
 assert.match(html,/class="original-text" lang="la"/);
 e.original.text='<script>alert(1)</script>';assert.doesNotMatch(writingCollectionHTML([e]),/<script>alert/);
});
test('image witnesses need self-hosted verified asset metadata',()=>{
 const e:any=structuredClone(entry);e.original={...e.original,kind:'image',imageUrl:'https://example.org/original.jpg'};delete e.original.text;
 assert.throws(()=>validateWritingExamples([e]));
 e.original.file='letter-one.jpg';e.original.sha256='a'.repeat(64);e.original.width=2000;e.original.height=1000;
 assert.equal(validateWritingExamples([e]).length,1);
 const html=writingCollectionHTML([e]);assert.match(html,/writing-media\/letter-one.jpg/);assert.doesNotMatch(html,/src="https:/);
});
