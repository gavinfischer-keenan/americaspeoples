import {
  geoOrthographic,
  geoNaturalEarth1,
  geoPath,
  geoGraticule10,
  geoDistance,
  type GeoProjection,
} from "d3-geo";
import { esc } from "./dom";
import { consensusResearch } from "./research-provenance";
import { mountMapNavigation } from "./map-navigation";
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
      : activeHash === "#atlas/europe" || activeHash === "#origins/europe"
        ? "#atlas/europe"
        : activeHash === "#atlas/asia-pacific"
          ? "#atlas/asia-pacific"
          : activeHash === "#origins" || activeHash.startsWith("#study/")
            ? "#dives"
            : activeHash === "#explore"
              ? "#explore"
              : activeHash === "#movie" || activeHash === "#map"
                ? "#movie"
                : activeHash === "#library"
                  ? "#library"
                  : "#world";
  const items = [
    ["#world", "World"],
    ["#movie", "Americas"],
    ["#atlas/africa", "Africa"],
    ["#atlas/europe", "Europe"],
    ["#atlas/asia-pacific", "Asia & Pacific"],
    ["#explore", "Explore"],
    ["#dives", "Deep dives"],
    ["#library", "Library"],
  ] as const;
  return `<header class="world-top"><a class="world-brand" href="#world"><span class="world-mark" aria-hidden="true">◈</span><span>The Spread of Peoples<small>ALASKA BLACKFISH</small></span></a><nav aria-label="Main navigation">${items.map(([href, label]) => `<a href="${href}"${href === active ? ' class="active"' : ""}>${label}</a>`).join("")}</nav><a class="header-about" href="#about" aria-label="About this atlas">About the atlas ↗</a></header>`;
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
    : `<section class="world-intro"><div><p class="world-kicker">ALASKA BLACKFISH · AN OPEN EDUCATIONAL ATLAS</p><h1>The spread <br>of peoples<span>.</span></h1><p class="world-lede">A world of human stories. Spin the globe and select any of the four regions to dive into its timeline movie, evidence, and deep dives.</p><div class="world-stats"><div><strong>${number(summary.records)}</strong><span>evidence records</span></div><div><strong>${number(summary.references)}</strong><span>unique references</span></div><div><strong>${number(summary.guides)}</strong><span>world guides</span></div></div><p class="world-small">Earliest mapped evidence to 1900. Regional coverage is uneven and growing; Hawaiʻi’s statehood story continues to 1959.</p></div><aside class="world-provenance"><p class="world-kicker">ATLAS COVERAGE</p><div class="world-coverage-stats"><div><strong>${regions.length}</strong><span>regional entrances</span></div><div><strong>${summary.foundation.taxa}</strong><span>human-family branches</span></div><div><strong>${summary.foundation.evidence}</strong><span>origins evidence anchors</span></div><div><strong>${summary.foundation.waves}</strong><span>dispersal &amp; admixture models</span></div></div><p class="world-coverage-range"><strong>${deepTimeLabel(Math.min(...regions.filter((r) => r.earliest !== null).map((r) => r.earliest!)))}</strong> earliest mapped evidence · through 1900 CE</p><div class="world-consensus" aria-label="Consensus research"><a href="https://consensus.app/" target="_blank" rel="noopener noreferrer">Consensus ↗</a><span><strong>${consensusResearch.deepRuns}+</strong> Deep research runs</span><span><strong>${consensusResearch.citedPaperMatches}</strong> cited papers</span></div><a class="world-credit-link" href="${esc(options.sourcesHref ?? "sites/sources-attributions.html#consensus-discovery")}">Research credits, sources &amp; licenses</a></aside></section>`;
  host.innerHTML = `<article class="world-hub${options.globeOnly ? " world-hub-embedded" : ""}">${introHTML}
 <section class="world-atlas"><div class="world-section-head"><div><p class="world-kicker">CHOOSE A REGION TO DIVE IN</p><h2>Spin the globe. Pick a region.</h2></div><div class="world-view-controls"><button id="world-projection" aria-pressed="false">Show all regions</button><button id="world-west">Rotate west</button><button id="world-east">Rotate east</button></div></div><p class="world-map-instruction">Drag the globe to spin it. Dividing lines separate the four clickable regions—click any region on the globe or in the cards below to open its full regional map.</p><div class="world-globe"><svg id="world-globe" viewBox="0 0 1000 610" aria-label="World atlas regions" role="group"></svg></div><div class="world-region-grid">${regions.map((r) => `<a class="world-region-card" data-region="${r.id}" href="${esc(href(r.id))}"><span class="world-region-title">${esc(r.title)}</span><span class="world-coverage">${esc(r.coverage)}</span><div class="world-region-stats"><div><strong>${number(r.references)}</strong><span>references</span></div><div><strong>${number(r.records)}</strong><span>events &amp; records</span></div><div><strong>${number(r.guides)}</strong><span>guides</span></div></div><span class="world-region-date">${esc(r.earliestLabel)}</span><span class="world-region-action">Open regional movie →</span></a>`).join("")}</div><p class="world-small world-dives-note">Looking for place guides, human-family origins, or topic studies? <a href="${esc(options.divesHref ?? "#dives")}">Browse all ${number(summary.guides)}+ Deep Dives (Subjects, Places, Languages &amp; Cultures) →</a> · <a href="${esc(options.guideHref ?? "sites/world-human-family.html")}">Human-family &amp; genetics discussion →</a></p><details class="world-stat-method"><summary>What these numbers mean</summary><p>${esc(summary.method)}</p><p>“Earliest mapped evidence” describes this collection, not a proven first arrival. References count distinct cited works or source pages, not independent confirmations. Regional totals may overlap. The world guide count covers the cross-region collection; the regional archive also includes place, culture and route guides.</p></details></section><p class="world-small world-map-credit">Modern coastline reference: Natural Earth, public domain. Regional dividing lines mark clickable navigation zones, not ancient political or cultural borders.</p></article>`;
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
      sampleSpan(-65, 82, 2, (lat) => [-25, lat]),
      sampleSpan(-65, 72, 2, (lat) => [-170, lat]),
      sampleSpan(-25, 60, 2, (lon) => [lon, 36]),
      sampleSpan(36, 82, 2, (lat) => [60, lat]),
      sampleSpan(-36, 36, 2, (lat) => [55, lat]),
      sampleSpan(-25, 55, 2, (lon) => [lon, -36]),
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
            ? 0
            : r.id === "europe"
              ? 114
              : r.id === "africa"
                ? -108
                : r.id === "asia-pacific"
                  ? 70
                  : -55;
          const dy = flat
            ? r.id === "europe"
              ? -36
              : r.id === "africa"
                ? 44
                : 0
            : r.id === "europe"
              ? -18
              : r.id === "africa"
                ? 40
                : 0;
          const x = Math.max(115, Math.min(885, loc[0] + dx)),
            y = Math.max(48, Math.min(552, loc[1] + dy));
          const short =
            r.id === "asia-pacific"
              ? "Asia & Pacific"
              : r.id === "africa"
                ? "Africa"
                : r.id === "europe"
                  ? "Europe"
                  : r.title;
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
    const id =
      lon < -25 && lon > -170
        ? "americas"
        : lon >= -25 && lon < 60 && lat > 36
          ? "europe"
          : lon >= -25 && lon <= 55 && lat >= -36 && lat <= 36
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
  }
