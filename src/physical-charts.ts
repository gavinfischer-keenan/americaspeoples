import { geoEquirectangular, geoGraticule10, geoPath } from "d3-geo";
import { esc } from "./dom";
import type { HazardEvent } from "./physical-data";
import { climateLabels } from "./physical-reference";
import {
  globalIceAtYear,
  type GlobalIceArchive,
  type GlobalIceSlice,
} from "./global-ice";
import type { IceGeometry } from "./ice-geometry";
import { milestoneAtlasLinks } from "./physical-links";
import land from "../data/land.geojson";

export interface MillerPoint {
  ageKa: number;
  year: number;
  seaLevelM: number;
}
export interface LR04Point {
  ageKa: number;
  year: number;
  d18o: number;
  err: number;
}
export interface EpicaTempPoint {
  ageKa: number;
  year: number;
  tempC: number;
}
export interface SprattPoint {
  ageKa: number;
  year: number;
  seaLevelM: number;
  lo: number;
  hi: number;
}
export interface Co2Point {
  ageKa: number;
  year: number;
  ppm: number;
}
export interface Ch4Point {
  ageKa: number;
  year: number;
  ppb: number;
}
export interface NgripPoint {
  ageKa: number;
  year: number;
  d18o: number;
}
export interface Temp12kPoint {
  ageKa: number;
  year: number;
  tempC: number;
  p05: number;
  p95: number;
}
export interface Pages2kPoint {
  year: number;
  tempC: number;
  lo: number;
  hi: number;
}
export interface ClimateMilestone {
  id: string;
  ageKa: number;
  year: number;
  shortLabel: string;
  label: string;
  epoch: "deep" | "ice-ages" | "holocene" | "common-era";
  summary: string;
  humanContext: string;
  caution: string;
  doi: string;
}
export interface LandbridgeThreshold {
  id: string;
  name: string;
  thresholdM: number;
  summary: string;
  doi: string;
}

export interface PaleoclimateSeries {
  generated: string;
  maxYear: number;
  miller2020: MillerPoint[];
  lr04: LR04Point[];
  epicaTemp: EpicaTempPoint[];
  sprattSeaLevel: SprattPoint[];
  bereiterCo2: Co2Point[];
  epicaCh4: Ch4Point[];
  ngripD18o: NgripPoint[];
  temp12k: Temp12kPoint[];
  pages2k: Pages2kPoint[];
  milestones: ClimateMilestone[];
  landbridges: LandbridgeThreshold[];
}

export { milestoneAtlasLinks, type MilestoneAtlasLinks } from "./physical-links";
export type EpochId = "deep" | "ice-ages" | "holocene" | "common-era";

let seriesPromise: Promise<PaleoclimateSeries | null> | undefined;
let cachedSeries: PaleoclimateSeries | null = null;

export function currentPaleoclimateSeries(): PaleoclimateSeries | null {
  return cachedSeries;
}

export function loadPaleoclimateSeries(): Promise<PaleoclimateSeries | null> {
  if (cachedSeries) return Promise.resolve(cachedSeries);
  return (seriesPromise ??= fetch("paleoclimate-series.json")
    .then((r) => (r.ok ? (r.json() as Promise<PaleoclimateSeries>) : null))
    .then((d) => {
      if (d && Array.isArray(d.sprattSeaLevel)) {
        cachedSeries = d;
        return d;
      }
      return null;
    })
    .catch(() => null));
}

function formatAxisAge(ageKa: number): string {
  if (ageKa >= 1000) return `${(ageKa / 1000).toFixed(ageKa % 1000 === 0 ? 0 : 1)} Ma`;
  if (ageKa >= 10) return `${Math.round(ageKa)} ka`;
  if (ageKa >= 0.9) return `${ageKa.toFixed(1)} ka`;
  const yr = Math.round(1950 - ageKa * 1000);
  return yr <= 0 ? `${1 - yr} BCE` : `${yr} CE`;
}

function formatIceYear(ageKa: number): string {
  if (ageKa >= 1000) return `~${(ageKa / 1000).toFixed(2)} million years ago`;
  if (ageKa >= 12) return `~${Math.round(ageKa).toLocaleString()} ka BP (${(1950 - Math.round(ageKa * 1000)).toLocaleString()} yr)`;
  const yr = Math.round(1950 - ageKa * 1000);
  if (yr <= 0) return `~${Math.abs(yr - 1).toLocaleString()} BCE (${ageKa.toFixed(1)} ka BP)`;
  return `${yr} CE`;
}

function nearestByX<T>(items: T[], getX: (d: T) => number, targetX: number): T | null {
  if (!items.length) return null;
  let best = items[0];
  let bestDist = Math.abs(getX(best) - targetX);
  for (let i = 1; i < items.length; i++) {
    const d = Math.abs(getX(items[i]) - targetX);
    if (d < bestDist) {
      bestDist = d;
      best = items[i];
    }
  }
  return best;
}

function buildPolyline(
  pts: { x: number; y: number }[],
): { line: string; area: string; yBase: number } {
  if (!pts.length) return { line: "", area: "", yBase: 0 };
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join("");
  return { line, area: "", yBase: 0 };
}

function buildBandPath(
  topPts: { x: number; y: number }[],
  botPts: { x: number; y: number }[],
): string {
  if (topPts.length < 2 || topPts.length !== botPts.length) return "";
  const fwd = topPts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join("");
  const rev = [...botPts]
    .reverse()
    .map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join("");
  return fwd + rev + "Z";
}

