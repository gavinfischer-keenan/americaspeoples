import { esc } from "./dom";

export interface ProxyArchive {
  id: string;
  name: string;
  shortName: string;
  spanLabel: string;
  minYears: number;
  maxYears: number;
  resolution: string;
  measures: string;
  howItWorks: string;
  limits: string;
  accent: string;
  iconSvg: string;
  sources: { label: string; url: string }[];
}

export const proxyArchives: ProxyArchive[] = [
  {
    id: "marine-sediments",
    shortName: "Marine Sediment Cores",
    name: "Deep-Sea Sediment Cores & Foraminifera",
    spanLabel: "0 – 66+ Ma",
    minYears: 200,
    maxYears: 66_000_000,
    resolution: "Century – Millennial",
    measures: "Deep-ocean T, ice volume (δ¹⁸O, Mg/Ca, alkenones)",
    howItWorks:
      "Microscopic shells (foraminifera) sinking onto ocean floors lock in the ratio of heavy ¹⁸O to light ¹⁶O oxygen isotopes and Mg/Ca ratios at the time they grew. Light ¹⁶O evaporates preferentially and becomes trapped in continental ice sheets during ice ages, making seawater—and fossil shells—enriched in ¹⁸O.",
    limits:
      "Benthic δ¹⁸O blends global ice volume with deep-water cooling (~1–2 °C); separating the two requires Mg/Ca thermometry or uplifted coral reefs.",
    accent: "#6CC5EB",
    iconSvg:
      '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="14" y="4" width="20" height="40" rx="3" fill="#10171A" stroke="#6CC5EB" stroke-width="1.8"/><path d="M14 14h20M14 23h20M14 33h20" stroke="#6CC5EB" stroke-width="1.4" opacity=".8"/><circle cx="20" cy="19" r="2.2" fill="#F2F6F8"/><circle cx="27" cy="28" r="2.6" fill="#97C798"/><circle cx="22" cy="38" r="2.2" fill="#FA742A"/></svg>',
    sources: [
      { label: "Lisiecki & Raymo 2005 (LR04)", url: "https://doi.org/10.1029/2004PA001071" },
      { label: "Westerhold et al. 2020 (CENOGRID)", url: "https://doi.org/10.1126/science.aba6853" },
      { label: "Miller et al. 2020 (Cenozoic Sea Level)", url: "https://doi.org/10.1126/sciadv.aaz1346" },
    ],
  },
  {
    id: "ice-cores",
    shortName: "Antarctic & Greenland Ice",
    name: "Polar Ice Cores & Trapped Air Bubbles",
    spanLabel: "0 – 800 ka",
    minYears: 1,
    maxYears: 800_000,
    resolution: "Annual – Decadal",
    measures: "Air T (δD / δ¹⁸O), ancient air CO₂ & CH₄, volcanic sulfate",
    howItWorks:
      "Annual snowfall compacts into firn and seals microscopic bubbles of ancient atmosphere—the only direct samples of pre-industrial CO₂ and methane. Heavy hydrogen (δD) and oxygen isotopes in frozen water track condensation temperature, while acidity peaks pinpoint volcanic eruptions like 536 CE and Samalas 1257 CE.",
    limits:
      "Air diffuses within porous firn until sealed, making trapped gas bubbles decades to ~2,000 years younger than the surrounding ice layer.",
    accent: "#97C798",
    iconSvg:
      '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="14" y="4" width="20" height="40" rx="4" fill="#1B3944" stroke="#C9EAFA" stroke-width="1.8"/><path d="M14 13c5 2 15-2 20 0M14 24c6-2 14 2 20 0M14 35c5 2 15-1 20 0" stroke="#C9EAFA" stroke-width="1.4" fill="none"/><circle cx="20" cy="18" r="1.8" fill="#F2F6F8"/><circle cx="28" cy="29" r="2" fill="#F2F6F8"/><circle cx="24" cy="39" r="1.6" fill="#97C798"/></svg>',
    sources: [
      { label: "Jouzel et al. 2007 (EPICA Dome C)", url: "https://doi.org/10.1126/science.1141038" },
      { label: "Bereiter et al. 2015 (800 ka CO₂)", url: "https://doi.org/10.1002/2014GL061957" },
      { label: "NGRIP Members 2004", url: "https://doi.org/10.1038/nature02805" },
    ],
  },
  {
    id: "tree-rings",
    shortName: "Tree Rings (Dendro)",
    name: "Tree Rings (Dendroclimatology)",
    spanLabel: "0 – ~12 ka",
    minYears: 1,
    maxYears: 12_000,
    resolution: "Seasonal – Annual",
    measures: "Growing-season T, drought indices, abrupt volcanic frosts",
    howItWorks:
      "Temperate and sub-polar trees grow one exactly dated ring per year; matching overlapping living, historical timber, and bog-preserved trunks builds continuous year-by-year chronologies back over 10,000 years. Ring width and maximum latewood density isolate summer warmth and soil moisture anomalies down to a single frost year.",
    limits:
      "Compressed mainly into mid- and high-latitude land regions and weighted toward warm-season conditions; biological age trends must be detrended carefully.",
    accent: "#569E56",
    iconSvg:
      '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="19" fill="#1E2922" stroke="#97C798" stroke-width="2"/><circle cx="24" cy="24" r="14" fill="none" stroke="#72B273" stroke-width="1.4"/><circle cx="24" cy="24" r="9" fill="none" stroke="#97C798" stroke-width="1.3"/><circle cx="24" cy="24" r="4" fill="none" stroke="#D4501E" stroke-width="1.8"/><path d="M24 24l15-9" stroke="#DCEBDD" stroke-width="1.1" stroke-dasharray="2 2"/></svg>',
    sources: [
      { label: "PAGES 2k Consortium 2019", url: "https://doi.org/10.1038/s41561-019-0400-0" },
      { label: "PAGES 2k Multiproxy DB 2017", url: "https://doi.org/10.1038/sdata.2017.88" },
    ],
  },
  {
    id: "speleothems",
    shortName: "Cave Speleothems",
    name: "Cave Speleothems (Stalagmites & Flowstones)",
    spanLabel: "0 – 600+ ka",
    minYears: 5,
    maxYears: 600_000,
    resolution: "Annual – Decadal",
    measures: "Monsoon rainfall, cave air T, uranium-thorium absolute ages",
    howItWorks:
      "Dripwater seeping through soil deposits microlayers of calcium carbonate inside limestone caves. Trace uranium locked inside crystal bands decays into thorium at a known rate, giving ultra-precise U–Th calendar ages even beyond the radiocarbon limit, while calcite δ¹⁸O records monsoon strength and precipitation shifts.",
    limits:
      "Karst residence time and cave-specific evaporation can mute high-frequency signals; requires regional arrays to separate rainfall amount from moisture source.",
    accent: "#FA742A",
    iconSvg:
      '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 8h32v6c-5 0-8 10-8 10s-3-10-8-10-8 10-8 10-3-10-8-10z" fill="#2A343A"/><path d="M18 44l4-18 4 18zM28 44l3-12 3 12z" fill="#FA742A" opacity=".9"/><path d="M6 44h36" stroke="#8E99A0" stroke-width="2"/></svg>',
    sources: [
      { label: "Kaufman et al. 2020 (Temp12k)", url: "https://doi.org/10.1038/s41597-020-0530-7" },
      { label: "Comas-Bru et al. 2020 (SISAL/Iso2k)", url: "https://doi.org/10.5194/essd-2020-5-supplement" },
    ],
  },
  {
    id: "lake-pollen",
    shortName: "Lakes, Pollen & Wax",
    name: "Lake Varves, Fossil Pollen & Plant Leaf Waxes",
    spanLabel: "0 – 5+ Ma",
    minYears: 1,
    maxYears: 5_000_000,
    resolution: "Annual (varves) – Centennial",
    measures: "Vegetation zones, summer T, Sahara/rift humidity (δ¹³C / δD)",
    howItWorks:
      "Seasonal lake beds lay down countable annual silt–organic pairs (varves) trapping blown pollen grains, midges (chironomids), and waxy plant cuticles. Leaf-wax δ¹³C distinguishes closed forest (C₃ plants) from open tropical grassland (C₄ plants) across early hominin basins in East Africa.",
    limits:
      "Pollen assemblages reflect both climate and human land clearing in the mid-to-late Holocene, and radiocarbon age reversals can occur from old-carbon reservoir effects.",
    accent: "#72B273",
    iconSvg:
      '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 38h32v5H8z" fill="#3B783D"/><path d="M10 29h28v9H10z" fill="#244D26"/><path d="M24 30V14" stroke="#97C798" stroke-width="2"/><path d="M24 22c-6-4-10-2-9 3 4 1 8 0 9-3zM24 17c6-4 10-2 9 3-4 1-8 0-9-3z" fill="#97C798"/></svg>',
    sources: [
      { label: "Uno et al. 2016 (East African waxes)", url: "https://doi.org/10.1073/pnas.1521267113" },
      { label: "Temp12k Proxy Database 2020", url: "https://doi.org/10.1038/s41597-020-0445-3" },
    ],
  },
  {
    id: "corals",
    shortName: "Corals & Reef Terraces",
    name: "Fossil Corals & Uplifted Reef Terraces",
    spanLabel: "0 – 400+ ka",
    minYears: 1,
    maxYears: 400_000,
    resolution: "Monthly – Glacial Highstand",
    measures: "Tropical sea-surface T (Sr/Ca), ENSO swings, Meltwater Pulses",
    howItWorks:
      "Massive reef corals precipitate seasonal aragonite bands whose Sr/Ca ratio acts as an ocean thermometer, while submerged Acropora corals cored off Barbados and Tahiti pinpoint rapid sea-level jumps like Meltwater Pulse 1A (~14.5 ka) because those species only thrive near the sunlit sea surface.",
    limits:
      "Individual coral heads span centuries rather than continuous millennia, and ancient sea-level elevations must be corrected for tectonic uplift or glacial isostatic adjustment.",
    accent: "#62E4E9",
    iconSvg:
      '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 12h36" stroke="#62E4E9" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M24 42V26M24 30l-8-9M24 28l8-10M16 21l-3-6M32 18l3-5" stroke="#FA742A" stroke-width="3" stroke-linecap="round"/><path d="M10 42h28" stroke="#8E99A0" stroke-width="2"/></svg>',
    sources: [
      { label: "Lambeck et al. 2014 (Sea Level)", url: "https://doi.org/10.1073/pnas.1411762111" },
      { label: "Gergis & Fowler 2009 (ENSO)", url: "https://doi.org/10.1007/s10584-008-9476-z" },
    ],
  },
  {
    id: "paleosols-stomata",
    shortName: "Paleosols, Boron & Loess",
    name: "Paleosols, Fossil Stomata, Boron Isotopes & Loess",
    spanLabel: "10 ka – 25+ Ma",
    minYears: 1000,
    maxYears: 25_000_000,
    resolution: "Millennial – Orbital",
    measures: "Pre-ice-core CO₂ (δ¹¹B, stomata), dust winds, soil carbonate δ¹³C",
    howItWorks:
      "Beyond the 800-ka ice-core limit, ocean pH recorded in boron isotopes (δ¹¹B) of fossil shells and microscopic gas-pore density (stomata) on fossil leaves reconstruct Miocene–Pliocene CO₂ (~300–450 ppm). Simultaneously, windblown Chinese Loess and East African fossil soils map dust storms and grass expansion around early hominins.",
    limits:
      "Carry wider analytical and calibration uncertainty (~±30–60 ppm CO₂) than direct ice-core air measurements, requiring multi-proxy convergence.",
    accent: "#D4501E",
    iconSvg:
      '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 36C12 20 20 10 36 8c-2 16-10 26-24 28z" fill="#244D26" stroke="#97C798" stroke-width="1.8"/><ellipse cx="22" cy="22" rx="2.5" ry="1.4" fill="#F2F6F8"/><ellipse cx="26" cy="27" rx="2.5" ry="1.4" fill="#F2F6F8"/><ellipse cx="19" cy="28" rx="2.2" ry="1.2" fill="#F2F6F8"/></svg>',
    sources: [
      { label: "CenCO₂PIP Consortium 2023", url: "https://doi.org/10.1126/science.adi5177" },
      { label: "Peppe et al. 2023 (Early Miocene C4)", url: "https://doi.org/10.1126/science.abq2834" },
    ],
  },
  {
    id: "boreholes-historical",
    shortName: "Boreholes & Historical Logs",
    name: "Rock Boreholes & Historical Documentary Chronicles",
    spanLabel: "0 – 2 ka (1500–1900)",
    minYears: 1,
    maxYears: 2_000,
    resolution: "Daily – Centennial",
    measures: "Long-term ground warming, harvest dates, ship winds, freeze dates",
    howItWorks:
      "Underground rock conducts surface temperature changes slowly downward, letting geothermal borehole profiles verify century-scale cooling and warming independent of biological proxies. Meanwhile, European wine-harvest logs, Asian imperial weather diaries, Nile flood gauges, and colonial ship logbooks supply exact-day weather and ENSO observations.",
    limits:
      "Documentary logs concentrate along literate trade corridors and can conflate meteorological extremes with social reporting bias.",
    accent: "#B4BEC4",
    iconSvg:
      '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="10" y="8" width="20" height="32" rx="2" fill="#182328" stroke="#B4BEC4" stroke-width="1.8"/><path d="M15 15h10M15 21h10M15 27h7" stroke="#97C798" stroke-width="1.6"/><path d="M36 10v28" stroke="#FA742A" stroke-width="3"/><circle cx="36" cy="34" r="4" fill="#FA742A"/></svg>',
    sources: [
      { label: "PAGES 2k Consortium 2019", url: "https://doi.org/10.1038/s41561-019-0400-0" },
      { label: "Gergis & Fowler 2009 (ENSO)", url: "https://doi.org/10.1007/s10584-008-9476-z" },
    ],
  },
];

