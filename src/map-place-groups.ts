import type { DisplayRecord } from './model';

/** Exact shared display anchors only. This groups symbols, never source identities.
 * Regional extents and routes retain their own geometry, even at a shared anchor. */
export function placeKey(r: DisplayRecord): string | null {
  if (r.type === 'movement' || r.history?.kind === 'migration' || r.history?.kind === 'exchange') return null;
  if (r.overlay) {
    if (r.overlay.geometry?.type !== 'Point' || ['regional-evidence','population-history','environment','language','cultural-reach'].includes(r.overlay.kind)) return null;
    return r.overlay.geometry.coordinates.join(',');
  }
  return r.location ? `${r.location.lon},${r.location.lat}` : null;
}
export function placeGroups(records: readonly DisplayRecord[]): Map<string, DisplayRecord[]> {
  const groups=new Map<string,DisplayRecord[]>();
  for(const r of records){const key=placeKey(r);if(key!==null)groups.set(key,[...(groups.get(key)??[]),r]);}
  // Show the event symbol when a battle etc. shares a place; keep every phase in its chooser.
  const rank=(r:DisplayRecord)=>r.overlay?0:r.history?.kind==='wreck'?1:r.history?.kind==='settlement'?2:3;
  for(const rows of groups.values())rows.sort((a,b)=>rank(a)-rank(b));
  return groups;
}
