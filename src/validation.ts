import { validateOverlay } from "./overlays";
import { validatePopulation } from "./population";
import type { Dataset, EvidenceRecord } from "./model";
import { validateCitation } from "./citations";
import { END_YEAR } from "./time";
export function safeURL(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    const u = new URL(value);
    return (
      ["http:", "https:"].includes(u.protocol) && !u.username && !u.password
    );
  } catch {
    return false;
  }
}
const object = (x: any) =>
  x !== null && typeof x === "object" && !Array.isArray(x);
const text = (x: any) => typeof x === "string" && x.length <= 100_000;
const id = (x: any) =>
  typeof x === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/.test(x);
const year = (x: any) =>
  Number.isSafeInteger(x) && x >= -1_000_000 && x <= END_YEAR;
export function validateRecord(value: unknown, complete = true): string[] {
  const errors: string[] = [];
  const add = (s: string) => errors.push(s);
  const r = value as EvidenceRecord;
  if (!object(r)) return ["Record must be an object."];
  errors.push(...validatePopulation(r));
  if (r.overlay !== undefined) {
    errors.push(...validateOverlay(r.overlay));
    if (r.type !== "event")
      add("Overlay records must use event type, not occupation or migration.");
  }
  if (!id(r.id))
    add("Record ID must use letters, digits, dots, underscores or hyphens.");
  if (!Number.isSafeInteger(r.revision) || r.revision < 1)
    add("Revision must be a positive integer.");
  if (!["occupation", "occurrence", "movement", "event"].includes(r.type))
    add("Unknown record type.");
  if (!text(r.title) || (complete && !r.title.trim()))
    add("A title is required.");
  if (
    !object(r.culture) ||
    !id(r.culture.id) ||
    !text(r.culture.name) ||
    !r.culture.name.trim() ||
    !/^#[0-9a-f]{6}$/i.test(r.culture.color) ||
    !["culture", "people", "unknown"].includes(r.culture.kind)
  )
    add("Culture needs a valid ID, label, type and hex color.");
  for (const key of ["location", "destination"] as const) {
    const p = r[key];
    if (p !== null) {
      if (
        !object(p) ||
        !id(p.id) ||
        !text(p.name) ||
        !Number.isFinite(p.lon) ||
        Math.abs(p.lon) > 180 ||
        !Number.isFinite(p.lat) ||
        Math.abs(p.lat) > 90 ||
        !text(p.precision) ||
        !text(p.provenance)
      )
        add(`${key}: invalid coordinates or missing metadata.`);
      else if (
        complete &&
        (!p.name.trim() || !p.precision.trim() || !p.provenance.trim())
      )
        add(`${key}: name, precision and provenance are required.`);
    }
  }
  if (r.routeKind !== "schematic")
    add(
      "This version supports schematic endpoint connections only; routeKind must be schematic.",
    );
  if (complete && r.type === "movement" && (!r.location || !r.destination))
    add("Movement requires a supported origin and destination.");
  const t = r.time;
  if (!object(t) || !["interval", "occurrence", "unplaced"].includes(t.kind))
    add("Invalid time definition.");
  else {
    if (
      !["original", "method", "interpretation"].every(
        (k) => text((t as any)[k]) && (!complete || (t as any)[k].trim()),
      )
    )
      add("Original dating, method and interpretation are required.");
    if (t.approximate !== undefined && typeof t.approximate !== "boolean")
      add("Approximate flag must be boolean.");
    if (t.kind === "unplaced") {
      if (t.start !== null || t.end !== null)
        add("Unplaced records must have null dates.");
    } else if (!year(t.start) || !year(t.end) || t.start! > t.end!)
      add(
        `Dates must be ordered whole astronomical years, at or before ${END_YEAR}.`,
      );
    if (t.certainStart !== undefined || t.certainEnd !== undefined) {
      if (
        t.kind !== "interval" ||
        !year(t.certainStart) ||
        !year(t.certainEnd) ||
        t.certainStart! > t.certainEnd! ||
        t.certainStart! < t.start! ||
        t.certainEnd! > t.end!
      )
        add(
          "Certain bounds must be a complete interval inside the possible interval.",
        );
    }
  }
  if (!Array.isArray(r.sources) || r.sources.length > 100)
    add("Sources must be an array of at most 100 entries.");
  else {
    const ids = new Set();
    for (const s of r.sources) {
      if (!object(s) || !id(s.id) || ids.has(s.id)) {
        add("Invalid or duplicate source ID.");
        continue;
      }
      ids.add(s.id);
      errors.push(...validateCitation(s, complete));
      if (
        !["authors", "title", "venue", "url", "access"].every((k) =>
          text((s as any)[k]),
        )
      )
        add("Invalid source metadata.");
      else if (
        complete &&
        (!s.authors.trim() ||
          !s.title.trim() ||
          !s.venue.trim() ||
          !s.access.trim())
      )
        add("Source needs authors, title, venue and access notes.");
      if (
        s.year !== null &&
        (!Number.isSafeInteger(s.year) || s.year < 1 || s.year > 9999)
      )
        add("Invalid publication year.");
      if (s.url !== "" || complete) {
        if (!safeURL(s.url)) add("Source links must be http or https URLs.");
      }
    }
    if (complete && !r.sources.length)
      add("At least one supporting source is required.");
  }
  if (!Array.isArray(r.claims) || r.claims.length > 100)
    add("Claims must be an array of at most 100 entries.");
  else {
    const ids = new Set();
    for (const c of r.claims) {
      if (
        !object(c) ||
        !id(c.id) ||
        ids.has(c.id) ||
        !text(c.text) ||
        !text(c.explanation) ||
        !["well-supported", "under discussion", "disputed"].includes(c.status)
      ) {
        add("Invalid claim metadata.");
        continue;
      }
      ids.add(c.id);
      if (complete && (!c.text.trim() || !c.explanation.trim()))
        add("Claims require text and editorial explanation.");
      if (!Array.isArray(c.support) || c.support.length > 100) {
        add("Invalid claim support.");
        continue;
      }
      if (complete && !c.support.length)
        add("Every claim needs source support.");
      for (const s of c.support) {
        if (
          !object(s) ||
          !id(s.sourceId) ||
          !["supports", "challenges", "context"].includes(s.stance) ||
          !text(s.locator) ||
          !text(s.note)
        )
          add("Invalid source mapping.");
        else if (
          complete &&
          (!r.sources?.some((x) => x.id === s.sourceId) ||
            !s.locator.trim() ||
            !s.note.trim())
        )
          add(
            "Claim references a missing source or lacks a source locator/interpretation.",
          );
      }
    }
    if (complete && !r.claims.length)
      add("At least one sourced claim is required.");
  }
  const v = r.review;
  if (!object(v)) add("A detailed review is required.");
  else {
    for (const k of [
      "summary",
      "limitations",
      "discussion",
      "provenance",
      "reviewedAt",
    ] as const)
      if (!text(v[k]) || (complete && k !== "discussion" && !v[k].trim()))
        add(`Review ${k} is required.`);
    if (
      complete &&
      typeof v.summary === "string" &&
      v.summary.trim().length < 40
    )
      add("Explain the evidence in a substantive review.");
    if (
      complete &&
      r.claims?.some((c) => c.status !== "well-supported") &&
      !v.discussion?.trim()
    )
      add("Disputed claims require a discussion.");
    if (
      !Array.isArray(v.history) ||
      !v.history.every(text) ||
      !Array.isArray(v.relatedIds) ||
      !v.relatedIds.every(id)
    )
      add("Invalid history or related-record IDs.");
  }
  return errors;
}
export function validateDataset(d: Dataset): string[] {
  const errors: string[] = [];
  if (
    d.schemaVersion !== 1 ||
    !text(d.version) ||
    !text(d.coverage) ||
    !text(d.license) ||
    !text(d.reviewedAt) ||
    !Array.isArray(d.records)
  )
    return ["Invalid dataset manifest."];
  const ids = new Set<string>();
  const cultures = new Map<string, string>();
  const sites = new Map<string, string>();
  for (const r of d.records) {
    errors.push(...validateRecord(r).map((e) => `${r.id}: ${e}`));
    if (ids.has(r.id)) errors.push(`Duplicate record ID: ${r.id}`);
    ids.add(r.id);
    if (r.culture) {
      const encoded = JSON.stringify(r.culture);
      if (cultures.has(r.culture.id) && cultures.get(r.culture.id) !== encoded)
        errors.push(`Conflicting culture metadata: ${r.culture.id}`);
      cultures.set(r.culture.id, encoded);
    }
    for (const p of [r.location, r.destination])
      if (p) {
        const encoded = JSON.stringify(p);
        if (sites.has(p.id) && sites.get(p.id) !== encoded)
          errors.push(`Conflicting site metadata: ${p.id}`);
        sites.set(p.id, encoded);
      }
  }
  for (const r of d.records)
    for (const ref of r.review?.relatedIds ?? [])
      if (!ids.has(ref)) errors.push(`Missing related record: ${ref}`);
  return errors;
}
