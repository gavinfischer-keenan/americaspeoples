import type { EvidenceRecord, Place } from './model';
import type { SiteGuide } from './site-guides';

export interface GuideMapPoint {
  id: string;
  name: string;
  lon: number;
  lat: number;
  recordIds: string[];
  precision: string;
}
export interface GuideMap {
  id: string;
  title: string;
  /** Geographic west/south/east/north. East may exceed 180 at the Pacific seam.
   * The rectangle has a 2:1 aspect in spherical Mercator, matching the terrain. */
  bounds: [number, number, number, number];
  points: GuideMapPoint[];
  /** Unique context places excluded from this local view; phases are not counted. */
  omittedPoints: number;
}

const R = 6371008.8;
const RAD = Math.PI / 180;
const MAX_LAT = 85.05112878;
const mercator = (lat: number) => Math.log(Math.tan(Math.PI / 4 + lat * RAD / 2)) / RAD;
const latitude = (y: number) => (2 * Math.atan(Math.exp(y * RAD)) - Math.PI / 2) / RAD;
const escape = (s: string) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

// These older catalog groupings predate the explicit level:region field.
// Their constituent settlements are intentionally spread over several regions.
const regionalGroups = new Set(['maya-centers', 'pacific-complexes', 'cortez-area']);
const isRegional = (guide: SiteGuide) => guide.level === 'region' || guide.kind === 'culture' || regionalGroups.has(guide.id);
const isContext = (record: EvidenceRecord) => record.type === 'movement' || record.overlay?.kind === 'trade' || record.history?.kind === 'exchange';
const validPlace = (p: Place | null): p is Place => !!p && Number.isFinite(p.lon) && Number.isFinite(p.lat) && Math.abs(p.lon) <= 180 && Math.abs(p.lat) <= MAX_LAT;

interface Candidate extends GuideMapPoint { local: boolean; }
function collect(records: readonly EvidenceRecord[], regional: boolean): Candidate[] {
  const points: Candidate[] = [];
  const byPlace = new Map<string, Candidate>();
  const byCoordinate = new Map<string, Candidate>();
  for (const record of records) {
    const places = regional ? [record.location, record.destination] : [record.location];
    for (const place of places) {
      if (!validPlace(place)) continue;
      // Sub-metre rounding joins representation noise, not separate buildings.
      const key = `${place.lon.toFixed(6)},${place.lat.toFixed(6)}`;
      let point = byPlace.get(place.id) ?? byCoordinate.get(key);
      if (!point) {
        point = { id: place.id, name: place.name, lon: place.lon, lat: place.lat,
          recordIds: [], precision: place.precision, local: !isContext(record) };
        points.push(point);
      } else {
        point.local ||= !isContext(record);
        if (!point.name.split(' / ').includes(place.name) && point.name !== place.name)
          point.name += ` / ${place.name}`;
      }
      if (!point.recordIds.includes(record.id)) point.recordIds.push(record.id);
      byPlace.set(place.id, point);
      byCoordinate.set(key, point);
    }
  }
  return points;
}

function distance(a: GuideMapPoint, b: GuideMapPoint): number {
  const dLat = (a.lat - b.lat) * RAD, dLon = (a.lon - b.lon) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(Math.min(1, h)));
}

/** Keep a connected local group, rather than a distant exchange endpoint.
 * 75 km links retain the public outlying houses/groups in the expanded local
 * studies. Broad region/culture guides deliberately bypass this local filter. */
function localCluster(points: Candidate[]): Candidate[] {
  const local = points.some(p => p.local) ? points.filter(p => p.local) : points;
  const unseen = new Set(local);
  const groups: Candidate[][] = [];
  for (const point of local) {
    if (!unseen.delete(point)) continue;
    const group = [point];
    for (let i = 0; i < group.length; i++) {
      for (const other of unseen) {
        if (distance(group[i], other) <= 75000) { unseen.delete(other); group.push(other); }
      }
    }
    groups.push(group);
  }
  // Coordinate count, then evidence count. Stable source order resolves ties.
  groups.sort((a, b) => b.length - a.length || b.reduce((n,p)=>n+p.recordIds.length,0) - a.reduce((n,p)=>n+p.recordIds.length,0));
  return groups[0] ?? [];
}

