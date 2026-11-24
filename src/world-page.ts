import {
  geoOrthographic,
  geoNaturalEarth1,
  geoEquirectangular,
  geoPath,
  geoGraticule10,
  geoDistance,
  type GeoProjection,
} from "d3-geo";
import { esc } from "./dom";
import { consensusResearch } from "./research-provenance";
import { mountMapNavigation } from "./map-navigation";
import { worldGuides, relatedWorldGuideLinksHTML } from "./world-guides";
import { terrainHTML } from "./terrain";
import { watchDetailedLand } from "./atlas-assets";
import { parseYear } from "./time";
import {
  loadGlobalIce,
  currentGlobalIce,
  globalIceAtYear,
} from "./global-ice";
import {
  validateWorldData,
  africaEarlyData,
  AFRICA_EARLY_END,
  worldGeometryForD3,
  worldTerritories,
  worldRegions,
  worldAtYear,
  worldDates,
  worldSources,
  worldRegionStats,
  deepTimeLabel,
  inWorldScope,
  type WorldData,
  type WorldSummary,
  type WorldScope,
  type WorldEvidence,
  type WorldWave,
  type WorldStudy,
  type WorldTerritory,
} from "./world-model";
import { isPacificPoint } from "./region-partition";
import { timelinePosition, timelineYear } from "./timeline";
import "./world-page.css";

