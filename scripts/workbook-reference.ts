import { createHash } from 'node:crypto';

/** Workbook references are global, while published citation IDs are record-scoped. */
export function workbookReferenceId(recordId: string, sourceId: string): string {
  const scoped = recordId + '--' + sourceId;
  return scoped.length <= 120 ? scoped : 'ref-' + createHash('sha256').update(scoped).digest('hex');
}
