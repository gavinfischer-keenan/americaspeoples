import { $, esc } from "./dom";
import { formatYear } from "./time";
import {
  physicalHTML,
  physicalState,
  hazardEvents,
  openHazardDate,
  climateLabels,
  climateKinds,
} from "./physical";
export function mountPhysicalPage(main: HTMLElement, id?: string) {
  main.innerHTML = physicalHTML(id);
  if (id) return;
  if (physicalState !== "ready") {
    main
      .querySelector("article")!
      .insertAdjacentHTML(
        "beforeend",
        `<section><h3>Catalog loading status</h3><p role="status">${physicalState === "error" ? "Climate catalog could not load. Evidence records remain available." : "Climate catalog loading; event absence cannot yet be assessed."}</p>${physicalState === "error" ? "<button data-retry-physical>Retry climate catalog</button>" : ""}</section>`,
      );
    return;
  }
  main
    .querySelector("article")!
    .insertAdjacentHTML(
      "beforeend",
      `<section><h3>Catalog browser</h3><p>${hazardEvents.length.toLocaleString()} source-linked catalog / reconstructed annual entries in this edition. These are separate from archaeological evidence counts. Open-ended eruption-date constraints remain accessible here and are not assigned to an invented year.</p><a href="hazard-events.json" download>Download structured catalog extract</a><label>Search event / volcano / year<input id="hazard-search" type="search" aria-label="Search natural hazards"></label><label>Kind<select id="hazard-kind" aria-label="Natural hazard kind"><option value="">All</option>${climateKinds.filter(k=>['el-nino','la-nina','volcano','earthquake','tsunami'].includes(k)).map((k) => `<option value="${k}">${climateLabels[k]}</option>`).join("")}</select></label><p id="hazard-results-count"></p><div id="hazard-results"></div><button id="hazard-more">Show more</button></section>`,
    );
  let limit = 100;
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
          `<p><a href="#physical/${e.id}">${esc(e.title)}</a> · ${esc(climateLabels[e.kind])} · ${openHazardDate(e) ? "Open date constraint — see source fields" : formatYear(e.start) + (e.start !== e.end ? " – " + formatYear(e.end) : "")} · ${esc(e.status)}</p>`,
      )
      .join("");
    $("#hazard-more").toggleAttribute("hidden", limit >= matches.length);
  };
  for (const id of ["hazard-search", "hazard-kind"])
    $("#" + id).addEventListener("input", () => {
      limit = 100;
      render();
    });
  $("#hazard-more").addEventListener("click", () => {
    limit += 100;
    render();
  });
  render();
}
