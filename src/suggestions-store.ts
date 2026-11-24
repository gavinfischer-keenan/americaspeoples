/**
 * The visitor's local suggestions workspace: proposals kept in browser storage,
 * a pending import awaiting review, and cross-tab synchronisation.
 *
 * Browser storage is a convenience, never the authoritative copy: visitors are
 * told to download their suggestions. Two rules protect their work:
 *  - a stored collection this version cannot read is never overwritten (its
 *    bytes are kept under a backup key), and
 *  - saves from another tab are adopted, so this tab cannot silently discard them.
 */
import { makePackage, parsePackage } from './proposals';
import type { Proposal, SharePackage } from './model';
import { encodeLocalCollection, decodeLocalCollection } from './local-storage';

export const STORE_KEY = 'americas-peoples-proposals-v1';
const UNREADABLE_BACKUP_KEY = `${STORE_KEY}-unreadable-backup`;

export const suggestions = {
  proposals: [] as Proposal[],
  /** A parsed import file waiting for the visitor to confirm on #import. */
  pending: null as SharePackage | null,
  /** Bumped on every change so cached record views can invalidate. */
  revision: 0,
  storageAvailable: true,
  /** An earlier stored collection could not be read and was preserved. */
  unreadableCollectionKept: false,
};

/** Read the stored collection once at startup. */
export function loadSuggestions(): void {
  try {
    localStorage.setItem('ap-storage-check', '1');
    localStorage.removeItem('ap-storage-check');
  } catch {
    suggestions.storageAvailable = false;
    return;
  }
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) suggestions.proposals = parsePackage(decodeLocalCollection(saved)).proposals;
  } catch {
    // A collection that no longer validates (for example after a release
    // tightens record rules) must never be overwritten by the next save. Keep
    // the original bytes under a separate key before anything writes STORE_KEY.
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved && !localStorage.getItem(UNREADABLE_BACKUP_KEY))
        localStorage.setItem(UNREADABLE_BACKUP_KEY, saved);
      suggestions.unreadableCollectionKept = true;
    } catch {
      suggestions.storageAvailable = false;
    }
  }
}

/** Persist the current proposals. Returns false if storage failed. */
export function saveSuggestions(): boolean {
  suggestions.revision++;
  try {
    const text = JSON.stringify(makePackage(suggestions.proposals));
    parsePackage(text);
    localStorage.setItem(STORE_KEY, encodeLocalCollection(text));
    return true;
  } catch {
    suggestions.storageAvailable = false;
    return false;
  }
}

/** Adopt collections saved by other tabs. Returns an unsubscribe function. */
export function watchOtherTabs(onChange: () => void): () => void {
  const listener = (event: StorageEvent) => {
    if (event.key !== STORE_KEY || event.newValue == null) return;
    try {
      suggestions.proposals = parsePackage(decodeLocalCollection(event.newValue)).proposals;
      suggestions.revision++;
      onChange();
    } catch {
      /* Ignore an unreadable collection written by another version. */
    }
  };
  window.addEventListener('storage', listener);
  return () => window.removeEventListener('storage', listener);
}
