import type { Source } from "./model";
import { REFERENCE_TYPES } from "./bulk-schema";
export const citationFields = [
  "doi",
  "volume",
  "issue",
  "pages",
  "publisher",
  "editors",
  "edition",
  "archive",
  "collection",
  "identifier",
] as const;
export function normalizeDOI(doi: string): string {
  return doi
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "");
}
export function validDOI(doi: string): boolean {
  return /^10\.\d{4,9}\/[^\s<>"?#]+$/i.test(doi);
}
export function validateCitation(s: Source, complete: boolean): string[] {
  const errors: string[] = [];
  for (const key of citationFields)
    if (
      s[key] !== undefined &&
      (typeof s[key] !== "string" || s[key]!.length > 32767)
    )
      errors.push(`Reference ${key} must be text (at most 32767 characters).`);
  if (
    typeof s.doi === "string" &&
    s.doi &&
    (!validDOI(s.doi) || s.doi !== normalizeDOI(s.doi))
  )
    errors.push(
      "DOI must be a bare identifier such as 10.1234/example, without spaces.",
    );
  if (s.referenceType === undefined) return errors; // Legacy v0.1 citations remain valid.
  if (!REFERENCE_TYPES.includes(s.referenceType as any)) {
    errors.push("Unknown reference type.");
    return errors;
  }
  if (!complete) return errors;
  const need = (field: keyof Source) => {
    if (!s[field]) errors.push(`${s.referenceType} requires ${field}.`);
  };
  switch (s.referenceType) {
    case "book":
      need("publisher");
      break;
    case "book-chapter":
      need("publisher");
      need("editors");
      need("pages");
      break;
    case "report":
      if (!s.publisher && !s.identifier)
        errors.push("report requires publisher or identifier.");
      break;
    case "thesis":
      need("publisher");
      break;
    case "archival-document":
      need("archive");
      need("collection");
      need("identifier");
      break;
    case "dataset":
      if (!s.doi && !s.identifier)
        errors.push("dataset requires doi or identifier.");
      break;
  }
  return errors;
}
/** A consistent author-year display; not a claim of full APA/Chicago/CSL compliance. */
export function formatReference(s: Source): string {
  const parts = [
    `${s.authors || "Author not supplied"} (${s.year ?? "n.d."}).`,
    s.title + (s.title.endsWith(".") ? "" : "."),
  ];
  if (s.referenceType === "book-chapter" && s.editors)
    parts.push(
      `In ${s.editors} (eds.), ${s.venue}${s.pages ? `, pp. ${s.pages}` : ""}.`,
    );
  else if (s.referenceType === "archival-document")
    parts.push(
      [
        ...new Set(
          [s.archive, s.collection, s.identifier, s.venue].filter(Boolean),
        ),
      ].join(", ") + ".",
    );
  else {
    let venue = s.venue;
    if (s.volume) venue += `, ${s.volume}${s.issue ? `(${s.issue})` : ""}`;
    else if (s.issue) venue += `, issue ${s.issue}`;
    if (s.pages) venue += `, ${s.pages}`;
    if (venue) parts.push(venue + ".");
  }
  if (s.edition)
    parts.push(
      s.referenceType === "dataset" ? `${s.edition}.` : `${s.edition} edition.`,
    );
  if (s.publisher && s.publisher !== s.venue) parts.push(s.publisher + ".");
  if (s.identifier && s.referenceType !== "archival-document")
    parts.push(`Identifier: ${s.identifier}.`);
  if (s.doi) parts.push(`DOI: ${s.doi}`);
  return parts.join(" ");
}