/** Render a logarithmic time-reach & resolution ladder SVG (1 yr -> 66 Ma). */
export function renderProxyLadderSVG(): string {
  const W = 860;
  const H = 310;
  const L = 195;
  const R = W - 26;
  const span = R - L;
  const logMin = 0; // log10(1 yr)
  const logMax = Math.log10(66_000_000); // 7.8195
  const xOf = (yrs: number) =>
    L + ((Math.log10(Math.max(1, yrs)) - logMin) / (logMax - logMin)) * span;

  const ticks: [number, string][] = [
    [1, "1 yr"],
    [100, "100 yr"],
    [1_000, "1 ka"],
    [10_000, "10 ka"],
    [100_000, "100 ka"],
    [1_000_000, "1 Ma"],
    [10_000_000, "10 Ma"],
    [66_000_000, "66 Ma"],
  ];

  const rowH = 29;
  const topY = 38;
  const rows = proxyArchives
    .map((p, i) => {
      const y = topY + i * rowH;
      const x1 = xOf(p.minYears);
      const x2 = xOf(p.maxYears);
      const barW = Math.max(8, x2 - x1);
      const inside = x2 > W - 210;
      const lblX = (inside ? x2 - 8 : x2 + 8).toFixed(1);
      const lblAnchor = inside ? "end" : "start";
      const lblFill = inside
        ? p.accent === "#D4501E"
          ? "#F2F6F8"
          : "#10171A"
        : "#E3E8EB";
      return `<g class="proxy-ladder-row">
        <text x="${L - 10}" y="${y + 15}" text-anchor="end" fill="#F2F6F8" font-size="11.5" font-weight="600">${esc(p.shortName)}</text>
        <rect x="${L}" y="${y + 5}" width="${span}" height="12" rx="4" fill="#1C272C"/>
        <rect x="${x1.toFixed(1)}" y="${y + 5}" width="${barW.toFixed(1)}" height="12" rx="4" fill="${p.accent}" fill-opacity="0.88"/>
        <text x="${lblX}" y="${y + 15}" text-anchor="${lblAnchor}" fill="${lblFill}" font-size="10" font-weight="600">${esc(p.spanLabel)} · ${esc(p.resolution)}</text>
      </g>`;
    })
    .join("");

  const grid = ticks
    .map(([yr, lbl]) => {
      const x = xOf(yr).toFixed(1);
      return `<line x1="${x}" y1="${topY - 6}" x2="${x}" y2="${topY + proxyArchives.length * rowH}" stroke="#2B3A40" stroke-dasharray="3 3"/><text x="${x}" y="22" text-anchor="middle" fill="#B4BEC4" font-size="10.5">${lbl}</text>`;
    })
    .join("");

  return `<svg class="proxy-ladder-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Logarithmic time reach of eight paleoclimate proxy archives from 1 year to 66 million years ago">
    <rect width="${W}" height="${H}" rx="10" fill="#10171A"/>
    ${grid}
    ${rows}
    <text x="${L}" y="${H - 12}" fill="#97C798" font-size="10.5">Overlap zones let scientists cross-check annual tree rings against ice cores, and ice cores against deep-sea sediment cores.</text>
  </svg>`;
}

export function renderProxyCardsHTML(): string {
  return `<div class="proxy-grid">${proxyArchives
    .map(
      (p) => `<article class="proxy-card" style="--proxy-accent:${p.accent}">
        <div class="proxy-card-head">
          <div class="proxy-icon">${p.iconSvg}</div>
          <div>
            <span class="proxy-span">${esc(p.spanLabel)} · ${esc(p.resolution)}</span>
            <h4>${esc(p.name)}</h4>
          </div>
        </div>
        <p class="proxy-measures"><strong>Measures:</strong> ${esc(p.measures)}</p>
        <p>${esc(p.howItWorks)}</p>
        <p class="proxy-limits"><strong>What can mislead it:</strong> ${esc(p.limits)}</p>
        <div class="proxy-links">${p.sources
          .map(
            (s) =>
              `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`,
          )
          .join("")}</div>
      </article>`,
    )
    .join("")}</div>`;
}