function boundsFor(points: GuideMapPoint[]): GuideMap['bounds'] {
  const circular = points.map(p => (p.lon + 360) % 360).sort((a,b)=>a-b);
  let start = circular[0], gap = -1;
  for (let i = 0; i < circular.length; i++) {
    const next = circular[(i+1) % circular.length] + (i === circular.length - 1 ? 360 : 0);
    // Reuse the original value: (longitude + 360) % 360 can round a fraction
    // above that same longitude and incorrectly move the first point by 360°.
    if (next - circular[i] > gap) { gap = next - circular[i]; start = circular[(i+1) % circular.length]; }
  }
  const xs = circular.map(x => x < start ? x + 360 : x);
  if (start > 180) for (let i=0; i<xs.length; i++) xs[i] -= 360;
  const ys = points.map(p => mercator(p.lat));
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const cx = (x0+x1)/2;
  let cy = (y0+y1)/2;
  const minimumWidth = 500 / (R * RAD * Math.cos(latitude(cy) * RAD));
  // At least 16% padding on each occupied axis, then fit exactly 2:1 Mercator.
  const halfWidth = Math.max((x1-x0)*0.66, (y1-y0)*1.32, minimumWidth*0.66);
  const halfHeight = halfWidth / 2;
  const limit = mercator(MAX_LAT);
  cy = Math.max(-limit + halfHeight, Math.min(limit - halfHeight, cy));
  return [cx-halfWidth, latitude(cy-halfHeight), cx+halfWidth, latitude(cy+halfHeight)];
}

export function createSiteOverview(guide: SiteGuide, records: readonly EvidenceRecord[], guides: readonly SiteGuide[]): GuideMap | null {
  const lookup = new Map(records.map(r => [r.id, r]));
  const get = (ids: string[]) => [...new Set(ids)].flatMap(id => lookup.has(id) ? [lookup.get(id)!] : []);
  const regional = isRegional(guide);
  let candidates = collect(get([...guide.recordIds, ...guide.referenceRecordIds ?? []]), regional);
  // A related article must never enlarge a mapped local study just because it
  // is linked for context. Only articles without any own/reference place fall back.
  if (!candidates.length) {
    const related = new Set(guide.relatedGuideIds ?? []);
    candidates = collect(get(guides.filter(g => related.has(g.id)).flatMap(g => [...g.recordIds, ...g.referenceRecordIds ?? []])), regional);
  }
  if (!candidates.length) return null;
  const selected = regional ? candidates : localCluster(candidates);
  const points = selected.map(({local: _local, ...point}) => point);
  if (!points.length) return null;
  return {id: guide.id, title: guide.title, bounds: boundsFor(points), points, omittedPoints: candidates.length-points.length};
}

