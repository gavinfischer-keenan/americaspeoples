import type { MapCamera } from './map';

export const ATLAS_RETURN_STORAGE_KEY = 'americas-peoples-return-context-v1';

export interface AtlasReturnContext {
  hash: string;
  year: number;
  selectedIds: string[];
  camera?: MapCamera;
  storyId?: string;
  storySceneIndex?: number;
  pendingRestore?: boolean;
  savedAt: number;
}

export function saveAtlasReturnContext(ctx: Omit<AtlasReturnContext, 'savedAt'>): void {
  try {
    const payload: AtlasReturnContext = { ...ctx, savedAt: Date.now() };
    sessionStorage.setItem(ATLAS_RETURN_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota or private-browsing errors.
  }
}

export function consumeAtlasReturnContext(currentHash: string): AtlasReturnContext | null {
  try {
    const raw = sessionStorage.getItem(ATLAS_RETURN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AtlasReturnContext;
    if (!parsed || !parsed.pendingRestore) return null;
    const baseHash = (parsed.hash || '#movie').split('?')[0];
    if (baseHash !== currentHash) return null;
    sessionStorage.removeItem(ATLAS_RETURN_STORAGE_KEY);
    return parsed;
  } catch {
    return null;
  }
}

export function hydrateGuideReturnLinks(root: ParentNode = document): void {
  try {
    const raw = sessionStorage.getItem(ATLAS_RETURN_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as AtlasReturnContext;
    if (!parsed || typeof parsed.hash !== 'string' || !parsed.hash.startsWith('#')) return;
    for (const link of root.querySelectorAll<HTMLAnchorElement>('[data-atlas-return]')) {
      if (link.dataset.atlasReturnBound) continue;
      link.dataset.atlasReturnBound = '1';
      link.setAttribute('href', '../' + parsed.hash);
      link.addEventListener('click', () => {
        try {
          sessionStorage.setItem(
            ATLAS_RETURN_STORAGE_KEY,
            JSON.stringify({ ...parsed, pendingRestore: true }),
          );
        } catch {
          // Ignore storage errors.
        }
      });
    }
  } catch {
    // Ignore storage errors.
  }
}
