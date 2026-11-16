import regionalGap from '../data/regional-gap-expansion-records.json';
import worldGap from '../data/world-gap-expansion-records.json';
import remainingContext from '../data/remaining-topic-context-records.json';
import remainingEvidence from '../data/remaining-topic-evidence-records.json';
import australasiaArchaeology from '../data/australasia-archaeology-expansion-records.json';
import sovereigntyTopics from '../data/sovereignty-topic-evidence-records.json';
import sovereigntyContext from '../data/sovereignty-topic-context-records.json';
import communityTopics from '../data/community-topic-evidence-records.json';
import communityContext from '../data/community-topic-context-records.json';
import pacificTopics from '../data/pacific-topic-evidence-records.json';
import pacificTopicContext from '../data/pacific-topic-context-records.json';
import starter from "../data/evidence.json";
import history from "../data/history-records.json";
import research from "../data/research-proposals.json";
import settlements from '../data/settlement-expansion-records.json';
import missions from '../data/mission-expansion-records.json';
import pacific from '../data/pacific-expansion-records.json';
import violence from '../data/violence-expansion-records.json';
import voyages from '../data/voyage-expansion-records.json';
import transport from '../data/transport-expansion-records.json';
import atlantic from '../data/atlantic-expansion-records.json';
import localPlaces from '../data/local-places-expansion-records.json';
import sharedContext from '../data/shared-context-expansion-records.json';
import hawaiiLocal from '../data/hawaii-local-expansion-records.json';
import cities from '../data/city-expansion-records.json';
import conflicts from '../data/conflict-expansion-records.json';
import northern from '../data/northern-expansion-records.json';
import topicEvidence from '../data/topic-evidence-records.json';
import { version as appVersion } from "../package.json";
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
    license: 'Original educational content and copyrightable curated data: CC BY-NC-SA 4.0. Software: PolyForm Noncommercial 1.0.0. Third-party components retain their own terms; public-domain facts and materials remain unrestricted. See LICENSE.md and THIRD_PARTY.md. Free noncommercial educational project.',
    records,
    coverage: `${records.length} source-linked records are included by default. Coverage is selected, not comprehensive. Active evidence follows supported dates; earlier places and loss records remain labeled as history; unmapped records remain available in the evidence index.`,
  };
  const errors = validateDataset(result);
  if (errors.length) throw new Error(errors.join("\n"));
  return result;
}
export const dataset = publishedDataset(
  starter as Dataset,
  [
    ...research.proposals.map((p) => p.record),
    ...regionalGap.records,
    ...history.records,
    ...settlements.records,
    ...missions.records,
    ...pacific.records,
    ...violence.records,
    ...voyages.records,
    ...transport.records,
    ...atlantic.records,
    ...localPlaces.records,
    ...hawaiiLocal.records, ...sharedContext.records,
    ...remainingContext.records, ...remainingEvidence.records, ...worldGap.records, ...australasiaArchaeology.records, ...sovereigntyTopics.records, ...sovereigntyContext.records, ...communityTopics.records, ...communityContext.records, ...pacificTopics.records, ...pacificTopicContext.records, ...cities.records, ...conflicts.records, ...northern.records, ...topicEvidence.records,
  ] as EvidenceRecord[],
);
