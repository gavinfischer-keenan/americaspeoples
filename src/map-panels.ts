import type { DisplayRecord } from "./model";
import { $, esc } from "./dom";
import { isDisputed, temporalState, timeLabel } from "./time";
import { disputeLabel, disputeLevel } from "./disputes";
import { isModeledRecord } from "./map-filters";
import { populationAt } from "./population";
import { recordHref } from "./review";

export interface MapPanelState {
  visible: readonly DisplayRecord[];
  context: readonly DisplayRecord[];
  selected: readonly DisplayRecord[];
  active: readonly DisplayRecord[];
  year: number;
}

const recordKey = (r: DisplayRecord) =>
  JSON.stringify([r.id, r.proposalKey ?? null]);
type ButtonEntry = { button: HTMLButtonElement; content: string };

/** Owns panel DOM identity, not map filtering, dates or selection state.
 * Persistent keyed buttons preserve keyboard focus and scroll during playback and
 * panning. Delegated clicks resolve the latest rows instead of capturing indices.
 * The owner handles selection and sends the resulting state back through update.
 */
export class MapPanels {
  private visibleHost: HTMLElement;
  private contextHost: HTMLElement;
  private detailsHost: HTMLElement;
  private visibleButtons = new Map<string, ButtonEntry>();
  private contextButtons = new Map<string, ButtonEntry>();
  private choices = new Map<string, DisplayRecord>();
  private detailsState: string | null = null;

  constructor(
    private root: HTMLElement,
    onSelect: (rows: DisplayRecord[]) => void,
  ) {
    this.visibleHost = $("#visible-records", root);
    this.contextHost = $("#context-records", root);
    this.detailsHost = $("#selected-records", root);
    const select = (event: Event) => {
      const button = (event.target as Element).closest<HTMLButtonElement>(
        "button[data-map-record-key]",
      );
      if (!button) return;
      const record = this.choices.get(button.dataset.mapRecordKey!);
      if (record) onSelect([record]);
    };
    this.visibleHost.addEventListener("click", select);
    this.contextHost.addEventListener("click", select);
  }

  update(state: MapPanelState): void {
    const { visible, context, selected, active, year } = state;
    const selectedKeys = new Set(selected.map(recordKey));
    this.choices = new Map(
      [...visible, ...context].map((r) => [recordKey(r), r]),
    );
    this.count("#visible-count", String(visible.length));
    this.count("#context-count", String(context.length));
    this.count("#active-count", `${visible.length} mapped records in view`);
    this.reconcile(
      this.visibleHost,
      this.visibleButtons,
      visible,
      selectedKeys,
      false,
    );
    this.reconcile(
      this.contextHost,
      this.contextButtons,
      context,
      selectedKeys,
      true,
    );

    const activeKeys = new Set(active.map(recordKey));
    const visibleKeys = new Set(visible.map(recordKey));
    // Include the consumed catalog fields so loading a full record or editing a
    // proposal refreshes content even when its stable identity stays the same.
    const nextDetailsState = JSON.stringify([
      selected.length ? year : null,
      selected.map((r) => [
        recordKey(r),
        r.title,
        r.culture.name,
        r.time,
        r.review.summary,
        r.review.limitations,
        r.population,
        r.type,
        !!r.overlay,
        r.overlay?.basis,
        activeKeys.has(recordKey(r)),
        visibleKeys.has(recordKey(r)),
      ]),
    ]);
    if (nextDetailsState === this.detailsState) return;
    this.detailsState = nextDetailsState;
    this.detailsHost.innerHTML = selected.length
      ? selected
          .map((r) => {
            const included = activeKeys.has(recordKey(r));
            const inView = visibleKeys.has(recordKey(r));
            return `<article class="selected-detail"><h4>${esc(r.title)}</h4><p class="fine">${esc(r.culture.name)} · ${esc(timeLabel(r.time))}</p>${!included ? '<p class="selection-status">Not active evidence at the current year / filters.</p>' : !inView ? '<p class="selection-status">Outside the current map view.</p>' : ""}<p>${esc(r.review.summary)}</p>${!r.overlay && r.type !== "movement" ? `<p class="fine">${esc(populationAt([r], year).label)}</p>` : ""}<p class="fine">${r.time.kind === "unplaced" ? "Chronology unresolved · independent of selected year" : temporalState(r.time, year) === "possible" ? "Possible time / context window" : "Documented time"}${isModeledRecord(r) ? " · Modeled / schematic evidence" : ""}</p><p class="fine">${esc(r.review.limitations)}</p>${r.time.kind === "unplaced" ? `<p class="fine"><strong>Source date guidance:</strong> ${esc(r.time.original)}<br>${esc(r.time.interpretation)}</p>` : ""}<a class="button" href="${recordHref(r)}">Full review &amp; sources ↗</a></article>`;
          })
          .join("")
      : '<p class="empty">Select a site from the list or a marker on the map to see its evidence, dates, and sources here.</p>';
  }