interface Box { x:number; y:number; w:number; h:number; }
interface Label extends Box { lines:string[]; point:GuideMapPoint; index:number; px:number; py:number; }
const overlap = (a:Box,b:Box) => a.x < b.x+b.w+4 && a.x+a.w+4 > b.x && a.y < b.y+b.h+4 && a.y+a.h+4 > b.y;
function wrap(text: string): string[] {
  const words = text.split(/\s+/), lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (line.length + word.length + 1 > 28 && line) { lines.push(line); line = ''; }
    line += (line ? ' ' : '') + word;
  }
  if (line) lines.push(line);
  return lines.length <= 3 ? lines : [...lines.slice(0,2), lines[2].slice(0,25)+'…'];
}
function project(map: GuideMap, point: GuideMapPoint): [number,number] {
  const [w,s,e,n] = map.bounds;
  let lon = point.lon;
  while (lon < w) lon += 360;
  while (lon > e && lon-360 >= w) lon -= 360;
  return [(lon-w)/(e-w)*1200, (mercator(n)-mercator(point.lat))/(mercator(n)-mercator(s))*600];
}
function labelsFor(map: GuideMap): Label[] {
  const used: Box[] = [{x:1110,y:12,w:76,h:75},{x:12,y:538,w:260,h:50}];
  const markers = map.points.map(point => {const [x,y]=project(map,point);return {x:x-5,y:y-5,w:10,h:10};});
  const labels: Label[] = [];
  const ordered = map.points.map((point,index)=>({point,index})).sort((a,b)=>b.point.lat-a.point.lat || a.point.lon-b.point.lon || a.index-b.index);
  for (const {point,index} of ordered) {
    const [px,py] = project(map,point);
    let placed: Label | undefined;
    const named = map.points.length <= 30;
    for (const lines of named ? [wrap(`${index+1}. ${point.name}`),[String(index+1)]] : [[String(index+1)]]) {
      const w = Math.max(30, Math.max(...lines.map(l=>l.length))*8.6+16), h=lines.length*20+10;
      const candidates: Box[] = [];
      // Nearby compass positions first; farther positions stay connected by a leader.
      for (const d of [14,38,68,106,154,218,300,410]) {
        candidates.push({x:px+d,y:py-h/2,w,h},{x:px-d-w,y:py-h/2,w,h},{x:px-w/2,y:py-d-h,w,h},{x:px-w/2,y:py+d,w,h},
          {x:px+d,y:py-d-h,w,h},{x:px-d-w,y:py-d-h,w,h},{x:px+d,y:py+d,w,h},{x:px-d-w,y:py+d,w,h});
      }
      // A nearest-free grid is a deterministic last resort for dense clusters.
      const grid: Box[] = [];
      for(let y=14;y+h<=586;y+=h+8) for(let x=14;x+w<=1186;x+=w+8) grid.push({x,y,w,h});
      grid.sort((a,b)=>Math.hypot(a.x+a.w/2-px,a.y+a.h/2-py)-Math.hypot(b.x+b.w/2-px,b.y+b.h/2-py));
      candidates.push(...grid);
      const box = candidates.find(b=>b.x>=12&&b.y>=12&&b.x+b.w<=1188&&b.y+b.h<=588&&!used.some(u=>overlap(b,u))&&!markers.some(m=>overlap(b,m)));
      if (box) { placed={...box,lines,point,index,px,py}; break; }
    }
    if (placed) { used.push(placed); labels.push(placed); }
  }
  return labels;
}

