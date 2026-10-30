import type { DisplayRecord } from "./model";
import { searchRecordIds } from "./client-data";
import { activeRecords, formatYear, timeLabel, isDisputed } from "./time";
import { OVERLAY_LABELS } from "./overlays";
import { recordHref } from "./review";
import { $, esc } from "./dom";

export interface EvidenceTableState {
  search: string;
  period: "all" | "current";
  type: string;
  sort: "oldest" | "newest" | "name";
}
interface Inputs {
  rows: () => DisplayRecord[];
  year: () => number;
  preview: () => boolean;
  setPreview: (value: boolean) => void;
  hiddenCultureCount: () => number;
}

/** Table owns search lifecycle and bounded DOM, not the authoritative records.
 * Route disposal aborts work; every input supersedes the previous search, and
 * stale responses cannot rewrite a newer query or a different page. */
export class EvidenceTable {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private request: AbortController | undefined;
  private generation = 0;
  private ids: Set<string> | null = null;
  private loading = false;
  private disposed = false;
  private page = 0;
  private readonly pageSize = 100;
  constructor(
    private root: HTMLElement,
    private state: EvidenceTableState,
    private inputs: Inputs,
  ) {
    this.mount();
  }
  dispose() {
    this.disposed = true;
    clearTimeout(this.timer);
    this.request?.abort();
    this.generation++;
  }
  private mount() {
    const s = this.state;
    this.root.innerHTML = `<article class="table-page">
   <div class="page-heading"><div><div class="eyebrow">THE EVIDENCE INDEX</div><h2>Every row has a source.</h2>
   <p class="lead">Occupation, occurrences, movements, and events. Open a row for its full review.</p></div><a class="button primary" href="#new">+ Suggest new evidence</a></div>
   <div class="table-filters"><input id="table-search" type="search" maxlength="200" aria-label="Search evidence" placeholder="Search places, cultures, claims…" value="${esc(s.search)}">
   <label>Period<select id="period" aria-label="Table period"><option value="all">All records</option><option value="current">At selected year</option></select></label>
   <label>Type<select id="type-filter" aria-label="Record type filter">${["all", "occupation", "occurrence", "movement", "event", ...Object.keys(OVERLAY_LABELS)].map((type) => `<option value="${type}">${esc(OVERLAY_LABELS[type as keyof typeof OVERLAY_LABELS] ?? type)}</option>`).join("")}</select></label>
   <label>Sort<select id="sort" aria-label="Sort evidence"><option value="oldest">Earliest first</option><option value="newest">Latest first</option><option value="name">Name</option></select></label>
   <label class="check"><input id="table-preview" type="checkbox" ${this.inputs.preview() ? "checked" : ""}> Preview suggestions</label></div>
   <p id="table-caption" class="muted" role="status"></p><div class="table-scroll"><table><thead><tr><th>Dates / occupation</th><th>Evidence &amp; location</th><th>Culture / people</th><th>Type</th><th>Evidence status</th><th>Supporting page</th></tr></thead><tbody></tbody></table></div>
   <div class="actions" id="table-pagination"><button id="table-previous">Previous page</button><span id="table-page-number"></span><button id="table-next">Next page</button></div>
   <p class="fine">* A particular claim is under discussion or disputed. Open its review to see which claim and why. Culture filters from the map also apply here.</p></article>`;
    for (const [id, key] of [
      ["period", "period"],
      ["type-filter", "type"],
      ["sort", "sort"],
    ] as const) {
      const control = $<HTMLSelectElement>("#" + id, this.root);
      control.value = s[key];
      control.addEventListener("change", () => {
        (s[key] as string) = control.value;
        this.page = 0;
        this.refresh();
      });
    }
    $("#table-search", this.root).addEventListener("input", (event) => {
      s.search = (event.target as HTMLInputElement).value;
      this.page = 0;
      this.search(true);
    });
    $("#table-preview", this.root).addEventListener("change", (event) => {
      this.inputs.setPreview((event.target as HTMLInputElement).checked);
      this.page = 0;
      this.refresh();
    });
    $("#table-previous", this.root).addEventListener("click", () => {
      this.page--;
      this.refresh();
    });
    $("#table-next", this.root).addEventListener("click", () => {
      this.page++;
      this.refresh();
    });
    $("tbody", this.root).addEventListener("click", (event) => {
      const target = event.target as Element;
      const row = target.closest<HTMLTableRowElement>("tr[data-href]");
      if (row && !target.closest("a")) location.hash = row.dataset.href!;
    });
    this.search(false);
  }
  private search(debounce: boolean) {
    clearTimeout(this.timer);
    this.request?.abort();
    const generation = ++this.generation;
    if (!this.state.search.trim()) {
      this.ids = null;
      this.loading = false;
      this.refresh();
      return;
    }
    this.loading = true;
    $("#table-caption", this.root).textContent =
      "Searching the source-linked evidence…";
    const run = async () => {
      const controller = new AbortController();
      this.request = controller;
      try {
        const ids = await searchRecordIds(this.state.search, controller.signal);
        if (this.disposed || generation !== this.generation) return;
        this.ids = ids;
        this.loading = false;
        this.refresh();
      } catch (error) {
        if (
          this.disposed ||
          generation !== this.generation ||
          controller.signal.aborted
        )
          return;
        this.loading = false;
        $("#table-caption", this.root).textContent = (error as Error).message;
      }
    };
    if (debounce) this.timer = setTimeout(() => void run(), 250);
    else void run();
  }
  refresh() {
    if (this.disposed || this.loading) return;
    const { state: s } = this;
    let rows = this.inputs.rows().filter((r) => {
      if (s.type !== "all" && (r.overlay?.kind ?? r.type) !== s.type)
        return false;
      if (!s.search.trim()) return true;
      if (!r.proposalKey) return !!this.ids?.has(r.id);
      return `${r.title} ${r.location?.name ?? ""} ${r.culture.name} ${r.claims.map((c) => c.text).join(" ")}`
        .toLowerCase()
        .includes(s.search.toLowerCase());
    });
    if (s.period === "current") rows = activeRecords(rows, this.inputs.year());
    rows.sort((a, b) =>
      s.sort === "name"
        ? a.title.localeCompare(b.title)
        : s.sort === "newest"
          ? (b.time.start ?? -Infinity) - (a.time.start ?? -Infinity)
          : (a.time.start ?? Infinity) - (b.time.start ?? Infinity),
    );
    const pages = Math.max(1, Math.ceil(rows.length / this.pageSize));
    this.page = Math.max(0, Math.min(this.page, pages - 1));
    const start = this.page * this.pageSize,
      page = rows.slice(start, start + this.pageSize);
    $("#table-caption", this.root).textContent =
      `${rows.length} records · ${s.period === "all" ? "All dates" : formatYear(this.inputs.year())} · Showing ${rows.length ? start + 1 : 0}–${start + page.length}${this.inputs.hiddenCultureCount() ? " · Some cultures hidden" : ""}${this.inputs.preview() ? " · Complete proposals included" : ""}`;
    $("tbody", this.root).innerHTML =
      page
        .map(
          (r) =>
            `<tr data-href="${recordHref(r)}"><td><strong>${esc(timeLabel(r.time))}</strong><small>${esc(r.time.kind === "occurrence" && r.time.start !== r.time.end ? "Possible occurrence window" : r.time.kind)}</small></td><td><strong>${esc(r.title)}${isDisputed(r) ? " *" : ""}</strong><small>${esc(r.location?.name ?? (r.overlay?.geometry ? "Mapped overlay" : "Unmapped"))}</small></td><td><span class="culture-label"><i style="background:${r.culture.color}"></i>${esc(r.culture.name)}</span></td><td>${esc(r.overlay ? OVERLAY_LABELS[r.overlay.kind] : r.type)}</td><td>${r.proposalKey ? '<span class="tag proposal-tag">Unreviewed proposal</span>' : ""}<span class="tag">${isDisputed(r) ? "* See discussion" : "Well-supported"}</span></td><td><a href="${recordHref(r)}">Detailed review</a></td></tr>`,
        )
        .join("") ||
      '<tr><td colspan="6" class="empty">No matching records. Broaden your filters or select All records.</td></tr>';
    $("#table-page-number", this.root).textContent =
      `Page ${this.page + 1} of ${pages}`;
    $<HTMLButtonElement>("#table-previous", this.root).disabled =
      this.page === 0;
    $<HTMLButtonElement>("#table-next", this.root).disabled =
      this.page >= pages - 1;
  }
}
