import { geoEquirectangular, geoPath, geoGraticule10 } from "d3-geo";
import type { DisplayRecord } from "./model";
import { temporalState, isDisputed, END_YEAR } from "./time";
import { OVERLAY_LABELS } from "./overlays";
import { esc, $ } from "./dom";
export class MapView {
  readonly element = document.createElement("div");
  private projection = geoEquirectangular()
    .rotate([100, 0])
    .center([0, 15])
    .scale(300)
    .translate([500, 400])
    .clipExtent([
      [0, 0],
      [1000, 800],
    ]);
  private scale = 1;
  private tx = 0;
  private ty = 0;
  private records: DisplayRecord[] = [];
  private year = END_YEAR;
  private selected: string | null = null;
  constructor(
    land: any,
    private onSelect: (rows: DisplayRecord[]) => void,
  ) {
    this.element.className = "map-canvas";
    const path = geoPath(this.projection);
    this.element.innerHTML = `<svg viewBox="0 0 1000 800" role="img" aria-label="Map of the Americas. Use the visible records list for keyboard access to evidence." tabindex="0"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#e5c78c"/></marker></defs><g class="world"><path class="graticule" d="${path(geoGraticule10())}"/><path class="land" d="${path(land)}"/><g class="map-labels"><text x="390" y="230">NORTH AMERICA</text><text x="680" y="610">SOUTH AMERICA</text><text x="810" y="90">GREENLAND</text><text x="100" y="110">BERING STRAIT</text><text class="ocean-label" x="160" y="480">PACIFIC OCEAN</text><text class="ocean-label" x="830" y="390">ATLANTIC OCEAN</text></g><g class="features"></g></g></svg><div class="map-controls"><button data-zoom="in" aria-label="Zoom in">+</button><button data-zoom="out" aria-label="Zoom out">−</button><button data-zoom="reset" aria-label="Reset map view">⌖</button></div><div class="map-caption">Present-day reference coastlines · Not an Ice Age reconstruction<br>Made with Natural Earth · Public domain</div>`;
    const svg = $<SVGSVGElement>("svg", this.element);
    let drag: { x: number; y: number; tx: number; ty: number } | null = null;
    let moved = false;
    const pixels = () => 1000 / svg.getBoundingClientRect().width;
    svg.addEventListener("pointerdown", (e) => {
      moved = false;
      if ((e.target as Element).closest("[data-point],[data-overlay]")) return;
      drag = { x: e.clientX, y: e.clientY, tx: this.tx, ty: this.ty };
      moved = false;
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = (e.clientX - drag.x) * pixels(),
        dy = (e.clientY - drag.y) * pixels();
      moved ||= Math.abs(dx) + Math.abs(dy) > 4;
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
        "[data-zoom],[data-point],[data-overlay]",
      );
      if (!target) return;
      if (target.dataset.zoom) {
        if (target.dataset.zoom === "reset") {
          this.scale = 1;
          this.tx = this.ty = 0;
          this.transform();
          this.draw();
        } else this.zoom(target.dataset.zoom === "in" ? 1.35 : 1 / 1.35);
      } else if (!moved && target.dataset.overlay !== undefined) {
        this.onSelect([this.records[Number(target.dataset.overlay)]]);
      } else if (!moved) {
        this.selected = target.dataset.point!;
        this.onSelect(
          this.records.filter(
            (r) =>
              r.location &&
              `${r.location.lon},${r.location.lat}` === this.selected,
          ),
        );
      }
    });
  }
  private zoom(factor: number) {
    const old = this.scale;
    this.scale = Math.max(1, Math.min(8, this.scale * factor));
    const ratio = this.scale / old;
    this.tx = 500 - (500 - this.tx) * ratio;
    this.ty = 400 - (400 - this.ty) * ratio;
    this.transform();
    this.draw();
  }
  private transform() {
    this.tx = Math.max(-1000 * this.scale + 100, Math.min(900, this.tx));
    this.ty = Math.max(-800 * this.scale + 80, Math.min(720, this.ty));
    $(".world", this.element).setAttribute(
      "transform",
      `translate(${this.tx},${this.ty}) scale(${this.scale})`,
    );
  }
  update(records: DisplayRecord[], year: number) {
    this.records = records;
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
    const p = this.projection(position as [number, number]);
    if (!p) return;
    this.scale = 2;
    this.tx = 500 - p[0] * 2;
    this.ty = 400 - p[1] * 2;
    this.transform();
    this.draw();
    this.onSelect([r]);
  }
  private draw() {
    const groups = new Map<string, DisplayRecord[]>();
    let arrows = "",
      overlays = "";
    for (const [index, r] of this.records.entries()) {
      if (r.overlay) {
        const o = r.overlay,
          g = o.geometry;
        if (!g) continue;
        const cls = `overlay-feature overlay-${o.kind} ${o.basis === "schematic" ? "overlay-schematic" : ""} ${temporalState(r.time, this.year) === "possible" ? "overlay-uncertain" : ""}`;
        const title = esc(
          `${r.title} — ${OVERLAY_LABELS[o.kind]}, ${o.basis}${isDisputed(r) ? " *" : ""}`,
        );
        if (g.type === "Point") {
          const p = this.projection(g.coordinates);
          if (p)
            overlays += `<g data-overlay="${index}" class="${cls}" transform="translate(${p[0]},${p[1]}) scale(${1 / this.scale})"><title>${title}</title><circle class="overlay-hit" r="14"/><path d="${o.kind === "conflict" ? "M-7,-7 L7,7 M7,-7 L-7,7" : o.kind === "violence" ? "M-8,-8 H8 V8 H-8 Z M-6,-6 L6,6 M6,-6 L-6,6" : o.kind === "epidemic" ? "M0,-8 A8,8 0 1,1 0,8 A8,8 0 1,1 0,-8 M0,-12 V-9 M0,9 V12 M-12,0 H-9 M9,0 H12" : o.kind === "forced-removal" ? "M-8,-8 H8 V8 H-8 Z" : "M0,-9 L9,0 L0,9 L-9,0 Z"}"/>${isDisputed(r) ? '<text x="10" y="-9">*</text>' : ""}</g>`;
        } else {
          const d = geoPath(this.projection)(g);
          if (d)
            overlays += `<g data-overlay="${index}" class="${cls}"><title>${title}</title><path d="${d}" ${o.kind === "forced-removal" ? 'marker-end="url(#arrow)"' : ""} style="stroke-width:${3 / this.scale}"/><path class="overlay-line-hit" d="${d}" style="stroke-width:${15 / this.scale}"/></g>`;
        }
        continue;
      }
      if (!r.location) continue;
      const key = `${r.location.lon},${r.location.lat}`;
      groups.set(key, [...(groups.get(key) ?? []), r]);
      if (r.type === "movement" && r.destination) {
        const a = this.projection([r.location.lon, r.location.lat]),
          b = this.projection([r.destination.lon, r.destination.lat]);
        if (a && b)
          arrows += `<path class="movement ${r.proposalKey ? "proposal-path" : ""}" d="M${a[0]},${a[1]} Q${(a[0] + b[0]) / 2},${(a[1] + b[1]) / 2 - 35} ${b[0]},${b[1]}" marker-end="url(#arrow)"><title>${esc(r.title)} — ${esc(r.routeKind)} connection</title></path>`;
      }
    }
    let markers = "";
    for (const [key, rows] of groups) {
      const r = rows[0],
        p = this.projection([r.location!.lon, r.location!.lat]);
      if (!p) continue;
      const possible = rows.every(
        (x) => temporalState(x.time, this.year) === "possible",
      );
      markers += `<g data-point="${key}" class="site ${possible ? "possible" : ""} ${rows.some((x) => x.proposalKey) ? "proposal-point" : ""}" transform="translate(${p[0]},${p[1]}) scale(${1 / this.scale})"><title>${esc(rows.map((x) => x.title).join("; "))}${possible ? " — uncertain time" : ""}</title><circle class="site-halo" r="13"/><circle class="site-dot" r="6" style="--site-color:${r.culture.color}"/>${rows.length > 1 ? `<text class="site-count" x="11" y="-8">${rows.length}</text>` : ""}${rows.some(isDisputed) ? '<text class="site-star" x="-13" y="-8">*</text>' : ""}</g>`;
    }
    $(".features", this.element).innerHTML = overlays + arrows + markers;
  }
}
