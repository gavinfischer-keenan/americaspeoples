import type {MapRecord} from './model';

/** A contextual period places evidence in history without dating the feature itself. */
export function contextDateMeaning(record:MapRecord):string|null{
 const text=[record.time.original,record.time.method,record.time.interpretation].join(' ');
 if(/associated life-period|life.period.*attribution/i.test(text))return 'These years describe the period when the attributed artist lived here. The painting itself has not been dated.';
 if(/individual structure undated|individual feature interpreted within that broad horizon|broad.*(?:urban context|urban-period context)/i.test(text))return 'Placed within the site’s broader period. This building or feature has no separate date in the cited evidence.';
 if(/editorial period|period guide|regional period|period framework|typological envelope/i.test(text))return 'A broad estimate used to place the evidence on the timeline, not a direct date for the find or event.';
 return null;
}