export function siteOverviewHTML(map: GuideMap): string {
  if (!map.points.length) return '';
  const id = `site-overview-${map.id.replace(/[^a-zA-Z0-9_-]/g,'-')}`;
  const review = (recordId:string) => `../#review/${encodeURIComponent(recordId)}`;
  const labels = labelsFor(map);
  const labeled = new Set(labels.map(l=>l.index));
  const leaders = labels.map(l=>{
    const x=Math.max(l.x,Math.min(l.x+l.w,l.px)), y=Math.max(l.y,Math.min(l.y+l.h,l.py));
    return `<path d="M${l.px.toFixed(2)},${l.py.toFixed(2)} L${x.toFixed(2)},${y.toFixed(2)}" fill="none" stroke="#263e3a" stroke-width="1.2" opacity=".8"/>`;
  }).join('');
  const markers = map.points.map((p,i)=>{
    const [x,y]=project(map,p);
    const fallback = !labeled.has(i);
    return `<a href="${escape(review(p.recordIds[0]))}" tabindex="0" aria-label="${escape(`${i+1}. ${p.name}: review evidence`)}"><title>${escape(p.name+' — '+p.precision)}</title><circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${fallback?13:6}" fill="#153f35" stroke="#fffaf0" stroke-width="2"/>${fallback?`<text class="site-overview-point-number" x="${x.toFixed(2)}" y="${(y+4).toFixed(2)}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="700" fill="white">${i+1}</text>`:''}</a>`;
  }).join('');
  const text = labels.map(l=>`<a href="${escape(review(l.point.recordIds[0]))}" tabindex="0" aria-label="${escape(`${l.index+1}. ${l.point.name}: review evidence`)}"><title>${escape(l.point.name+' — '+l.point.precision)}</title><g class="site-overview-label" data-label-box="${[l.x,l.y,l.w,l.h].map(n=>n.toFixed(2)).join(',')}"><rect x="${l.x.toFixed(2)}" y="${l.y.toFixed(2)}" width="${l.w.toFixed(2)}" height="${l.h.toFixed(2)}" rx="4" fill="#fffdf4" fill-opacity=".96" stroke="#788278"/><text x="${(l.x+8).toFixed(2)}" y="${(l.y+20).toFixed(2)}" font-family="system-ui,sans-serif" font-size="16" font-weight="600" fill="#15372f">${l.lines.map((line,i)=>`<tspan x="${(l.x+8).toFixed(2)}" dy="${i?20:0}">${escape(line)}</tspan>`).join('')}</text></g></a>`).join('');
  const [w,s,e,n]=map.bounds;
  const metersPerPixel = (e-w)*RAD*R*Math.cos(latitude((mercator(s)+mercator(n))/2)*RAD)/1200;
  const target = metersPerPixel*160, magnitude=10**Math.floor(Math.log10(target));
  const scale = [5,2,1].map(k=>k*magnitude).find(k=>k<=target) ?? magnitude/2;
  const scalePixels=scale/metersPerPixel;
  const scaleText=scale>=1000?`${Number((scale/1000).toPrecision(2))} km`:`${Math.round(scale)} m`;
  const key=map.points.map((p,i)=>`<li style="break-inside:avoid"><a href="${escape(review(p.recordIds[0]))}">${i+1}. ${escape(p.name)}</a><details><summary>Location notes and evidence</summary><p>${escape(p.precision)}</p><ul>${p.recordIds.map((rid,j)=>`<li><a href="${escape(review(rid))}">Evidence ${j+1}</a></li>`).join('')}</ul></details></li>`).join('');
  const omitted=map.omittedPoints?` ${map.omittedPoints} distant or exchange-context ${map.omittedPoints===1?'place is':'places are'} outside this local view; use the linked studies and master map for wider connections.`:'';
  return `<figure class="site-overview" aria-labelledby="${id}-heading"><h2 id="${id}-heading">${escape(map.title)}: places and terrain</h2><div style="overflow-x:auto"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" width="1200" height="600" style="display:block;width:100%;height:auto;min-width:600px" role="group" aria-labelledby="${id}-title ${id}-description"><title id="${id}-title">${escape(map.title)} — labeled site map</title><desc id="${id}-description">Modern terrain with numbered public feature anchors. Features from different periods; use the movie for changes through time. Links open evidence reviews; the numbered key repeats every feature below the map.</desc><rect width="1200" height="600" fill="#e9e4d4"/><image href="../guide-terrain/${escape(encodeURIComponent(map.id))}.webp" x="0" y="0" width="1200" height="600" preserveAspectRatio="none"/>${leaders}${markers}${text}<g aria-label="North"><rect x="1110" y="12" width="76" height="75" rx="5" fill="#fffdf4" fill-opacity=".93"/><path d="M1148 63 L1148 34 M1139 45 L1148 29 L1157 45" fill="none" stroke="#203b32" stroke-width="2"/><text x="1148" y="79" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" fill="#203b32">North</text></g><g aria-label="Approximate scale ${scaleText}"><rect x="12" y="538" width="260" height="50" rx="5" fill="#fffdf4" fill-opacity=".93"/><path d="M28 558 H${(28+scalePixels).toFixed(2)} M28 552 V564 M${(28+scalePixels).toFixed(2)} 552 V564" fill="none" stroke="#203b32" stroke-width="2"/><text x="28" y="580" font-family="system-ui,sans-serif" font-size="13" fill="#203b32">Approximate scale: ${scaleText}</text></g></svg></div><figcaption>Modern relief. Features span different periods; select a label for history and dates. Markers locate places, not building outlines.</figcaption>${omitted?`<details><summary>Wider connections</summary><p>${escape(omitted.trim())}</p></details>`:''}<details class="site-overview-key-panel"><summary>Places on this map · ${map.points.length}</summary><ol class="site-overview-key" style="list-style:none;padding:0;columns:2 20rem">${key}</ol></details></figure>`;
}
