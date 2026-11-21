import { $, esc } from "./dom";
import { formatYear } from "./time";
import {
  physicalHTML,
  physicalSources,
  physicalState,
  hazardEvents,
  openHazardDate,
  climateLabels,
  climateKinds,
} from "./physical";
import { loadGlobalIce } from "./global-ice";
import {
  loadPaleoclimateSeries,
  renderOverviewStripSVG,
  mountPaleoEpochDashboard,
  mountIceExplorer,
  renderHazardSummaryHTML,
} from "./physical-charts";
import { renderProxyLadderSVG, renderProxyCardsHTML } from "./physical-proxies";
import "./physical-page.css";

export function mountPhysicalPage(main: HTMLElement, id?: string): void {
  main.innerHTML = physicalHTML(id);
  if (id) return;

  const root = main.querySelector<HTMLElement>(".physical-dashboard");
  if (!root) return;

  root.insertAdjacentHTML(
    "beforeend",
    `<section class="physical-band" id="paleo-series-band">
      <div class="physical-band-head">
        <div>
          <h3>Global Climate, Sea Level &amp; Greenhouse Gases (7 Ma – 1900 CE)</h3>
          <p>Panoramic spline followed by interactive synchronized multi-variable panels. Switch timescales below or scrub across any curve.</p>
        </div>
      </div>
      <div id="paleo-overview-host" class="paleo-overview-wrap"><p class="fine">Loading peer-reviewed paleoclimate series…</p></div>
      <div id="paleo-dashboard-host"></div>
    </section>
    <section class="physical-band" id="paleo-ice-band">
      <div class="physical-band-head">
        <div>
          <h3>Continuous Quaternary &amp; Deglacial Ice Coverage (~3 Ma – 1900 CE)</h3>
          <p>Scrub across Northern Hemisphere &amp; Eurasian ice reconstructions alongside sea-level thresholds opening overland corridors.</p>
        </div>
      </div>
      <div id="ice-explorer-host"><p class="fine">Loading CC-BY ice-sheet slices…</p></div>
    </section>
    <section class="physical-band" id="paleo-proxies-band">
      <div class="physical-band-head">
        <div>
          <h3>How We Know Ancient Climate — Proxy Archives &amp; Their Sources</h3>
          <p>Scientists calibrate overlapping physical, chemical, and biological archives—linking documentary logs and tree rings to ice bubbles and deep-ocean sediment cores.</p>
        </div>
      </div>
      <div class="proxy-ladder-wrap">${renderProxyLadderSVG()}</div>
      ${renderProxyCardsHTML()}
    </section>`,
  );

  void loadPaleoclimateSeries().then((series) => {
    if (!root.isConnected) return;
    const ovHost = root.querySelector<HTMLElement>("#paleo-overview-host");
    const dashHost = root.querySelector<HTMLElement>("#paleo-dashboard-host");
    if (!series) {
      if (ovHost)
        ovHost.innerHTML = `<p class="fine">Paleoclimate series extract could not load in this environment.</p>`;
      return;
    }
    if (ovHost) ovHost.innerHTML = renderOverviewStripSVG(series);
    if (dashHost) mountPaleoEpochDashboard(dashHost, series, hazardEvents);
    void loadGlobalIce().then((ice) => {
      if (!root.isConnected) return;
      const iceHost = root.querySelector<HTMLElement>("#ice-explorer-host");
      if (iceHost) mountIceExplorer(iceHost, ice, series.landbridges);
    });
  });

  if (physicalState !== "ready") {
    root.insertAdjacentHTML(
      "beforeend",
      `<section class="physical-band"><div class="physical-browser-card"><h3>Catalog loading status</h3><p role="status">${physicalState === "error" ? "Climate catalog could not load. Evidence records remain available." : "Climate catalog loading; event absence cannot yet be assessed."}</p>${physicalState === "error" ? "<button data-retry-physical>Retry climate catalog</button>" : ""}</div></section>`,
    );
  } else {
    root.insertAdjacentHTML(
      "beforeend",
      `<section class="physical-band" id="hazard-catalog-band">
        <div class="physical-band-head">
          <div>
            <h3>Cataloged Natural Hazards &amp; ENSO Reconstructions</h3>
            <p>${hazardEvents.length.toLocaleString()} source-linked entries (separate from archaeological evidence counts). Open-ended eruption constraints remain browsable without invented years.</p>
          </div>
          <a href="hazard-events.json" download>Download structured catalog extract ↗</a>
        </div>
        ${renderHazardSummaryHTML(hazardEvents)}
        <div class="physical-browser-card">
          <div class="hazard-filters">
            <label>Search event / volcano / year<input id="hazard-search" type="search" aria-label="Search natural hazards" placeholder="Tambora, Krakatau, 1877…"></label>
            <label>Kind<select id="hazard-kind" aria-label="Natural hazard kind"><option value="">All</option>${climateKinds
              .filter((k) =>
                ["el-nino", "la-nina", "volcano", "earthquake", "tsunami"].includes(k),
              )
              .map((k) => `<option value="${k}">${climateLabels[k]}</option>`)
              .join("")}</select></label>
          </div>
          <p id="hazard-results-count"></p>
          <div id="hazard-results"></div>
          <button id="hazard-more" type="button">Show more</button>
        </div>
      </section>`,
    );

    let limit = 60;
    const render = () => {
      const q = $<HTMLInputElement>("#hazard-search").value.toLowerCase();
      const kind = $<HTMLSelectElement>("#hazard-kind").value;
      const matches = hazardEvents.filter(
        (e) =>
          (!kind || e.kind === kind) &&
          `${e.title} ${e.start} ${e.status} ${e.detail.StartDateYear ?? ""}`
            .toLowerCase()
            .includes(q),
      );
      $("#hazard-results-count").textContent =
        `${matches.length.toLocaleString()} matching entries; showing first ${Math.min(limit, matches.length)}.`;
      $("#hazard-results").innerHTML = matches
        .slice(0, limit)
        .map(
          (e) =>
            `<p class="hazard-row-card"><a href="#physical/${e.id}">${esc(e.title)}</a><span>${esc(climateLabels[e.kind])} · ${openHazardDate(e) ? "Open date constraint — see source fields" : formatYear(e.start) + (e.start !== e.end ? " – " + formatYear(e.end) : "")} · ${esc(e.status)}</span></p>`,
        )
        .join("");
      $("#hazard-more").toggleAttribute("hidden", limit >= matches.length);
    };

    for (const fieldId of ["hazard-search", "hazard-kind"]) {
      $("#" + fieldId).addEventListener("input", () => {
        limit = 60;
        render();
      });
    }
    root
      .querySelectorAll<HTMLButtonElement>("[data-filter-kind]")
      .forEach((btn) =>
        btn.addEventListener("click", () => {
          $<HTMLSelectElement>("#hazard-kind").value = btn.dataset.filterKind!;
          limit = 60;
          render();
          $("#hazard-results").scrollIntoView({ behavior: "smooth", block: "nearest" });
        }),
      );
    $("#hazard-more").addEventListener("click", () => {
      limit += 60;
      render();
    });
    render();
  }

  root.insertAdjacentHTML(
    "beforeend",
    `<section class="physical-band" id="physical-sources-band">
      <div class="physical-band-head">
        <div>
          <h3>Environmental Data Sources, DOIs &amp; Constraints</h3>
          <p>Every paleoclimate curve, ice-sheet polygon layer, and hazard catalog retains its original author uncertainty and non-causal scope.</p>
        </div>
      </div>
      <div class="physical-sources-grid">${physicalSources
        .map(
          (s) => `<article class="physical-source-card" id="physical-${s.id}">
            <h4>${esc(s.title)}</h4>
            <p class="physical-source-authors">${esc(s.authors)}</p>
            <details><summary>Method, limits &amp; license</summary><p>${esc(s.method)}</p><p><strong>Limits:</strong> ${esc(s.limits)}</p><p>${esc(s.license)}</p></details>
            <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Publication ↗</a> · <a href="${esc(s.data)}" target="_blank" rel="noopener noreferrer">Dataset ↗</a>
          </article>`,
        )
        .join("")}</div>
    </section>`,
  );
}
