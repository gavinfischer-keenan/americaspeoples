import { recordsForView, retainCurrentSelection, canSelect, type AtlasMode } from "./atlas-view";
import { effectiveClimateHidden } from "./physical-rules";
import { siteGuideIndex } from "./site-guides";
import "./styles.css";
import { version as appVersion } from "../package.json";
import { dataset, fullRecord, completeDataset } from "./client-data";
import land from "../data/land.geojson";
import type {
  DisplayRecord,
  FullDisplayRecord,
  Proposal,
  SharePackage,
} from "./model";
import {
  formatYear,
  parseYear,
  earliestYear,
  timeLabel,
  END_YEAR,
} from "./time";
import { timelinePosition, timelineYear, type TimelineScale } from "./timeline";
import { MapView } from "./map";
import { MapPanels } from "./map-panels";
import { EvidenceTable, type EvidenceTableState } from "./evidence-table";
import { mountPhysicalPage } from "./physical-page";
import { aboutPageHTML } from "./about-page";
import {
  climateKinds,
  climateLabels,
  climateCategory,
  iceSnapshot,
  iceTarget,
  requestIce,
  eventsAt,
  hazardTimes,
  fullHazard,
  initializePhysical,
  onPhysicalChange,
  physicalState,
  physicalRevision,
  iceLoadState,
} from "./physical";
import { filterMapRecords } from "./map-filters";
import { esc, $, downloadJSON } from "./dom";
import { reviewHTML, recordHref, comparisonHTML } from "./review";
import { mountEditor, newProposal } from "./editor";
import {
  makePackage,
  parsePackage,
  inspectImport,
  mergeImport,
  MAX_PACKAGE_BYTES,
  validateCollection,
} from "./proposals";
import { RecordView } from "./record-view";
import { PlaybackIndex } from "./playback-index";
import { importWorkbook } from "./xlsx-import";
import { encodeLocalCollection, decodeLocalCollection } from "./local-storage";
import { OVERLAY_LABELS } from "./overlays";
import { contextHTML } from "./context";

const minYear = earliestYear(dataset.records);
let year = minYear,
  playing = false,
  speed: number | "smart" = "smart",
  lastTick = 0,
  fraction = 0,
  dirty = false,
  holdUntil = 0;
let timelineScale: TimelineScale = "log";
let rangeStart = minYear,
  rangeEnd = END_YEAR;
const SLIDER_STEPS = 1000000;
let proposals: Proposal[] = [],
  pending: SharePackage | null = null,
  storageAvailable = true;
let proposalsRevision = 0;
const recordView = new RecordView(dataset.records);
let preview = false,
  legendSearch = "";
let selected: DisplayRecord[] = [];
let atlasMode: AtlasMode = "movie";
let panels: MapPanels | null = null;
let currentActive: DisplayRecord[] = [];
let tableController: EvidenceTable | undefined;
const tableState: EvidenceTableState = {
  search: "",
  period: "all",
  type: "all",
  sort: "oldest",
};
const hiddenCultures = new Set<string>();
const hiddenLayers = new Set<string>();
let showModeled = true;
let showNaturalEvents = true;
const currentClimateHidden = () => effectiveClimateHidden(hiddenClimate, showNaturalEvents);
let showUndated = true,
  showIce = true,
  showCurrents = false,
  showWinds = false,
  showUncertainHazards = false;
let iceScenario = "optimal";
const hiddenClimate = new Set<string>();
const mapRows = () =>
  filterMapRecords(rows(), hiddenLayers, showModeled).filter(
    (r) => !hiddenClimate.has(climateCategory(r) ?? ""),
  );
const storeKey = "americas-peoples-proposals-v1";
try {
  const saved = localStorage.getItem(storeKey);
  if (saved) proposals = parsePackage(decodeLocalCollection(saved)).proposals;
  localStorage.setItem("ap-storage-check", "1");
  localStorage.removeItem("ap-storage-check");
} catch {
  storageAvailable = false;
}
const cultures = () =>
  recordView.cultures(proposals, preview, proposalsRevision);
const rows = () =>
  recordView.get(proposals, preview, hiddenCultures, proposalsRevision);
