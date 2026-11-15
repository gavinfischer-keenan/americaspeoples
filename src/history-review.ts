import type { MapRecord } from "./model";
import { esc } from "./dom";
import { formatYear } from "./time";
import { HISTORY_LABELS } from "./history";

/** Shared explanation in interactive and downloadable source reviews. */
export function historyHTML(r: MapRecord): string {
  const h = r.history;
  if (!h) return "";
  const detail = h.windows
    ? `<p>Only these supported windows appear in Movie. Gaps are unresolved contact, not proof of isolation. Animation does not measure voyage frequency.</p><ul>${h.windows.map((w) => `<li><strong>${formatYear(w.start)}–${formatYear(w.end)}</strong> · ${esc(w.certainty)}<p>${esc(w.note)}</p></li>`).join("")}</ul>`
    : h.kind === "wreck"
      ? `<p>Historical loss: ${esc(h.eventDate ?? r.time.original)}. ${esc(h.group ?? "")}.</p><p>This loss remains on the map after its date. Fleet-disaster records aggregate multiple vessels; the counter is not a hull count or a claim that intact wrecks remain today.</p>`
      : `<p>Foundation or arrival milestone${h.foundingPower ? " · " + esc(h.foundingPower) : ""}. The place remains as founding history. Its color identifies founding attribution, not sovereignty at the selected year. This is not a population estimate.</p>${h.endYear !== undefined ? `<p>${h.endMeaning === "relocated" ? "Relocation" : "Local abandonment"} recorded ${formatYear(h.endYear)}; the earlier place remains historical context.</p>` : ""}`;
  return `<section class="history-review"><h3>${esc(HISTORY_LABELS[h.kind])} on the timeline</h3>${detail}</section>`;
}
