import land from "../data/land.geojson";
import { mountWorldHub } from "./world-page";
import type { WorldSummary } from "./world-model";
const root = document.getElementById("world-site")!;
root.classList.add("world-surface");
const origin =
  root.dataset.appOrigin ?? "https://americaspeoples.11mosswood.us";
fetch(root.dataset.summaryUrl ?? "./world-summary.json")
  .then((r) => {
    if (!r.ok) throw Error("Summary unavailable");
    return r.json() as Promise<WorldSummary>;
  })
  .then((summary) =>
    mountWorldHub(root, summary, land, {
      regionHref: (id) =>
        origin + "/" + (id === "americas" ? "#movie" : "#atlas/" + id),
      divesHref: origin + "/#dives",
      guideHref: origin + "/sites/world-human-family.html",
      sourcesHref:
        origin + "/sites/sources-attributions.html#consensus-discovery",
      globeOnly: true,
    }),
  )
  .catch(() => {
    root.insertAdjacentHTML(
      "beforeend",
      "<p>Interactive map unavailable. Use the regional links to continue.</p>",
    );
  });