async function json(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw Error(`Could not load ${url}. Please try again.`);
  return r.json();
}
let cached: Promise<WorldData> | undefined;
export function loadWorldData() {
  return (cached ??= json("world-catalogue.json")
    .then(validateWorldData)
    .catch((e) => {
      cached = undefined;
      throw e;
    }));
}
export function worldHeader(activeHash = "#world") {
  const active =
    activeHash === "#atlas/africa" || activeHash === "#atlas/africa/early"
      ? "#atlas/africa"
      : activeHash === "#atlas/pacific" || activeHash === "#origins/pacific"
        ? "#atlas/pacific"
        : activeHash === "#atlas/europe" || activeHash === "#origins/europe"
          ? "#atlas/europe"
          : activeHash === "#atlas/asia-pacific" || activeHash === "#atlas/asia"
            ? "#atlas/asia-pacific"
            : activeHash === "#origins" || activeHash.startsWith("#study/") || activeHash === "#dives" || activeHash.startsWith("#dives/")
              ? "#dives"
              : activeHash === "#physical" || activeHash.startsWith("#physical/")
                ? "#physical"
                : activeHash === "#explore"
                  ? "#explore"
                  : activeHash === "#movie" || activeHash === "#map"
                    ? "#movie"
                    : activeHash === "#library"
                      ? "#library"
                      : activeHash === "#about"
                        ? "#about"
                        : "#world";
  const items = [
    ["#world", "World"],
    ["#movie", "Americas"],
    ["#atlas/pacific", "Pacific"],
    ["#atlas/africa", "Africa"],
    ["#atlas/europe", "Europe"],
    ["#atlas/asia-pacific", "Asia"],
    ["#explore", "Explore"],
    ["#dives", "Deep dives"],
    ["#physical", "Climate"],
    ["#library", "Library"],
  ] as const;
  return `<header class="world-top"><a class="world-brand" href="#world"><span class="world-mark" aria-hidden="true">◈</span><span>The Spread of Peoples<small>ALASKA BLACKFISH</small></span></a><nav aria-label="Main navigation">${items.map(([href, label]) => `<a href="${href}"${href === active ? ' class="active"' : ""}>${label}</a>`).join("")}</nav><a class="header-about${active === "#about" ? " active" : ""}" href="#about" aria-label="About this atlas">About ↗</a></header>`;
}
const number = (n: number) => n.toLocaleString("en-US");
function svgPoint(svg: SVGSVGElement, x: number, y: number): [number, number] | undefined {
  const matrix = svg.getScreenCTM();
  if (!matrix) return;
  const p = new DOMPoint(x, y).matrixTransform(matrix.inverse());
  return [p.x, p.y];
}
export interface HubOptions {
  regionHref?: (id: string) => string;
  divesHref?: string;
  guideHref?: string;
  sourcesHref?: string;
  globeOnly?: boolean;
}
export function mountWorldHub(
  host: HTMLElement,
  summary: WorldSummary,
  land: any,
  options: HubOptions = {},
): () => void {
  const href = (id: string) =>
    options.regionHref?.(id) ?? worldRegions.find((r) => r.id === id)!.href;
  let flat = false,
    rotation = 18,
    latitude = 12,
    drag: { x: number; y: number; lon: number; lat: number } | undefined,
    moved = false,
    disposed = false;
  const regions = summary.regions;
  const introHTML = options.globeOnly
    ? ""
    : `<section class="world-intro"><div><p class="world-kicker">ALASKA BLACKFISH · AN OPEN EDUCATIONAL ATLAS</p><h1>The spread <br>of peoples<span>.</span></h1><p class="world-lede">A world of human stories. Spin the globe and select any of the five regions to dive into its timeline movie, evidence, and deep dives.</p><div class="world-stats"><div><strong>${number(summary.records)}</strong><span>evidence records</span></div><div><strong>${number(summary.references)}</strong><span>unique references</span></div><div><strong>${number(summary.guides)}</strong><span>world guides</span></div></div><p class="world-small">Mapped evidence from ~7.24 million years ago through 1900 CE (with Hawaiʻi’s statehood story through 1959).</p></div><aside class="world-provenance"><p class="world-kicker">ATLAS COVERAGE</p><div class="world-coverage-stats"><div><strong>${regions.length}</strong><span>regional entrances</span></div><div><strong>${summary.foundation.taxa}</strong><span>human-family branches</span></div><div><strong>${summary.foundation.evidence}</strong><span>origins evidence anchors</span></div><div><strong>${summary.foundation.waves}</strong><span>dispersal &amp; admixture models</span></div></div><p class="world-coverage-range"><strong>${deepTimeLabel(Math.min(...regions.filter((r) => r.earliest !== null).map((r) => r.earliest!)))}</strong> earliest mapped evidence · through 1900 CE</p><div class="world-consensus" aria-label="Consensus research"><a href="https://consensus.app/" target="_blank" rel="noopener noreferrer">Consensus ↗</a><span><strong>${consensusResearch.deepRuns}+</strong> Deep research runs</span><span><strong>${consensusResearch.citedPaperMatches}</strong> cited papers</span></div><a class="world-credit-link" href="${esc(options.sourcesHref ?? "sites/sources-attributions.html#consensus-discovery")}">Research credits, sources &amp; licenses</a></aside></section>`;
  host.innerHTML = `<article class="world-hub${options.globeOnly ? " world-hub-embedded" : ""}">${introHTML}
 <section class="world-atlas"><div class="world-section-head"><div><p class="world-kicker">CHOOSE A REGION TO DIVE IN</p><h2>Spin the globe. Pick a region.</h2></div><div class="world-view-controls"><button id="world-projection" aria-pressed="false">Show all regions</button><button id="world-west">Rotate west</button><button id="world-east">Rotate east</button></div></div><p class="world-map-instruction">Drag the globe to spin it. Dividing lines separate the five clickable regions—click any region on the globe or in the cards below to open its full regional map.</p><div class="world-globe"><svg id="world-globe" viewBox="0 0 1000 610" aria-label="World atlas regions" role="group"></svg></div><div class="world-region-grid">${regions.map((r) => `<a class="world-region-card" data-region="${r.id}" href="${esc(href(r.id))}"><span class="world-region-title">${esc(r.title)}</span><span class="world-coverage">${esc(r.coverage)}</span><div class="world-region-stats"><div><strong>${number(r.references)}</strong><span>references</span></div><div><strong>${number(r.records)}</strong><span>events &amp; records</span></div><div><strong>${number(r.guides)}</strong><span>guides</span></div></div><span class="world-region-date">${esc(r.earliestLabel)}</span><span class="world-region-action">Open regional movie →</span></a>`).join("")}</div><p class="world-small world-dives-note">Looking for place guides, human-family origins, or sacred creation traditions? <a href="${esc(options.divesHref ?? "#dives")}">Browse all ${number(summary.guides)}+ Deep Dives (Subjects, Places, Languages, Cultures &amp; Origin Stories) →</a> · <a href="${esc(options.divesHref ? options.divesHref.replace(/#dives$/, "#dives/origin-stories") : "#dives/origin-stories")}">Origin Stories: where did we come from? →</a> · <a href="${esc(options.guideHref ?? "sites/world-human-family.html")}">Human-family &amp; genetics discussion →</a></p><details class="world-stat-method"><summary>About these counts</summary><p>${esc(summary.method)}</p><p>Earliest dates reflect the oldest site currently mapped in each region; references count distinct cited publications across regional and cross-regional guides.</p></details></section><p class="world-small world-map-credit">Basemap: Natural Earth (public domain). Dividing lines mark the five regional maps.</p></article>`;
  const svg = host.querySelector<SVGSVGElement>("#world-globe")!;
  const sampleSpan = (
    a: number,
    b: number,
    step: number,
    make: (v: number) => [number, number],
  ) => {
    const pts: [number, number][] = [];
    for (let v = a; v < b; v += step) pts.push(make(v));
    pts.push(make(b));
    return pts;
  };
  const regionDividers = {
    type: "MultiLineString",
    coordinates: [
      sampleSpan(-65, 82, 3, (lat) => [-25, lat]),
      sampleSpan(-25, 60, 3, (lon) => [lon, 36]),
      sampleSpan(-36, 82, 3, (lat) => [60, lat]),
      sampleSpan(-25, 60, 3, (lon) => [lon, -36]),
      // Asia vs Australia & Pacific (Wallacea, Palau/Micronesia east of 130°E, south of 28°N)
      sampleSpan(-65, -10, 3, (lat) => [110, lat]),
      sampleSpan(110, 130, 3, (lon) => [lon, -10]),
      sampleSpan(-10, 28, 3, (lat) => [130, lat]),
      sampleSpan(130, 180, 4, (lon) => [lon, 28]),
      sampleSpan(-180, -135, 4, (lon) => [lon, 28]),
      // Pacific (incl. Hawaiʻi & Rapa Nui) vs Americas
      sampleSpan(-10, 28, 3, (lat) => [-135, lat]),
      sampleSpan(-135, -105, 3, (lon) => [lon, -10]),
      sampleSpan(-65, -10, 3, (lat) => [-105, lat]),
      // Bering Strait / North Pacific (Asia vs Americas)
      sampleSpan(28, 72, 3, (lat) => [-169, lat]),
    ],
  } as const;
  const projection = (): GeoProjection =>
    flat
      ? geoNaturalEarth1().translate([500, 300]).scale(172)
      : geoOrthographic()
          .rotate([-rotation, -latitude])
          .translate([500, 300])
          .scale(268);
  function draw() {
    if (disposed) return;
    const p = projection(),
      path = geoPath(p);
    svg.innerHTML =
      `<defs><radialGradient id="world-sea"><stop offset="0%" stop-color="#1c4659"/><stop offset="100%" stop-color="#0b2636"/></radialGradient></defs><path class="world-ocean" d="${path({ type: "Sphere" })}"/><path class="world-graticule" d="${path(geoGraticule10())}"/><path class="world-land" d="${path(land)}"/><path class="world-region-divider" d="${path(regionDividers as any) ?? ""}"/>` +
      worldRegions
        .map((r) => {
          if (
            !flat &&
            geoDistance(r.center, [rotation, latitude]) > Math.PI / 2 - 0.05
          )
            return "";
          const loc = p(r.center)!;
          const stat = regions.find((s) => s.id === r.id)!;
          const dx = flat
            ? r.id === "pacific"
              ? -16
              : r.id === "asia-pacific"
                ? 18
                : r.id === "africa"
                  ? -20
                  : r.id === "europe"
                    ? 15
                    : -15
            : r.id === "europe"
              ? 120
              : r.id === "africa"
                ? -118
                : r.id === "asia-pacific"
                  ? 126
                  : r.id === "pacific"
                    ? -125
                    : -128;
          const dy = flat
            ? r.id === "europe"
              ? -58
              : r.id === "asia-pacific"
                ? -82
                : r.id === "americas"
                  ? -56
                  : r.id === "pacific"
                    ? -56
                    : 62
            : r.id === "europe"
              ? -42
              : r.id === "americas"
                ? -48
                : r.id === "asia-pacific"
                  ? 36
                  : r.id === "pacific"
                    ? 56
                    : 60;
          const x = Math.max(115, Math.min(885, loc[0] + dx)),
            y = Math.max(48, Math.min(552, loc[1] + dy));
          const short =
            r.id === "asia-pacific"
              ? "Asia"
              : r.id === "pacific"
                ? "Australia & Pacific"
                : r.id === "africa"
                  ? "Africa & Middle East"
                  : r.id === "europe"
                    ? "Europe"
                    : "Americas";
          return `<a href="${esc(href(r.id))}" data-region="${r.id}" class="world-map-region" aria-label="${esc(r.title)}: ${stat.references} references, ${stat.records} events &amp; records, ${esc(stat.earliestLabel)}"><line x1="${loc[0]}" y1="${loc[1]}" x2="${x}" y2="${y}" stroke="${r.color}"/><circle cx="${loc[0]}" cy="${loc[1]}" r="6" fill="${r.color}"/><g transform="translate(${x},${y})"><rect x="-110" y="-31" width="220" height="70" rx="8"/><text text-anchor="middle" y="-9" fill="${r.color}" class="world-map-name">${short}</text><text text-anchor="middle" y="10">${number(stat.references)} refs · ${number(stat.records)} events</text><text text-anchor="middle" y="26" class="world-map-age">${esc(stat.earliest === null ? "Coverage in progress" : deepTimeLabel(stat.earliest))}</text></g></a>`;
        })
        .join("");
  }
  const toggle = host.querySelector<HTMLButtonElement>("#world-projection")!;
  toggle.onclick = () => {
    flat = !flat;
    toggle.setAttribute("aria-pressed", String(flat));
    toggle.textContent = flat ? "Show globe" : "Show all regions";
    host.querySelector<HTMLButtonElement>("#world-west")!.disabled = flat;
    host.querySelector<HTMLButtonElement>("#world-east")!.disabled = flat;
    draw();
  };
  host.querySelector<HTMLButtonElement>("#world-west")!.onclick = () => {
    rotation -= 45;
    draw();
  };
  host.querySelector<HTMLButtonElement>("#world-east")!.onclick = () => {
    rotation += 45;
    draw();
  };
  svg.onpointerdown = (e) => {
    if (flat || e.button !== 0) return;
    moved = false;
    drag = { x: e.clientX, y: e.clientY, lon: rotation, lat: latitude };
  };
  svg.onpointermove = (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) {
      moved = true;
      svg.setPointerCapture(e.pointerId);
    }
    if (!moved) return;
    rotation = drag.lon - dx * 0.35;
    latitude = Math.max(-60, Math.min(60, drag.lat + dy * 0.25));
    draw();
  };
  svg.onpointerup = () => {
    drag = undefined;
  };
  svg.onpointercancel = () => {
    drag = undefined;
  };
  svg.onclick = (e) => {
    if (moved) {
      e.preventDefault();
      moved = false;
      return;
    }
    if ((e.target as Element).closest("a")) return;
    if (!(e.target as Element).closest(".world-land")) return;
    const point = svgPoint(svg, e.clientX, e.clientY),
      q = point && projection().invert?.(point);
    if (!q || !q.every(Number.isFinite)) return;
    const [lon, lat] = q;
    const id = isPacificPoint([lon, lat])
      ? "pacific"
      : (lon >= -169 && lon < -25) || (lon < -169 && lat >= 28)
        ? "americas"
        : lon >= -25 && lon <= 60 && lat > 36
          ? "europe"
          : lon >= -25 && lon <= 60 && lat >= -36 && lat <= 36
            ? "africa"
            : "asia-pacific";
    location.href = href(id);
  };
  draw();
  return () => {
    disposed = true;
    svg.onpointerdown =
      svg.onpointermove =
      svg.onpointerup =
      svg.onpointercancel =
      svg.onclick =
        null;
  };
}

