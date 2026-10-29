import type {
  EvidenceRecord,
  Proposal,
  Source,
  Place,
  SharePackage,
  Claim,
} from "./model";
import type { BulkTables, BulkRow, BulkSheetName } from "./bulk-schema";
import { REFERENCE_TYPES } from "./bulk-schema";
import { normalizeDOI, citationFields } from "./citations";
import {
  makePackage,
  parsePackage,
  validateProposal,
  MAX_PROPOSALS,
} from "./proposals";
import { parseYear } from "./time";

const str = (r: BulkRow, k: string) => String(r[k] ?? "").trim();
function fail(sheet: string, row: number, message: string): never {
  throw new Error(`${sheet} row ${row}: ${message}`);
}
function number(
  r: BulkRow,
  k: string,
  sheet: string,
  row: number,
): number | null {
  const value = str(r, k);
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) fail(sheet, row, `${k} must be a number.`);
  return n;
}
function date(r: BulkRow, prefix: string, row: number): number | null {
  const n = str(r, prefix + "year"),
    era = str(r, prefix + "era").toUpperCase();
  if (!n && !era) return null;
  if (!/^[1-9]\d*$/.test(n))
    fail(
      "Evidence",
      row,
      `${prefix}year must be a positive whole number; use the era column for BCE.`,
    );
  if (!["BCE", "CE"].includes(era))
    fail("Evidence", row, `${prefix}era must be BCE or CE.`);
  return parseYear(n, era);
}
function bool(r: BulkRow, k: string, row: number): boolean {
  const value = str(r, k).toLowerCase();
  if (["", "false", "no", "0"].includes(value)) return false;
  if (["true", "yes", "1"].includes(value)) return true;
  return fail("Evidence", row, `${k} must be TRUE or FALSE.`);
}
function stableID(value: string): string {
  let h = 14695981039346656037n;
  for (const c of value) {
    h ^= BigInt(c.codePointAt(0)!);
    h = BigInt.asUintN(64, h * 1099511628211n);
  }
  return "bulk-" + h.toString(16);
}
function place(r: BulkRow, row: number, destination = false): Place | null {
  const keys = destination
    ? [
        "destination_id",
        "destination_name",
        "destination_longitude",
        "destination_latitude",
        "destination_precision",
        "destination_source",
      ]
    : [
        "location_id",
        "location_name",
        "longitude",
        "latitude",
        "coordinate_precision",
        "location_source",
      ];
  if (keys.every((k) => !str(r, k))) return null;
  if (keys.some((k) => !str(r, k)))
    return fail(
      "Evidence",
      row,
      `${destination ? "Destination" : "Location"} needs all six fields: ${keys.join(", ")}. Leave all blank when unmapped.`,
    );
  return {
    id: str(r, keys[0]),
    name: str(r, keys[1]),
    lon: number(r, keys[2], "Evidence", row)!,
    lat: number(r, keys[3], "Evidence", row)!,
    precision: str(r, keys[4]),
    provenance: str(r, keys[5]),
  };
}
function buildPackage(
  tables: BulkTables,
  records: EvidenceRecord[],
  now = new Date().toISOString(),
): SharePackage {
  const overlayRows = new Map(
    (tables.Overlays ?? []).map((r, i) => [
      str(r, "record_id"),
      { row: r, index: i + 2 },
    ]),
  );
  if (overlayRows.size !== (tables.Overlays ?? []).length)
    throw new Error("Overlays: duplicate record_id.");
  tables = {
    ...tables,
    Evidence: [...tables.Evidence, ...(tables.Overlays ?? [])],
  };
  for (const sheet of Object.keys(tables).filter(
    (s) => s !== "Overlays",
  ) as BulkSheetName[]) {
    const max = sheet === "Evidence" ? MAX_PROPOSALS : 2000;
    if (tables[sheet].length > max)
      fail(
        sheet,
        max + 2,
        `At most ${max} populated rows per sheet. Split the batch.`,
      );
  }
  const recordIds = new Set<string>();
  tables.Evidence.forEach((r, i) => {
    const id = str(r, "record_id");
    if (!id) fail("Evidence", i + 2, "record_id is required.");
    if (recordIds.has(id))
      fail("Evidence", i + 2, `Duplicate record_id ${id}.`);
    recordIds.add(id);
  });
  if (!recordIds.size) throw new Error("Evidence: no rows to import.");
  const refs = new Map<string, Source>();
  tables.References.forEach((r, i) => {
    const id = str(r, "reference_id");
    if (!id || refs.has(id))
      fail("References", i + 2, "Missing or duplicate reference_id.");
    const kind = str(r, "reference_type");
    if (!REFERENCE_TYPES.includes(kind as any))
      fail("References", i + 2, "Choose a supported reference_type.");
    const doi = normalizeDOI(str(r, "doi"));
    const source: Source = {
      id,
      referenceType: kind,
      authors: str(r, "authors"),
      year: number(r, "year", "References", i + 2),
      title: str(r, "title"),
      venue: str(r, "venue"),
      url: str(r, "url") || (doi ? "https://doi.org/" + doi : ""),
      access: str(r, "access_notes"),
    };
    for (const key of citationFields) {
      const value = key === "doi" ? doi : str(r, key);
      if (value) source[key] = value;
    }
    refs.set(id, source);
  });
  const claims = new Map<string, Claim>();
  tables.Claims.forEach((r, i) => {
    const id = str(r, "record_id"),
      claimId = str(r, "claim_id"),
      key = id + "|" + claimId;
    if (!recordIds.has(id))
      fail("Claims", i + 2, `record_id ${id} is not in Evidence.`);
    if (!claimId || claims.has(key))
      fail(
        "Claims",
        i + 2,
        "Missing or duplicate claim_id within this record.",
      );
    claims.set(key, {
      id: claimId,
      text: str(r, "claim"),
      status: str(r, "scholarly_status") as Claim["status"],
      explanation: str(r, "status_explanation"),
      support: [],
    });
  });
  const usedReferences = new Set<string>(),
    supportKeys = new Set<string>();
  tables.ClaimSources.forEach((r, i) => {
    const id = str(r, "record_id"),
      claimId = str(r, "claim_id"),
      ref = str(r, "reference_id");
    const claim = claims.get(id + "|" + claimId);
    if (!claim)
      fail(
        "ClaimSources",
        i + 2,
        "record_id / claim_id does not match a Claims row.",
      );
    if (!refs.has(ref))
      fail(
        "ClaimSources",
        i + 2,
        `reference_id ${ref} is missing from References.`,
      );
    const key = [id, claimId, ref, str(r, "stance"), str(r, "locator")].join(
      "|",
    );
    if (supportKeys.has(key))
      fail("ClaimSources", i + 2, "Duplicate source mapping.");
    supportKeys.add(key);
    usedReferences.add(ref);
    claim.support.push({
      sourceId: ref,
      stance: str(r, "stance") as any,
      locator: str(r, "locator"),
      note: str(r, "support_note"),
    });
  });
  tables.References.forEach((r, i) => {
    if (!usedReferences.has(str(r, "reference_id")))
      fail(
        "References",
        i + 2,
        "Reference is unused. Link it from ClaimSources, including as context when appropriate, or remove it.",
      );
  });
  const proposals: Proposal[] = tables.Evidence.map((r, i) => {
    const row = i + 2,
      id = str(r, "record_id"),
      operation = str(r, "operation") || "new";
    if (!["new", "correction"].includes(operation))
      fail("Evidence", row, "operation must be new or correction.");
    const base = records.find((x) => x.id === id);
    const baseRevision = number(r, "base_revision", "Evidence", row);
    if (operation === "correction") {
      if (!base)
        fail(
          "Evidence",
          row,
          `Correction record_id ${id} not found in this dataset. Use a JSON proposal with its preserved original for cross-version review.`,
        );
      if (baseRevision !== base.revision)
        fail(
          "Evidence",
          row,
          `base_revision must match the current record revision (${base.revision}). Do not replace the number without checking the original.`,
        );
    } else if (baseRevision !== null)
      fail("Evidence", row, "base_revision must be blank for a new row.");
    const kind = str(r, "time_model") || "unplaced",
      start = date(r, "start_", row),
      end = date(r, "end_", row),
      certainStart = date(r, "certain_start_", row),
      certainEnd = date(r, "certain_end_", row);
    if (
      kind === "unplaced" &&
      (start !== null ||
        end !== null ||
        certainStart !== null ||
        certainEnd !== null)
    )
      fail(
        "Evidence",
        row,
        "All year and era cells must be blank for an unplaced record.",
      );
    const cultureId = str(r, "culture_id") || "unknown",
      known = records.find((x) => x.culture.id === cultureId)?.culture;
    const associated = [...claims.entries()]
      .filter(([key]) => key.startsWith(id + "|"))
      .map(([, value]) => value);
    const sourceIds = new Set(
      associated.flatMap((c) => c.support.map((x) => x.sourceId)),
    );
    const reviewDate = str(r, "source_check_date");
    if (
      reviewDate &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(reviewDate) ||
        !Number.isFinite(Date.parse(reviewDate)) ||
        new Date(reviewDate).toISOString().slice(0, 10) !== reviewDate)
    )
      fail(
        "Evidence",
        row,
        "source_check_date must be a real YYYY-MM-DD date stored as text.",
      );
    const related = str(r, "related_ids")
      .split(";")
      .map((x) => x.trim())
      .filter(Boolean);
    if (related.some((x) => !records.some((rec) => rec.id === x)))
      fail(
        "Evidence",
        row,
        "related_ids must name records in the current reviewed dataset.",
      );
    const record: EvidenceRecord = {
      id,
      revision: operation === "correction" ? base!.revision : 1,
      type: str(r, "record_type") as any,
      title: str(r, "title"),
      culture: {
        id: cultureId,
        name:
          str(r, "culture_name") ||
          known?.name ||
          (cultureId === "unknown" ? "Unknown attribution" : ""),
        kind: (str(r, "culture_kind") ||
          known?.kind ||
          (cultureId === "unknown" ? "unknown" : "")) as any,
        color: str(r, "culture_color") || known?.color || "#9babb5",
      },
      location: place(r, row),
      destination: place(r, row, true),
      routeKind: "schematic",
      time: {
        kind: kind as any,
        start,
        end,
        approximate: bool(r, "approximate", row),
        ...(certainStart !== null ? { certainStart } : {}),
        ...(certainEnd !== null ? { certainEnd } : {}),
        original: str(r, "original_dates"),
        method: str(r, "dating_method"),
        interpretation: str(r, "date_interpretation"),
      },
      claims: associated,
      sources: [...sourceIds].map((x) => refs.get(x)!),
      review: {
        summary: str(r, "summary"),
        limitations: str(r, "limitations"),
        discussion: str(r, "discussion"),
        provenance: str(r, "review_provenance"),
        reviewedAt: reviewDate,
        history: [
          ...(operation === "correction" ? base!.review.history : []),
          "Suggested via bulk workbook; not reviewed.",
        ],
        relatedIds: related,
      },
    };
    if (str(r, "population_json")) {
      try {
        record.population = JSON.parse(str(r, "population_json"));
      } catch {
        throw new Error(
          `Evidence row ${row}: population_json is not valid JSON.`,
        );
      }
    } else if (operation === "correction" && base?.population)
      record.population = structuredClone(base.population);
    if (str(r, "language_json")) {
      try {
        const value = JSON.parse(str(r, "language_json"));
        if (value !== null) record.linguistics = value;
      } catch {
        fail("Evidence", row, "language_json is not valid JSON.");
      }
    } else if (operation === "correction" && base?.linguistics)
      record.linguistics = structuredClone(base.linguistics);
    const overlayRow = overlayRows.get(id);
    if (overlayRow) {
      const o = overlayRow.row;
      let geometry;
      try {
        geometry = JSON.parse(str(o, "geometry_geojson") || "null");
      } catch {
        throw new Error(
          `Overlays row ${overlayRow.index}: geometry_geojson is not valid JSON.`,
        );
      }
      record.overlay = {
        kind: str(o, "overlay_type") as any,
        basis: str(o, "geometry_basis") as any,
        geometry,
        precision: str(o, "geometry_precision"),
        provenance: str(o, "geometry_source"),
        ...(str(o, "reach_radius_km")
          ? { radiusKm: Number(str(o, "reach_radius_km")) }
          : {}),
      };
    }
    const proposal: Proposal = {
      id: stableID(id),
      version: 1,
      kind: operation as any,
      targetId: operation === "correction" ? id : null,
      baseRevision: operation === "correction" ? baseRevision : null,
      baseRecord: operation === "correction" ? structuredClone(base!) : null,
      record,
      rationale: str(r, "rationale"),
      state: (str(r, "proposal_state") || "draft") as any,
      createdAt: now,
      updatedAt: now,
    };
    const errors = validateProposal(proposal);
    if (errors.length) fail("Evidence", row, errors.join(" "));
    return proposal;
  });
  return parsePackage(JSON.stringify(makePackage(proposals)));
}

export function tablesToPackage(
  tables: BulkTables,
  records: EvidenceRecord[],
  now = new Date().toISOString(),
): SharePackage {
  try {
    return buildPackage(tables, records, now);
  } catch (error) {
    if (error instanceof Error)
      error.message = error.message.replace(
        /Evidence row (\d+):/g,
        (text, row) =>
          Number(row) > tables.Evidence.length + 1
            ? `Overlays row ${Number(row) - tables.Evidence.length}:`
            : text,
      );
    throw error;
  }
}