  private count(selector: string, text: string) {
    const element = $(selector, this.root);
    if (element.textContent !== text) element.textContent = text;
  }

  private reconcile(
    host: HTMLElement,
    entries: Map<string, ButtonEntry>,
    rows: readonly DisplayRecord[],
    selected: ReadonlySet<string>,
    context: boolean,
  ) {
    const keys = new Set(rows.map(recordKey));
    const structureChanged =
      rows.length !== entries.size ||
      rows.some(
        (r, index) =>
          host.children[index] !== entries.get(recordKey(r))?.button,
      );
    const focused =
      document.activeElement instanceof HTMLButtonElement &&
      host.contains(document.activeElement)
        ? document.activeElement
        : null;
    // Preserve the panel's scrolling position when membership/order changes.
    const scroll: { element: HTMLElement; top: number; left: number }[] = [];
    if (structureChanged) {
      for (
        let element: HTMLElement | null = host;
        element && this.root.contains(element);
        element = element.parentElement
      ) {
        scroll.push({
          element,
          top: element.scrollTop,
          left: element.scrollLeft,
        });
      }
    }
    for (const [key, entry] of entries) {
      if (!keys.has(key)) {
        entry.button.remove();
        entries.delete(key);
      }
    }
    if (rows.length || context) host.querySelector(":scope > .empty")?.remove();
    let cursor = host.firstElementChild;
    rows.forEach((r, index) => {
      const key = recordKey(r);
      let entry = entries.get(key);
      if (!entry) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `evidence-card ${context ? "context-choice" : "site-choice"}`;
        button.dataset.mapRecordKey = key;
        entry = { button, content: "" };
        entries.set(key, entry);
      }
      const { button } = entry;
      // Only fields displayed on a card affect its content. Year, membership and
      // selection changes do not replace the button or regenerate its children.
      const content = JSON.stringify(
        context
          ? [r.title, r.time.original]
          : [
              r.title,
              r.culture,
              r.time,
              r.claims.map((c) => c.status),
              r.overlay?.basis,
            ],
      );
      if (entry.content !== content) {
        entry.content = content;
        button.innerHTML = context
          ? `<div><strong>${esc(r.title)}</strong><span>${esc(r.time.original)}</span></div>`
          : `<i style="background:${r.culture.color}"></i><div><strong>${esc(r.title)}${isDisputed(r) ? `<span class="asterisk dispute-${disputeLevel(r)}" title="${esc(disputeLabel(r))}"> *</span>` : ""}</strong><span>${esc(r.culture.name)} · ${esc(timeLabel(r.time))}${isModeledRecord(r) ? " · Modeled / schematic" : ""}</span></div>`;
      }
      const indexName = context ? "contextIndex" : "visibleIndex";
      if (button.dataset[indexName] !== String(index))
        button.dataset[indexName] = String(index);
      const pressed = selected.has(key);
      if (button.classList.contains("is-selected") !== pressed)
        button.classList.toggle("is-selected", pressed);
      if (button.getAttribute("aria-pressed") !== String(pressed))
        button.setAttribute("aria-pressed", String(pressed));
      if (button !== cursor) host.insertBefore(button, cursor);
      cursor = button.nextElementSibling;
    });
    if (!rows.length && !context && !host.firstElementChild)
      host.innerHTML =
        '<p class="empty">No included records in this map view at this year. Pan, zoom out, change the year, or show more layers.</p>';
    // insertBefore can blur a moved node in browsers without state-preserving
    // moves. Restore the same surviving button, without scrolling it into view.
    if (focused?.isConnected && document.activeElement !== focused)
      focused.focus({ preventScroll: true });
    for (const { element, top, left } of scroll) {
      if (element.scrollTop !== top) element.scrollTop = top;
      if (element.scrollLeft !== left) element.scrollLeft = left;
    }
  }
}
