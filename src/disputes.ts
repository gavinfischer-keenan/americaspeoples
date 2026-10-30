import type { EvidenceRecord, MapRecord } from "./model";
import { esc } from "./dom";
export function disputeLevel(
  r: Pick<MapRecord, "claims">,
): "none" | "discussion" | "disputed" {
  return r.claims.some((c) => c.status === "disputed")
    ? "disputed"
    : r.claims.some((c) => c.status === "under discussion")
      ? "discussion"
      : "none";
}
export function disputeLabel(r: Pick<MapRecord, "claims">): string {
  return disputeLevel(r) === "disputed"
    ? "Explicitly disputed claim — open the sources and competing interpretations"
    : disputeLevel(r) === "discussion"
      ? "Under discussion — qualifications or competing interpretations"
      : "No explicit dispute recorded for the included claims";
}
export function disputeBox(r: EvidenceRecord): string {
  const level = disputeLevel(r);
  if (level === "none") return "";
  return `<section class="dispute-box dispute-${level}" aria-label="Scholarly disagreement"><h3><span aria-hidden="true">*</span> ${level === "disputed" ? "Explicitly disputed" : "Under discussion"}</h3><p>The asterisk marks scholarly qualifications, interpretations or explicit disagreement, separately from date uncertainty. Its color is an editorial category, not a confidence score, vote count or probability.</p>${r.claims
    .filter((c) => c.status !== "well-supported")
    .map((c) => `<h4>${esc(c.text)}</h4><p>${esc(c.explanation)}</p>`)
    .join(
      "",
    )}<p>${esc(r.review.discussion)}</p><p>See the claim-to-source mappings below for support, challenges and access limits.</p></section>`;
}
