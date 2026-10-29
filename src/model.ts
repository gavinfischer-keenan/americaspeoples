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
export interface EvidenceRecord {
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
export type DisplayRecord = EvidenceRecord & { proposalKey?: string };
