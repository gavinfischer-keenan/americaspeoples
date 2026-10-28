import type { EvidenceRecord, Proposal } from "./model";
import { input, area, esc, $ } from "./dom";
import { validateRecord } from "./validation";
import { makePackage, parsePackage } from "./proposals";
const uid = () =>
  crypto.randomUUID?.() ??
  `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function blankRecord(): EvidenceRecord {
  return {
    id: `record-${uid()}`,
    revision: 1,
    type: "occurrence",
    title: "",
    culture: {
      id: "unknown",
      name: "Unknown attribution",
      kind: "unknown",
      color: "#9babb5",
    },
    location: null,
    destination: null,
    routeKind: "schematic",
    time: {
      kind: "unplaced",
      start: null,
      end: null,
      original: "",
      method: "",
      interpretation: "",
    },
    claims: [],
    sources: [],
    review: {
      summary: "",
      limitations: "",
      discussion: "",
      provenance: "User suggestion; not reviewed",
      reviewedAt: new Date().toISOString().slice(0, 10),
      history: [],
      relatedIds: [],
    },
  };
}
export function newProposal(record?: EvidenceRecord): Proposal {
  const now = new Date().toISOString();
  return {
    id: `proposal-${uid()}`,
    version: 1,
    kind: record ? "correction" : "new",
    targetId: record?.id ?? null,
    baseRevision: record?.revision ?? null,
    baseRecord: record ? structuredClone(record) : null,
    record: record ? structuredClone(record) : blankRecord(),
    rationale: "",
    state: "draft",
    createdAt: now,
    updatedAt: now,
  };
}
const select = (
  name: string,
  label: string,
  value: string,
  options: string[],
) =>
  `<label>${label}<select name="${name}" aria-label="${label}">${options.map((x) => `<option ${x === value ? "selected" : ""}>${x}</option>`).join("")}</select></label>`;
export function mountEditor(
  root: HTMLElement,
  original: Proposal,
  onSave: (p: Proposal) => void,
  onDirty: (dirty: boolean) => void,
): void {
  const p = structuredClone(original),
    r = p.record;
  root.innerHTML = `<article class="editor-page"><a href="#proposals" class="back-link">← Your suggestions</a><div class="eyebrow">${p.kind === "correction" ? "Propose a correction" : "Add evidence"} · Unreviewed</div><h2>${p.kind === "correction" ? "Suggest an update" : "New evidence row"}</h2><p class="lead">Keep the claim, its evidence, and its uncertainties together.</p><p class="muted">Saving creates a local suggestion. It never replaces the bundled dataset. Download your suggestions for a portable backup.</p><form id="editor-form"><div id="editor-errors" role="alert"></div>
 <fieldset><legend>Record</legend>${input("title", "Record title", r.title)}<div class="form-grid">${select("type", "Record type", r.type, ["occupation", "occurrence", "movement", "event"])}${input("recordId", "Stable record ID", r.id)}</div>${area("rationale", "Reason for this suggestion", p.rationale, 3)}</fieldset>
 <fieldset><legend>Culture or identified people</legend><div class="form-grid">${input("cultureName", "Culture / people name", r.culture.name)}${input("cultureId", "Culture / people ID", r.culture.id)}${select("cultureKind", "Classification", r.culture.kind, ["culture", "people", "unknown"])}${input("cultureColor", "Legend color", r.culture.color, "color")}</div><p class="muted">Reuse the existing ID and color for an existing category. Leave unknown when attribution is unsupported.</p></fieldset>
 <fieldset><legend>Dates and interpretation</legend>${select("timeKind", "Time model", r.time.kind, ["interval", "occurrence", "unplaced"])}<p class="muted">Use “occurrence” for something dated within a range, not continuous occupation. “Unplaced” keeps the row off the timeline. Internal years: 1 = 1 CE, 0 = 1 BCE, −1 = 2 BCE. Dates must end by 1803.</p><div class="form-grid">${input("start", "Start / earliest possible year", r.time.start ?? "", "number")}${input("end", "End / latest possible year", r.time.end ?? "", "number")}${input("certainStart", "Certain interval starts (optional)", r.time.certainStart ?? "", "number")}${input("certainEnd", "Certain interval ends (optional)", r.time.certainEnd ?? "", "number")}</div><label class="check"><input type="checkbox" name="approximate" ${r.time.approximate ? "checked" : ""}> Dates are approximate reference values</label>${input("originalDate", "Original published dating", r.time.original)}${area("method", "Dating method and calibration", r.time.method, 2)}${area("interpretation", "How these dates are displayed", r.time.interpretation, 3)}</fieldset>
 <fieldset><legend>Location</legend><label class="check"><input type="checkbox" name="mapped" ${r.location ? "checked" : ""}> Show a geographic location</label><div class="form-grid">${input("placeName", "Location name", r.location?.name ?? "")}${input("placeId", "Location ID", r.location?.id ?? `place-${uid()}`)}${input("lon", "Longitude", r.location?.lon ?? "", "number")}${input("lat", "Latitude", r.location?.lat ?? "", "number")}</div>${input("precision", "Coordinate precision", r.location?.precision ?? "")}${area("locationProvenance", "Location source / provenance", r.location?.provenance ?? "", 2)}<details><summary>Movement destination</summary><p>For a movement, supply the destination object with id, name, lon, lat, precision and provenance. Use null for other records.</p>${area("destination", "Destination JSON", JSON.stringify(r.destination, null, 2), 5)}${select("routeKind", "Route interpretation", r.routeKind, ["schematic"])}</details></fieldset>
 <fieldset><legend>Supporting review page</legend>${area("summary", "Evidence and interpretation", r.review.summary, 7)}${area("limitations", "Limits of the evidence", r.review.limitations, 3)}${area("discussion", "Scholarly discussion", r.review.discussion, 5)}${area("provenance", "Record provenance", r.review.provenance, 2)}${input("reviewedAt", "Source check date", r.review.reviewedAt, "date")}</fieldset>
 <fieldset><legend>Bibliography and claim support</legend><p>Each source needs a stable ID, authors, title, year, venue, URL and access notes. Each claim names its supporting or challenging sources. The structured fields preserve precise references when sharing.</p><button type="button" id="add-source">Add source template</button> <button type="button" id="add-claim">Add claim template</button>${area("sources", "Sources JSON", JSON.stringify(r.sources, null, 2), 12)}${area("claims", "Claims and source mappings JSON", JSON.stringify(r.claims, null, 2), 12)}<p class="muted">Claim status: well-supported, under discussion, or disputed. Support stance: supports, challenges, or context. Explain disagreements in Scholarly discussion and map each position to its sources.</p>${area("related", "Related record IDs JSON", JSON.stringify(r.review.relatedIds), 2)}</fieldset>
 <div class="editor-actions"><button type="submit" name="save" value="draft">Save draft</button><button type="submit" name="save" value="ready" class="primary">Save complete suggestion</button><a href="#proposals">Cancel</a></div></form></article>`;
  const form = $<HTMLFormElement>("#editor-form", root);
  form.addEventListener("input", () => onDirty(true));
  if (p.kind === "correction")
    $<HTMLInputElement>('[name="recordId"]', form).readOnly = true;
  $("#add-source", form).addEventListener("click", () => {
    try {
      const el = $<HTMLTextAreaElement>('[name="sources"]', form);
      const values = JSON.parse(el.value);
      if (!Array.isArray(values)) throw new Error("Sources must be an array.");
      values.push({
        id: `source-${values.length + 1}`,
        authors: "",
        title: "",
        year: 2026,
        venue: "",
        url: "",
        access: "",
      });
      el.value = JSON.stringify(values, null, 2);
      onDirty(true);
    } catch (e) {
      showError(String(e));
    }
  });
  $("#add-claim", form).addEventListener("click", () => {
    try {
      const el = $<HTMLTextAreaElement>('[name="claims"]', form);
      const values = JSON.parse(el.value);
      if (!Array.isArray(values)) throw new Error("Claims must be an array.");
      values.push({
        id: `claim-${values.length + 1}`,
        text: "",
        status: "under discussion",
        explanation: "",
        support: [
          { sourceId: "source-1", locator: "", stance: "supports", note: "" },
        ],
      });
      el.value = JSON.stringify(values, null, 2);
      onDirty(true);
    } catch (e) {
      showError(String(e));
    }
  });
  const showError = (message: string) => {
    const el = $("#editor-errors", root);
    el.innerHTML = `<p class="error">${esc(message)}</p>`;
    el.scrollIntoView({ block: "center" });
  };
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      const data = new FormData(form),
        v = (name: string) => String(data.get(name) ?? ""),
        n = (name: string) => (v(name).trim() === "" ? null : Number(v(name)));
      const state =
        (e.submitter as HTMLButtonElement)?.value === "ready"
          ? "ready"
          : "draft";
      const next = structuredClone(r);
      next.title = v("title");
      next.id = v("recordId");
      next.type = v("type") as EvidenceRecord["type"];
      next.culture = {
        id: v("cultureId"),
        name: v("cultureName"),
        kind: v("cultureKind") as any,
        color: v("cultureColor"),
      };
      const kind = v("timeKind") as EvidenceRecord["time"]["kind"];
      next.time = {
        kind,
        start: kind === "unplaced" ? null : n("start"),
        end: kind === "unplaced" ? null : n("end"),
        original: v("originalDate"),
        method: v("method"),
        interpretation: v("interpretation"),
      };
      if (data.has("approximate")) next.time.approximate = true;
      if (n("certainStart") !== null)
        next.time.certainStart = n("certainStart")!;
      if (n("certainEnd") !== null) next.time.certainEnd = n("certainEnd")!;
      next.location = data.has("mapped")
        ? {
            id: v("placeId"),
            name: v("placeName"),
            lon: n("lon") ?? NaN,
            lat: n("lat") ?? NaN,
            precision: v("precision"),
            provenance: v("locationProvenance"),
          }
        : null;
      next.destination = JSON.parse(v("destination"));
      next.routeKind = v("routeKind") as any;
      next.sources = JSON.parse(v("sources"));
      next.claims = JSON.parse(v("claims"));
      next.review = {
        ...r.review,
        summary: v("summary"),
        limitations: v("limitations"),
        discussion: v("discussion"),
        provenance: v("provenance"),
        reviewedAt: v("reviewedAt"),
        relatedIds: JSON.parse(v("related")),
        history: [
          ...r.review.history,
          `Local suggestion saved ${new Date().toISOString().slice(0, 10)}`,
        ],
      };
      const errors = validateRecord(next, state === "ready");
      if (state === "ready" && !v("rationale").trim())
        errors.push("Explain the reason for this suggestion.");
      if (errors.length) {
        showError(errors.join("\n"));
        return;
      }
      const saved = {
        ...p,
        record: next,
        state,
        rationale: v("rationale"),
        updatedAt: new Date().toISOString(),
      } as Proposal;
      parsePackage(JSON.stringify(makePackage([saved])));
      onSave(saved);
      onDirty(false);
    } catch (error) {
      showError(
        `Could not save: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });
}
