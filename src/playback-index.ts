import type {EvidenceRecord} from './model';
import {END_YEAR} from './time';

// First index with value >= target (or > target when inclusive is true).
function bound(values:readonly number[],target:number,inclusive=false):number{
 let lo=0,hi=values.length;
 while(lo<hi){const mid=lo+Math.floor((hi-lo)/2);if(values[mid]<target||(inclusive&&values[mid]===target))lo=mid+1;else hi=mid;}
 return lo;
}

class WeightedDates{
 readonly dates:number[];
 readonly sums:number[]=[0];
 constructor(events:[number,number][]){
  events.sort((a,b)=>a[0]-b[0]);
  this.dates=events.map(([date])=>date);
  // Compensated accumulation limits cancellation when subtracting interval totals.
  let sum=0,correction=0;
  for(const [,weight] of events){const value=weight-correction,next=sum+value;correction=(next-sum)-value;sum=next;this.sums.push(sum);}
 }
}

/** Immutable pacing snapshot. Rebuild when enabled records/filters change.
 * Dates retain their original meaning; this indexes only existing UI pacing.
 * Construction O(n log n), rate and advance queries O(log n), storage O(n).
 */
export class PlaybackIndex{
 private readonly starts:WeightedDates;
 private readonly ends:WeightedDates;
 private readonly nearby:number[];
 private readonly nearbySums:number[]=[0];
 private readonly stops:number[];

 constructor(records:readonly Pick<EvidenceRecord,'time'>[]){
  const starts:[number,number][]=[],ends:[number,number][]=[],nearby:number[]=[],stops:number[]=[];
  for(const {time:t} of records){
   if(t.kind==='unplaced')continue;
   // advancePlayback examines any non-null endpoint, independently of smart pacing.
   if(t.start!==null)stops.push(t.start);
   if(t.end!==null)stops.push(t.end);
   if(t.start===null||t.end===null)continue;
   const weight=Math.min(1,1000/Math.max(1,t.end-t.start+1));
   if(t.start<=t.end){starts.push([t.start,weight]);ends.push([t.end,weight]);}
   for(const date of new Set([t.start,t.end,t.certainStart,t.certainEnd]))
    if(date!==undefined)nearby.push(date);
  }
  this.starts=new WeightedDates(starts);this.ends=new WeightedDates(ends);
  this.nearby=nearby.sort((a,b)=>a-b);
  for(const date of this.nearby)this.nearbySums.push(this.nearbySums[this.nearbySums.length-1]+date);
  this.stops=[...new Set(stops)].sort((a,b)=>a-b);
 }

 yearsPerSecond(year:number):number{
  const begun=bound(this.starts.dates,year,true),ended=bound(this.ends.dates,year);
  const activity=begun===ended?0:this.starts.sums[begun]-this.ends.sums[ended];
  const lo=bound(this.nearby,year-1000),middle=bound(this.nearby,year,true),hi=bound(this.nearby,year+1000);
  const left=middle-lo,right=hi-middle;
  const nearby=left-(year*left-(this.nearbySums[middle]-this.nearbySums[lo]))/1000
   +right-((this.nearbySums[hi]-this.nearbySums[middle])-year*right)/1000;
  return Math.max(25,Math.min(12000,12000/(1+3*activity+2*nearby)));
 }

 advance(current:number,step:number):{year:number;boundary:boolean}{
  const target=Math.min(END_YEAR,current+step),next=this.stops[bound(this.stops,current,true)];
  return next!==undefined&&next<=target?{year:next,boundary:true}:{year:target,boundary:false};
 }
}
