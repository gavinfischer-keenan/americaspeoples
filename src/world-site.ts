import land from "../data/land.geojson";
import { mountWorldHub } from "./world-page";
import type { WorldSummary } from "./world-model";
const root = document.getElementById("world-site")!;
document.body.classList.add("world-surface");
const base = root.dataset.baseRoot ?? "/spread-of-peoples/";
const origin =
  root.dataset.appOrigin ?? "https://americaspeoples.11mosswood.us";
fetch(root.dataset.summaryUrl ?? "./world-summary.json")
  .then((r) => {
    if (!r.ok) throw Error("Summary unavailable");
    return r.json() as Promise<WorldSummary>;
  })
  .then((summary) =>
    mountWorldHub(root, summary, land, {
      regionHref: (id) => base + id + "/",
      originsHref: origin + "/#origins",
      guideHref: origin + "/sites/world-human-family.html",
      studyHref: (id) => origin + "/#study/" + id,
      earlyAfricaHref: origin + "/#atlas/africa/early",
      sourcesHref:
        origin + "/sites/sources-attributions.html#consensus-discovery",
    }),
  )
  .catch(() => {
    root.insertAdjacentHTML(
      "beforeend",
      "<p>Interactive map unavailable. Use the regional links to continue.</p>",
    );
  });
