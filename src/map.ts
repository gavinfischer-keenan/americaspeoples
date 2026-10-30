import { mapProjection, type MapScope } from "./map-projection";
import { geoPath, geoGraticule10 } from "d3-geo";
import { MapGeometry } from "./map-geometry";
import { guideForRecord } from "./site-guides";
import { populationAt } from "./population";
import type { DisplayRecord } from "./model";
import { temporalState, temporalOpacity, timeLabel, isDisputed, END_YEAR } from "./time";
import { OVERLAY_LABELS } from "./overlays";
import { esc, $ } from "./dom";
import { disputeLevel, disputeLabel } from "./disputes";
import { boundsInViewport } from "./map-filters";
import {iceSnapshot,eventsAt,oceanPaths,isUncertainHazard} from './physical';
import {MapTooltip,tooltipForRecords,tooltipForHazard,type MapTooltipContent,type MapMode} from './map-tooltip';
export interface MapInteraction {mode:MapMode;playing:boolean;onPause:()=>void}
export interface PhysicalOptions {ice:boolean; iceScenario:string; currents:boolean; winds:boolean; hidden:ReadonlySet<string>; uncertain:boolean}
export class MapView {
  readonly element = document.createElement("div");
  private scope: MapScope = "pacific";
  private projection = mapProjection(this.scope);
  private geometry = new MapGeometry(this.projection);
  private viewportFrame: number | null = null;
  private scale = 1;
  private tx = 0;
  private ty = 0;
  private records: DisplayRecord[] = [];
  private contextRecords: DisplayRecord[] = [];
  private contextAnchors=new Map<string,DisplayRecord[]>();
  private physical:PhysicalOptions={ice:false,iceScenario:'optimal',currents:false,winds:false,hidden:new Set(),uncertain:true};
  private icePaths=new Map<string,string>();
  private flowPaths=new Map<string,string>();
  private year = END_YEAR;
  private selected: string | null = null;
  private interaction:MapInteraction|null=null;
  private readonly tooltip=new MapTooltip();
  private tips=new Map<string,MapTooltipContent>();
  private hovered:{key:string;x:number;y:number}|null=null;
  constructor(
    private readonly land: any,
    private onSelect: (rows: DisplayRecord[]) => void,
    private onViewportChange: () => void = () => {},
  ) {
    this.element.className = "map-canvas";
    const path = geoPath(this.projection);
    this.element.innerHTML = `<svg viewBox="0 0 1000 800" role="img" aria-label="Map of the Americas and Pacific. Use the visible records list for keyboard access to evidence." tabindex="0"><defs><pattern id="population-unknown" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V5" stroke="#fff" stroke-width="1.8" opacity=".8"/></pattern><radialGradient id="reach-fade"><stop offset="0%" stop-color="white" stop-opacity=".35"/><stop offset="40%" stop-color="white" stop-opacity=".22"/><stop offset="100%" stop-color="white" stop-opacity="0"/></radialGradient><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#e5c78c"/></marker></defs><g class="world"><path class="graticule" d="${path(geoGraticule10())}"/><path class="land" d="${path(land)}"/><g class="map-labels">${this.labels()}</g><g class="features"></g></g></svg><div class="map-controls"><label class="map-scope">Map region<select aria-label="Map region"><option value="pacific">Asia-Pacific / Americas</option><option value="americas">Americas focus</option></select></label><button data-zoom="in" aria-label="Zoom in">+</button><button data-zoom="out" aria-label="Zoom out">−</button><button data-zoom="reset" aria-label="Reset map view">⌖</button></div><div class="map-caption">Present-day reference coastlines · Not an Ice Age reconstruction<br>Made with Natural Earth · Public domain</div>`;
    const svg = $<SVGSVGElement>("svg", this.element);
    // Capture before feature listeners or native anchor navigation. A pause click
    // is consumed even when onPause synchronously redraws/reconfigures the map.
    const pauseClick=(e:MouseEvent)=>{
      if(this.interaction?.mode!=='movie'||!this.interaction.playing)return;
      const target=e.target instanceof Element?e.target:null;
      if(!target||target.closest('.map-controls'))return;
      const feature=target.closest('[data-point],[data-overlay],[data-context],.hazard-marker');
      if(!feature&&(e.button!==0||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey))return;
      e.preventDefault();e.stopPropagation();
      const onPause=this.interaction.onPause;
      this.interaction={...this.interaction,playing:false};
      onPause();
    };
    this.element.addEventListener('click',pauseClick,true);
    this.element.addEventListener('auxclick',pauseClick,true);
    const showTip=(target:EventTarget|null,x:number,y:number)=>{
      const feature=target instanceof Element?target.closest<SVGElement>('[data-map-tip]'):null;
      const key=feature?.dataset.mapTip,content=key?this.tips.get(key):null;
      if(!feature||!key||!content){this.hideTooltip();return;}
      this.hovered={key,x,y};this.tooltip.show(content,{x,y},feature);
    };
    svg.addEventListener('pointerover',e=>showTip(e.target,e.clientX,e.clientY));
    svg.addEventListener('pointermove',e=>{if(!e.buttons)showTip(e.target,e.clientX,e.clientY);});
    svg.addEventListener('pointerleave',()=>this.hideTooltip());
    svg.addEventListener('focusin',e=>{
      const box=(e.target as Element).getBoundingClientRect();showTip(e.target,box.left+box.width/2,box.bottom);
    });
    svg.addEventListener('focusout',()=>this.hideTooltip());
    svg.addEventListener('keydown',e=>{if(e.key==='Escape')this.hideTooltip();});
    // Body-mounted tooltips must not outlive a map page or a viewport change.
    const life=new MutationObserver(()=>{if(!this.element.isConnected){this.hideTooltip();life.disconnect();}});
    life.observe(document.body,{childList:true,subtree:true});
    $(".map-scope select", this.element).addEventListener("change", (e) => {
      this.setScope((e.target as HTMLSelectElement).value as MapScope);
    });
    let drag: { x: number; y: number; tx: number; ty: number } | null = null;
    let moved = false;
    const pixels = () => 1 / this.viewportFit();
    svg.addEventListener("pointerdown", (e) => {
      this.hideTooltip();
      moved = false;
      drag = { x: e.clientX, y: e.clientY, tx: this.tx, ty: this.ty };
      moved = false;
      // Keep tap targets intact. Capture only after a real drag, including over clouds.
    });
    svg.addEventListener("pointermove", (e) => {
      if (!drag) return;
      if (e.buttons === 0) {
        drag = null;
        return;
      }
      const dx = (e.clientX - drag.x) * pixels(),
        dy = (e.clientY - drag.y) * pixels();
      moved ||= Math.abs(dx) + Math.abs(dy) > 4;
      if (!moved) return;
      if (!svg.hasPointerCapture(e.pointerId))
        svg.setPointerCapture(e.pointerId);
      this.tx = drag.tx + dx;
      this.ty = drag.ty + dy;
      this.transform();
    });
    svg.addEventListener("pointerup", () => {
      drag = null;
    });
    svg.addEventListener("pointercancel", () => {
      drag = null;
    });
    new ResizeObserver(() => {
      if (this.element.isConnected) {
        this.draw();
        this.notifyViewportChange();
      }
    }).observe(this.element);
    svg.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15);
      },
      { passive: false },
    );
    svg.addEventListener("keydown", (e) => {
      const d = 35;
      if (e.key === "ArrowLeft") this.tx += d;
      else if (e.key === "ArrowRight") this.tx -= d;
      else if (e.key === "ArrowUp") this.ty += d;
      else if (e.key === "ArrowDown") this.ty -= d;
      else if (e.key === "+") {
        this.zoom(1.25);
        return;
      } else if (e.key === "-") {
        this.zoom(0.8);
        return;
      } else return;
      e.preventDefault();
      this.transform();
    });
    this.element.addEventListener("click", (e) => {
      const target = (e.target as Element).closest<HTMLElement>(
        "[data-zoom],[data-point],[data-overlay],[data-context]",
      );
      if (!target) return;
      if (target.dataset.zoom) {
        if (target.dataset.zoom === "reset") {
          this.scale = 1;
          this.tx = this.ty = 0;
          this.transform();
          this.draw();
        } else this.zoom(target.dataset.zoom === "in" ? 1.35 : 1 / 1.35);
      } else if(!moved && target.dataset.context!==undefined){
        this.onSelect(this.contextAnchors.get(target.dataset.context)??[]);
      } else if (!moved && target.dataset.overlay !== undefined) {
        this.onSelect([this.records[Number(target.dataset.overlay)]]);
      } else if (!moved) {
        this.selected = target.dataset.point!;
        this.onSelect(
          this.records.filter(
            (r) =>
              !r.overlay &&
              r.location &&
              `${r.location.lon},${r.location.lat}` === this.selected,
          ),
        );
      }
    });
  }
  setInteraction(interaction:MapInteraction):void{
    const changed=this.interaction?.mode!==interaction.mode;
    this.interaction=interaction;
    if(changed)this.draw();
  }
  private hideTooltip(){this.hovered=null;this.tooltip.hide();}
  /** Route owners can clear body-mounted hover content when reusing this map. */
  clearHover():void{this.hideTooltip();}
  private opacity(r:DisplayRecord){return this.interaction?.mode==='explore'?1:temporalOpacity(r.time,this.year);}
  private uncertainty(r:DisplayRecord):boolean{
    if(this.interaction?.mode!=='explore')return temporalState(r.time,this.year)==='possible';
    const time=r.time;
    if(time.kind==='unplaced'||time.start===null||time.end===null)return false;
    return !!time.approximate || (time.kind==='occurrence'&&time.start!==time.end) ||
      (time.certainStart!==undefined&&time.certainEnd!==undefined&&
        (time.certainStart>time.start||time.certainEnd<time.end));
  }
  private labels() {
    return this.scope === "pacific"
      ? '<text x="110" y="285">ISLAND ASIA</text><text x="435" y="345">HAWAII</text><text class="ocean-label" x="385" y="500">PACIFIC OCEAN</text><text x="615" y="240">NORTH AMERICA</text><text x="800" y="570">SOUTH AMERICA</text>'
      : '<text x="390" y="230">NORTH AMERICA</text><text x="680" y="610">SOUTH AMERICA</text><text x="810" y="90">GREENLAND</text><text x="100" y="110">BERING STRAIT</text><text class="ocean-label" x="160" y="480">PACIFIC OCEAN</text><text class="ocean-label" x="830" y="390">ATLANTIC OCEAN</text>';
  }
  private setScope(scope: MapScope, redraw = true) {
    if (scope === this.scope) return;
    this.scope = scope;
    this.projection = mapProjection(scope);
    this.geometry.setProjection(this.projection);
    this.flowPaths.clear();
    this.geometry.update([...this.records, ...this.contextRecords]);
    this.scale = 1;
    this.tx = this.ty = 0;
    const path = geoPath(this.projection);
    $(".land", this.element).setAttribute("d", path(this.land) ?? "");
    $(".graticule", this.element).setAttribute("d", path(geoGraticule10()) ?? "");
    $(".map-labels", this.element).innerHTML = this.labels();
    ($(".map-scope select", this.element) as HTMLSelectElement).value = scope;
    this.transform();
    if (redraw) this.draw();
  }
  private zoom(factor: number) {
    const old = this.scale;
    this.scale = Math.max(1, Math.min(4096, this.scale * factor));
    if (this.scale === old) return;
    const ratio = this.scale / old;
    this.tx = 500 - (500 - this.tx) * ratio;
    this.ty = 400 - (400 - this.ty) * ratio;
    this.transform();
    this.draw();
  }
  private transform() {
    this.hideTooltip();
    this.tx = Math.max(-1000 * this.scale + 100, Math.min(900, this.tx));
    this.ty = Math.max(-800 * this.scale + 80, Math.min(720, this.ty));
    $(".world", this.element).setAttribute(
      "transform",
      `translate(${this.tx},${this.ty}) scale(${this.scale})`,
    );
    this.notifyViewportChange();
  }
  /** Pointer events may outpace paint; notify panels once with the final view. */
  private notifyViewportChange() {
    if (this.viewportFrame !== null) return;
    this.viewportFrame = requestAnimationFrame(() => {
      this.viewportFrame = null;
      if (this.element.isConnected) this.onViewportChange();
    });
  }
  /** Same projected geometry and transform as the map; unmapped records stay out. */
  visibleRecords(): DisplayRecord[] {
    return this.recordsInView(this.records);
  }
  visibleContextRecords():DisplayRecord[]{return this.recordsInView(this.contextRecords, true);}
  private recordsInView(records:DisplayRecord[], context = false):DisplayRecord[]{
    return records.filter(r => {
      const shape = this.geometry.get(r);
      const bounds = context ? shape.contextBounds : shape.bounds;
      return !!bounds && boundsInViewport(bounds, this.scale, this.tx, this.ty);
    });
  }
  update(records: DisplayRecord[], year: number, context:DisplayRecord[]=[],physical?:PhysicalOptions) {
    this.records = records;
    this.contextRecords=context;
    this.geometry.update([...records, ...context]);
    if(physical)this.physical=physical;
    this.year = year;
    this.draw();
  }
  focus(r: DisplayRecord) {
    const geometry = r.overlay?.geometry;
    const position =
      geometry?.type === "Point"
        ? geometry.coordinates
        : geometry?.type === "LineString"
          ? geometry.coordinates[0]
          : r.location
            ? [r.location.lon, r.location.lat]
            : null;
    if (!position) return;
    if (position[0] > 90 || position[0] < -145) {
      if (this.scope !== "pacific") this.setScope("pacific", false);
    } else {
      const current = this.projection(position as [number, number]);
      if (this.scope === "pacific" && current && (current[0] < 0 || current[0] > 1000)) this.setScope("americas", false);
    }
    const p = this.projection(position as [number, number]);
    if (!p) return;
    this.scale = r.overlay || r.type === "movement" ? 2 : 256;
    this.tx = 500 - p[0] * this.scale;
    this.ty = 400 - p[1] * this.scale;
    this.transform();
    this.draw();
    this.onSelect([r]);
  }
  private viewportFit() {
    const box = $("svg", this.element).getBoundingClientRect();
    return Math.max(0.01, Math.min(box.width / 1000, box.height / 800));
  }
  private draw() {
    const symbolScale = 1 / (this.scale * this.viewportFit());
    const path=geoPath(this.projection);
    let background='';
    const ice=this.physical.ice?iceSnapshot(this.year,this.physical.iceScenario):null;
    if(ice){const key=`${this.scope}-${ice.scenario}-${ice.ageCalBP}`;if(!this.icePaths.has(key))this.icePaths.set(key,path(ice.geometry as any)??'');background+=`<g class="ice-context"><title>NADI-1 ${ice.scenario}: ${ice.ageCalBP.toLocaleString()} cal BP snapshot, not an interpolated boundary. See Climate sources.</title><path d="${this.icePaths.get(key)}"/></g>`;}
    for(const flow of oceanPaths){
      if(flow.kind==='wind'?!this.physical.winds:!this.physical.currents)continue;
      // Reference flows never change with the selected year, only projection.
      let d=this.flowPaths.get(flow.name);
      if(d===undefined){d=path({type:'LineString',coordinates:flow.coordinates})??'';this.flowPaths.set(flow.name,d);}
      background+=`<g class="ocean-flow flow-${flow.kind}"><title>${esc(flow.name)} — modern schematic reference, not conditions at selected year</title><path class="flow-halo" d="${d}"/><path class="flow-line" d="${d}" marker-end="url(#flow-${flow.kind})"/></g>`;
    }
    // Chronologically unresolved context remains visibly distinct from active evidence.
    const contextGroups=new Map<string,DisplayRecord[]>();
    for(const r of this.contextRecords){const key=this.geometry.get(r).contextKey;if(!key)continue;const group=contextGroups.get(key);if(group)group.push(r);else contextGroups.set(key,[r]);}
    this.contextAnchors=contextGroups;
    for(const [key,rs] of contextGroups){const p=this.geometry.get(rs[0]).contextPoint;if(!p)continue;background+=`<g data-context="${key}" class="undated-context" transform="translate(${p[0]},${p[1]})"><title>${rs.length} context records: dates unresolved; not evidence at selected year</title><circle r="${16*symbolScale}"/><text style="font-size:${12*symbolScale}px" text-anchor="middle" dy=".35em">?</text></g>`;}
    let physicalMarkers='';
    const hazards=eventsAt(this.year,this.physical.hidden,this.physical.uncertain);
    for(const event of hazards){
      const p=this.projection(event.coordinates as [number,number]);if(!p)continue;
      const symbol=event.kind==='volcano'?'▲':event.kind==='tsunami'?'≋':event.kind==='earthquake'?'ϟ':event.kind==='el-nino'?'E':'L';
      const earthquake=event.kind==='earthquake';
      physicalMarkers+=`<a data-hazard="${esc(event.id)}" href="#physical/${event.id}" class="hazard-marker hazard-${event.kind} ${isUncertainHazard(event)?'hazard-uncertain':''}" transform="translate(${p[0]},${p[1]}) scale(${symbolScale})"><title>${esc(event.title)} — ${esc(event.status)}; open catalog details</title><circle r="11"${earthquake?' style="fill:#30233c;stroke:#ffe36b"':''}/><text text-anchor="middle" dy=".35em"${earthquake?' style="fill:#fff0a6;font-size:18px"':''}>${symbol}</text></a>`;
    }
    if(!this.element.querySelector('.physical-features')){
      const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('class','physical-features');$('.world',this.element).insertBefore(g,$('.features',this.element));
      const defs=$('defs',this.element);defs.insertAdjacentHTML('beforeend',['warm','cold','wind'].map(k=>`<marker id="flow-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="${k==='warm'?'#ffb48a':k==='cold'?'#8ed8ff':'#f1df9b'}"/></marker>`).join(''));
    }
    $('.physical-features',this.element).innerHTML=background;
    const groups = new Map<string, DisplayRecord[]>();
    let arrows = "",
      overlays = "";
    for (const [index, r] of this.records.entries()) {
      if (r.overlay) {
        const o = r.overlay,
          g = o.geometry;
        if (!g) continue;
        const cls = `overlay-feature overlay-${o.kind} ${o.basis === "schematic" ? "overlay-schematic" : ""} ${this.uncertainty(r) ? "overlay-uncertain" : ""}`;
        const title = esc(
          `${r.title} — ${OVERLAY_LABELS[o.kind]}, ${o.basis}${r.linguistics ? " — " + r.linguistics.languages.map(x => x.name).join(" / ") + " — " + (r.linguistics.relationship?.kind ?? "affiliation") : ""}${isDisputed(r) ? " *" : ""}`,
        );
        const opacity = this.opacity(r);
        // Arrows are explicit editorial metadata; coordinate order alone does not establish travel.
        let directionSymbol = "";
        if (o.direction && g.type === "LineString") {
          const a = this.projection(g.coordinates[0]);
          const b = this.projection(g.coordinates[g.coordinates.length - 1]);
          if (a && b) {
            const angle = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
            const multi = o.direction === "multidirectional";
            const arrows = multi ? "M-9,0H9 M5,-4L9,0L5,4 M-5,-4L-9,0L-5,4 M0,-9V9 M-4,-5L0,-9L4,-5 M-4,5L0,9L4,5" : o.direction === "both" ? "M-9,0H9 M5,-4L9,0L5,4 M-5,-4L-9,0L-5,4" : "M-8,0H8 M3,-5L8,0L3,5";
            directionSymbol = `<g class="direction-symbol" transform="translate(${(a[0]+b[0])/2},${(a[1]+b[1])/2}) rotate(${multi ? 0 : angle + (o.direction === "reverse" ? 180 : 0)}) scale(${symbolScale})"><title>${multi ? "Multiple directions; not four literal routes" : o.direction === "both" ? "Two-way connection" : "Direction of movement"} — schematic</title><path class="direction-halo" d="${arrows}"/><path class="direction-ink" d="${arrows}"/></g>`;
          }
        }
        if (["cultural-reach", "language"].includes(o.kind) && g.type === "Point" && o.radiusKm) {
          const d = this.geometry.get(r).areaPath;
          overlays += `<g data-overlay="${index}" class="cultural-reach ${o.kind === "language" ? "language-area" : ""}" style="opacity:${opacity};--reach-color:${o.kind === "language" ? "#caa5f1" : r.culture.color}"><title>${title} — feathered illustrative area, not a surveyed border or exclusive territory</title><path d="${d}"/><path class="reach-contour" d="${d}"/>${isDisputed(r) ? `<text class="asterisk dispute-${disputeLevel(r)}" x="${this.projection(g.coordinates)![0]}" y="${this.projection(g.coordinates)![1]}" style="font-size:${20 * symbolScale}px">*</text>` : ""}</g>`;
          continue;
        }
        const anchor = this.projection(
          g.type === "Point"
            ? g.coordinates
            : g.coordinates[g.coordinates.length - 1],
        );
        const star =
          isDisputed(r) && anchor
            ? `<text class="cloud-star asterisk dispute-${disputeLevel(r)}" x="${anchor[0] + 10}" y="${anchor[1] - 12}" style="font-size:${20 / this.scale}px"><title>${esc(disputeLabel(r))}</title>*</text>`
            : "";
        if (
          ["population-history", "regional-evidence", "environment", "language"].includes(
            o.kind,
          )
        ) {
          const d =
            g.type === "LineString" ? this.geometry.get(r).path : null;
          const p = g.type === "Point" ? this.projection(g.coordinates) : null;
          overlays += `<g data-overlay="${index}" class="regional-cloud cloud-${o.kind}" style="opacity:${opacity}"><title>${title} — illustrative extent; not a site, precise route or probability boundary</title>${d ? `<path class="cloud-glow" d="${d}"/><path class="cloud-core" d="${d}"/><path class="cloud-hit" d="${d}"/>` : p ? `<circle class="cloud-glow" cx="${p[0]}" cy="${p[1]}" r="35"/><circle class="cloud-hit" cx="${p[0]}" cy="${p[1]}" r="35"/>` : ""}${star}${directionSymbol}</g>`;
          continue;
        }
        if (g.type === "Point") {
          const p = this.projection(g.coordinates);
          if (p)
            overlays += `<g data-overlay="${index}" class="${cls}" style="opacity:${opacity}" transform="translate(${p[0]},${p[1]}) scale(${symbolScale})"><title>${title}</title><circle class="overlay-hit" r="14"/><path d="${o.kind === "conflict" ? "M-7,-7 L7,7 M7,-7 L-7,7" : o.kind === "violence" ? "M-8,-8 H8 V8 H-8 Z M-6,-6 L6,6 M6,-6 L-6,6" : o.kind === "epidemic" ? "M0,-8 A8,8 0 1,1 0,8 A8,8 0 1,1 0,-8 M0,-12 V-9 M0,9 V12 M-12,0 H-9 M9,0 H12" : o.kind === "forced-removal" ? "M-8,-8 H8 V8 H-8 Z" : "M0,-9 L9,0 L0,9 L-9,0 Z"}"/>${isDisputed(r) ? `<text class="asterisk dispute-${disputeLevel(r)}" x="10" y="-9"><title>${esc(disputeLabel(r))}</title>*</text>` : ""}</g>`;
        } else {
          const d = this.geometry.get(r).path;
          if (d)
            overlays += `<g data-overlay="${index}" class="${cls}" style="opacity:${opacity}"><title>${title}</title><path d="${d}" ${o.kind === "forced-removal" ? 'marker-end="url(#arrow)"' : ""} style="stroke-width:${3 / this.scale}"/><path class="overlay-line-hit" d="${d}" style="stroke-width:${15 / this.scale}"/>${directionSymbol}</g>`;
        }
        continue;
      }
      if (!r.location) continue;
      const key = `${r.location.lon},${r.location.lat}`;
      const group = groups.get(key);
      if (group) group.push(r); else groups.set(key, [r]);
      if (r.type === "movement" && r.destination) {
        const a = this.projection([r.location.lon, r.location.lat]),
          b = this.projection([r.destination.lon, r.destination.lat]);
        if (a && b)
          arrows += `<path data-overlay="${index}" style="opacity:${this.opacity(r)}" class="movement ${r.proposalKey ? "proposal-path" : ""}" d="${this.geometry.get(r).path}" marker-end="url(#arrow)"><title>${esc(r.title)} — ${esc(r.routeKind)} connection</title></path>`;
      }
    }
    let markers = "";
    for (const [key, rows] of groups) {
      const r = rows[0],
        p = this.projection([r.location!.lon, r.location!.lat]);
      if (!p) continue;
      const possible = rows.every(
        (x) => this.uncertainty(x),
      );
      const population = this.interaction?.mode==='explore'
        ? {radius:6,outerRadius:6,unknown:false,label:'Explore size is a reference; inspect dated estimates'}
        : populationAt(rows, this.year);
      markers += `<g data-point="${key}" style="opacity:${Math.max(...rows.map((x) => this.opacity(x)))}" class="site ${possible ? "possible" : ""} ${rows.some((x) => x.proposalKey) ? "proposal-point" : ""}" transform="translate(${p[0]},${p[1]}) scale(${symbolScale})"><title>${esc(rows.map((x) => x.title + " — " + x.culture.name + " — " + timeLabel(x.time)).join("; "))} — ${esc(population.label)}${possible ? " — uncertain time" : ""}${rows.some(x => guideForRecord(x.id)) ? " — Site guide available" : ""}</title>${rows.some(x => guideForRecord(x.id)) ? `<text class="site-guide-marker" x="-17" y="17" aria-hidden="true">◈</text>` : ""}<circle class="site-halo" r="${Math.max(13, population.outerRadius + 4)}"/>${population.outerRadius > population.radius ? `<circle class="population-range" r="${population.outerRadius}" style="fill:${r.culture.color}"/>` : ""}<circle class="site-dot" r="${population.radius}" style="--site-color:${r.culture.color}"/>${population.unknown ? `<circle class="population-unknown" r="${population.radius}" fill="url(#population-unknown)"/>` : ""}${this.scale >= 32 ? `<text class="settlement-label" x="${population.outerRadius + 5}" y="4">${esc(r.location!.name)}</text>` : ""}${rows.length > 1 ? `<text class="site-count" x="11" y="-8">${rows.length}</text>` : ""}${rows.some(isDisputed) ? `<text class="site-star asterisk dispute-${rows.some((x) => disputeLevel(x) === "disputed") ? "disputed" : "discussion"}" x="-13" y="-8">*</text>` : ""}</g>`;
    }
    $(".features", this.element).innerHTML = overlays + arrows + markers + physicalMarkers;
    // Rebuild catalog-only tooltip lookup with the rendered feature identities.
    // Retain hover across a redraw only when the same records remain visible.
    this.tips.clear();
    const hazardById=new Map(hazards.map(event=>[event.id,event]));
    let hoveredFeature:SVGElement|null=null;
    for(const feature of this.element.querySelectorAll<SVGElement>('[data-point],[data-overlay],[data-context],[data-hazard]')){
      let rows:DisplayRecord[]=[],content:MapTooltipContent|null=null,key='';
      if(feature.dataset.hazard){
        const event=hazardById.get(feature.dataset.hazard);
        if(event){content=tooltipForHazard(event);key='hazard:'+event.id;}
      }else{
        if(feature.dataset.context!==undefined)rows=this.contextAnchors.get(feature.dataset.context)??[];
        else if(feature.dataset.overlay!==undefined){const row=this.records[Number(feature.dataset.overlay)];if(row)rows=[row];}
        else rows=groups.get(feature.dataset.point!)??[];
        content=tooltipForRecords(rows,this.interaction?.mode??'movie',this.year);
        key=(feature.dataset.context!==undefined?'context:':'records:')+JSON.stringify(rows.map(row=>JSON.stringify([row.id,row.proposalKey??null])).sort());
      }
      if(!content)continue;
      feature.dataset.mapTip=key;
      feature.setAttribute('aria-label',content.title+'. '+content.summary+' '+content.dates);
      this.tips.set(key,content);
      if(this.hovered?.key===key)hoveredFeature=feature;
    }
    if(this.hovered&&hoveredFeature){
      const {key,x,y}=this.hovered;this.tooltip.show(this.tips.get(key)!,{x,y},hoveredFeature);
    }else this.hideTooltip();
  }
}
