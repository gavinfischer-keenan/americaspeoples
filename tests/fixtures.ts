import type { EvidenceRecord, Proposal } from "../src/model";
export const fixture = (): EvidenceRecord => ({
  id: "test-site-episode",
  revision: 1,
  type: "occupation",
  title: "Synthetic test episode",
  culture: {
    id: "unknown",
    name: "Unknown attribution",
    kind: "unknown",
    color: "#9babb5",
  },
  location: {
    id: "test-site",
    name: "Synthetic location",
    lon: -100,
    lat: 40,
    precision: "Synthetic test only",
    provenance: "Test fixture",
  },
  destination: null,
  routeKind: "schematic",
  time: {
    kind: "interval",
    start: 100,
    end: 200,
    original: "100–200 CE (synthetic)",
    method: "Test fixture",
    interpretation: "Inclusive synthetic occupation interval.",
  },
  claims: [
    {
      id: "occupation",
      text: "Synthetic occupation for tests only.",
      status: "well-supported",
      explanation: "Synthetic test assertion.",
      support: [
        {
          sourceId: "synthetic",
          locator: "Test fixture",
          stance: "supports",
          note: "Not real evidence.",
        },
      ],
    },
  ],
  sources: [
    {
      id: "synthetic",
      authors: "Test author",
      title: "Synthetic fixture, not research",
      year: 2026,
      venue: "Test suite",
      url: "https://example.org/synthetic",
      access: "Synthetic test only",
    },
  ],
  review: {
    summary:
      "Synthetic explanation long enough for validation; not scholarly evidence.",
    limitations: "This is a test fixture only.",
    discussion: "No genuine historical claims are made.",
    provenance: "Synthetic fixture",
    reviewedAt: "2026-10-28",
    history: ["Created for tests"],
    relatedIds: [],
  },
});
export const proposal = (): Proposal => ({
  id: "proposal-test",
  version: 1,
  kind: "correction",
  targetId: "test-site-episode",
  baseRevision: 1,
  baseRecord: fixture(),
  record: { ...fixture(), title: "A proposed correction" },
  rationale: "Test correction rationale",
  state: "ready",
  createdAt: "2026-10-28T12:00:00Z",
  updatedAt: "2026-10-28T12:00:00Z",
});
