import "./styles.css";
import { version as appVersion } from "../package.json";
import { dataset } from "./published-data";
import land from "../data/land.geojson";
import type {
  Dataset,
  DisplayRecord,
  EvidenceRecord,
  Proposal,
  SharePackage,
} from "./model";
import {
  formatYear,
  parseYear,
  earliestYear,
  activeRecords,
  timeLabel,
  isDisputed,
  END_YEAR,
  temporalState,
  advancePlayback,
} from "./time";
import { MapView } from "./map";
import { esc, $, downloadJSON } from "./dom";
import { reviewHTML, recordHref, comparisonHTML } from "./review";
import { mountEditor, newProposal } from "./editor";
import {
  makePackage,
  parsePackage,
  inspectImport,
  mergeImport,
  canonical,
  MAX_PACKAGE_BYTES,
} from "./proposals";
import { validateRecord } from "./validation";
import { importWorkbook } from "./xlsx-import";
import { disputeLevel, disputeLabel } from "./disputes";
import { populationAt } from "./population";
import { OVERLAY_LABELS } from "./overlays";
import { contextHTML } from "./context";

const minYear = earliestYear(dataset.records);
let year = minYear,
  playing = false,
  speed = 250,
  lastTick = 0,
  fraction = 0,
  dirty = false,
  holdUntil = 0;
let proposals: Proposal[] = [],
  pending: SharePackage | null = null,
  storageAvailable = true;
let preview = false,
  period = "all",
  search = "",
  typeFilter = "all",
  sort = "oldest",
  legendSearch = "";
let selected: DisplayRecord[] = [];
const hiddenCultures = new Set<string>();
const hiddenLayers = new Set<string>();
const mapRows = () =>
  rows().filter((r) => !r.overlay || !hiddenLayers.has(r.overlay.kind));
