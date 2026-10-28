import type {
  Dataset,
  EvidenceRecord,
  SharePackage,
  Place,
} from "../src/model";
import { validateDataset } from "../src/validation";
import { esc } from "../src/dom";
import { formatReference } from "../src/citations";
import { timeLabel, isDisputed, END_YEAR } from "../src/time";

interface AppendixEntry {
  collection: "bundled" | "research-proposal";
  defaultVisible: boolean;
  reviewPath: string | null;
  appendixPath: string;
  record: EvidenceRecord;
}
export function createAppendix(
  dataset: Dataset,
  research: SharePackage,
  version: string,
) {
  const checked = research;
  const errors = validateDataset({
    ...dataset,
    records: [...dataset.records, ...checked.proposals.map((p) => p.record)],
  });
  if (errors.length) throw new Error(errors.join("\n"));
  const records: AppendixEntry[] = [
    ...dataset.records.map((record) => ({
      collection: "bundled" as const,
      defaultVisible: true,
      reviewPath: `/#review/${encodeURIComponent(record.id)}`,
      appendixPath: `/evidence-appendix.html#record-${record.id}`,
      record: structuredClone(record),
    })),
    ...checked.proposals.map((p) => ({
      collection: "research-proposal" as const,
      defaultVisible: true,
      reviewPath: `/#review/${encodeURIComponent(p.record.id)}`,
      appendixPath: `/evidence-appendix.html#record-${p.record.id}`,
      record: structuredClone(p.record),
    })),
  ];
  return {
    format: "americas-peoples-evidence-appendix",
    schemaVersion: 1,
    appVersion: version,
    datasetVersion: dataset.version,
    sourceCheckDate: dataset.reviewedAt,
    timelineEnd: END_YEAR,
    records,
  };
}
function placeHTML(place: Place, label: string): string {
  return `<h3>${esc(label)}</h3><p>${esc(place.name)} · ${place.lat}, ${place.lon}</p><p>${esc(place.precision)}</p><p class="prose">${esc(place.provenance)}</p>`;
}
export function renderAppendix(
  appendix: ReturnType<typeof createAppendix>,
): string {
  const bundledCount = appendix.records.filter(
    (r) => r.collection === "bundled",
  ).length;
  const researchCount = appendix.records.length - bundledCount;
  const entries = appendix.records
    .map(
      ({ collection, record: r }) =>
        `<details id="record-${esc(r.id)}" data-evidence-id="${esc(r.id)}"><summary><strong>${esc(r.title)}${isDisputed(r) ? " *" : ""}</strong><br><small>${esc(timeLabel(r.time))} · ${esc(r.culture.name)} · ${collection === "bundled" ? "Bundled evidence" : "Published research"}</small></summary><p>${esc(r.overlay?.kind ?? r.type)} · ${esc(r.location?.name ?? "Unmapped")}</p><p class="prose">${esc(r.review.summary)}</p><h3>Dating and limits</h3><p>${esc(r.time.original)}<br>${esc(r.time.method)}</p><p>${esc(r.time.interpretation)}</p><p class="prose">${esc(r.review.limitations)}</p><p class="prose">${esc(r.review.discussion)}</p>${r.overlay ? `<p><strong>Geometry:</strong> ${esc(r.overlay.basis)}. ${esc(r.overlay.precision)} ${esc(r.overlay.provenance)}</p>` : ""}${r.location ? placeHTML(r.location, "Location") : ""}${r.destination ? placeHTML(r.destination, "Destination (schematic connection)") : ""}${r.population?.length ? `<h3>Resident population estimates</h3><ul>${r.population.map((p) => `<li>${p.min}–${p.max} residents · ${p.start}–${p.end} astronomical years · ${esc(p.scope)} · supporting claim ${esc(p.claimId)}</li>`).join("")}</ul>` : ""}<h3>Record provenance</h3><p>${esc(r.id)} · revision ${r.revision} · source check ${esc(r.review.reviewedAt)}</p><p class="prose">${esc(r.review.provenance)}</p><ul>${r.review.history.map((h) => `<li>${esc(h)}</li>`).join("")}</ul><h3>Claims and source mappings</h3><ol>${r.claims.map((c) => `<li><p>${esc(c.text)} <strong>${esc(c.status)}</strong></p><p>${esc(c.explanation)}</p><ul>${c.support.map((s) => `<li>${esc(s.sourceId)} · ${esc(s.stance)} · ${esc(s.locator)} — ${esc(s.note)}</li>`).join("")}</ul></li>`).join("")}</ol><h3>Bibliography</h3><ol>${r.sources.map((s) => `<li><p>${esc(formatReference(s))}</p><p><code>${esc(s.id)}</code> · <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Open source</a></p><p>${esc(s.access)}</p></li>`).join("")}</ol></details>`,
    )
    .join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Evidence appendix | Americas Peoples</title><style>body{font:16px/1.65 system-ui,sans-serif;color:#20313a;max-width:1100px;margin:40px auto;padding:0 24px 60px}h1,h2,h3{line-height:1.3}a{color:#086b7b}details{border:1px solid #cbd6d9;padding:18px;margin:16px 0;border-radius:6px}summary{cursor:pointer}small{color:#475b63}.prose{white-space:pre-wrap}li,code{overflow-wrap:anywhere}li{margin:12px 0}</style></head><body><a href="index.html#evidence">Open the atlas</a><h1>Americas Peoples: evidence appendix</h1><p>App ${esc(appendix.appVersion)} · source check ${esc(appendix.sourceCheckDate)} · ${appendix.records.length} records across two collections.</p><p>All ${bundledCount + researchCount} records are included in the atlas by default: ${bundledCount} starter records and ${researchCount} published research records. No import or preview switch is needed. A star marks a claim under discussion or dispute.</p><p>The timeline ends in 1934, the year of the Indian Reorganization Act. This is a display boundary, not the end of dispossession or Indigenous history. A marker ending does not establish extinction. Scholarly source links require internet; all explanations below are included in this file.</p><p>Search this page with your browser's Find command. Expand a record for its claims, bibliography and access limitations. <a href="evidence-appendix.json" download>Download complete appendix JSON</a> · <a href="research-proposals.json" download>Download research package</a></p>${entries}</body></html>`;
}
