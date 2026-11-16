import type { MapRecord } from "./model";
import { esc } from "./dom";
import { formatYear } from "./time";
import { HISTORY_LABELS } from "./history";

/** Shared explanation in interactive and downloadable source reviews. */
export function historyHTML(r: MapRecord): string {
  const h = r.history;
  if (!h) return "";
  const detail = h.kind==='attestation' ? '<p>A dated find, document or model remains as explicitly dated earlier evidence. It does not establish continuous presence, first arrival, a language boundary, or the beginning of a language. Read the source date and location precision separately.</p>' : h.kind==='visit' ? '<p>A dated visit remains as historical context after the visit ends. It does not establish settlement, continuous occupation, or later sovereignty.</p>' : h.kind==='habitation'
    ? `<p>Occupation evidence is separate from founding or the first European account. ${h.continuity==='ongoing'?'Community history continues beyond the 1934 display horizon.':'The recorded interval describes the available evidence; its end alone does not establish abandonment.'}</p>`
    : h.windows
    ? `<p>Only these supported windows appear in Movie. Gaps are unresolved contact, not proof of isolation. Animation does not measure voyage frequency.</p><ul>${h.windows.map((w) => `<li><strong>${formatYear(w.start)}–${formatYear(w.end)}</strong> · ${esc(w.certainty)}<p>${esc(w.note)}</p></li>`).join("")}</ul>`
    : h.kind === "wreck"
      ? `<p>Historical loss: ${esc(h.eventDate ?? r.time.original)}. ${esc(h.group ?? "")}.</p><p>This loss remains on the map after its date. Fleet-disaster records aggregate multiple vessels; the counter is not a hull count or a claim that intact wrecks remain today.</p>`
      : `<p>Foundation or arrival milestone${h.foundingPower ? " · " + esc(h.foundingPower) : ""}. The place remains as founding history. Its color identifies founding attribution, not sovereignty at the selected year. This is not a population estimate.</p>${h.endYear !== undefined ? `<p>${h.endMeaning === "relocated" ? "Relocation" : "Local abandonment"} recorded ${formatYear(h.endYear)}; the earlier place remains historical context.</p>` : ""}`;
  const end=h.endEvidence?`<p><strong>${h.endEvidence.certainty==='inferred'?'Inferred':'Documented'} local ${h.endEvidence.meaning==='relocated'?'relocation':'abandonment'}:</strong> ${formatYear(h.endEvidence.start)}–${formatYear(h.endEvidence.end)}. ${esc(h.endEvidence.note)}</p>`:'';
  const c=h.connection;
  const connection=c?`<p><strong>Evidence of connection:</strong> ${esc(c.evidence)}. Latest positive evidence in this record: ${formatYear(c.lastEvidence)}.</p><p><strong>End of contact:</strong> ${c.cessation==='unknown'?'Unknown; the last observation does not establish cessation':esc(c.cessation)}. ${esc(c.note)}</p>`:'';
  return `<section class="history-review"><h3>${esc(HISTORY_LABELS[h.kind])} on the timeline</h3>${detail}${end}${connection}</section>`;
}
