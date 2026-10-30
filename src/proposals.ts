import type { EvidenceRecord, Proposal, SharePackage } from "./model";
import { validateRecord } from "./validation";
// Correction exports preserve both the original and proposed record. Keep this
// finite byte budget separate from spreadsheet ZIP/row limits and schema checks.
export const MAX_PACKAGE_BYTES = 32_000_000;
export const MAX_PROPOSALS = 5000;
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonical((value as any)[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
function proposalContent(p: Proposal): string {
  if (!p.id.startsWith("bulk-")) return canonical(p);
  const { createdAt, updatedAt, ...content } = p;
  return canonical(content);
}
export function validateProposal(p: Proposal): string[] {
  if (!p || typeof p !== "object") return ["Invalid proposal."];
  const e: string[] = [];
  if (
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/.test(p.id) ||
    typeof p.id !== "string" ||
    !Number.isSafeInteger(p.version) ||
    p.version < 1
  )
    e.push("Invalid proposal identity/version.");
  if (
    !["new", "correction"].includes(p.kind) ||
    !["draft", "ready"].includes(p.state)
  )
    e.push("Invalid proposal kind/state.");
  if (
    typeof p.rationale !== "string" ||
    p.rationale.length > 100_000 ||
    (p.state === "ready" && !p.rationale.trim())
  )
    e.push("A rationale is required.");
  for (const d of [p.createdAt, p.updatedAt])
    if (typeof d !== "string" || !Number.isFinite(Date.parse(d)))
      e.push("Invalid proposal timestamp.");
  e.push(...validateRecord(p.record, p.state === "ready"));
  if (p.kind === "correction") {
    if (
      typeof p.targetId !== "string" ||
      !Number.isSafeInteger(p.baseRevision) ||
      p.baseRevision! < 1 ||
      p.record?.id !== p.targetId
    )
      e.push("Correction target and base revision are required.");
    if (
      !p.baseRecord ||
      p.baseRecord.id !== p.targetId ||
      p.baseRecord.revision !== p.baseRevision
    )
      e.push("Original record must be preserved.");
    else e.push(...validateRecord(p.baseRecord).map((x) => "Original: " + x));
  } else if (
    p.kind === "new" &&
    (p.targetId !== null || p.baseRevision !== null || p.baseRecord !== null)
  )
    e.push("New rows must not claim an existing base record.");
  return e;
}
export function makePackage(proposals: Proposal[]): SharePackage {
  return {
    format: "americas-peoples-proposals",
    schemaVersion: proposals.some(
      (p) => p.record.overlay || p.baseRecord?.overlay || p.record.linguistics || p.baseRecord?.linguistics,
    )
      ? 2
      : 1,
    exportedAt: new Date().toISOString(),
    proposals: structuredClone(proposals),
  };
}
export function parsePackage(raw: string): SharePackage {
  if (new TextEncoder().encode(raw).length > MAX_PACKAGE_BYTES)
    throw new Error(
      `Package exceeds the ${MAX_PACKAGE_BYTES / 1_000_000} MB limit. Export fewer rows at a time.`,
    );
  let p: SharePackage;
  try {
    p = JSON.parse(raw, (key, value) => {
      if (["__proto__", "constructor", "prototype"].includes(key))
        throw new Error("Unsafe key");
      return value;
    });
  } catch {
    throw new Error("The file is not valid, safe JSON.");
  }
  if (
    !p ||
    p.format !== "americas-peoples-proposals" ||
    ![1, 2].includes(p.schemaVersion) ||
    !Array.isArray(p.proposals) ||
    p.proposals.length > MAX_PROPOSALS
  )
    throw new Error(
      `Unsupported proposal format, version, or more than ${MAX_PROPOSALS} proposals.`,
    );
  if (
    p.schemaVersion === 1 &&
    p.proposals.some(
      (x) =>
        x?.record?.overlay !== undefined ||
        x?.baseRecord?.overlay !== undefined ||
        x?.record?.linguistics !== undefined ||
        x?.baseRecord?.linguistics !== undefined,
    )
  )
    throw new Error("Overlays and linguistic metadata require proposal schema version 2.");
  const errors = p.proposals.flatMap((x, i) =>
    validateProposal(x).map((e) => `Row ${i + 1}: ${e}`),
  );
  if (errors.length) throw new Error(errors.slice(0, 8).join("\n"));
  return p;
}
export function inspectImport(
  incoming: Proposal[],
  existing: Proposal[],
  records: EvidenceRecord[],
): {
  proposal: Proposal;
  status: "new" | "duplicate" | "conflict";
  reason: string;
}[] {
  // Preserve first-match semantics while encoding each proposal only once.
  const contents = new Set(existing.map(proposalContent));
  const identities = new Set(existing.map(p => `${p.id}|${p.version}`));
  const reviewed = new Map<string, EvidenceRecord>();
  const cultures = new Map<string, string>();
  for (const r of records) {
    if (!reviewed.has(r.id)) reviewed.set(r.id, r);
    if (!cultures.has(r.culture.id)) cultures.set(r.culture.id, canonical(r.culture));
  }
  for (const p of existing)
    if (!cultures.has(p.record.culture.id))
      cultures.set(p.record.culture.id, canonical(p.record.culture));
  const originals = new Map<string, string>();
  return incoming.map((p) => {
    const content = proposalContent(p);
    const identity = `${p.id}|${p.version}`;
    let status: "new" | "duplicate" | "conflict" = "new",
      reason = "New local proposal; not reviewed evidence.";
    if (contents.has(content)) {
      status = "duplicate";
      reason = "An identical proposal is already in your collection.";
    } else if (identities.has(identity)) {
      status = "conflict";
      reason =
        "Same proposal ID/version with different content; both copies will be kept.";
    } else if (p.kind === "correction") {
      const base = reviewed.get(p.targetId!);
      if (base && !originals.has(base.id)) originals.set(base.id, canonical(base));
      if (
        !base ||
        base.revision !== p.baseRevision ||
        originals.get(base.id) !== canonical(p.baseRecord)
      ) {
        status = "conflict";
        reason =
          "The original differs from this dataset or is missing. Review the preserved original before using this proposal.";
      }
    } else if (reviewed.has(p.record.id)) {
      status = "conflict";
      reason = "New record ID already exists in the reviewed dataset.";
    }
    if (status === "new") {
      const culture = cultures.get(p.record.culture.id);
      if (culture !== undefined && culture !== canonical(p.record.culture)) {
        status = "conflict";
        reason =
          "Culture metadata differs from an existing dataset or proposal category. Preview retains the existing category color; review the proposed classification.";
      }
    }
    contents.add(content);
    identities.add(identity);
    if (!cultures.has(p.record.culture.id))
      cultures.set(p.record.culture.id, canonical(p.record.culture));
    return { proposal: p, status, reason };
  });
}
/** Preflight a complete local collection before committing editor/import state. */
export function validateCollection(proposals: Proposal[]): void {
  if (proposals.length > MAX_PROPOSALS)
    throw new Error(`A local collection can contain at most ${MAX_PROPOSALS} proposals. Export a selection before adding more.`);
  parsePackage(JSON.stringify(makePackage(proposals)));
}
export function mergeImport(
  incoming: Proposal[],
  existing: Proposal[],
): Proposal[] {
  const result = structuredClone(existing);
  const keys = new Set(result.map(proposalContent));
  for (const p of incoming) {
    const key = proposalContent(p);
    if (!keys.has(key)) {
      result.push(structuredClone(p));
      keys.add(key);
    }
  }
  validateCollection(result);
  return result;
}
