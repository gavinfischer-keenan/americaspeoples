export type ScholarlyStatus =
  | "well-supported"
  | "under discussion"
  | "disputed";
export interface Culture {
  id: string;
  name: string;
  kind: "culture" | "people" | "unknown";
  color: string;
}
export interface Place {
  id: string;
  name: string;
  lon: number;
  lat: number;
  precision: string;
  provenance: string;
}
export interface TimeExtent {
  /** Documented calendar onset, when known; never inferred from a year-only date. */
  eventDate?: string;
  kind: "interval" | "occurrence" | "unplaced";
  start: number | null;
  end: number | null;
  approximate?: boolean;
  certainStart?: number;
  certainEnd?: number;
  original: string;
  method: string;
  interpretation: string;
}
export interface Source {
  id: string;
  authors: string;
  title: string;
  year: number | null;
  venue: string;
  url: string;
  access: string;
  referenceType?: string;
  doi?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
  editors?: string;
  edition?: string;
  archive?: string;
  collection?: string;
  identifier?: string;
}
export interface Support {
  sourceId: string;
  locator: string;
  stance: "supports" | "challenges" | "context";
  note: string;
}
export interface Claim {
  id: string;
  text: string;
  status: ScholarlyStatus;
  explanation: string;
  support: Support[];
}
export interface Review {
  summary: string;
  limitations: string;
  discussion: string;
  provenance: string;
  reviewedAt: string;
  history: string[];
  relatedIds: string[];
}
export interface Overlay {
  /** Transport styling retains the common sourced-connection geometry. */
  networkKind?: "trade" | "road" | "rail";
  direction?: "forward" | "reverse" | "both" | "multidirectional";
  radiusKm?: number;
  kind:
    | "trade"
    | "conflict"
    | "forced-removal"
    | "epidemic"
    | "violence"
    | "population-history"
    | "regional-evidence"
    | "environment"
    | "cultural-reach"
    | "language";
  basis: "documented" | "schematic" | "unmapped";
  geometry:
    | { type: "Point"; coordinates: [number, number] }
    | { type: "LineString"; coordinates: [number, number][] }
    | null;
  precision: string;
  provenance: string;
}
export interface Linguistics {
  languages: { id: string; name: string; family?: string }[];
  claimId: string;
  scope: string;
  uncertainty: string;
  relationship?: {
    kind: "descent" | "borrowing" | "contact" | "unclassified";
    from: string;
    to: string;
  };
}
export interface HistoryMetadata {
  kind: "settlement" | "habitation" | "migration" | "exchange" | "wreck" | "visit" | "attestation";
  claimId: string;
  foundingPower?: string;
  eventDate?: string;
  group?: string;
  endYear?: number;
  endMeaning?: "unknown" | "abandoned" | "relocated";
  continuity?: "ongoing";
  endEvidence?: {
    start: number;
    end: number;
    meaning: "abandoned" | "relocated";
    label?: string;
    certainty: "documented" | "inferred";
    claimId: string;
    note: string;
  };
  connection?: {
    evidence: string;
    lastEvidence: number;
    cessation: "documented" | "inferred" | "unknown" | "ongoing";
    note: string;
    claimId: string;
  };
  /** Route activity periods or disjoint supported dates for an attestation. */
  windows?: {
    start: number;
    end: number;
    certainty: "documented" | "approximate";
    note: string;
  }[];
}
export interface EvidenceRecord {
  history?: HistoryMetadata;
  linguistics?: Linguistics;
  population?: {
    start: number;
    end: number;
    min: number;
    max: number;
    claimId: string;
    scope: string;
  }[];
  overlay?: Overlay;
  id: string;
  revision: number;
  type: "occupation" | "occurrence" | "movement" | "event";
  title: string;
  culture: Culture;
  location: Place | null;
  destination: Place | null;
  routeKind: "schematic";
  time: TimeExtent;
  claims: Claim[];
  sources: Source[];
  review: Review;
}
export interface Dataset {
  schemaVersion: 1;
  version: string;
  reviewedAt: string;
  coverage: string;
  license: string;
  records: EvidenceRecord[];
}
export interface Proposal {
  id: string;
  version: number;
  kind: "new" | "correction";
  targetId: string | null;
  baseRevision: number | null;
  baseRecord: EvidenceRecord | null;
  record: EvidenceRecord;
  rationale: string;
  state: "draft" | "ready";
  createdAt: string;
  updatedAt: string;
}
export interface SharePackage {
  format: "americas-peoples-proposals";
  schemaVersion: 1 | 2;
  exportedAt: string;
  proposals: Proposal[];
}
/** Catalog rows lack source/support detail. Full review/edit/export must load it. */
export type CatalogRecord = Omit<
  EvidenceRecord,
  "claims" | "sources" | "review"
> & {
  detailLevel: "catalog";
  claims: Pick<Claim, "id" | "text" | "status">[];
  review: Pick<Review, "summary" | "limitations" | "reviewedAt" | "relatedIds">;
};
export type MapRecord = EvidenceRecord | CatalogRecord;
export type DisplayRecord = MapRecord & { proposalKey?: string };
export type FullDisplayRecord = EvidenceRecord & { proposalKey?: string };
