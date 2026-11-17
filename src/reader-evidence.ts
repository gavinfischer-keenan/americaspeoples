import type {MapRecord, Place} from './model';
import {esc} from './dom';
import {timeLabel} from './time';
import {contextDateMeaning} from './date-context';

/** Older imports contain audit notes in the summary field. Never make those
 * the visitor's only explanation of an archaeological find or historical event. */
const auditSummary=/^(?:This review (?:separates|distinguishes)|Separate named archaeological context|Narrow source-checked finding|Research intake reviewed|This record (?:preserves a study-specific result|retains a source-specific result)|Source-specific (?:observations are retained|finding with chronology)|Independent intake review|This language record preserves)/i;
export function readerSummary(r:MapRecord):string{
 if(r.review.summary.trim()&&!auditSummary.test(r.review.summary))return r.review.summary;
 const meaningful=r.claims.filter(c=>!/(?:geograph|chronology-context|date-context|location|coordinate)/i.test(c.id));
 const claim=meaningful.find(c=>c.status==='well-supported')??meaningful[0];
 if(!claim)return 'The description of this finding still needs to be added. Open the sources for the available evidence.';
 return (claim.status==='disputed'?'Disputed interpretation: ':claim.status==='under discussion'?'Proposed interpretation: ':'')+claim.text;
}

const processContext=/^(?:Local evidence is distinguished|A dated establishment|The record keeps|A source window|This dated observation|Source-specific findings|Selected evidence|The point locates|Known physical location|This is a dated observation|Different evidence types|Political claims|This mapped observation|Material traditions|Population (?:size is unknown|unknown)|A built colonial|Structures, artifacts|The date belongs|Artifact types, sample dates|Named architectural evidence)/i;
export function readerContext(r:MapRecord):string{
 if(!('discussion' in r.review))return '';
 const text=r.review.discussion??'';
 return text&&!processContext.test(text)&&text!==r.review.summary?text:'';
}
export function readerFacts(r:MapRecord):{id:string;text:string}[]{
 const summary=readerSummary(r);
 const context=readerContext(r);
 return r.claims.filter(c=>c.status==='well-supported'&&!/(?:geograph|chronology-context|date-context|location|coordinate)/i.test(c.id)&&c.text!==summary&&!summary.includes(c.text)&&!c.text.includes(summary)&&!context.includes(c.text)).slice(0,3).map(c=>({id:c.id,text:c.text}));
}

function placeName(p:Place):string{
 // Remove known editorial suffixes, never infer a nearby town from coordinates.
 return p.name.replace(/\s*[—–]\s*(?:schematic\s+)?(?:regional|display|public|approximate|generalized|coarse)[^—–]*(?:anchor|reference|point|cent(?:er|re))[^—–]*$/i,'').replace(/\s*\((?:schematic |approximate |regional |public |coarse )*(?:anchor|display point|reference point)\)$/i,'').trim();
}
export function readerLocation(r:MapRecord):string{
 if(r.location&&r.destination)return `From ${placeName(r.location)} to ${placeName(r.destination)}`;
 if(r.location){
  const regional=/regional|generalized|coarse|rounded regional/i.test(r.location.precision+' '+r.location.name);
  const name=placeName(r.location);
  return regional&&!/^near\b/i.test(name)?'Near '+name:name;
 }
 return r.overlay?.geometry?'The area or route shown on the map; a more specific place is not recorded.':'The place has not yet been located on this map.';
}
export function readerDateMeaning(r:MapRecord):string{
 if(r.time.kind==='unplaced')return 'The date has not been established.';
 const context=contextDateMeaning(r);if(context)return context;
 if(r.time.kind==='occurrence'&&r.time.start!==r.time.end)return 'The event or find is dated to somewhere within this range.';
 return r.time.approximate?'The date is approximate.':'The source dates this evidence to the time shown.';
}

/** The main panel answers what, where and when; specialist qualifications remain
 * one click away, alongside the original dating description and geographic limits. */
export function readerDetailHTML(r:MapRecord):string{
 return `<section class="reader-evidence"><h5>What this shows</h5><p class="reader-finding">${esc(readerSummary(r))}</p><dl class="record-precision"><dt>Where</dt><dd>${esc(readerLocation(r))}</dd><dt>When</dt><dd>${esc(timeLabel(r.time))}<span class="reader-date-meaning">${esc(readerDateMeaning(r))}</span></dd></dl><details class="reader-methods"><summary>Evidence and uncertainty</summary><p><strong>What is uncertain:</strong> ${esc(r.review.limitations)}</p><p><strong>Dating evidence:</strong> ${esc(r.time.original)} ${esc(r.time.method)}</p><p>${esc(r.time.interpretation)}</p><p><strong>Map accuracy:</strong> ${esc(r.location?.precision??r.overlay?.precision??'A location has not been established.')}</p>${r.destination?`<p><strong>Destination accuracy:</strong> ${esc(r.destination.precision)}</p>`:''}</details></section>`;
}
