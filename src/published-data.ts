import starter from "../data/evidence.json";
import research from "../data/research-proposals.json";
import { version as appVersion } from '../package.json';
import type { Dataset, EvidenceRecord } from "./model";
import { validateDataset } from "./validation";

// Author-supplied research is published by default. Visitor drafts remain local.
export function publishedDataset(
  base: Dataset,
  additions: EvidenceRecord[],
): Dataset {
  const records = [...base.records, ...additions];
  const result = {
    ...base,
    version: appVersion,
    records,
    coverage: `${records.length} source-linked records are included by default. Coverage is selected, not comprehensive. Records appear on the map at their supported dates; unmapped records remain available in the evidence index.`,
  };
  const errors = validateDataset(result);
  if (errors.length) throw new Error(errors.join("\n"));
  return result;
}
export const dataset = publishedDataset(
  starter as Dataset,
  research.proposals.map((p) => p.record) as EvidenceRecord[],
);