const saved = new Map<
  string,
  {
    year: number;
    taxon: string;
    k: number;
    x: number;
    y: number;
    selected: string;
    query?: string;
    ice?: boolean;
  }
>();
export function mountWorldPlayer(
  host: HTMLElement,
  data: WorldData,
  land: any,
  scope: WorldScope,
  study?: WorldStudy,
  earlyAfrica = false,
  initialSite?: string,
): () => void {
  const first = study?.start ?? Math.min(...worldDates(data, scope)),
    last = earlyAfrica ? AFRICA_EARLY_END : (study?.end ?? 1900),
    title =
      (earlyAfrica
        ? "Africa & Middle East: earliest evidence to 15,000 BCE"
        : study?.title) ??
      (scope === "world"
        ? "The branching human family"
        : scope === "africa"
          ? "Africa & Middle East"
          : scope === "asia-pacific"
            ? "Asia"
            : worldRegions.find((r) => r.id === scope)!.title);
  const saveKey = earlyAfrica ? "africa-early" : (study?.id ?? scope),
    state = saved.get(saveKey) ?? {
      year: first,
      taxon: "all",
      k: 1,
      x: 0,
      y: 0,
      selected: "",
      ice: true,
    };
  if (state.ice === undefined) state.ice = true;
  saved.set(saveKey, state);
  let playing = false,
    rate = 1,
    timer: ReturnType<typeof setInterval> | undefined,
    disposed = false,
    currentLand = land,
    drag: { x: number; y: number; sx: number; sy: number } | undefined,
    moved = false;
  const stats = worldRegionStats(data, scope),
    earliestEvidence = data.evidence
      .filter((e) => inWorldScope(e, scope))
      .sort((a, b) => a.start - b.start)[0],
    taxa = data.taxa.filter(
      (t) =>
        data.evidence.some(
          (e) => e.taxonIds.includes(t.id) && inWorldScope(e, scope),
        ) ||
        data.waves.some(
          (w) => w.taxonIds.includes(t.id) && inWorldScope(w, scope),
        ),
    );
  const scopeLead =
    earlyAfrica
      ? "Fossils, occupation phases, technologies and dispersal evidence across Africa and the Levant through 15,000 BCE."
      : study
        ? study.summary
        : scope === "africa"
          ? "Prehistoric hominins, Levant–Arabian corridors, Green Sahara pastoralism, kingdoms of the Nile, Sahel, Forest, Swahili coast and Great Zimbabwe through 1900 CE."
          : scope === "pacific"
            ? "Sahul arrivals, New Guinea highlands agriculture, Lapita voyaging, Micronesia, Aotearoa, Hawaiʻi and Rapa Nui through 1900 CE."
            : scope === "asia-pacific"
              ? "Pleistocene hominin dispersals, Indus, China, Central Asian steppes, Korea/Japan and Southeast Asia through 1900 CE."
              : scope === "europe"
                ? "Earliest Pleistocene hominin arrivals, Neanderthal–H. sapiens transitions, Mesolithic–Neolithic dispersals, Classical antiquity, Imperial Rome and early modern Europe through 1900 CE."
                : "Evidence anchors and broad connections. A foundation across the branching human family.";
  const kicker =
    earlyAfrica
      ? "AFRICA & MIDDLE EAST · TO 15,000 BCE"
      : study
        ? "DATED DEEP DIVE"
        : scope === "africa"
          ? "AFRICA & MIDDLE EAST"
          : scope === "pacific"
            ? "AUSTRALIA & PACIFIC · EARLY PEOPLES"
            : scope === "asia-pacific"
              ? "ASIA"
              : scope === "europe"
                ? "EUROPE · EARLY PEOPLES"
                : "THE BRANCHING HUMAN FAMILY";
  const eraOptions = earlyAfrica
    ? `<option value="">Choose a period…</option><option value="${first}">Earliest mapped evidence</option><option value="-2800000">Early Homo and stone tools</option><option value="-350000">Middle Pleistocene diversity</option><option value="-100000">Later Middle Stone Age</option><option value="-40000">Later Pleistocene occupations</option><option value="${last}">15,000 BCE endpoint</option>`
    : scope === "africa"
      ? `<option value="">Choose a period…</option><option value="${first}">Earliest mapped evidence</option><option value="-2800000">Early Homo &amp; Levant corridor</option><option value="-350000">Middle Pleistocene diversity</option><option value="-70000">Later MSA &amp; Sinai crossings</option><option value="-12000">Terminal Pleistocene &amp; Natufian</option><option value="-6000">Green Sahara, Uruk &amp; herders</option><option value="-2500">Nile states, Mesopotamia &amp; Kerma</option><option value="-500">Nok, Meroë, Sabaʾ &amp; Jenné-jeno</option><option value="1000">Abbasid Baghdad, Swahili coast &amp; Sahel</option><option value="1400">Great Zimbabwe, Ife, Mali &amp; Cairo</option><option value="1750">Oyo, Asante, Gondar, Oman &amp; Saudi</option><option value="${last}">1900 CE endpoint</option>`
      : scope === "pacific"
        ? `<option value="">Choose a period…</option><option value="${first}">Earliest mapped evidence</option><option value="-60000">Early Sahul &amp; Madjedbebe</option><option value="-40000">Lake Mungo &amp; Pleistocene Sahul</option><option value="-7000">Kuk Swamp &amp; highlands</option><option value="-1350">Lapita ocean voyaging</option><option value="1000">Nan Madol, Hawaiʻi &amp; Polynesia</option><option value="1300">Aotearoa &amp; Rapa Nui</option><option value="${last}">1900 CE endpoint</option>`
        : scope === "asia-pacific"
          ? `<option value="">Choose a period…</option><option value="${first}">Earliest mapped evidence</option><option value="-1500000">Early Pleistocene Asia</option><option value="-300000">Archaic Homo &amp; Denisovans</option><option value="-50000">Late Pleistocene East &amp; South Asia</option><option value="-9500">Early Yangtze &amp; Yellow River farming</option><option value="-2500">Indus cities, Liangzhu &amp; Botai</option><option value="-500">Zhou, Maurya &amp; Xiongnu–Steppe</option><option value="200">Silk Roads, Han, Kushan &amp; Gupta</option><option value="900">Borobudur, Bagan, Angkor, Tang–Song &amp; Chola</option><option value="1600">Ming–Qing, Mughals &amp; Tokugawa</option><option value="${last}">1900 CE endpoint</option>`
          : scope === "europe"
            ? `<option value="">Choose a period…</option><option value="${first}">Earliest mapped evidence</option><option value="-1000000">Early &amp; Middle Pleistocene</option><option value="-150000">Neanderthal hunting &amp; hearths</option><option value="-40000">Upper Paleolithic art &amp; Aurignacian</option><option value="-15000">Magdalenian &amp; Star Carr Mesolithic</option><option value="-5500">Aegean, Cardial &amp; LBK farmers</option><option value="-2200">Megaliths, Steppe &amp; Minoan–Mycenaean</option><option value="-500">Classical Athens, Etruscans &amp; Celts</option><option value="100">Pompeii, Imperial Rome &amp; Danube Limes</option><option value="900">Ravenna, Al-Andalus, Novgorod &amp; Rus’</option><option value="1600">Florence, Venice, Seville &amp; Amsterdam</option><option value="${last}">1900 CE endpoint</option>`
            : `<option value="">Choose a period…</option><option value="${first}">Earliest mapped evidence</option><option value="-2800000">Early Homo</option><option value="-350000">Many human lineages</option><option value="-70000">Later dispersals</option><option value="-12000">After the Ice Age</option><option value="-7000">Farmers and population change</option><option value="1900">1900 endpoint</option>`;

  host.innerHTML = `<article class="family-page"><header class="family-heading"><div><p class="world-kicker">${kicker}</p><h1>${esc(title)}</h1></div><nav class="subhead-links" aria-label="Regional history">${scope === "europe" ? '<a href="#atlas/europe">Europe: detailed history</a>' : scope === "pacific" ? '<a href="#atlas/pacific">Australia &amp; Pacific: full interactive map</a>' : ""}<a href="sites/world-human-family.html">Branching human family guide ↗</a></nav></header><div class="family-map-navigation"></div><div class="family-layout"><aside class="family-reader" aria-label="Evidence and filters"><div class="family-filter"><label>Lineage<select id="family-taxon"><option value="all">All human-family branches</option>${taxa.map((t) => `<option value="${t.id}"${state.taxon === t.id ? " selected" : ""}>${esc(t.name)}</option>`).join("")}</select></label><label>Jump to a chapter<select id="family-era">${eraOptions}</select></label><label class="family-ice-toggle"><input type="checkbox" id="family-ice"${state.ice !== false ? " checked" : ""}> Quaternary ice sheets (reconstructed)</label></div><p class="family-scope">${esc(scopeLead)}</p><details class="family-reading"><summary>How to read this map</summary><p>Bright points mark evidence whose dating range contains the map year. Fainter points are earlier finds shown in context. Dashed lines show schematic dispersal models; pink dotted lines show admixture evidence.</p></details><section id="family-detail" aria-live="polite"></section><details class="family-now-section" open><summary>What is here at this time</summary><section id="family-happening-now" class="family-happening-now" aria-live="polite"></section></details><label class="family-search-label">Find a site or evidence<input id="family-search" type="search" placeholder="Name, place or technology" value="${esc(state.query ?? "")}"><small>Search every date in this map. Selecting a result opens its dated evidence.</small></label><details class="family-evidence-group" open><summary class="family-list-heading">Evidence in this view</summary><div id="family-evidence-list"></div></details><details class="family-waves-group" open><summary>Connections &amp; territories at this date</summary><div id="family-wave-list"></div></details><details class="family-guides"><summary>Regional guides &amp; deep dives</summary><div id="family-guide-list"></div></details></aside><div class="family-map-column"><div class="family-map-stage"><svg id="family-map" viewBox="0 0 1000 620" role="group" aria-label="Human-family evidence map"></svg><div id="family-map-banner" class="family-map-banner" aria-live="polite"><span class="family-banner-meta">${stats.records} evidence anchors · ${stats.references} references</span><span class="family-banner-year"></span><span class="family-banner-text"></span></div><div class="family-map-controls"><button id="family-zoom-in" aria-label="Zoom in">+</button><button id="family-zoom-out" aria-label="Zoom out">−</button><button id="family-reset">Reset map</button></div><details class="map-key-disclosure family-map-key"><summary>Read the map</summary><div class="family-legend"><span><i class="family-dot"></i>Dated evidence</span><span><i class="family-dot earlier"></i>Earlier evidence</span><span>Dashed: dispersal model</span><span class="family-admixture">Dotted: admixture evidence</span><span>Shading: dated territorial reconstruction</span><span class="family-credit-line">Shaded relief: Natural Earth II</span></div></details></div></div></div><footer class="family-timeline"><div class="family-transport"><button id="family-play">Play</button><button id="family-back" aria-label="Previous evidence change">◀</button><button id="family-next" aria-label="Next evidence change">▶</button><label>Pace<select id="family-rate" aria-label="Playback pace"><option value="1">Steady</option><option value="2">2×</option><option value="4">4×</option></select></label>${study ? "" : `<label>Jump to<select id="family-jump" aria-label="Jump to period">${eraOptions}</select></label>`}</div><label class="family-slider-label">Map year <output id="family-year"></output><input id="family-slider" type="range" min="0" max="10000" step="1" aria-label="Human-family map year"><div class="family-time-ends"><span>${deepTimeLabel(first)}</span><span>${earlyAfrica ? "15,000 BCE" : study ? deepTimeLabel(last) : "1900 CE"}</span></div></label><form id="family-date-form"><label>Year<input id="family-date" inputmode="numeric" aria-label="Map year"></label><select id="family-era-input" aria-label="Map year era"><option>CE</option><option>BCE</option></select><button type="submit">Go</button><span id="family-date-error" role="status"></span></form><p class="family-playback-note" id="family-date-note">Click any point on the map or drag the timeline to inspect dated finds.</p></footer></article>`;
  if (study) {
    host.querySelector(".family-heading nav")!.innerHTML =
      `<a href="#dives">More deep dives</a><a href="sites/${study.guideId}.html">Read the full deep dive ↗</a>`;
    host.querySelector("#family-era")!.closest("label")!.remove();
    if (taxa.length <= 1) {
      host.querySelector("#family-taxon")!.closest("label")!.remove();
    }
    host.querySelector(".family-guides")?.remove();
    host
      .querySelector("#family-map")!
      .setAttribute("aria-label", study.title + " evidence map");
    host.querySelector(".family-reading")!.innerHTML =
      "<summary>How to read this map</summary><p>Bright points fall within the selected date range and dimmed points mark earlier landmarks. Dashed lines trace connections between sites, shaded regions show dated territories, and dot size reflects resident estimates where known. Select any item for its sources and dating details.</p>";
  }

  if (scope === "africa" && !study) {
    host
      .querySelector(".family-heading nav")!
      .insertAdjacentHTML(
        "beforeend",
        earlyAfrica
          ? '<a href="#atlas/africa">All Africa &amp; Middle East periods</a>'
          : '<a href="#atlas/africa/early">To 15,000 BCE</a>',
      );
  }
  if (earlyAfrica) {
    host
      .querySelector(".family-reading")!
      .insertAdjacentHTML(
        "beforeend",
        "<p>This chapter runs through 15,000 BCE (about 16,950 cal BP). Select any find to inspect its stratigraphy and primary publications.</p>",
      );
  }

  if (!study) {
    const scopeGuides = worldGuides
      .filter((g) => scope === "world" || g.atlasIds.includes(scope))
      .sort(
        (a, b) =>
          (b.atlasIds[0] === scope ? 1 : 0) - (a.atlasIds[0] === scope ? 1 : 0),
      );
    host.querySelector("#family-guide-list")!.innerHTML =
      `<p><a href="sites/world-human-family.html"><strong>The branching human family ↗</strong></a> · <a href="#origins">Interactive map</a></p>` +
      scopeGuides
        .filter((g) => g.id !== "world-human-family")
        .map((g) => `<p><a href="${esc(g.href)}">${esc(g.title)} ↗</a></p>`)
        .join("") +
      `<p><a href="#dives"><strong>Browse all Deep Dives →</strong></a></p>`;
  }
  const navigation = mountMapNavigation(
    host.querySelector<HTMLElement>(".family-map-navigation")!,
    {
      region: scope === "world" ? undefined : scope,
      settings: [
        host.querySelector<HTMLElement>(".family-filter")!,
        host.querySelector<HTMLElement>(".family-scope")!,
        host.querySelector<HTMLElement>(".family-reading")!,
      ],
      facts: [host.querySelector<HTMLElement>(".family-reader")!],
      onFactsToggle: (open) =>
        host
          .querySelector(".family-layout")!
          .classList.toggle("facts-hidden", !open),
    },
  );
  const svg = host.querySelector<SVGSVGElement>("#family-map")!,
    detail = host.querySelector<HTMLElement>("#family-detail")!,
    list = host.querySelector<HTMLElement>("#family-evidence-list")!,
    slider = host.querySelector<HTMLInputElement>("#family-slider")!;
  const projection = geoEquirectangular();
  if (scope === "africa" && !study)
    projection.fitExtent(
      [
        [45, 35],
        [955, 585],
      ],
      {
        type: "MultiPoint",
        coordinates: [
          [-20, -36],
          [-20, 46.5],
          [61, 46.5],
          [61, -36],
        ],
      },
    );
  else if (scope === "europe" && !study)
    projection.fitExtent(
      [
        [45, 30],
        [955, 590],
      ],
      {
        type: "MultiPoint",
        coordinates: [
          [-22, 34],
          [-22, 71],
          [48, 71],
          [48, 34],
        ],
      },
    );
  else if (scope === "pacific" && !study)
    projection.rotate([-180, 0]).fitExtent(
      [
        [24, 24],
        [976, 596],
      ],
      {
        type: "MultiPoint",
        coordinates: [
          [112, -47],
          [112, 24],
          [-109, 24],
          [-109, -47],
        ],
      },
    );
  else if (scope === "asia-pacific" && !study)
    projection.fitExtent(
      [
        [45, 35],
        [955, 585],
      ],
      {
        type: "MultiPoint",
        coordinates: [
          [55, -10],
          [55, 72],
          [163, 72],
          [163, -10],
        ],
      },
    );
  else if (scope === "world" && !study)
    projection.fitExtent(
      [
        [35, 35],
        [965, 585],
      ],
      {
        type: "MultiPoint",
        coordinates: [
          [-176, -55],
          [-176, 72],
          [178, 72],
          [178, -55],
        ],
      },
    );
  if (study)
    projection.fitExtent(
      [
        [50, 45],
        [950, 575],
      ],
      {
        type: "GeometryCollection",
        geometries: [
          {
            type: "MultiPoint",
            coordinates: data.evidence.map((e) => e.coordinates),
          },
          ...(data.territories ?? []).map((t) =>
            worldGeometryForD3(t.geometry),
          ),
        ],
      },
    );
  const path = geoPath(projection);
  const stopDetailedLand = watchDetailedLand((nextLand) => {
    if (!disposed) {
      currentLand = nextLand;
      draw();
    }
  });
  function sourceDomain(url: string) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "Source";
    }
  }
  function sourceHTML(ids: string[]) {
    return worldSources(data, ids)
      .map(
        (s) =>
          `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a><small>${esc(sourceDomain(s.url))}${s.locator ? " · " + esc(s.locator) : ""}</small></li>`,
      )
      .join("");
  }
  function details(item?: WorldEvidence | WorldWave | WorldTerritory) {
    detail.classList.toggle("has-selection", Boolean(item));
    if (item && "geometry" in item) {
      detail.innerHTML = `<p class="world-kicker">${esc(item.meaning.replaceAll("-", " "))}</p><h2>${esc(item.title)}</h2><strong>${deepTimeLabel(item.start)}–${deepTimeLabel(item.end)}</strong><details class="method-disclosure"><summary>Dating &amp; evidence notes</summary><p class="family-limits">${esc(item.limits)}</p></details><ul class="family-sources">${sourceHTML(item.sourceIds)}</ul>`;
      return;
    }
    if (!item) {
      const t = data.taxa.find((t) => t.id === state.taxon);
      detail.innerHTML = t
        ? `<p class="world-kicker">${esc(t.status.replaceAll("-", " "))}</p><h2>${esc(t.name)}</h2><p>${esc(t.meaning)}</p><p>${esc(t.note)}</p><ul class="family-sources">${sourceHTML(t.sourceIds)}</ul>`
        : `<p class="world-kicker">${study ? "DATED DEEP DIVE" : "FOUNDATION &amp; CONTEXT"}</p><h2>${stats.records} dated finds &amp; landmarks</h2><p>${esc(scopeLead)}</p><p>Select any point or connection on the map to read what was found, which hominin lineage it represents, and its primary publications.</p>${earliestEvidence ? `<button type="button" class="family-start-oldest" data-world-item="${esc(earliestEvidence.id)}">Start at the oldest site: ${esc(earliestEvidence.title)}</button>` : ""}`;
      return;
    }
    const isOldest =
      Boolean(earliestEvidence && item.id === earliestEvidence.id) ||
      (!("geometry" in item) &&
        !Array.isArray((item as WorldWave).coordinates[0]) &&
        item.start === first);
    const taxonCards = item.taxonIds
      .map((id) => data.taxa.find((t) => t.id === id))
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
      .map(
        (t) =>
          `<div class="family-taxon-card"><strong>${esc(t.name)}</strong><span>${esc(t.meaning)}</span><small>${esc(t.note)}</small></div>`,
      )
      .join("");
    const sourceList = worldSources(data, item.sourceIds);
    const primaryGuideId = "guideId" in item ? item.guideId : undefined;
    const relatedGuidesHTML = relatedWorldGuideLinksHTML(item.id, primaryGuideId);
    detail.innerHTML = `${isOldest ? '<p class="family-milestone">Oldest site in this map</p>' : ""}<p class="world-kicker">${esc(item.kind.replaceAll("-", " "))}</p><h2>${esc(item.title)}</h2><p class="family-date-line"><strong>${esc(item.dateLabel)}</strong></p><p>${esc(item.summary)}</p>${taxonCards ? `<div class="family-taxon-cards">${taxonCards}</div>` : ""}<h3>Evidence &amp; sources</h3><ul class="family-sources">${sourceHTML(item.sourceIds)}</ul>${primaryGuideId ? `<p class="family-guide-cta"><a href="sites/${esc(primaryGuideId)}.html">Read the deeper study ↗</a></p>` : ""}${relatedGuidesHTML}<details class="method-disclosure"><summary>Dating &amp; evidence notes</summary><p class="family-limits">${esc(item.limits)}</p>${"dateBasis" in item ? `<p class="world-small">${esc(item.dateBasis)}</p>` : ""}${sourceList.length ? `<p class="world-small">${sourceList.map((s) => `${esc(s.title)}: ${esc(s.access)}`).join(" · ")}</p>` : ""}</details>`;
    if ("population" in item && item.population?.length)
      detail.insertAdjacentHTML(
        "beforeend",
        `<h3>Dated resident estimates</h3>${item.population.map((p) => `<p><strong>${deepTimeLabel(p.year)}: ${number(p.min)}${p.max !== p.min ? "–" + number(p.max) : ""}</strong><br>${esc(p.note)} (${esc(p.basis)}).</p><ul class="family-sources">${sourceHTML(p.sourceIds)}</ul>`).join("")}`,
      );
  }
  function choose(id: string) {
    navigation.showFacts();
    pause();
    const chosen = [...data.evidence, ...data.waves, ...(data.territories ?? [])].find(
      (e) => e.id === id,
    );
    const selectedEvidence = data.evidence.find((e) => e.id === id);
    if (chosen && chosen.start > state.year)
      state.year = Math.max(first, Math.min(last, chosen.start));
    if (selectedEvidence) {
      const point = projection(selectedEvidence.coordinates);
      if (point && (point[0] * state.k + state.x < 25 || point[0] * state.k + state.x > 975 || point[1] * state.k + state.y < 25 || point[1] * state.k + state.y > 595)) {
        state.x = 500 - point[0] * state.k;
        state.y = 310 - point[1] * state.k;
      }
    }
    state.selected = id;
    details(chosen);
    draw();
    host.querySelector(".family-reader")!.scrollTop = 0;
  }
  function draw() {
    if (disposed) return;
    host.querySelector(".family-page")?.classList.toggle("is-playing", playing);
    const focusedItem = (document.activeElement as HTMLElement | null)?.dataset
      ?.worldItem;
    const current = worldAtYear(data, state.year, scope, state.taxon);
    const datedNow = current.evidence
      .filter((e) => e.phase === "dated")
      .sort(
        (a, b) =>
          (a.start === state.year ? 0 : 1) - (b.start === state.year ? 0 : 1) ||
          Math.abs(state.year - a.start) - Math.abs(state.year - b.start) ||
          b.start - a.start,
      );
    const labeledIds = new Set<string>();
    const placedLabels: [number, number][] = [];
    for (const item of [
      ...current.evidence.filter((e) => state.selected === e.id),
      ...datedNow,
    ]) {
      if (labeledIds.has(item.id)) continue;
      if (state.selected !== item.id && labeledIds.size >= 7) break;
      const pt = projection(item.coordinates);
      if (!pt) continue;
      const sx = pt[0] * state.k + state.x;
      const sy = pt[1] * state.k + state.y;
      if (sx < 10 || sx > 960 || sy < 20 || sy > 605) continue;
      if (
        state.selected === item.id ||
        placedLabels.every(
          ([ox, oy]) => Math.abs(sx - ox) > 135 || Math.abs(sy - oy) > 20,
        )
      ) {
        labeledIds.add(item.id);
        placedLabels.push([sx, sy]);
      }
    }
    const waveLabels = current.waves
      .slice(0, 3)
      .map((w) => {
        const mid = w.coordinates[Math.floor(w.coordinates.length / 2)];
        const pt = mid ? projection(mid) : null;
        if (!pt) return "";
        const label = w.title.length > 32 ? w.title.slice(0, 31) + "…" : w.title;
        return `<text class="family-wave-label" x="${pt[0]}" y="${pt[1] - 6}" transform="translate(${pt[0]},${pt[1]}) scale(${1 / state.k}) translate(${-pt[0]},${-pt[1]})">${esc(label)}</text>`;
      })
      .join("");
    host.querySelector("#family-year")!.textContent = deepTimeLabel(state.year);
    slider.value = String(
      Math.round(timelinePosition(state.year, first, last, "log") * 10000),
    );
    slider.setAttribute("aria-valuetext", deepTimeLabel(state.year));
    const iceFrame =
      state.ice !== false && scope !== "pacific"
        ? globalIceAtYear(
            currentGlobalIce(),
            state.year,
            scope === "europe" ? "europe" : "global",
          )
        : null;
    const iceLayerHTML =
      iceFrame?.geometry && iceFrame.geometry.type === "MultiPolygon" && iceFrame.geometry.coordinates.length
        ? `<g class="family-ice-layer" aria-hidden="true"><path d="${path(iceFrame.geometry as any) ?? ""}"/></g>`
        : "";
    svg.innerHTML = `<defs><clipPath id="family-land-clip"><path d="${path(currentLand)}"/></clipPath></defs><g transform="translate(${state.x},${state.y}) scale(${state.k})"><rect class="family-ocean-backdrop" x="-3000" y="-3000" width="7000" height="7000"/><path class="family-sea" d="${path({ type: "Sphere" })}"/><path class="family-grid" d="${path(geoGraticule10())}"/><path class="family-land" d="${path(currentLand)}"/><g class="terrain" clip-path="url(#family-land-clip)" aria-hidden="true">${terrainHTML(projection, state.k)}</g>${iceLayerHTML}${current.waves.map((w) => `<path data-world-item="${w.id}" tabindex="0" role="button" aria-label="${esc(w.title)}" class="family-wave ${w.kind} ${w.kind === "admixture" ? "admixture" : ""} ${playing ? "moving" : ""} ${state.selected === w.id ? "selected" : ""}" d="${path({ type: "LineString", coordinates: w.coordinates })}"><title>${esc(w.title)} · ${esc(w.dateLabel)}. Schematic connection.</title></path>`).join("")}${waveLabels}${current.evidence
      .map((e) => {
        const p = projection(e.coordinates);
        if (!p) return "";
        const selected = state.selected === e.id;
        const isNew = e.phase === "dated" && e.start === state.year;
        const showLabel = labeledIds.has(e.id);
        const shortTitle = e.title.length > 34 ? e.title.slice(0, 33) + "…" : e.title;
        return `<g data-world-item="${e.id}" role="button" tabindex="0" aria-label="${esc(e.title)}; ${esc(e.dateLabel)}; ${e.phase === "earlier" ? "earlier evidence" : "dating window"}" class="family-point ${e.phase} ${isNew ? "newly-active" : ""} ${selected ? "selected" : ""}" transform="translate(${p[0]},${p[1]}) scale(${1 / state.k})"><circle class="family-hit" r="12"/><circle r="${selected ? 7 : isNew ? 6.5 : 5}"/><title>${esc(e.title)} · ${esc(e.dateLabel)}</title>${showLabel ? `<text class="${selected ? "selected-label" : "active-label"}" x="11" y="-10">${esc(selected ? e.title : shortTitle)}</text>` : ""}</g>`;
      })
      .join("")}</g>`;
    const dateInput = host.querySelector<HTMLInputElement>("#family-date");
    const eraInput = host.querySelector<HTMLSelectElement>("#family-era-input");
    if (dateInput && eraInput) {
      dateInput.value = String(state.year <= 0 ? 1 - state.year : state.year);
      eraInput.value = state.year <= 0 ? "BCE" : "CE";
    }
    const territories = worldTerritories(data, scope, state.taxon).filter(
      (t) => t.start <= state.year && state.year <= t.end,
    );
    const happeningEl = host.querySelector<HTMLElement>("#family-happening-now");
    if (happeningEl) {
      const itemsHTML = datedNow
        .slice(0, 4)
        .map(
          (e) =>
            `<button type="button" class="family-now-item${e.start === state.year ? " is-new" : ""}" data-world-item="${e.id}"><strong>${esc(e.title)}</strong><span>${esc(e.dateLabel)}${e.start === state.year ? " · Appears at this date" : ""}</span><small>${esc(e.summary)}</small></button>`,
        )
        .join("");
      const wavesHTML = current.waves
        .slice(0, 2)
        .map(
          (w) =>
            `<button type="button" class="family-now-item is-wave" data-world-item="${w.id}"><strong>${esc(w.title)}</strong><span>${esc(w.dateLabel)} · ${esc(w.kind.replaceAll("-", " "))}</span><small>${esc(w.summary)}</small></button>`,
        )
        .join("");
      const terrHTML = territories
        .slice(0, 2)
        .map(
          (t) =>
            `<button type="button" class="family-now-item is-territory" data-world-item="${t.id}"><strong>${esc(t.title)}</strong><span>${esc(deepTimeLabel(t.start))}–${esc(deepTimeLabel(t.end))} · ${esc(t.meaning.replaceAll("-", " "))}</span></button>`,
        )
        .join("");
      happeningEl.innerHTML =
        `<div class="family-happening-head"><span class="world-kicker">HAPPENING AT THIS TIME</span><strong>${esc(deepTimeLabel(state.year))}</strong></div>` +
        (itemsHTML || wavesHTML || terrHTML
          ? `<div class="family-happening-list">${itemsHTML}${wavesHTML}${terrHTML}</div>`
          : `<p class="world-small">No finds fall directly on this date (${current.evidence.length} earlier landmark${current.evidence.length === 1 ? "" : "s"} shown on the map).</p>`);
    }
    const bannerEl = host.querySelector<HTMLElement>("#family-map-banner");
    if (bannerEl) {
      const headlines = [
        ...datedNow.slice(0, 2).map((e) => e.title),
        ...current.waves.slice(0, 1).map((w) => w.title),
      ];
      const yr = bannerEl.querySelector<HTMLElement>(".family-banner-year");
      const txt = bannerEl.querySelector<HTMLElement>(".family-banner-text");
      const metaEl = bannerEl.querySelector<HTMLElement>(".family-banner-meta");
      if (yr) yr.textContent = deepTimeLabel(state.year);
      if (txt) txt.textContent = headlines.length ? headlines.join(" · ") : `${current.evidence.length} earlier anchor${current.evidence.length === 1 ? "" : "s"} in view`;
      if (metaEl) metaEl.textContent = `${stats.records} evidence anchors · ${stats.references} references${iceFrame ? ` · Sea level ~${iceFrame.seaLevelM > 0 ? "+" : ""}${iceFrame.seaLevelM} m` : ""}`;
    }
    svg
      .querySelector(".family-land")!
      .insertAdjacentHTML(
        "afterend",
        territories
          .map(
            (t) =>
              `<path class="family-territory ${t.meaning}" data-world-item="${t.id}" tabindex="0" role="button" aria-label="${esc(t.title)}" d="${path(worldGeometryForD3(t.geometry))}"><title>${esc(t.title)} · ${esc(t.meaning)}. ${esc(t.limits)}</title></path>`,
          )
          .join(""),
      );
    for (const e of current.evidence) {
      const p = e.population?.find((p) => p.year === state.year);
      if (p) {
        const radius = Math.min(16, 3 + Math.log10((p.min + p.max) / 2) * 1.6);
        svg
          .querySelector(`[data-world-item="${e.id}"] circle:not(.family-hit)`)
          ?.setAttribute("r", String(radius));
      }
    }
    const query = (state.query ?? "").trim().toLocaleLowerCase();
    const candidates = query
      ? data.evidence
          .filter(
            (e) =>
              inWorldScope(e, scope) &&
              (state.taxon === "all" || e.taxonIds.includes(state.taxon)) &&
              `${e.title} ${e.summary}`.toLocaleLowerCase().includes(query),
          )
          .map((e) => ({
            ...e,
            phase:
              e.start > state.year
                ? "future"
                : state.year > e.end
                  ? "earlier"
                  : "dated",
          }))
      : current.evidence;
    host.querySelector(".family-list-heading")!.textContent = query
      ? `Search results · ${candidates.length}`
      : "Evidence in this view";
    const ordered = candidates
      .filter((e) => {
        if (query) return true;
        const p = projection(e.coordinates);
        return (
          p &&
          p[0] * state.k + state.x >= 0 &&
          p[0] * state.k + state.x <= 1000 &&
          p[1] * state.k + state.y >= 0 &&
          p[1] * state.k + state.y <= 620
        );
      })
      .sort(
        (a, b) =>
          (a.phase === "dated" ? 0 : 1) - (b.phase === "dated" ? 0 : 1) ||
          b.start - a.start,
      );
    list.innerHTML =
      ordered
        .map(
          (e) =>
            `<button data-world-item="${e.id}"${state.selected === e.id ? ' aria-pressed="true"' : ""}><strong>${esc(e.title)}</strong><span>${esc(e.dateLabel)}${e.phase === "earlier" ? " · earlier evidence" : e.phase === "future" ? " · jump to evidence" : ""}</span></button>`,
        )
        .join("") ||
      (query
        ? '<p class="world-small">No matching evidence in this map and lineage selection.</p>'
        : '<p class="world-small">No mapped evidence for this selection at this stage.</p>');
    host.querySelector("#family-wave-list")!.innerHTML = current.waves.length
      ? `<h2>Connections in this period</h2>${current.waves.map((w) => `<button data-world-item="${w.id}"><strong>${esc(w.title)}</strong><span>${esc(w.dateLabel)} · ${w.kind === "admixture" ? "admixture evidence" : w.kind === "dispersal" ? "dispersal model" : w.kind.replaceAll("-", " ") + " connection"}</span></button>`).join("")}`
      : '<p class="world-small">No mapped connection falls on this date.</p>';
    if (territories.length)
      host
        .querySelector("#family-wave-list")!
        .insertAdjacentHTML(
          "beforeend",
          `<h2>Territories at this date</h2>${territories.map((t) => `<button data-world-item="${t.id}"><strong>${esc(t.title)}</strong><span>${esc(t.meaning.replaceAll("-", " "))}</span></button>`).join("")}`,
        );
    if (focusedItem)
      host
        .querySelector<HTMLElement>(`[data-world-item="${focusedItem}"]`)
        ?.focus({ preventScroll: true });
  }
  host.querySelector<HTMLInputElement>("#family-search")!.oninput = (e) => {
    state.query = (e.target as HTMLInputElement).value;
    pause();
    draw();
  };
  function pause() {
    playing = false;
    if (timer) clearInterval(timer);
    timer = undefined;
    host.querySelector("#family-play")!.textContent = "Play";
    host.querySelector(".family-page")?.classList.remove("is-playing");
  }
  function setYear(y: number) {
    state.year = Math.max(first, Math.min(last, y));
    const current = worldAtYear(data, state.year, scope, state.taxon);
    if (
      state.selected &&
      !current.evidence.some((e) => e.id === state.selected) &&
      !current.waves.some((w) => w.id === state.selected) &&
      !worldTerritories(data, scope, state.taxon).some(
        (t) =>
          t.id === state.selected &&
          t.start <= state.year &&
          state.year <= t.end,
      )
    ) {
      state.selected = "";
      details();
    }
    draw();
  }
  function step(direction: number) {
    const dates = [
        ...new Set([first, last, ...worldDates(data, scope, state.taxon)]),
      ]
        .filter((y) => y >= first && y <= last)
        .sort((a, b) => a - b),
      next =
        direction > 0
          ? dates.find((d) => d > state.year)
          : [...dates].reverse().find((d) => d < state.year);
    if (next === undefined) {
      pause();
      draw();
      return;
    }
    setYear(next);
  }
  host.querySelector<HTMLButtonElement>("#family-play")!.onclick = () => {
    if (playing) {
      pause();
      draw();
      return;
    }
    navigation.closeMenus();
    if (state.year >= last) setYear(first);
    playing = true;
    host.querySelector("#family-play")!.textContent = "Pause";
    draw();
    timer = setInterval(() => step(1), Math.max(450, Math.round(2200 / rate)));
  };
  host.querySelector<HTMLSelectElement>("#family-rate")?.addEventListener("change", (e) => {
    rate = Number((e.target as HTMLSelectElement).value) || 1;
    if (playing && timer) {
      clearInterval(timer);
      timer = setInterval(() => step(1), Math.max(450, Math.round(2200 / rate)));
    }
  });
  const jumpSelect = host.querySelector<HTMLSelectElement>("#family-jump");
  if (jumpSelect)
    jumpSelect.onchange = (e) => {
      const value = (e.target as HTMLSelectElement).value;
      if (value) {
        pause();
        setYear(Number(value));
      }
    };
  host.querySelector<HTMLFormElement>("#family-date-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const errorEl = host.querySelector<HTMLElement>("#family-date-error")!;
    try {
      const y = parseYear(
        host.querySelector<HTMLInputElement>("#family-date")!.value,
        host.querySelector<HTMLSelectElement>("#family-era-input")!.value,
      );
      if (y < first || y > last)
        throw Error(`Choose a year from ${deepTimeLabel(first)} through ${deepTimeLabel(last)}.`);
      errorEl.textContent = "";
      pause();
      setYear(y);
    } catch (err) {
      errorEl.textContent = (err as Error).message;
    }
  });
  host.querySelector<HTMLButtonElement>("#family-back")!.onclick = () => {
    pause();
    step(-1);
  };
  host.querySelector<HTMLButtonElement>("#family-next")!.onclick = () => {
    pause();
    step(1);
  };
  slider.oninput = () => {
    pause();
    setYear(timelineYear(Number(slider.value) / 10000, first, last, "log"));
  };
  slider.addEventListener("keydown", (e) => {
    if (e.key === "Home") {
      e.preventDefault();
      pause();
      setYear(first);
    } else if (e.key === "End") {
      e.preventDefault();
      pause();
      setYear(last);
    }
  });
  const era = host.querySelector<HTMLSelectElement>("#family-era");
  if (era)
    era.onchange = (e) => {
      const value = (e.target as HTMLSelectElement).value;
      if (value) {
        pause();
        setYear(Number(value));
      }
    };
  const taxonSelect = host.querySelector<HTMLSelectElement>("#family-taxon");
  if (taxonSelect)
    taxonSelect.onchange = (e) => {
      pause();
      state.taxon = (e.target as HTMLSelectElement).value;
      state.selected = "";
      details();
      const dates = worldDates(data, scope, state.taxon);
      if (state.year < dates[0]) state.year = dates[0];
      draw();
    };
  const iceToggle = host.querySelector<HTMLInputElement>("#family-ice");
  if (iceToggle)
    iceToggle.onchange = () => {
      state.ice = iceToggle.checked;
      draw();
    };
  void loadGlobalIce().then((archive) => {
    if (archive && !disposed) draw();
  });
  const activate = (e: Event) => {
    const el = (e.target as Element).closest<HTMLElement>("[data-world-item]");
    if (el && !(moved && svg.contains(el))) {
      choose(el.dataset.worldItem!);
    }
    moved = false;
  };
  host.addEventListener("click", activate);
  const key = (e: KeyboardEvent) => {
    if (
      (e.key === "Enter" || e.key === " ") &&
      (e.target as Element).closest("svg [data-world-item]")
    ) {
      e.preventDefault();
      activate(e);
    }
  };
  host.addEventListener("keydown", key);
  const zoom = (factor: number) => {
    const next = Math.max(1, Math.min(8, state.k * factor)),
      ratio = next / state.k;
    state.x = 500 - (500 - state.x) * ratio;
    state.y = 310 - (310 - state.y) * ratio;
    state.k = next;
    draw();
  };
  host.querySelector<HTMLButtonElement>("#family-zoom-in")!.onclick = () =>
    zoom(1.4);
  host.querySelector<HTMLButtonElement>("#family-zoom-out")!.onclick = () =>
    zoom(1 / 1.4);
  host.querySelector<HTMLButtonElement>("#family-reset")!.onclick = () => {
    state.k = 1;
    state.x = state.y = 0;
    draw();
  };
  svg.onwheel = (e) => {
    e.preventDefault();
    zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12);
  };
  svg.onpointerdown = (e) => {
    if (e.button !== 0) return;
    moved = false;
    drag = { x: e.clientX, y: e.clientY, sx: state.x, sy: state.y };
  };
  svg.onpointermove = (e) => {
    if (!drag) return;
    const start = svgPoint(svg, drag.x, drag.y),
      end = svgPoint(svg, e.clientX, e.clientY);
    if (!start || !end) return;
    const dx = end[0] - start[0], dy = end[1] - start[1];
    if (Math.abs(dx) + Math.abs(dy) > 5) {
      moved = true;
      svg.setPointerCapture(e.pointerId);
    }
    if (!moved) return;
    state.x = drag.sx + dx;
    state.y = drag.sy + dy;
    draw();
  };
  svg.onpointerup = () => {
    drag = undefined;
  };
  svg.onpointercancel = () => {
    drag = undefined;
  };
  const deepTarget = initialSite
    ? [...data.evidence, ...data.waves, ...(data.territories ?? [])].find((e) => e.id === initialSite)
    : undefined;
  if (deepTarget) {
    state.taxon = "all";
    const taxonSelect = host.querySelector<HTMLSelectElement>("#family-taxon");
    if (taxonSelect) taxonSelect.value = "all";
    state.year = Math.max(first, Math.min(last, deepTarget.start));
    choose(deepTarget.id);
  } else {
    details(
      [...data.evidence, ...data.waves, ...(data.territories ?? [])].find(
        (e) => e.id === state.selected,
      ),
    );
    draw();
  }
  return () => {
    disposed = true;
    pause();
    stopDetailedLand();
    navigation.dispose();
    host.removeEventListener("click", activate);
    host.removeEventListener("keydown", key);
    svg.onwheel =
      svg.onpointerdown =
      svg.onpointermove =
      svg.onpointerup =
      svg.onpointercancel =
        null;
  };
}

export async function mountWorldPage(
  host: HTMLElement,
  route: string,
  land: any,
  initialSite?: string,
): Promise<() => void> {
  if (route === "world")
    return mountWorldHub(host, await json("world-summary.json"), land);
  const data = await loadWorldData();
  if (route === "africa-early")
    return mountWorldPlayer(
      host,
      africaEarlyData(data),
      land,
      "africa",
      undefined,
      true,
      initialSite,
    );
  if (route.startsWith("study:")) {
    const study = data.studies?.find((s) => s.id === route.slice(6));
    if (!study)
      throw Error(
        "This study is not in the current atlas. Return to the world overview.",
      );
    const selected = {
      ...data,
      evidence: data.evidence.filter((e) => study.evidenceIds.includes(e.id)),
      waves: data.waves.filter((w) => study.waveIds.includes(w.id)),
      territories: (data.territories ?? []).filter((t) =>
        study.territoryIds.includes(t.id),
      ),
    };
    return mountWorldPlayer(host, selected, land, "world", study, false, initialSite);
  }
  return mountWorldPlayer(
    host,
    data,
    land,
    route === "origins" ? "world" : (route as WorldScope),
    undefined,
    false,
    initialSite,
  );
}
