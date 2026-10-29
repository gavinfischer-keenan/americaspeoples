import type { EvidenceRecord, Linguistics } from "./model";
import { esc } from "./dom";
import { timeLabel } from "./time";

export const RELATIONSHIP_LABELS: Record<NonNullable<Linguistics["relationship"]>["kind"], string> = {
  descent: "Descent / proposed language evolution",
  borrowing: "Borrowing (from → recipient)",
  contact: "Contact (no descent implied)",
  unclassified: "Unclassified relationship",
};
export function validateLinguistics(r: EvidenceRecord, complete = true): string[] {
  const l = r.linguistics;
  if (l === undefined) return r.overlay?.kind === "language" ? ["Language overlays require linguistic metadata."] : [];
  if (!l || typeof l !== "object" || Array.isArray(l)) return ["Invalid linguistic metadata."];
  const errors: string[] = [];
  const text = (x: unknown) => typeof x === "string" && x.trim().length > 0 && x.length <= 32767;
  const id = (x: unknown) => typeof x === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/.test(x);
  if (!Array.isArray(l.languages) || !l.languages.length || l.languages.length > 30 ||
      l.languages.some(x => !x || typeof x !== "object" || !id(x.id) || !text(x.name) || (x.family !== undefined && !text(x.family))))
    errors.push("Linguistic languages require 1–30 valid IDs and names; family is optional text.");
  const ids = new Set(Array.isArray(l.languages) ? l.languages.map(x => x?.id) : []);
  if (Array.isArray(l.languages) && ids.size !== l.languages.length) errors.push("Linguistic language IDs must be unique within a record.");
  if (!id(l.claimId) || !text(l.scope) || !text(l.uncertainty)) errors.push("Linguistic claimId, scope and uncertainty are required.");
  if (complete) {
    const claim = Array.isArray(r.claims) ? r.claims.find(c => c?.id === l.claimId) : undefined;
    if (!claim || !Array.isArray(claim.support) || !Array.isArray(r.sources) ||
        !claim.support.some(s => s && s.stance === "supports" && r.sources.some(x => x && x.id === s.sourceId)))
      errors.push("Linguistic claim must link to a source-supported claim in this record.");
  }
  const rel = l.relationship;
  if (rel !== undefined && (!rel || typeof rel !== "object" || Array.isArray(rel) ||
      typeof rel.kind !== "string" || !Object.hasOwn(RELATIONSHIP_LABELS, rel.kind) ||
      !ids.has(rel.from) || !ids.has(rel.to) || rel.from === rel.to))
    errors.push("Linguistic relationship needs a supported kind and two distinct listed language IDs.");
  return errors;
}
export function linguisticsHTML(r: EvidenceRecord, claimHref = `#claim-${r.linguistics?.claimId ?? ""}`): string {
  const l = r.linguistics;
  if (!l) return "";
  const name = (id: string) => l.languages.find(x => x.id === id)?.name ?? id;
  const rel = l.relationship;
  return `<section class="language-review"><h3>Languages and relationships</h3><p>${esc(timeLabel(r.time))}</p><ul>${l.languages.map(x => `<li>${esc(x.name)}${x.family ? ` · family / affiliation: ${esc(x.family)}` : ""}</li>`).join("")}</ul>${rel ? `<p><strong>${esc(RELATIONSHIP_LABELS[rel.kind])}</strong><br>${esc(name(rel.from))} ${rel.kind === "contact" || rel.kind === "unclassified" ? "↔" : "→"} ${esc(name(rel.to))}</p>` : "<p>Affiliation / distribution only; no descent relationship asserted.</p>"}<p>${esc(l.scope)}</p><p><strong>Uncertainty:</strong> ${esc(l.uncertainty)}</p><p>Language affiliation is distinct from genetic ancestry, archaeological culture and modern identity. Descent, borrowing and contact are different claims. Dated reconstructed distributions are approximate; no exclusive territory, population count or speaker replacement is implied.</p><a href="${esc(claimHref)}" data-claim="${esc(l.claimId)}">Supporting linguistic claim and sources</a></section>`;
}