let playbackKey = "";
let playback: PlaybackIndex;
function playbackIndex() {
  const key = [
    proposalsRevision,
    preview,
    showModeled,
    showUncertainHazards,
    showNaturalEvents,
    physicalRevision,
    [...hiddenCultures].sort().join(","),
    [...hiddenLayers].sort().join(","),
    [...hiddenClimate].sort().join(","),
  ].join("|");
  if (key !== playbackKey) {
    playbackKey = key;
    playback = new PlaybackIndex([
      ...mapRows(),
      ...hazardTimes(currentClimateHidden(), showUncertainHazards),
    ]);
  }
  return playback;
}
const app = $("#app");
app.innerHTML = `<header class="topbar"><a class="brand" href="#movie"><span class="brand-mark">◈</span><span><h1>Americas Peoples</h1><small>AN ATLAS OF HUMAN EVIDENCE</small></span></a><nav aria-label="Main navigation"><a href="#movie">Movie</a><a href="#explore">Explore</a><a href="#evidence">Events / Evidence</a><a href="#context">Movement &amp; context</a><a href="#sites">Places &amp; cultures</a><a href="#proposals">Suggestions <span id="proposal-count">${proposals.length}</span></a><a href="#about">About</a>${location.protocol === "file:" ? "" : '<a href="https://tripofisch.com/privacy/">Privacy &amp; analytics</a>'}</nav><span class="offline-badge"><i></i> ${location.protocol === "file:" ? "Fully offline" : "Server-backed atlas"}</span></header><div class="shell"><main id="main" tabindex="-1"></main></div><footer class="timeline"><div class="time-top"><div class="year-display"><span class="eyebrow">MOVIE YEAR</span><strong id="current-year"></strong></div><div class="playback"><button id="restart" title="Earliest evidence" aria-label="Earliest evidence">↤</button><button id="play" class="play-button" aria-label="Play">▶ Play</button><label>Speed<select id="speed" aria-label="Playback speed" title="Smart adapts to evidence density in enabled layers; brief events still pause"><option value="smart" selected>Smart · evidence density</option><option value="10">10 years / sec</option><option value="50">50 years / sec</option><option value="250">250 years / sec</option><option value="1000">1,000 years / sec</option></select></label><label>Scale<select id="time-scale" aria-label="Timeline scale"><option value="log" selected>Logarithmic</option><option value="linear">Linear</option></select></label></div><form id="year-form" class="year-form"><label class="sr-only" for="year-number">Year number</label><input id="year-number" type="number" min="1" step="1" aria-label="Year number"><select id="era" aria-label="Era"><option>BCE</option><option>CE</option></select><button type="submit" aria-label="Go to year">Go</button></form><label class="range-window">Timeline window<select id="window" aria-label="Timeline window"><option value="all">Entire record</option><option value="1000">± 1,000 years</option><option value="100">± 100 years</option><option value="10">± 10 years</option></select></label></div><div id="time-error" role="alert"></div><div class="slider-wrap"><input type="range" id="time-slider" min="0" max="1000000" step="1" value="0" aria-label="Timeline year" aria-describedby="timeline-note"><div id="time-ticks" class="time-ticks" aria-hidden="true"></div><div class="range-labels"><span id="range-start"></span><span><span id="timeline-note">Logarithmic scale · equal distances cover unequal years</span> <span class="keyhint">← →</span></span><span id="range-end">${END_YEAR} CE · Indian Reorganization Act</span></div></div></footer><div id="toast" role="status"></div>`;
const main = $("#main");
const map = new MapView(
  land,
  (items) => {
    if (!canSelect(atlasMode, playing)) { stop(); return; }
    selected = retainCurrentSelection(items, currentActive, atlasMode);
    renderVisible();
  },
  () => renderVisible(),
);
let mountedMap = false;
main.addEventListener("click", event => {
  if (mountedMap && atlasMode === "movie" && playing && (event.target as Element).closest("#visible-records,#context-records,#selected-records,#hazard-status")) {
    event.preventDefault(); event.stopImmediatePropagation(); stop();
  }
}, true);
function announce(message: string) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  setTimeout(() => $("#toast").classList.remove("show"), 4500);
}
function saveLocal() {
  proposalsRevision++;
  try {
    const text = JSON.stringify(makePackage(proposals));
    parsePackage(text);
    localStorage.setItem(storeKey, encodeLocalCollection(text));
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
  if (mountedMap) {
    map.setInteraction({ mode: atlasMode, playing: false, onPause: stop });
    document.body.classList.remove("movie-playing");
    renderVisible();
  }
}
function bounds(recenter = false) {
  const w = $<HTMLSelectElement>("#window").value;
  if (w === "all") {
    rangeStart = minYear;
    rangeEnd = END_YEAR;
  } else if (recenter) {
    rangeStart = Math.max(minYear, year - Number(w));
    rangeEnd = Math.min(END_YEAR, year + Number(w));
  }
  $("#range-start").textContent = formatYear(rangeStart);
  $("#range-end").textContent =
    formatYear(rangeEnd) +
    (rangeEnd === END_YEAR ? " · Indian Reorganization Act" : "");
  $("#timeline-note").textContent =
    timelineScale === "log"
      ? "Logarithmic scale · equal distances cover unequal years"
      : "Linear scale · equal distances cover equal years";
  const ticks = [-100000, -50000, -25000, -10000, -5000, -1000, 1, 1000];
  let last = -1;
  $("#time-ticks").innerHTML = ticks
    .filter((y) => y > rangeStart && y < rangeEnd)
    .map((y) => {
      const p = timelinePosition(y, rangeStart, rangeEnd, timelineScale);
      if (p < 0.06 || p > 0.94 || p - last < 0.11) return "";
      last = p;
      return `<span style="left:${p * 100}%">${formatYear(y)}</span>`;
    })
    .join("");
}
function setYear(next: number, manual = true) {
  if (manual) stop();
  year = Math.round(Math.max(minYear, Math.min(END_YEAR, next)));
  const slider = $<HTMLInputElement>("#time-slider");
  if (year < rangeStart || year > rangeEnd) bounds(true);
  slider.value = String(
    Math.round(
      SLIDER_STEPS *
        timelinePosition(year, rangeStart, rangeEnd, timelineScale),
    ),
  );
  slider.setAttribute("aria-valuetext", formatYear(year));
  $("#current-year").textContent = formatYear(year);
  $<HTMLInputElement>("#year-number").value = String(
    year <= 0 ? 1 - year : year,
  );
  $<HTMLSelectElement>("#era").value = year <= 0 ? "BCE" : "CE";
  if (mountedMap) renderMapData();
  if (location.hash === "#evidence" && tableState.period === "current")
    renderTableBody();
}
function tick(now: number) {
  if (playing && now >= holdUntil) {
    const dt = Math.min((now - lastTick) / 1000, 0.25);
    const pacing = playbackIndex();
    fraction += dt * (speed === "smart" ? pacing.yearsPerSecond(year) : speed);
    if (fraction >= 1) {
      const n = Math.floor(fraction);
      fraction -= n;
      const next = pacing.advance(year, n);
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
  if (!mountedMap || atlasMode === "explore") { location.hash = "#movie"; return; }
  if (playing) {
    stop();
    return;
  }
  if (year === END_YEAR) setYear(minYear);
  playing = true;
  selected = [];
  renderMapData();
  fraction = 0;
  holdUntil = 0;
  lastTick = performance.now();
  $("#play").textContent = "Ⅱ Pause";
  $("#play").setAttribute("aria-label", "Pause");
});
$("#restart").addEventListener("click", () => setYear(minYear));
$("#speed").addEventListener("change", () => {
  const value = $<HTMLSelectElement>("#speed").value;
  speed = value === "smart" ? "smart" : Number(value);
  fraction = 0;
});
$("#window").addEventListener("change", () => {
  bounds(true);
  setYear(year);
});
$("#time-slider").addEventListener("input", () =>
  setYear(
    timelineYear(
      Number($<HTMLInputElement>("#time-slider").value) / SLIDER_STEPS,
      rangeStart,
      rangeEnd,
      timelineScale,
    ),
  ),
);
$("#time-scale").addEventListener("change", () => {
  timelineScale = $<HTMLSelectElement>("#time-scale").value as TimelineScale;
  bounds();
  setYear(year);
});
$("#time-slider").addEventListener("keydown", (event) => {
  const e = event as KeyboardEvent;
  const step = e.shiftKey ? 10 : 1;
  let next: number;
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = year - step;
  else if (e.key === "ArrowRight" || e.key === "ArrowUp") next = year + step;
  else if (e.key === "Home") next = rangeStart;
  else if (e.key === "End") next = rangeEnd;
  else return;
  e.preventDefault();
  setYear(Math.max(rangeStart, Math.min(rangeEnd, next)));
});
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
  const languageLinks = atlasMode === "explore" && languageModels.length
    ? `<section aria-labelledby="language-relationships-heading"><h4 id="language-relationships-heading">Language relationships</h4><p class="fine">All published language models, independent of the selected year. Models without dates remain outside the dated map.</p><ul>${languageModels.map((r) => `<li><a href="${esc(recordHref(r))}">${esc(r.title)}</a><br><small>${r.time.kind === "unplaced" ? "Chronology unresolved" : esc(timeLabel(r.time))}</small></li>`).join("")}</ul></section>`
    : "";
  main.innerHTML = `<div class="atlas-toolbar" aria-label="Map panels"><button id="toggle-sites" aria-controls="site-panel" aria-expanded="true">Hide site list</button><button id="toggle-details" aria-controls="detail-panel" aria-expanded="true">Hide details</button></div><div class="map-layout atlas-layout"><aside id="site-panel" class="site-panel" aria-label="Visible site list"><div class="visible-heading"><h3 id="visible-heading">${atlasMode === "movie" ? "Current evidence" : "Explore evidence · all periods"}</h3><span id="visible-count"></span></div><p class="panel-hint">${atlasMode === "movie" ? "Only evidence at the movie year. While playing, hover for a summary; click to pause before selecting." : "All periods inside the current map view. Select a place, area or question mark to inspect its dates and sources."}</p><details class="culture-disclosure"><summary>Cultures &amp; map information</summary><div class="map-sidebar"><div class="eyebrow">ASIA-PACIFIC &amp; AMERICAS / ${dataset.records.length} EVIDENCE RECORDS</div><h2>Places hold<br>the evidence.</h2><p class="intro">Explore a changing record of human presence, one source at a time.</p><div class="scope-note">${esc(dataset.coverage)}</div><div class="legend-head"><h3>Cultures & peoples</h3><button id="show-all" class="text-button">Show all</button></div><input id="legend-search" type="search" placeholder="Find a culture or people…" aria-label="Search cultures" value="${esc(legendSearch)}"><div id="legend"></div><div class="map-key"><span>→ Directed movement · ↔ Two-way exchange · ⤧ Four-headed arrow: multiple directions, not four literal routes</span><span><i class="key-dot"></i> Documented interval / dated event</span><span>${atlasMode === "explore" ? "Explore marker size is a constant reference; inspect dated population estimates." : "Population dots: 1–500 · 501–2,500 · 2,501–10,000 · 10,001–50,000 · 50,001+"}</span><span><b>◩</b> Movie only: striped smallest dot = unknown population; display size only</span><span>Movie only: outer population halo = upper estimate; estimates are never added together</span><span><i class="key-ring"></i> Possible time / broadly dated occurrence</span><span><b>☁</b> Broad regional / genomic / environment / language evidence</span><span>Movie fading = illustrative temporal support, not probability</span><span><b class="asterisk dispute-discussion">*</b> Under discussion (lighter)</span><span><b class="asterisk dispute-disputed">*</b> Explicitly disputed (stronger)</span><span><i class="key-dash"></i> Unreviewed suggestion (opt-in)</span></div><label class="check"><input id="preview" type="checkbox" ${preview ? "checked" : ""}> Preview complete suggestions</label><p class="fine">A dot ending means the displayed evidence ends. It does not establish abandonment or a population's fate.</p></div></details><div id="visible-records"></div><section class="context-list"><h3>Chronology context <span id="context-count"></span></h3><p class="fine">Gray ? symbols are geographically associated records whose event dates remain unresolved. They are independent of the selected year and do not establish human presence at that year. Empty map space is not evidence of absence.</p><div id="context-records"></div></section></aside><section class="map-stage" aria-label="Map and active evidence"><div class="map-topline"><span id="active-count"></span><span>Pan · Scroll to zoom</span></div><div id="map-host"></div></section><aside id="detail-panel" class="detail-panel" aria-label="Selected evidence details"><div class="visible-heading"><h3>Selected evidence</h3><button id="clear-selection" class="text-button">Clear selection</button></div><div id="selected-records"></div></aside><aside class="layers-panel" aria-label="Map layers"><button id="toggle-layers" aria-expanded="false" aria-controls="layer-options">Show layers</button><div id="layer-options" hidden><section><h3>Chronology context</h3><label class="check"><input id="show-undated" type="checkbox" ${showUndated ? "checked" : ""}> Show unresolved chronology</label><a href="docs/coverage-audit.html" target="_blank">Coverage &amp; collection gaps ↗</a></section><section><h3>Climate &amp; natural hazards</h3><label class="check"><input id="show-natural-events" type="checkbox" ${showNaturalEvents ? "checked" : ""}> Natural events · eruptions, earthquakes &amp; tsunamis</label><p class="fine">Events appear at their source dates. Symbols locate catalog events, not damage footprints or demonstrated settlement impacts.</p><label class="check"><input id="show-ice" type="checkbox" ${showIce ? "checked" : ""}> North American ice sheets</label><label>Ice boundary scenario<select id="ice-scenario" aria-label="Ice boundary scenario">${["optimal", "min", "max"].map((x) => `<option value="${x}" ${iceScenario === x ? "selected" : ""}>${x.toUpperCase()}</option>`).join("")}</select></label><p id="ice-status" class="fine"></p>${climateKinds.map((k) => `<label class="check"><input data-climate="${k}" type="checkbox" ${hiddenClimate.has(k) ? "" : "checked"}> ${climateLabels[k]}</label>`).join("")}<label class="check"><input id="uncertain-hazards" type="checkbox" ${showUncertainHazards ? "checked" : ""}> Include uncertain / discredited reports</label><p class="fine">Dashed hazard symbols = uncertain/questionable catalog reports. No symbol at a year means no included matching report, not hazard absence.</p><div id="hazard-status"></div><a href="#physical">Sources, methods &amp; limits</a></section><section><h3>Ocean &amp; sailing</h3><label class="check"><input id="show-currents" type="checkbox" ${showCurrents ? "checked" : ""}> Usual surface currents</label><label class="check"><input id="show-winds" type="checkbox" ${showWinds ? "checked" : ""}> Usual trade winds</label><p class="fine">Modern schematic reference, independent of selected year. Warm currents: coral; cold currents: blue; wind: gold dashed arrows. ENSO can disrupt these patterns. The ENSO layer flags reconstructed event years, without assigning unsupported local impacts. Open-water / ancient coastlines are not yet reconstructed.</p></section><label class="check"><input id="show-modeled" type="checkbox" ${showModeled ? "checked" : ""}> Show modeled evidence</label><p class="fine">Includes schematic overlays and records whose dating method explicitly names a model or simulation. Scholarly disagreement alone does not make a record modeled.</p><div class="overlay-controls"><h3>Overlays</h3><p>Language layers use record dates and sourced reconstructions; distributions and relationships are approximate. Descent, borrowing and contact are distinct from culture or genetic ancestry.</p>${Object.entries(
    OVERLAY_LABELS,
  )
    .map(
      ([key, label]) =>
        `<label class="check"><input type="checkbox" data-layer="${key}" ${hiddenLayers.has(key) ? "" : "checked"}> ${esc(label)} overlays</label>`,
    )
    .join(
      "",
    )}<p class="fine">Teal diamond: trade. Coral cross: conflict. Red crossed square: violence. Purple ring: epidemic. Amber square or arrow: forced removal. Dashed lines connect sourced endpoints; they do not reconstruct a route. Symbols do not encode death tolls.</p>${languageLinks}</div></div></aside></div>`;
  $("#show-undated").closest("section")!.hidden = atlasMode === "movie";
  $(".context-list").hidden = atlasMode === "movie";
  $("#show-currents").closest("section")!.hidden = atlasMode === "movie";
  if (atlasMode === "explore") {
    $("#show-ice").closest("section")!.hidden = true;
    $("#layer-options").insertAdjacentHTML("afterbegin", '<p class="fine">Explore combines research evidence across periods. Dated physical snapshots and event symbols belong to Movie; <a href="#physical">browse the full natural-event catalog</a>.</p>');
  }
  $("#map-host").append(map.element);
  panels = new MapPanels(main, (items) => {
    if (!canSelect(atlasMode, playing)) { stop(); return; }
    selected = retainCurrentSelection(items, currentActive, atlasMode);
    renderVisible();
  });
  for (const [button, panel, noun] of [
    ["toggle-sites", "site-panel", "site list"],
    ["toggle-details", "detail-panel", "details"],
  ]) {
    $("#" + button).addEventListener("click", () => {
      const target = $("#" + panel);
      target.hidden = !target.hidden;
      $("#" + button).setAttribute("aria-expanded", String(!target.hidden));
      $("#" + button).textContent =
        `${target.hidden ? "Show" : "Hide"} ${noun}`;
      $(".atlas-layout").classList.toggle(panel + "-hidden", target.hidden);
    });
  }
  $("#toggle-layers").addEventListener("click", () => {
    const options = $("#layer-options");
    options.hidden = !options.hidden;
    $(".atlas-layout").classList.toggle("layers-open", !options.hidden);
    $("#toggle-layers").textContent = options.hidden
      ? "Show layers"
      : "Hide layers";
    $("#toggle-layers").setAttribute("aria-expanded", String(!options.hidden));
  });
  for (const [id, change] of [
    ["show-undated", (v: boolean) => (showUndated = v)],
    ["show-ice", (v: boolean) => (showIce = v)],
    ["show-natural-events", (v: boolean) => (showNaturalEvents = v)],
    ["show-currents", (v: boolean) => (showCurrents = v)],
    ["show-winds", (v: boolean) => (showWinds = v)],
    ["uncertain-hazards", (v: boolean) => (showUncertainHazards = v)],
  ] as const)
    $("#" + id).addEventListener("change", (e) => {
      change((e.target as HTMLInputElement).checked);
      renderMapData();
    });
  $("#ice-scenario").addEventListener("change", (e) => {
    iceScenario = (e.target as HTMLSelectElement).value;
    renderMapData();
  });
  main.querySelectorAll<HTMLInputElement>("[data-climate]").forEach((el) =>
    el.addEventListener("change", () => {
      if (el.checked) hiddenClimate.delete(el.dataset.climate!);
      else hiddenClimate.add(el.dataset.climate!);
      renderMapData();
    }),
  );
  $("#show-modeled").addEventListener("change", (e) => {
    showModeled = (e.target as HTMLInputElement).checked;
    renderMapData();
  });
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
  requestIce(atlasMode === "movie" && showIce ? year : -1000000, iceScenario);
  const view = recordsForView(mapRows(), atlasMode, year);
  const active = view.dated;
  currentActive = active;
  selected = retainCurrentSelection(selected, active, atlasMode);
  document.body.classList.toggle("movie-playing", atlasMode === "movie" && playing);
  map.setInteraction({mode: atlasMode, playing, onPause: stop});
  map.update(
    active,
    year,
    showUndated ? view.context : [],
    {
      ice: atlasMode === "movie" && showIce,
      iceScenario,
      currents: atlasMode === "explore" && showCurrents,
      winds: atlasMode === "explore" && showWinds,
      hidden: atlasMode === "movie" ? currentClimateHidden() : new Set(climateKinds),
      uncertain: showUncertainHazards,
    },
  );
  const ice = showIce ? iceSnapshot(year, iceScenario) : null;
  $("#ice-status").textContent = ice
    ? `NADI-1 ${ice.scenario.toUpperCase()} snapshot: ${ice.ageCalBP.toLocaleString()} cal BP (${formatYear(1950 - ice.ageCalBP)}). Nearest source snapshot; no interpolated edge. Age difference ${Math.abs(1950 - year - ice.ageCalBP).toLocaleString()} years.`
    : showIce && iceTarget(year, iceScenario)
      ? iceLoadState() === "error"
        ? "Ice snapshot could not load; retrying automatically. Missing geometry is not ice absence."
        : "Loading the dated ice snapshot from the atlas server."
      : showIce
        ? "No NADI-1 snapshot for this year (coverage25,000–1,500cal BP). This does not mean ice absence."
        : "Ice boundaries hidden.";
  const hazards = atlasMode === "movie" ? eventsAt(year, currentClimateHidden(), showUncertainHazards) : [];
  $("#hazard-status").innerHTML =
    physicalState !== "ready"
      ? `<p role="status">${physicalState === "error" ? "Climate catalog could not load. Evidence records remain available." : "Climate catalog loading; event absence cannot yet be assessed."}</p>${physicalState === "error" ? "<button data-retry-physical>Retry climate catalog</button>" : ""}`
      : hazards.length
        ? `<p>${hazards.length} catalog / reconstructed events this year:</p>` +
          hazards
            .map(
              (e) =>
                `<p><a href="#physical/${e.id}">${esc(e.title)} · ${esc(e.status)}</a></p>`,
            )
            .join("")
        : '<p class="fine">No included catalog / ENSO events at this year. ENSO reconstruction covers1525–1934CE only; earlier ENSO evidence requires other sources.</p>';
  $("#active-count").textContent =
    `${active.filter((r) => (r.overlay ? r.overlay.geometry : r.location)).length} mapped records at this time`;
  renderVisible();
}
function renderVisible() {
  if (!mountedMap || !panels) return;
  panels.update({
    visible: map.visibleRecords(),
    context: map.visibleContextRecords(),
    selected,
    active: currentActive,
    year,
    exploring: atlasMode === "explore",
    interactionLocked: atlasMode === "movie" && playing,
  });
}
function physicalPage(id?: string) {
  mountPhysicalPage(main, id);
}
function tablePage() {
  tableController = new EvidenceTable(main, tableState, {
    rows,
    year: () => year,
    preview: () => preview,
    setPreview: (value) => {
      preview = value;
    },
    hiddenCultureCount: () => hiddenCultures.size,
  });
}
function renderTableBody() {
  tableController?.refresh();
}
function reviewPage(r: FullDisplayRecord, p?: Proposal, index?: number) {
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
    if (r.time.kind === "unplaced") showUndated = true;
    if (r.time.start !== null) setYear(r.time.start);
    if (p) preview = true;
    hiddenCultures.delete(r.culture.id);
    if (r.overlay) hiddenLayers.delete(r.overlay.kind);
    location.hash = r.time.kind === "unplaced" ? "#explore" : "#movie";
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
      const full = await completeDataset();
      if (file.name.toLowerCase().endsWith(".xlsx")) {
        if (file.size > 5_000_000)
          throw new Error("Workbook exceeds the 5 MB file limit.");
        pending = await importWorkbook(await file.arrayBuffer(), full.records);
      } else if (file.name.toLowerCase().endsWith(".json")) {
        if (file.size > MAX_PACKAGE_BYTES)
          throw new Error(`Package exceeds the ${MAX_PACKAGE_BYTES / 1_000_000} MB limit.`);
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
async function importPage() {
  if (!pending) {
    location.hash = "#proposals";
    return;
  }
  const requested = pending;
  const full = await completeDataset();
  if (location.hash !== "#import" || pending !== requested) return;
  const report = inspectImport(pending.proposals, proposals, full.records);
  main.innerHTML = `<article class="proposals-page"><a href="#proposals" class="back-link">← Your suggestions</a><h2>Review import</h2><p class="lead">${report.length} suggestions. Nothing has been added yet.</p><p>Duplicate copies are skipped. Conflicting copies are retained separately for your review. No bundled evidence will change.</p>${report.map((item) => `<section class="proposal-card"><span class="tag">${item.status}</span><h3>${esc(item.proposal.record.title || "Untitled draft")}</h3><p>${esc(item.reason)}</p><p>${esc(item.proposal.rationale)}</p>${comparisonHTML(item.proposal)}<details><summary>Full incoming record and sources</summary><pre>${esc(JSON.stringify(item.proposal.record, null, 2))}</pre></details></section>`).join("")}<div class="actions"><button id="confirm-import" class="primary">Add to local collection</button><a href="#proposals">Cancel</a></div></article>`;
  $("#confirm-import").addEventListener("click", () => {
    try {
      const next = mergeImport(pending!.proposals, proposals);
      proposals = next;
      pending = null;
      saveLocal();
      location.hash = "#proposals";
    } catch (error) {
      let message = main.querySelector<HTMLElement>("#import-confirm-error");
      if (!message) {
        message = document.createElement("p");
        message.id = "import-confirm-error";
        message.setAttribute("role", "alert");
        main.append(message);
      }
      message.textContent = (error as Error).message;
    }
  });
}
function aboutPage() {
  main.innerHTML = aboutPageHTML(dataset, appVersion);
}
onPhysicalChange(() => {
  if (mountedMap) renderMapData();
  else if (location.hash === "#physical") physicalPage();
});
main.addEventListener("click", (event) => {
  if ((event.target as Element).closest("[data-retry-physical]"))
    void initializePhysical();
});
let previousHash = location.hash || "#movie";
let reverting = false;
let routeGeneration = 0;
async function route() {
  const generation = ++routeGeneration;
  const hash = location.hash || "#movie";
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
  tableController?.dispose();
  tableController = undefined;
  requestIce(-1000000, iceScenario);
  mountedMap = false;
  map.clearHover();
  stop();
  document
    .querySelectorAll("nav a")
    .forEach((a) =>
      a.classList.toggle("active", a.getAttribute("href") === hash),
    );
  document.body.classList.remove("movie-playing");
  if (!["#explore"].includes(hash)) { document.body.classList.remove("exploring"); $(".timeline").hidden = false; }
  try {
    if (["#map", "#movie", "#explore"].includes(hash)) {
      atlasMode = hash === "#explore" ? "explore" : "movie";
      document.body.classList.toggle("exploring", atlasMode === "explore");
      $(".timeline").hidden = atlasMode === "explore";
      mapPage();
    }
    else if (hash === "#evidence") tablePage();
    else if (hash === "#context") main.innerHTML = contextHTML(rows());
    else if (hash === "#proposals") proposalsPage();
    else if (hash === "#about") aboutPage();
    else if (hash === "#sites") main.innerHTML = siteGuideIndex();
    else if (hash === "#physical" || hash.startsWith("#physical/")) {
      const id = hash.slice(10);
      if (id) {
        await fullHazard(id);
        if (generation !== routeGeneration) return;
      }
      physicalPage(id);
    } else if (hash === "#import") await importPage();
    else if (hash.startsWith("#review/")) {
      main.innerHTML =
        '<article class="review-page"><p role="status">Loading the full source-linked record…</p></article>';
      const r = await fullRecord(decodeURIComponent(hash.slice(8)));
      if (generation !== routeGeneration) return;
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
          try {
            const next = proposals.slice();
            if (index !== undefined) {
              saved.version = p.version + 1;
              next[index] = saved;
            } else next.push(saved);
            validateCollection(next);
            proposals = next;
            dirty = false;
            saveLocal();
            location.hash = "#proposals";
          } catch (error) {
            announce((error as Error).message);
          }
        },
        (value) => (dirty = value),
      );
    } else throw new Error("Page not found.");
  } catch (error) {
    if (generation !== routeGeneration) return;
    main.innerHTML = `<article class="review-page"><h2>Unable to open this page</h2><p>${esc((error as Error).message)}</p><a href="#map">Return to map</a></article>`;
  }
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);
bounds(true);
setYear(year);
route();
requestAnimationFrame(tick);
