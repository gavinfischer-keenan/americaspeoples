import type { DisplayRecord } from "./model";
import { esc } from "./dom";
import { recordHref } from "./review";
import { timeLabel } from "./time";
import { disputeLevel, disputeLabel } from "./disputes";
export function contextHTML(records: DisplayRecord[]): string {
  const comparison = (r: DisplayRecord) =>
    r.title.startsWith("Comparative context");
  const contexts = records.filter(
    (r) =>
      r.overlay?.kind === "environment" ||
      r.title.includes("context") ||
      r.id === "north-america-prelgm-model" ||
      r.id === "coastal-route-multiple-models2018",
  );
  const cards = (rows: DisplayRecord[]) =>
    rows
      .map(
        (r) =>
          `<li><a href="${recordHref(r)}">${esc(r.title)}</a> ${disputeLevel(r) !== "none" ? `<span class="asterisk dispute-${disputeLevel(r)}" title="${esc(disputeLabel(r))}">*</span>` : ""}<p>${esc(r.review.summary)}</p><small>${esc(timeLabel(r.time))}</small></li>`,
      )
      .join("");
  return `<article class="review-page"><div class="eyebrow">MOVEMENT, ENVIRONMENT & INTERPRETATION</div><h2>Why might people have moved?</h2><p class="lead">Resource access, changing shorelines, climate, farming, exchange, conflict and social choices can shape movement. The evidence supports different explanations in different places.</p><p>These records include continental America and the Caribbean. Regional association or environmental feasibility is not proof that a particular group travelled a particular route. Sources and competing explanations remain attached to each claim. Related-evidence links on individual records connect findings with their context.</p><section><h3>Original explanations and provenance</h3><p><a href="docs/intake/index.html">Read the full author-supplied research exports</a> · <a href="literature-intake.json">Source reconciliation register</a></p><p>The supplied Consensus exports are secondary syntheses. Primary studies are cited separately, with abstract-only access identified. Search percentages are not scientific probabilities.</p></section><section><h3>Americas evidence and competing explanations</h3><ul class="context-records">${cards(contexts.filter((r) => !comparison(r)))}</ul></section><section><h3>Comparative context outside the Americas</h3><p>These examples show possible mechanisms elsewhere. They do not establish American migration dates, paths or causes. Their original chronology is retained in the review; they do not create American settlement markers.</p><ul class="context-records">${cards(contexts.filter(comparison))}</ul></section></article>`;
}
