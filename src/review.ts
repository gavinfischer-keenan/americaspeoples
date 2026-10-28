import type { Dataset, DisplayRecord, Proposal } from "./model";
import { esc } from "./dom";
import { formatYear, timeLabel, isDisputed } from "./time";
import { safeURL } from "./validation";
export const recordHref = (r: DisplayRecord) =>
  r.proposalKey
    ? `#proposal/${r.proposalKey}`
    : `#review/${encodeURIComponent(r.id)}`;
export function reviewHTML(
  r: DisplayRecord,
  d: Dataset,
  proposal?: Proposal,
): string {
  const status = isDisputed(r)
    ? '<span class="tag">* Includes scholarly discussion</span>'
    : '<span class="tag">Well-supported claims</span>';
  return `<article class="review-page"><a class="back-link" href="#evidence">← Evidence index</a><div class="eyebrow">${esc(r.type)} / ${esc(r.id)} / REV ${r.revision}</div><h2>${esc(r.title)}${isDisputed(r) ? '<sup title="See claim-specific scholarly discussion">*</sup>' : ""}</h2><div class="review-meta">${status}${proposal ? `<span class="tag proposal-tag">Unreviewed proposal · ${esc(proposal.state)}</span>` : '<span class="tag">Bundled evidence · editorial source check</span>'}</div><p class="lead">${esc(timeLabel(r.time))} · ${esc(r.culture.name)}<br>${esc(r.location?.name ?? "No mapped location")}</p>
 <div class="actions"><button data-action="locate">Show on map at this time</button><button data-action="correct">${proposal ? "Edit suggestion" : "Suggest correction"}</button><button data-action="share">Send to others</button></div>
 ${proposal ? `<section class="proposal-notice"><h3>Suggested update</h3><p>${esc(proposal.rationale || "Draft — no rationale yet.")}</p><p>This is a local suggestion, not reviewed evidence. Original dataset records remain unchanged.</p>${proposal.baseRecord ? comparisonHTML(proposal) : ""}</section>` : ""}
 <div class="review-grid"><div><section><h3>Evidence and interpretation</h3><p class="prose">${esc(r.review.summary)}</p></section><section><h3>Claims and supporting evidence</h3>${r.claims.map((c) => `<div class="claim"><h4>${esc(c.text)}${c.status !== "well-supported" ? " *" : ""}</h4><span class="tag">${esc(c.status)}</span><p>${esc(c.explanation)}</p><ul>${c.support.map((s) => `<li><a href="#source-${esc(s.sourceId)}" data-source="${esc(s.sourceId)}">${esc(r.sources.find((x) => x.id === s.sourceId)?.title ?? s.sourceId)}</a> · ${esc(s.stance)}<br><small>${esc(s.locator)}</small><p>${esc(s.note)}</p></li>`).join("")}</ul></div>`).join("")}</section><section><h3>Discussion</h3><p class="prose">${esc(r.review.discussion || "No competing interpretation documented for this record. This is not a claim of universal agreement.")}</p></section><section><h3>Limits of this evidence</h3><p class="prose">${esc(r.review.limitations)}</p></section></div>
 <aside><section><h3>Dating</h3><dl><dt>Published date</dt><dd>${esc(r.time.original)}</dd><dt>Method</dt><dd>${esc(r.time.method)}</dd><dt>Display interpretation</dt><dd>${esc(r.time.interpretation)}</dd><dt>Time model</dt><dd>${esc(r.time.kind)}${r.time.kind === "occurrence" && r.time.start !== r.time.end ? " · possible occurrence, not continuous occupation" : ""}</dd>${r.time.certainStart !== undefined ? `<dt>Certain core</dt><dd>${formatYear(r.time.certainStart)} – ${formatYear(r.time.certainEnd!)}</dd>` : ""}</dl></section><section><h3>Location</h3>${r.location ? `<p>${esc(r.location.name)}<br>${r.location.lat.toFixed(3)}, ${r.location.lon.toFixed(3)}</p><p>${esc(r.location.precision)}</p><p>${esc(r.location.provenance)}</p>` : "<p>This record has no defensible mapped location.</p>"}${r.destination ? `<h4>Destination</h4><p>${esc(r.destination.name)} · ${esc(r.routeKind)} connection</p><p>${esc(r.destination.precision)} · ${esc(r.destination.provenance)}</p>` : ""}</section><section><h3>Record provenance</h3><p>${esc(r.review.provenance)}</p><p>Source check: ${esc(r.review.reviewedAt)}<br>Dataset ${esc(d.version)}</p><ul>${r.review.history.map((h) => `<li>${esc(h)}</li>`).join("")}</ul></section></aside></div>
 <section><h3>Bibliography</h3><p class="muted">Citations and explanations are available offline. Publication links require an internet connection.</p><ol class="bibliography">${r.sources.map((s) => `<li id="source-${esc(s.id)}"><p><strong>${esc(s.authors)}</strong> (${s.year ?? "n.d."}). ${esc(s.title)}. <em>${esc(s.venue)}</em>.</p>${safeURL(s.url) ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Open scholarly source ↗</a>` : ""}<p class="muted">Access and verification: ${esc(s.access)}</p></li>`).join("")}</ol></section>
 ${r.review.relatedIds.length ? `<section><h3>Related evidence</h3><ul>${r.review.relatedIds.map((id) => `<li><a href="#review/${encodeURIComponent(id)}">${esc(d.records.find((x) => x.id === id)?.title ?? id)}</a></li>`).join("")}</ul></section>` : ""}</article>`;
}
export function comparisonHTML(p: Proposal): string {
  if (!p.baseRecord) return "";
  const a = p.baseRecord,
    b = p.record;
  const keys = Object.keys(b) as (keyof typeof b)[];
  const changed = keys.filter(
    (k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]),
  );
  return `<details class="comparison"><summary>Compare with original · ${changed.length} changed fields · base revision ${p.baseRevision}</summary>${changed.length ? changed.map((k) => `<h4>${esc(k)}</h4><div class="compare-columns"><div><strong>Original</strong><pre>${esc(typeof a[k] === "string" ? a[k] : JSON.stringify(a[k], null, 2))}</pre></div><div><strong>Proposed</strong><pre>${esc(typeof b[k] === "string" ? b[k] : JSON.stringify(b[k], null, 2))}</pre></div></div>`).join("") : "<p>No record fields changed. This copy is being shared for discussion.</p>"}</details>`;
}
