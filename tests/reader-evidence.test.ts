import test from 'node:test';
import assert from 'node:assert/strict';
import {dataset} from '../src/published-data';
import {readerLocation,readerSummary,readerDateMeaning,readerDetailHTML} from '../src/reader-evidence';

test('map evidence leads with a named place and the find, not editorial bookkeeping',()=>{
 const original=dataset.records.find(r=>r.id==='northeast-kruger2-context')!;
 const r={...original,review:{...original.review,summary:'Separate named archaeological context preserved from the source audit; geographical display is approximate and dates are limited to their supported context.'}};
 assert.match(readerLocation(r),/Brompton|Sherbrooke/);
 assert.doesNotMatch(readerLocation(r),/anchor|rounded|excavation coordinate/i);
 assert.doesNotMatch(readerSummary(r),/preserved from the source audit/);
 assert.match(readerSummary(r),/point|stone|spear|dart/i);
 assert.match(readerDateMeaning(r),/not.*direct|not.*measured/i);
 const html=readerDetailHTML(r);
 const lead=html.split('<details')[0];
 assert.match(lead,/What this shows/);assert.match(lead,/Where/);
 assert.doesNotMatch(lead,/Typological coexistence|Dedicated radiocarbon|source audit|Modelled|Modeled/);
 assert.match(html,/<summary>Evidence and uncertainty<\/summary>/);
});

test('approximate route endpoints remain named without suggesting precise tracks',()=>{
 const original=dataset.records.find(r=>r.location&&r.destination)!;
 const r={...original,location:{...original.location!,name:'Brompton / Eastern Townships — schematic regional anchor'},destination:{...original.destination!,name:'Northern Rio Grande — regional anchor'}};
 assert.match(readerLocation(r),/Brompton.*Northern Rio Grande/);
 assert.doesNotMatch(readerLocation(r),/anchor|coordinate/i);
});

test('a fallback summary cannot promote a disputed interpretation to a fact',()=>{
 const r={...dataset.records[0],review:{...dataset.records[0].review,summary:'Narrow source-checked finding; see the supported claim and dating qualification.'},claims:[{id:'interpretation',text:'A possible crossing is proposed.',status:'under discussion' as const,explanation:'Uncertain',support:[]}]};
 assert.match(readerSummary(r),/interpretation|propose|uncertain/i);
 assert.match(readerSummary(r),/possible crossing/);
});
