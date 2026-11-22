import {disputeLevel} from './disputes';
import type { DisplayRecord } from "./model";
import type { HazardEvent } from "./physical-data";
import { formatYear, timeLabel } from "./time";
import {readerSummary,readerLocation} from './reader-evidence';
import {placeKey} from './map-place-groups';
import {historyState} from './history';

export interface MapTooltipContent {
  title: string;
  summary: string;
  dates: string;
  items?: {title:string;summary:string;dates:string}[];
}
export type MapMode = "movie" | "explore";

const datesFor=(row:DisplayRecord,mode:MapMode,year:number)=>
  (mode==='movie'&&historyState(row,year)==='past-place'?'Earlier: ':'')+timeLabel(row.time);

/** A cluster previews distinct places, not a count of database rows. */
export function tooltipForPlaces(rows:readonly DisplayRecord[],mode:MapMode,year:number,anchorName?:string):MapTooltipContent|null{
  if(!rows.length)return null;
  const places=new Map<string,DisplayRecord[]>();
  for(const row of rows){const key=placeKey(row)??row.id;places.set(key,[...(places.get(key)??[]),row]);}
  const rank=(r:DisplayRecord)=>mode==='movie'&&historyState(r,year)==='active'?0:1;
  const representatives=[...places.values()].map(group=>[...group].sort((a,b)=>rank(a)-rank(b)||(b.time.end??-Infinity)-(a.time.end??-Infinity)||a.id.localeCompare(b.id))[0]);
  representatives.sort((a,b)=>rank(a)-rank(b));
  return {
    title:anchorName?`Around ${anchorName}`:'Places here',
    summary:'',
    items:representatives.slice(0,3).map(row=>({title:row.title,summary:readerSummary(row),dates:datesFor(row,mode,year)})),
    dates:(representatives.length>3?`Open for all ${representatives.length} places. `:'Open to explore these places. ')+(mode==='explore'?'All-time view.':`Map: ${formatYear(year)}.`),
  };
}

/** Uses only catalog fields already in memory; hover never requests record detail. */
export function tooltipForRecords(
  rows: readonly DisplayRecord[],
  mode: MapMode,
  year: number,
): MapTooltipContent | null {
  if (!rows.length) return null;
  if(rows.length>1){
    const content=tooltipForPlaces(rows,mode,year,readerLocation(rows[0]))!;
    const ordered=[...rows].sort((a,b)=>Number(historyState(b,year)==='active')-Number(historyState(a,year)==='active'));
    content.items=ordered.slice(0,3).map(row=>({title:row.title,summary:readerSummary(row),dates:datesFor(row,mode,year)}));
    content.dates=(rows.length>3?`Open for all ${rows.length} finds and episodes. `:'Open to explore this place. ')+(mode==='explore'?'All-time view.':`Map: ${formatYear(year)}.`);
    return content;
  }
  const unresolved = rows.some(
    (r) =>
      r.time.kind === "unplaced" ||
      r.time.start === null ||
      r.time.end === null,
  );
  return {
    title: rows[0].title,
    summary: rows
      .map(readerSummary)
      .filter(Boolean)
      .join(" "),
    dates:
      rows.map((r) => datesFor(r,mode,year)).join("; ") +
      ". " +
      (rows.some(r=>disputeLevel(r)==='disputed')?"Disputed interpretation (red rim). ":rows.some(r=>disputeLevel(r)==='discussion')?"Interpretation under discussion (gold rim). ":"")+
      (unresolved
        ? "Dates unresolved: we do not yet know when this happened."
        : mode === "explore"
          ? "All-time Explore view."
          : `Movie year ${formatYear(year)}.`) +
      '\n'+[...new Set(rows.map(readerLocation))].join('; '),
  };
}
export function tooltipForHazard(event: HazardEvent): MapTooltipContent {
  return {
    title: event.title,
    summary: event.limitations,
    dates: `${event.start === event.end ? formatYear(event.start) : formatYear(event.start) + " – " + formatYear(event.end)}. ${event.status}.`,
  };
}

