import type { DisplayRecord } from "./model";
import type { HazardEvent } from "./physical-data";
import { formatYear, timeLabel } from "./time";

export interface MapTooltipContent {
  title: string;
  summary: string;
  dates: string;
}
export type MapMode = "movie" | "explore";

/** Uses only catalog fields already in memory; hover never requests record detail. */
export function tooltipForRecords(
  rows: readonly DisplayRecord[],
  mode: MapMode,
  year: number,
): MapTooltipContent | null {
  if (!rows.length) return null;
  const unresolved = rows.some(
    (r) =>
      r.time.kind === "unplaced" ||
      r.time.start === null ||
      r.time.end === null,
  );
  return {
    title: rows.map((r) => r.title).join(" · "),
    summary: rows
      .map((r) => r.review.summary)
      .filter(Boolean)
      .join(" "),
    dates:
      rows.map((r) => timeLabel(r.time)).join("; ") +
      ". " +
      (unresolved
        ? "Dates unresolved: context only; no occupation at a selected year is established."
        : mode === "explore"
          ? "All-time Explore context: compare these source dates; visibility does not establish occupation at the movie year."
          : `Movie year ${formatYear(year)}. Source ranges can describe possible dates rather than continuous occupation.`),
  };
}
export function tooltipForHazard(event: HazardEvent): MapTooltipContent {
  return {
    title: event.title,
    summary: event.limitations,
    dates: `${event.start === event.end ? formatYear(event.start) : formatYear(event.start) + " – " + formatYear(event.end)}. ${event.status}. Catalog event; proximity does not establish a settlement impact.`,
  };
}

export function tooltipPosition(
  anchor: { x: number; y: number },
  size: { width: number; height: number },
  viewport: { width: number; height: number },
) {
  const gap = 8;
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
  private owner: Element | null = null;
  constructor() {
    this.element.className = "map-hover-tooltip";
    this.element.id = "map-hover-tooltip-" + ++nextTooltip;
    this.element.setAttribute("role", "tooltip");
    this.dates.className = "map-hover-dates";
    this.element.append(this.title, this.summary, this.dates);
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
    this.title.textContent = content.title;
    this.summary.textContent = content.summary;
    this.dates.textContent = content.dates;
    if (!this.element.isConnected) document.body.append(this.element);
    const box = this.element.getBoundingClientRect();
    const position = tooltipPosition(anchor, box, {
      width: window.innerWidth,
      height: window.innerHeight,
    });
    this.element.style.left = position.left + "px";
    this.element.style.top = position.top + "px";
  }
  hide() {
    this.owner?.removeAttribute("aria-describedby");
    this.owner = null;
    this.element.remove();
  }
}
