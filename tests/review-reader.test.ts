import test from 'node:test';
import assert from 'node:assert/strict';
import {dataset} from '../src/published-data';
import {reviewHTML} from '../src/review';

test('full evidence pages lead with history and keep technical repetition in expandable detail',()=>{
 const r=dataset.records.find(r=>r.id==='d18-language-mani-1562')!;
 const html=reviewHTML(r,dataset),lead=html.split('<details class="review-technical"')[0];
 assert.match(lead,/What this shows/);assert.match(lead,/Maní/);
 assert.doesNotMatch(lead,/Temporal fading|Time model|Model components|Record provenance|on the timeline<\/h3>/);
 assert.ok(html.includes('id="claim-'+r.claims[0].id+'"'));
 assert.ok(html.includes('id="source-'+r.sources[0].id+'"'));
 assert.match(html,/<summary>Evidence, sources and dating details<\/summary>/);
 assert.equal(lead.split(r.review.summary).length-1,1,'the same historical summary appears once');
 assert.equal(lead.split(r.review.discussion).length-1,1,'the archaeological context appears once, not repeated as an additional fact');
});

test('unverified author-supplied material stays clearly identified before technical details',()=>{
 const r={...dataset.records[0],review:{...dataset.records[0].review,discussion:'AI generated facts — not independently source-verified, displayed by explicit author choice.'}};
 const lead=reviewHTML(r,dataset).split('<details class="review-technical"')[0];
 assert.match(lead,/Unverified author-supplied record/);
});
