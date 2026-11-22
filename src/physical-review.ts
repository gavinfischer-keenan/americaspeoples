import { esc } from "./dom";
import { formatYear } from "./time";
import { hazardDetail } from "./physical-data";
import { physicalSources, climateLabels } from "./physical-reference";

export function physicalHTML(id?: string): string {
  const event = hazardDetail(id ?? "");
  if (event) {
    const sources = physicalSources.filter((s) => s.id === event.sourceId);
    return `<article class="physical-detail"><p><a href="#physical">← Changing environment</a> · <a href="#map">← Map</a></p><h2>${esc(event.title)}</h2><p class="lead">${esc(climateLabels[event.kind])} · ${formatYear(event.start)}${event.start !== event.end ? " – " + formatYear(event.end) : ""}</p><p><strong>${esc(event.status)}</strong></p><p>${esc(event.limitations)}</p><p><a href="${esc(event.url)}" target="_blank" rel="noopener noreferrer">Original catalog / dataset ↗</a></p><h3>Original data fields</h3><dl>${Object.entries(
      event.detail,
    )
      .filter(([, v]) => v !== null)
      .map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(String(v))}</dd>`)
      .join("")}</dl>${sources
      .map(
        (s) =>
          `<section id="physical-${s.id}"><h3>${esc(s.title)}</h3><p>${esc(s.authors)}</p><p>${esc(s.method)}</p><p><strong>Limits:</strong> ${esc(s.limits)}</p><p>${esc(s.license)}</p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Publication / source ↗</a> · <a href="${esc(s.data)}" target="_blank" rel="noopener noreferrer">Data / documentation ↗</a></section>`,
      )
      .join("")}</article>`;
  }

  return `<article class="physical-dashboard">
    <header class="physical-hero">
      <div class="physical-hero-top">
        <div>
          <p class="eyebrow">THE CHANGING ENVIRONMENT · 7 MA TO 1900 CE</p>
          <h2>Climate, Sea Level, Ice Sheets &amp; Proxy Science</h2>
          <p class="physical-hero-sub">Compare global temperature, sea level, CO₂, continuous Pleistocene ice sheets, and 8,896 natural hazard records from 7 Ma to 1900 CE.</p>
        </div>
        <nav class="physical-hero-nav" aria-label="Environment page navigation">
          <a href="#map">← Map</a>
          <a href="#world">World overview</a>
          <a href="#library">Library</a>
        </nav>
      </div>
      <div class="physical-kpis">
        <div class="physical-kpi"><span>Timeline Span</span><strong>7 Ma – 1900 CE</strong><small>Miocene savanna transition to post-glacial Common Era</small></div>
        <div class="physical-kpi"><span>Sea-Level Swing</span><strong>−125 m to +25 m</strong><small>Exposes Beringia, Sundaland, Doggerland &amp; Sahul</small></div>
        <div class="physical-kpi"><span>Ice-Core CO₂</span><strong>172 – 296 ppm</strong><small>Antarctic air bubbles across 8 glacial–interglacial cycles</small></div>
        <div class="physical-kpi"><span>Ice Coverage</span><strong>Batchelor + DATED-1 + NADI-1</strong><small>Continuous NH, Eurasian &amp; North American reconstructions</small></div>
        <div class="physical-kpi"><span>Natural Hazards</span><strong>8,896 Events</strong><small>Smithsonian GVP, NOAA Earthquakes/Tsunamis &amp; ENSO</small></div>
      </div>
    </header>
  </article>`;
}
