import catalog from '../data/guide-connections.json';

export interface GuideConnection { kind:'guide'|'topic'; id:string; reason:string; }
export type GuideConnections = Record<string, GuideConnection[]>;
export const guideConnections = catalog.connections as GuideConnections;

/** The same editorial connection is discoverable from either end. */
export function guidesLinkedToTopic(topicId:string, connections:GuideConnections=guideConnections):[string,string][] {
  return Object.entries(connections).flatMap(([guideId,links]) => {
    const link=links.find(link=>link.kind==='topic'&&link.id===topicId);
    return link?[[guideId,link.reason] as [string,string]]:[];
  });
}
