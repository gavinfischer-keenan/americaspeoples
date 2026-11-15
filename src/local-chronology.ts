import type { DisplayRecord } from "./model";
import { esc } from "./dom";
import { timeLabel } from "./time";
import { recordHref } from "./review";

/** Source phases, never an interpolated building footprint or invented annual population. */
export function localChronologyHTML(
  records: readonly DisplayRecord[],
  year: number,
): string {
  if (!records.length) return "";
  const sorted = [...records].sort(
    (a, b) => a.time.start! - b.time.start! || a.id.localeCompare(b.id),
  );
  return `<span class="eyebrow">THIS PLACE THROUGH TIME</span><h3>Buildings &amp; local changes</h3><p>Dates for places in this close view. Choose a phase to change the shared map date.</p><div class="local-phases">${sorted
    .map((r) => {
      const future = year < r.time.start!,
        past = year > r.time.end!,
        construction = r.history?.kind === "settlement";
      const event = !!r.overlay;
      const state = future
        ? "Later evidence"
        : event
          ? "Dated local event"
          : construction
            ? past
              ? "Construction recorded earlier"
              : "Construction date / window"
            : past
              ? "Earlier occupation evidence"
              : "Occupation evidence";
      return `<article class="local-phase ${future ? "future-phase" : ""}"><small>${esc(state)}</small><strong>${esc(r.location!.name)}</strong><button data-local-year="${r.time.start}" data-local-record="${esc(r.id)}">${esc(timeLabel(r.time))}</button><a href="${recordHref(r)}">Evidence &amp; location ↗</a></article>`;
    })
    .join(
      "",
    )}</div><p class="fine">Approximate dates retain their published ranges. More buildings appearing can show documented development; marker size is not a reconstructed town area. An occupation phase ending does not alone prove abandonment.</p>`;
}
