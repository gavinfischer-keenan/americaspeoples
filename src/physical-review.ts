import { esc } from "./dom";
import { formatYear } from "./time";
import { hazardDetail } from "./physical-data";
import { physicalSources, climateLabels } from "./physical-reference";
export function physicalHTML(id?: string) {
  const event = hazardDetail(id ?? "");
  const sources = event
    ? physicalSources.filter((s) => s.id === event.sourceId)
    : physicalSources;
  return `<article class="review-page"><a href="#map">← Map</a><h2>${event ? esc(event.title) : "Climate, natural hazards & sailing context"}</h2>${
    event
      ? `<p class="lead">${esc(climateLabels[event.kind])} · ${formatYear(event.start)}${event.start !== event.end ? " – " + formatYear(event.end) : ""}</p><p><strong>${esc(event.status)}</strong></p><p>${esc(event.limitations)}</p><p><a href="${esc(event.url)}" target="_blank" rel="noopener">Original catalog / dataset ↗</a></p><h3>Original data fields</h3><dl>${Object.entries(
          event.detail,
        )
          .filter(([, v]) => v !== null)
          .map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(String(v))}</dd>`)
          .join("")}</dl>`
      : "<p>Conditions and hazards are evidence in their own right. A coincidence with a settlement change does not establish a cause. Climate layers retain their own scientific source, time coverage, method and uncertainty. Human consequences require a separate sourced claim.</p><p>Warm/cold current colors describe relative water transport, not a reconstructed climate anomaly. Ice-free land is not open water. Paleocoastlines and navigable-water reconstructions are not yet included.</p><p>Sources do not cover all known events or all periods. Catalog layers are separate from archaeological settlement counts. The atlas ends in1934CE.</p>"
  }${sources.map((s) => `<section id="physical-${s.id}"><h3>${esc(s.title)}</h3><p>${esc(s.authors)}</p><p>${esc(s.method)}</p><p><strong>Limits:</strong> ${esc(s.limits)}</p><p>${esc(s.license)}</p><a href="${s.url}" target="_blank" rel="noopener">Publication / source</a> · <a href="${s.data}" target="_blank" rel="noopener">Data / documentation</a></section>`).join("")}</article>`;
}
