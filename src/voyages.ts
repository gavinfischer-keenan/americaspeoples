import { geoInterpolate } from 'd3-geo';
export type TravelMode='sea'|'river'|'land';
export interface VoyageStop {name:string;coordinates:[number,number];arrival:string;departure:string;mode:TravelMode;note:string;recordId?:string}
export interface Voyage {id:string;name:string;summary:string;stops:VoyageStop[];sourceIds:string[];recordIds:string[];precision:string}
export const arrivedVoyageRecords=(voyage:Voyage,date:number)=>new Set(voyage.stops.filter(s=>s.recordId&&dateValue(s.arrival)<=date).map(s=>s.recordId!));
/** Fractional CE year for dated itineraries; historical day precision is retained. */
export function dateValue(iso:string):number {
 const date=new Date(iso+'T00:00:00Z');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(iso)||!Number.isFinite(+date)||date.toISOString().slice(0,10)!==iso)return NaN;
 const year=date.getUTCFullYear(),start=yearStart(year),end=yearStart(year+1);
 return year+(+date-start)/(end-start);
}
export function voyageDate(value:number):string {
 const y=Math.floor(value);return new Date(Math.round(yearStart(y)+(value-y)*(yearStart(y+1)-yearStart(y)))).toISOString().slice(0,10);
}
function yearStart(year:number):number{const d=new Date(0);d.setUTCFullYear(year,0,1);d.setUTCHours(0,0,0,0);return +d;}
export function validateItinerary(stops:readonly VoyageStop[]):string[]{
 const errors:string[]=[];
 if(!Array.isArray(stops)||stops.length<2||stops.length>500)return ['An itinerary needs 2–500 dated stops.'];
 let previous=-Infinity;
 for(const stop of stops){
  if(!stop||!Array.isArray(stop.coordinates)||stop.coordinates.length!==2||!stop.coordinates.every(Number.isFinite)||Math.abs(stop.coordinates[0])>180||Math.abs(stop.coordinates[1])>90||typeof stop.name!=='string'||!stop.name.trim()||typeof stop.note!=='string'||!stop.note.trim()||!['sea','river','land'].includes(stop.mode)){errors.push('Invalid voyage stop.');continue;}
  const arrival=dateValue(stop.arrival),departure=dateValue(stop.departure);
  if(!Number.isFinite(arrival)||!Number.isFinite(departure)||arrival<1||departure>=1935||arrival>departure||arrival<previous)errors.push('Invalid or unordered itinerary dates.');
  previous=departure;
 }
 return errors;
}
export function sampleVoyage(stops:readonly VoyageStop[],date:number):{coordinates:[number,number];status:'stopped'|'traveling';stopName:string;mode:TravelMode;leg:number}|null{
 if(!stops.length||date<dateValue(stops[0].arrival)||date>dateValue(stops.at(-1)!.departure))return null;
 for(let i=0;i<stops.length;i++){
  const stop=stops[i],arrival=dateValue(stop.arrival),departure=dateValue(stop.departure);
  if(date>=arrival&&date<=departure)return {coordinates:stop.coordinates,status:'stopped',stopName:stop.name,mode:stop.mode,leg:i};
  const next=stops[i+1];if(!next)break;
  const nextArrival=dateValue(next.arrival);
  if(date>departure&&date<nextArrival){
   const t=(date-departure)/(nextArrival-departure);
   return {coordinates:geoInterpolate(stop.coordinates,next.coordinates)(t) as [number,number],status:'traveling',stopName:`${stop.name} → ${next.name}`,mode:stop.mode,leg:i};
  }
 }
 return null;
}