>();
export function mountWorldPlayer(
  host: HTMLElement,
  data: WorldData,
  land: any,
  scope: WorldScope,
  study?: WorldStudy,
  earlyAfrica = false,
): () => void {
  const first = study?.start ?? Math.min(...worldDates(data, scope)),
    last = earlyAfrica ? AFRICA_EARLY_END : (study?.end ?? 1900),
    title =
      (earlyAfrica
        ? "Africa: earliest evidence to 15,000 BCE"
        : study?.title) ??
      (scope === "world"
        ? "The branching human family"
        : worldRegions.find((r) => r.id === scope)!.title);
  const saveKey = earlyAfrica ? "africa-early" : (study?.id ?? scope),
    state = saved.get(saveKey) ?? {
      year: first,
      taxon: "all",
      k: 1,
      x: 0,
      y: 0,
      selected: "",
    };
  saved.set(saveKey, state);
  let playing = false,
    timer: ReturnType<typeof setInterval> | undefined,
    disposed = false,
    drag: { x: number; y: number; sx: number; sy: number } | undefined,
    moved = false;
  const stats = worldRegionStats(data, scope),
    taxa = data.taxa.filter(
      (t) =>
        data.evidence.some(
          (e) => e.taxonIds.includes(t.id) && inWorldScope(e, scope),
        ) ||
        data.waves.some(
          (w) => w.taxonIds.includes(t.id) && inWorldScope(w, scope),
        ),
    );
  host.innerHTML = `<article class="family-page"><header class="family-heading"><div><p class="world-kicker">THE SPREAD OF PEOPLES · FIRST BROAD FRAMEWORK</p><h1>${esc(title)}</h1><p>Evidence anchors and broad connections. A foundation for the detailed histories still to come.</p></div><nav aria-label="Regional history"><a href="#world">World overview</a>${scope === "europe" ? '<a href="#atlas/europe">Northern Europe: detailed history</a>' : ""}<a href="sites/world-human-family.html">Family &amp; genetics guide</a></nav></header><div class="family-map-navigation"></div><div class="family-layout"><aside class="family-reader"><div class="family-filter"><label>Lineage<select id="family-taxon"><option value="all">All human-family branches</option>${taxa.map((t) => `<option value="${t.id}"${state.taxon === t.id ? " selected" : ""}>${esc(t.name)}</option>`).join("")}</select></label><label>Jump to a chapter<select id="family-era"><option value="">Choose a period</option><option value="${first}">Earliest mapped evidence</option><option value="-2800000">Early Homo</option><option value="-350000">Many human lineages</option><option value="-70000">Later dispersals</option><option value="-12000">After the Ice Age</option><option value="-7000">Farmers and population change</option><option value="1900">1900 endpoint</option></select></label></div><section id="family-happening-now" class="family-happening-now" aria-live="polite"></section><section id="family-detail" aria-live="polite"></section><details class="family-reading"><summary>How to read this draft</summary><p>Bright points mark evidence whose dating range contains the map year. Fainter points are earlier evidence, not a claim of continuing occupation. A dating range can express uncertainty rather than continuous activity.</p><p>Dashed connections represent broad dispersal models; pink dotted connections concern admixture. Their geometry is schematic and does not establish a surveyed route or an exact meeting place. Motion does not encode speed or population.</p><p>Last known evidence is not an extinction date. Genes, languages and material cultures do not map one-to-one.</p><p>Deep-time labels retain the source’s approximate ages. BP uses 1950 as its reference. Modern coastlines are a navigation aid, not reconstructed prehistoric shores.</p></details><h2 class="family-list-heading">Evidence in this view</h2><div id="family-evidence-list"></div></aside><div class="family-map-column"><div class="family-map-top"><span>${stats.records} evidence anchors · ${stats.references} references</span><div><button id="family-zoom-out" aria-label="Zoom out">−</button><button id="family-zoom-in" aria-label="Zoom in">+</button><button id="family-reset">Reset map</button></div></div><div class="family-map-stage"><svg id="family-map" viewBox="0 0 1000 620" role="group" aria-label="Human-family evidence map"></svg><div id="family-map-banner" class="family-map-banner" aria-live="polite"></div></div><div class="family-legend"><span><i class="family-dot"></i>Dated evidence</span><span><i class="family-dot earlier"></i>Earlier evidence</span><span>Dashed: dispersal model</span><span class="family-admixture">Dotted: admixture evidence</span></div><div id="family-wave-list"></div></div></div><footer class="family-timeline"><div><strong id="family-year"></strong><span id="family-date-note">Evidence changes are spaced for reading; long gaps are shortened.</span></div><div class="family-transport"><button id="family-back" aria-label="Previous evidence change">Previous</button><button id="family-play">Play</button><button id="family-next" aria-label="Next evidence change">Next</button></div><input id="family-slider" type="range" min="0" max="10000" step="1" aria-label="Human-family map year"><div class="family-time-ends"><span>${deepTimeLabel(first)}</span><span>1900 CE</span></div></footer></article>`;
  if (study) {
    host.querySelector(".family-heading nav")!.innerHTML =
      `<a href="#world">World overview</a><a href="sites/${study.guideId}.html">Read the full deep dive</a>`;
    host.querySelector(".family-heading p:not(.world-kicker)")!.textContent =
      study.summary;
    host.querySelector(".family-time-ends span:last-child")!.textContent =
      deepTimeLabel(last);
    host.querySelector("#family-era")!.closest("label")!.remove();
    host.querySelector("#family-taxon")!.closest("label")!.remove();
    host.querySelector(".family-heading .world-kicker")!.textContent =
      "THE SPREAD OF PEOPLES · DATED DEEP DIVE";
    host
      .querySelector("#family-map")!
      .setAttribute("aria-label", study.title + " evidence map");
    host.querySelector(".family-legend")!.innerHTML =
      '<span><i class="family-dot"></i>Dated evidence</span><span><i class="family-dot earlier"></i>Earlier evidence</span><span>Dashed: schematic movement</span><span>Shading: dated territorial reconstruction</span>';
    host.querySelector(".family-reading")!.innerHTML =
      "<summary>How to read this study</summary><p>Bright points fall within the selected date range. Fainter points are earlier evidence, not proof of continuing occupation. Dashed lines join selected places schematically; they are not surveyed paths or population estimates.</p><p>Territories represent dated, approximate reconstructions. Campaigns, short occupations, claims and durable control are distinct. Select each item for its sources and limitations. Settlement size appears only where a dated population estimate is available.</p><p>Textual testimony, material evidence and later reconstructions can differ. Modern coastlines help orientation; they are not historical boundaries.</p>";
  }

  if (scope === "africa" && !study) {
    host
      .querySelector(".family-heading nav")!
      .insertAdjacentHTML(
        "beforeend",
        earlyAfrica
          ? '<a href="#atlas/africa">All Africa periods</a>'
          : '<a href="#atlas/africa/early">Africa to 15,000 BCE</a>',
      );
  }
  host
    .querySelector(".family-list-heading")!
    .insertAdjacentHTML(
      "beforebegin",
      `<label class="family-search-label">Find a site or evidence<input id="family-search" type="search" placeholder="Name, place or technology" value="${esc(state.query ?? "")}"><small>Search every date in this map. Selecting a result opens its dated evidence.</small></label>`,
    );
  if (earlyAfrica) {
    host.querySelector(".family-heading p:not(.world-kicker)")!.textContent =
      "Fossils, occupation phases, technologies and dispersal evidence across Africa. Select a record for its dates, interpretation and sources.";
    host.querySelector(".family-heading .world-kicker")!.textContent =
      "THE SPREAD OF PEOPLES · AFRICA FILL-IN";
    host.querySelector(".family-time-ends span:last-child")!.textContent =
      "15,000 BCE";
    host.querySelector("#family-era")!.innerHTML =
      `<option value="">Choose a period</option><option value="${first}">Earliest mapped evidence</option><option value="-2800000">Early Homo and stone tools</option><option value="-350000">Middle Pleistocene diversity</option><option value="-100000">Later Middle Stone Age</option><option value="-40000">Later Pleistocene occupations</option><option value="${last}">15,000 BCE endpoint</option>`;
    host
      .querySelector(".family-reading")!
      .insertAdjacentHTML(
        "beforeend",
        "<p>This chapter ends at 15,000 BCE (about 16,949 calendar years BP), not 15,000 BP. Archaeological traditions are not ethnic identities. Fossil occurrences do not by themselves establish habitation. Coverage remains uneven, especially in central and western Africa.</p>",
      );
  } else if (scope === "africa" && !study) {
    host.querySelector(".family-heading p:not(.world-kicker)")!.textContent =
      "Prehistoric fossils, Green Sahara pastoralism, kingdoms of the Nile, Sahel, Forest, Swahili coast, Zimbabwe plateau and Madagascar through 1900 CE.";
    host.querySelector("#family-era")!.innerHTML =
      `<option value="">Choose a period</option><option value="${first}">Earliest mapped evidence</option><option value="-2800000">Early Homo and stone tools</option><option value="-350000">Middle Pleistocene diversity</option><option value="-70000">Later Middle Stone Age</option><option value="-12000">Terminal Pleistocene</option><option value="-6000">Green Sahara &amp; early herders</option><option value="-2500">Nile states, Kerma &amp; drying Sahara</option><option value="-500">Nok, Meroë, Yeha &amp; Jenné-jeno</option><option value="1000">Swahili coast, Sahel &amp; Limpopo</option><option value="1400">Great Zimbabwe, Ife, Mali &amp; Kongo</option><option value="1750">Oyo, Asante, Gondar, Funj &amp; Sotho-Tswana</option><option value="${last}">1900 CE endpoint</option>`;
  }

  const related = (data.studies ?? []).filter(
    (s) => scope === "world" || s.regionIds.includes(scope),
  );
  if (!study && related.length)
    host
      .querySelector(".family-heading")!
      .insertAdjacentHTML(
        "afterend",
        `<nav class="family-study-links" aria-label="Connected deep dives">${related.map((s) => `<a href="#study/${s.id}">${esc(s.title)}</a>`).join("")}</nav>`,
      );
  const navigation = mountMapNavigation(
    host.querySelector<HTMLElement>(".family-map-navigation")!,
    {
      region: scope === "world" ? undefined : scope,
      settings: [
        host.querySelector<HTMLElement>(".family-filter")!,
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
  const center =
    scope === "world"
      ? [0, 0]
      : worldRegions.find((r) => r.id === scope)!.center;
  const projection = geoNaturalEarth1()
    .rotate([-center[0], 0])
    .center([0, center[1] * 0.55])
    .translate([500, 310])
    .scale(scope === "world" ? 178 : 245);
  if (scope === "africa" && !study)
    projection.fitExtent(
      [
        [80, 35],
        [920, 585],
      ],
      {
        type: "MultiPoint",
        coordinates: [
          [-20, -36],
          [-20, 37],
          [55, 37],
          [55, -36],
        ],
      },
    );
  if (study)
    projection.fitExtent(
      [
        [45, 45],
        [955, 575],
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
  function sourceHTML(ids: string[]) {
    return worldSources(data, ids)
      .map(
        (s) =>
          `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a><small>${esc(s.access)}${s.locator ? " · " + esc(s.locator) : ""}</small></li>`,
      )
      .join("");
  }
  function details(item?: WorldEvidence | WorldWave | WorldTerritory) {
    detail.classList.toggle("has-selection", Boolean(item));
    if (item && "geometry" in item) {
      detail.innerHTML = `<p class="world-kicker">${esc(item.meaning.replaceAll("-", " "))}</p><h2>${esc(item.title)}</h2><strong>${deepTimeLabel(item.start)}–${deepTimeLabel(item.end)}</strong><p>${esc(item.limits)}</p><ul class="family-sources">${sourceHTML(item.sourceIds)}</ul>`;
      return;
    }
    if (!item) {
      const t = data.taxa.find((t) => t.id === state.taxon);
      detail.innerHTML = t
        ? `<p class="world-kicker">${esc(t.status.replaceAll("-", " "))}</p><h2>${esc(t.name)}</h2><p>${esc(t.meaning)}</p><p>${esc(t.note)}</p><ul class="family-sources">${sourceHTML(t.sourceIds)}</ul>`
        : `<p class="world-kicker">${study ? "A DATED HISTORY" : "A BRANCHING STORY"}</p><h2>Read the evidence</h2><p>Select a point, connection or territory to see its dates, interpretation and sources.</p><p>${study ? "Places, movements and territorial reconstructions have separate sources and limits. An earlier point does not establish continuing occupation." : "Different human lineages overlapped in time. Some relationships are well supported; others remain unresolved."}</p>`;
      return;
    }
    detail.innerHTML = `<p class="world-kicker">${esc(item.kind.replaceAll("-", " "))}</p><h2>${esc(item.title)}</h2><strong>${esc(item.dateLabel)}</strong><p>${esc(item.summary)}</p><p class="family-limits">${esc(item.limits)}</p>${"dateBasis" in item ? `<p class="world-small">${esc(item.dateBasis)}</p>` : ""}<p class="world-small">${item.taxonIds.map((id) => esc(data.taxa.find((t) => t.id === id)!.name)).join(" · ")}</p><h3>Evidence and sources</h3><ul class="family-sources">${sourceHTML(item.sourceIds)}</ul>${"guideId" in item && item.guideId ? `<a href="sites/${esc(item.guideId)}.html">Read the deeper study</a>` : ""}`;
    if ("population" in item && item.population?.length)
      detail.insertAdjacentHTML(
        "beforeend",
        `<h3>Dated resident estimates</h3>${item.population.map((p) => `<p><strong>${deepTimeLabel(p.year)}: ${number(p.min)}${p.max !== p.min ? "–" + number(p.max) : ""}</strong><br>${esc(p.note)} (${esc(p.basis)}).</p><ul class="family-sources">${sourceHTML(p.sourceIds)}</ul>`).join("")}<p class="world-small">Dot size changes only at these observed dates. No population is extrapolated.</p>`,
      );
  }
  function choose(id: string) {
    navigation.showFacts();
    host.querySelector(".family-reader")!.scrollTop = 0;
    pause();
    const selectedEvidence = data.evidence.find((e) => e.id === id);
    if (selectedEvidence && selectedEvidence.start > state.year)
      state.year = Math.max(first, Math.min(last, selectedEvidence.start));
    if (selectedEvidence) {
      const point = projection(selectedEvidence.coordinates);
      if (point && (point[0] * state.k + state.x < 25 || point[0] * state.k + state.x > 975 || point[1] * state.k + state.y < 25 || point[1] * state.k + state.y > 595)) {
        state.x = 500 - point[0] * state.k;
        state.y = 310 - point[1] * state.k;
      }
    }
    state.selected = id;
    details(
      [...data.evidence, ...data.waves, ...(data.territories ?? [])].find(
        (e) => e.id === id,
      ),
    );
    draw();
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
    svg.innerHTML = `<defs><clipPath id="family-clip"><rect width="1000" height="620"/></clipPath></defs><g clip-path="url(#family-clip)"><g transform="translate(${state.x},${state.y}) scale(${state.k})"><path class="family-sea" d="${path({ type: "Sphere" })}"/><path class="family-grid" d="${path(geoGraticule10())}"/><path class="family-land" d="${path(land)}"/>${current.waves.map((w) => `<path data-world-item="${w.id}" tabindex="0" role="button" aria-label="${esc(w.title)}" class="family-wave ${w.kind} ${w.kind === "admixture" ? "admixture" : ""} ${playing ? "moving" : ""} ${state.selected === w.id ? "selected" : ""}" d="${path({ type: "LineString", coordinates: w.coordinates })}"><title>${esc(w.title)} · ${esc(w.dateLabel)}. Schematic connection.</title></path>`).join("")}${waveLabels}${current.evidence
      .map((e) => {
        const p = projection(e.coordinates);
        if (!p) return "";
        const selected = state.selected === e.id;
        const isNew = e.phase === "dated" && e.start === state.year;
        const showLabel = labeledIds.has(e.id);
        const shortTitle = e.title.length > 34 ? e.title.slice(0, 33) + "…" : e.title;
        return `<g data-world-item="${e.id}" role="button" tabindex="0" aria-label="${esc(e.title)}; ${esc(e.dateLabel)}; ${e.phase === "earlier" ? "earlier evidence" : "dating window"}" class="family-point ${e.phase} ${isNew ? "newly-active" : ""} ${selected ? "selected" : ""}" transform="translate(${p[0]},${p[1]}) scale(${1 / state.k})"><circle class="family-hit" r="12"/><circle r="${selected ? 7 : isNew ? 6.5 : 5}"/><title>${esc(e.title)} · ${esc(e.dateLabel)}</title>${showLabel ? `<text class="${selected ? "selected-label" : "active-label"}" x="11" y="-10">${esc(selected ? e.title : shortTitle)}</text>` : ""}</g>`;
      })
      .join("")}</g></g>`;
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
          : `<p class="world-small">No dated anchor starts or sits active in this window (${current.evidence.length} earlier anchor${current.evidence.length === 1 ? "" : "s"} shown in context).</p>`);
    }
    const bannerEl = host.querySelector<HTMLElement>("#family-map-banner");
    if (bannerEl) {
      const headlines = [
        ...datedNow.slice(0, 2).map((e) => e.title),
        ...current.waves.slice(0, 1).map((w) => w.title),
      ];
      bannerEl.innerHTML = `<span class="family-banner-year">${esc(deepTimeLabel(state.year))}</span><span class="family-banner-text">${esc(headlines.length ? headlines.join(" · ") : `${current.evidence.length} earlier anchor${current.evidence.length === 1 ? "" : "s"} in view`)}</span>`;
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
        : '<p class="world-small">No mapped evidence for this selection at this stage. This is a coverage gap.</p>');
    host.querySelector("#family-wave-list")!.innerHTML = current.waves.length
      ? `<h2>Connections in this period</h2>${current.waves.map((w) => `<button data-world-item="${w.id}"><strong>${esc(w.title)}</strong><span>${esc(w.dateLabel)} · schematic ${w.kind === "admixture" ? "admixture connection" : w.kind === "dispersal" ? "dispersal model" : w.kind.replaceAll("-", " ") + " connection"}</span></button>`).join("")}`
      : "<p>No included connection is active at this date. Earlier routes are not kept moving.</p>";
    if (territories.length)
      host
        .querySelector("#family-wave-list")!
        .insertAdjacentHTML(
          "beforeend",
          `<h2>Territories at this date</h2>${territories.map((t) => `<button data-world-item="${t.id}"><strong>${esc(t.title)}</strong><span>${esc(t.meaning.replaceAll("-", " "))} · select for sources and limits</span></button>`).join("")}`,
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
    timer = setInterval(() => step(1), 2200);
  };
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
  details(
    [...data.evidence, ...data.waves, ...(data.territories ?? [])].find(
      (e) => e.id === state.selected,
    ),
  );
  draw();
  return () => {
    disposed = true;
    pause();
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
    return mountWorldPlayer(host, selected, land, "world", study);
  }
  return mountWorldPlayer(
    host,
    data,
    land,
    route === "origins" ? "world" : (route as WorldScope),
  );
}
