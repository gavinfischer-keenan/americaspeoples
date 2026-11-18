import {changeCaption,densityGroups,placeChange,type DensityAnchor} from './map-density';
import {terrainHTML,intersectsView,type ViewBounds} from './terrain';
import { mapProjection, type MapScope } from "./map-projection";
import { geoPath, geoGraticule10 } from "d3-geo";
import { MapGeometry } from "./map-geometry";
import {pickCandidates,type HitCandidate,type MapPoint} from './map-picking';
import {clampZoom,fitMapBounds,geographicCenter} from './map-viewport';
import { boundariesAt } from './boundaries';
import {routeEndpointLabels,routeDirectionLabels} from './map-route-labels';
import { guideForRecord } from "./site-guides";
import { populationAt } from "./population";
import type { DisplayRecord } from "./model";
import { temporalState, temporalOpacity, formatYear, timeLabel, isDisputed, END_YEAR } from "./time";
import { OVERLAY_LABELS } from "./overlays";
import { esc, $ } from "./dom";
import { disputeLevel } from "./disputes";
import {placeGroups,placeKey} from "./map-place-groups";
import { boundsInViewport } from "./map-filters";
import { historyState, historyOpacity, historyLabel } from './history';
import {iceSnapshot,eventsAt,oceanPaths,isUncertainHazard} from './physical';
import {MapTooltip,tooltipForRecords,tooltipForHazard,type MapTooltipContent,type MapMode} from './map-tooltip';
import { AtlasContext } from './atlas-context';
export interface MapInteraction {mode:MapMode;playing:boolean;onPause:()=>void}
export interface PhysicalOptions {ice:boolean; iceScenario:string; currents:boolean; winds:boolean; hidden:ReadonlySet<string>; uncertain:boolean}
export interface MapCamera {scope:MapScope;center:MapPoint;pixelScale:number;rotation:[number,number,number]}
const compactPlaceName=(name:string)=>name.length<=40?name:name.slice(0,39).trimEnd()+'…';
export class MapView {
  readonly context=new AtlasContext();
  readonly element = document.createElement("div");
  private densityPreference:'compact'|'standard'|'detailed'='standard';
  private terrainKey="";
  private scope: MapScope = "americas";
  private width=1000;
  private height=800;
  private hasViewport=false;
  private projection = mapProjection(this.scope);
  private geometry = new MapGeometry(this.projection);
  private viewportFrame: number | null = null;
  private viewportDrawPending=false;
  private resizeObserver:ResizeObserver;
  private scale = 1;
  private tx = 0;
  private ty = 0;
  private records: DisplayRecord[] = [];
  private contextRecords: DisplayRecord[] = [];
  private contextAnchors=new Map<string,DisplayRecord[]>();
  private places=new Map<string,DisplayRecord[]>();
  private drawnPoints=new Map<string,DisplayRecord[]>();
  private physical:PhysicalOptions={ice:false,iceScenario:'optimal',currents:false,winds:false,hidden:new Set(),uncertain:true};
  private icePaths=new Map<string,string>();
  private flowPaths=new Map<string,string>();
  private year = END_YEAR;
  private highlighted=new Set<string>();
  private focusTargets:{feature:SVGElement;rows:DisplayRecord[]}[]=[];
  private interaction:MapInteraction|null=null;
  private readonly tooltip=new MapTooltip();
  private tips=new Map<string,MapTooltipContent>();
  private hovered:{key:string;x:number;y:number}|null=null;
  constructor(
    private land: any,
    private onSelect: (rows: DisplayRecord[]) => void,
    private onViewportChange: () => void = () => {},
  ) {
    this.element.className = "map-canvas";
    const path = geoPath(this.projection);
    this.element.innerHTML = `<svg viewBox="0 0 1000 800" role="img" aria-label="Map of the Americas and Pacific. Use the visible records list for keyboard access to evidence." tabindex="0"><defs><pattern id="population-unknown" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V5" stroke="#fff" stroke-width="1.8" opacity=".8"/></pattern><radialGradient id="reach-fade"><stop offset="0%" stop-color="white" stop-opacity=".35"/><stop offset="40%" stop-color="white" stop-opacity=".22"/><stop offset="100%" stop-color="white" stop-opacity="0"/></radialGradient><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#e5c78c"/></marker></defs><g class="world"><path class="graticule" d="${path(geoGraticule10())}"/><path class="land" d="${path(land)}"/><clipPath id="terrain-land-clip"><path class="terrain-land-mask" d="${path(land)}"/></clipPath><g class="terrain" clip-path="url(#terrain-land-clip)" aria-hidden="true"></g><g class="map-labels">${this.labels()}</g><g class="features"></g></g></svg><div class="map-controls"><label class="map-scope">Map region<select aria-label="Map region"><option value="pacific">Asia-Pacific / Americas</option><option value="americas">Americas focus</option><option value="atlantic">Atlantic connections</option><option value="world">Whole world</option></select></label><details class="map-density-options"><summary>Map detail</summary><label>Place grouping<select aria-label="Place grouping"><option value="compact">Compact</option><option value="standard" selected>Standard</option><option value="detailed">Detailed</option></select></label></details><button data-zoom="in" aria-label="Zoom in">+</button><button data-zoom="out" aria-label="Zoom out">−</button><button data-zoom="reset" aria-label="Reset map view">⌖</button></div><div class="map-caption">Modern relief & coastlines · Not a reconstruction for this date<br>Natural Earth + USGS 3DEP · Public domain<br>Place references: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors · ODbL</a></div>`;
    const svg = $<SVGSVGElement>("svg", this.element);
    $('defs',this.element).insertAdjacentHTML('beforeend',[['migration','#ffba64'],['exchange','#62e4e9'],['forced','#ff85c5']].map(([kind,color])=>`<marker id="corridor-${kind}" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="3.4" markerHeight="3.4" orient="auto-start-reverse"><path d="M1,1L11,6L1,11L3,6Z" fill="${color}" stroke="#132934" stroke-width="1.1" stroke-linejoin="round"/></marker>`).join(''));
    svg.setAttribute('role','group');
    svg.setAttribute('aria-roledescription','interactive map');
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
      this.setInteraction({...this.interaction,playing:false});
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
    this.element.querySelector('.map-density-options select')!.addEventListener('change',event=>{
      this.densityPreference=(event.target as HTMLSelectElement).value as typeof this.densityPreference;
      this.draw();
    });
    let drag: { x: number; y: number; tx: number; ty: number } | null = null;
    const pointers=new Map<number,MapPoint>();
    let pinch:{distance:number;scale:number;world:MapPoint}|null=null;
    let moved = false;
    svg.addEventListener("pointerdown", (e) => {
      if(e.button!==0)return;
      this.hideTooltip();
      const point=this.clientPoint(e.clientX,e.clientY);
      pointers.set(e.pointerId,point);
      if(pointers.size===1){moved=false;drag={x:point[0],y:point[1],tx:this.tx,ty:this.ty};}
      else if(pointers.size===2){
        const [a,b]=[...pointers.values()],mid:MapPoint=[(a[0]+b[0])/2,(a[1]+b[1])/2];
        pinch={distance:Math.hypot(a[0]-b[0],a[1]-b[1]),scale:this.scale,world:[(mid[0]-this.tx)/this.scale,(mid[1]-this.ty)/this.scale]};
        moved=true;drag=null;
      }
    });
    svg.addEventListener("pointermove", (e) => {
      if(!pointers.has(e.pointerId))return;
      if(e.buttons===0&&e.pointerType!=='touch'){pointers.delete(e.pointerId);drag=null;return;}
      const point=this.clientPoint(e.clientX,e.clientY);pointers.set(e.pointerId,point);
      if(pinch&&pointers.size===2){
        const [a,b]=[...pointers.values()],mid:MapPoint=[(a[0]+b[0])/2,(a[1]+b[1])/2];
        this.scale=clampZoom(pinch.scale*Math.hypot(a[0]-b[0],a[1]-b[1])/Math.max(1,pinch.distance));
        this.tx=mid[0]-pinch.world[0]*this.scale;this.ty=mid[1]-pinch.world[1]*this.scale;
        this.transform();this.draw();return;
      }
      if(!drag)return;
      const dx = point[0] - drag.x,
        dy = point[1] - drag.y;
      moved ||= Math.abs(dx) + Math.abs(dy) > 4;
      if (!moved) return;
      if (!svg.hasPointerCapture(e.pointerId))
        svg.setPointerCapture(e.pointerId);
      this.tx = drag.tx + dx;
      this.ty = drag.ty + dy;
      this.transform();
    });
    const endPointer=(e:PointerEvent)=>{pointers.delete(e.pointerId);drag=null;pinch=null;};
    svg.addEventListener("pointerup",endPointer);
    svg.addEventListener("pointercancel",endPointer);
    this.resizeObserver=new ResizeObserver(() => {
      if (this.element.isConnected) {
        this.resize();
      }
    });
    this.resizeObserver.observe(this.element);
    svg.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.zoom(Math.exp(-Math.max(-150,Math.min(150,e.deltaY))*.0025),this.clientPoint(e.clientX,e.clientY));
      },
      { passive: false },
    );
    svg.addEventListener("keydown", (e) => {
      if((e.key==='Enter'||e.key===' ')&&e.target!==svg){
        const feature=(e.target as Element).closest<SVGElement>('[data-point],[data-overlay],[data-context]');
        if(feature){e.preventDefault();if(this.interaction?.mode==='movie'&&this.interaction.playing){this.interaction.onPause();return;}this.activateFeature(feature);return;}
      }
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
      if (target?.dataset.zoom) {
        if (target.dataset.zoom === "reset") {
          this.resetView();
        } else this.zoom(target.dataset.zoom === "in" ? 1.35 : 1 / 1.35);
      } else if (!moved&&svg.contains(e.target as Node)) {
        if(target?.hasAttribute('data-density-group')){this.activateFeature(target);return;}
        const rows=e.detail===0&&target?this.featureRows(target):this.pick(this.clientPoint(e.clientX,e.clientY),(e as PointerEvent).pointerType==='touch');
        if(rows.length){e.preventDefault();this.selectRows(rows);}
      }
    });
  }
  setInteraction(interaction:MapInteraction):void{
    const changed=this.interaction?.mode!==interaction.mode||this.interaction?.playing!==interaction.playing;
    this.interaction=interaction;
    if(changed)this.draw();
  }
  private hideTooltip(){this.hovered=null;this.tooltip.hide();}
  /** Route owners can clear body-mounted hover content when reusing this map. */
  clearHover():void{this.hideTooltip();}
  camera():MapCamera{
    const [x,y]=this.projection.translate(), k=this.projection.scale();
    // Normalized projected center also works when a user pans outside the globe.
    return {scope:this.scope,center:[((this.width/2-this.tx)/this.scale-x)/k,((this.height/2-this.ty)/this.scale-y)/k],pixelScale:k*this.scale,rotation:this.projection.rotate()};
  }
  restoreCamera(camera:MapCamera):void{
    this.resize(false);this.scope=camera.scope;this.rebuildProjection(camera.rotation);
    this.scale=clampZoom(camera.pixelScale/this.projection.scale());
    const [x,y]=this.projection.translate(),k=this.projection.scale();
    this.tx=this.width/2-(x+camera.center[0]*k)*this.scale;this.ty=this.height/2-(y+camera.center[1]*k)*this.scale;
    this.transform();this.draw();
  }
  dispose():void{this.clearHover();this.resizeObserver.disconnect();if(this.viewportFrame!==null)cancelAnimationFrame(this.viewportFrame);this.element.remove();}
  setDetailedLand(land:any):void{this.land=land;$('.land',this.element).setAttribute('d',geoPath(this.projection)(land)??'');$('.terrain-land-mask',this.element).setAttribute('d',geoPath(this.projection)(land)??'');}
  refreshContext():void{
    let group=this.element.querySelector<SVGGElement>('.historical-context');
    if(!group){group=document.createElementNS('http://www.w3.org/2000/svg','g');group.setAttribute('class','historical-context');group.setAttribute('aria-hidden','true');$('.world',this.element).insertBefore(group,$('.features',this.element));}
    group.innerHTML=this.context.draw(this.projection,this.year,this.scale,false,this.viewBounds());
    // Journeys sit above translucent evidence areas without intercepting clicks.
    let journeys=this.element.querySelector<SVGGElement>('.journey-context');
    if(!journeys){journeys=document.createElementNS('http://www.w3.org/2000/svg','g');journeys.setAttribute('class','journey-context');journeys.setAttribute('aria-hidden','true');$('.world',this.element).append(journeys);}
    journeys.replaceChildren(...Array.from(group.querySelectorAll('.voyage-tracks')));
    this.declutterLabels();
  }
  refreshVoyage():void{const group=this.element.querySelector('.voyage-tracks');if(group)group.outerHTML=this.context.draw(this.projection,this.year,this.scale,true,this.viewBounds());}
  private opacity(r:DisplayRecord){return this.interaction?.mode==='explore'?1:historyOpacity(r,this.year)??temporalOpacity(r.time,this.year);}
  private uncertainty(r:DisplayRecord):boolean{
    if(this.interaction?.mode!=='explore')return temporalState(r.time,this.year)==='possible';
    const time=r.time;
    if(time.kind==='unplaced'||time.start===null||time.end===null)return false;
    return !!time.approximate || (time.kind==='occurrence'&&time.start!==time.end) ||
      (time.certainStart!==undefined&&time.certainEnd!==undefined&&
        (time.certainStart>time.start||time.certainEnd<time.end));
  }
  private labels() {
    if(this.scale>4||this.records.some(r=>this.highlighted.has(r.id)&&(r.history?.kind==='migration'||r.history?.kind==='exchange')))return '';
    return [['NORTH AMERICA',-105,50],['SOUTH AMERICA',-62,-20],['EUROPE',15,53],['AFRICA',20,8],['ATLANTIC',-35,12],['PACIFIC',-140,-5],['ISLAND ASIA',130,5],['AUSTRALIA',134,-25]].map(([name,lon,lat])=>{const p=this.projection([Number(lon),Number(lat)]);return p?`<text x="${p[0]}" y="${p[1]}" style="font-size:${10/this.scale}px">${name}</text>`:'';}).join('');
  }
  overview(scope:MapScope="americas"){this.scope=scope;if(this.element.isConnected)this.resize(false);this.resetView();}
  setScope(scope: MapScope, redraw = true) {
    if (scope === this.scope) return;
    this.scope = scope;
    this.resetView(redraw);
  }
  private rebuildProjection(rotation?:[number,number,number],extra:DisplayRecord[]=[]){
    this.projection=mapProjection(this.scope,this.width,this.height);
    if(rotation)this.projection.rotate(rotation);
    this.terrainKey="";
    this.geometry.setProjection(this.projection);
    this.flowPaths.clear();
    this.icePaths.clear();
    this.geometry.update([...this.records, ...this.contextRecords,...extra]);
    const path = geoPath(this.projection);
    $(".land", this.element).setAttribute("d", path(this.land) ?? "");
    $(".terrain-land-mask",this.element).setAttribute("d",path(this.land)??"");
    $(".graticule", this.element).setAttribute("d", path(geoGraticule10()) ?? "");
    $(".map-labels", this.element).innerHTML = this.labels();
    ($(".map-scope select", this.element) as HTMLSelectElement).value = this.scope;
  }
  private resetView(redraw=true){
    this.scale=1;this.tx=this.ty=0;
    this.rebuildProjection();
    this.transform();
    if (redraw) this.draw();
  }
  private resize(redraw=true){
    const box=$('svg',this.element).getBoundingClientRect();
    const width=Math.max(1,Math.round(box.width)),height=Math.max(1,Math.round(box.height));
    if(box.width<1||box.height<1)return;
    if(width===this.width&&height===this.height){this.hasViewport=true;if(redraw){this.draw();this.notifyViewportChange();}return;}
    const center=this.projection.invert!([(this.width/2-this.tx)/this.scale,(this.height/2-this.ty)/this.scale]);
    const pixelScale=this.projection.scale()*this.scale,rotation=this.projection.rotate();
    this.width=width;this.height=height;
    $('svg',this.element).setAttribute('viewBox',`0 0 ${width} ${height}`);
    this.rebuildProjection(rotation);
    if(this.hasViewport)this.scale=clampZoom(pixelScale/this.projection.scale());
    this.hasViewport=true;
    const p=center?this.projection(center):null;
    if(p){this.tx=width/2-p[0]*this.scale;this.ty=height/2-p[1]*this.scale;}
    this.transform();if(redraw)this.draw();
  }
  private clientPoint(x:number,y:number):MapPoint{
    const svg=$<SVGSVGElement>('svg',this.element),matrix=svg.getScreenCTM();
    if(!matrix)return [x,y];
    const p=new DOMPoint(x,y).matrixTransform(matrix.inverse());return [p.x,p.y];
  }
  private zoom(factor: number,anchor:MapPoint=[this.width/2,this.height/2]) {
    const old = this.scale;
    this.scale = clampZoom(this.scale * factor);
    if (this.scale === old) return;
    const ratio = this.scale / old;
    this.tx = anchor[0] - (anchor[0] - this.tx) * ratio;
    this.ty = anchor[1] - (anchor[1] - this.ty) * ratio;
    this.transform();
    this.draw();
  }
  private transform() {
    this.viewportDrawPending=true;
    this.hideTooltip();
    const [[x0,y0],[x1,y1]]=geoPath(this.projection).bounds({type:'Sphere'});
    this.tx=Math.max(48-x1*this.scale,Math.min(this.width-48-x0*this.scale,this.tx));
    this.ty=Math.max(48-y1*this.scale,Math.min(this.height-48-y0*this.scale,this.ty));
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
      if (this.element.isConnected) {if(this.viewportDrawPending)this.draw();this.onViewportChange();}
    });
  }
  private updateTabStops(){
    for(const {feature,rows} of this.focusTargets){
      const visible=rows.some(r=>{const shape=this.geometry.get(r),bounds=r.time.kind==='unplaced'?shape.contextBounds:shape.bounds;return !!bounds&&boundsInViewport(bounds,this.scale,this.tx,this.ty,this.width,this.height);});
      feature.setAttribute('tabindex',visible?'0':'-1');
    }
  }
  /** Keep selected names readable; only optional labels may yield to a collision. */
  private declutterLabels(){
    const viewport=$('svg',this.element).getBoundingClientRect();
    if(!viewport.width||!viewport.height)return;
    const labels=[...this.element.querySelectorAll<SVGTextElement>('.settlement-label,.history-place-label,.route-endpoint-label text,.route-direction-label text,.community-name,.change-caption,.boundary-label')].map(label=>({label,selected:!!label.closest('.is-highlighted,.route-endpoint-label'),bounds:label.getBoundingClientRect()}));
    const priority=(entry:typeof labels[number])=>entry.label.classList.contains('change-caption')?1:entry.selected?2:0;
    labels.sort((a,b)=>priority(b)-priority(a));
    const placed:DOMRect[]=[...this.element.querySelectorAll('.map-controls,.map-caption,.community-glyph,.site-dot,.settlement-symbol,.wreck-symbol')].map(node=>node.getBoundingClientRect());
    let communityNames=0,changeCaptions=0;
    for(const {label,selected,bounds} of labels){
      const visible=bounds.right>=viewport.left&&bounds.left<=viewport.right&&bounds.bottom>=viewport.top&&bounds.top<=viewport.bottom;
      const caption=label.classList.contains('change-caption');
      const limited=caption&&changeCaptions>=2||label.classList.contains('community-name')&&communityNames>=((this.scale<6?6:14)*({compact:.65,standard:1,detailed:1.45}[this.densityPreference]));
      const collides=limited||placed.some(other=>bounds.left<other.right+6&&bounds.right>other.left-6&&bounds.top<other.bottom+4&&bounds.bottom>other.top-4);
      const show=(!caption&&selected)||(visible&&!collides);
      label.style.visibility=show?'visible':'hidden';
      if(visible&&show){placed.push(bounds);if(caption)changeCaptions++;if(label.classList.contains('community-name'))communityNames++;}
    }
  }
  /** Same projected geometry and transform as the map; unmapped records stay out. */
  visibleRecords(): DisplayRecord[] {
    return this.recordsInView(this.records);
  }
  visibleBoundaries(){
    if(!this.context.options.boundaries)return [];
    return boundariesAt(this.context.boundaries,this.year).filter(b=>(b.detail!=='regional'||this.scale>=4)&&this.context.projectedBounds(b,this.projection).some(bounds=>boundsInViewport(bounds,this.scale,this.tx,this.ty,this.width,this.height)));
  }
  visibleContextRecords():DisplayRecord[]{return this.recordsInView(this.contextRecords, true);}
  localChronology(records:DisplayRecord[]):DisplayRecord[]{
    if(this.scale<80)return [];
    return records.filter(r=>{
      if(!r.location||r.time.start===null||!(r.type==='occupation'||r.history?.kind==='habitation'||r.history?.kind==='settlement'||r.history?.kind==='attestation'||['conflict','violence','forced-removal'].includes(r.overlay?.kind??'')))return false;
      const p=this.projection([r.location.lon,r.location.lat]);return p&&boundsInViewport([p,p],this.scale,this.tx,this.ty,this.width,this.height);
    });
  }
  private viewBounds(padding=48):ViewBounds{return [[(-this.tx-padding)/this.scale,(-this.ty-padding)/this.scale],[(this.width-this.tx+padding)/this.scale,(this.height-this.ty+padding)/this.scale]];}
  private recordsInView(records:DisplayRecord[], context = false):DisplayRecord[]{
    return records.filter(r => {
      const shape = this.geometry.get(r);
      const bounds = context ? shape.contextBounds : shape.bounds;
      return !!bounds && boundsInViewport(bounds, this.scale, this.tx, this.ty,this.width,this.height);
    });
  }
  update(records: DisplayRecord[], year: number, context:DisplayRecord[]=[],physical?:PhysicalOptions) {
    this.records = records;
    this.places=placeGroups(records);
    this.contextRecords=context;
    this.geometry.update([...records, ...context]);
    if(physical)this.physical=physical;
    this.year = year;
    this.draw();
  }
  focus(r: DisplayRecord) {
    if(!r.location&&!r.overlay?.geometry)return;
    this.focusRecords([r]);
    this.onSelect([r]);
  }
  /** Story framing does not change selection. Zoom is relative to the chosen scope. */
  focusRegion(center:MapPoint,zoom:number,scope:MapScope=this.scope):void{
    if(this.element.isConnected)this.resize(false);
    this.scope=scope;this.rebuildProjection([-center[0],0,0]);
    this.scale=clampZoom(zoom);
    const p=this.projection(center);if(!p)return;
    this.tx=this.width/2-p[0]*this.scale;this.ty=this.height/2-p[1]*this.scale;
    this.transform();this.draw();
  }
  /** Fit every supplied place/route/area; no callback so the inspector can own selection. */
  focusRecords(records:DisplayRecord[]):void{
    if(this.element.isConnected)this.resize(false);
    const points:MapPoint[]=records.flatMap(r=>{
      const g=r.overlay?.geometry;
      return g?.type==='Point'?[g.coordinates]:g?.type==='LineString'?g.coordinates:[r.location,r.destination].flatMap(p=>p?[[p.lon,p.lat] as MapPoint]:[]);
    });
    if(!points.length)return;
    const center=geographicCenter(points);this.rebuildProjection([-center[0],0,0],records);
    const boxes=records.map(r=>this.geometry.get(r).bounds).filter((b):b is [MapPoint,MapPoint]=>!!b&&b.flat().every(Number.isFinite));
    if(!boxes.length)return;
    const bounds:[MapPoint,MapPoint]=[[Math.min(...boxes.map(b=>b[0][0])),Math.min(...boxes.map(b=>b[0][1]))],[Math.max(...boxes.map(b=>b[1][0])),Math.max(...boxes.map(b=>b[1][1]))]];
    const fit=fitMapBounds(bounds,this.width,this.height,Math.min(64,this.width*.12,this.height*.15),this.projection.scale()*Math.PI/180*.035);
    this.scale=fit.scale;this.tx=fit.tx;this.ty=fit.ty;
    this.highlighted=new Set(records.map(r=>r.id));this.transform();this.draw();
  }
  setHighlighted(ids:string[]):void{this.highlighted=new Set(ids);this.draw();}
  private featureRows(feature:Element):DisplayRecord[]{
    const element=feature as SVGElement;
    if(element.dataset.context!==undefined)return this.contextAnchors.get(element.dataset.context)??[];
    if(element.dataset.overlay!==undefined){
      const record=this.records[Number(element.dataset.overlay)];if(!record)return [];
      return this.places.get(placeKey(record)??"none")??[record];
    }
    if(element.dataset.point!==undefined)return this.drawnPoints.get(element.dataset.point)??[];
    return [];
  }
  private activateFeature(feature:Element){
    const rows=this.featureRows(feature);
    if(feature.hasAttribute('data-density-group')&&this.scale<2048){
      this.focusRecords(rows);
      this.onSelect(rows);
    }else this.selectRows(rows);
  }
  private selectRows(rows:DisplayRecord[]){
    if(!rows.length)return;
    this.highlighted=new Set(rows.map(r=>r.id));this.draw();this.onSelect(rows);
  }
  private pick(point:MapPoint,touch=false):DisplayRecord[]{
    const screen=(p:MapPoint):MapPoint=>[p[0]*this.scale+this.tx,p[1]*this.scale+this.ty];
    const candidates:HitCandidate<DisplayRecord>[]=[];
    for(const r of this.records){
      const shape=this.geometry.get(r),key=JSON.stringify([r.id,r.proposalKey??null]),g=r.overlay?.geometry;
      const broad=r.overlay&&['population-history','regional-evidence','environment','language','cultural-reach'].includes(r.overlay.kind);
      if(shape.areaRings.length){candidates.push({key,value:r,kind:'area',rings:shape.areaRings.map(line=>line.map(screen))});continue;}
      if(broad&&g?.type==='Point'&&shape.point){candidates.push({key,value:r,kind:'area',point:screen(shape.point),radius:35*this.scale});continue;}
      if(shape.lines.length)candidates.push({key,value:r,kind:broad?'area':'route',lines:shape.lines.map(line=>line.map(screen)),...(broad?{radius:30*this.scale}:{})});
      if(shape.point&&!shape.lines.length)candidates.push({key,value:r,kind:'place',point:screen(shape.point)});
      else if(!r.overlay&&shape.point)candidates.push({key,value:r,kind:'place',point:screen(shape.point)});
    }
    for(const r of this.contextRecords){const p=this.geometry.get(r).contextPoint;if(p)candidates.push({key:JSON.stringify([r.id,r.proposalKey??null]),value:r,kind:'context',point:screen(p)});}
    return pickCandidates(candidates,point,touch);
  }
  private viewportFit() {
    const box = $("svg", this.element).getBoundingClientRect();
    return Math.max(0.01, Math.min(box.width / this.width, box.height / this.height));
  }
  /** Separate identical/reversed schematic paths by at most five screen pixels.
   * Projection, source coordinates and coordinate-based hit testing stay intact.
   */
  private routeLanes(symbolScale:number):Map<DisplayRecord,MapPoint>{
    const groups=new Map<string,{rows:DisplayRecord[];coordinates:MapPoint[]}>();
    for(const r of this.records){
      const g=r.overlay?.geometry;
      if((r.history?.kind!=='migration'&&r.history?.kind!=='exchange')||g?.type!=='LineString'||g.coordinates.length<2)continue;
      const forward=JSON.stringify(g.coordinates),reverse=JSON.stringify([...g.coordinates].reverse()),key=forward<reverse?forward:reverse;
      const group=groups.get(key);
      if(group)group.rows.push(r);else groups.set(key,{rows:[r],coordinates:forward===key?g.coordinates:[...g.coordinates].reverse()});
    }
    const offsets=new Map<DisplayRecord,MapPoint>();
    for(const {rows,coordinates} of groups.values()){
      if(rows.length<2)continue;
      const a=this.projection(coordinates[0]),b=this.projection(coordinates[coordinates.length-1]);if(!a||!b)continue;
      const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);if(length<.001)continue;
      rows.sort((a,b)=>a.id.localeCompare(b.id)||(a.proposalKey??'').localeCompare(b.proposalKey??''));
      rows.forEach((r,i)=>{const offset=(i/(rows.length-1)-.5)*10*symbolScale;offsets.set(r,[-dy/length*offset,dx/length*offset]);});
    }
    return offsets;
  }
  private draw() {
    this.viewportDrawPending=false;
    // Schematic regional rings can be millions of pixels around at local zoom.
    // Keep their context, but avoid rasterizing hundreds of thousands of dashes.
    this.element.classList.toggle('local-detail',this.scale>=80);
    const viewport=this.viewBounds(),terrain=terrainHTML(this.projection,this.scale,viewport);
    if(this.terrainKey!==terrain){$(".terrain",this.element).innerHTML=terrain;this.terrainKey=terrain;}
    const focusedElement=document.activeElement instanceof SVGElement&&this.element.contains(document.activeElement)?document.activeElement:null;
    const focused=focusedElement?.dataset.mapTip;
    const focusedRows=focusedElement?this.featureRows(focusedElement):[];
    const focusedId=focusedRows.length===1?focusedRows[0].id:null;
    const symbolScale = 1 / (this.scale * this.viewportFit());
    const playing=this.interaction?.mode==='movie'&&this.interaction.playing;
    this.element.classList.toggle('density-playing',!!playing);
    this.element.classList.toggle('density-overview',this.scale<6);
    const lanes=this.routeLanes(symbolScale);
    $('.map-labels',this.element).innerHTML=this.labels();
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
    for(const r of this.contextRecords){const shape=this.geometry.get(r),key=shape.contextKey;if(!key||!shape.contextBounds||!intersectsView(shape.contextBounds,viewport))continue;const group=contextGroups.get(key);if(group)group.push(r);else contextGroups.set(key,[r]);}
    this.contextAnchors=contextGroups;
    for(const [key,rs] of contextGroups){const p=this.geometry.get(rs[0]).contextPoint;if(!p)continue;background+=`<g data-context="${key}" class="undated-context" transform="translate(${p[0]},${p[1]})"><title>${rs.length} context records: dates unresolved; not evidence at selected year</title><circle r="${16*symbolScale}"/><text style="font-size:${12*symbolScale}px" text-anchor="middle" dy=".35em">?</text></g>`;}
    let physicalMarkers='';
    const hazards=eventsAt(this.year,this.physical.hidden,this.physical.uncertain);
    for(const event of hazards){
      const p=this.projection(event.coordinates as [number,number]);if(!p||!intersectsView([p,p],viewport))continue;
      const symbol=event.kind==='volcano'?'▲':event.kind==='tsunami'?'≋':event.kind==='earthquake'?'ϟ':event.kind==='el-nino'?'E':'L';
      const earthquake=event.kind==='earthquake';
      physicalMarkers+=`<a data-hazard="${esc(event.id)}" href="#physical/${event.id}" class="hazard-marker hazard-${event.kind} ${isUncertainHazard(event)?'hazard-uncertain':''}" transform="translate(${p[0]},${p[1]}) scale(${symbolScale})"><title>${esc(event.title)} — ${esc(event.status)}; open catalog details</title><circle r="11"${earthquake?' style="fill:#30233c;stroke:#ffe36b"':''}/><text text-anchor="middle" dy=".35em"${earthquake?' style="fill:#fff0a6;font-size:18px"':''}>${symbol}</text></a>`;
    }
    if(!this.element.querySelector('.physical-features')){
      const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('class','physical-features');$('.world',this.element).insertBefore(g,$('.features',this.element));
      const defs=$('defs',this.element);defs.insertAdjacentHTML('beforeend',['warm','cold','wind'].map(k=>`<marker id="flow-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="${k==='warm'?'#ffb48a':k==='cold'?'#8ed8ff':'#f1df9b'}"/></marker>`).join(''));
    }
    $('.physical-features',this.element).innerHTML=background;
    this.refreshContext();
    const groups = new Map<string, DisplayRecord[]>();
    this.drawnPoints=groups;
    let endpointLabels='';
    const labeledEndpoints=new Set<string>();
    let arrows = "",
      overlays = "";
    const groupedKeys=new Set<string>();
    const anchors:DensityAnchor[]=[];
    const screenBounds=this.viewBounds(0);
    const journey=this.context.voyages.find(voyage=>voyage.id===this.context.options.voyageId);
    const journeyStops=new Set(journey?.stops.map(stop=>stop.recordId));
    const band=2**(Math.round(2*Math.log2(this.scale))/2)*this.viewportFit();
    for(const [key,rows] of this.places){
      const p=this.projection(key.split(',').map(Number) as MapPoint);
      if(!p||!intersectsView([p,p],viewport))continue;
      const states=rows.map(row=>historyState(row,this.year));
      anchors.push({key,x:p[0]*band,y:p[1]*band,inView:intersectsView([p,p],screenBounds),active:states.filter(state=>state==='active').length,
        prior:states.filter(state=>['past-place','founded','loss'].includes(state)).length,
        protectedPoint:rows.some(row=>(this.highlighted.has(row.id)||journeyStops.has(row.id)||row.id===focusedId))});
    }
    let communities='';
    const spacing=(this.scale<6?52:this.scale<80?36:25)*({compact:1.3,standard:1,detailed:.76}[this.densityPreference]);
    for(const group of densityGroups(anchors,spacing)){
      if(group.members.length===1)continue;
      const rows=group.members.flatMap(member=>this.places.get(member.key)!);
      for(const member of group.members)groupedKeys.add(member.key);
      groups.set(group.key,rows);
      const anchorRow=this.places.get(group.anchor.key)![0];
      const name=compactPlaceName((anchorRow.location?.name??anchorRow.title).split(/ [—–] /)[0]);
      const p=this.projection(group.anchor.key.split(',').map(Number) as MapPoint)!;
      const hasHabitation=rows.some(row=>historyState(row,this.year)==='active'&&row.history?.kind==='habitation'&&!placeChange(row.history,this.year));
      const glyph=(hasHabitation&&this.interaction?.mode!=='explore')?'M-9,5V-2l4-4 4,4V5ZM0,5V-4l4-4 5,5V5Z':'M-8,1l4-4 4,4-4,4ZM0,-2l4-4 4,4-4,4Z';
      communities+=`<g data-point="${group.key}" data-density-group="${group.members.length}" data-active="${group.active}" data-prior="${group.prior}" data-anchor-name="${esc(name)}" class="community-group ${group.active||this.interaction?.mode==='explore'?'':'community-context'}" transform="translate(${p[0]},${p[1]}) scale(${symbolScale})"><circle class="community-hit" r="15"/><path class="community-glyph" d="${glyph}"/><text class="community-count" x="10" y="-6">${group.members.length}</text><text class="community-name" x="18" y="11">Near ${esc(name)}</text></g>`;
    }
    for (const [index, r] of this.records.entries()) {
      const locationKey=placeKey(r);
      if(locationKey&&groupedKeys.has(locationKey))continue;
      const colocated=this.places.get(locationKey??"none");
      if(colocated&&colocated[0]!==r)continue;
      const bounds=this.geometry.get(r).bounds;if(!bounds||!intersectsView(bounds,viewport))continue;
      if(r.history?.kind==='migration'||r.history?.kind==='exchange'){
        const d=this.geometry.get(r).path;
        if(d){
          const active=this.interaction?.mode==='movie'&&historyState(r,this.year)==='active';
          const direction=r.overlay?.direction;
          const start=direction==='reverse'||direction==='both',end=direction==='forward'||direction==='both';
          const marker='url(#corridor-'+r.history.kind+')';
          const lane=lanes.get(r);
          arrows+=`<g data-overlay="${index}" data-history-route="${esc(r.id)}" data-direction="${direction??'unknown'}" class="history-route route-${r.history.kind} ${active?'route-active':''}" ${lane?`transform="translate(${lane[0]},${lane[1]})"`:''} style="opacity:${this.opacity(r)}"><title>${esc(r.title)} — ${esc(historyLabel(r,this.year))}${lane?' — Separate display lane; source endpoints unchanged':''}</title><path class="route-halo" d="${d}"/><path class="route-line" d="${d}" ${end?`marker-end="${marker}"`:''} ${start?`marker-start="${marker}"`:''}/><path class="route-flow" d="${d}"/><path class="overlay-line-hit" d="${d}" style="stroke-width:${16/this.scale}px"/></g>`;
          const directionLabel=routeDirectionLabels[r.id];
          if(lane&&directionLabel&&this.highlighted.has(r.id)){
            const line=this.geometry.get(r).lines.reduce((longest,line)=>line.length>longest.length?line:longest,[] as MapPoint[]),mid=line[Math.floor(line.length/2)];
            if(mid)endpointLabels+=`<g class="route-direction-label" transform="translate(${mid[0]+lane[0]*4},${mid[1]+lane[1]*4}) scale(${symbolScale})" pointer-events="none"><text text-anchor="middle" dominant-baseline="central" style="font-size:11px;font-weight:600;fill:#fff8de;stroke:#183847;stroke-width:4px;paint-order:stroke">${directionLabel}</text></g>`;
          }
          const g=r.overlay?.geometry,names=routeEndpointLabels[r.id];
          if(this.highlighted.has(r.id)&&names&&g?.type==='LineString'){
            [g.coordinates[0],g.coordinates[g.coordinates.length-1]].forEach((coordinate,i)=>{
              const key=names[i]+'|'+coordinate.join(',');
              if(labeledEndpoints.has(key))return;
              const p=this.projection(coordinate);if(!p)return;
              labeledEndpoints.add(key);
              const right=p[0]*this.scale+this.tx>this.width/2;
              endpointLabels+=`<g class="route-endpoint-label" transform="translate(${p[0]},${p[1]}) scale(${symbolScale})" pointer-events="none"><circle r="3.5" fill="#fff2c5" stroke="#183847" stroke-width="1.5"/><text x="${right?-9:9}" y="${i===0?-10:19}" text-anchor="${right?'end':'start'}" style="font-size:12px;font-weight:600;fill:#fff8de;stroke:#183847;stroke-width:4px;stroke-linejoin:round;paint-order:stroke;letter-spacing:0">${esc(names[i])}</text></g>`;
            });
          }
        }
        continue;
      }
      if(r.history?.kind==='wreck'||r.history?.kind==='settlement'){
        if(!r.location)continue;
        const p=this.projection([r.location.lon,r.location.lat]);if(!p)continue;
        const shared=colocated??[r];
        if(shared[0]!==r)continue;
        const wreck=r.history.kind==='wreck';
        arrows+=`<g data-overlay="${index}" data-record-id="${esc(r.id)}" data-history-kind="${r.history.kind}" class="history-marker history-${r.history.kind} ${this.interaction?.mode!=='explore'&&this.uncertainty(r)?'history-possible':''}" transform="translate(${p[0]},${p[1]}) scale(${symbolScale})" style="--history-color:${r.culture.color};opacity:${this.opacity(r)}"><title>${esc(r.title)} — ${esc(historyLabel(r,this.year))}</title><circle class="history-hit" r="13"/>${wreck?'<path class="wreck-symbol" d="M0,-7V7 M-7,2Q0,13 7,2 M-3,-4H3 M-7,2V6 M7,2V6"/><circle class="wreck-eye" cy="-9" r="2"/>':'<path class="settlement-symbol" d="M0,-7L7,0L0,7L-7,0Z"/>'}${shared.length>1?`<text class="site-count" x="10" y="-10">${shared.length}</text>`:''}${this.scale>=4||shared.some(x=>this.highlighted.has(x.id))?`<text class="history-place-label" x="12" y="4">${esc(compactPlaceName(r.location.name))}</text>`:''}</g>`;
        continue;
      }
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
          overlays += `<g data-overlay="${index}" class="cultural-reach ${o.kind === "language" ? "language-area" : ""}" style="opacity:${opacity};--reach-color:${o.kind === "language" ? "#caa5f1" : r.culture.color}"><title>${title} — feathered illustrative area, not a surveyed border or exclusive territory</title><path d="${d}"/><path class="reach-contour" d="${d}"/></g>`;
          continue;
        }
        if (
          ["population-history", "regional-evidence", "environment", "language"].includes(
            o.kind,
          )
        ) {
          const d =
            g.type === "LineString" ? this.geometry.get(r).path : null;
          const p = g.type === "Point" ? this.projection(g.coordinates) : null;
          overlays += `<g data-overlay="${index}" class="regional-cloud cloud-${o.kind}" style="opacity:${opacity}"><title>${title} — illustrative extent; not a site, precise route or probability boundary</title>${d ? `<path class="cloud-glow" d="${d}"/><path class="cloud-core" d="${d}"/><path class="cloud-hit" d="${d}"/>` : p ? `<circle class="cloud-glow" cx="${p[0]}" cy="${p[1]}" r="35"/><circle class="cloud-hit" cx="${p[0]}" cy="${p[1]}" r="35"/>` : ""}${directionSymbol}</g>`;
          continue;
        }
        if (g.type === "Point") {
          const p = this.projection(g.coordinates);
          if (p)
            overlays += `<g data-overlay="${index}" class="${cls}" style="opacity:${opacity}" transform="translate(${p[0]},${p[1]}) scale(${symbolScale})"><title>${title}</title><circle class="overlay-hit" r="14"/><path d="${o.kind === "conflict" ? "M-7,-7 L7,7 M7,-7 L-7,7" : o.kind === "violence" ? "M-8,-8 H8 V8 H-8 Z M-6,-6 L6,6 M6,-6 L-6,6" : o.kind === "epidemic" ? "M0,-8 A8,8 0 1,1 0,8 A8,8 0 1,1 0,-8 M0,-12 V-9 M0,9 V12 M-12,0 H-9 M9,0 H12" : o.kind === "forced-removal" ? "M-8,-8 H8 V8 H-8 Z" : "M0,-9 L9,0 L0,9 L-9,0 Z"}"/>${colocated&&colocated.length>1?`<text class="site-count" x="11" y="-10">${colocated.length}</text>`:""}</g>`;
        } else {
          const d = this.geometry.get(r).path;
          if(d&&g.type==='LineString'&&['trade','forced-removal'].includes(o.kind)){
            const kind=o.kind==='trade'?'exchange':'forced';
            const marker='url(#corridor-'+kind+')';
            const start=o.direction==='both'||o.direction==='reverse',end=o.direction==='both'||o.direction==='forward';
            overlays+=`<g data-overlay="${index}" class="${cls} history-route route-${kind}" style="opacity:${opacity>0?1:0}" data-direction="${o.direction??'unknown'}"><title>${title}</title><path class="route-halo" d="${d}"/><path class="route-line" d="${d}" ${start?`marker-start="${marker}"`:''} ${end?`marker-end="${marker}"`:''}/><path class="overlay-line-hit" d="${d}" style="stroke-width:${16/this.scale}px"/>${directionSymbol}</g>`;
          }else if (d)
            overlays += `<g data-overlay="${index}" class="${cls}" style="opacity:${opacity}"><title>${title}</title><path d="${d}" style="stroke-width:${3 / this.scale}"/><path class="overlay-line-hit" d="${d}" style="stroke-width:${15 / this.scale}"/>${directionSymbol}</g>`;
        }
        continue;
      }
      if (!r.location) continue;
      const key = `${r.location.lon},${r.location.lat}`;
      const group = groups.get(key)??[];
      // Keep render groups independent of the cached place groups. A route's
      // origin can share this marker, while its path remains separately selectable.
      for(const item of colocated??[r])if(!group.includes(item))group.push(item);
      groups.set(key,group);
      if (r.type === "movement" && r.destination) {
        const a = this.projection([r.location.lon, r.location.lat]),
          b = this.projection([r.destination.lon, r.destination.lat]);
        if (a && b)
          arrows += `<g data-overlay="${index}" class="history-route route-migration legacy-route"><title>${esc(r.title)} — ${esc(r.routeKind)} connection</title><path class="route-halo" d="${this.geometry.get(r).path}"/><path class="route-line movement ${r.proposalKey ? "proposal-path" : ""}" d="${this.geometry.get(r).path}" marker-end="url(#corridor-migration)"/></g>`;
      }
    }
    let markers = "", pastMarkers = "";
    for (const [key, rows] of groups) {
      if(key.startsWith("cell:"))continue;
      const r = rows[0],
        p = this.projection([r.location!.lon, r.location!.lat]);
      if (!p) continue;
      const possible = rows.every(
        (x) => this.uncertainty(x),
      );
      const past=this.interaction?.mode!=='explore'&&rows.every(x=>historyState(x,this.year)==='past-place');
      const population = this.interaction?.mode==='explore'
        ? {radius:6,outerRadius:6,unknown:false,label:'Explore size is a reference; inspect dated estimates'}
        : populationAt(rows.filter(x=>historyState(x,this.year)==='active'), this.year);
      const marker = `<g data-point="${key}" style="opacity:${Math.max(...rows.map((x) => this.opacity(x)))}" class="site ${past ? "past-place" : ""} ${possible ? "possible" : ""} ${rows.some((x) => x.proposalKey) ? "proposal-point" : ""}" transform="translate(${p[0]},${p[1]}) scale(${symbolScale})"><title>${esc(rows.map((x) => x.title + " — " + x.culture.name + " — " + timeLabel(x.time)).join("; "))} — ${esc(population.label)}${possible ? " — uncertain time" : ""}${rows.some(x => guideForRecord(x.id)) ? " — Site guide available" : ""}</title>${rows.some(x => guideForRecord(x.id)) ? `<text class="site-guide-marker" x="-17" y="17" aria-hidden="true">◈</text>` : ""}<circle class="site-halo" r="${Math.max(13, population.outerRadius + 4)}"/>${population.outerRadius > population.radius ? `<circle class="population-range" r="${population.outerRadius}" style="fill:${r.culture.color}"/>` : ""}<circle class="site-dot" r="${population.radius}" style="--site-color:${r.culture.color}"/>${population.unknown ? `<circle class="population-unknown" r="${population.radius}" fill="url(#population-unknown)"/>` : ""}${this.scale >= 16 || rows.some(x=>this.highlighted.has(x.id)) ? `<text class="settlement-label" x="${population.outerRadius + 5}" y="4">${esc(compactPlaceName(r.location!.name))}</text>` : ""}${rows.length > 1 ? `<text class="site-count" x="11" y="-8">${rows.length}</text>` : ""}</g>`;
      if(past)pastMarkers+=marker;else markers+=marker;
    }
    $(".features", this.element).innerHTML = overlays + arrows + pastMarkers + communities + markers + physicalMarkers + endpointLabels;
    // Rebuild catalog-only tooltip lookup with the rendered feature identities.
    // Retain hover across a redraw only when the same records remain visible.
    this.tips.clear();
    this.focusTargets=[];
    const hazardById=new Map(hazards.map(event=>[event.id,event]));
    let hoveredFeature:SVGElement|null=null;
    let focusedFeature:SVGElement|null=null;
    for(const feature of this.element.querySelectorAll<SVGElement>('[data-point],[data-overlay],[data-context],[data-hazard]')){
      let rows:DisplayRecord[]=[],content:MapTooltipContent|null=null,key='';
      if(feature.dataset.hazard){
        const event=hazardById.get(feature.dataset.hazard);
        if(event){content=tooltipForHazard(event);key='hazard:'+event.id;}
      }else{
        if(feature.dataset.context!==undefined)rows=this.contextAnchors.get(feature.dataset.context)??[];
        else if(feature.dataset.overlay!==undefined){const row=this.records[Number(feature.dataset.overlay)];if(row)rows=this.places.get(placeKey(row)??"none")??[row];}
        else rows=groups.get(feature.dataset.point!)??[];
        feature.dataset.memberIds=JSON.stringify(rows.map(r=>r.id));
        if(this.interaction?.mode==='movie')feature.dataset.activeMemberIds=JSON.stringify(rows.filter(r=>historyState(r,this.year)==='active').map(r=>r.id));
        const endings=this.interaction?.mode==='movie'?rows.flatMap(row=>{
          const ending=placeChange(row.history,this.year);
          return ending?[{row,ending}]:[];
        }):[];
        if(endings.length){
          const change=endings.find(entry=>entry.ending.inWindow)??endings[0];
          feature.dataset.localEnding=change.ending.kind;
          feature.dataset.endingInWindow=String(change.ending.inWindow);
          feature.dataset.endingNote=historyLabel(change.row,this.year);
          // An ending concerns its source place. Never strike through a whole region.
          if(change.ending.inWindow||!feature.dataset.densityGroup){
            const d=change.ending.kind==='relocated'?'M4,-9H13m-4,-4 4,4-4,4':'M4,-12l8,7m0,-7-8,7';
            feature.insertAdjacentHTML('beforeend',`<path class="local-ending-symbol ${change.ending.possible?'ending-possible':''}" d="${d}"/>`);
          }
        }
        const isPoint=feature.dataset.point!==undefined||feature.classList.contains('history-marker')||
          feature.classList.contains('overlay-feature')&&rows[0]?.overlay?.geometry?.type==='Point';
        if(isPoint&&this.interaction?.mode==='movie'){
          const caption=rows.map(row=>changeCaption(row,this.year)).find(Boolean);
          if(caption){
            feature.classList.add('dated-change');
            feature.dataset.change=caption;
            if(playing)feature.insertAdjacentHTML('beforeend',`<text class="change-caption" x="19" y="-12">${esc(caption)}</text>`);
          }
        }
        content=feature.dataset.densityGroup?{
          title:`Near ${feature.dataset.anchorName} · ${feature.dataset.densityGroup} mapped locations`,
          summary:this.interaction?.mode==='explore'?`${rows.length} records from all periods. Open to inspect the members.`:
            `${rows.length} records. ${feature.dataset.active} in their evidence window, ${feature.dataset.prior} earlier. Open to inspect the members.`,
          dates:feature.dataset.change??(this.interaction?.mode==='explore'?'All-time Explore view':formatYear(this.year))
        }:tooltipForRecords(rows,this.interaction?.mode??'movie',this.year);
        key=(feature.dataset.context!==undefined?'context:':'records:')+JSON.stringify(rows.map(row=>JSON.stringify([row.id,row.proposalKey??null])).sort());
      }
      if(!content)continue;
      if(feature.dataset.endingNote)content.summary=feature.dataset.endingNote+' '+content.summary;
      if(this.interaction?.mode==='movie'&&!feature.dataset.densityGroup){
        const prior=rows.find(row=>row.history?.kind==='attestation'&&row.history.windows&&historyState(row,this.year)==='past-place');
        if(prior)content.dates+=' '+historyLabel(prior,this.year);
      }
      const status=rows.some(r=>disputeLevel(r)==='disputed')?'disputed':rows.some(isDisputed)?'discussion':'none';
      feature.dataset.evidenceStatus=status;
      if(!feature.dataset.densityGroup&&status!=='none'&&(feature.dataset.point!==undefined||feature.classList.contains('history-marker')||feature.classList.contains('overlay-feature')&&rows[0]?.overlay?.geometry?.type==='Point')){
        const dot=feature.querySelector('.site-dot');
        const radius=dot?Number(dot.getAttribute('r'))+2:10;
        feature.insertAdjacentHTML('beforeend',`<circle class="evidence-status-ring" r="${radius}" aria-hidden="true"/>`);
      }
      feature.dataset.mapTip=key;
      feature.setAttribute('aria-label',content.title+'. '+content.summary+' '+content.dates);
      if(!feature.dataset.hazard){
        const highlighted=rows.some(r=>this.highlighted.has(r.id));
        feature.classList.toggle('is-highlighted',highlighted);
        feature.setAttribute('role','button');feature.setAttribute('aria-pressed',String(highlighted));
        this.focusTargets.push({feature,rows});
        if(highlighted&&(feature.dataset.point!==undefined||feature.classList.contains('history-marker'))){
          feature.insertAdjacentHTML('afterbegin','<circle class="selection-ring" r="21" fill="none" stroke="#fff2b6" stroke-width="2.5" pointer-events="none"/>');
        }
        if(highlighted&&feature.dataset.overlay!==undefined&&!feature.classList.contains('history-marker'))feature.style.setProperty('filter','drop-shadow(0 0 3px #fff2b6)');
      }
      this.tips.set(key,content);
      if(this.hovered?.key===key)hoveredFeature=feature;
      if(focused===key||(focusedId&&rows.some(r=>r.id===focusedId)))focusedFeature=feature;
    }
    this.updateTabStops();
    this.declutterLabels();
    if(this.hovered&&hoveredFeature){
      const {key,x,y}=this.hovered;this.tooltip.show(this.tips.get(key)!,{x,y},hoveredFeature);
    }else this.hideTooltip();
    focusedFeature?.focus({preventScroll:true});
  }
}