export function tooltipPosition(
  anchor: { x: number; y: number },
  size: { width: number; height: number },
  viewport: { width: number; height: number },
  avoid?:{left:number;top:number;right:number;bottom:number},
) {
  const gap = 8;
  if(avoid){
    const candidates=[
      {left:avoid.right+16,top:anchor.y-size.height/2},
      {left:avoid.left-size.width-16,top:anchor.y-size.height/2},
      {left:anchor.x-size.width/2,top:avoid.top-size.height-16},
      {left:anchor.x-size.width/2,top:avoid.bottom+16},
    ].map(p=>({left:Math.max(gap,Math.min(p.left,viewport.width-size.width-gap)),top:Math.max(gap,Math.min(p.top,viewport.height-size.height-gap))}));
    const clear=candidates.find(p=>p.left+size.width<=avoid.left-gap||p.left>=avoid.right+gap||p.top+size.height<=avoid.top-gap||p.top>=avoid.bottom+gap);
    if(clear)return clear;
  }
  let left = anchor.x + gap,
    top = anchor.y + gap;
  if (left + size.width > viewport.width - gap)
    left = anchor.x - size.width - gap;
  if (top + size.height > viewport.height - gap)
    top = anchor.y - size.height - gap;
  return {
    left: Math.max(
      gap,
      Math.min(left, Math.max(gap, viewport.width - size.width - gap)),
    ),
    top: Math.max(
      gap,
      Math.min(top, Math.max(gap, viewport.height - size.height - gap)),
    ),
  };
}

let nextTooltip = 0;
/** Appended to body so SVG and map-panel clipping never truncate the popup. */
export class MapTooltip {
  private readonly element = document.createElement("div");
  private readonly title = document.createElement("strong");
  private readonly summary = document.createElement("p");
  private readonly dates = document.createElement("p");
  private readonly items = document.createElement("ul");
  private owner: Element | null = null;
  private readonly dismissOutside = (event: Event) => {
    if (!(event.target instanceof Node) || !this.owner?.contains(event.target)) this.hide();
  };
  private readonly dismissEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') this.hide();
  };
  constructor(private readonly onHide: () => void = () => {}) {
    this.element.className = "map-hover-tooltip";
    this.element.id = "map-hover-tooltip-" + ++nextTooltip;
    this.element.setAttribute("role", "tooltip");
    this.dates.className = "map-hover-dates";
    this.items.className = 'map-hover-places';
    this.element.append(this.title, this.summary, this.items, this.dates);
  }
  show(
    content: MapTooltipContent,
    anchor: { x: number; y: number },
    owner: Element,
  ) {
    if (this.owner !== owner) {
      this.owner?.removeAttribute("aria-describedby");
      this.owner = owner;
    }
    owner.setAttribute("aria-describedby", this.element.id);
    const shorten=(text:string,limit:number)=>text.length<=limit?text:text.slice(0,limit).replace(/\s+\S*$/,'')+'…';
    this.title.textContent = shorten(content.title,150);
    this.summary.textContent = shorten(content.summary,260);
    this.summary.hidden=!content.summary;
    this.items.replaceChildren();
    this.items.hidden=!content.items?.length;
    for(const item of content.items??[]){
      const li=document.createElement('li'),name=document.createElement('strong'),description=document.createElement('p'),dates=document.createElement('span');
      name.textContent=shorten(item.title,100);description.textContent=shorten(item.summary,155);dates.textContent=item.dates;dates.className='map-hover-dates';
      li.append(name,description,dates);this.items.append(li);
    }
    this.dates.textContent = shorten(content.dates,260);
    if (!this.element.isConnected) {
      document.body.append(this.element);
      document.addEventListener('pointerover',this.dismissOutside,true);
      document.addEventListener('focusin',this.dismissOutside,true);
      document.addEventListener('keydown',this.dismissEscape,true);
    }
    const box = this.element.getBoundingClientRect();
    const target=owner.getBoundingClientRect();
    const avoid=target.width<=220&&target.height<=220?{left:Math.min(target.left,anchor.x-35),right:Math.max(target.right,anchor.x+35),top:Math.min(target.top,anchor.y-35),bottom:Math.max(target.bottom,anchor.y+35)}:{left:anchor.x-70,right:anchor.x+70,top:anchor.y-70,bottom:anchor.y+70};
    const position = tooltipPosition(anchor, box, {
      width: window.innerWidth,
      height: window.innerHeight,
    },avoid);
    this.element.style.left = position.left + "px";
    this.element.style.top = position.top + "px";
  }
  hide() {
    document.removeEventListener('pointerover',this.dismissOutside,true);
    document.removeEventListener('focusin',this.dismissOutside,true);
    document.removeEventListener('keydown',this.dismissEscape,true);
    this.owner?.removeAttribute("aria-describedby");
    this.owner = null;
    this.element.remove();
    this.onHide();
  }
}
