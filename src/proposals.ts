import type { EvidenceRecord, Proposal, SharePackage } from "./model";
import { validateRecord } from "./validation";
export const MAX_PACKAGE_BYTES = 8_000_000;
export const MAX_PROPOSALS = 1000;
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
      "Package exceeds the 8 MB limit. Export fewer rows at a time.",
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
  const seen = [...existing];
  return incoming.map((p) => {
    let status: "new" | "duplicate" | "conflict" = "new",
      reason = "New local proposal; not reviewed evidence.";
    if (seen.some((x) => proposalContent(x) === proposalContent(p))) {
      status = "duplicate";
      reason = "An identical proposal is already in your collection.";
    } else if (seen.some((x) => x.id === p.id && x.version === p.version)) {
      status = "conflict";
      reason =
        "Same proposal ID/version with different content; both copies will be kept.";
    } else if (p.kind === "correction") {
      const base = records.find((r) => r.id === p.targetId);
      if (
        !base ||
        base.revision !== p.baseRevision ||
        canonical(base) !== canonical(p.baseRecord)
      ) {
        status = "conflict";
        reason =
          "The original differs from this dataset or is missing. Review the preserved original before using this proposal.";
      }
    } else if (records.some((r) => r.id === p.record.id)) {
      status = "conflict";
      reason = "New record ID already exists in the reviewed dataset.";
    }
    if (status === "new") {
      const culture =
        records.find((r) => r.culture.id === p.record.culture.id)?.culture ??
        seen.find((x) => x.record.culture.id === p.record.culture.id)?.record
          .culture;
      if (culture && canonical(culture) !== canonical(p.record.culture)) {
        status = "conflict";
        reason =
          "Culture metadata differs from an existing dataset or proposal category. Preview retains the existing category color; review the proposed classification.";
      }
    }
    seen.push(p);
    return { proposal: p, status, reason };
  });
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
  return result;
}