const storeKey = "americas-peoples-proposals-v1";
try {
  const saved = localStorage.getItem(storeKey);
  if (saved) proposals = parsePackage(saved).proposals;
  localStorage.setItem("ap-storage-check", "1");
  localStorage.removeItem("ap-storage-check");
} catch {
  storageAvailable = false;
}
const cultures = () => {
  const map = new Map(dataset.records.map((r) => [r.culture.id, r.culture]));
  if (preview)
    for (const p of proposals)
      if (!map.has(p.record.culture.id))
        map.set(p.record.culture.id, p.record.culture);
  return [...map.values()];
};
const rows = (): DisplayRecord[] => {
  const base: DisplayRecord[] = [...dataset.records];
  if (preview)
    proposals.forEach((p, i) => {
      if (p.kind === "new" && dataset.records.some((r) => r.id === p.record.id))
        return;
      if (p.state === "ready" && !validateRecord(p.record).length) {
        const known = cultures().find((c) => c.id === p.record.culture.id);
        base.push({
          ...p.record,
          culture: known ?? p.record.culture,
          proposalKey: String(i),
        });
      }
    });
  return base.filter((r) => !hiddenCultures.has(r.culture.id));
};
const app = $("#app");
app.innerHTML = `<header class="topbar"><a class="brand" href="#map"><span class="brand-mark">◈</span><span><h1>Americas Peoples</h1><small>AN ATLAS OF HUMAN EVIDENCE</small></span></a><nav aria-label="Main navigation"><a href="#map">Map</a><a href="#evidence">Events / Evidence</a><a href="#context">Movement &amp; context</a><a href="#proposals">Suggestions <span id="proposal-count">${proposals.length}</span></a><a href="#about">About</a>${location.protocol === "file:" ? "" : '<a href="https://tripofisch.com/privacy/">Privacy &amp; analytics</a>'}</nav><span class="offline-badge"><i></i> ${location.protocol === "file:" ? "Fully offline" : "Local processing"}</span></header><div class="shell"><main id="main" tabindex="-1"></main></div><footer class="timeline"><div class="time-top"><div class="year-display"><span class="eyebrow">EXPLORING THE RECORD AT</span><strong id="current-year"></strong></div><div class="playback"><button id="restart" title="Earliest evidence" aria-label="Earliest evidence">↤</button><button id="play" class="play-button" aria-label="Play">▶ Play</button><label>Speed<select id="speed" aria-label="Playback speed" title="Years per second between evidence boundaries; a brief hold keeps short events visible"><option value="10">10 years / sec</option><option value="50">50 years / sec</option><option value="250" selected>250 years / sec</option><option value="1000">1,000 years / sec</option></select></label></div><form id="year-form" class="year-form"><label class="sr-only" for="year-number">Year number</label><input id="year-number" type="number" min="1" step="1" aria-label="Year number"><select id="era" aria-label="Era"><option>BCE</option><option>CE</option></select><button type="submit" aria-label="Go to year">Go</button></form><label class="range-window">Timeline window<select id="window" aria-label="Timeline window"><option value="all">Entire record</option><option value="1000">± 1,000 years</option><option value="100">± 100 years</option><option value="10">± 10 years</option></select></label></div><div id="time-error" role="alert"></div><div class="slider-wrap"><input type="range" id="time-slider" min="${minYear}" max="${END_YEAR}" step="1" value="${year}" aria-label="Timeline year"><div class="range-labels"><span id="range-start"></span><span>Drag to travel through time <span class="keyhint">← →</span></span><span id="range-end">${END_YEAR} CE · Indian Reorganization Act</span></div></div></footer><div id="toast" role="status"></div>`;
const main = $("#main");
const map = new MapView(land, (items) => {
  selected = items;
  renderVisible();
});
let mountedMap = false;
function announce(message: string) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  setTimeout(() => $("#toast").classList.remove("show"), 4500);
}
function saveLocal() {
  try {
    const text = JSON.stringify(makePackage(proposals));
    parsePackage(text);
    localStorage.setItem(storeKey, text);
  } catch {
    storageAvailable = false;
    announce(
      "Browser storage unavailable or collection too large. Download selected suggestions to keep them.",
    );
  }
  $("#proposal-count").textContent = String(proposals.length);
}
function stop() {
  playing = false;
  $("#play").textContent = "▶ Play";
  $("#play").setAttribute("aria-label", "Play");
}
function bounds(recenter = false) {
  const input = $<HTMLInputElement>("#time-slider"),
    w = $<HTMLSelectElement>("#window").value;
  if (w === "all") {
    input.min = String(minYear);
    input.max = String(END_YEAR);
  } else if (recenter) {
    input.min = String(Math.max(minYear, year - Number(w)));
    input.max = String(Math.min(END_YEAR, year + Number(w)));
  }
  $("#range-start").textContent = formatYear(Number(input.min));
  $("#range-end").textContent =
    formatYear(Number(input.max)) +
    (Number(input.max) === END_YEAR ? " · Indian Reorganization Act" : "");
}
function setYear(next: number, manual = true) {
  if (manual) stop();
  year = Math.round(Math.max(minYear, Math.min(END_YEAR, next)));
  const slider = $<HTMLInputElement>("#time-slider");
  if (year < Number(slider.min) || year > Number(slider.max)) bounds(true);
  slider.value = String(year);
  slider.setAttribute("aria-valuetext", formatYear(year));
  $("#current-year").textContent = formatYear(year);
  $<HTMLInputElement>("#year-number").value = String(
    year <= 0 ? 1 - year : year,
  );
  $<HTMLSelectElement>("#era").value = year <= 0 ? "BCE" : "CE";
  if (mountedMap) renderMapData();
  if (location.hash === "#evidence" && period === "current") renderTableBody();
}
function tick(now: number) {
  if (playing && now >= holdUntil) {
    const dt = Math.min((now - lastTick) / 1000, 0.25);
    fraction += dt * speed;
    if (fraction >= 1) {
      const n = Math.floor(fraction);
      fraction -= n;
      const next = advancePlayback(rows(), year, n);
      setYear(next.year, false);
      if (next.boundary) {
        holdUntil = now + 700;
        fraction = 0;
      }
    }
    if (year >= END_YEAR) stop();
  }
  lastTick = now;
  requestAnimationFrame(tick);
}
$("#play").addEventListener("click", () => {
  if (playing) {
    stop();
    return;
  }
  if (year === END_YEAR) setYear(minYear);
  playing = true;
  fraction = 0;
  holdUntil = 0;
  lastTick = performance.now();
  $("#play").textContent = "Ⅱ Pause";
  $("#play").setAttribute("aria-label", "Pause");
});
$("#restart").addEventListener("click", () => setYear(minYear));
$("#speed").addEventListener(
  "change",
  () => (speed = Number($<HTMLSelectElement>("#speed").value)),
);
$("#window").addEventListener("change", () => {
  bounds(true);
  setYear(year);
});
$("#time-slider").addEventListener("input", () =>
  setYear(Number($<HTMLInputElement>("#time-slider").value)),
);
$("#year-form").addEventListener("submit", (e) => {
  e.preventDefault();
  try {
    const next = parseYear(
      $<HTMLInputElement>("#year-number").value,
      $<HTMLSelectElement>("#era").value,
    );
    if (next < minYear || next > END_YEAR)
      throw new Error(
        `Choose a year from ${formatYear(minYear)} through ${END_YEAR} CE.`,
      );
    $("#time-error").textContent = "";
    setYear(next);
  } catch (error) {
    $("#time-error").textContent = (error as Error).message;
  }
});
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stop();
});
function mapPage() {
  mountedMap = true;
  const languageModels = dataset.records.filter((r) => r.linguistics);
  const languageLinks = languageModels.length
    ? `<section aria-labelledby="language-relationships-heading"><h4 id="language-relationships-heading">Language relationships</h4><p class="fine">All published language models, independent of the selected year. Models without dates remain outside the dated map.</p><ul>${languageModels.map((r) => `<li><a href="${esc(recordHref(r))}">${esc(r.title)}</a><br><small>${r.time.kind === "unplaced" ? "Chronology unresolved" : esc(timeLabel(r.time))}</small></li>`).join("")}</ul></section>`
    : "";
  main.innerHTML = `<div class="map-layout"><aside class="map-sidebar"><div class="eyebrow">ASIA-PACIFIC &amp; AMERICAS / ${dataset.records.length} EVIDENCE RECORDS</div><h2>Places hold<br>the evidence.</h2><p class="intro">Explore a changing record of human presence, one source at a time.</p><div class="scope-note">${esc(dataset.coverage)}</div><div class="legend-head"><h3>Cultures & peoples</h3><button id="show-all" class="text-button">Show all</button></div><input id="legend-search" type="search" placeholder="Find a culture or people…" aria-label="Search cultures" value="${esc(legendSearch)}"><div id="legend"></div><div class="map-key"><span><i class="key-dot"></i> Documented interval / dated event</span><span>Population dots: 1–500 · 501–2,500 · 2,501–10,000 · 10,001–50,000 · 50,001+</span><span><b>◩</b> Striped smallest dot = unknown population; display size only</span><span>Outer population halo = upper estimate; estimates are never added together</span><span><i class="key-ring"></i> Possible time / broadly dated occurrence</span><span><b>☁</b> Broad regional / genomic / environment / language evidence</span><span>Fading = illustrative temporal support, not probability</span><span><b class="asterisk dispute-discussion">*</b> Under discussion (lighter)</span><span><b class="asterisk dispute-disputed">*</b> Explicitly disputed (stronger)</span><span><i class="key-dash"></i> Unreviewed suggestion (opt-in)</span></div><div class="overlay-controls"><h3>Overlays</h3><p>Language layers use record dates and sourced reconstructions; distributions and relationships are approximate. Descent, borrowing and contact are distinct from culture or genetic ancestry.</p>${Object.entries(
    OVERLAY_LABELS,
  )
    .map(
      ([key, label]) =>
        `<label class="check"><input type="checkbox" data-layer="${key}" ${hiddenLayers.has(key) ? "" : "checked"}> ${esc(label)} overlays</label>`,
    )
    .join(
      "",
    )}<p class="fine">Teal diamond: trade. Coral cross: conflict. Red crossed square: violence. Purple ring: epidemic. Amber square or arrow: forced removal. Dashed lines connect sourced endpoints; they do not reconstruct a route. Symbols do not encode death tolls.</p>${languageLinks}</div><label class="check"><input id="preview" type="checkbox" ${preview ? "checked" : ""}> Preview complete suggestions</label><p class="fine">A dot ending means the displayed evidence ends. It does not establish abandonment or a population's fate.</p></aside><section class="map-stage" aria-label="Map and active evidence"><div class="map-topline"><span id="active-count"></span><span>Pan · Scroll to zoom</span></div><div id="map-host"></div><section class="visible-panel"><div class="visible-heading"><h3 id="visible-heading">Visible evidence</h3><button id="clear-selection" class="text-button">Show all visible</button></div><div id="visible-records"></div></section></section></div>`;
  $("#map-host").append(map.element);
  main.querySelectorAll<HTMLInputElement>("[data-layer]").forEach((el) =>
    el.addEventListener("change", () => {
      if (el.checked) hiddenLayers.delete(el.dataset.layer!);
      else hiddenLayers.add(el.dataset.layer!);
      selected = [];
      renderMapData();
    }),
  );
  $("#legend-search").addEventListener("input", (e) => {
    legendSearch = (e.target as HTMLInputElement).value;
    renderLegend();
  });
  $("#show-all").addEventListener("click", () => {
    hiddenCultures.clear();
    renderLegend();
    renderMapData();
  });
  $("#preview").addEventListener("change", (e) => {
    preview = (e.target as HTMLInputElement).checked;
    renderLegend();
    renderMapData();
  });
  $("#clear-selection").addEventListener("click", () => {
    selected = [];
    renderVisible();
  });
  renderLegend();
  renderMapData();
}
function renderLegend() {
  const list = cultures().filter((c) =>
    c.name.toLowerCase().includes(legendSearch.toLowerCase()),
  );
  $("#legend").innerHTML = list
    .map(
      (c) =>
        `<label class="legend-row"><input type="checkbox" data-culture="${esc(c.id)}" ${hiddenCultures.has(c.id) ? "" : "checked"}><i style="background:${c.color}"></i><span>${esc(c.name)}</span></label>`,
    )
    .join("");
  $("#legend")
    .querySelectorAll<HTMLInputElement>("input")
    .forEach((el) =>
      el.addEventListener("change", () => {
        if (el.checked) hiddenCultures.delete(el.dataset.culture!);
        else hiddenCultures.add(el.dataset.culture!);
        renderMapData();
      }),
    );
}
function renderMapData() {
  const active = activeRecords(mapRows(), year);
  map.update(active, year);
  $("#active-count").textContent =
    `${active.filter((r) => (r.overlay ? r.overlay.geometry : r.location)).length} mapped records at this time`;
  renderVisible();
}
function renderVisible() {
  if (!mountedMap) return;
  const active = activeRecords(mapRows(), year);
  const chosen = selected.length
    ? active.filter((r) =>
        selected.some((s) => s.id === r.id && s.proposalKey === r.proposalKey),
      )
    : active;
  $("#visible-heading").textContent = selected.length
    ? "Selected location"
    : "Visible evidence";
  $("#visible-records").innerHTML = chosen.length
    ? chosen
        .map(
          (r) =>
            `<a class="evidence-card" href="${recordHref(r)}"><i style="background:${r.culture.color}"></i><div><strong>${esc(r.title)}${isDisputed(r) ? `<span class="asterisk dispute-${disputeLevel(r)}" title="${esc(disputeLabel(r))}"> *</span>` : ""}${r.proposalKey ? " · Proposal" : ""}</strong><span>${esc(r.culture.name)} · ${esc(timeLabel(r.time))}${!r.overlay && r.type !== "movement" ? " · " + esc(populationAt([r], year).label) : ""} · ${temporalState(r.time, year) === "possible" ? "Possible time" : "Documented time"}</span></div><span class="card-arrow">↗</span></a>`,
        )
        .join("")
    : `<p class="empty">${selected.length ? "No selected records intersect this year. Use “Show all visible” to clear the selection." : "No included evidence intersects this year and these filters. This is a gap in this small dataset, not evidence of an uninhabited continent."}</p>`;
}
function tablePage() {
  main.innerHTML = `<article class="table-page"><div class="page-heading"><div><div class="eyebrow">THE EVIDENCE INDEX</div><h2>Every row has a source.</h2><p class="lead">Occupation, occurrences, movements, and events. Open a row for its full review.</p></div><a class="button primary" href="#new">+ Suggest new evidence</a></div><div class="table-filters"><input id="table-search" type="search" aria-label="Search evidence" placeholder="Search places, cultures, claims…" value="${esc(search)}"><label>Period<select id="period" aria-label="Table period"><option value="all" ${period === "all" ? "selected" : ""}>All records</option><option value="current" ${period === "current" ? "selected" : ""}>At selected year</option></select></label><label>Type<select id="type-filter" aria-label="Record type filter">${["all", "occupation", "occurrence", "movement", "event", ...Object.keys(OVERLAY_LABELS)].map((t) => `<option value="${t}" ${t === typeFilter ? "selected" : ""}>${esc(OVERLAY_LABELS[t as keyof typeof OVERLAY_LABELS] ?? t)}</option>`).join("")}</select></label><label>Sort<select id="sort" aria-label="Sort evidence"><option value="oldest" ${sort === "oldest" ? "selected" : ""}>Earliest first</option><option value="newest" ${sort === "newest" ? "selected" : ""}>Latest first</option><option value="name" ${sort === "name" ? "selected" : ""}>Name</option></select></label><label class="check"><input id="table-preview" type="checkbox" ${preview ? "checked" : ""}> Preview suggestions</label></div><p id="table-caption" class="muted"></p><div class="table-scroll"><table><thead><tr><th>Dates / occupation</th><th>Evidence & location</th><th>Culture / people</th><th>Type</th><th>Evidence status</th><th>Supporting page</th></tr></thead><tbody></tbody></table></div><p class="fine">* A particular claim is under discussion or disputed. Open its review to see which claim and why. Culture filters from the map also apply here.</p></article>`;
  for (const [selector, handler] of [
    ["#table-search", (v: string) => (search = v)],
    ["#period", (v: string) => (period = v)],
    ["#type-filter", (v: string) => (typeFilter = v)],
    ["#sort", (v: string) => (sort = v)],
  ] as const) {
    $(selector).addEventListener(
      selector === "#table-search" ? "input" : "change",
      (e) => {
        handler((e.target as HTMLInputElement).value);
        renderTableBody();
      },
    );
  }
  $("#table-preview").addEventListener("change", (e) => {
    preview = (e.target as HTMLInputElement).checked;
    renderTableBody();
  });
  renderTableBody();
}
function renderTableBody() {
  let records = rows().filter(
    (r) =>
      (typeFilter === "all" || (r.overlay?.kind ?? r.type) === typeFilter) &&
      `${r.title} ${r.location?.name ?? ""} ${r.culture.name} ${r.linguistics?.languages.map(l => `${l.name} ${l.family ?? ""}`).join(" ") ?? ""} ${r.linguistics?.relationship?.kind ?? ""} ${r.claims.map((c) => c.text).join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  if (period === "current") records = activeRecords(records, year);
  records.sort((a, b) =>
    sort === "name"
      ? a.title.localeCompare(b.title)
      : sort === "newest"
        ? (b.time.start ?? -Infinity) - (a.time.start ?? -Infinity)
        : (a.time.start ?? Infinity) - (b.time.start ?? Infinity),
  );
  $("#table-caption").textContent =
    `${records.length} records · ${period === "all" ? "All dates" : formatYear(year)}${hiddenCultures.size ? " · Some cultures hidden" : ""}${preview ? " · Complete proposals included" : ""}`;
  $("tbody", main).innerHTML =
    records
      .map(
        (r) =>
          `<tr data-href="${recordHref(r)}"><td><strong>${esc(timeLabel(r.time))}</strong><small>${esc(r.time.kind === "occurrence" && r.time.start !== r.time.end ? "Possible occurrence window" : r.time.kind)}</small></td><td><strong>${esc(r.title)}${isDisputed(r) ? " *" : ""}</strong><small>${esc(r.location?.name ?? (r.overlay?.geometry ? "Mapped overlay" : "Unmapped"))}</small></td><td><span class="culture-label"><i style="background:${r.culture.color}"></i>${esc(r.culture.name)}</span></td><td>${esc(r.overlay ? OVERLAY_LABELS[r.overlay.kind] : r.type)}</td><td>${r.proposalKey ? '<span class="tag proposal-tag">Unreviewed proposal</span>' : ""}<span class="tag">${isDisputed(r) ? "* See discussion" : "Well-supported"}</span></td><td><a href="${recordHref(r)}">Detailed review</a></td></tr>`,
      )
      .join("") ||
    '<tr><td colspan="6" class="empty">No matching records. Broaden your filters or select All records.</td></tr>';
  $("tbody", main)
    .querySelectorAll<HTMLElement>("tr[data-href]")
    .forEach((tr) =>
      tr.addEventListener("click", (e) => {
        if (!(e.target as Element).closest("a"))
          location.hash = tr.dataset.href!;
      }),
    );
}
function reviewPage(r: DisplayRecord, p?: Proposal, index?: number) {
  main.innerHTML = reviewHTML(r, dataset, p);
  main
    .querySelectorAll<HTMLElement>("[data-source],[data-claim]")
    .forEach((a) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        document
          .getElementById(
            a.dataset.source !== undefined
              ? "source-" + a.dataset.source
              : "claim-" + a.dataset.claim,
          )
          ?.scrollIntoView({ behavior: "instant", block: "center" });
      }),
    );
  $('[data-action="correct"]', main).addEventListener("click", () => {
    if (index !== undefined) location.hash = `#edit/${index}`;
    else {
      editorPending = newProposal(r);
      location.hash = "#compose";
    }
  });
  $('[data-action="share"]', main).addEventListener("click", () => {
    const share = p ?? newProposal(r);
    if (!p)
      share.rationale =
        "Evidence row shared for discussion; no changes proposed.";
    exportProposals([share]);
  });
  $('[data-action="locate"]', main).addEventListener("click", () => {
    if (r.time.start !== null) setYear(r.time.start);
    if (p) preview = true;
    hiddenCultures.delete(r.culture.id);
    if (r.overlay) hiddenLayers.delete(r.overlay.kind);
    location.hash = "#map";
    setTimeout(() => map.focus(r), 0);
  });
}
let editorPending: Proposal | null = null;
function exportProposals(list: Proposal[]) {
  try {
    if (!list.length) {
      announce("Select at least one suggestion to share.");
      return;
    }
    const pack = makePackage(list);
    parsePackage(JSON.stringify(pack));
    downloadJSON("americas-peoples-suggestions.json", pack);
    announce(
      "File downloaded. Send it using your preferred email or file-sharing service.",
    );
  } catch (error) {
    announce((error as Error).message);
  }
}
function proposalsPage() {
  main.innerHTML = `<article class="proposals-page"><div class="page-heading"><div><div class="eyebrow">A LOCAL RESEARCH WORKSPACE</div><h2>Your suggestions</h2><p class="lead">Add evidence. Propose a correction. Share the supporting research.</p></div><a class="button primary" href="#new">+ Suggest new evidence</a></div><p id="storage-status" class="notice">${storageAvailable ? "Browser storage is available as a convenience. Download your suggestions for a portable backup." : "Browser storage is unavailable. Download your suggestions before closing this page."}</p><div class="actions"><button id="export-selected">Send to others</button><button id="select-all">Select all</button><label class="button file-button">Import suggestions<input type="file" id="import-file" aria-label="Import suggestions" accept=".json,.xlsx,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></label></div><p class="muted">Sharing downloads a file; nothing is uploaded or emailed. Imported suggestions remain unreviewed. Complete suggestions can be previewed on the map.</p><div class="actions"><a href="docs/bulk-import-guide.html">Bulk import guide</a><a href="templates/americas-peoples-import.xlsx" download>Download spreadsheet template</a><a href="templates/americas-peoples-researched-import.xlsx" download>Download researched batch</a></div><p class="muted">Bulk entry: use the XLSX template for records, claims, references and source mappings. Excel, LibreOffice, or a downloaded Google Sheets workbook can be used.</p><div id="import-error" role="alert"></div><div class="proposal-list">${proposals.length ? proposals.map((p, i) => `<section class="proposal-card" data-proposal-card><label class="check"><input type="checkbox" data-share="${i}" aria-label="Select proposal ${i + 1}"><span class="tag proposal-tag">${esc(p.state)} · ${esc(p.kind)} · v${p.version}</span></label><h3>${esc(p.record.title || "Untitled draft")}</h3><p>${esc(p.rationale || "No rationale yet.")}</p><div class="actions"><a href="#proposal/${i}">Detailed review</a><a href="#edit/${i}">Edit suggestion</a></div>${comparisonHTML(p)}</section>`).join("") : '<div class="empty large"><h3>A place for the next finding.</h3><p>Start a new evidence row or open a reviewed record and choose Suggest correction.</p></div>'}</div></article>`;
  $("#export-selected").addEventListener("click", () =>
    exportProposals(
      [...main.querySelectorAll<HTMLInputElement>("[data-share]:checked")].map(
        (el) => proposals[Number(el.dataset.share)],
      ),
    ),
  );
  $("#select-all").addEventListener("click", () =>
    main
      .querySelectorAll<HTMLInputElement>("[data-share]")
      .forEach((el) => (el.checked = true)),
  );
  $<HTMLInputElement>("#import-file").addEventListener("change", async (e) => {
    const control = e.target as HTMLInputElement;
    const file = control.files?.[0];
    if (!file) return;
    control.disabled = true;
    $("#import-error").textContent = "Reading and validating the file…";
    try {
      if (file.name.toLowerCase().endsWith(".xlsx")) {
        if (file.size > 5_000_000)
          throw new Error("Workbook exceeds the 5 MB file limit.");
        pending = await importWorkbook(
          await file.arrayBuffer(),
          dataset.records,
        );
      } else if (file.name.toLowerCase().endsWith(".json")) {
        if (file.size > MAX_PACKAGE_BYTES)
          throw new Error("Package exceeds the 4 MB limit.");
        pending = parsePackage(await file.text());
      } else
        throw new Error(
          "Choose a .xlsx template workbook or a native .json proposal file.",
        );
      location.hash = "#import";
    } catch (error) {
      $("#import-error").textContent = (error as Error).message;
    } finally {
      control.disabled = false;
      control.value = "";
    }
  });
}
function importPage() {
  if (!pending) {
    location.hash = "#proposals";
    return;
  }
  const report = inspectImport(pending.proposals, proposals, dataset.records);
  main.innerHTML = `<article class="proposals-page"><a href="#proposals" class="back-link">← Your suggestions</a><h2>Review import</h2><p class="lead">${report.length} suggestions. Nothing has been added yet.</p><p>Duplicate copies are skipped. Conflicting copies are retained separately for your review. No bundled evidence will change.</p>${report.map((item) => `<section class="proposal-card"><span class="tag">${item.status}</span><h3>${esc(item.proposal.record.title || "Untitled draft")}</h3><p>${esc(item.reason)}</p><p>${esc(item.proposal.rationale)}</p>${comparisonHTML(item.proposal)}<details><summary>Full incoming record and sources</summary><pre>${esc(JSON.stringify(item.proposal.record, null, 2))}</pre></details></section>`).join("")}<div class="actions"><button id="confirm-import" class="primary">Add to local collection</button><a href="#proposals">Cancel</a></div></article>`;
  $("#confirm-import").addEventListener("click", () => {
    proposals = mergeImport(pending!.proposals, proposals);
    pending = null;
    saveLocal();
    location.hash = "#proposals";
  });
}
function aboutPage() {
  main.innerHTML = `<article class="review-page"><div class="eyebrow">METHOD & COVERAGE</div><h2>The record, with its uncertainties.</h2><p class="lead">A fully offline atlas of archaeological and verified historical evidence, from the earliest included finding through ${END_YEAR}.</p><section><h3>A deliberately small beginning</h3><p>${esc(dataset.coverage)}</p><p>App ${appVersion} · Dataset ${esc(dataset.version)} · source check ${esc(dataset.reviewedAt)}</p><p>“Bundled evidence” means the included sources were checked to the extent described on each review page. It is not an independent peer review or a guarantee of scholarly consensus. The record is not a population census.</p></section><section><h3>How to read the map</h3><p>Filled dots show documented intervals or precisely dated events. Outlined dots show a broadly dated occurrence or uncertain interval edge. An asterisk marks a claim under discussion or dispute. Open the detailed review to see which claim and why. Culture colors are descriptive classifications, not racial categories.</p><p>Clouds show schematic regional connections or environmental context, not excavated settlements, precise routes, affected-area boundaries or statistical confidence regions. Uncertain dates fade within their stated bounds; supported certain cores stay fully visible. With no certain core, the fade is symmetric and illustrative, not a probability estimate or population size. Single rounded dates remain reference dates rather than invented ranges. Dates are inclusive. An occurrence window means something is dated within that window; it does not imply continuous settlement. A blank year means no included matching record, not human absence. Arrow paths are schematic unless separately supported.</p></section><section><h3>Why the timeline ends in 1934</h3><p>The Indian Reorganization Act is a policy boundary chosen for this edition. It does not mark the end of dispossession, forced relocation, or Indigenous history. Native nations and communities continued beyond the displayed periods. A disappearing marker indicates the end of an included evidence interval, never extinction by itself.</p><p>Epidemics, massacres and forced removals have separate layers. Mortality estimates belong to specific sources, populations and date ranges; the map does not turn them into an unsupported population census or disease-spread animation.</p></section><section><h3>Academic evidence</h3><p>Each claim maps to specific scholarly or archival sources. Critical historical reading and corroboration matter: repeated assertions are not independent evidence. Original dating, methods, calendar interpretation and limitations stay attached to the record. Uncalibrated radiocarbon ages are not silently converted into calendar years.</p></section><section><h3>Your local workspace</h3><p>Suggest new rows or corrections, then save as drafts or complete suggestions. “Complete” means required fields are present, not academically verified. “Send to others” downloads selected rows with their review content and bibliography. A recipient imports and previews the package. Corrections preserve the original and base revision. No proposal automatically replaces reviewed data.</p><p>Browser storage may vary by browser and file location. Export files are the portable backup. Copying or moving index.html does not transfer browser storage. Import your saved files into the new copy.</p></section><section><h3>Offline and hosted use</h3><p>All map geometry, code, evidence and review pages are bundled. The downloaded ZIP works fully offline after extraction. A hosted page needs its initial files from the host; future offline reloads are not guaranteed. Source links open online only when selected. Processing and suggestions stay in your browser. There is no account, application backend or automatic update check. Your research drafts are not uploaded. ${location.protocol === "file:" ? "This extracted offline copy does not receive hosting analytics." : 'The hosted edition uses Cloudflare Web Analytics for usage and performance measurements. These are separate from your research drafts. The host and Cloudflare also receive ordinary web-request information. <a href="https://tripofisch.com/privacy/">Privacy notice</a>.'}</p></section><section><h3>Attribution and licensing</h3><p>Made with Natural Earth. Generalized reference coastlines are public domain and represent modern geography, not ancient coastlines or ice sheets. ${esc(dataset.license)}</p><p>See README and THIRD_PARTY files in the download for build instructions, dependency licenses and dataset maintenance.</p></section></article>`;
}
let previousHash = location.hash || "#map";
let reverting = false;
function route() {
  const hash = location.hash || "#map";
  if (reverting) {
    reverting = false;
    return;
  }
  if (
    dirty &&
    hash !== previousHash &&
    !confirm("Leave this unsaved suggestion? Use Save draft to keep it.")
  ) {
    reverting = true;
    location.hash = previousHash;
    return;
  }
  dirty = false;
  previousHash = hash;
  mountedMap = false;
  stop();
  document
    .querySelectorAll("nav a")
    .forEach((a) =>
      a.classList.toggle("active", a.getAttribute("href") === hash),
    );
  try {
    if (hash === "#map") mapPage();
    else if (hash === "#evidence") tablePage();
    else if (hash === "#context") main.innerHTML = contextHTML(rows());
    else if (hash === "#proposals") proposalsPage();
    else if (hash === "#about") aboutPage();
    else if (hash === "#import") importPage();
    else if (hash.startsWith("#review/")) {
      const r = dataset.records.find(
        (r) => r.id === decodeURIComponent(hash.slice(8)),
      );
      if (!r) throw new Error("This evidence record is not in this dataset.");
      reviewPage(r);
    } else if (hash.startsWith("#proposal/")) {
      const i = Number(hash.slice(10)),
        p = proposals[i];
      if (!p) throw new Error("Suggestion not found.");
      reviewPage({ ...p.record, proposalKey: String(i) }, p, i);
    } else if (
      hash === "#new" ||
      hash === "#compose" ||
      hash.startsWith("#edit/")
    ) {
      const index = hash.startsWith("#edit/")
        ? Number(hash.slice(6))
        : undefined;
      const p =
        index !== undefined
          ? proposals[index]
          : hash === "#compose"
            ? editorPending
            : newProposal();
      if (!p) throw new Error("Suggestion not found.");
      mountEditor(
        main,
        p,
        (saved) => {
          if (index !== undefined) {
            saved.version = p.version + 1;
            proposals[index] = saved;
          } else proposals.push(saved);
          dirty = false;
          saveLocal();
          location.hash = "#proposals";
        },
        (value) => (dirty = value),
      );
    } else throw new Error("Page not found.");
  } catch (error) {
    main.innerHTML = `<article class="review-page"><h2>Unable to open this page</h2><p>${esc((error as Error).message)}</p><a href="#map">Return to map</a></article>`;
  }
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);
bounds(true);
setYear(year);
route();
requestAnimationFrame(tick);
