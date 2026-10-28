import { geoEquirectangular, geoPath, geoGraticule10, geoCircle } from "d3-geo";
import { populationAt } from "./population";
import type { DisplayRecord } from "./model";
import { temporalState, temporalOpacity, timeLabel, isDisputed, END_YEAR } from "./time";
import { OVERLAY_LABELS } from "./overlays";
import { esc, $ } from "./dom";
import { disputeLevel, disputeLabel } from "./disputes";
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
    this.element.innerHTML = `<svg viewBox="0 0 1000 800" role="img" aria-label="Map of the Americas. Use the visible records list for keyboard access to evidence." tabindex="0"><defs><pattern id="population-unknown" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V5" stroke="#fff" stroke-width="1.8" opacity=".8"/></pattern><radialGradient id="reach-fade"><stop offset="0%" stop-color="white" stop-opacity=".35"/><stop offset="40%" stop-color="white" stop-opacity=".22"/><stop offset="100%" stop-color="white" stop-opacity="0"/></radialGradient><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#e5c78c"/></marker></defs><g class="world"><path class="graticule" d="${path(geoGraticule10())}"/><path class="land" d="${path(land)}"/><g class="map-labels"><text x="390" y="230">NORTH AMERICA</text><text x="680" y="610">SOUTH AMERICA</text><text x="810" y="90">GREENLAND</text><text x="100" y="110">BERING STRAIT</text><text class="ocean-label" x="160" y="480">PACIFIC OCEAN</text><text class="ocean-label" x="830" y="390">ATLANTIC OCEAN</text></g><g class="features"></g></g></svg><div class="map-controls"><button data-zoom="in" aria-label="Zoom in">+</button><button data-zoom="out" aria-label="Zoom out">−</button><button data-zoom="reset" aria-label="Reset map view">⌖</button></div><div class="map-caption">Present-day reference coastlines · Not an Ice Age reconstruction<br>Made with Natural Earth · Public domain</div>`;
    const svg = $<SVGSVGElement>("svg", this.element);
    let drag: { x: number; y: number; tx: number; ty: number } | null = null;
    let moved = false;
    const pixels = () => 1 / this.viewportFit();
    svg.addEventListener("pointerdown", (e) => {
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
    window.addEventListener("resize", () => {
      if (this.element.isConnected) this.draw();
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
    this.scale = Math.max(1, Math.min(4096, this.scale * factor));
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
        const opacity = temporalOpacity(r.time, this.year);
        if (o.kind === "cultural-reach" && g.type === "Point" && o.radiusKm) {
          const shape = geoCircle()
            .center(g.coordinates)
            .radius(((o.radiusKm / 6371) * 180) / Math.PI)();
          const d = geoPath(this.projection)(shape);
          overlays += `<g data-overlay="${index}" class="cultural-reach" style="opacity:${opacity};--reach-color:${r.culture.color}"><title>${title} — feathered illustrative reach, not a surveyed border or exclusive territory</title><path d="${d}"/></g>`;
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
          ["population-history", "regional-evidence", "environment"].includes(
            o.kind,
          )
        ) {
          const d =
            g.type === "LineString" ? geoPath(this.projection)(g) : null;
          const p = g.type === "Point" ? this.projection(g.coordinates) : null;
          overlays += `<g data-overlay="${index}" class="regional-cloud cloud-${o.kind}" style="opacity:${opacity}"><title>${title} — illustrative extent; not a site, precise route or probability boundary</title>${d ? `<path class="cloud-glow" d="${d}"/><path class="cloud-core" d="${d}"/><path class="cloud-hit" d="${d}"/>` : p ? `<circle class="cloud-glow" cx="${p[0]}" cy="${p[1]}" r="35"/><circle class="cloud-hit" cx="${p[0]}" cy="${p[1]}" r="35"/>` : ""}${star}</g>`;
          continue;
        }
        if (g.type === "Point") {
          const p = this.projection(g.coordinates);
          if (p)
            overlays += `<g data-overlay="${index}" class="${cls}" style="opacity:${opacity}" transform="translate(${p[0]},${p[1]}) scale(${symbolScale})"><title>${title}</title><circle class="overlay-hit" r="14"/><path d="${o.kind === "conflict" ? "M-7,-7 L7,7 M7,-7 L-7,7" : o.kind === "violence" ? "M-8,-8 H8 V8 H-8 Z M-6,-6 L6,6 M6,-6 L-6,6" : o.kind === "epidemic" ? "M0,-8 A8,8 0 1,1 0,8 A8,8 0 1,1 0,-8 M0,-12 V-9 M0,9 V12 M-12,0 H-9 M9,0 H12" : o.kind === "forced-removal" ? "M-8,-8 H8 V8 H-8 Z" : "M0,-9 L9,0 L0,9 L-9,0 Z"}"/>${isDisputed(r) ? `<text class="asterisk dispute-${disputeLevel(r)}" x="10" y="-9"><title>${esc(disputeLabel(r))}</title>*</text>` : ""}</g>`;
        } else {
          const d = geoPath(this.projection)(g);
          if (d)
            overlays += `<g data-overlay="${index}" class="${cls}" style="opacity:${opacity}"><title>${title}</title><path d="${d}" ${o.kind === "forced-removal" ? 'marker-end="url(#arrow)"' : ""} style="stroke-width:${3 / this.scale}"/><path class="overlay-line-hit" d="${d}" style="stroke-width:${15 / this.scale}"/></g>`;
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
          arrows += `<path style="opacity:${temporalOpacity(r.time, this.year)}" class="movement ${r.proposalKey ? "proposal-path" : ""}" d="M${a[0]},${a[1]} Q${(a[0] + b[0]) / 2},${(a[1] + b[1]) / 2 - 35} ${b[0]},${b[1]}" marker-end="url(#arrow)"><title>${esc(r.title)} — ${esc(r.routeKind)} connection</title></path>`;
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
      const population = populationAt(rows, this.year);
      markers += `<g data-point="${key}" style="opacity:${Math.max(...rows.map((x) => temporalOpacity(x.time, this.year)))}" class="site ${possible ? "possible" : ""} ${rows.some((x) => x.proposalKey) ? "proposal-point" : ""}" transform="translate(${p[0]},${p[1]}) scale(${symbolScale})"><title>${esc(rows.map((x) => x.title + " — " + x.culture.name + " — " + timeLabel(x.time)).join("; "))} — ${esc(population.label)}${possible ? " — uncertain time" : ""}</title><circle class="site-halo" r="${Math.max(13, population.outerRadius + 4)}"/>${population.outerRadius > population.radius ? `<circle class="population-range" r="${population.outerRadius}" style="fill:${r.culture.color}"/>` : ""}<circle class="site-dot" r="${population.radius}" style="--site-color:${r.culture.color}"/>${population.unknown ? `<circle class="population-unknown" r="${population.radius}" fill="url(#population-unknown)"/>` : ""}${this.scale >= 32 ? `<text class="settlement-label" x="${population.outerRadius + 5}" y="4">${esc(r.location!.name)}</text>` : ""}${rows.length > 1 ? `<text class="site-count" x="11" y="-8">${rows.length}</text>` : ""}${rows.some(isDisputed) ? `<text class="site-star asterisk dispute-${rows.some((x) => disputeLevel(x) === "disputed") ? "disputed" : "discussion"}" x="-13" y="-8">*</text>` : ""}</g>`;
    }
    $(".features", this.element).innerHTML = overlays + arrows + markers;
  }
}