/** 7 Ma -> 1900 CE piecewise-scale global sea level + glacial evolution panoramic banner. */
export function renderOverviewStripSVG(series: PaleoclimateSeries): string {
  const W = 960;
  const H = 205;
  const L = 58;
  const R = W - 20;
  const T = 34;
  const B = H - 36;
  const span = R - L;
  // Split panoramic x-axis into 3 clear eras: [7 Ma..800 ka]=28%, [800 ka..25 ka]=40%, [25 ka..0.05 ka]=32%
  const xBreak1 = L + span * 0.28;
  const xBreak2 = L + span * 0.68;

  const xOfAge = (ageKa: number) => {
    if (ageKa >= 800) {
      const f = Math.max(0, Math.min(1, (7000 - ageKa) / (7000 - 800)));
      return L + f * (xBreak1 - L);
    }
    if (ageKa >= 25) {
      const f = Math.max(0, Math.min(1, (800 - ageKa) / (800 - 25)));
      return xBreak1 + f * (xBreak2 - xBreak1);
    }
    const f = Math.max(0, Math.min(1, (25 - ageKa) / (25 - 0.05)));
    return xBreak2 + f * (R - xBreak2);
  };

  const slMin = -140;
  const slMax = 35;
  const yOfSl = (m: number) =>
    B - ((Math.max(slMin, Math.min(slMax, m)) - slMin) / (slMax - slMin)) * (B - T);

  const combinedSl: { ageKa: number; m: number }[] = [
    ...series.miller2020
      .filter((d) => d.ageKa >= 980)
      .map((d) => ({ ageKa: d.ageKa, m: d.seaLevelM })),
    ...series.sprattSeaLevel
      .filter((d) => d.ageKa < 800)
      .map((d) => ({ ageKa: d.ageKa, m: d.seaLevelM })),
  ].sort((a, b) => b.ageKa - a.ageKa);

  const pts = combinedSl.map((d) => ({ x: xOfAge(d.ageKa), y: yOfSl(d.m) }));
  const yZero = yOfSl(0);
  const pathD = buildPolyline(pts).line;
  const areaD =
    pts.length > 1
      ? `${pathD}L${pts[pts.length - 1].x.toFixed(1)},${B}L${pts[0].x.toFixed(1)},${B}Z`
      : "";

  const ticks: [number, string][] = [
    [7000, "7 Ma"],
    [2700, "2.7 Ma"],
    [800, "800 ka"],
    [400, "400 ka"],
    [125, "125 ka"],
    [25, "25 ka"],
    [12, "12 ka"],
    [5, "5 ka"],
    [0.05, "1900 CE"],
  ];

  const yTicks = [20, 0, -50, -120];
  return `<svg class="paleo-overview-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Continuous global sea-level curve from 7 million years ago to 1900 CE across Miocene, Pleistocene ice ages, and Holocene">
    <defs>
      <linearGradient id="ov-sl-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#6CC5EB" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#6CC5EB" stop-opacity="0.04"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" rx="10" fill="#10171A"/>
    <rect x="${L}" y="${T}" width="${(xBreak1 - L).toFixed(1)}" height="${B - T}" fill="#17242A" opacity="0.55"/>
    <rect x="${xBreak2.toFixed(1)}" y="${T}" width="${(R - xBreak2).toFixed(1)}" height="${B - T}" fill="#182C26" opacity="0.55"/>
    ${yTicks
      .map((m) => {
        const y = yOfSl(m).toFixed(1);
        return `<line x1="${L}" y1="${y}" x2="${R}" y2="${y}" stroke="${m === 0 ? "#8E99A0" : "#26343B"}" stroke-dasharray="${m === 0 ? "4 3" : "2 3"}"/><text x="${L - 8}" y="${Number(y) + 3.5}" text-anchor="end" fill="#CFD6DA" font-size="10">${m > 0 ? "+" : ""}${m} m</text>`;
      })
      .join("")}
    <line x1="${L}" y1="${yOfSl(-50).toFixed(1)}" x2="${R}" y2="${yOfSl(-50).toFixed(1)}" stroke="#569E56" stroke-width="1" stroke-dasharray="5 4" opacity="0.7"/>
    <text x="${R - 4}" y="${yOfSl(-50) - 4}" text-anchor="end" fill="#97C798" font-size="9.5">Beringia / Sunda exposure (~−50 to −60 m)</text>
    <path d="${areaD}" fill="url(#ov-sl-fill)"/>
    <path d="${pathD}" fill="none" stroke="#6CC5EB" stroke-width="1.9" stroke-linejoin="round"/>
    <line x1="${xBreak1.toFixed(1)}" y1="${T}" x2="${xBreak1.toFixed(1)}" y2="${B}" stroke="#525D64" stroke-dasharray="3 3"/>
    <line x1="${xBreak2.toFixed(1)}" y1="${T}" x2="${xBreak2.toFixed(1)}" y2="${B}" stroke="#525D64" stroke-dasharray="3 3"/>
    <text x="${((L + xBreak1) / 2).toFixed(1)}" y="21" text-anchor="middle" fill="#B4BEC4" font-size="10.5" font-weight="600">DEEP TIME · Miller 2020 (7 Ma → 800 ka)</text>
    <text x="${((xBreak1 + xBreak2) / 2).toFixed(1)}" y="21" text-anchor="middle" fill="#FA742A" font-size="10.5" font-weight="600">100-KYR ICE AGES · Spratt 2016 (800 → 25 ka)</text>
    <text x="${((xBreak2 + R) / 2).toFixed(1)}" y="21" text-anchor="middle" fill="#97C798" font-size="10.5" font-weight="600">DEGLACIAL → 1900 CE</text>
    ${ticks
      .map(([age, lbl]) => {
        const x = xOfAge(age).toFixed(1);
        return `<line x1="${x}" y1="${B}" x2="${x}" y2="${B + 5}" stroke="#8E99A0"/><text x="${x}" y="${H - 12}" text-anchor="${age === 7000 ? "start" : age < 0.1 ? "end" : "middle"}" fill="#F2F6F8" font-size="10">${lbl}</text>`;
      })
      .join("")}
    <text x="${L}" y="${yZero - 5}" fill="#F2F6F8" font-size="9.5">Modern sea level (0 m)</text>
  </svg>`;
}

interface PanelSeriesSpec {
  id: string;
  title: string;
  sourceLabel: string;
  doi: string;
  unit: string;
  color: string;
  yMin: number;
  yMax: number;
  invertY?: boolean;
  thresholds?: { val: number; label: string; color: string }[];
  secondary?: {
    unit: string;
    color: string;
    label: string;
    yMin: number;
    yMax: number;
    pts: { x: number; v: number }[];
  };
  pts: { x: number; v: number; lo?: number; hi?: number }[];
}

export function mountPaleoEpochDashboard(
  host: HTMLElement,
  series: PaleoclimateSeries,
  hazardEvents: readonly HazardEvent[],
): void {
  const epochs: { id: EpochId; title: string; span: string; note: string }[] = [
    {
      id: "deep",
      title: "Deep Time",
      span: "7 Ma – 800 ka",
      note: "Pliocene cooling, Arctic glaciation onset (~2.7 Ma), Early Stone Age & Mid-Pleistocene Transition",
    },
    {
      id: "ice-ages",
      title: "Ice Ages",
      span: "800 ka – 20 ka",
      note: "EPICA Dome C Antarctic temperature, Spratt global sea level, CO₂ & CH₄ over 8 glacial cycles",
    },
    {
      id: "holocene",
      title: "Deglaciation & Holocene",
      span: "25 ka – 1900 CE",
      note: "NGRIP Greenland jumps, LGM → Meltwater Pulse 1A → Younger Dryas → Temp12k Holocene & CO₂ rise",
    },
    {
      id: "common-era",
      title: "Last 2,000 Years",
      span: "1 CE – 1900 CE",
      note: "PAGES 2k global temperature (536 CE cooling, Medieval anomaly, Little Ice Age, Tambora) + volcanoes/ENSO",
    },
  ];

  let activeEpoch: EpochId = "ice-ages";
  let selectedMilestoneId = "";

  const W = 920;
  const L = 66;
  const R = W - 26;
  const panelH = 162;

  function render(): void {
    const ep = epochs.find((e) => e.id === activeEpoch)!;
    let xMin = 0;
    let xMax = 1;
    let xTicks: { x: number; label: string }[] = [];
    let reverseX = false; // older on left: true when using ageKa (xMin=maxKa -> xMax=minKa), false when using CE years
    let panels: PanelSeriesSpec[] = [];

    if (activeEpoch === "deep") {
      xMin = 800;
      xMax = 7000;
      reverseX = true;
      xTicks = [7000, 6000, 5000, 4000, 3000, 2000, 1000].map((k) => ({
        x: k,
        label: `${(k / 1000).toFixed(0)} Ma`,
      }));
      panels = [
        {
          id: "miller-sl",
          title: "Global Mean Sea Level (Cenozoic Spline)",
          sourceLabel: "Miller et al. (2020)",
          doi: "https://doi.org/10.1126/sciadv.aaz1346",
          unit: "m",
          color: "#6CC5EB",
          yMin: -135,
          yMax: 45,
          thresholds: [
            { val: 0, label: "Modern sea level (0 m)", color: "#8E99A0" },
            { val: -50, label: "−50 m shelf exposure", color: "#569E56" },
          ],
          pts: series.miller2020
            .filter((d) => d.ageKa >= 800 && d.ageKa <= 7000)
            .map((d) => ({ x: d.ageKa, v: d.seaLevelM })),
        },
        {
          id: "lr04-d18o",
          title: "Benthic Foraminifera δ¹⁸O Stack (Inverted: Warmer / Less Ice ↑)",
          sourceLabel: "Lisiecki & Raymo (2005) LR04",
          doi: "https://doi.org/10.1029/2004PA001071",
          unit: "‰",
          color: "#FA742A",
          yMin: 2.5,
          yMax: 5.2,
          invertY: true,
          pts: series.lr04
            .filter((d) => d.ageKa >= 800 && d.ageKa <= 5320)
            .map((d) => ({
              x: d.ageKa,
              v: d.d18o,
              lo: d.d18o - d.err,
              hi: d.d18o + d.err,
            })),
        },
      ];
    } else if (activeEpoch === "ice-ages") {
      xMin = 20;
      xMax = 800;
      reverseX = true;
      xTicks = [800, 700, 600, 500, 400, 300, 200, 125, 65, 20].map((k) => ({
        x: k,
        label: `${k} ka`,
      }));
      panels = [
        {
          id: "epica-temp",
          title: "Antarctic Surface Air ΔT (EPICA Dome C, vs. Last Millennium)",
          sourceLabel: "Jouzel et al. (2007)",
          doi: "https://doi.org/10.1126/science.1141038",
          unit: "°C",
          color: "#FA742A",
          yMin: -11,
          yMax: 6,
          thresholds: [{ val: 0, label: "Pre-industrial baseline (0 °C)", color: "#8E99A0" }],
          pts: series.epicaTemp
            .filter((d) => d.ageKa >= 20 && d.ageKa <= 800)
            .map((d) => ({ x: d.ageKa, v: d.tempC })),
        },
        {
          id: "spratt-sl",
          title: "Global Mean Sea Level Reconstruction (±95% envelope)",
          sourceLabel: "Spratt & Lisiecki (2016)",
          doi: "https://doi.org/10.5194/cp-12-1079-2016",
          unit: "m",
          color: "#6CC5EB",
          yMin: -140,
          yMax: 25,
          thresholds: [
            { val: 0, label: "0 m", color: "#8E99A0" },
            { val: -50, label: "Beringia / Sunda (−50 to −60 m)", color: "#569E56" },
            { val: -12, label: "Torres Strait (−12 m)", color: "#D4501E" },
          ],
          pts: series.sprattSeaLevel
            .filter((d) => d.ageKa >= 20 && d.ageKa <= 800)
            .map((d) => ({ x: d.ageKa, v: d.seaLevelM, lo: d.lo, hi: d.hi })),
        },
        {
          id: "ice-co2",
          title: "Trapped Ice-Core CO₂ (ppm) & Methane CH₄ (ppb)",
          sourceLabel: "Bereiter 2015 / Loulergue 2008",
          doi: "https://doi.org/10.1002/2014GL061957",
          unit: "ppm CO₂",
          color: "#97C798",
          yMin: 165,
          yMax: 315,
          pts: series.bereiterCo2
            .filter((d) => d.ageKa >= 20 && d.ageKa <= 800)
            .map((d) => ({ x: d.ageKa, v: d.ppm })),
          secondary: {
            unit: "ppb CH₄",
            color: "#D49CE8",
            label: "CH₄ (ppb)",
            yMin: 300,
            yMax: 850,
            pts: series.epicaCh4
              .filter((d) => d.ageKa >= 20 && d.ageKa <= 800)
              .map((d) => ({ x: d.ageKa, v: d.ppb })),
          },
        },
      ];
    } else if (activeEpoch === "holocene") {
      xMin = 0.05;
      xMax = 25;
      reverseX = true;
      xTicks = [
        [25, "25 ka"],
        [21, "21 ka LGM"],
        [15, "15 ka"],
        [12, "12 ka"],
        [8, "8 ka"],
        [4, "4 ka"],
        [2, "2 ka"],
        [0.05, "1900 CE"],
      ].map(([x, label]) => ({ x: Number(x), label: String(label) }));
      panels = [
        {
          id: "holo-temp",
          title: "Global Holocene Temperature (12 ka–1900 CE) + Greenland NGRIP δ¹⁸O (25–0.05 ka)",
          sourceLabel: "Temp12k (Kaufman 2020) & NGRIP (2004)",
          doi: "https://doi.org/10.1038/s41597-020-0530-7",
          unit: "°C (Temp12k)",
          color: "#FA742A",
          yMin: -1.4,
          yMax: 1.4,
          thresholds: [{ val: 0, label: "1800–1900 baseline (0 °C)", color: "#8E99A0" }],
          pts: series.temp12k.map((d) => ({
            x: d.ageKa,
            v: d.tempC,
            lo: d.p05,
            hi: d.p95,
          })),
          secondary: {
            unit: "‰ NGRIP δ¹⁸O",
            color: "#62E4E9",
            label: "NGRIP δ¹⁸O (‰)",
            yMin: -44,
            yMax: -32,
            pts: series.ngripD18o
              .filter((d) => d.ageKa >= 0.05 && d.ageKa <= 25)
              .map((d) => ({ x: d.ageKa, v: d.d18o })),
          },
        },
        {
          id: "deglacial-sl",
          title: "Post-Glacial Sea Level Rise & Shelf Submergence (±95%)",
          sourceLabel: "Spratt & Lisiecki (2016)",
          doi: "https://doi.org/10.5194/cp-12-1079-2016",
          unit: "m",
          color: "#6CC5EB",
          yMin: -135,
          yMax: 20,
          thresholds: [
            { val: -50, label: "Beringia floods (~−50 m)", color: "#569E56" },
            { val: -40, label: "Doggerland (~−40 m)", color: "#72B273" },
            { val: -12, label: "Torres Strait (~−12 m)", color: "#FA742A" },
          ],
          pts: series.sprattSeaLevel
            .filter((d) => d.ageKa >= 0.05 && d.ageKa <= 25)
            .map((d) => ({ x: d.ageKa, v: d.seaLevelM, lo: d.lo, hi: d.hi })),
        },
        {
          id: "deglacial-co2",
          title: "Atmospheric CO₂ Transition (185 ppm LGM → 295 ppm in 1900 CE)",
          sourceLabel: "Bereiter et al. (2015)",
          doi: "https://doi.org/10.1002/2014GL061957",
          unit: "ppm",
          color: "#97C798",
          yMin: 175,
          yMax: 305,
          pts: series.bereiterCo2
            .filter((d) => d.ageKa >= 0.05 && d.ageKa <= 25)
            .map((d) => ({ x: d.ageKa, v: d.ppm })),
        },
      ];
    } else {
      xMin = 1;
      xMax = 1900;
      reverseX = false;
      xTicks = [1, 250, 500, 750, 1000, 1250, 1500, 1750, 1900].map((yr) => ({
        x: yr,
        label: `${yr} CE`,
      }));
      // Build century-binned volcanic & ENSO counts from bundled 8,896 hazard catalog!
      const ceBins: { x: number; v: number }[] = [];
      for (let c = 50; c <= 1850; c += 100) {
        const count = hazardEvents.filter(
          (e) =>
            (e.kind === "volcano" || e.kind === "el-nino" || e.kind === "la-nina") &&
            e.start >= c - 50 &&
            e.start < c + 50,
        ).length;
        ceBins.push({ x: c, v: count });
      }
      panels = [
        {
          id: "pages2k-temp",
          title: "Global Mean Surface Temperature Anomaly (1–1900 CE, 95% ensemble range)",
          sourceLabel: "PAGES 2k Consortium (2019)",
          doi: "https://doi.org/10.1038/s41561-019-0400-0",
          unit: "°C",
          color: "#FA742A",
          yMin: -1.1,
          yMax: 0.45,
          thresholds: [
            { val: 0, label: "1961–1990 reference (0 °C)", color: "#8E99A0" },
          ],
          pts: series.pages2k.map((d) => ({
            x: d.year,
            v: d.tempC,
            lo: d.lo,
            hi: d.hi,
          })),
        },
        {
          id: "ce-hazards",
          title: "Cataloged Volcanic Eruptions + ENSO Records per Century (Atlas Hazard Extract)",
          sourceLabel: "Smithsonian GVP & Gergis/Fowler (2009)",
          doi: "https://doi.org/10.5479/si.GVP.VOTW5-2026.5.4",
          unit: "events/century",
          color: "#6CC5EB",
          yMin: 0,
          yMax: Math.max(50, ...ceBins.map((b) => b.v)) * 1.12,
          pts: ceBins,
        },
      ];
    }

    const toScreenX = (xVal: number) => {
      const f = reverseX ? (xMax - xVal) / (xMax - xMin) : (xVal - xMin) / (xMax - xMin);
      return L + Math.max(0, Math.min(1, f)) * (R - L);
    };
    const fromScreenX = (sx: number) => {
      const f = Math.max(0, Math.min(1, (sx - L) / (R - L)));
      return reverseX ? xMax - f * (xMax - xMin) : xMin + f * (xMax - xMin);
    };

    const epMilestones = series.milestones.filter((m) => m.epoch === activeEpoch);
    if (!epMilestones.some((m) => m.id === selectedMilestoneId)) {
      selectedMilestoneId = epMilestones[0]?.id ?? "";
    }
    const selMs = epMilestones.find((m) => m.id === selectedMilestoneId);
    const selLinks = selMs ? milestoneAtlasLinks(selMs.id) : undefined;
    const msActionsHTML = selLinks
      ? `<div class="paleo-ms-actions"><a class="paleo-ms-explore" href="${esc(selLinks.exploreHref)}">View human sites in ${esc(selLinks.exploreLabel)} on Explore ↗</a>${selLinks.related.map((r) => `<a class="paleo-ms-link" href="${esc(r.href)}">${esc(r.label)} ↗</a>`).join("")}</div>`
      : "";

    const panelsHTML = panels
      .map((p, idx) => {
        const yTop = 26;
        const yBot = panelH - 22;
        const toY = (v: number) => {
          const norm = (v - p.yMin) / (p.yMax - p.yMin || 1);
          const f = p.invertY ? 1 - norm : norm;
          return yBot - Math.max(-0.05, Math.min(1.05, f)) * (yBot - yTop);
        };
        const sortedPts = [...p.pts].sort((a, b) => toScreenX(a.x) - toScreenX(b.x));
        const sPts = sortedPts.map((pt) => ({ x: toScreenX(pt.x), y: toY(pt.v) }));
        const lineD = buildPolyline(sPts).line;
        const hasBand = sortedPts.length > 1 && sortedPts.every((d) => d.lo !== undefined && d.hi !== undefined);
        const bandD = hasBand
          ? buildBandPath(
              sortedPts.map((d) => ({ x: toScreenX(d.x), y: toY(d.hi!) })),
              sortedPts.map((d) => ({ x: toScreenX(d.x), y: toY(d.lo!) })),
            )
          : "";

        let secPathD = "";
        if (p.secondary?.pts.length) {
          const sSorted = [...p.secondary.pts].sort((a, b) => toScreenX(a.x) - toScreenX(b.x));
          const secToY = (v: number) =>
            yBot - ((v - p.secondary!.yMin) / (p.secondary!.yMax - p.secondary!.yMin || 1)) * (yBot - yTop);
          secPathD = buildPolyline(sSorted.map((d) => ({ x: toScreenX(d.x), y: secToY(d.v) }))).line;
        }

        const yGridVals = [
          p.yMin,
          p.yMin + (p.yMax - p.yMin) * 0.5,
          p.yMax,
        ];

        const milestonePins =
          idx === 0
            ? epMilestones
                .map((m) => {
                  const mx = toScreenX(activeEpoch === "common-era" ? m.year : m.ageKa);
                  const active = m.id === selectedMilestoneId;
                  return `<g class="chart-milestone ${active ? "is-selected" : ""}" data-milestone="${m.id}" tabindex="0" role="button" aria-label="${esc(m.label)}">
                    <line x1="${mx.toFixed(1)}" y1="${yTop}" x2="${mx.toFixed(1)}" y2="${yBot}" stroke="${active ? "#FA742A" : "#8E99A0"}" stroke-width="${active ? 1.8 : 1}" stroke-dasharray="3 3" opacity="${active ? 0.95 : 0.55}"/>
                    <circle cx="${mx.toFixed(1)}" cy="${yTop}" r="${active ? 6 : 4.5}" fill="${active ? "#FA742A" : "#97C798"}" stroke="#10171A" stroke-width="1.5"/>
                  </g>`;
                })
                .join("")
            : epMilestones
                .map((m) => {
                  const mx = toScreenX(activeEpoch === "common-era" ? m.year : m.ageKa);
                  return `<line x1="${mx.toFixed(1)}" y1="${yTop}" x2="${mx.toFixed(1)}" y2="${yBot}" stroke="#8E99A0" stroke-dasharray="3 3" opacity="0.3"/>`;
                })
                .join("");

        return `<div class="paleo-panel">
          <div class="paleo-panel-head">
            <h4>${esc(p.title)}</h4>
            <div class="paleo-panel-meta">
              <span class="paleo-legend-chip" style="--chip:${p.color}">${esc(p.unit)}</span>
              ${p.secondary ? `<span class="paleo-legend-chip" style="--chip:${p.secondary.color}">${esc(p.secondary.label)}</span>` : ""}
              <a href="${esc(p.doi)}" target="_blank" rel="noopener noreferrer">${esc(p.sourceLabel)} ↗</a>
            </div>
          </div>
          <svg class="paleo-chart-svg" data-panel="${p.id}" viewBox="0 0 ${W} ${panelH}" role="img" aria-label="${esc(p.title)}">
            <rect width="${W}" height="${panelH}" rx="8" fill="#10171A"/>
            ${yGridVals
              .map((v) => {
                const y = toY(v).toFixed(1);
                const lbl = Math.abs(v) >= 100 ? v.toFixed(0) : Number(v.toFixed(1)).toString();
                return `<line x1="${L}" y1="${y}" x2="${R}" y2="${y}" stroke="#243138"/><text x="${L - 7}" y="${Number(y) + 3.5}" text-anchor="end" fill="#CFD6DA" font-size="10">${lbl}</text>`;
              })
              .join("")}
            ${(p.thresholds ?? [])
              .map((th) => {
                const ty = toY(th.val).toFixed(1);
                return `<line x1="${L}" y1="${ty}" x2="${R}" y2="${ty}" stroke="${th.color}" stroke-dasharray="4 3" opacity="0.75"/><text x="${L + 6}" y="${Number(ty) - 4}" fill="${th.color}" font-size="9.5">${esc(th.label)}</text>`;
              })
              .join("")}
            ${xTicks
              .map((tk) => {
                const tx = toScreenX(tk.x).toFixed(1);
                return `<line x1="${tx}" y1="${yTop}" x2="${tx}" y2="${yBot}" stroke="#1E2B31"/><text x="${tx}" y="${panelH - 6}" text-anchor="${tk.x === xTicks[0].x ? "start" : tk.x === xTicks[xTicks.length - 1].x ? "end" : "middle"}" fill="#B4BEC4" font-size="9.5">${esc(tk.label)}</text>`;
              })
              .join("")}
            ${bandD ? `<path d="${bandD}" fill="${p.color}" opacity="0.22"/>` : ""}
            <path d="${lineD}" fill="none" stroke="${p.color}" stroke-width="2" stroke-linejoin="round"/>
            ${secPathD ? `<path d="${secPathD}" fill="none" stroke="${p.secondary!.color}" stroke-width="1.5" opacity="0.88"/>` : ""}
            ${milestonePins}
            <line class="paleo-crosshair" x1="${L}" y1="${yTop}" x2="${L}" y2="${yBot}" stroke="#F2F6F8" stroke-width="1.2" stroke-dasharray="2 2" opacity="0"/>
          </svg>
        </div>`;
      })
      .join("");

    const milestoneChips = epMilestones
      .map(
        (m) =>
          `<button type="button" class="paleo-ms-chip ${m.id === selectedMilestoneId ? "is-active" : ""}" data-milestone="${m.id}">${esc(m.shortLabel)}</button>`,
      )
      .join("");

    host.innerHTML = `<div class="paleo-tabs" role="tablist" aria-label="Paleoclimate timescales">${epochs
      .map(
        (e) =>
          `<button type="button" role="tab" aria-selected="${e.id === activeEpoch}" class="paleo-tab ${e.id === activeEpoch ? "is-active" : ""}" data-epoch="${e.id}"><strong>${esc(e.title)}</strong><span>${esc(e.span)}</span></button>`,
      )
      .join("")}</div>
      <div class="paleo-toolbar">
        <p class="paleo-epoch-note">${esc(ep.note)}</p>
        <div class="paleo-crosshair-readout" id="paleo-readout" aria-live="polite">Move across any graph to inspect dated proxy values across all variables at once.</div>
      </div>
      <div class="paleo-panels">${panelsHTML}</div>
      <div class="paleo-milestones">
        <div class="paleo-ms-bar"><span>Key Turning Points:</span>${milestoneChips}</div>
        ${selMs ? `<div class="paleo-ms-card"><strong>${esc(selMs.label)}</strong><p>${esc(selMs.summary)}</p><p><em>Human context:</em> ${esc(selMs.humanContext)}</p><p class="paleo-ms-caution"><strong>Limits:</strong> ${esc(selMs.caution)} · <a href="${esc(selMs.doi)}" target="_blank" rel="noopener noreferrer">Source DOI ↗</a></p>${msActionsHTML}</div>` : ""}
      </div>`;

    host.querySelectorAll<HTMLButtonElement>("[data-epoch]").forEach((btn) =>
      btn.addEventListener("click", () => {
        activeEpoch = btn.dataset.epoch as EpochId;
        render();
      }),
    );

    host.querySelectorAll<HTMLElement>("[data-milestone]").forEach((btn) =>
      btn.addEventListener("click", () => {
        selectedMilestoneId = btn.dataset.milestone!;
        render();
      }),
    );

    const readout = host.querySelector<HTMLElement>("#paleo-readout")!;
    const svgs = [...host.querySelectorAll<SVGSVGElement>("svg.paleo-chart-svg")];
    const crosshairs = svgs.map((s) => s.querySelector<SVGLineElement>(".paleo-crosshair")!);

    function updateHover(clientX: number, targetSvg: SVGSVGElement): void {
      const rect = targetSvg.getBoundingClientRect();
      if (!rect.width) return;
      const svgX = ((clientX - rect.left) / rect.width) * W;
      const clampedSvgX = Math.max(L, Math.min(R, svgX));
      const xVal = fromScreenX(clampedSvgX);
      for (const ch of crosshairs) {
        ch.setAttribute("x1", clampedSvgX.toFixed(1));
        ch.setAttribute("x2", clampedSvgX.toFixed(1));
        ch.setAttribute("opacity", "0.85");
      }
      const dateStr =
        activeEpoch === "common-era"
          ? `${Math.round(xVal)} CE`
          : formatAxisAge(xVal);
      const vals = panels
        .map((p) => {
          const near = nearestByX(p.pts, (d) => d.x, xVal);
          const near2 = p.secondary ? nearestByX(p.secondary.pts, (d) => d.x, xVal) : null;
          if (!near) return "";
          const base = `${p.unit}: ${near.v > 0 && p.unit === "°C" ? "+" : ""}${near.v}`;
          const sec = near2 ? ` · ${p.secondary!.label}: ${near2.v}` : "";
          return `<span>${esc(base + sec)}</span>`;
        })
        .filter(Boolean)
        .join("");
      readout.innerHTML = `<strong>${esc(dateStr)}</strong> ${vals}`;
    }

    for (const svg of svgs) {
      svg.addEventListener("pointermove", (e) => updateHover(e.clientX, svg));
      svg.addEventListener("click", (e) => updateHover(e.clientX, svg));
      svg.addEventListener("pointerleave", () => {
        for (const ch of crosshairs) ch.setAttribute("opacity", "0");
      });
    }
  }

  render();
}

/** Interactive continuous Quaternary -> 1900 CE Ice-Sheet & Landbridge Explorer */
export function mountIceExplorer(
  host: HTMLElement,
  archive: GlobalIceArchive | null,
  landbridges: LandbridgeThreshold[],
): void {
  if (!archive?.slices.length) {
    host.innerHTML = `<p class="fine">Continuous ice-sheet geometries are unavailable right now.</p>`;
    return;
  }

  // Chronological oldest -> youngest stops for scrubber
  const stops: GlobalIceSlice[] = [...archive.slices].sort((a, b) => b.ageKa - a.ageKa);
  let activeIndex = Math.max(
    0,
    stops.findIndex((s) => Math.abs(s.ageKa - 21) < 0.1),
  );
  let timer: ReturnType<typeof setInterval> | undefined;

  const presets = [
    "batchelor-late-gauss",
    "batchelor-mis12",
    "batchelor-mis6",
    "batchelor-mis4",
    "deglacial-21ka",
    "deglacial-15ka",
    "deglacial-12ka",
    "holocene-8ka",
    "holocene-1ka",
  ]
    .map((id) => stops.findIndex((s) => s.id === id))
    .filter((i) => i >= 0);

  const W = 820;
  const H = 220;
  const proj = geoEquirectangular()
    .rotate([0, 0])
    .fitExtent(
      [
        [10, 12],
        [W - 10, H - 28],
      ],
      {
        type: "MultiPoint",
        coordinates: [
          [-172, 18],
          [-85, 84],
          [0, 52],
          [90, 84],
          [178, 18],
        ],
      },
    );
  const pathGen = geoPath(proj);
  const landD = pathGen(land as any) ?? "";
  const gratD = pathGen(geoGraticule10()) ?? "";

  host.innerHTML = `<div class="ice-explorer">
    <div class="ice-explorer-head">
      <div>
        <strong id="ice-exp-title"></strong>
        <span id="ice-exp-meta"></span>
      </div>
      <div class="ice-exp-actions">
        <button type="button" id="ice-exp-play">▶ Animate Ice Cycles</button>
        <input type="range" id="ice-exp-slider" min="0" max="${stops.length - 1}" value="${activeIndex}" aria-label="Select Quaternary ice-sheet slice">
      </div>
    </div>
    <div class="ice-exp-presets">${presets
      .map(
        (i) =>
          `<button type="button" data-ice-idx="${i}">${esc(stops[i].ageKa >= 1000 ? (stops[i].ageKa / 1000).toFixed(1) + " Ma" : stops[i].ageKa <= 1 ? "1900 CE" : stops[i].ageKa + " ka")}</button>`,
      )
      .join("")}</div>
    <div class="ice-exp-body">
      <svg class="ice-exp-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Reconstructed Northern Hemisphere and Eurasian ice sheets">
        <rect width="${W}" height="${H}" rx="10" fill="#10171A"/>
        <path d="${gratD}" fill="none" stroke="#223037" stroke-width="0.6"/>
        <path d="${landD}" fill="#2B3940" stroke="#4D5F68" stroke-width="0.6"/>
        <path id="ice-exp-geom" d="" fill="#C9EAFA" fill-opacity="0.72" stroke="#F2F6F8" stroke-width="1"/>
        <text x="16" y="${H - 12}" fill="#B4BEC4" font-size="10">Batchelor et al. (2019, CC BY 4.0) · DATED-1 (2016, CC BY 3.0) · NADI-1 (2023, CC BY 4.0)</text>
      </svg>
      <div class="ice-exp-sidebar">
        <p id="ice-exp-note"></p>
        <h4>Landbridge Status at ~<span id="ice-exp-sl"></span> Sea Level</h4>
        <div id="ice-exp-bridges" class="ice-bridges"></div>
      </div>
    </div>
  </div>`;

  const titleEl = host.querySelector<HTMLElement>("#ice-exp-title")!;
  const metaEl = host.querySelector<HTMLElement>("#ice-exp-meta")!;
  const geomEl = host.querySelector<SVGPathElement>("#ice-exp-geom")!;
  const noteEl = host.querySelector<HTMLElement>("#ice-exp-note")!;
  const slEl = host.querySelector<HTMLElement>("#ice-exp-sl")!;
  const bridgesEl = host.querySelector<HTMLElement>("#ice-exp-bridges")!;
  const sliderEl = host.querySelector<HTMLInputElement>("#ice-exp-slider")!;
  const playEl = host.querySelector<HTMLButtonElement>("#ice-exp-play")!;

  function renderSlice(index: number): void {
    activeIndex = Math.max(0, Math.min(stops.length - 1, index));
    const slice = stops[activeIndex];
    const year = Math.round(1950 - slice.ageKa * 1000);
    const frame = globalIceAtYear(archive, Math.min(1900, year), "global");
    const g: IceGeometry = frame?.geometry ?? slice.geometry;
    geomEl.setAttribute("d", pathGen(g as any) ?? "");
    titleEl.textContent = slice.label;
    metaEl.textContent = `${formatIceYear(slice.ageKa)} · ${slice.region}`;
    noteEl.textContent = slice.note;
    slEl.textContent = `${slice.seaLevelM > 0 ? "+" : ""}${slice.seaLevelM} m`;
    sliderEl.value = String(activeIndex);
    bridgesEl.innerHTML = landbridges
      .map((lb) => {
        const exposed = slice.seaLevelM <= lb.thresholdM;
        return `<div class="ice-bridge-row ${exposed ? "is-exposed" : "is-submerged"}">
          <span class="ice-bridge-badge">${exposed ? "EXPOSED" : "FLOODED"}</span>
          <div><strong>${esc(lb.name)}</strong><small>Threshold ~${lb.thresholdM} m</small></div>
        </div>`;
      })
      .join("");
    host.querySelectorAll<HTMLButtonElement>("[data-ice-idx]").forEach((b) =>
      b.classList.toggle("is-active", Number(b.dataset.iceIdx) === activeIndex),
    );
  }

  function stopAnim(): void {
    if (timer) clearInterval(timer);
    timer = undefined;
    playEl.textContent = "▶ Animate Ice Cycles";
  }

  playEl.addEventListener("click", () => {
    if (timer) {
      stopAnim();
      return;
    }
    playEl.textContent = "Ⅱ Pause";
    timer = setInterval(() => {
      if (!host.isConnected) {
        stopAnim();
        return;
      }
      renderSlice((activeIndex + 1) % stops.length);
    }, 850);
  });

  sliderEl.addEventListener("input", () => {
    stopAnim();
    renderSlice(Number(sliderEl.value));
  });

  host.querySelectorAll<HTMLButtonElement>("[data-ice-idx]").forEach((btn) =>
    btn.addEventListener("click", () => {
      stopAnim();
      renderSlice(Number(btn.dataset.iceIdx));
    }),
  );

  renderSlice(activeIndex);
}

/** Visual bar chart breakdown of the bundled natural-hazard / ENSO catalogs. */
export function renderHazardSummaryHTML(
  events: readonly HazardEvent[],
): string {
  const kinds: { id: string; color: string }[] = [
    { id: "volcano", color: "#FA742A" },
    { id: "earthquake", color: "#B49AE8" },
    { id: "tsunami", color: "#6CC5EB" },
    { id: "la-nina", color: "#97C798" },
    { id: "el-nino", color: "#F2C572" },
  ];
  const counts = kinds.map((k) => ({
    ...k,
    label: climateLabels[k.id] ?? k.id,
    count: events.filter((e) => e.kind === k.id).length,
  }));
  const maxC = Math.max(1, ...counts.map((c) => c.count));
  const total = events.length;

  return `<div class="hazard-visual-grid">
    ${counts
      .map(
        (c) => `<button type="button" class="hazard-bar-card" data-filter-kind="${c.id}">
          <div class="hazard-bar-top">
            <strong>${esc(c.label)}</strong>
            <span>${c.count.toLocaleString()}</span>
          </div>
          <div class="hazard-bar-track"><span style="width:${((c.count / maxC) * 100).toFixed(1)}%;background:${c.color}"></span></div>
          <small>${total ? ((c.count / total) * 100).toFixed(1) : "0"}% of catalog · Filter ↓</small>
        </button>`,
      )
      .join("")}
  </div>`;
}
